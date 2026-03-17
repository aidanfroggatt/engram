package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"

	"engram/api/config"
	"engram/api/ent"
	"engram/api/middleware"
)

// Request/Response Structs for JSON
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

type UploadServer struct {
	presignClient *s3.PresignClient
	bucketName    string
	db            *ent.Client
}

func NewUploadServer(cfg *config.Config, db *ent.Client) (*UploadServer, error) {
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

	return &UploadServer{
		presignClient: s3.NewPresignClient(client),
		bucketName:    cfg.B2BucketName,
		db:            db,
	}, nil
}

// 1. Get the B2 ticket (JSON Handler)
func (s *UploadServer) HandleGetUploadURL(w http.ResponseWriter, r *http.Request) {
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

// 2. Commit the metadata to Neon (JSON Handler)
func (s *UploadServer) HandleCommitMedia(w http.ResponseWriter, r *http.Request) {
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

	// Use Ent to save to Neon
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