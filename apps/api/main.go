package main

import (
	"context"
	"engram/api/config"
	"engram/api/ent"
	"engram/api/handlers"
	"engram/api/middleware"
	"engram/api/router"
	"fmt"
	"log"
	"net/http"
	"os"

	_ "github.com/lib/pq"
)

func main() {
	cfg := config.Load()
	fmt.Println("Config loaded successfully.")

	appEnv := os.Getenv("APP_ENV")
	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")

	// 1. Initialize Database
	client, err := ent.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to Neon: %v", err)
	}
	defer client.Close()

	if err := client.Schema.Create(context.Background()); err != nil {
		log.Fatalf("Failed to sync schema: %v", err)
	}
	fmt.Println("Database schema synced to Neon.")

	// 2. Initialize Services
	auth := middleware.NewAuthMiddleware(cfg.JWKSURL)
	mediaServer, err := handlers.NewMediaServer(cfg, client)
	if err != nil {
		log.Fatalf("Failed to initialize media server: %v", err)
	}

	// 3. Mount Routes & Middleware
	mux := router.New(appEnv, auth, mediaServer)
	finalHandler := middleware.CORS(mux, allowedOrigin)

	// 4. Start Server
	fmt.Println("Engram API running on :8080")
	if err := http.ListenAndServe(":8080", finalHandler); err != nil {
		log.Fatal(err)
	}
}