package qrflow

import (
	"bytes"
	"embed"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/jpeg"
	"image/png"
	"math"
	"strconv"
	"strings"

	"github.com/boombuler/barcode"
)

//go:embed frames/*.svg
var frameAssets embed.FS

// parseHexColor parses a hex string like "#142127" into a color.RGBA
func parseHexColor(s string) (color.RGBA, error) {
	c := color.RGBA{A: 255}
	s = strings.TrimPrefix(s, "#")
	switch len(s) {
	case 6: // RGB
		_, err := fmt.Sscanf(s, "%02x%02x%02x", &c.R, &c.G, &c.B)
		return c, err
	case 8: // RGBA
		_, err := fmt.Sscanf(s, "%02x%02x%02x%02x", &c.R, &c.G, &c.B, &c.A)
		return c, err
	}
	return c, fmt.Errorf("invalid hex color string")
}

// renderAdvancedSVG maps the unscaled QR barcode directly into efficient SVG primitives
func renderAdvancedSVG(bc barcode.Barcode, design DesignConfig, targetPixelSize int) ([]byte, error) {
	design = design.ApplyDefaults()
	if template, ok := frameTemplateForDesign(design); ok {
		return renderTemplateSVG(bc, design, template, targetPixelSize), nil
	}

	if isCircleSticker(design) {
		return renderCircleSVG(bc, design, targetPixelSize), nil
	}
	if isRoundedSquareSticker(design) {
		return renderRoundedSquareSVG(bc, design, targetPixelSize), nil
	}
	// Acorn uses the same fill approach as circle (not the template system)
	if isAcornSticker(design) {
		return renderAcornSVG(bc, design, targetPixelSize), nil
	}

	bounds := bc.Bounds()
	mods := bounds.Dx()

	bg := design.BackgroundColor
	if bg == "" {
		bg = "#ffffff"
	}

	quiet := design.QuietZoneModules
	if quiet <= 0 {
		quiet = 4
	}
	canvasMods := mods + (quiet * 2)
	offset := float64(quiet)
	contentScale := 1.0

	var buf strings.Builder
	buf.Grow(mods * mods * 20)

	buf.WriteString(`<?xml version="1.0" encoding="UTF-8"?>`)
	buf.WriteString(`<svg xmlns="http://www.w3.org/2000/svg"`)
	buf.WriteString(` viewBox="0 0 `)
	buf.WriteString(strconv.Itoa(canvasMods))
	buf.WriteString(` `)
	buf.WriteString(strconv.Itoa(canvasMods))
	buf.WriteString(`" width="`)
	buf.WriteString(strconv.Itoa(targetPixelSize))
	buf.WriteString(`" height="`)
	buf.WriteString(strconv.Itoa(targetPixelSize))
	buf.WriteString(`" role="img" aria-label="QR code">`)

	if !design.BackgroundTransparent {
		buf.WriteString(fmt.Sprintf(`<rect width="100%%" height="100%%" fill="%s"/>`, bg))
	}

	writeTransformedQRCoreSVG(&buf, bc, design, offset, offset, contentScale)
	writeLogoOverlay(&buf, float64(canvasMods)/2, float64(canvasMods)/2, float64(mods), design, targetPixelSize, float64(canvasMods))
	buf.WriteString(`</svg>`)
	return []byte(buf.String()), nil
}

