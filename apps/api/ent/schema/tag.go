package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// Tag holds the schema definition for the Tag entity.
type Tag struct {
	ent.Schema
}

// Fields of the Tag.
func (Tag) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New).
			Immutable(),
		field.String("user_id").
			NotEmpty().
			Immutable(),
		field.String("name").
			NotEmpty(),
	}
}

// Indexes of the Tag.
func (Tag) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("user_id", "name").Unique(),
	}
}

// Edges of the Tag.
func (Tag) Edges() []ent.Edge {
	return []ent.Edge{
		// Many-to-Many relationship back to MediaAsset
		// Note: We will fully wire this up later when we build the AI worker
	}
}
