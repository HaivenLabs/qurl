package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"qurl/backend/internal/config"
	"qurl/backend/internal/version"
)

type Server struct {
	cfg config.Config
	mux *http.ServeMux
	srv *http.Server
}

func New(cfg config.Config) *Server {
	mux := http.NewServeMux()
	s := &Server{
		cfg: cfg,
		mux: mux,
	}

	mux.HandleFunc(version.HealthPath, s.healthHandler)
	mux.HandleFunc(version.APIPrefix+"/health", s.healthHandler)

	s.srv = &http.Server{
		Addr:              cfg.ListenAddr,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	return s
}

func (s *Server) Handler() http.Handler {
	return s.mux
}

func (s *Server) ListenAndServe() error {
	return s.srv.ListenAndServe()
}

func (s *Server) Shutdown(ctx context.Context) error {
	return s.srv.Shutdown(ctx)
}

func (s *Server) healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	_ = json.NewEncoder(w).Encode(map[string]any{
		"status":     "ok",
		"service":    s.cfg.ServiceName,
		"apiVersion": s.cfg.APIVersion,
		"checkedAt":  time.Now().UTC().Format(time.RFC3339Nano),
	})
}

