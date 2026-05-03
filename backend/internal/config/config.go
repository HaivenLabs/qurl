package config

import (
	"os"

	"qurl/backend/internal/version"
)

const (
	DefaultListenAddr = ":8080"
	DefaultServiceName = version.ServiceName
)

type Config struct {
	ServiceName string
	ListenAddr  string
	APIVersion  string
}

func Load() Config {
	cfg := Config{
		ServiceName: DefaultServiceName,
		ListenAddr:  DefaultListenAddr,
		APIVersion:  version.APIVersion,
	}

	if value := os.Getenv("QURL_SERVICE_NAME"); value != "" {
		cfg.ServiceName = value
	}

	if value := os.Getenv("QURL_LISTEN_ADDR"); value != "" {
		cfg.ListenAddr = value
	}

	if value := os.Getenv("QURL_API_VERSION"); value != "" {
		cfg.APIVersion = value
	}

	return cfg
}
