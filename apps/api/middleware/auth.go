package middleware

import (
	"context"
	"log"
	"net/http"
	"strings"

	"github.com/MicahParks/keyfunc/v2"
	"github.com/golang-jwt/jwt/v5"
)

// Define a custom type for context keys to avoid collisions
type contextKey string

const UserIDKey contextKey = "user_id"

type AuthMiddleware struct {
	jwks *keyfunc.JWKS
}

// NewAuthMiddleware initializes the JWKS cache from Clerk
func NewAuthMiddleware(jwksURL string) *AuthMiddleware {
	// Fetch and cache the public keys on startup
	jwks, err := keyfunc.Get(jwksURL, keyfunc.Options{})
	if err != nil {
		log.Fatalf("Failed to create JWKS from URL: %v", err)
	}
	return &AuthMiddleware{jwks: jwks}
}

// RequireAuth wraps an http.Handler to enforce Clerk JWT validation
func (m *AuthMiddleware) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. Extract the Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Unauthorized: Missing or invalid Authorization header", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// 2. Parse and verify the token using the cached JWKS
		token, err := jwt.Parse(tokenString, m.jwks.Keyfunc)
		if err != nil || !token.Valid {
			http.Error(w, "Unauthorized: Invalid token", http.StatusUnauthorized)
			return
		}

		// 3. Extract the sub (subject / Clerk User ID)
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, "Unauthorized: Invalid token claims", http.StatusUnauthorized)
			return
		}

		userID, ok := claims["sub"].(string)
		if !ok || userID == "" {
			http.Error(w, "Unauthorized: Missing user ID in token", http.StatusUnauthorized)
			return
		}

		// 4. Inject the user_id into the request context for downstream handlers
		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		
		// 5. Pass execution to the next handler with the new context
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}