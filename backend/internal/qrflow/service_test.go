package qrflow

import (
	"bytes"
	"image/png"
	"regexp"
	"strconv"
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

func TestPreviewInjectsQRIntoComplexFrameTemplate(t *testing.T) {
	t.Parallel()

	svc := New()
	req := testProjectConfig("https://example.com/frame", FormatSVG, 320)
	req.Design = DesignConfig{
		SchemaVersion:        DesignSchemaVersion,
		ForegroundColor:      "#355f5d",
		BackgroundColor:      "#ffffff",
		ErrorCorrectionLevel: "H",
		QuietZoneModules:     4,
		ModuleStyle:          "dot",
		EyeStyle:             "square",
		Sticker: &StickerConfig{
			Style: "coffee-cup",
			Color: "#005244",
		},
	}

	resp, err := svc.Preview(req)
	if err != nil {
		t.Fatalf("Preview error: %v", err)
	}

	if !strings.Contains(resp.SVG, `id="qr-mount"`) {
		t.Fatalf("template preview did not include qr mount: %s", resp.SVG)
	}
	if !strings.Contains(resp.SVG, "M20 21H70") {
		t.Fatalf("template preview did not include coffee cup frame")
	}
}

func TestNoFramePreviewKeepsQRCodeCoreScanSafe(t *testing.T) {
	t.Parallel()

	svc := New()
	req := testProjectConfig("https://example.com/scan-safe", FormatSVG, 320)
	req.Design = DesignConfig{
		SchemaVersion:        DesignSchemaVersion,
		ForegroundColor:      "#355f5d",
		BackgroundColor:      "#ffffff",
		ErrorCorrectionLevel: "H",
		QuietZoneModules:     4,
		ModuleStyle:          "square",
		EyeStyle:             "square",
	}

	resp, err := svc.Preview(req)
	if err != nil {
		t.Fatalf("Preview error: %v", err)
	}

	if !strings.Contains(resp.SVG, `shape-rendering="crispEdges"`) {
		t.Fatalf("scan-safe QR core did not request crisp SVG rendering: %s", resp.SVG)
	}
	if !strings.Contains(resp.SVG, `<rect x="0" y="0" width="7" height="1"/>`) {
		t.Fatalf("scan-safe QR core did not include the raw finder matrix row: %s", resp.SVG)
	}
	if strings.Contains(resp.SVG, `<circle`) || strings.Contains(resp.SVG, `<path`) {
		t.Fatalf("no-frame QR core used decorative geometry instead of raw matrix rectangles: %s", resp.SVG)
	}
}

func TestCustomCornerMarkersOnlyReplaceFinderBlocks(t *testing.T) {
	t.Parallel()

	svc := New()
	req := testProjectConfig("https://example.com/custom-markers", FormatSVG, 320)
	req.Design = DesignConfig{
		SchemaVersion:        DesignSchemaVersion,
		ForegroundColor:      "#355f5d",
		BackgroundColor:      "#ffffff",
		ErrorCorrectionLevel: "H",
		QuietZoneModules:     4,
		ModuleStyle:          "square",
		EyeStyle:             "leaf",
	}

	resp, err := svc.Preview(req)
	if err != nil {
		t.Fatalf("Preview error: %v", err)
	}

	if !strings.Contains(resp.SVG, `<rect x="0" y="0" width="7" height="7" fill="#ffffff"/>`) {
		t.Fatalf("custom marker preview did not isolate the finder block before drawing marker: %s", resp.SVG)
	}
	if !strings.Contains(resp.SVG, `<path d="`) {
		t.Fatalf("custom marker preview did not draw the selected marker shape: %s", resp.SVG)
	}
	if !strings.Contains(resp.SVG, `shape-rendering="geometricPrecision" transform="translate(0,0)"`) {
		t.Fatalf("custom marker preview did not render marker curves precisely: %s", resp.SVG)
	}
	for _, insetGeometry := range []string{"0.45", "6.1", "1.45", "4.1", "2.55"} {
		if strings.Contains(resp.SVG, insetGeometry) {
			t.Fatalf("custom marker preview used shrunken finder geometry %q: %s", insetGeometry, resp.SVG)
		}
	}
	if strings.Contains(resp.SVG, `<circle`) {
		t.Fatalf("data modules used decorative dot geometry instead of the shared raw matrix path: %s", resp.SVG)
	}
}

func TestRoundedCornerMarkersUsePreciseCurveRendering(t *testing.T) {
	t.Parallel()

	svc := New()
	req := testProjectConfig("https://example.com/rounded-markers", FormatSVG, 320)
	req.Design = DesignConfig{
		SchemaVersion:        DesignSchemaVersion,
		ForegroundColor:      "#355f5d",
		BackgroundColor:      "#ffffff",
		ErrorCorrectionLevel: "H",
		QuietZoneModules:     4,
		ModuleStyle:          "square",
		EyeStyle:             "rounded",
	}

	resp, err := svc.Preview(req)
	if err != nil {
		t.Fatalf("Preview error: %v", err)
	}

	if !strings.Contains(resp.SVG, `shape-rendering="geometricPrecision" transform="translate(0,0)"`) {
		t.Fatalf("rounded marker preview did not use precise curve rendering: %s", resp.SVG)
	}
	if !strings.Contains(resp.SVG, `M1.680 0.000`) {
		t.Fatalf("rounded marker preview did not keep high-precision marker geometry: %s", resp.SVG)
	}
}

func TestDataPatternUsesSelectedModuleStyleOutsideFinderBlocks(t *testing.T) {
	t.Parallel()

	svc := New()
	tests := []struct {
		style string
		want  string
	}{
		{style: "dot", want: `<circle cx="`},
		{style: "rounded", want: `shape-rendering="geometricPrecision"`},
		{style: "heart", want: `shape-rendering="geometricPrecision" transform=`},
		{style: "spade", want: `shape-rendering="geometricPrecision" transform=`},
		{style: "club", want: `shape-rendering="geometricPrecision"`},
		{style: "star", want: `shape-rendering="geometricPrecision" d="M`},
		{style: "triangle", want: `shape-rendering="geometricPrecision" d="M`},
		{style: "hexagon", want: `shape-rendering="geometricPrecision" d="M`},
		{style: "pentagon", want: `shape-rendering="geometricPrecision" d="M`},
		{style: "twinkle", want: `shape-rendering="geometricPrecision" d="M`},
		{style: "x", want: `shape-rendering="geometricPrecision" d="M`},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.style, func(t *testing.T) {
			t.Parallel()

			req := testProjectConfig("https://example.com/data-pattern-"+tc.style, FormatSVG, 320)
			req.Design = DesignConfig{
				SchemaVersion:        DesignSchemaVersion,
				ForegroundColor:      "#355f5d",
				BackgroundColor:      "#ffffff",
				ErrorCorrectionLevel: "H",
				QuietZoneModules:     4,
				ModuleStyle:          tc.style,
				EyeStyle:             "square",
			}

			resp, err := svc.Preview(req)
			if err != nil {
				t.Fatalf("Preview error: %v", err)
			}

			if !strings.Contains(resp.SVG, `<rect x="0" y="0" width="7" height="1"/>`) {
				t.Fatalf("finder modules were not kept as raw matrix rows: %s", resp.SVG)
			}
			if !strings.Contains(resp.SVG, tc.want) {
				t.Fatalf("data pattern %q did not render selected module geometry %q: %s", tc.style, tc.want, resp.SVG)
			}
		})
	}
}