func renderCircleSVG(bc barcode.Barcode, design DesignConfig, targetPixelSize int) []byte {
	bounds := bc.Bounds()
	mods := bounds.Dx()
	bg := design.BackgroundColor
	if bg == "" {
		bg = "#ffffff"
	}
	fg := design.ForegroundColor
	if fg == "" {
		fg = "#000000"
	}
	quiet := design.QuietZoneModules
	if quiet <= 0 {
		quiet = 4
	}
	canvasMods := mods + (quiet * 2) + 2
	innerRadius := float64(canvasMods)/2 - 1.35
	safeSquare := (innerRadius * 2) / math.Sqrt2
	contentScale := safeSquare / float64(mods)
	offset := (float64(canvasMods) - (float64(mods) * contentScale)) / 2

	var buf strings.Builder
	buf.WriteString(`<?xml version="1.0" encoding="UTF-8"?>`)
	buf.WriteString(fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" role="img" aria-label="QR code">`, canvasMods, canvasMods, targetPixelSize, targetPixelSize))
	if !design.BackgroundTransparent {
		buf.WriteString(fmt.Sprintf(`<rect width="100%%" height="100%%" fill="%s"/>`, bg))
	}

	radius := float64(canvasMods)/2 - 0.85
	buf.WriteString(fmt.Sprintf(`<defs><clipPath id="qurl-circle-content"><circle cx="%.3f" cy="%.3f" r="%.3f"/></clipPath></defs>`, float64(canvasMods)/2, float64(canvasMods)/2, radius))
	buf.WriteString(`<g clip-path="url(#qurl-circle-content)">`)
	drawDecorativeShapeFill(&buf, canvasMods, offset, offset, contentScale, mods, design)

	writeTransformedQRCoreSVG(&buf, bc, design, offset, offset, contentScale)
	buf.WriteString(`</g>`)
	writeLogoOverlay(&buf, float64(canvasMods)/2, float64(canvasMods)/2, float64(mods)*contentScale, design, targetPixelSize, float64(canvasMods))

	stickerColor := fg
	if design.Sticker != nil && design.Sticker.Color != "" {
		stickerColor = design.Sticker.Color
	}
	if design.Frame != nil && design.Frame.Color != "" {
		stickerColor = design.Frame.Color
	}
	buf.WriteString(fmt.Sprintf(`<circle cx="%.3f" cy="%.3f" r="%.3f" fill="none" stroke="%s" stroke-width="1.1"/>`, float64(canvasMods)/2, float64(canvasMods)/2, radius, stickerColor))
	buf.WriteString(`</svg>`)
	return []byte(buf.String())
}

func renderRoundedSquareSVG(bc barcode.Barcode, design DesignConfig, targetPixelSize int) []byte {
	bounds := bc.Bounds()
	mods := bounds.Dx()
	bg := design.BackgroundColor
	if bg == "" {
		bg = "#ffffff"
	}
	fg := design.ForegroundColor
	if fg == "" {
		fg = "#000000"
	}
	quiet := design.QuietZoneModules
	if quiet <= 0 {
		quiet = 4
	}
	canvasMods := mods + (quiet * 2) + 2

	safeSide := float64(canvasMods) * 0.82
	contentScale := safeSide / float64(mods)
	offset := (float64(canvasMods) - (float64(mods) * contentScale)) / 2

	var buf strings.Builder
	buf.WriteString(`<?xml version="1.0" encoding="UTF-8"?>`)
	buf.WriteString(fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" role="img" aria-label="QR code">`, canvasMods, canvasMods, targetPixelSize, targetPixelSize))
	if !design.BackgroundTransparent {
		buf.WriteString(fmt.Sprintf(`<rect width="100%%" height="100%%" fill="%s"/>`, bg))
	}

	frameMargin := 1.2
	frameSize := float64(canvasMods) - (frameMargin * 2)
	cornerRadius := frameSize * 0.15

	buf.WriteString(fmt.Sprintf(`<defs><clipPath id="qurl-rounded-content"><rect x="%.3f" y="%.3f" width="%.3f" height="%.3f" rx="%.3f"/></clipPath></defs>`, frameMargin, frameMargin, frameSize, frameSize, cornerRadius))
	buf.WriteString(`<g clip-path="url(#qurl-rounded-content)">`)
	drawDecorativeShapeFill(&buf, canvasMods, offset, offset, contentScale, mods, design)

	writeTransformedQRCoreSVG(&buf, bc, design, offset, offset, contentScale)
	buf.WriteString(`</g>`)
	writeLogoOverlay(&buf, float64(canvasMods)/2, float64(canvasMods)/2, float64(mods)*contentScale, design, targetPixelSize, float64(canvasMods))

	stickerColor := fg
	if design.Sticker != nil && design.Sticker.Color != "" {
		stickerColor = design.Sticker.Color
	}
	if design.Frame != nil && design.Frame.Color != "" {
		stickerColor = design.Frame.Color
	}
	buf.WriteString(fmt.Sprintf(`<rect x="%.3f" y="%.3f" width="%.3f" height="%.3f" rx="%.3f" fill="none" stroke="%s" stroke-width="1.1"/>`, frameMargin, frameMargin, frameSize, frameSize, cornerRadius, stickerColor))
	buf.WriteString(`</svg>`)
	return []byte(buf.String())
}

func writeQRCoreSVGOnly(buf *strings.Builder, bc barcode.Barcode, design DesignConfig) {
	bounds := bc.Bounds()
	mods := bounds.Dx()
	customMarkers := hasCustomCornerMarkers(design)
	moduleStyle := design.ModuleStyle
	usePatternedDataModules := moduleStyle != "" && moduleStyle != "square"

	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		runStart := -1
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			isFinder := isFinderModule(x, y, mods)
			if customMarkers && isFinder {
				if runStart != -1 {
					writeMatrixRun(buf, runStart, y, x-runStart)
					runStart = -1
				}
				continue
			}

			if isDark(bc.At(x, y)) {
				if usePatternedDataModules && !isFinder {
					if runStart != -1 {
						writeMatrixRun(buf, runStart, y, x-runStart)
						runStart = -1
					}
					writeBodyShape(buf, x, y, moduleStyle)
					continue
				}
				if runStart == -1 {
					runStart = x
				}
				continue
			}

			if runStart != -1 {
				writeMatrixRun(buf, runStart, y, x-runStart)
				runStart = -1
			}
		}
		if runStart != -1 {
			writeMatrixRun(buf, runStart, y, bounds.Max.X-runStart)
		}
	}

	if customMarkers {
		drawCornerMarkers(buf, design, mods)
	}
}

func writeTransformedQRCoreSVG(buf *strings.Builder, bc barcode.Barcode, design DesignConfig, offsetX, offsetY, scale float64) {
	fg := design.ForegroundColor
	if fg == "" {
		fg = "#000000"
	}
	buf.WriteString(fmt.Sprintf(`<g fill="%s" color="%s" shape-rendering="crispEdges" transform="translate(%.3f,%.3f) scale(%.5f)">`, fg, fg, offsetX, offsetY, scale))
	writeQRCoreSVGOnly(buf, bc, design)
	buf.WriteString(`</g>`)
}

func writeMatrixRun(buf *strings.Builder, x, y, width int) {
	buf.WriteString(fmt.Sprintf(`<rect x="%d" y="%d" width="%d" height="1"/>`, x, y, width))
}

func hasCustomCornerMarkers(design DesignConfig) bool {
	return normalizeEyeStyle(eyeStyle(design, "top-left"), "top-left") != "square" ||
		normalizeEyeStyle(eyeStyle(design, "top-right"), "top-right") != "square" ||
		normalizeEyeStyle(eyeStyle(design, "bottom-left"), "bottom-left") != "square"
}

func isFinderModule(x, y, mods int) bool {
	return (x < 7 && y < 7) || (x >= mods-7 && y < 7) || (x < 7 && y >= mods-7)
}

func drawCornerMarkers(buf *strings.Builder, design DesignConfig, mods int) {
	clearFinderArea(buf, 0, 0, design)
	clearFinderArea(buf, mods-7, 0, design)
	clearFinderArea(buf, 0, mods-7, design)
	drawEye(buf, 0, 0, design, "top-left")
	drawEye(buf, mods-7, 0, design, "top-right")
	drawEye(buf, 0, mods-7, design, "bottom-left")
}

func clearFinderArea(buf *strings.Builder, x, y int, design DesignConfig) {
	bg := design.BackgroundColor
	if bg == "" {
		bg = "#ffffff"
	}
	buf.WriteString(fmt.Sprintf(`<rect x="%d" y="%d" width="7" height="7" fill="%s"/>`, x, y, bg))
}

// writeSVGRx writes the appropriate SVG module geometry
func writeSVGRx(buf *strings.Builder, x, y, width int, style string) {
	if style == "" || style == "square" {
		buf.WriteString(fmt.Sprintf(`<rect x="%d" y="%d" width="%d" height="1"/>`, x, y, width))
		return
	}

	for i := 0; i < width; i++ {
		writeBodyShape(buf, x+i, y, style)
	}
}

