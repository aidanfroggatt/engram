package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCORS(t *testing.T) {
	// 1. Setup a dummy final handler to verify passage
	nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("next handler reached"))
	})

	tests := []struct {
		name           string
		allowedOrigin  string
		method         string
		expectedOrigin string
		expectedStatus int
		expectNext     bool // Does the request reach the Librarian?
	}{
		{
			name:           "Standard GET request with production origin",
			allowedOrigin:  "https://engram.aidanfroggatt.com",
			method:         "GET",
			expectedOrigin: "https://engram.aidanfroggatt.com",
			expectedStatus: http.StatusOK,
			expectNext:     true,
		},
		{
			name:           "Fallback to localhost when empty",
			allowedOrigin:  "",
			method:         "GET",
			expectedOrigin: "http://localhost:3000",
			expectedStatus: http.StatusOK,
			expectNext:     true,
		},
		{
			name:           "Preflight OPTIONS request (Interception)",
			allowedOrigin:  "https://engram.aidanfroggatt.com",
			method:         "OPTIONS",
			expectedOrigin: "https://engram.aidanfroggatt.com",
			expectedStatus: http.StatusOK,
			expectNext:     false, // OPTIONS should stop at the middleware
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, "/api/media", nil)
			rr := httptest.NewRecorder()

			handler := CORS(nextHandler, tt.allowedOrigin)
			handler.ServeHTTP(rr, req)

			// 2. VERIFY HEADERS
			if origin := rr.Header().Get("Access-Control-Allow-Origin"); origin != tt.expectedOrigin {
				t.Errorf("%s: expected origin %s, got %s", tt.name, tt.expectedOrigin, origin)
			}

			methods := rr.Header().Get("Access-Control-Allow-Methods")
			if methods != "GET, POST, PUT, DELETE, OPTIONS" {
				t.Errorf("%s: incorrect allow-methods, got %s", tt.name, methods)
			}

			headers := rr.Header().Get("Access-Control-Allow-Headers")
			if headers != "Authorization, Content-Type" {
				t.Errorf("%s: incorrect allow-headers, got %s", tt.name, headers)
			}

			// 3. VERIFY STATUS CODE
			if rr.Code != tt.expectedStatus {
				t.Errorf("%s: expected status %d, got %d", tt.name, tt.expectedStatus, rr.Code)
			}

			// 4. VERIFY LOGIC FLOW
			body := rr.Body.String()
			if tt.expectNext && body != "next handler reached" {
				t.Error("expected next handler to be called, but it was skipped")
			}
			if !tt.expectNext && body == "next handler reached" {
				t.Error("expected next handler to be skipped (preflight), but it was called")
			}
		})
	}
}
