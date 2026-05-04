package httpapi

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
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

func TestHealthHandlerRejectsUnsupportedMethods(t *testing.T) {
	srv := New(config.Config{
		ServiceName: "test-service",
		ListenAddr:  ":0",
		APIVersion:  version.APIVersion,
	})

	req := httptest.NewRequest(http.MethodPost, version.HealthPath, nil)
	rec := httptest.NewRecorder()

	srv.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusMethodNotAllowed)
	}

	if got := rec.Header().Get("Allow"); got != "GET, HEAD" {
		t.Fatalf("Allow = %q", got)
	}
}

func TestPreviewEndpointReturnsSVGPayload(t *testing.T) {
	srv := New(config.Config{
		ServiceName: "test-service",
		ListenAddr:  ":0",
		APIVersion:  version.APIVersion,
	})

	body := bytes.NewBufferString(`{
		"schemaVersion":"qurl.qr-project-config.v1",
		"payload":{
			"schemaVersion":"qurl.qr-payload-config.v1",
			"kind":"url",
			"payload":{"destinationUrl":"https://example.com/preview"}
		},
		"export":{
			"schemaVersion":"qurl.qr-export-config.v1",
			"format":"svg",
			"pixelSize":320,
			"fileName":"qurl-qr"
		}
	}`)
	req := httptest.NewRequest(http.MethodPost, version.QRPreviewPath, body)
	rec := httptest.NewRecorder()

	srv.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}

	if got := rec.Header().Get("Content-Type"); got != "application/json" {
		t.Fatalf("Content-Type = %q", got)
	}

	var payload struct {
		SchemaVersion int    `json:"schemaVersion"`
		Destination   string `json:"destination"`
		Format        string `json:"format"`
		SVG           string `json:"svg"`
		DataURL       string `json:"dataUrl"`
	}
	if err := json.NewDecoder(rec.Body).Decode(&payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if payload.SchemaVersion != 1 {
		t.Fatalf("schemaVersion = %d", payload.SchemaVersion)
	}
	if payload.Destination != "https://example.com/preview" {
		t.Fatalf("destination = %q", payload.Destination)
	}
	if payload.Format != "svg" {
		t.Fatalf("format = %q", payload.Format)
	}
	if !strings.HasPrefix(payload.SVG, "<?xml") {
		t.Fatalf("svg payload looks wrong")
	}
	if !strings.HasPrefix(payload.DataURL, "data:image/svg+xml;base64,") {
		t.Fatalf("dataURL = %q", payload.DataURL)
	}
}

func TestExportEndpointReturnsDownload(t *testing.T) {
	srv := New(config.Config{
		ServiceName: "test-service",
		ListenAddr:  ":0",
		APIVersion:  version.APIVersion,
	})

	body := bytes.NewBufferString(`{
		"schemaVersion":"qurl.qr-project-config.v1",
		"payload":{
			"schemaVersion":"qurl.qr-payload-config.v1",
			"kind":"url",
			"payload":{"destinationUrl":"https://example.com/export"}
		},
		"export":{
			"schemaVersion":"qurl.qr-export-config.v1",
			"format":"png",
			"pixelSize":256,
			"fileName":"qurl-qr"
		}
	}`)
	req := httptest.NewRequest(http.MethodPost, version.QRExportPath, body)
	rec := httptest.NewRecorder()

	srv.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}

	if got := rec.Header().Get("Content-Type"); got != "image/png" {
		t.Fatalf("Content-Type = %q", got)
	}

	if got := rec.Header().Get("Content-Disposition"); !strings.HasPrefix(got, `attachment; filename="qurl-qr.png"`) {
		t.Fatalf("Content-Disposition = %q", got)
	}

	if !bytes.HasPrefix(rec.Body.Bytes(), []byte{0x89, 'P', 'N', 'G'}) {
		t.Fatalf("body does not look like a PNG")
	}
}

func TestDirectURLEndpointRejectsNonURLPayload(t *testing.T) {
	srv := New(config.Config{
		ServiceName: "test-service",
		ListenAddr:  ":0",
		APIVersion:  version.APIVersion,
	})

	body := bytes.NewBufferString(`{
		"schemaVersion":"qurl.qr-project-config.v1",
		"payload":{
			"schemaVersion":"qurl.qr-payload-config.v1",
			"kind":"text",
			"payload":{"text":"not a url"}
		},
		"export":{
			"schemaVersion":"qurl.qr-export-config.v1",
			"format":"svg",
			"pixelSize":320,
			"fileName":"qurl-qr"
		}
	}`)
	req := httptest.NewRequest(http.MethodPost, version.DirectURLPreviewPath, body)
	rec := httptest.NewRecorder()

	srv.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
	}
	if !strings.Contains(rec.Body.String(), "payload kind") {
		t.Fatalf("body = %q", rec.Body.String())
	}
}

func TestQRMethodsRejectUnsupportedMethods(t *testing.T) {
	srv := New(config.Config{
		ServiceName: "test-service",
		ListenAddr:  ":0",
		APIVersion:  version.APIVersion,
	})

	req := httptest.NewRequest(http.MethodGet, version.QRPreviewPath, nil)
	rec := httptest.NewRecorder()

	srv.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusMethodNotAllowed)
	}

	if got := rec.Header().Get("Allow"); got != http.MethodPost {
		t.Fatalf("Allow = %q", got)
	}
}
