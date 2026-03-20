package router

import (
	"engram/api/middleware"
	"fmt"
	"net/http"
)

func mountDebugRoutes(mux *http.ServeMux, auth *middleware.AuthMiddleware) {
	mux.Handle("GET /protected", auth.RequireAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(middleware.UserIDKey).(string)
		fmt.Fprintf(w, "Authenticated User ID: %s\n", userID)
	})))
}