func writeBodyShape(buf *strings.Builder, x, y int, style string) {
	fx := float64(x)
	fy := float64(y)
	switch style {
	case "rounded":
		buf.WriteString(fmt.Sprintf(`<rect x="%.3f" y="%.3f" width="0.86" height="0.86" rx="0.20" ry="0.20" shape-rendering="geometricPrecision"/>`, fx+0.07, fy+0.07))
	case "dot":
		buf.WriteString(fmt.Sprintf(`<circle cx="%.3f" cy="%.3f" r="0.42" shape-rendering="geometricPrecision"/>`, fx+0.5, fy+0.5))
	case "heart":
		buf.WriteString(fmt.Sprintf(`<path shape-rendering="geometricPrecision" transform="translate(%.3f %.3f)" d="M0.5 0.86C0.14 0.58 0.06 0.32 0.22 0.17C0.35 0.05 0.48 0.12 0.5 0.27C0.52 0.12 0.65 0.05 0.78 0.17C0.94 0.32 0.86 0.58 0.5 0.86Z"/>`, fx, fy))
	case "diamond":
		buf.WriteString(fmt.Sprintf(`<path d="M%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fZ"/>`, fx+0.5, fy+0.08, fx+0.92, fy+0.5, fx+0.5, fy+0.92, fx+0.08, fy+0.5))
	case "spade":
		buf.WriteString(fmt.Sprintf(`<path shape-rendering="geometricPrecision" transform="translate(%.3f %.3f)" d="M0.5 0.08C0.16 0.34 0.04 0.58 0.22 0.72C0.34 0.82 0.48 0.72 0.5 0.58C0.52 0.72 0.66 0.82 0.78 0.72C0.96 0.58 0.84 0.34 0.5 0.08Z"/><path shape-rendering="geometricPrecision" transform="translate(%.3f %.3f)" d="M0.43 0.62H0.57L0.68 0.92H0.32Z"/>`, fx, fy, fx, fy))
	case "club":
		buf.WriteString(fmt.Sprintf(`<circle cx="%.3f" cy="%.3f" r="0.22" shape-rendering="geometricPrecision"/><circle cx="%.3f" cy="%.3f" r="0.22" shape-rendering="geometricPrecision"/><circle cx="%.3f" cy="%.3f" r="0.22" shape-rendering="geometricPrecision"/><path shape-rendering="geometricPrecision" d="M%.3f %.3fL%.3f %.3fL%.3f %.3fZ"/>`, fx+0.5, fy+0.28, fx+0.3, fy+0.58, fx+0.7, fy+0.58, fx+0.5, fy+0.54, fx+0.34, fy+0.9, fx+0.66, fy+0.9))
	case "star":
		buf.WriteString(fmt.Sprintf(`<path shape-rendering="geometricPrecision" d="M%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fZ"/>`, fx+0.5, fy+0.08, fx+0.61, fy+0.36, fx+0.91, fy+0.36, fx+0.67, fy+0.54, fx+0.76, fy+0.84, fx+0.5, fy+0.66, fx+0.24, fy+0.84, fx+0.33, fy+0.54, fx+0.09, fy+0.36, fx+0.39, fy+0.36))
	case "triangle":
		buf.WriteString(fmt.Sprintf(`<path shape-rendering="geometricPrecision" d="M%.3f %.3fL%.3f %.3fL%.3f %.3fZ"/>`, fx+0.5, fy+0.12, fx+0.9, fy+0.86, fx+0.1, fy+0.86))
	case "hexagon":
		buf.WriteString(fmt.Sprintf(`<path shape-rendering="geometricPrecision" d="M%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fZ"/>`, fx+0.28, fy+0.1, fx+0.72, fy+0.1, fx+0.94, fy+0.5, fx+0.72, fy+0.9, fx+0.28, fy+0.9, fx+0.06, fy+0.5))
	case "pentagon":
		buf.WriteString(fmt.Sprintf(`<path shape-rendering="geometricPrecision" d="M%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fZ"/>`, fx+0.5, fy+0.08, fx+0.92, fy+0.4, fx+0.76, fy+0.9, fx+0.24, fy+0.9, fx+0.08, fy+0.4))
	case "x":
		buf.WriteString(fmt.Sprintf(`<path shape-rendering="geometricPrecision" d="M%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fZ"/>`, fx+0.16, fy+0.07, fx+0.5, fy+0.39, fx+0.84, fy+0.07, fx+0.93, fy+0.16, fx+0.61, fy+0.5, fx+0.93, fy+0.84, fx+0.84, fy+0.93, fx+0.5, fy+0.61, fx+0.16, fy+0.93, fx+0.07, fy+0.84, fx+0.39, fy+0.5, fx+0.07, fy+0.16))
	case "o":
		buf.WriteString(fmt.Sprintf(`<circle cx="%.3f" cy="%.3f" r="0.36" fill="none" stroke="currentColor" stroke-width="0.16" shape-rendering="geometricPrecision"/>`, fx+0.5, fy+0.5))
	case "twinkle":
		buf.WriteString(fmt.Sprintf(`<path shape-rendering="geometricPrecision" d="M%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fL%.3f %.3fZ"/>`, fx+0.5, fy+0.06, fx+0.6, fy+0.4, fx+0.94, fy+0.5, fx+0.6, fy+0.6, fx+0.5, fy+0.94, fx+0.4, fy+0.6, fx+0.06, fy+0.5, fx+0.4, fy+0.4))
	default:
		buf.WriteString(fmt.Sprintf(`<rect x="%d" y="%d" width="1" height="1"/>`, x, y))
	}
}

func writeDecorativeBodyShape(buf *strings.Builder, x, y, scale float64, style string) {
	buf.WriteString(fmt.Sprintf(`<g transform="translate(%.3f,%.3f) scale(%.5f)">`, x, y, scale))
	writeBodyShape(buf, 0, 0, style)
	buf.WriteString(`</g>`)
}

func decorativeCellOn(row, col int) bool {
	n := uint32(row*73856093) ^ uint32(col*19349663) ^ uint32((row+col)*83492791)
	n ^= n >> 13
	n *= 1274126177
	return n%100 < 58
}

func writeQRCoreSVG(buf *strings.Builder, bc barcode.Barcode, design DesignConfig) float64 {
	bounds := bc.Bounds()
	mods := bounds.Dx()
	quiet := design.QuietZoneModules
	if quiet <= 0 {
		quiet = 4
	}

	writeTransformedQRCoreSVG(buf, bc, design, float64(quiet), float64(quiet), 1)
	return float64(mods + quiet*2)
}

