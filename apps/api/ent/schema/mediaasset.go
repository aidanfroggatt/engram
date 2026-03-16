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
		field.String("b2_url").
			NotEmpty(),
		field.Time("capture_time"),
		field.String("mime_type").
			NotEmpty(),
		// We will store the PostGIS Point as a Well-Known Text (WKT) string for now
		// to keep the initial schema simple before adding custom PostGIS types.
		field.String("geom").
			Optional(),
		field.Time("created_at").
			Default(time.Now).
			Immutable(),
	}
}

// Indexes of the MediaAsset.
func (MediaAsset) Indexes() []ent.Index {
	return []ent.Index{
		// Index user_id and capture_time together for ultra-fast timeline queries
		index.Fields("user_id", "capture_time"),
	}
}

// Edges of the MediaAsset.
func (MediaAsset) Edges() []ent.Edge {
	return nil
}