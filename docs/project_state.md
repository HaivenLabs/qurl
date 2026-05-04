@'

# qurl Project State

Last updated: 2026-05-03

## Current status

qurl is an open-source QR code generator. The current repo contains a Go backend scaffold, Expo/React Native Web frontend scaffold, shared contract/schema package, Docker dev runtime, and MVP backlog.

The app currently renders the scaffolded web UI and runs through Docker Compose.

## Product promise

Direct QR codes must encode the user-entered destination directly by default.

No hidden redirects.
No platform tracking.
No qurl-owned URL unless the user explicitly chooses tracking or hosted dynamic QR later.

## Current MVP focus

Slice 1: Anonymous Direct URL QR Creation

Next product goal:

- Add real QR payload generation.
- Add URL normalization.
- Add tests proving direct payloads are not converted into qurl redirects.
- Replace mock QR preview with real preview.
- Add PNG/SVG export.

## Current architecture

Backend:

- Go
- Modular monolith
- Backend module lives in `backend`
- Health endpoint exists
- Backend tests pass from `backend` with `go test ./...`

Frontend:

- Expo + React Native Web
- TypeScript
- Expo Router
- Web app lives in `apps/web`
- Root package manager is pnpm
- Docker web build exports static web assets through nginx

Shared:

- Contracts/schema work lives under `packages`
- More shared packages are planned, especially `packages/qr-core`

Runtime:

- Local Docker Compose is available.
- Docker build requires pnpm hoisted node linker.
- `.npmrc` should contain `node-linker=hoisted`.

## Known good commands

```powershell
cd D:\dev\HaivenLabs\qurl

pnpm install
pnpm lint
pnpm typecheck
pnpm test

cd backend
go test ./...

cd ..
docker compose build
docker compose up
```