func drawEye(buf *strings.Builder, x, y int, design DesignConfig, slot string) {
	outerColor, innerColor := eyeColors(design, slot)
	style := normalizeEyeStyle(eyeStyle(design, slot), slot)
	rendering := "geometricPrecision"
	if style == "dotted-square" {
		rendering = "crispEdges"
	}
	buf.WriteString(fmt.Sprintf(`<g shape-rendering="%s" transform="translate(%d,%d)">`, rendering, x, y))
	if style == "dotted-square" {
		drawRawFinderMarker(buf, outerColor, design.BackgroundColor, innerColor)
		buf.WriteString(`</g>`)
		return
	}
	drawEyeOuter(buf, style, outerColor)
	drawEyeHole(buf, style, design.BackgroundColor)
	drawEyeInner(buf, style, innerColor)
	buf.WriteString(`</g>`)
}

func drawRawFinderMarker(buf *strings.Builder, outerColor, backgroundColor, innerColor string) {
	if outerColor == "" {
		outerColor = "#000000"
	}
	if backgroundColor == "" {
		backgroundColor = "#ffffff"
	}
	if innerColor == "" {
		innerColor = outerColor
	}
	buf.WriteString(fmt.Sprintf(`<rect x="0" y="0" width="7" height="7" fill="%s"/>`, outerColor))
	buf.WriteString(fmt.Sprintf(`<rect x="1" y="1" width="5" height="5" fill="%s"/>`, backgroundColor))
	buf.WriteString(fmt.Sprintf(`<rect x="2" y="2" width="3" height="3" fill="%s"/>`, innerColor))
}

func drawEyeOuter(buf *strings.Builder, style string, color string) {
	if color == "" {
		color = "#000000"
	}
	switch style {
	case "circle", "dot":
		buf.WriteString(fmt.Sprintf(`<circle cx="3.5" cy="3.5" r="3.5" fill="%s"/>`, color))
	case "diamond":
		buf.WriteString(fmt.Sprintf(`<path d="M3.5 0L7 3.5L3.5 7L0 3.5Z" fill="%s"/>`, color))
	case "dotted-square":
		buf.WriteString(fmt.Sprintf(`<rect x="0" y="0" width="7" height="7" fill="%s"/>`, color))
	default:
		buf.WriteString(fmt.Sprintf(`<path d="%s" fill="%s"/>`, eyePath(style, 0, 0, 7, 7), color))
	}
}

func drawEyeHole(buf *strings.Builder, style string, color string) {
	if color == "" {
		color = "#ffffff"
	}
	switch style {
	case "circle", "dot":
		buf.WriteString(fmt.Sprintf(`<circle cx="3.5" cy="3.5" r="2.5" fill="%s"/>`, color))
	case "diamond":
		buf.WriteString(fmt.Sprintf(`<path d="M3.5 1L6 3.5L3.5 6L1 3.5Z" fill="%s"/>`, color))
	case "dotted-square":
		buf.WriteString(fmt.Sprintf(`<rect x="1" y="1" width="5" height="5" fill="%s"/>`, color))
	default:
		buf.WriteString(fmt.Sprintf(`<path d="%s" fill="%s"/>`, eyePath(style, 1, 1, 5, 5), color))
	}
}

func drawEyeInner(buf *strings.Builder, style string, color string) {
	switch style {
	case "circle", "dot":
		buf.WriteString(fmt.Sprintf(`<circle cx="3.5" cy="3.5" r="1.5" fill="%s"/>`, color))
	case "diamond":
		buf.WriteString(fmt.Sprintf(`<path d="M3.5 2L5 3.5L3.5 5L2 3.5Z" fill="%s"/>`, color))
	case "dotted-square":
		buf.WriteString(fmt.Sprintf(`<rect x="2" y="2" width="3" height="3" fill="%s"/>`, color))
	default:
		buf.WriteString(fmt.Sprintf(`<path d="%s" fill="%s"/>`, eyePath(style, 2, 2, 3, 3), color))
	}
}

func drawDottedEye(buf *strings.Builder, color string) {
	for row := 0; row < 7; row++ {
		for col := 0; col < 7; col++ {
			if row == 0 || row == 6 || col == 0 || col == 6 {
				buf.WriteString(fmt.Sprintf(`<rect x="%f" y="%f" width="0.42" height="0.42" fill="%s"/>`, float64(col)+0.29, float64(row)+0.29, color))
			}
		}
	}
}

func eyePath(style string, x, y, size, sizeY float64) string {
	r := math.Min(size, sizeY) * 0.24
	if r < 0.45 {
		r = 0.45
	}
	switch style {
	case "rounded":
		return roundedRectPath(x, y, size, sizeY, r, r, r, r)
	case "round-top-left":
		return roundedRectPath(x, y, size, sizeY, r, 0.35, 0.35, 0.35)
	case "round-top-right":
		return roundedRectPath(x, y, size, sizeY, 0.35, r, 0.35, 0.35)
	case "round-bottom-right":
		return roundedRectPath(x, y, size, sizeY, 0.35, 0.35, r, 0.35)
	case "round-bottom-left":
		return roundedRectPath(x, y, size, sizeY, 0.35, 0.35, 0.35, r)
	case "leaf-top-left":
		return roundedRectPath(x, y, size, sizeY, r*1.4, 0.35, r*1.4, 0.35)
	case "leaf-top-right":
		return roundedRectPath(x, y, size, sizeY, 0.35, r*1.4, 0.35, r*1.4)
	case "leaf-bottom-right":
		return roundedRectPath(x, y, size, sizeY, r*1.4, 0.35, r*1.4, 0.35)
	case "leaf-bottom-left":
		return roundedRectPath(x, y, size, sizeY, 0.35, r*1.4, 0.35, r*1.4)
	case "teardrop", "teardrop-top-right", "teardrop-bottom-right", "teardrop-bottom-left", "teardrop-top-left":
		return teardropPath(style, x, y, size, sizeY)
	case "cut-top-left":
		return polygonPath([][2]float64{{x, y + 1.25}, {x + 1.25, y}, {x + size, y}, {x + size, y + sizeY}, {x, y + sizeY}})
	case "cut-top-right":
		return polygonPath([][2]float64{{x, y}, {x + size - 1.25, y}, {x + size, y + 1.25}, {x + size, y + sizeY}, {x, y + sizeY}})
	case "cut-bottom-right":
		return polygonPath([][2]float64{{x, y}, {x + size, y}, {x + size, y + sizeY - 1.25}, {x + size - 1.25, y + sizeY}, {x, y + sizeY}})
	case "cut-bottom-left":
		return polygonPath([][2]float64{{x, y}, {x + size, y}, {x + size, y + sizeY}, {x + 1.25, y + sizeY}, {x, y + sizeY - 1.25}})
	case "square":
		return roundedRectPath(x, y, size, sizeY, 0, 0, 0, 0)
	default:
		return roundedRectPath(x, y, size, sizeY, r, 0.35, 0.35, r)
	}
}

