package handlers

import (
	"context"
	"fmt"
	"strings"
	"time"

	"connectrpc.com/connect"
	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"

	"engram/api/config"
	"engram/api/middleware"
	"engram/api/rpc/upload"
)

type UploadServer struct {
	presignClient *s3.PresignClient
	bucketName    string
}

func NewUploadServer(cfg *config.Config) (*UploadServer, error) {
	// 1. Extract the region from your B2 endpoint (e.g., https://s3.us-east-005.backblazeb2.com)
	// You can also just hardcode this to your specific B2 region string (like "us-east-005")
	region := "us-east-1" // Default fallback
	parts := strings.Split(cfg.B2Endpoint, ".")
	if len(parts) > 1 && strings.HasPrefix(parts[1], "us-") || strings.HasPrefix(parts[1], "eu-") {
		region = parts[1]
	}

	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, reg string, options ...interface{}) (aws.Endpoint, error) {
		return aws.Endpoint{
			URL:               cfg.B2Endpoint,
			HostnameImmutable: true,
			SigningRegion:     region, // Force the signature to match B2
		}, nil
	})

	awsCfg, err := awsconfig.LoadDefaultConfig(context.TODO(),
		awsconfig.WithRegion(region), // Explicitly set region to fix signature mismatches
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(cfg.B2KeyID, cfg.B2AppKey, "")),
		awsconfig.WithEndpointResolverWithOptions(customResolver),
	)
	if err != nil {
		return nil, err
	}

	client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.UsePathStyle = true
	})

	return &UploadServer{
		presignClient: s3.NewPresignClient(client),
		bucketName:    cfg.B2BucketName,
	}, nil
}

// CHANGED: rpc.GetUploadURLRequest is now upload.GetUploadURLRequest
func (s *UploadServer) GetUploadURL(
	ctx context.Context,
	req *connect.Request[upload.GetUploadURLRequest],
) (*connect.Response[upload.GetUploadURLResponse], error) {
	
	userID, ok := ctx.Value(middleware.UserIDKey).(string)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("missing user identity"))
	}

	ext := "bin"
	parts := strings.Split(req.Msg.Filename, ".")
	if len(parts) > 1 {
		ext = parts[len(parts)-1]
	}
	fileKey := fmt.Sprintf("%s/%s.%s", userID, uuid.New().String(), ext)

	presignedReq, err := s.presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucketName),
		Key:         aws.String(fileKey),
		ContentType: aws.String(req.Msg.MimeType),
	}, s3.WithPresignExpires(15*time.Minute))

	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to generate upload url: %v", err))
	}

	res := connect.NewResponse(&upload.GetUploadURLResponse{
		UploadUrl: presignedReq.URL,
		FileKey:   fileKey,
	})

	return res, nil
}