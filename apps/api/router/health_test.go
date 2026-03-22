package router

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHealthRoutes(t *testing.T) {
	// Initialize a fresh mux and mount only health routes
	mux := http.NewServeMux()
	mountHealthRoutes(mux)

	tests := []struct {
		name           string
		method         string
		url            string
		expectedStatus int
		expectedBody   string
	}{
		{
			name:           "Root exact match returns JSON status",
			method:         "GET",
			url:            "/",
			expectedStatus: http.StatusOK,
			expectedBody:   `{"service": "engram-api", "status": "online"}`,
		},
		{
			name:           "Health endpoint returns OK",
			method:         "GET",
			url:            "/health",
			expectedStatus: http.StatusOK,
			expectedBody:   "OK",
		},
		{
			name:           "Root does NOT match sub-paths (The {$}) Fix",
			method:         "GET",
			url:            "/something-else",
			expectedStatus: http.StatusNotFound,
			expectedBody:   "404 page not found",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, tt.url, nil)
			rr := httptest.NewRecorder()

			mux.ServeHTTP(rr, req)

			// Check Status Code
			if rr.Code != tt.expectedStatus {
				t.Errorf("%s: expected status %d, got %d", tt.name, tt.expectedStatus, rr.Code)
			}

			// Check Body (using Contains to avoid whitespace/newline headaches)
			trimmedBody := strings.TrimSpace(rr.Body.String())
			if !strings.Contains(trimmedBody, tt.expectedBody) {
				t.Errorf("%s: expected body to contain %q, got %q", tt.name, tt.expectedBody, trimmedBody)
			}

			// Check Content-Type for the root JSON response
			if tt.url == "/" && rr.Header().Get("Content-Type") != "application/json" {
				t.Errorf("%s: expected Content-Type application/json, got %s", tt.name, rr.Header().Get("Content-Type"))
			}
		})
	}
}
