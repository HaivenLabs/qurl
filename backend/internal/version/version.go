package version

const (
	APIVersion           = "v1"
	APIPrefix            = "/api/" + APIVersion
	HealthPath           = "/healthz"
	DirectURLPreviewPath  = APIPrefix + "/direct-url/preview"
	DirectURLExportPath   = APIPrefix + "/direct-url/export"
	ServiceName          = "qurl-backend"
	ConfigSchema         = 1
)
