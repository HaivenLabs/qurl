package httpapi

import (
	"encoding/json"
	"net/http/httptest"
	"testing"

	"qurl/backend/internal/config"
	"qurl/backend/internal/version"
)

func TestHealthHandlerUsesVersionedContract(t *testing.T) {
	srv := New(config.Config{
		ServiceName: "test-service",
		ListenAddr:  ":0",
		APIVersion:  version.APIVersion,
	})

	ts := httptest.NewServer(srv.Handler())
	defer ts.Close()

	resp, err := ts.Client().Get(ts.URL + version.HealthPath)
	if err != nil {
		t.Fatalf("GET health: %v", err)
	}
	defer resp.Body.Close()

	if got := resp.Header.Get("Content-Type"); got != "application/json" {
		t.Fatalf("content type = %q", got)
	}

	var payload map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if payload["service"] != "test-service" {
		t.Fatalf("service = %v", payload["service"])
	}
	if payload["apiVersion"] != version.APIVersion {
		t.Fatalf("apiVersion = %v", payload["apiVersion"])
	}
}

