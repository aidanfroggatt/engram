package router

import (
	"engram/api/handlers"
	"engram/api/middleware"
	"fmt"
	"net/http"
)

// New constructs the application routing tree
func New(appEnv string, auth *middleware.AuthMiddleware, mediaServer *handlers.MediaServer) *http.ServeMux {
	mux := http.NewServeMux()

	// --- PUBLIC ROUTES ---
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"service": "engram-api", "status": "online"}`))
	})

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, "OK")
	})

	// --- PROTECTED ROUTES ---
	mux.Handle("GET /api/media", auth.RequireAuth(http.HandlerFunc(mediaServer.HandleListMedia)))
	mux.Handle("POST /api/upload/url", auth.RequireAuth(http.HandlerFunc(mediaServer.HandleGetUploadURL)))
	mux.Handle("POST /api/upload/commit", auth.RequireAuth(http.HandlerFunc(mediaServer.HandleCommitMedia)))

	// Placeholder for your upcoming Delete Endpoint:
	// mux.Handle("DELETE /api/media/{id}", auth.RequireAuth(http.HandlerFunc(mediaServer.HandleDeleteMedia)))

	// --- ENVIRONMENT SPECIFIC ROUTES ---
	if appEnv == "development" {
		mux.Handle("GET /protected", auth.RequireAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userID := r.Context().Value(middleware.UserIDKey).(string)
			fmt.Fprintf(w, "Authenticated User ID: %s\n", userID)
		})))
	}

	return mux
}