package main

import (
	"fmt"
	"log"
	"net/http"

	"connectrpc.com/connect"

	"engram/api/config"
	"engram/api/handlers"
	"engram/api/middleware"
	"engram/api/rpc/upload/uploadconnect"
)

// Simple CORS middleware for local development
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

	auth := middleware.NewAuthMiddleware(cfg.JWKSURL)
	
	uploadServer, err := handlers.NewUploadServer(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize upload server: %v", err)
	}

	mux := http.NewServeMux()

	mux.HandleFunc("/protected", func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(middleware.UserIDKey).(string)
		fmt.Fprintf(w, "Secure vault accessed. Authenticated User ID: %s\n", userID)
	})

	// CHANGED: rpcconnect is now uploadconnect
	path, handler := uploadconnect.NewUploadServiceHandler(
		uploadServer,
		connect.WithInterceptors(),
	)
	mux.Handle(path, handler)

	protectedMux := auth.RequireAuth(mux)
	corsMux := corsMiddleware(protectedMux)

	fmt.Println("Starting secure server on :8080")
	if err := http.ListenAndServe(":8080", corsMux); err != nil {
		log.Fatal(err)
	}
}