func teardropPath(style string, x, y, w, h float64) string {
	if style == "teardrop" {
		style = "teardrop-top-right"
	}
	px := func(unitX float64) float64 {
		if style == "teardrop-top-left" || style == "teardrop-bottom-left" {
			return x + w*(1-unitX)
		}
		return x + w*unitX
	}
	py := func(unitY float64) float64 {
		if style == "teardrop-bottom-right" || style == "teardrop-bottom-left" {
			return y + h*(1-unitY)
		}
		return y + h*unitY
	}
	return fmt.Sprintf("M%.3f %.3fL%.3f %.3fL%.3f %.3fC%.3f %.3f %.3f %.3f %.3f %.3fC%.3f %.3f %.3f %.3f %.3f %.3fC%.3f %.3f %.3f %.3f %.3f %.3fZ",
		px(0.42), py(0),
		px(1), py(0),
		px(1), py(0.58),
		px(1), py(0.84), px(0.82), py(1), px(0.52), py(1),
		px(0.22), py(1), px(0), py(0.78), px(0), py(0.50),
		px(0), py(0.22), px(0.20), py(0), px(0.42), py(0),
	)
}

func roundedRectPath(x, y, w, h, tl, tr, br, bl float64) string {
	if tl < 0 {
		tl = 0
	}
	if tr < 0 {
		tr = 0
	}
	if br < 0 {
		br = 0
	}
	if bl < 0 {
		bl = 0
	}
	return fmt.Sprintf("M%.3f %.3fH%.3fQ%.3f %.3f %.3f %.3fV%.3fQ%.3f %.3f %.3f %.3fH%.3fQ%.3f %.3f %.3f %.3fV%.3fQ%.3f %.3f %.3f %.3fZ", x+tl, y, x+w-tr, x+w, y, x+w, y+tr, y+h-br, x+w, y+h, x+w-br, y+h, x+bl, x, y+h, x, y+h-bl, y+tl, x, y, x+tl, y)
}

func polygonPath(points [][2]float64) string {
	if len(points) == 0 {
		return ""
	}
	var buf strings.Builder
	buf.WriteString(fmt.Sprintf("M%.2f %.2f", points[0][0], points[0][1]))
	for _, point := range points[1:] {
		buf.WriteString(fmt.Sprintf("L%.2f %.2f", point[0], point[1]))
	}
	buf.WriteString("Z")
	return buf.String()
}

func normalizeEyeStyle(style string, slot string) string {
	switch style {
	case "dot":
		return "circle"
	case "leaf":
		switch slot {
		case "top-left":
			return "leaf-top-left"
		case "bottom-left":
			return "leaf-bottom-left"
		default:
			return "leaf-top-right"
		}
	default:
		return style
	}
}

func eyeStyle(design DesignConfig, slot string) string {
	switch slot {
	case "top-left":
		if design.EyeTopLeftStyle != "" {
			return design.EyeTopLeftStyle
		}
	case "top-right":
		if design.EyeTopRightStyle != "" {
			return design.EyeTopRightStyle
		}
	case "bottom-left":
		if design.EyeBottomLeftStyle != "" {
			return design.EyeBottomLeftStyle
		}
	}
	return design.EyeStyle
}

func eyeColors(design DesignConfig, slot string) (string, string) {
	outer, inner := design.EyeColorOuter, design.EyeColorInner
	switch slot {
	case "top-left":
		if design.EyeTopLeftOuterColor != "" {
			outer = design.EyeTopLeftOuterColor
		}
		if design.EyeTopLeftInnerColor != "" {
			inner = design.EyeTopLeftInnerColor
		}
	case "top-right":
		if design.EyeTopRightOuterColor != "" {
			outer = design.EyeTopRightOuterColor
		}
		if design.EyeTopRightInnerColor != "" {
			inner = design.EyeTopRightInnerColor
		}
	case "bottom-left":
		if design.EyeBottomLeftOuterColor != "" {
			outer = design.EyeBottomLeftOuterColor
		}
		if design.EyeBottomLeftInnerColor != "" {
			inner = design.EyeBottomLeftInnerColor
		}
	}
	if outer == "" {
		outer = design.ForegroundColor
	}
	if inner == "" {
		inner = design.ForegroundColor
	}
	return outer, inner
}

func hasOuterSticker(design DesignConfig) bool {
	return design.Frame != nil && design.Frame.Enabled && design.Frame.Style != "none" || design.Sticker != nil && design.Sticker.Style != "" && design.Sticker.Style != "none"
}

func isCircleSticker(design DesignConfig) bool {
	return stickerStyle(design) == "circle"
}
func isRoundedSquareSticker(design DesignConfig) bool {
	return stickerStyle(design) == "rounded-square" || stickerStyle(design) == "rounded"
}

func isAcornSticker(design DesignConfig) bool {
	return stickerStyle(design) == "acorn"
}

// acorn outline path scaled to fit a viewBox of canvasMods×canvasMods
const acornPathTemplate = `M %.2f %.2f C %.2f %.2f %.2f %.2f %.2f %.2f C %.2f %.2f %.2f %.2f %.2f %.2f C %.2f %.2f %.2f %.2f %.2f %.2f C %.2f %.2f %.2f %.2f %.2f %.2f C %.2f %.2f %.2f %.2f %.2f %.2f C %.2f %.2f %.2f %.2f %.2f %.2f L %.2f %.2f C %.2f %.2f %.2f %.2f %.2f %.2f C %.2f %.2f %.2f %.2f %.2f %.2f C %.2f %.2f %.2f %.2f %.2f %.2f C %.2f %.2f %.2f %.2f %.2f %.2f C %.2f %.2f %.2f %.2f %.2f %.2f C %.2f %.2f %.2f %.2f %.2f %.2f C %.2f %.2f %.2f %.2f %.2f %.2f C %.2f %.2f %.2f %.2f %.2f %.2f C %.2f %.2f %.2f %.2f %.2f %.2f C %.2f %.2f %.2f %.2f %.2f %.2f Z`

