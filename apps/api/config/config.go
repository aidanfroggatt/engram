package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv             string
	Port               string
	AllowedOrigin      string
	DatabaseURL        string
	JWKSURL            string
	B2KeyID            string
	B2AppKey           string
	B2Endpoint         string
	B2BucketName       string
	CloudflareProxyURL string
}

func Load() *Config {
	_ = godotenv.Load(".env.local")

	return &Config{
		AppEnv:             requireEnv("APP_ENV"),
		Port:               requireEnv("PORT"),
		AllowedOrigin:      requireEnv("ALLOWED_ORIGIN"),
		DatabaseURL:        requireEnv("DATABASE_URL"),
		JWKSURL:            requireEnv("JWKS_URL"),
		B2KeyID:            requireEnv("B2_KEY_ID"),
		B2AppKey:           requireEnv("B2_APP_KEY"),
		B2Endpoint:         requireEnv("B2_ENDPOINT"),
		B2BucketName:       requireEnv("B2_BUCKET_NAME"),
		CloudflareProxyURL: requireEnv("CloudflareProxyURL"),
	}
}

func requireEnv(key string) string {
	val := os.Getenv(key)
	if val == "" {
		log.Fatalf("🛑 CRITICAL: Environment variable %s is required but missing.", key)
	}
	return val
}
