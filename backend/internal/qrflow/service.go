package qrflow

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"strings"

	"github.com/boombuler/barcode"
	"github.com/boombuler/barcode/qr"
)

const (
	PayloadSchemaVersion  = "qurl.qr-payload-config.v1"
	ProjectSchemaVersion  = "qurl.qr-project-config.v1"
	DesignSchemaVersion   = "qurl.qr-design-config.v1"
	ExportSchemaVersion   = "qurl.qr-export-config.v1"
	ResponseSchemaVersion = 1

	DefaultPreviewSize = 320
	DefaultExportSize  = 640
	MaxExportSize      = 2048
	DefaultFormat      = FormatSVG
)

var (
	ErrInvalidRequest    = errors.New("invalid qr request")
	ErrUnsupportedFormat = errors.New("unsupported qr format")
)

type Format string

const (
	FormatSVG Format = "svg"
	FormatPNG Format = "png"
	FormatJPG Format = "jpg"
	FormatEPS Format = "eps"
)

type ProjectConfig struct {
	SchemaVersion string        `json:"schemaVersion"`
	Payload       PayloadConfig `json:"payload"`
	Design        DesignConfig  `json:"design"`
	Export        ExportConfig  `json:"export"`
}

type PayloadConfig struct {
	SchemaVersion string          `json:"schemaVersion"`
	Kind          string          `json:"kind"`
	Payload       json.RawMessage `json:"payload"`
}

type ExportConfig struct {
	SchemaVersion string `json:"schemaVersion"`
	Format        Format `json:"format"`
	PixelSize     int    `json:"pixelSize"`
	FileName      string `json:"fileName"`
}

type PreviewResponse struct {
	SchemaVersion int    `json:"schemaVersion"`
	Destination   string `json:"destination"`
	Format        Format `json:"format"`
	MimeType      string `json:"mimeType"`
	SVG           string `json:"svg"`
	DataURL       string `json:"dataUrl"`
}

type ExportResponse struct {
	SchemaVersion int    `json:"schemaVersion"`
	Destination   string `json:"destination"`
	Format        Format `json:"format"`
	MimeType      string `json:"mimeType"`
	Filename      string `json:"fileName"`
	Bytes         []byte `json:"bytes"`
}

type Service struct{}

func New() *Service {
	return &Service{}
}

func (s *Service) Preview(req ProjectConfig) (PreviewResponse, error) {
	size := req.Export.PixelSize
	if size <= 0 || size > DefaultPreviewSize {
		size = DefaultPreviewSize
	}

	normalized, bc, err := s.generate(req)
	if err != nil {
		return PreviewResponse{}, err
	}

	svgBytes, err := renderAdvancedSVG(bc, req.Design, size)
	if err != nil {
		return PreviewResponse{}, err
	}

	return PreviewResponse{
		SchemaVersion: ResponseSchemaVersion,
		Destination:   normalized,
		Format:        FormatSVG,
		MimeType:      "image/svg+xml",
		SVG:           string(svgBytes),
		DataURL:       "data:image/svg+xml;base64," + base64.StdEncoding.EncodeToString(svgBytes),
	}, nil
}

