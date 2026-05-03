# Backend Scaffold

This directory contains the Go backend skeleton for qurl.

## Package layout

- `cmd/qurl-backend`: process entrypoint.
- `internal/bootstrap`: wiring for config, HTTP server construction, and startup.
- `internal/config`: environment-driven configuration with safe defaults.
- `internal/httpapi`: HTTP server, routes, and handlers.
- `internal/version`: versioning conventions for the backend and public API.

## Versioning conventions

- Public HTTP APIs live under `/api/v1`.
- Versioned payloads, config blobs, and contracts must carry an explicit schema version field.
- Breaking API changes require a new major HTTP version path such as `/api/v2`.
- Operational endpoints like `/healthz` may exist alongside versioned API routes for infrastructure checks.

## Startup contract

- The server must start with safe defaults when no environment variables are set.
- Health endpoints must return a simple success response suitable for bootstrap checks.
- The bootstrap path should stay thin and delegate behavior into package-level components.

