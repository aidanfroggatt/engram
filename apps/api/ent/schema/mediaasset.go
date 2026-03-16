package schema

import (
	"time"

	"entgo.io/contrib/entproto"
	"entgo.io/ent"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// MediaAsset holds the schema definition for the MediaAsset entity.
type MediaAsset struct {
	ent.Schema
}

// Annotations of the MediaAsset (Tells entproto to generate a Protobuf Message and gRPC Service)
func (MediaAsset) Annotations() []schema.Annotation {
	return []schema.Annotation{
		entproto.Message(),
		entproto.Service(),
	}
}

// Fields of the MediaAsset.
func (MediaAsset) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New).
			Immutable().
			Annotations(entproto.Field(1)),
		field.String("user_id").
			NotEmpty().
			Immutable().
			Annotations(entproto.Field(2)),
		field.String("b2_url").
			NotEmpty().
			Annotations(entproto.Field(3)),
		field.Time("capture_time").
			Annotations(entproto.Field(4)),
		field.String("mime_type").
			NotEmpty().
			Annotations(entproto.Field(5)),
		field.String("geom").
			Optional().
			Annotations(entproto.Field(6)),
		field.Time("created_at").
			Default(time.Now).
			Immutable().
			Annotations(entproto.Field(7)),
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