package router

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"engram/api/handlers"
	"engram/api/middleware"
)

func TestMediaRoutes(t *testing.T) {
	// 1. Setup minimal dependencies
	// We use the real middleware to verify it intercepts unauthorized requests.
	auth := &middleware.AuthMiddleware{}
	server := &handlers.MediaServer{}
	mux := http.NewServeMux()

	mountMediaRoutes(mux, auth, server)

	tests := []struct {
		name           string
		method         string
		url            string
		expectedStatus int
	}{
		{
			name:           "List Media requires Auth",
			method:         "GET",
			url:            "/api/media",
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "Get Upload URL requires Auth",
			method:         "POST",
			url:            "/api/upload/url",
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "Commit Media requires Auth",
			method:         "POST",
			url:            "/api/upload/commit",
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "Delete Media requires Auth",
			method:         "DELETE",
			url:            "/api/media/asset_123",
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "Update Media (PUT) requires Auth",
			method:         "PUT",
			url:            "/api/media/asset_123",
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "Invalid Method on Media List returns 405",
			method:         "POST", // Registered as GET
			url:            "/api/media",
			expectedStatus: http.StatusMethodNotAllowed,
		},
		{
			name:           "Invalid Method on Upload URL returns 405",
			method:         "GET", // Registered as POST
			url:            "/api/upload/url",
			expectedStatus: http.StatusMethodNotAllowed,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, tt.url, nil)
			rr := httptest.NewRecorder()

			mux.ServeHTTP(rr, req)

			if rr.Code != tt.expectedStatus {
				t.Errorf("%s: for %s %s, expected status %d, got %d",
					tt.name, tt.method, tt.url, tt.expectedStatus, rr.Code)
			}
		})
	}
}
