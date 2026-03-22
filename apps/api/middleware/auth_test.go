package middleware

import (
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"math/big"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestAuthMiddleware_RequireAuth(t *testing.T) {
	// 1. GENERATE TEST RSA KEYS
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("Failed to generate RSA key: %v", err)
	}
	publicKey := &privateKey.PublicKey

	// Encode public key parts for JWKS
	n := base64.RawURLEncoding.EncodeToString(publicKey.N.Bytes())
	e := base64.RawURLEncoding.EncodeToString(big.NewInt(int64(publicKey.E)).Bytes())

	// 2. SETUP MOCK JWKS SERVER
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		jwks := map[string]interface{}{
			"keys": []map[string]interface{}{
				{
					"kty": "RSA",
					"alg": "RS256",
					"use": "sig",
					"kid": "test-key-id",
					"n":   n,
					"e":   e,
				},
			},
		}
		_ = json.NewEncoder(w).Encode(jwks)
	}))
	defer server.Close()

	// 3. INITIALIZE MIDDLEWARE (Handling the new error return)
	mw, err := NewAuthMiddleware(server.URL)
	if err != nil {
		t.Fatalf("NewAuthMiddleware failed: %v", err)
	}

	// 4. GENERATE A VALID TEST TOKEN
	testUserID := "user_2P5n7vW_Aidan"
	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"sub": testUserID,
		"exp": time.Now().Add(time.Hour).Unix(),
		"iat": time.Now().Unix(),
	})
	token.Header["kid"] = "test-key-id"
	validToken, err := token.SignedString(privateKey)
	if err != nil {
		t.Fatalf("Failed to sign token: %v", err)
	}

	// 5. DEFINE TEST CASES
	tests := []struct {
		name           string
		authHeader     string
		expectedStatus int
		expectedUserID string
	}{
		{
			name:           "Valid Token Injects UserID",
			authHeader:     "Bearer " + validToken,
			expectedStatus: http.StatusOK,
			expectedUserID: testUserID,
		},
		{
			name:           "Missing Authorization Header",
			authHeader:     "",
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "Malformed Header (No Bearer)",
			authHeader:     "Token " + validToken,
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "Expired or Invalid Token",
			authHeader:     "Bearer some-garbage-token",
			expectedStatus: http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// A dummy final handler to verify context injection
			nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				val := r.Context().Value(UserIDKey)
				userID, ok := val.(string)
				if !ok || userID != tt.expectedUserID {
					t.Errorf("expected userID %s in context, got %v", tt.expectedUserID, val)
				}
				w.WriteHeader(http.StatusOK)
			})

			handlerToTest := mw.RequireAuth(nextHandler)

			req := httptest.NewRequest("GET", "/api/media", nil)
			if tt.authHeader != "" {
				req.Header.Set("Authorization", tt.authHeader)
			}
			rr := httptest.NewRecorder()

			handlerToTest.ServeHTTP(rr, req)

			if rr.Code != tt.expectedStatus {
				t.Errorf("%s: expected status %d, got %d", tt.name, tt.expectedStatus, rr.Code)
			}
		})
	}
}

func TestNewAuthMiddleware_Fail(t *testing.T) {
	// Test the new error return path with a garbage URL
	_, err := NewAuthMiddleware("http://invalid-url-that-does-not-exist")
	if err == nil {
		t.Error("Expected an error from NewAuthMiddleware with invalid URL, but got nil")
	}
}
