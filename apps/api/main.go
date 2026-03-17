package main

import (
	"context"
	"engram/api/config"
	"engram/api/ent"
	"engram/api/handlers"
	"engram/api/middleware"
	"fmt"
	"log"
	"net/http"

	_ "github.com/lib/pq"
)

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	cfg := config.Load()
	fmt.Println("Config loaded successfully.")

	// 1. Initialize Ent Client with Neon URL
	client, err := ent.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to Neon: %v", err)
	}
	defer client.Close()

	// 2. Run Auto-Migration
	if err := client.Schema.Create(context.Background()); err != nil {
		log.Fatalf("Failed to sync schema: %v", err)
	}
	fmt.Println("Database schema synced to Neon.")

	// 3. Initialize Unified Media Server (Handles Uploads & Gallery)
	auth := middleware.NewAuthMiddleware(cfg.JWKSURL)
	mediaServer, err := handlers.NewMediaServer(cfg, client)
	if err != nil {
		log.Fatalf("Failed to initialize media server: %v", err)
	}

	// 4. Set up Routes
	mux := http.NewServeMux()

	// Public Health Check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, "OK")
	})

	// Gallery Route
	mux.HandleFunc("/api/media", mediaServer.HandleListMedia)

	// Upload Routes
	mux.HandleFunc("/api/upload/url", mediaServer.HandleGetUploadURL)
	mux.HandleFunc("/api/upload/commit", mediaServer.HandleCommitMedia)

	// Protected Debug Route
	mux.HandleFunc("/protected", func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(middleware.UserIDKey).(string)
		fmt.Fprintf(w, "Authenticated User ID: %s\n", userID)
	})

	// 5. Wrap with Middleware
	protectedMux := auth.RequireAuth(mux)
	finalHandler := corsMiddleware(protectedMux)

	fmt.Println("Engram API running on :8080")
	if err := http.ListenAndServe(":8080", finalHandler); err != nil {
		log.Fatal(err)
	}
}