func TestFramedPreviewsUseSameScanSafeQRCodeCore(t *testing.T) {
	t.Parallel()

	svc := New()
	frames := []string{"circle", "rounded-square", "acorn", "coffee-cup"}
	for _, frame := range frames {
		frame := frame
		t.Run(frame, func(t *testing.T) {
			t.Parallel()

			req := testProjectConfig("https://example.com/"+frame, FormatSVG, 320)
			req.Design = DesignConfig{
				SchemaVersion:        DesignSchemaVersion,
				ForegroundColor:      "#355f5d",
				BackgroundColor:      "#ffffff",
				ErrorCorrectionLevel: "H",
				QuietZoneModules:     4,
				ModuleStyle:          "dot",
				EyeStyle:             "square",
				Sticker: &StickerConfig{
					Style: frame,
					Color: "#005244",
				},
			}

			resp, err := svc.Preview(req)
			if err != nil {
				t.Fatalf("Preview error: %v", err)
			}

			if !strings.Contains(resp.SVG, `shape-rendering="crispEdges"`) {
				t.Fatalf("framed preview did not use the shared scan-safe QR core: %s", resp.SVG)
			}
			if !strings.Contains(resp.SVG, `<rect x="0" y="0" width="7" height="1"/>`) {
				t.Fatalf("framed preview did not include the raw finder matrix row: %s", resp.SVG)
			}
		})
	}
}

