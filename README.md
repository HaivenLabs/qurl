# qurl

**QR codes for people who do not want weird redirects, ransom analytics, or ugly little checkerboards.**

qurl is an open-source QR code creation platform for generating beautiful, reliable, production-ready QR codes. The MVP focuses on free, no-login QR creation with direct destination encoding, strong design customization, print-ready exports, optional accounts, and saved QR project management.

The core promise is simple:

**If a user creates a direct QR code for `https://example.com`, the QR code points to `https://example.com`.**

No surprise short links.
No forced redirect domains.
No tracking unless the user explicitly chooses it.

---

## Why qurl exists

Most QR code generators look free until the moment you need the file, the analytics, the edit button, or the truth about where the QR code actually points.

qurl is different:

- Free users can create and download QR codes without logging in.
- Direct QR codes point directly to the destination the user enters.
- QR designs can be customized with colors, logos, dots, markers, frames, and templates.
- Production exports should be clean, predictable, and scannable.
- Accounts are optional and useful, not forced.
- Tracking is explicit, not sneaky.
- The product is open source and built to be understandable by humans and coding agents.

---

## MVP scope

The MVP is focused on the free creator experience first.

Included in MVP:

1. Anonymous static QR code creation and download
2. Account creation, saved QR codes, favorites, and project management
3. Advanced design studio, brand kits, templates, and reusable styles
4. QR code types and scan destinations
5. Export, print production, and asset delivery

Post-MVP:

- Self-managed tracking helpers
- Hosted dynamic QR codes
- Premium analytics
- Bulk QR generation
- Teams and workspaces
- Billing and subscriptions
- Admin and abuse prevention tooling
- Developer API, webhooks, CLI, and self-hosting polish
- AI-assisted creation and optimization

---

## MVP vertical slices

qurl should be built in vertical slices, not vague layers of unfinished infrastructure.

1. Anonymous direct URL QR creation
2. QR type registry and static payload types
3. Core design studio
4. Export production hardening
5. Account creation and anonymous-to-account handoff
6. Saved QR dashboard and project management
7. Saved QR editing, duplication, favorites, archive/delete, and re-download
8. Templates and reusable style presets
9. Optional tracking and dynamic QR foundations

---

## Foundation contract

qurl treats direct QR encoding as the product invariant.

For a direct URL QR, the encoded payload is the destination URL itself. It is not a qurl redirect URL, short link, analytics link, tracking URL, or any other hosted intermediary.

The first implementation package for that invariant is `@qurl/qr-core`.

---

## Repository layout

```text
apps/web                 Expo web app
backend                  Go API boundary
packages/contracts       JSON Schema and OpenAPI contracts
packages/qr-core         Shared TypeScript QR payload domain core
packages/ui              Shared UI tokens
scripts                  Local bootstrap, dev, and check helpers
```

The current architecture is a modular monolith: shared TypeScript product/domain packages plus a small Go API boundary. The repo should stay boring here until Slice 1 is proven.

---

## Local development

Prerequisites:

- Node.js 22+
- pnpm 9.15.4 via Corepack
- Go 1.22+
- PowerShell 7+ for contract scripts on non-Windows systems

Bootstrap:

```powershell
corepack enable
pnpm install
```

Run the web app:

```powershell
pnpm run dev:web
```

Run the backend:

```powershell
pnpm run dev:backend
```

Run checks:

```powershell
pnpm run check
pnpm run check:backend
pnpm run check:contracts
```

First slice with containers:

```powershell
docker compose up --build
```

Then open:

- Web app: `http://localhost:3000`
- Backend health: `http://localhost:8080/healthz`
- Backend preview API: `POST http://localhost:8080/api/v1/direct-url/preview`
- Backend export API: `POST http://localhost:8080/api/v1/direct-url/export`

If the web app and API are on different origins, set `EXPO_PUBLIC_QURL_API_BASE_URL` to the API base URL before building the web image or starting the web app.

---

## API versioning

Operational health is available at `/healthz`.

Versioned product APIs live under `/api/v1`. The OpenAPI contract uses `/api/v1` as its server URL, with paths relative to that prefix.

---

## Build order

1. Foundation Fix: README, CI, contracts, `qr-core`, and direct URL tests
2. Slice 1: URL input validation, direct payload generation, real preview, PNG/SVG export
3. Local Runtime: devcontainer, Dockerfile.dev, docker-compose, and clean dev/check scripts
4. Deployment/IaC: only after the product invariant and clean local runtime are in place
