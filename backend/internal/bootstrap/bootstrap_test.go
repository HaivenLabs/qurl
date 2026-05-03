package bootstrap

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"qurl/backend/internal/config"
	"qurl/backend/internal/httpapi"
	"qurl/backend/internal/version"
)

func TestBootstrapExposesHealthEndpoints(t *testing.T) {
	cfg := config.Config{
		ServiceName: "test-service",
		ListenAddr:  ":0",
		APIVersion:  version.APIVersion,
	}

	server := httpapi.New(cfg)
	ts := httptest.NewServer(server.Handler())
	defer ts.Close()

	client := ts.Client()

	for _, path := range []string{version.HealthPath, version.APIPrefix + "/health"} {
		req, err := http.NewRequest(http.MethodGet, ts.URL+path, nil)
		if err != nil {
			t.Fatalf("new request: %v", err)
		}

		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("GET %s: %v", path, err)
		}

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("GET %s: got status %d", path, resp.StatusCode)
		}

		var payload map[string]any
		if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
			t.Fatalf("decode %s: %v", path, err)
		}

		if payload["status"] != "ok" {
			t.Fatalf("GET %s: status = %v", path, payload["status"])
		}

		if payload["apiVersion"] != version.APIVersion {
			t.Fatalf("GET %s: apiVersion = %v", path, payload["apiVersion"])
		}

		_ = resp.Body.Close()
	}
}

func TestRunWithConfigStopsOnContextCancellation(t *testing.T) {
	cfg := config.Config{
		ServiceName: "test-service",
		ListenAddr:  ":0",
		APIVersion:  version.APIVersion,
	}

	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan error, 1)
	go func() {
		done <- RunWithConfig(ctx, cfg)
	}()

	time.Sleep(50 * time.Millisecond)
	cancel()

	select {
	case err := <-done:
		if err != nil {
			t.Fatalf("RunWithConfig returned error: %v", err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("RunWithConfig did not stop after cancellation")
	}
}
