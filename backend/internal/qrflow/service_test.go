package qrflow

import (
	"bytes"
	"image/png"
	"strings"
	"testing"
)

func TestValidateDestination(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		input     string
		wantError bool
	}{
		{name: "http url", input: "https://example.com/path?q=1"},
		{name: "http scheme", input: "http://localhost:8080"},
		{name: "empty", input: "", wantError: true},
		{name: "missing scheme", input: "example.com", wantError: true},
		{name: "bad scheme", input: "ftp://example.com", wantError: true},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			got, err := ValidateDestination(tc.input)
			if tc.wantError {
				if err == nil {
					t.Fatalf("expected error, got URL %v", got)
				}
				return
			}

			if err != nil {
				t.Fatalf("ValidateDestination(%q) error = %v", tc.input, err)
			}

			if got.String() != tc.input {
				t.Fatalf("normalized URL = %q, want %q", got.String(), tc.input)
			}
		})
	}
}

func TestPreviewReturnsSVGDataURL(t *testing.T) {
	t.Parallel()

	svc := New()
	resp, err := svc.Preview(testProjectConfig("https://example.com/preview", FormatSVG, 320))
	if err != nil {
		t.Fatalf("Preview error: %v", err)
	}

	if resp.Format != FormatSVG {
		t.Fatalf("format = %q, want %q", resp.Format, FormatSVG)
	}

	if !strings.HasPrefix(resp.SVG, "<?xml") {
		t.Fatalf("svg does not start with xml declaration: %q", resp.SVG[:min(20, len(resp.SVG))])
	}

	if !strings.HasPrefix(resp.DataURL, "data:image/svg+xml;base64,") {
		t.Fatalf("data url = %q", resp.DataURL)
	}
}

func TestExportPNGReturnsValidImageBytes(t *testing.T) {
	t.Parallel()

	svc := New()
	resp, err := svc.Export(testProjectConfig("https://example.com/download", FormatPNG, 256))
	if err != nil {
		t.Fatalf("Export error: %v", err)
	}

	if resp.MimeType != "image/png" {
		t.Fatalf("mime type = %q", resp.MimeType)
	}

	if resp.Filename != "qurl-qr.png" {
		t.Fatalf("filename = %q", resp.Filename)
	}

	if !bytes.HasPrefix(resp.Bytes, []byte{0x89, 'P', 'N', 'G'}) {
		t.Fatalf("export does not look like a PNG file")
	}

	if _, err := png.Decode(bytes.NewReader(resp.Bytes)); err != nil {
		t.Fatalf("png decode: %v", err)
	}
}

func TestExportRejectsUnsupportedSchemaVersion(t *testing.T) {
	t.Parallel()

	svc := New()
	req := testProjectConfig("https://example.com/download", FormatSVG, 256)
	req.SchemaVersion = "qurl.qr-project-config.v999"
	_, err := svc.Export(req)
	if err == nil {
		t.Fatal("expected schema version error")
	}
}

func TestExportRejectsOversizedRenders(t *testing.T) {
	t.Parallel()

	svc := New()
	_, err := svc.Export(testProjectConfig("https://example.com/download", FormatPNG, MaxExportSize+1))
	if err == nil {
		t.Fatal("expected max size error")
	}
}

func testProjectConfig(destination string, format Format, pixelSize int) ProjectConfig {
	return ProjectConfig{
		SchemaVersion: ProjectSchemaVersion,
		Payload: PayloadConfig{
			SchemaVersion: PayloadSchemaVersion,
			Kind:          "url",
			Payload: DirectURLPayload{
				DestinationURL: destination,
			},
		},
		Export: ExportConfig{
			SchemaVersion: ExportSchemaVersion,
			Format:        format,
			PixelSize:     pixelSize,
			FileName:      "qurl-qr",
		},
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
