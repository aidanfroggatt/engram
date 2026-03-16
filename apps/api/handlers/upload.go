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
	"engram/api/rpc" // <-- This was the missing link!
)

type UploadServer struct {
	presignClient *s3.PresignClient
	bucketName    string
	demoAccountID string
}

func NewUploadServer(cfg *config.Config) (*UploadServer, error) {
	// Configure the S3 client to point at Backblaze B2
	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		return aws.Endpoint{
			URL:               cfg.B2Endpoint,
			HostnameImmutable: true,
		}, nil
	})

	awsCfg, err := awsconfig.LoadDefaultConfig(context.TODO(),
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
		// TODO: Replace with your actual Clerk Demo Account ID once created
		demoAccountID: "user_demo_account_placeholder",
	}, nil
}

func (s *UploadServer) GetUploadURL(
	ctx context.Context,
	req *connect.Request[rpc.GetUploadURLRequest],
) (*connect.Response[rpc.GetUploadURLResponse], error) {
	
	userID, ok := ctx.Value(middleware.UserIDKey).(string)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("missing user identity"))
	}

	if userID == s.demoAccountID {
		return nil, connect.NewError(connect.CodePermissionDenied, fmt.Errorf("demo account cannot upload files"))
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

	res := connect.NewResponse(&rpc.GetUploadURLResponse{
		UploadUrl: presignedReq.URL,
		FileKey:   fileKey,
	})

	return res, nil
}