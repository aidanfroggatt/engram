package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"mime"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"

	"engram/api/config"
	"engram/api/ent"

	_ "github.com/lib/pq"
)

// --- Configuration Constants ---
const (
	TargetUserID   = "YOUR_CLERK_USER_ID" //TODO: Replace with actual Clerk UserID for the target account
	ExportBasePath = "./scripts/ig_migrate/instagram_data"
	JSONFilePath   = "./scripts/ig_migrate/instagram_data/content/posts_1.json"
	CompletedLog   = "./scripts/ig_migrate/completed.json"
)

// --- Instagram Export Types ---
type IGExportItem struct {
	Media []IGMedia `json:"media"`
}

type IGMedia struct {
	URI               string `json:"uri"`
	CreationTimestamp int64  `json:"creation_timestamp"`
	Title             string `json:"title"`
	MediaMetaData     *struct {
		LocationData *struct {
			Latitude  float64 `json:"latitude"`
			Longitude float64 `json:"longitude"`
		} `json:"location_data"`
	} `json:"media_meta_data"`
}

func main() {
	// 1. Load Configuration cleanly using your existing setup
	cfg := config.Load()
	fmt.Println("Initializing Migration Engine...")

	// 2. Initialize Ent Database Client
	db, err := ent.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to Neon: %v", err)
	}
	defer db.Close()

	// 3. Initialize B2 S3 Client
	region := "us-east-1"
	if parts := strings.Split(cfg.B2Endpoint, "."); len(parts) > 1 {
		region = parts[1]
	}
	awsCfg, err := awsconfig.LoadDefaultConfig(context.TODO(),
		awsconfig.WithRegion(region),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(cfg.B2KeyID, cfg.B2AppKey, "")),
	)
	if err != nil {
		log.Fatalf("Failed to load AWS config: %v", err)
	}
	s3Client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(cfg.B2Endpoint)
		o.UsePathStyle = true
	})

	// 4. Load Resumability State
	completed := make(map[string]bool)
	if data, err := os.ReadFile(CompletedLog); err == nil {
		json.Unmarshal(data, &completed)
	}
	fmt.Printf("Loaded %d previously completed assets.\n", len(completed))

	// 5. Read and Parse Instagram JSON
	jsonData, err := os.ReadFile(JSONFilePath)
	if err != nil {
		log.Fatalf("Failed to read IG JSON. Make sure your paths are correct: %v", err)
	}

	var items []IGExportItem
	if err := json.Unmarshal(jsonData, &items); err != nil {
		log.Fatalf("Failed to parse IG JSON: %v", err)
	}

	// 6. Execution Pipeline
	successCount := 0
	ctx := context.Background()

	for _, item := range items {
		for _, media := range item.Media {
			// Skip if already processed
			if completed[media.URI] {
				continue
			}

			physicalPath := filepath.Join(ExportBasePath, media.URI)

			// Check if physical file exists
			file, err := os.Open(physicalPath)
			if err != nil {
				log.Printf("[WARN] Physical file missing for URI: %s\n", media.URI)
				continue
			}

			// Determine MIME Type
			ext := filepath.Ext(physicalPath)
			mimeType := mime.TypeByExtension(ext)
			if mimeType == "" {
				mimeType = "application/octet-stream"
			}

			// Generate new B2 FileKey
			fileKey := fmt.Sprintf("%s/ig-migration/%s%s", TargetUserID, uuid.New().String(), ext)
			
			// Parse Historical Date
			captureTime := time.Unix(media.CreationTimestamp, 0)

			// Extract Location if available
			var lat, lng *float64
			if media.MediaMetaData != nil && media.MediaMetaData.LocationData != nil {
				lLat := media.MediaMetaData.LocationData.Latitude
				lLng := media.MediaMetaData.LocationData.Longitude
				if lLat != 0 && lLng != 0 {
					lat, lng = &lLat, &lLng
				}
			}

			fmt.Printf("Uploading [%s] -> B2... ", captureTime.Format("2006-01-02"))

			// --- A. Upload to B2 ---
			_, err = s3Client.PutObject(ctx, &s3.PutObjectInput{
				Bucket:      aws.String(cfg.B2BucketName),
				Key:         aws.String(fileKey),
				Body:        file,
				ContentType: aws.String(mimeType),
			})
			file.Close()

			if err != nil {
				log.Printf("\n[ERROR] B2 Upload failed for %s: %v\n", media.URI, err)
				continue
			}

			// --- B. Commit to Neon DB via Ent ---
			_, err = db.MediaAsset.Create().
				SetUserID(TargetUserID).
				SetFileKey(fileKey).
				SetMimeType(mimeType).
				SetCaptureTime(captureTime).
				SetNillableLatitude(lat).
				SetNillableLongitude(lng).
				Save(ctx)

			if err != nil {
				log.Printf("\n[ERROR] DB Commit failed for %s: %v\n", media.URI, err)
				continue
			}

			// --- C. Mark Completed ---
			completed[media.URI] = true
			successCount++
			fmt.Println("Success")

			// Save progress every 10 items
			if successCount%10 == 0 {
				saveProgress(completed)
			}
		}
	}

	// Final progress save
	saveProgress(completed)
	fmt.Printf("\nMigration Complete! Successfully vaulted %d new assets.\n", successCount)
}

func saveProgress(completed map[string]bool) {
	data, _ := json.MarshalIndent(completed, "", "  ")
	os.WriteFile(CompletedLog, data, 0644)
}