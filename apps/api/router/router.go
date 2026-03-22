// Package router handles the multiplexing and routing of all incoming
// API requests for the Engram backend.
package router

import (
	"engram/api/handlers"
	"engram/api/middleware"
	"net/http"
)

func New(appEnv string, auth *middleware.AuthMiddleware, mediaServer *handlers.MediaServer) *http.ServeMux {
	mux := http.NewServeMux()

	mountHealthRoutes(mux)

	mountMediaRoutes(mux, auth, mediaServer)

	if appEnv == "development" {
		mountDebugRoutes(mux, auth)
	}

	return mux
}
