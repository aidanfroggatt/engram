package main

import (
	"fmt"
	"log"
	"net/http"

	"engram/api/config"
	"engram/api/middleware"
)

// Simple CORS middleware for local development
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")

		// Handle preflight OPTIONS requests immediately
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

	auth := middleware.NewAuthMiddleware(cfg.JWKSURL)
	mux := http.NewServeMux()

	mux.HandleFunc("/protected", func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(middleware.UserIDKey).(string)
		fmt.Fprintf(w, "Secure vault accessed. Authenticated User ID: %s\n", userID)
	})

	// Wrap the mux: First enforce Auth, then enforce CORS.
	protectedMux := auth.RequireAuth(mux)
	corsMux := corsMiddleware(protectedMux)

	fmt.Println("Starting secure server on :8080")
	if err := http.ListenAndServe(":8080", corsMux); err != nil {
		log.Fatal(err)
	}
}