func (s *Service) Export(req ProjectConfig) (ExportResponse, error) {
	format := req.Export.Format
	if format == "" {
		format = DefaultFormat
	}

	size := req.Export.PixelSize
	if size <= 0 {
		size = DefaultExportSize
	}
	if size > MaxExportSize {
		return ExportResponse{}, fmt.Errorf("%w: size must be %d or smaller", ErrInvalidRequest, MaxExportSize)
	}

	normalized, bc, err := s.generate(req)
	if err != nil {
		return ExportResponse{}, err
	}

	filename := req.Export.FileName
	if strings.TrimSpace(filename) == "" {
		filename = "qurl-qr"
	}
	filename = strings.TrimSuffix(filename, "."+string(format)) + "." + string(format)

	switch format {
	case FormatSVG:
		svgBytes, err := renderAdvancedSVG(bc, req.Design, size)
		if err != nil {
			return ExportResponse{}, err
		}

		return ExportResponse{
			SchemaVersion: ResponseSchemaVersion,
			Destination:   normalized,
			Format:        FormatSVG,
			MimeType:      "image/svg+xml",
			Filename:      filename,
			Bytes:         svgBytes,
		}, nil
	case FormatPNG, FormatJPG:
		if _, ok := frameTemplateForDesign(req.Design.ApplyDefaults()); ok {
			return ExportResponse{}, fmt.Errorf("%w: %s export for complex SVG frames is not available yet; use SVG export", ErrUnsupportedFormat, strings.ToUpper(string(format)))
		}
		if hasRenderableImageLogo(req.Design.ApplyDefaults()) {
			return ExportResponse{}, fmt.Errorf("%w: %s export for uploaded logos is not available yet; use SVG export", ErrUnsupportedFormat, strings.ToUpper(string(format)))
		}

		bytes, err := renderAdvancedPNG(bc, req.Design, size)
		if err != nil {
			return ExportResponse{}, err
		}

		mime := "image/png"
		if format == FormatJPG {
			mime = "image/jpeg"
		}

		return ExportResponse{
			SchemaVersion: ResponseSchemaVersion,
			Destination:   normalized,
			Format:        format,
			MimeType:      mime,
			Filename:      filename,
			Bytes:         bytes,
		}, nil
	case FormatEPS:
		return ExportResponse{}, fmt.Errorf("%w: EPS export is not available yet; use SVG export", ErrUnsupportedFormat)
	default:
		return ExportResponse{}, fmt.Errorf("%w %q", ErrUnsupportedFormat, format)
	}
}

func ValidateDestination(raw string) (*url.URL, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return nil, fmt.Errorf("%w: destination is required", ErrInvalidRequest)
	}

	parsed, err := url.ParseRequestURI(trimmed)
	if err != nil {
		return nil, fmt.Errorf("%w: destination must be a valid URL: %v", ErrInvalidRequest, err)
	}

	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return nil, fmt.Errorf("%w: destination must use http or https", ErrInvalidRequest)
	}

	if parsed.Host == "" {
		return nil, fmt.Errorf("%w: destination must include a host", ErrInvalidRequest)
	}

	return parsed, nil
}

func (s *Service) generate(req ProjectConfig) (string, barcode.Barcode, error) {
	if req.SchemaVersion != ProjectSchemaVersion {
		return "", nil, fmt.Errorf("%w: unsupported schemaVersion %q", ErrInvalidRequest, req.SchemaVersion)
	}
	if req.Payload.SchemaVersion != PayloadSchemaVersion {
		return "", nil, fmt.Errorf("%w: unsupported payload schemaVersion %q", ErrInvalidRequest, req.Payload.SchemaVersion)
	}
	if req.Export.SchemaVersion != ExportSchemaVersion {
		return "", nil, fmt.Errorf("%w: unsupported export schemaVersion %q", ErrInvalidRequest, req.Export.SchemaVersion)
	}
	if req.Design.SchemaVersion != "" && req.Design.SchemaVersion != DesignSchemaVersion {
		return "", nil, fmt.Errorf("%w: unsupported design schemaVersion %q", ErrInvalidRequest, req.Design.SchemaVersion)
	}

	// Apply default values from design configuration
	req.Design = req.Design.ApplyDefaults()

	payloadStr, err := EncodePayload(req.Payload.Kind, req.Payload.Payload)
	if err != nil {
		return "", nil, fmt.Errorf("%w: %v", ErrInvalidRequest, err)
	}

	level := qr.L
	switch req.Design.ErrorCorrectionLevel {
	case "M":
		level = qr.M
	case "Q":
		level = qr.Q
	case "H":
		level = qr.H
	}

	encoded, err := qr.Encode(payloadStr, level, qr.Auto)
	if err != nil {
		return "", nil, fmt.Errorf("generate qr: %w", err)
	}

	return payloadStr, encoded, nil
}