// acornRawPoints are the control points of the Acorns logo path in the original
// 42×51 coordinate system (from the SVG source).
var acornRawPoints = [62][2]float64{
	{39.81, 23.91}, {43.02, 23.12}, {43.02, 7.50}, {24.20, 5.90},
	{23.88, 5.09}, {22.42, 1.59}, {19.46, 0.32},
	{19.10, 0.16}, {18.71, 0.06}, {18.33, 0.00},
	{18.10, -0.03}, {17.92, 0.25}, {18.07, 0.44},
	{18.77, 1.29}, {19.38, 4.32}, {18.27, 5.86},
	{-0.97, 7.27}, {-0.99, 23.11}, {2.24, 23.91},
	{4.27, 27.08},
	{4.12, 27.05}, {3.96, 27.05}, {3.81, 27.09},
	{3.66, 27.12}, {3.52, 27.19}, {3.39, 27.28},
	{3.27, 27.38}, {3.17, 27.50}, {3.09, 27.64},
	{3.02, 27.78}, {2.98, 27.93}, {2.96, 28.09},
	{2.66, 32.40}, {2.88, 45.96}, {18.32, 48.66},
	{19.15, 49.37}, {20.52, 51.01}, {21.02, 51.00},
	{21.52, 51.01}, {22.89, 49.37}, {23.71, 48.66},
	{39.04, 45.67}, {39.35, 32.37}, {39.07, 28.09},
	{39.06, 27.94}, {39.01, 27.78}, {38.94, 27.65},
	{38.87, 27.51}, {38.77, 27.39}, {38.64, 27.29},
	{38.52, 27.19}, {38.38, 27.13}, {38.23, 27.09},
	{38.07, 27.06}, {37.92, 27.05}, {37.76, 27.09},
}

func acornScaledPath(s float64, cx, cy float64) string {
	sc := func(raw [2]float64) (float64, float64) {
		return cx + (raw[0]-21.0)*s, cy + (raw[1]-25.5)*s
	}
	p := acornRawPoints
	args := make([]interface{}, 0, 124)
	for i := 0; i < len(p); i++ {
		x, y := sc(p[i])
		args = append(args, x, y)
	}
	return fmt.Sprintf(acornPathTemplate, args...)
}

func renderAcornSVG(bc barcode.Barcode, design DesignConfig, targetPixelSize int) []byte {
	bounds := bc.Bounds()
	mods := bounds.Dx()

	bg := design.BackgroundColor
	if bg == "" {
		bg = "#ffffff"
	}
	fg := design.ForegroundColor
	if fg == "" {
		fg = "#000000"
	}

	quiet := design.QuietZoneModules
	if quiet <= 0 {
		quiet = 4
	}
	outerMods := mods + (quiet * 2)
	canvasMods := outerMods + 6 // extra padding so the tall acorn fits

	// The acorn is roughly 42 wide × 51 tall in its native coords.
	// Scale to fit the canvas height (the taller dimension), with stroke margin.
	acornNativeH := 53.0 // 51 + padding for stroke
	acornScale := float64(canvasMods-2) / acornNativeH
	centerX := float64(canvasMods) / 2
	centerY := float64(canvasMods) / 2

	// Inscribed safe rectangle for the QR code inside the acorn.
	// Keep it centered in the nut body so the lower finder stays clear of the tapered base.
	safeSide := acornScale * 26.0
	contentScale := safeSide / float64(mods)
	offsetX := centerX - (float64(mods)*contentScale)/2
	offsetY := centerY - (float64(mods)*contentScale)/2

	acornPath := acornScaledPath(acornScale, centerX, centerY)

	var buf strings.Builder
	buf.Grow(mods * mods * 20)

	buf.WriteString(`<?xml version="1.0" encoding="UTF-8"?>`)
	buf.WriteString(fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" role="img" aria-label="QR code">`,
		canvasMods, canvasMods, targetPixelSize, targetPixelSize))

	if !design.BackgroundTransparent {
		buf.WriteString(fmt.Sprintf(`<rect width="100%%" height="100%%" fill="%s"/>`, bg))
	}

	// ClipPath using the acorn outline
	buf.WriteString(fmt.Sprintf(`<defs><clipPath id="qurl-acorn-clip"><path d="%s"/></clipPath></defs>`, acornPath))
	buf.WriteString(`<g clip-path="url(#qurl-acorn-clip)">`)

	// Decorative fill: scatter dots across the full canvas, skip the QR content area.
	// The SVG clipPath crops everything to the acorn shape.
	drawDecorativeShapeFill(&buf, canvasMods, offsetX, offsetY, contentScale, mods, design)

	writeTransformedQRCoreSVG(&buf, bc, design, offsetX, offsetY, contentScale)
	buf.WriteString(`</g>`) // close clip group
	writeLogoOverlay(&buf, centerX, centerY, float64(mods)*contentScale, design, targetPixelSize, float64(canvasMods))

	// Acorn outline stroke (drawn OUTSIDE the clip so it's not clipped)
	stickerColor := fg
	if design.Sticker != nil && design.Sticker.Color != "" {
		stickerColor = design.Sticker.Color
	}
	if design.Frame != nil && design.Frame.Color != "" {
		stickerColor = design.Frame.Color
	}
	buf.WriteString(fmt.Sprintf(`<path d="%s" fill="none" stroke="%s" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>`, acornPath, stickerColor))

	buf.WriteString(`</svg>`)
	return []byte(buf.String())
}

// drawDecorativeShapeFill scatters decorative dots across the full canvas,
// skipping the QR content rectangle. The caller uses an SVG clipPath to crop
// everything to the desired shape (acorn, etc). Same approach as the circle fill.
func drawDecorativeShapeFill(buf *strings.Builder, canvasMods int, contentOffsetX, contentOffsetY, contentScale float64, mods int, design DesignConfig) {
	style := decorativeModuleStyle(design)
	color := design.ForegroundColor
	if color == "" {
		color = "#000000"
	}

	cell := contentScale
	if cell <= 0 {
		cell = 1
	}
	contentMinX := contentOffsetX - (cell * 0.5)
	contentMaxX := contentOffsetX + float64(mods)*contentScale + (cell * 0.5)
	contentMinY := contentOffsetY - (cell * 0.5)
	contentMaxY := contentOffsetY + float64(mods)*contentScale + (cell * 0.5)

	buf.WriteString(fmt.Sprintf(`<g id="qurl-decorative-fill" data-module-style="%s" fill="%s" color="%s" opacity="0.98">`, escapeSVGAttr(style), color, color))
	for row := 0; ; row++ {
		y := 0.5 + float64(row)*cell
		if y > float64(canvasMods)-0.5 {
			break
		}
		for col := 0; ; col++ {
			x := 0.5 + float64(col)*cell
			if x > float64(canvasMods)-0.5 {
				break
			}
			// Skip the QR content area
			if x > contentMinX && x < contentMaxX && y > contentMinY && y < contentMaxY {
				continue
			}
			if !decorativeCellOn(row, col) {
				continue
			}
			writeDecorativeBodyShape(buf, x-(cell/2), y-(cell/2), cell, style)
		}
	}
	buf.WriteString(`</g>`)
}

