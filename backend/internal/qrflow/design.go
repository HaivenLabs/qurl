package qrflow

type DesignConfig struct {
	SchemaVersion           string         `json:"schemaVersion"`
	ErrorCorrectionLevel    string         `json:"errorCorrectionLevel,omitempty"`
	QuietZoneModules        int            `json:"quietZoneModules,omitempty"`
	ForegroundColor         string         `json:"foregroundColor,omitempty"`
	BackgroundColor         string         `json:"backgroundColor,omitempty"`
	BackgroundTransparent   bool           `json:"backgroundTransparent,omitempty"`
	ModuleStyle             string         `json:"moduleStyle,omitempty"`
	EyeStyle                string         `json:"eyeStyle,omitempty"`
	EyeColorOuter           string         `json:"eyeColorOuter,omitempty"`
	EyeColorInner           string         `json:"eyeColorInner,omitempty"`
	EyeTopLeftStyle         string         `json:"eyeTopLeftStyle,omitempty"`
	EyeTopRightStyle        string         `json:"eyeTopRightStyle,omitempty"`
	EyeBottomLeftStyle      string         `json:"eyeBottomLeftStyle,omitempty"`
	EyeTopLeftOuterColor    string         `json:"eyeTopLeftOuterColor,omitempty"`
	EyeTopLeftInnerColor    string         `json:"eyeTopLeftInnerColor,omitempty"`
	EyeTopRightOuterColor   string         `json:"eyeTopRightOuterColor,omitempty"`
	EyeTopRightInnerColor   string         `json:"eyeTopRightInnerColor,omitempty"`
	EyeBottomLeftOuterColor string         `json:"eyeBottomLeftOuterColor,omitempty"`
	EyeBottomLeftInnerColor string         `json:"eyeBottomLeftInnerColor,omitempty"`
	Logo                    *LogoConfig    `json:"logo,omitempty"`
	Frame                   *FrameConfig   `json:"frame,omitempty"`
	Sticker                 *StickerConfig `json:"sticker,omitempty"`
	TemplateID              string         `json:"templateId,omitempty"`
}

type LogoConfig struct {
	Mode            string  `json:"mode"` // "none", "image", "text"
	AssetRef        string  `json:"assetRef,omitempty"`
	Text            string  `json:"text,omitempty"`
	Fit             string  `json:"fit,omitempty"`       // "contain", "cover"
	SizeRatio       float64 `json:"sizeRatio,omitempty"` // 0.1 to 0.28
	ForegroundColor string  `json:"foregroundColor,omitempty"`
	Shape           string  `json:"shape,omitempty"`
}

type FrameConfig struct {
	Enabled       bool   `json:"enabled"`
	Style         string `json:"style,omitempty"` // "none", "square", "rounded", "pill"
	Label         string `json:"label,omitempty"`
	LabelPosition string `json:"labelPosition,omitempty"` // "top", "bottom"
	Color         string `json:"color,omitempty"`
}

type StickerConfig struct {
	Style string `json:"style,omitempty"`
	Text  string `json:"text,omitempty"`
	Color string `json:"color,omitempty"`
}

func (d DesignConfig) ApplyDefaults() DesignConfig {
	if d.ErrorCorrectionLevel == "" {
		d.ErrorCorrectionLevel = "H"
	}
	if d.ForegroundColor == "" {
		d.ForegroundColor = "#355f5d"
	}
	if d.BackgroundColor == "" {
		d.BackgroundColor = "#ffffff"
	}
	if d.QuietZoneModules < 0 {
		d.QuietZoneModules = 4
	}
	if d.ModuleStyle == "" {
		d.ModuleStyle = "dot"
	}
	if d.EyeStyle == "" {
		d.EyeStyle = "leaf"
	}
	if d.EyeColorOuter == "" {
		d.EyeColorOuter = d.ForegroundColor
	}
	if d.EyeColorInner == "" {
		d.EyeColorInner = d.ForegroundColor
	}
	return d
}
