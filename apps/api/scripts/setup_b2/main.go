package main

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"

	"engram/api/config"
)

func main() {
	cfg := config.Load()
	fmt.Println("Initializing B2 CORS Configuration...")

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

	bucketsToSetup := []string{"engram", "engram-dev"}
	ctx := context.Background()

	// Robust CORS Rule for Next.js and Presigned URLs
	corsRule := types.CORSRule{
		AllowedHeaders: []string{"*"},
		AllowedMethods: []string{"GET", "PUT", "POST", "HEAD"},
		AllowedOrigins: []string{"*"},
		ExposeHeaders:  []string{"ETag"},
		MaxAgeSeconds:  aws.Int32(3000),
	}

	for _, bucketName := range bucketsToSetup {
		fmt.Printf("Pushing CORS policy to [%s]... ", bucketName)

		_, err = s3Client.PutBucketCors(ctx, &s3.PutBucketCorsInput{
			Bucket: aws.String(bucketName),
			CORSConfiguration: &types.CORSConfiguration{
				CORSRules: []types.CORSRule{corsRule},
			},
		})

		if err != nil {
			fmt.Printf("FAILED\n [!] Error: %v\n", err)
		} else {
			fmt.Println("SUCCESS")
		}
	}

	fmt.Println("\nConfiguration complete.")
}
