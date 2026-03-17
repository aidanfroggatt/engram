package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL   string
	JWKSURL       string
	B2KeyID       string
	B2AppKey      string
	B2Endpoint    string
	B2BucketName  string
	B2PublicDomain string
}

func Load() *Config {
	// Load .env.local if it exists (for local development)
	_ = godotenv.Load(".env.local")

	cfg := &Config{
		DatabaseURL:  requireEnv("DATABASE_URL"),
		JWKSURL:      requireEnv("JWKS_URL"),
		B2KeyID:      requireEnv("B2_KEY_ID"),
		B2AppKey:     requireEnv("B2_APP_KEY"),
		B2Endpoint:   requireEnv("B2_ENDPOINT"),
		B2BucketName: requireEnv("B2_BUCKET_NAME"),
		B2PublicDomain: requireEnv("B2_PUBLIC_DOMAIN"),
	}

	return cfg
}

func requireEnv(key string) string {
	val := os.Getenv(key)
	if val == "" {
		log.Fatalf("CRITICAL: Missing required environment variable: %s", key)
	}
	return val
}