func decorativeModuleStyle(design DesignConfig) string {
	if design.ModuleStyle == "" {
		return "dot"
	}
	return design.ModuleStyle
}

func stickerStyle(design DesignConfig) string {
	style := ""
	if design.Sticker != nil {
		style = design.Sticker.Style
	}
	if design.Frame != nil && design.Frame.Style != "" && design.Frame.Style != "none" {
		style = design.Frame.Style
	}
	return style
}

func drawSticker(buf *strings.Builder, size int, design DesignConfig) {
	if !hasOuterSticker(design) {
		return
	}
	color := design.ForegroundColor
	style := stickerStyle(design)
	if style == "" {
		style = "circle"
	}
	if design.Sticker != nil {
		if design.Sticker.Color != "" {
			color = design.Sticker.Color
		}
	}
	if design.Frame != nil {
		if design.Frame.Color != "" {
			color = design.Frame.Color
		}
	}
	switch style {
	case "circle":
		buf.WriteString(fmt.Sprintf(`<circle cx="%f" cy="%f" r="%f" fill="none" stroke="%s" stroke-width="0.55"/>`, float64(size)/2, float64(size)/2, float64(size)/2-0.5, color))
	case "rounded-square", "scan-me-bottom", "badge":
		buf.WriteString(fmt.Sprintf(`<rect x="0.35" y="0.35" width="%f" height="%f" rx="2.2" fill="none" stroke="%s" stroke-width="0.5"/>`, float64(size)-0.7, float64(size)-0.7, color))
	}
}

type frameTemplate struct {
	ID     string
	MountX float64
	MountY float64
	Mount  float64
}

func frameTemplateForDesign(design DesignConfig) (frameTemplate, bool) {
	template, ok := frameTemplates()[stickerStyle(design)]
	return template, ok
}

func frameTemplates() map[string]frameTemplate {
	return map[string]frameTemplate{
		"scan-me-speech-bubble": {ID: "scan-me-speech-bubble", MountX: 18, MountY: 10, Mount: 64},
		"storefront":            {ID: "storefront", MountX: 25, MountY: 34, Mount: 50},
		"coffee-cup":            {ID: "coffee-cup", MountX: 23, MountY: 22, Mount: 44},
		"mobile-phone":          {ID: "mobile-phone", MountX: 25, MountY: 16, Mount: 50},
		"gift-box":              {ID: "gift-box", MountX: 23, MountY: 38, Mount: 54},
		"clipboard":             {ID: "clipboard", MountX: 26, MountY: 24, Mount: 48},
		"dashed-border-hearts":  {ID: "dashed-border-hearts", MountX: 18, MountY: 18, Mount: 64},
		"ticket-pass":           {ID: "ticket-pass", MountX: 30, MountY: 30, Mount: 40},
		"shopping-bag":          {ID: "shopping-bag", MountX: 24, MountY: 34, Mount: 52},
	}
}

