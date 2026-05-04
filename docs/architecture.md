# qurl Architecture Reference

This is the durable handoff note for humans and coding agents. Keep it current when a change moves a boundary, adds a package, changes a contract, or alters the product invariant.

## Product Invariant

Direct/static QR codes encode the user's intended payload directly. For URL QR codes, the encoded value is the destination URL itself. Do not introduce qurl redirect URLs, hidden short links, tracking URLs, or hosted scan paths unless a user explicitly chooses a future hosted/tracking mode.

## Current Architecture

qurl is a modular monolith with a web-first Expo app, shared TypeScript domain packages, versioned contracts, and a small Go API boundary.

```text
apps/web                 Expo + React Native Web creator experience
backend                  Go HTTP API boundary and server-side QR preview/export
packages/contracts       OpenAPI and JSON Schema contracts
packages/qr-core         Shared QR payload, registry, validation, rendering helpers
packages/ui              Shared UI tokens
scripts                  Local bootstrap, dev, backend, and contract checks
```

## Frontend

- `apps/web` uses Expo Router and React Native primitives.
- The creator screen owns temporary anonymous editor state.
- UI components should render state and raise events; payload rules belong in `@qurl/qr-core`.
- Web-only behavior, such as browser downloads, belongs behind small helpers like `apps/web/src/lib/qr-export.ts`.
- Slice 1 and 2 currently support anonymous static QR creation with SVG/PNG downloads and a local fallback when the backend is not reachable.

## QR Core

- `packages/qr-core/src/payloads.ts` is the source of truth for MVP static QR types, payload validation, and direct payload encoding.
- `QR_TYPE_REGISTRY_V1` defines the MVP type catalog.
- `encodeQrPayload` returns the exact string that is encoded into the QR matrix.
- `createQrProjectConfig` builds the canonical project config consumed by preview/export helpers.
- Direct URL helpers remain as compatibility wrappers around the generic payload system.

## Backend

- `backend/internal/httpapi` owns HTTP transport, routing, CORS, request decoding, and response writing.
- `backend/internal/qrflow` owns server-side direct URL preview/export behavior.
- Current backend preview/export endpoints are URL-oriented:
  - `POST /api/v1/direct-url/preview`
  - `POST /api/v1/direct-url/export`
- Non-URL static QR types currently render/export locally in the web app. Add generic API endpoints only when the contract is updated first.

## Contracts

- Public APIs live under `/api/v1`.
- OpenAPI lives at `packages/contracts/openapi/v1/qurl.openapi.v1.json`.
- Versioned JSON Schemas live under `packages/contracts/schemas/v1`.
- Contract changes should be made before handler changes.
- Payload, design, export, project, and registry schemas must stay versioned.

## Testing And Checks

Use targeted checks while developing, then run the root checks before handoff.

```powershell
pnpm run test
pnpm run typecheck
pnpm run format:check
pnpm run check:contracts
pnpm run check:backend
```

On local Windows sandboxed runs, Vitest and recursive pnpm scripts may fail with `spawn EPERM`. If that happens, rerun the same command outside the sandbox with approval rather than treating it as a product failure.

## Update Rules

Update this file when:

- A new package, app, service, or persistent boundary is added.
- A QR payload type, schema version, or registry shape changes.
- Preview/export ownership moves between frontend, backend, or shared packages.
- A new API endpoint or contract version is introduced.
- A post-MVP hosted, tracking, analytics, auth, or storage concern is pulled forward.

Keep this reference short. Link out to deeper docs when the details stop fitting here.
