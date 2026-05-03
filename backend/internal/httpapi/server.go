package httpapi

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"qurl/backend/internal/config"
	"qurl/backend/internal/qrflow"
	"qurl/backend/internal/version"
)

type Server struct {
	cfg config.Config
	mux *http.ServeMux
	srv *http.Server
	qr  *qrflow.Service
}

func New(cfg config.Config) *Server {
	mux := http.NewServeMux()
	s := &Server{
		cfg: cfg,
		mux: mux,
		qr:  qrflow.New(),
	}

	mux.HandleFunc(version.HealthPath, s.healthHandler)
	mux.HandleFunc(version.APIPrefix+"/health", s.healthHandler)
	mux.HandleFunc(version.DirectURLPreviewPath, s.previewHandler)
	mux.HandleFunc(version.DirectURLExportPath, s.exportHandler)

	s.srv = &http.Server{
		Addr:              cfg.ListenAddr,
		Handler:           cors(mux),
		ReadHeaderTimeout: 5 * time.Second,
	}

	return s
}

func (s *Server) Handler() http.Handler {
	return cors(s.mux)
}

func (s *Server) ListenAndServe() error {
	return s.srv.ListenAndServe()
}

func (s *Server) Shutdown(ctx context.Context) error {
	return s.srv.Shutdown(ctx)
}

func (s *Server) healthHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.Header().Set("Allow", "GET, HEAD")
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	_ = json.NewEncoder(w).Encode(map[string]any{
		"status":     "ok",
		"service":    s.cfg.ServiceName,
		"apiVersion": s.cfg.APIVersion,
		"checkedAt":  time.Now().UTC().Format(time.RFC3339Nano),
	})
}

func (s *Server) previewHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w, http.MethodPost)
		return
	}

	req, err := decodeQRRequest(r)
	if err != nil {
		writeProblem(w, http.StatusBadRequest, err.Error())
		return
	}

	resp, err := s.qr.Preview(req)
	if err != nil {
		writeProblem(w, statusForQRError(err), err.Error())
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

func (s *Server) exportHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w, http.MethodPost)
		return
	}

	req, err := decodeQRRequest(r)
	if err != nil {
		writeProblem(w, http.StatusBadRequest, err.Error())
		return
	}

	resp, err := s.qr.Export(req)
	if err != nil {
		writeProblem(w, statusForQRError(err), err.Error())
		return
	}

	w.Header().Set("Content-Type", resp.MimeType)
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, resp.Filename))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(resp.Bytes)
}

func decodeQRRequest(r *http.Request) (qrflow.ProjectConfig, error) {
	defer r.Body.Close()

	var req qrflow.ProjectConfig
	decoder := json.NewDecoder(io.LimitReader(r.Body, 1<<20))
	if err := decoder.Decode(&req); err != nil {
		return qrflow.ProjectConfig{}, fmt.Errorf("decode request: %w", err)
	}

	return req, nil
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeProblem(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]any{
		"error": message,
	})
}

func methodNotAllowed(w http.ResponseWriter, allow string) {
	w.Header().Set("Allow", allow)
	http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
}

func statusForQRError(err error) int {
	return http.StatusBadRequest
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
