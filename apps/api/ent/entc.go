//go:build ignore

package main

import (
	"log"

	"entgo.io/contrib/entproto"
	"entgo.io/ent/entc"
	"entgo.io/ent/entc/gen"
)

func main() {
	err := entc.Generate("./schema", &gen.Config{}, entc.Extensions(&entproto.Extension{}))
	if err != nil {
		log.Fatalf("running ent codegen: %v", err)
	}
}