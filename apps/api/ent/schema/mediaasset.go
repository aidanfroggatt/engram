package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// MediaAsset holds the schema definition for the MediaAsset entity.
type MediaAsset struct {
	ent.Schema
}

// Fields of the MediaAsset.
func (MediaAsset) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New).
			Immutable(),
		field.String("user_id").
			NotEmpty().
			Immutable(),
		field.String("file_key"). // The B2 Path (e.g., user_123/abc.jpeg)
						NotEmpty().
						Unique(),
		field.String("mime_type").
			NotEmpty(),
		field.Time("capture_time"),
		field.Float("latitude").
			Optional().
			Nillable(),
		field.Float("longitude").
			Optional().
			Nillable(),
		field.Time("created_at").
			Default(time.Now).
			Immutable(),
	}
}

// Indexes of the MediaAsset.
func (MediaAsset) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("user_id", "capture_time"),
	}
}

// Edges of the MediaAsset.
func (MediaAsset) Edges() []ent.Edge {
	return nil
}
