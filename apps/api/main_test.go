package main

import (
	"os"
	"strings"
	"testing"
)

func setupTestEnv() {
	os.Setenv("APP_ENV", "development")
	os.Setenv("PORT", "9090")
	os.Setenv("ALLOWED_ORIGIN", "https://test.engram.com")
	os.Setenv("DATABASE_URL", "postgres://user:pass@localhost:5432/db?sslmode=disable")
	os.Setenv("JWKS_URL", "http://localhost/.well-known/jwks.json")
	os.Setenv("B2_KEY_ID", "test_id")
	os.Setenv("B2_APP_KEY", "test_key")
	os.Setenv("B2_ENDPOINT", "s3.us-east-005.backblazeb2.com")
	os.Setenv("B2_BUCKET_NAME", "test-bucket")
	os.Setenv("CLOUDFLARE_PROXY_URL", "http://localhost:8787")
}

func TestSetup(t *testing.T) {
	origEnv := os.Environ()
	defer func() {
		os.Clearenv()
		for _, pair := range origEnv {
			kv := strings.SplitN(pair, "=", 2)
			os.Setenv(kv[0], kv[1])
		}
	}()

	t.Run("Wiring Integrity", func(t *testing.T) {
		setupTestEnv()

		// This should not crash the test runner because all envs are set
		cfg, _, _ := Setup()

		if cfg.Port != "9090" {
			t.Errorf("Expected Port 9090, got %s", cfg.Port)
		}
	})

	t.Run("Database Error Handling", func(t *testing.T) {
		setupTestEnv()
		// Only change the DB URL to trigger a non-fatal connection error
		os.Setenv("DATABASE_URL", "postgres://nonexistent:5432/db")

		_, _, err := Setup()
		if err == nil {
			t.Error("Expected DB connection error, but got nil")
		}
	})
}
