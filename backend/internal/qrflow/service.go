package qrflow

import (
	"bytes"
	"encoding/base64"
	"errors"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"net/url"
	"strconv"
	"strings"

	"github.com/boombuler/barcode"
	"github.com/boombuler/barcode/qr"
)

const (
	PayloadSchemaVersion  = "qurl.qr-payload-config.v1"
	ProjectSchemaVersion  = "qurl.qr-project-config.v1"
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
)

type ProjectConfig struct {
	SchemaVersion string        `json:"schemaVersion"`
	Payload       PayloadConfig `json:"payload"`
	Export        ExportConfig  `json:"export"`
}

type PayloadConfig struct {
	SchemaVersion string           `json:"schemaVersion"`
	Kind          string           `json:"kind"`
	Payload       DirectURLPayload `json:"payload"`
}

type DirectURLPayload struct {
	DestinationURL string `json:"destinationUrl"`
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

	normalized, qrImage, err := s.generate(req, size)
	if err != nil {
		return PreviewResponse{}, err
	}

	svgBytes, err := renderSVG(qrImage)
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

	normalized, qrImage, err := s.generate(req, size)
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
		svgBytes, err := renderSVG(qrImage)
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
	case FormatPNG:
		var buf bytes.Buffer
		if err := png.Encode(&buf, qrImage); err != nil {
			return ExportResponse{}, err
		}

		return ExportResponse{
			SchemaVersion: ResponseSchemaVersion,
			Destination:   normalized,
			Format:        FormatPNG,
			MimeType:      "image/png",
			Filename:      filename,
			Bytes:         buf.Bytes(),
		}, nil
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

func (s *Service) generate(req ProjectConfig, size int) (string, image.Image, error) {
	if req.SchemaVersion != ProjectSchemaVersion {
		return "", nil, fmt.Errorf("%w: unsupported schemaVersion %q", ErrInvalidRequest, req.SchemaVersion)
	}
	if req.Payload.SchemaVersion != PayloadSchemaVersion {
		return "", nil, fmt.Errorf("%w: unsupported payload schemaVersion %q", ErrInvalidRequest, req.Payload.SchemaVersion)
	}
	if req.Payload.Kind != "url" {
		return "", nil, fmt.Errorf("%w: unsupported payload kind %q", ErrInvalidRequest, req.Payload.Kind)
	}
	if req.Export.SchemaVersion != ExportSchemaVersion {
		return "", nil, fmt.Errorf("%w: unsupported export schemaVersion %q", ErrInvalidRequest, req.Export.SchemaVersion)
	}

	parsed, err := ValidateDestination(req.Payload.Payload.DestinationURL)
	if err != nil {
		return "", nil, err
	}

	encoded, err := qr.Encode(parsed.String(), qr.M, qr.Auto)
	if err != nil {
		return "", nil, fmt.Errorf("generate qr: %w", err)
	}

	scaled, err := barcode.Scale(encoded, size, size)
	if err != nil {
		return "", nil, fmt.Errorf("scale qr: %w", err)
	}

	return parsed.String(), scaled, nil
}

func renderSVG(img image.Image) ([]byte, error) {
	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	var buf strings.Builder
	buf.Grow(width * height / 2)
	buf.WriteString(`<?xml version="1.0" encoding="UTF-8"?>`)
	buf.WriteString(`<svg xmlns="http://www.w3.org/2000/svg"`)
	buf.WriteString(` viewBox="0 0 `)
	buf.WriteString(strconv.Itoa(width))
	buf.WriteString(` `)
	buf.WriteString(strconv.Itoa(height))
	buf.WriteString(`" width="`)
	buf.WriteString(strconv.Itoa(width))
	buf.WriteString(`" height="`)
	buf.WriteString(strconv.Itoa(height))
	buf.WriteString(`" shape-rendering="crispEdges">`)
	buf.WriteString(`<rect width="100%" height="100%" fill="#ffffff"/>`)

	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		runStart := -1
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			if isDark(img.At(x, y)) {
				if runStart == -1 {
					runStart = x
				}
				continue
			}

			if runStart != -1 {
				writeSVGRect(&buf, runStart-bounds.Min.X, y-bounds.Min.Y, x-runStart, 1)
				runStart = -1
			}
		}

		if runStart != -1 {
			writeSVGRect(&buf, runStart-bounds.Min.X, y-bounds.Min.Y, bounds.Max.X-runStart, 1)
		}
	}

	buf.WriteString(`</svg>`)
	return []byte(buf.String()), nil
}

func writeSVGRect(buf *strings.Builder, x, y, width, height int) {
	buf.WriteString(`<rect x="`)
	buf.WriteString(strconv.Itoa(x))
	buf.WriteString(`" y="`)
	buf.WriteString(strconv.Itoa(y))
	buf.WriteString(`" width="`)
	buf.WriteString(strconv.Itoa(width))
	buf.WriteString(`" height="`)
	buf.WriteString(strconv.Itoa(height))
	buf.WriteString(`" fill="#000000"/>`)
}

func isDark(c color.Color) bool {
	r, g, b, _ := c.RGBA()
	return r+g+b < 0x18000
}
