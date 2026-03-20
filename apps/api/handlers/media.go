package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"

	"engram/api/config"
	"engram/api/ent"
	"engram/api/ent/mediaasset"
	"engram/api/middleware"
)

// --- Request/Response Structs ---

type MediaResponse struct {
	ID          string   `json:"id"`
	FileKey     string   `json:"fileKey"`
	MimeType    string   `json:"mimeType"`
	CaptureTime string   `json:"captureTime"`
	Latitude    *float64 `json:"latitude"`
	Longitude   *float64 `json:"longitude"`
	URL         string   `json:"url"` 
}

type GetUploadURLRequest struct {
	Filename string `json:"filename"`
	MimeType string `json:"mimeType"`
}

type GetUploadURLResponse struct {
	UploadURL string `json:"uploadUrl"`
	FileKey   string `json:"fileKey"`
}

type CommitMediaRequest struct {
	FileKey     string   `json:"fileKey"`
	MimeType    string   `json:"mimeType"`
	CaptureTime string   `json:"captureTime"`
	Latitude    *float64 `json:"latitude"`
	Longitude   *float64 `json:"longitude"`
}

// --- Server Definition ---

type MediaServer struct {
	presignClient *s3.PresignClient
	bucketName    string
	db            *ent.Client
}

func NewMediaServer(cfg *config.Config, db *ent.Client) (*MediaServer, error) {
	region := "us-east-1"
	parts := strings.Split(cfg.B2Endpoint, ".")
	if len(parts) > 1 && (strings.HasPrefix(parts[1], "us-") || strings.HasPrefix(parts[1], "eu-")) {
		region = parts[1]
	}

	awsCfg, err := awsconfig.LoadDefaultConfig(context.TODO(),
		awsconfig.WithRegion(region),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(cfg.B2KeyID, cfg.B2AppKey, "")),
	)
	if err != nil {
		return nil, err
	}

	client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(cfg.B2Endpoint)
		o.UsePathStyle = true
	})

	return &MediaServer{
		presignClient: s3.NewPresignClient(client),
		bucketName:    cfg.B2BucketName,
		db:            db,
	}, nil
}

// --- Handlers ---

// HandleListMedia fetches assets using Cursor-Based Pagination
func (s *MediaServer) HandleListMedia(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, ok := ctx.Value(middleware.UserIDKey).(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// 1. Parse Pagination Parameters
	limitStr := r.URL.Query().Get("limit")
	limit := 50 // Default batch size
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
		limit = l
	}

	cursorStr := r.URL.Query().Get("cursor")

	// 2. Build the Query
	query := s.db.MediaAsset.Query().
		Where(mediaasset.UserIDEQ(userID)).
		Order(ent.Desc(mediaasset.FieldCaptureTime))

	// If a cursor is provided, only get photos older than the cursor
	if cursorStr != "" {
		cursorTime, err := time.Parse(time.RFC3339, cursorStr)
		if err == nil {
			query = query.Where(mediaasset.CaptureTimeLT(cursorTime))
		}
	}

	// 3. Fetch Limit + 1 (To check if there is a next page)
	assets, err := query.Limit(limit + 1).All(ctx)
	if err != nil {
		http.Error(w, "Failed to fetch gallery", http.StatusInternalServerError)
		return
	}

	// 4. Determine the Next Cursor
	var nextCursor string
	if len(assets) > limit {
		// The extra asset's time becomes the cursor for the next page
		nextCursor = assets[limit].CaptureTime.Format(time.RFC3339)
		assets = assets[:limit] // Trim the array back to the requested limit
	}

	// 5. Generate Presigned URLs ONLY for this small batch
	var response []MediaResponse
	for _, asset := range assets {
		presignedReq, err := s.presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
			Bucket: aws.String(s.bucketName),
			Key:    aws.String(asset.FileKey),
		}, s3.WithPresignExpires(1*time.Hour))

		fileURL := ""
		if err == nil {
			fileURL = presignedReq.URL
		}

		response = append(response, MediaResponse{
			ID:          asset.ID.String(),
			FileKey:     asset.FileKey,
			MimeType:    asset.MimeType,
			CaptureTime: asset.CaptureTime.Format(time.RFC3339),
			Latitude:    asset.Latitude,
			Longitude:   asset.Longitude,
			URL:         fileURL,
		})
	}

	if response == nil {
		response = []MediaResponse{}
	}

	// 6. Return the Paginated Wrapper
w.Header().Set("Content-Type", "application/json")
json.NewEncoder(w).Encode(map[string]interface{}{
    "data":       response,
    "nextCursor": nextCursor,
})
}

// HandleGetUploadURL generates a Presigned PUT URL for streaming to B2
func (s *MediaServer) HandleGetUploadURL(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req GetUploadURLRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	ext := "bin"
	if parts := strings.Split(req.Filename, "."); len(parts) > 1 {
		ext = parts[len(parts)-1]
	}
	fileKey := fmt.Sprintf("%s/%s.%s", userID, uuid.New().String(), ext)

	presignedReq, err := s.presignClient.PresignPutObject(r.Context(), &s3.PutObjectInput{
		Bucket:      aws.String(s.bucketName),
		Key:         aws.String(fileKey),
		ContentType: aws.String(req.MimeType),
	}, s3.WithPresignExpires(15*time.Minute))

	if err != nil {
		http.Error(w, "B2 presign error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(GetUploadURLResponse{
		UploadURL: presignedReq.URL,
		FileKey:   fileKey,
	})
}

// HandleCommitMedia saves the metadata to Neon via Ent
func (s *MediaServer) HandleCommitMedia(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CommitMediaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	captureTime, err := time.Parse(time.RFC3339, req.CaptureTime)
	if err != nil {
		captureTime = time.Now()
	}

	asset, err := s.db.MediaAsset.Create().
		SetUserID(userID).
		SetFileKey(req.FileKey).
		SetMimeType(req.MimeType).
		SetCaptureTime(captureTime).
		SetNillableLatitude(req.Latitude).
		SetNillableLongitude(req.Longitude).
		Save(r.Context())

	if err != nil {
		http.Error(w, fmt.Sprintf("DB save failed: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":      asset.ID.String(),
		"success": true,
	})
}