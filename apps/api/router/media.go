package router

import (
	"engram/api/handlers"
	"engram/api/middleware"
	"net/http"
)

func mountMediaRoutes(mux *http.ServeMux, auth *middleware.AuthMiddleware, server *handlers.MediaServer) {
	
	// Gallery Fetching
	mux.Handle("GET /api/media", auth.RequireAuth(http.HandlerFunc(server.HandleListMedia)))
	
	// Upload Flow
	mux.Handle("POST /api/upload/url", auth.RequireAuth(http.HandlerFunc(server.HandleGetUploadURL)))
	mux.Handle("POST /api/upload/commit", auth.RequireAuth(http.HandlerFunc(server.HandleCommitMedia)))
	
	// Deletion Route
	mux.Handle("DELETE /api/media/{id}", auth.RequireAuth(http.HandlerFunc(server.HandleDeleteMedia)))

}