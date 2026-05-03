package bootstrap

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"

	"qurl/backend/internal/config"
	"qurl/backend/internal/httpapi"
)

func Run(ctx context.Context) error {
	cfg := config.Load()
	return RunWithConfig(ctx, cfg)
}

func RunWithConfig(ctx context.Context, cfg config.Config) error {
	server := httpapi.New(cfg)

	errCh := make(chan error, 1)
	go func() {
		errCh <- server.ListenAndServe()
	}()

	select {
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if shutdownErr := server.Shutdown(shutdownCtx); shutdownErr != nil && !errors.Is(shutdownErr, http.ErrServerClosed) {
			return fmt.Errorf("shutdown: %w", shutdownErr)
		}

		select {
		case err := <-errCh:
			if err != nil && !errors.Is(err, http.ErrServerClosed) {
				return fmt.Errorf("listen and serve: %w", err)
			}
		default:
		}

		return nil
	case err := <-errCh:
		if err == nil || errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return fmt.Errorf("listen and serve: %w", err)
	}
}
