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

	// 2. Run Auto-Migration (Syncs your schema to Neon)
	if err := client.Schema.Create(context.Background()); err != nil {
		log.Fatalf("Failed to sync schema: %v", err)
	}
	fmt.Println("Database schema synced to Neon.")

	// 3. Initialize Handlers
	auth := middleware.NewAuthMiddleware(cfg.JWKSURL)
	uploadServer, err := handlers.NewUploadServer(cfg, client)
	if err != nil {
		log.Fatalf("Failed to initialize upload server: %v", err)
	}

	// 4. Set up Routes
	mux := http.NewServeMux()

	// Public Health Check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, "OK")
	})

	// Protected Upload Routes
	mux.HandleFunc("/api/upload/url", uploadServer.HandleGetUploadURL)
	mux.HandleFunc("/api/upload/commit", uploadServer.HandleCommitMedia)

	// Protected Debug Route
	mux.HandleFunc("/protected", func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(middleware.UserIDKey).(string)
		fmt.Fprintf(w, "Authenticated User ID: %s\n", userID)
	})

	// 5. Wrap with Middleware
	// Order: CORS -> Auth -> Handlers
	protectedMux := auth.RequireAuth(mux)
	finalHandler := corsMiddleware(protectedMux)

	fmt.Println("Engram API running on :8080")
	if err := http.ListenAndServe(":8080", finalHandler); err != nil {
		log.Fatal(err)
	}
}