func renderTemplateSVG(bc barcode.Barcode, design DesignConfig, template frameTemplate, targetPixelSize int) []byte {
	bg := design.BackgroundColor
	if bg == "" {
		bg = "#ffffff"
	}
	color := design.ForegroundColor
	if design.Sticker != nil && design.Sticker.Color != "" {
		color = design.Sticker.Color
	}
	if design.Frame != nil && design.Frame.Color != "" {
		color = design.Frame.Color
	}

	var qr strings.Builder
	coreSize := writeQRCoreSVG(&qr, bc, design)
	scale := template.Mount / coreSize

	var buf strings.Builder
	buf.Grow(qr.Len() + 2400)
	buf.WriteString(`<?xml version="1.0" encoding="UTF-8"?>`)
	buf.WriteString(fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="%d" height="%d" role="img" aria-label="QR code">`, targetPixelSize, targetPixelSize))
	if !design.BackgroundTransparent {
		buf.WriteString(fmt.Sprintf(`<rect width="100" height="100" rx="3" fill="%s"/>`, bg))
	}

	assetPath := fmt.Sprintf("frames/%s.svg", template.ID)
	assetBytes, err := frameAssets.ReadFile(assetPath)
	if err == nil {
		assetStr := string(assetBytes)
		assetStr = strings.ReplaceAll(assetStr, "{{color}}", color)
		assetStr = strings.ReplaceAll(assetStr, "{{label}}", "")
		buf.WriteString(assetStr)
	}

	buf.WriteString(fmt.Sprintf(`<g id="qr-mount" transform="translate(%.3f %.3f) scale(%.5f)">`, template.MountX, template.MountY, scale))
	buf.WriteString(qr.String())
	buf.WriteString(`</g>`)
	writeLogoOverlay(&buf, template.MountX+(template.Mount/2), template.MountY+(template.Mount/2), template.Mount, design, targetPixelSize, 100)
	buf.WriteString(`</svg>`)
	return []byte(buf.String())
}

func escapeSVGText(value string) string {
	value = strings.ReplaceAll(value, "&", "&amp;")
	value = strings.ReplaceAll(value, "<", "&lt;")
	value = strings.ReplaceAll(value, ">", "&gt;")
	return value
}

func escapeSVGAttr(value string) string {
	value = escapeSVGText(value)
	value = strings.ReplaceAll(value, `"`, "&quot;")
	return value
}

func hasRenderableImageLogo(design DesignConfig) bool {
	if design.Logo == nil || design.Logo.Mode != "image" {
		return false
	}
	return isSupportedLogoDataURL(design.Logo.AssetRef)
}

func isSupportedLogoDataURL(value string) bool {
	return strings.HasPrefix(value, "data:image/png;") ||
		strings.HasPrefix(value, "data:image/jpeg;") ||
		strings.HasPrefix(value, "data:image/jpg;") ||
		strings.HasPrefix(value, "data:image/webp;") ||
		strings.HasPrefix(value, "data:image/gif;") ||
		strings.HasPrefix(value, "data:image/svg+xml;")
}

func writeLogoOverlay(buf *strings.Builder, centerX, centerY, contentSide float64, design DesignConfig, targetPixelSize int, viewBoxSide float64) {
	if !hasRenderableImageLogo(design) {
		return
	}

	logo := design.Logo
	ratio := logo.SizeRatio
	if ratio <= 0 {
		ratio = 0.22
	}
	ratio = math.Max(0.1, math.Min(0.28, ratio))

	side := contentSide * ratio
	if side <= 0 {
		return
	}

	bg := design.BackgroundColor
	if bg == "" {
		bg = "#ffffff"
	}

	x := centerX - side/2
	y := centerY - side/2
	shape := logo.Shape
	if shape == "" {
		shape = "circle"
	}
	padding := logoBackingPaddingUnits(targetPixelSize, viewBoxSide)

	buf.WriteString(`<g id="qurl-logo">`)
	switch shape {
	case "none":
	case "rounded-square":
		buf.WriteString(fmt.Sprintf(`<rect x="%.3f" y="%.3f" width="%.3f" height="%.3f" rx="%.3f" fill="%s"/>`, x-padding, y-padding, side+(padding*2), side+(padding*2), side*0.18, bg))
	default:
		buf.WriteString(fmt.Sprintf(`<circle cx="%.3f" cy="%.3f" r="%.3f" fill="%s"/>`, centerX, centerY, side/2+padding, bg))
	}

	buf.WriteString(fmt.Sprintf(`<image href="%s" x="%.3f" y="%.3f" width="%.3f" height="%.3f" preserveAspectRatio="xMidYMid meet"/>`, escapeSVGAttr(logo.AssetRef), x, y, side, side))
	buf.WriteString(`</g>`)
}

func logoBackingPaddingUnits(targetPixelSize int, viewBoxSide float64) float64 {
	const paddingPixels = 2.0
	if targetPixelSize <= 0 || viewBoxSide <= 0 {
		return paddingPixels
	}
	return paddingPixels * viewBoxSide / float64(targetPixelSize)
}

// renderAdvancedJPG converts the unscaled barcode to a nicely scaled and colored JPEG image
func renderAdvancedJPG(bc barcode.Barcode, design DesignConfig, targetPixelSize int) ([]byte, error) {
	fgColor, err := parseHexColor(design.ForegroundColor)
	if err != nil {
		fgColor = color.RGBA{0, 0, 0, 255}
	}
	bgColor, err := parseHexColor(design.BackgroundColor)
	if err != nil {
		bgColor = color.RGBA{255, 255, 255, 255}
	}

	img := renderBasicBitmap(bc, design, targetPixelSize, fgColor, bgColor)
	if img == nil {
		return nil, fmt.Errorf("target size too small for QR payload")
	}

	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 90}); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func renderBasicBitmap(bc barcode.Barcode, design DesignConfig, targetPixelSize int, fgColor, bgColor color.RGBA) image.Image {
	bounds := bc.Bounds()
	mods := bounds.Dx()
	quiet := design.QuietZoneModules
	if quiet <= 0 {
		quiet = 4
	}

	canvasMods := mods + (quiet * 2)
	scale := targetPixelSize / canvasMods
	realSize := scale * canvasMods
	if realSize == 0 {
		return nil
	}

	img := image.NewRGBA(image.Rect(0, 0, realSize, realSize))
	draw.Draw(img, img.Bounds(), &image.Uniform{bgColor}, image.Point{}, draw.Src)

	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			if isDark(bc.At(x, y)) {
				rect := image.Rect((x+quiet)*scale, (y+quiet)*scale, (x+quiet+1)*scale, (y+quiet+1)*scale)
				draw.Draw(img, rect, &image.Uniform{fgColor}, image.Point{}, draw.Src)
			}
		}
	}
	return img
}

// renderAdvancedPNG converts the unscaled barcode to a nicely scaled and colored PNG image
func renderAdvancedPNG(bc barcode.Barcode, design DesignConfig, targetPixelSize int) ([]byte, error) {
	fgColor, err := parseHexColor(design.ForegroundColor)
	if err != nil {
		fgColor = color.RGBA{0, 0, 0, 255}
	}
	bgColor, err := parseHexColor(design.BackgroundColor)
	if err != nil {
		bgColor = color.RGBA{255, 255, 255, 255}
	}
	if design.BackgroundTransparent {
		bgColor = color.RGBA{0, 0, 0, 0}
	}

	img := renderBasicBitmap(bc, design, targetPixelSize, fgColor, bgColor)
	if img == nil {
		return nil, fmt.Errorf("target size too small for QR payload")
	}

	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// renderAdvancedEPS generates a basic EPS (PostScript) file for the QR code
func renderAdvancedEPS(bc barcode.Barcode, design DesignConfig) ([]byte, error) {
	bounds := bc.Bounds()
	mods := bounds.Dx()
	quiet := design.QuietZoneModules
	if quiet <= 0 {
		quiet = 4
	}

	canvasMods := mods + (quiet * 2)
	fgColor, _ := parseHexColor(design.ForegroundColor)

	var buf strings.Builder
	buf.WriteString("%!PS-Adobe-3.0 EPSF-3.0\n")
	buf.WriteString(fmt.Sprintf("%%%%BoundingBox: 0 0 %d %d\n", canvasMods, canvasMods))
	buf.WriteString("%%%%LanguageLevel: 2\n")
	buf.WriteString("%%%%Pages: 1\n")
	buf.WriteString("%%%%EndComments\n\n")

	// Set color
	buf.WriteString(fmt.Sprintf("%.3f %.3f %.3f setrgbcolor\n", float64(fgColor.R)/255, float64(fgColor.G)/255, float64(fgColor.B)/255))

	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			if isDark(bc.At(x, y)) {
				// In PostScript, (0,0) is bottom-left. We map (x,y) accordingly.
				// (x+quiet, canvasMods - (y+quiet+1))
				buf.WriteString(fmt.Sprintf("%d %d 1 1 rectfill\n", x+quiet, canvasMods-(y+quiet+1)))
			}
		}
	}

	buf.WriteString("%%EOF\n")
	return []byte(buf.String()), nil
}

func isDark(c color.Color) bool {
	r, g, b, _ := c.RGBA()
	return r+g+b < 0x18000
}