func TestDecorativeFillUsesSelectedModuleStyle(t *testing.T) {
	t.Parallel()

	svc := New()
	for _, style := range []string{"square", "heart", "hexagon", "twinkle"} {
		style := style
		t.Run(style, func(t *testing.T) {
			t.Parallel()

			req := testProjectConfig("https://example.com/decorative-"+style, FormatSVG, 320)
			req.Design = DesignConfig{
				SchemaVersion:        DesignSchemaVersion,
				ForegroundColor:      "#355f5d",
				BackgroundColor:      "#ffffff",
				ErrorCorrectionLevel: "H",
				QuietZoneModules:     4,
				ModuleStyle:          style,
				EyeStyle:             "square",
				Sticker: &StickerConfig{
					Style: "circle",
					Color: "#005244",
				},
			}

			resp, err := svc.Preview(req)
			if err != nil {
				t.Fatalf("Preview error: %v", err)
			}

			want := `id="qurl-decorative-fill" data-module-style="` + style + `"`
			if !strings.Contains(resp.SVG, want) {
				t.Fatalf("decorative fill did not use selected module style %q: %s", style, resp.SVG)
			}
		})
	}
}

func TestPreviewRendersUploadedImageLogo(t *testing.T) {
	t.Parallel()

	svc := New()
	req := testProjectConfig("https://example.com/logo", FormatSVG, 320)
	req.Design = DesignConfig{
		SchemaVersion:        DesignSchemaVersion,
		ForegroundColor:      "#355f5d",
		BackgroundColor:      "#ffffff",
		ErrorCorrectionLevel: "H",
		QuietZoneModules:     4,
		ModuleStyle:          "dot",
		EyeStyle:             "square",
		Logo: &LogoConfig{
			Mode:      "image",
			AssetRef:  "data:image/png;base64,iVBORw0KGgo=",
			Shape:     "circle",
			SizeRatio: 0.22,
		},
	}

	resp, err := svc.Preview(req)
	if err != nil {
		t.Fatalf("Preview error: %v", err)
	}

	if !strings.Contains(resp.SVG, `id="qurl-logo"`) {
		t.Fatalf("logo preview did not include logo group: %s", resp.SVG)
	}
	if !strings.Contains(resp.SVG, `href="data:image/png;base64,iVBORw0KGgo="`) {
		t.Fatalf("logo preview did not include uploaded image")
	}
}

func TestPreviewRendersUploadedSVGLogo(t *testing.T) {
	t.Parallel()

	svc := New()
	req := testProjectConfig("https://example.com/logo", FormatSVG, 320)
	req.Design = DesignConfig{
		SchemaVersion:        DesignSchemaVersion,
		ForegroundColor:      "#355f5d",
		BackgroundColor:      "#ffffff",
		ErrorCorrectionLevel: "H",
		QuietZoneModules:     4,
		ModuleStyle:          "dot",
		EyeStyle:             "square",
		Logo: &LogoConfig{
			Mode:      "image",
			AssetRef:  "data:image/svg+xml;base64,PHN2Zy8+",
			Shape:     "circle",
			SizeRatio: 0.22,
		},
	}

	resp, err := svc.Preview(req)
	if err != nil {
		t.Fatalf("Preview error: %v", err)
	}

	if !strings.Contains(resp.SVG, `id="qurl-logo"`) {
		t.Fatalf("svg logo preview did not include logo group: %s", resp.SVG)
	}
	if !strings.Contains(resp.SVG, `href="data:image/svg+xml;base64,PHN2Zy8+"`) {
		t.Fatalf("svg logo preview did not include uploaded svg image")
	}
}

