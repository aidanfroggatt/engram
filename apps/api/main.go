package main

import (
	"fmt"
	"log"
	"net/http"

	"engram/api/config"
)

func main() {
	cfg := config.Load()
	fmt.Println("Config loaded successfully. DB:", cfg.DatabaseURL)

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Engram Go API is secure and running.")
	})

	fmt.Println("Starting server on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}