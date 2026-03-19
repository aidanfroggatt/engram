package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"mime"
	"os"
	"path/filepath"
	"regexp"
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

	// Ensure your postgres driver is loaded
	_ "github.com/lib/pq"
)

// --- Configuration Constants ---
const (
	TargetUserID   = "YOUR_CLERK_USER_ID" // TODO: Replace with your actual Clerk ID
	ExportBasePath = "./scripts/ig_migrate/ig_data/media" // Pointing directly to the media folder
	CompletedLog   = "./scripts/ig_migrate/completed.json"
)

// Allowed media extensions to prevent uploading random IG system files
var allowedExtensions = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".webp": true,
	".mp4": true, ".mov": true,
}

func main() {
	// 1. Load Configuration
	cfg := config.Load()
	fmt.Println("Initializing File-System Migration Engine...")

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

	// 5. Define target directories to scan
	targetDirs := []string{
		filepath.Join(ExportBasePath, "posts"),
		filepath.Join(ExportBasePath, "archived_posts"),
	}

	successCount := 0
	ctx := context.Background()

	// Regex to match folders like "202208"
	dateFolderRegex := regexp.MustCompile(`^(\d{4})(\d{2})$`)

	// 6. Execute Recursive Directory Walk
	for _, targetDir := range targetDirs {
		err = filepath.WalkDir(targetDir, func(path string, d os.DirEntry, err error) error {
			if err != nil {
				return nil // Skip unreadable paths
			}
			if d.IsDir() {
				return nil // Skip directories themselves
			}

			ext := strings.ToLower(filepath.Ext(path))
			if !allowedExtensions[ext] {
				return nil // Skip non-media files
			}

			// Generate a consistent relative URI for the resumability map
			relPath, _ := filepath.Rel(ExportBasePath, path)
			if completed[relPath] {
				return nil // Skip if already vaulted
			}

			// --- Extract Date from Folder Name ---
			// Instagram puts files in folders like "202208". We grab the parent folder name.
			parentFolder := filepath.Base(filepath.Dir(path))
			
			var captureTime time.Time
			matches := dateFolderRegex.FindStringSubmatch(parentFolder)
			
			if len(matches) == 3 {
				year, _ := strconv.Atoi(matches[1])
				month, _ := strconv.Atoi(matches[2])
				// Default to the 15th of the month at 12:00 PM so they sort cleanly
				captureTime = time.Date(year, time.Month(month), 15, 12, 0, 0, 0, time.UTC)
			} else {
				// Fallback if the folder name isn't a date (use file mod time)
				info, _ := d.Info()
				captureTime = info.ModTime()
			}

			// Determine MIME Type
			mimeType := mime.TypeByExtension(ext)
			if mimeType == "" {
				mimeType = "application/octet-stream"
			}

			file, err := os.Open(path)
			if err != nil {
				log.Printf("[WARN] Could not open file: %s\n", path)
				return nil
			}
			defer file.Close()

			// Generate new B2 FileKey
			fileKey := fmt.Sprintf("%s/ig-migration/%s%s", TargetUserID, uuid.New().String(), ext)

			fmt.Printf("Vaulting [%s] %s -> B2... ", captureTime.Format("2006-01"), d.Name())

			// --- A. Upload to B2 ---
			_, err = s3Client.PutObject(ctx, &s3.PutObjectInput{
				Bucket:      aws.String(cfg.B2BucketName),
				Key:         aws.String(fileKey),
				Body:        file,
				ContentType: aws.String(mimeType),
			})

			if err != nil {
				log.Printf("\n[ERROR] B2 Upload failed for %s: %v\n", relPath, err)
				return nil
			}

			// --- B. Commit to Neon DB via Ent ---
			// Note: We don't have lat/lng without the JSON, so we omit those fields.
			_, err = db.MediaAsset.Create().
				SetUserID(TargetUserID).
				SetFileKey(fileKey).
				SetMimeType(mimeType).
				SetCaptureTime(captureTime).
				Save(ctx)

			if err != nil {
				log.Printf("\n[ERROR] DB Commit failed for %s: %v\n", relPath, err)
				return nil
			}

			// --- C. Mark Completed ---
			completed[relPath] = true
			successCount++
			fmt.Println("Success")

			// Save progress frequently
			if successCount%10 == 0 {
				saveProgress(completed)
			}

			return nil
		})

		if err != nil {
			log.Printf("Error walking directory %s: %v", targetDir, err)
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