func TestLogoBackingUsesTwoPixelBorder(t *testing.T) {
	t.Parallel()

	svc := New()
	req := testProjectConfig("https://example.com/logo-border", FormatSVG, 320)
	req.Design = DesignConfig{
		SchemaVersion:        DesignSchemaVersion,
		ForegroundColor:      "#355f5d",
		BackgroundColor:      "#ffffff",
		ErrorCorrectionLevel: "H",
		QuietZoneModules:     4,
		ModuleStyle:          "dot",
		EyeStyle:             "square",
		Logo: &LogoConfig{
			Mode:      "image",
			AssetRef:  "data:image/svg+xml;base64,PHN2Zy8+",
			Shape:     "circle",
			SizeRatio: 0.22,
		},
	}

	resp, err := svc.Preview(req)
	if err != nil {
		t.Fatalf("Preview error: %v", err)
	}

	viewBox := regexp.MustCompile(`viewBox="0 0 ([\d.]+) ([\d.]+)" width="(\d+)"`).FindStringSubmatch(resp.SVG)
	circle := regexp.MustCompile(`<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)" fill="#ffffff"/>`).FindStringSubmatch(resp.SVG)
	image := regexp.MustCompile(`<image href="[^"]+" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"`).FindStringSubmatch(resp.SVG)
	if len(viewBox) != 4 || len(circle) != 4 || len(image) != 5 {
		t.Fatalf("logo preview did not include measurable backing/image geometry: %s", resp.SVG)
	}

	scale := mustParseFloat(t, viewBox[3]) / mustParseFloat(t, viewBox[1])
	cx := mustParseFloat(t, circle[1])
	radius := mustParseFloat(t, circle[3])
	imageX := mustParseFloat(t, image[1])
	borderPixels := (imageX - (cx - radius)) * scale
	if borderPixels < 1.95 || borderPixels > 2.05 {
		t.Fatalf("logo border = %.3f px, want 2px", borderPixels)
	}
}

func TestExportPNGReturnsValidImageBytes(t *testing.T) {
	t.Parallel()

	svc := New()
	req := testProjectConfig("https://example.com/download", FormatPNG, 256)
	resp, err := svc.Export(req)
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

	decoded, err := png.Decode(bytes.NewReader(resp.Bytes))
	if err != nil {
		t.Fatalf("png decode: %v", err)
	}

	_, bc, err := svc.generate(req)
	if err != nil {
		t.Fatalf("generate qr: %v", err)
	}
	quiet := 4
	scale := decoded.Bounds().Dx() / (bc.Bounds().Dx() + quiet*2)
	if isDark(decoded.At(0, 0)) {
		t.Fatal("png export should keep the canvas edge clear")
	}
	if !isDark(decoded.At(quiet*scale, quiet*scale)) {
		t.Fatal("png export did not place the raw QR matrix after the clear edge")
	}
}

func TestExportPNGRejectsComplexFrameTemplates(t *testing.T) {
	t.Parallel()

	svc := New()
	req := testProjectConfig("https://example.com/download", FormatPNG, 256)
	req.Design = DesignConfig{
		SchemaVersion: DesignSchemaVersion,
		Sticker:       &StickerConfig{Style: "shopping-bag"},
	}

	if _, err := svc.Export(req); err == nil {
		t.Fatal("expected complex frame PNG export error")
	}
}

func TestExportPNGRejectsUploadedImageLogo(t *testing.T) {
	t.Parallel()

	svc := New()
	req := testProjectConfig("https://example.com/download", FormatPNG, 256)
	req.Design = DesignConfig{
		SchemaVersion: DesignSchemaVersion,
		Logo: &LogoConfig{
			Mode:     "image",
			AssetRef: "data:image/png;base64,iVBORw0KGgo=",
		},
	}

	if _, err := svc.Export(req); err == nil {
		t.Fatal("expected uploaded logo PNG export error")
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

func TestPreviewRejectsUnsupportedErrorCorrectionLevel(t *testing.T) {
	t.Parallel()

	svc := New()
	req := testProjectConfig("https://example.com/error-correction", FormatSVG, 256)
	req.Design = DesignConfig{
		SchemaVersion:        DesignSchemaVersion,
		ErrorCorrectionLevel: "maximum-ish",
	}

	_, err := svc.Preview(req)
	if err == nil {
		t.Fatal("expected error correction level error")
	}
	if !strings.Contains(err.Error(), "unsupported errorCorrectionLevel") {
		t.Fatalf("expected error correction level error, got %v", err)
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
			Payload:       []byte(`{"destinationUrl":"` + destination + `"}`),
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

func mustParseFloat(t *testing.T, value string) float64 {
	t.Helper()
	parsed, err := strconv.ParseFloat(value, 64)
	if err != nil {
		t.Fatalf("parse float %q: %v", value, err)
	}
	return parsed
}
