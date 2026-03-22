package main

import (
	"context"
	"engram/api/config"
	"engram/api/ent"
	"engram/api/handlers"
	"engram/api/middleware"
	"engram/api/router"
	"fmt"
	"log"
	"net/http"

	_ "github.com/lib/pq"
)

func main() {
	// 1. Initialize the system logic
	cfg, finalHandler, err := Setup()
	if err != nil {
		log.Fatalf("Critical Initialization Failure: %v", err)
	}

	// 2. Start the Server
	fmt.Printf("Engram API running on :%s\n", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, finalHandler); err != nil {
		log.Fatal(err)
	}
}

func Setup() (*config.Config, http.Handler, error) {
	cfg := config.Load()
	fmt.Println("Config loaded successfully.")

	// 1. Initialize Database
	client, err := ent.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		return cfg, nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	if err := client.Schema.Create(context.Background()); err != nil {
		_ = client.Close()
		return cfg, nil, fmt.Errorf("database sync failure: %w", err)
	}

	// 2. Initialize Services
	auth, err := middleware.NewAuthMiddleware(cfg.JWKSURL)
	if err != nil {
		_ = client.Close()
		return cfg, nil, fmt.Errorf("auth init: %w", err)
	}

	mediaServer, err := handlers.NewMediaServer(cfg, client)
	if err != nil {
		_ = client.Close()
		return cfg, nil, fmt.Errorf("media server init: %w", err)
	}

	// 3. Mount Routes & Middleware
	mux := router.New(cfg.AppEnv, auth, mediaServer)
	finalHandler := middleware.CORS(mux, cfg.AllowedOrigin)

	return cfg, finalHandler, nil
}
