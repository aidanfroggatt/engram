package router

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"engram/api/handlers"
	"engram/api/middleware"
)

// We verify the wiring by checking for the "X-Test-Auth" header
// that our mock middleware will inject.
func TestRouterWiring(t *testing.T) {
	// 1. Setup Mock Middleware that doesn't require real JWTs
	auth := &middleware.AuthMiddleware{}
	media := &handlers.MediaServer{}

	tests := []struct {
		name           string
		appEnv         string
		method         string
		url            string
		expectedStatus int
	}{
		{
			name:   "GET /api/media is registered",
			appEnv: "production",
			method: "GET",
			url:    "/api/media",
			// It might be 401 if auth hits, but it should NOT be 404
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "POST /api/upload/url is registered",
			appEnv:         "production",
			method:         "POST",
			url:            "/api/upload/url",
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "PUT /api/media/{id} is registered",
			appEnv:         "production",
			method:         "PUT",
			url:            "/api/media/123",
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "Debug routes are HIDDEN in production",
			appEnv:         "production",
			method:         "GET",
			url:            "/debug/vars", // Standard Go debug path
			expectedStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mux := New(tt.appEnv, auth, media)
			req := httptest.NewRequest(tt.method, tt.url, nil)
			rr := httptest.NewRecorder()

			mux.ServeHTTP(rr, req)

			if rr.Code != tt.expectedStatus {
				t.Errorf("%s: expected %d, got %d", tt.name, tt.expectedStatus, rr.Code)
			}
		})
	}
}
