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
	TargetUserID   = "CLERK_USER_ID" // TODO: Insert your Clerk ID
	ExportBasePath = "./scripts/ig_migrate/ig_data"
	ManifestPath   = "./scripts/ig_migrate/ig_data/posts_1.json"
	CompletedLog   = "./scripts/ig_migrate/completed.json"
)

// --- JSON Struct Definition ---
// This perfectly maps to the structure of your posts_1.json file
type IGExport []struct {
	Media []struct {
		URI               string `json:"uri"`
		CreationTimestamp int64  `json:"creation_timestamp"`
		MediaMetadata     struct {
			PhotoMetadata struct {
				ExifData []struct {
					Latitude  float64 `json:"latitude"`
					Longitude float64 `json:"longitude"`
				} `json:"exif_data"`
			} `json:"photo_metadata"`
			VideoMetadata struct {
				ExifData []struct {
					Latitude  float64 `json:"latitude"`
					Longitude float64 `json:"longitude"`
				} `json:"exif_data"`
			} `json:"video_metadata"`
		} `json:"media_metadata"`
	} `json:"media"`
}

func main() {
	cfg := config.Load()
	fmt.Println("Initializing JSON-Driven Migration Engine...")

	// 1. Initialize Ent Database Client
	db, err := ent.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to Neon: %v", err)
	}
	defer db.Close()

	// 2. Initialize B2 S3 Client
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

	// 3. Load Resumability State
	completed := make(map[string]bool)
	if data, err := os.ReadFile(CompletedLog); err == nil {
		json.Unmarshal(data, &completed)
	}
	fmt.Printf("Loaded %d previously completed assets.\n", len(completed))

	// 4. Read and Parse the JSON Manifest
	fileData, err := os.ReadFile(ManifestPath)
	if err != nil {
		log.Fatalf("Failed to read JSON manifest at %s: %v", ManifestPath, err)
	}

	var exportData IGExport
	if err := json.Unmarshal(fileData, &exportData); err != nil {
		log.Fatalf("Failed to parse JSON manifest: %v", err)
	}

	successCount := 0
	ctx := context.Background()

	// 5. Iterate through the JSON data
	for _, postGroup := range exportData {
		for _, media := range postGroup.Media {

			// Skip if already processed
			if completed[media.URI] {
				continue
			}

			// Generate exact timestamp
			captureTime := time.Unix(media.CreationTimestamp, 0)

			// Extract precise GPS coordinates (if they exist)
			var lat, lng *float64
			
			// Check Photo Exif
			if len(media.MediaMetadata.PhotoMetadata.ExifData) > 0 {
				exif := media.MediaMetadata.PhotoMetadata.ExifData[0]
				if exif.Latitude != 0 && exif.Longitude != 0 {
					l1, l2 := exif.Latitude, exif.Longitude
					lat, lng = &l1, &l2
				}
			}
			
			// Check Video Exif
			if len(media.MediaMetadata.VideoMetadata.ExifData) > 0 {
				exif := media.MediaMetadata.VideoMetadata.ExifData[0]
				if exif.Latitude != 0 && exif.Longitude != 0 {
					l1, l2 := exif.Latitude, exif.Longitude
					lat, lng = &l1, &l2
				}
			}

			// Find physical file using the URI provided in the JSON
			physicalPath := filepath.Join(ExportBasePath, media.URI)
			
			ext := strings.ToLower(filepath.Ext(physicalPath))
			mimeType := mime.TypeByExtension(ext)
			if mimeType == "" {
				mimeType = "application/octet-stream"
			}

			file, err := os.Open(physicalPath)
			if err != nil {
				// We don't fatal crash here, because sometimes IG JSON lists files that failed to download
				log.Printf("[WARN] Found in JSON but missing on disk: %s\n", physicalPath)
				continue
			}

			// Generate new B2 FileKey
			fileKey := fmt.Sprintf("%s/ig-migration/%s%s", TargetUserID, uuid.New().String(), ext)

			fmt.Printf("Vaulting [%s] -> B2... ", captureTime.Format(time.RFC3339))

			// --- A. Upload to B2 ---
			_, err = s3Client.PutObject(ctx, &s3.PutObjectInput{
				Bucket:      aws.String(cfg.B2BucketName),
				Key:         aws.String(fileKey),
				Body:        file,
				ContentType: aws.String(mimeType),
			})
			file.Close() // Close immediately after upload

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

			// Save progress frequently
			if successCount%25 == 0 {
				saveProgress(completed)
			}
		}
	}

	// Final progress save
	saveProgress(completed)
	fmt.Printf("\nMigration Complete! Successfully vaulted %d new assets with precise metadata.\n", successCount)
}

func saveProgress(completed map[string]bool) {
	data, _ := json.MarshalIndent(completed, "", "  ")
	os.WriteFile(CompletedLog, data, 0644)
}