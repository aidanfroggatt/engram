package config

import (
	"os"
	"testing"
)

func TestRequireEnv(t *testing.T) {
	key := "TEST_VAR"
	expected := "engram_value"

	os.Setenv(key, expected)
	defer os.Unsetenv(key) // Clean up after test

	val := requireEnv(key)

	if val != expected {
		t.Errorf("expected %s, got %s", expected, val)
	}
}
