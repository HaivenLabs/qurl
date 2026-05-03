# Open QR Product Backlog

## MVP Build Instruction

Build the MVP first. The MVP is focused on delivering the free QR creation experience end-to-end before adding hosted analytics, paid subscriptions, teams, bulk operations, APIs, or AI features.

The MVP includes these epics:

- Epic 1: Anonymous Static QR Code Creation and Download
- Epic 2: Account Creation, Saved QR Codes, Favorites, and Project Management
- Epic 5: Advanced Design Studio, Brand Kits, Templates, and Reusable Styles
- Epic 6: QR Code Types and Scan Destinations
- Epic 7: Export, Print Production, and Asset Delivery

The MVP should prove the core product promise: users can create beautiful, reliable, directly encoded QR codes for free, download production-ready assets, optionally create an account, and save/manage their work without being forced into tracking, redirects, or subscriptions.

Epics 3, 4, and 8 through 14 are post-MVP unless explicitly pulled forward.

## Technical Execution Instructions

1. Build test-first. Every meaningful behavior must start with a failing test before implementation. Use TDD for domain logic, services, validators, payload builders, renderers, exporters, authorization rules, and API handlers.

2. Use BDD for product flows. Critical user journeys must be described as behavior scenarios before implementation, including anonymous QR creation, direct URL generation, design customization, download, account creation, save/edit/re-download, QR type switching, and export validation.

3. Design contract-first APIs. Define request/response contracts before writing handlers. Use OpenAPI or an equivalent machine-readable contract for external and internal APIs. Generated clients/types are preferred where practical.

4. Keep architecture well-layered. Separate transport, application services, domain logic, persistence, rendering, export, validation, and infrastructure concerns. HTTP handlers must not contain business logic. Database models must not become domain models by accident.

5. Build a modular Go backend. Use clear packages with single responsibilities, such as auth, users, qrprojects, payloads, designs, exports, assets, accounts, workspaces, and shared platform utilities. Prefer a modular monolith for MVP, with boundaries clean enough to extract services later.

6. Make QR behavior deterministic and auditable. Given the same payload configuration, design configuration, and export options, the system must generate the same QR output. Persist versioned configuration schemas for payloads, designs, tracking settings, and exports.

7. Preserve the direct-QR promise. Static/direct QR codes must encode the customer-entered destination directly by default. Never introduce redirects, tracking URLs, short links, or platform-owned scan paths unless the user explicitly chooses a tracking or hosted mode.

8. Validate at every boundary. Client-side validation is for fast feedback; backend validation is authoritative. Validate payloads, URLs, colors, file uploads, design configs, QR type schemas, export options, auth/session state, ownership, and plan entitlements.

9. Treat rendering and exporting as first-class systems. Preview and export must share the same canonical configuration model. Exporters should be format-specific, tested, and honest about limitations. Scannability validation must run before export.

10. Build for open-source maintainability. Code must be readable by humans and agentic coding tools. Use clear names, small functions, purposeful comments, documented schemas, simple setup, deterministic tests, CI quality gates, and contributor-friendly structure.

## Frontend Architecture Decision

Use Expo + React Native + TypeScript for the frontend, with React Native Web for the MVP web app and a clear path to native iOS and Android apps later.

The MVP is web-first, but the frontend must not be built as a web-only React application. Build the product interface using React Native primitives and cross-platform patterns from day one so the core app, editor, state model, validation flows, account screens, and QR management experience can move to native apps later with minimal rewrite.

Recommended frontend stack:

- Expo + React Native + TypeScript for the application foundation.
- React Native Web for the MVP browser experience.
- Expo Router for navigation and route organization.
- Tamagui for cross-platform UI components, responsive styling, themes, tokens, and layout primitives.
- OpenAPI-generated TypeScript API client from the Go backend contracts.
- TanStack Query for server state, caching, mutations, and API lifecycle management.
- Zustand or Jotai for local editor state, design state, and temporary anonymous-session state.
- React Hook Form plus Zod for forms, validation, and typed field schemas.
- SVG-first QR preview/rendering where practical, with raster/canvas export support where required by file format.
- Platform-specific modules only behind narrow interfaces.

Recommended monorepo structure:

```text
apps/
  web/                 # Expo web MVP target
  mobile/              # Future Expo iOS/Android target, can remain dormant initially

packages/
  ui/                  # Shared Tamagui components, tokens, themes, layout primitives
  qr-core/             # Pure TypeScript QR config models, validators, QR type schemas, scan-mode types
  qr-renderer/         # Shared SVG/rendering helpers and preview/export rendering logic
  api-client/          # Generated TypeScript client from OpenAPI contracts
  product-flows/       # BDD-style journey definitions and cross-platform flow tests
  test-utils/          # Shared frontend testing helpers
```

Frontend layering rules:

- UI components render state and raise events. They must not contain QR payload rules, export rules, authorization rules, or API orchestration logic.
- QR payload generation, QR type schemas, design schemas, scan-mode rules, and validation helpers belong in shared packages, not inside screens.
- API access must go through generated contract clients and service wrappers, not hand-written fetch calls scattered across the app.
- Editor state must be explicit, serializable, and compatible with saved project schemas.
- The QR editor should use a canonical configuration object as its source of truth.
- Preview rendering and export rendering should consume the same canonical configuration.
- Anonymous local state should be portable into authenticated saved-project state without data loss.
- Mobile-specific behavior, such as native sharing, file access, camera scanning, and push notifications, must be isolated behind platform adapters.

Critical rule:

Do not build a web-only React app with a vague promise to “port it later.” Use React Native primitives, shared UI tokens, typed schemas, shared routing concepts, and platform-aware abstractions from the beginning. Web-specific code is allowed only where the browser genuinely requires it, such as downloads, drag-and-drop file upload, print/export behavior, or browser storage. Any web-specific implementation must sit behind an interface that can later be implemented for iOS and Android.

MVP frontend priorities:

1. Excellent responsive web experience.
2. No-login QR creation and download.
3. Cross-platform QR editor architecture.
4. Shared validation and rendering configuration.
5. Account creation and saved QR management.
6. Production-ready export experience.
7. Clear path to native mobile without rewriting the product core.

Future native app considerations:

- Native apps should reuse the same QR config schemas, design schemas, API client, editor state model, and most UI components.
- Native apps may add camera-based scan testing, native share sheets, saved asset access, offline draft support, push notifications, and local file management.
- Native apps should not fork the product model or create separate QR behavior.
- Platform divergence should be intentional, documented, and isolated.

## Platform, Operations, and API Discipline

APIs must be versioned, always, with no exceptions. Every public API, internal API, webhook payload, exported schema, saved configuration schema, QR type schema, design schema, tracking schema, analytics event schema, and background job contract must carry an explicit version or be governed by a versioned contract. Breaking changes require a new version, migration path, compatibility policy, and tests.

Operational requirements:

- Every service, worker, and critical runtime component must expose health checks.
- Every critical path must emit structured logs, metrics, and traces where practical.
- Hosted redirect latency must be measured separately from normal API latency.
- Export job duration, failure rates, queue depth, and retry counts must be measured.
- QR generation, payload validation, rendering, export, upload, auth, save/edit, and download flows must produce useful diagnostic logs without leaking sensitive payloads.
- Error handling must produce safe user-facing messages and useful operator-facing diagnostics.
- Alerts must exist for hosted redirect failures, elevated 5xx rates, job queue failures, database connectivity issues, storage failures, email delivery failures, payment webhook failures, and unusual abuse patterns.
- Dashboards should exist for application health, hosted redirect performance, analytics ingestion, export jobs, API latency, auth failures, storage usage, and billing events.
- Every background job must be idempotent or explicitly designed to handle retries safely.
- Every recurring or asynchronous process must have dead-letter or failure inspection capability.
- Database migrations must be versioned, reversible where practical, and tested against representative data.
- Release pipelines must include automated tests, linting, formatting, contract validation, migration validation, dependency scanning, and build verification.
- Feature flags must be used for risky, paid, hosted, or partially complete capabilities.
- Configuration must be environment-driven, documented, validated at startup, and safe by default.
- Secrets must never be committed, logged, exposed to clients, or stored in normal configuration files.
- Rate limits, abuse controls, and ownership checks must be enforced on the backend.
- Backups, restore strategy, and data retention policies must be defined before hosted user data or scan analytics are production-critical.

Beautiful and maintainable product requirement:

The product must feel premium even when free. The UI should be clean, fast, responsive, and calm. The QR creation flow should feel obvious, visual, and forgiving. Advanced options should be powerful but not overwhelming. Empty states, warnings, validation messages, export screens, account screens, and dashboards must look intentional. Maintainability is part of beauty: small components, consistent spacing, reusable tokens, clear state boundaries, predictable schemas, readable code, and no mystery behavior.

## Codex Handoff Prompt

Use the following prompt when handing this backlog to Codex or another agentic coding system.

```text
You are the principal engineering agent for an open-source freemium QR code creation platform. Your job is to build the MVP first, not the entire long-term product.

Read the full product backlog before writing code. Then build only the MVP scope unless explicitly instructed otherwise.

MVP scope includes:
- Epic 1: Anonymous Static QR Code Creation and Download
- Epic 2: Account Creation, Saved QR Codes, Favorites, and Project Management
- Epic 5: Advanced Design Studio, Brand Kits, Templates, and Reusable Styles
- Epic 6: QR Code Types and Scan Destinations
- Epic 7: Export, Print Production, and Asset Delivery

Post-MVP scope that must not be built yet unless explicitly requested:
- Epic 3: Optional Self-Managed Scan Tracking
- Epic 4: Hosted Dynamic QR Codes, Redirects, and Premium Analytics
- Epic 8: Bulk QR Code Creation and Batch Operations
- Epic 9: Teams, Workspaces, Collaboration, and Permissions
- Epic 10: Billing, Plans, Subscriptions, and Entitlements
- Epic 11: Admin, Abuse Prevention, Moderation, and Trust/Safety
- Epic 12: Developer API, Webhooks, CLI, and Open-Source Self-Hosting
- Epic 13: Core Technical Architecture, Go Backend, Data Model, and Operations
- Epic 14: AI-Assisted Creation, Design Suggestions, and Campaign Optimization

Critical product promise:
Static/direct QR codes must encode the customer-entered destination directly by default. Do not route through our domain. Do not create hidden short links. Do not add tracking. Do not mutate user URLs silently. Tracking and hosted redirects are post-MVP unless explicitly pulled forward.

Technical foundation:
- Backend: Go.
- Frontend: Expo + React Native + TypeScript, React Native Web for MVP, Expo Router, Tamagui, TanStack Query, generated OpenAPI TypeScript client, React Hook Form, Zod, Zustand or Jotai.
- Architecture: modular monolith first, clean service boundaries, contract-first APIs, versioned APIs always, test-first implementation.
- Every API must be versioned. No exceptions.
- Every schema must be versioned: payload config, design config, export config, saved project config, QR type schema, asset schema, and API contracts.
- Use OpenAPI for HTTP contracts before implementing handlers.
- Use TDD for domain logic, payload generation, validation, rendering helpers, export logic, auth, ownership, and service behavior.
- Use BDD-style scenarios for critical user journeys.
- Build beautiful, responsive, maintainable UI. The free product should still feel premium.

Execution model:
Do not attempt to build the entire MVP in one pass. Break the work into subagent-sized workstreams and complete them in dependency order. If your environment supports subagents, assign these workstreams in parallel where possible. If it does not, simulate subagents by producing separate plans, files, tests, and commits for each workstream.

Recommended workstreams:

1. Architecture and repository foundation
   - Create monorepo structure.
   - Set up Go backend skeleton.
   - Set up Expo/React Native Web frontend skeleton.
   - Set up shared TypeScript packages.
   - Set up linting, formatting, tests, CI, environment config, and local dev scripts.
   - Define API versioning conventions.
   - Define schema versioning conventions.

2. Contract and schema workstream
   - Define OpenAPI v1 contracts for MVP APIs before implementation.
   - Define versioned JSON schemas/types for QR payload config, design config, export config, saved QR project, QR type definitions, and asset metadata.
   - Generate TypeScript API client from OpenAPI.
   - Add contract tests.

3. QR payload and validation workstream
   - Implement QR type registry for MVP QR types.
   - Implement URL, text, email, phone, SMS, Wi-Fi, vCard/contact, location, social profile, app download link, PDF URL, image URL, menu URL, review URL, crypto address, and payment link where practical for MVP.
   - Implement deterministic payload generation.
   - Implement validation with tests for every QR type.
   - Ensure direct URL QR codes encode the final destination directly.

4. QR rendering and design workstream
   - Implement canonical design config.
   - Implement SVG-first QR preview renderer.
   - Support module/dot styles, marker styles, colors, logo placement, frames, CTA text, quiet zone, and basic templates.
   - Implement scannability validation rules.
   - Add rendering tests for representative designs.

5. Export workstream
   - Implement PNG, JPG, SVG, and PDF export if feasible for MVP.
   - Prepare EPS or document why SVG/PDF is the initial print-vector strategy.
   - Ensure export consumes the same canonical config as preview.
   - Add export size, quiet zone, transparency, and file naming controls.
   - Add tests for export behavior and preview/export parity.

6. Frontend creator/editor workstream
   - Build the anonymous QR creation flow.
   - Build QR type picker and forms.
   - Build responsive design studio UI.
   - Build live preview.
   - Build validation and warning UI.
   - Build download/export UI.
   - Use React Native primitives and Tamagui. Do not build web-only React components.

7. Auth and saved project workstream
   - Implement account creation, sign-in, sign-out, password reset hooks/stubs if email service is not configured.
   - Implement saved QR project APIs.
   - Implement dashboard, detail page, edit, duplicate, favorite, archive, delete, and re-download.
   - Implement anonymous-to-account handoff without losing editor state.
   - Enforce ownership server-side.

8. Asset handling workstream
   - Implement logo upload for authenticated users if in MVP scope.
   - Implement anonymous logo handling without unnecessary persistence.
   - Validate file type and size.
   - Sanitize or block SVG uploads until safe sanitization exists.
   - Scope assets to users.

9. Observability and operations workstream
   - Add structured logging.
   - Add health checks.
   - Add metrics hooks for API latency, QR generation failures, export failures, auth failures, upload failures, and validation failures.
   - Add error boundaries and safe user-facing errors.
   - Add CI checks for tests, linting, formatting, contracts, and migrations.

10. UX polish and maintainability workstream
   - Make the product beautiful, simple, responsive, and fast.
   - Add strong empty states, loading states, validation copy, warnings, and helpful success states.
   - Keep advanced controls organized and non-overwhelming.
   - Refactor aggressively when components, services, or packages become too large.
   - Make names clear enough for humans and coding agents to understand.

Required development discipline:
- Write failing tests first for domain logic and services.
- Do not put business logic in HTTP handlers or UI components.
- Do not hand-write unversioned API calls.
- Do not create hidden redirects or tracking behavior.
- Do not store sensitive payloads in logs.
- Do not rely on frontend-only validation for security or ownership.
- Do not merge code without tests passing.
- Do not build post-MVP features unless explicitly instructed.
- Do not create a web-only frontend that will require a mobile rewrite.

Before coding, produce:
1. A concise implementation plan.
2. A proposed repo/package structure.
3. The MVP API contract outline.
4. The initial versioned schemas.
5. The first BDD scenarios.
6. The test strategy.
7. The first vertical slice to implement.

Recommended first vertical slice:
Anonymous URL QR creation with direct destination encoding, basic design customization, live preview, PNG/SVG export, and tests proving the generated QR payload is exactly the user-entered URL after safe normalization.

Definition of done for MVP:
- Anonymous users can create, customize, validate, and download direct QR codes without login.
- Registered users can save, edit, duplicate, favorite, archive, delete, and re-download QR codes.
- MVP QR types work with correct payload generation and validation.
- Preview and export are consistent.
- APIs and schemas are versioned.
- Tests cover critical domain logic and user journeys.
- CI passes.
- The UI is responsive, beautiful, and maintainable.
- The architecture is clean enough for future hosted tracking, teams, billing, APIs, and mobile apps without rewriting the core.
```

## MVP Vertical Slice Roadmap

Build the MVP as a sequence of shippable vertical slices. Each slice must deliver visible user value, working frontend behavior, backend/domain support where needed, tests, and documentation updates. Do not build broad horizontal infrastructure unless it directly enables the current or next vertical slice.

### Slice 1: Anonymous Direct URL QR Creation

Goal: Prove the core trust promise.

Scope:

- Anonymous user enters a website URL.
- System validates and safely normalizes the URL.
- Generated QR payload encodes the final destination URL directly.
- No redirect, no short link, no tracking, no platform-owned URL.
- User sees live preview.
- User can download PNG and SVG.
- Tests prove the encoded payload equals the intended direct URL.

Done when:

- A user can create and download a direct URL QR code without logging in.
- The QR code scans to the entered destination.
- Payload generation, validation, preview, and export have tests.

### Slice 2: QR Type Registry and Static Payload Types

Goal: Establish the extensible QR type model.

Scope:

- Define the QR type registry and versioned QR type schemas.
- Add static/direct QR types for URL, plain text, email, phone, SMS, Wi-Fi, vCard/contact, location/map link, and crypto wallet address.
- Add QR type picker and type-specific forms.
- Add payload preview for each type.
- Add validation for each type.

Done when:

- Users can switch QR types and generate valid payloads.
- Each QR type has tests for valid and invalid inputs.
- The registry is clean enough for contributors to add new QR types.

### Slice 3: Core Design Studio

Goal: Make QR codes visually customizable without breaking scannability.

Scope:

- Add foreground/background colors.
- Add module/dot styles.
- Add finder/marker styles.
- Add quiet-zone controls.
- Add basic frames and CTA text.
- Add logo upload/placement for anonymous session use, without unnecessary persistence.
- Add scannability warnings for contrast, logo size, quiet zone, dense payloads, and risky styling.

Done when:

- Users can customize a QR code and see live preview updates.
- Design settings are represented as a canonical versioned config.
- Scannability validation runs before download.
- Preview and export use the same design config.

### Slice 4: Export Production Hardening

Goal: Make downloaded assets production-ready.

Scope:

- Add PNG, JPG, SVG, and PDF export where practical for MVP.
- Decide whether EPS ships in MVP or whether SVG/PDF is the initial print-vector strategy.
- Add export size controls.
- Add transparent background support for compatible formats.
- Add quiet-zone preservation.
- Add print-readiness checklist.
- Add useful file naming.
- Add preview/export parity tests.

Done when:

- Users can download reliable assets for digital and print use.
- Format limitations are clearly explained.
- Exported files materially match preview.
- Export behavior has representative tests.

### Slice 5: Account Creation and Anonymous-to-Account Handoff

Goal: Let users save work only after the free value moment.

Scope:

- Add sign up, sign in, sign out, and basic session handling.
- Preserve anonymous QR editor state through signup/login.
- Let users save the current QR code after account creation.
- Explain account value without blocking anonymous download.
- Add backend ownership model from the beginning.

Done when:

- Anonymous users can create/download without login.
- Anonymous users can create an account and save the current QR without losing work.
- Auth and ownership are enforced server-side.

### Slice 6: Saved QR Dashboard and Project Management

Goal: Turn the product from a one-time generator into a useful workspace.

Scope:

- Saved QR dashboard with list/grid view.
- QR preview thumbnails.
- QR names, types, payload summaries, created/updated dates.
- Open saved QR detail page.
- Search, filter, and sort basics.
- Empty states.

Done when:

- Registered users can see and find saved QR codes.
- Saved QR records preserve payload, design, export, and validation config.
- Dashboard data is scoped to the authenticated user.

### Slice 7: Saved QR Editing, Duplication, Favorites, Archive/Delete, and Re-Download

Goal: Complete the MVP account management loop.

Scope:

- Edit saved QR configuration.
- Duplicate saved QR codes.
- Favorite/unfavorite QR codes.
- Archive and restore QR codes.
- Delete QR codes with confirmation.
- Re-download saved QR codes in supported formats.
- Warn users that changing a direct static QR payload requires redistributing the QR code.

Done when:

- Registered users can manage saved QR codes without rebuilding them from scratch.
- Direct QR behavior remains clear and honest.
- Destructive actions require confirmation.
- Ownership checks are tested.

### Slice 8: Templates and Reusable Styles

Goal: Make good design fast and repeatable.

Scope:

- Add template library for common use cases.
- Add QR-type-specific template recommendations.
- Let registered users save a custom design as a reusable style.
- Let users apply saved styles to new or existing QR codes.
- Add style preview, rename, duplicate, delete, and favorite where practical.

Done when:

- Users can start from a template instead of building from scratch.
- Registered users can reuse designs across QR codes.
- Styles do not include payload data unless explicitly duplicating a QR project.

### Slice 9: Brand Kit Basics and Saved Logo Assets

Goal: Support repeatable branded QR creation.

Scope:

- Let registered users create one basic brand kit.
- Store brand colors.
- Store reusable logos/assets with validation and ownership scoping.
- Apply brand kit colors/logo to QR designs.
- Keep multi-brand/team brand-kit complexity post-MVP unless explicitly pulled forward.

Done when:

- Registered users can reuse brand colors and logos.
- Asset uploads are validated and scoped.
- Brand kit use improves speed without complicating the anonymous flow.

### Slice 10: MVP Polish, Accessibility, Responsiveness, CI, and Release Readiness

Goal: Make the MVP feel premium, stable, and maintainable.

Scope:

- Responsive web polish across desktop, tablet, and mobile browsers.
- Accessibility pass for forms, controls, warnings, keyboard navigation, and screen-reader labels.
- Loading, empty, success, and error states.
- Error boundaries.
- CI checks for tests, linting, formatting, contracts, schemas, and migrations.
- Basic health checks and structured logs.
- Contributor setup documentation.
- MVP release checklist.

Done when:

- The product feels polished enough to ship publicly.
- Critical flows are tested.
- CI passes.
- Documentation is sufficient for a developer or agent to run and contribute.

## Engineering Principles: Zero AI Slop

This codebase must be built as if experienced engineers will maintain it for years. Agent-generated code is acceptable only when it is clear, tested, minimal, idiomatic, and maintainable. Zero AI slop is allowed.

Core principles:

- Clarity beats cleverness.
- Small, boring, composable code beats magical abstractions.
- Explicit contracts beat implicit behavior.
- Deterministic behavior beats “probably works.”
- Tests are part of the implementation, not an afterthought.
- Names must explain intent.
- Comments must explain why, not narrate obvious code.
- Every package, module, component, service, and function should have one clear responsibility.
- Delete dead code immediately.
- Do not scaffold fake extensibility before it is needed.
- Do not generate placeholder code, TODO-driven architecture, fake mocks, unused interfaces, or speculative abstractions.
- Do not create duplicate models for the same concept without a deliberate reason.
- Do not hide complexity in helpers with vague names like `utils`, `helpers`, `common`, or `misc` unless the contents are genuinely generic and stable.
- Do not accept code that passes tests but is unreadable, brittle, leaky, or hard to change.

## Go Backend Best Practices

Use idiomatic Go. Keep the backend simple, explicit, and easy to reason about.

Go standards:

- Use `gofmt` and `go vet` as mandatory gates.
- Prefer small packages organized by domain capability, not technical dumping grounds.
- Keep package names short, lowercase, and meaningful.
- Avoid circular dependencies.
- Accept interfaces at boundaries, return concrete types where practical.
- Define interfaces only where they are consumed, not where implementations are created.
- Keep HTTP handlers thin. Handlers parse requests, call application services, and write responses.
- Put business logic in domain/application services, not handlers, database repositories, or middleware.
- Use `context.Context` for request-scoped cancellation, deadlines, logging correlation, and tracing.
- Return errors explicitly. Do not panic for normal failures.
- Wrap errors with useful context using standard Go patterns.
- Use typed/domain errors where callers need to make decisions.
- Never leak internal error details to user-facing API responses.
- Keep repository/storage code focused on persistence only.
- Keep validation close to domain boundaries and run it server-side even when the frontend validates first.
- Use table-driven tests for payload generation, validators, QR type behavior, URL normalization, export settings, and authorization rules.
- Use integration tests for API contracts, persistence, auth flows, migrations, and critical end-to-end paths.
- Use dependency injection through constructors, not global mutable state.
- Avoid package-level mutable variables except for constants or carefully controlled registries.
- Use structured logging with request IDs/correlation IDs.
- Do not log sensitive payloads, passwords, tokens, raw secrets, payment data, or full private user data.
- Keep configuration typed and validated at startup.
- Make background jobs idempotent and retry-safe.
- Make migrations explicit, versioned, and tested.
- Prefer boring standard-library solutions unless a dependency earns its place.
- Pin and audit dependencies.

Recommended Go package shape for MVP:

```text
backend/
  cmd/
    api/                  # API server entrypoint
    worker/               # Background worker entrypoint, if needed
  internal/
    platform/             # config, logging, telemetry, http, validation, errors
    auth/                 # sessions, password auth, account security
    users/                # user profile/application logic
    qrtypes/              # QR type registry, schemas, validators, payload builders
    qrprojects/           # saved QR records, favorites, archive/delete, ownership
    designs/              # design schema validation and reusable styles
    exports/              # export config, rendering/export orchestration
    assets/               # uploads, logo assets, file validation, storage
    api/                  # versioned HTTP routes and request/response binding
    storage/              # database access and migrations
  migrations/
  openapi/
  tests/
```

Go API rules:

- All routes must be versioned, for example `/api/v1/...`.
- Request and response structs must match OpenAPI contracts.
- API handlers must validate request shape, auth, ownership, and entitlement before mutating data.
- API responses must use consistent error envelopes.
- Do not expose database IDs if a stable public ID is more appropriate.
- Use pagination for list endpoints from the beginning.
- Add contract tests for every endpoint.

## TypeScript and Frontend Best Practices

Use TypeScript strictly. The frontend must be portable, responsive, and maintainable.

TypeScript standards:

- Enable strict TypeScript settings.
- Avoid `any`. If unavoidable, isolate it, explain it, and convert to typed data as quickly as possible.
- Prefer `unknown` over `any` at untrusted boundaries.
- Use Zod or generated schemas to validate external data.
- Use generated OpenAPI types for API requests and responses.
- Do not duplicate backend contract types by hand.
- Keep domain/config types in shared packages, not inside screens.
- Use discriminated unions for QR types, scan modes, export formats, validation results, and async states.
- Make impossible states unrepresentable where practical.
- Keep functions small and pure where possible.
- Avoid mutation-heavy state code.
- Keep date, URL, color, and file-size handling explicit and tested.
- Do not suppress TypeScript errors to “make it compile.” Fix the design.
- Avoid broad type assertions. Narrow safely.
- No magic strings for QR types, export formats, scan modes, route names, or entitlement keys. Use typed constants/enums/unions.

React Native / Expo standards:

- Use React Native primitives and Tamagui components, not web-only DOM components, unless behind a platform adapter.
- Keep screens thin. Screens compose hooks, services, and components.
- Keep reusable UI in `packages/ui`.
- Keep QR logic out of UI components.
- Keep QR editor state serializable.
- Use TanStack Query for server state.
- Use Zustand or Jotai only for local/editor/session state.
- Do not mirror server state into local state without a clear reason.
- Use React Hook Form and Zod for complex forms.
- Keep form schemas close to QR type schemas where practical.
- Build responsive layouts with tokens and breakpoints, not one-off pixel hacks.
- Provide accessible labels, focus behavior, validation messaging, and keyboard support.
- Use error boundaries for editor/export flows.
- Make loading, empty, success, and error states intentional and designed.
- Do not bury core actions like preview, validate, download, save, or reset.

Recommended frontend package shape:

```text
frontend/
  apps/
    web/                  # Expo web target
    mobile/               # Future native app target
  packages/
    ui/                   # Tamagui design system, tokens, themes, primitives
    qr-core/              # QR config types, QR type schemas, validation helpers
    qr-renderer/          # SVG/canvas rendering and preview/export helpers
    api-client/           # Generated OpenAPI TypeScript client
    product-flows/        # BDD scenarios and journey tests
    test-utils/           # Shared test utilities
```

Frontend testing rules:

- Unit test pure QR logic, validators, URL builders, color contrast checks, scannability checks, and export configuration.
- Component test important UI states, including validation errors, warnings, empty states, and disabled actions.
- Flow test anonymous create-preview-download and create-account-save-edit-redownload.
- Use visual regression testing for the QR editor and export preview where practical.
- Add tests for mobile/responsive layout breakpoints where practical.

## Code Review Standard

A change is not acceptable if it contains AI-shaped filler, vague abstractions, untested business logic, duplicated schemas, dead code, misleading names, fake TODOs, silent behavior changes, hidden redirects, frontend-only enforcement, or brittle coupling.

Every PR should answer:

1. What user or system behavior changed?
2. What contract or schema changed?
3. What tests prove it works?
4. What could break?
5. What logs/metrics help us debug it?
6. Is the implementation simpler than the problem, or did we overbuild it?
7. Did we preserve the direct-QR promise?
8. Did we keep the UI beautiful, responsive, and maintainable?

## Engineering Quality Bar

- No business logic in controllers, handlers, UI components, or database access code.
- No hidden coupling between QR payload generation, visual rendering, saved project state, and export formats.
- No feature should rely only on frontend enforcement for security, ownership, or plan limits.
- No silent mutation of user-entered URLs.
- No generated QR code should be considered valid until payload validation and scannability validation have run.
- No exported file should differ materially from preview without a visible warning.
- No uploaded asset should be trusted without type validation, size limits, sanitization where needed, and ownership scoping.
- No schema change should ship without migration strategy and tests.
- No API should ship without contract documentation and representative tests.
- No MVP feature should be merged without unit tests, behavior tests for critical flows, and CI passing.

## Product Thesis

Build an open-source, freemium QR code creation platform that gives users a fast, beautiful, no-login path to create and download branded QR codes, while preserving a clean upgrade path for saved projects, favorites, self-managed scan tracking, and future premium analytics.

The product should compete with QR Code Creator-style tools on ease of use and design flexibility, but improve trust and transparency by defaulting to direct-destination QR codes instead of forced redirect URLs.

## Core Product Principles

1. Free users can create and download QR codes without logging in.
2. Static URL QR codes point directly to the customer-entered destination URL by default.
3. Users can optionally choose tracking, but tracking must be explicit and understandable.
4. Basic self-managed tracking should be available without forcing a subscription.
5. Robust hosted tracking and analytics will become a paid upgrade later.
6. Account creation is optional unless the user wants to save, favorite, manage, or use account-bound features.
7. The product is open source, so architecture, code, and product behavior should be clean, explainable, secure, and contributor-friendly.
8. The backend should be written in Go.

---

# Epic 1: Anonymous Static QR Code Creation and Download

## Epic Summary

As a first-time visitor, I want to create a QR code quickly without creating an account, customize its appearance, verify that it scans correctly, and download it in common file formats so I can use it immediately in print, packaging, signage, menus, business cards, events, or digital campaigns.

This is the product’s core free experience. It must be fast, trustworthy, and polished enough that users believe the paid version will be excellent.

## Product Intent

The user should land on the site, enter a destination or supported QR payload, customize the QR code visually, preview it live, and download it without friction. No login, no hidden redirect, no bait-and-switch.

For URL QR codes, the generated QR code must encode the exact destination URL entered by the customer unless the user explicitly opts into tracking.

## User Stories

### Story 1.1: Start a QR code without login

As a visitor, I want to start creating a QR code immediately without creating an account so that I can get value before deciding whether to register.

Acceptance criteria:

- The user can access the QR creation flow without signing in.
- The user can create at least one QR code from start to download without signing in.
- The interface clearly communicates that login is optional.
- The interface avoids dark patterns such as allowing creation but blocking download behind account creation.
- The user is offered account creation only after meaningful value is delivered, such as after preview or download.

### Story 1.2: Create a direct URL QR code

As a visitor, I want to enter a URL and generate a QR code that points directly to that URL so that scanners go exactly where I intended without being routed through a third-party redirect domain.

Acceptance criteria:

- The user can enter a valid HTTP or HTTPS URL.
- The generated QR code encodes the entered URL directly by default.
- The product does not replace the destination with a short link, tracking URL, or platform redirect unless the user explicitly opts into tracking.
- The UI clearly labels the QR code as “Direct” or equivalent.
- The user can inspect or copy the encoded QR payload before download.
- Invalid URLs produce clear, inline validation errors.
- URLs are normalized safely without changing the intended destination.

### Story 1.3: Support common static QR payload types

As a visitor, I want to create QR codes for common static data types so that I can use the tool for more than website links.

Acceptance criteria:

- The user can choose from supported static QR types.
- Initial supported types include URL, plain text, email, phone, SMS, Wi-Fi, vCard/contact, location/map link, and crypto wallet address.
- Each QR type has a focused form with only the fields needed for that payload.
- The generated QR payload follows common QR conventions for that type.
- The user can switch QR type before download without losing unrelated design choices.
- The user can preview the final encoded payload before download.

### Story 1.4: Live QR preview

As a visitor, I want the QR code preview to update as I edit content and design options so that I can see what I am creating before downloading it.

Acceptance criteria:

- The QR preview updates immediately or near-immediately when content changes.
- The QR preview updates when visual design options change.
- The preview handles loading and validation states gracefully.
- The preview preserves scannability warnings when design choices may reduce reliability.
- The preview works on desktop and mobile browsers.

### Story 1.5: Choose QR error correction level

As a visitor, I want to choose the QR error correction level so that I can balance scan reliability, data density, and visual customization.

Acceptance criteria:

- The user can choose error correction levels L, M, Q, and H.
- The product defaults to a safe level appropriate for visual customization, preferably Q or H when logos or aggressive styling are used.
- The UI explains the tradeoff in plain language.
- The generator validates that the entered payload can fit within the selected QR version and error correction level.
- If the payload is too large, the user receives a clear recommendation.

### Story 1.6: Customize foreground and background colors

As a visitor, I want to customize QR foreground and background colors so that the QR code matches my brand or design.

Acceptance criteria:

- The user can set foreground color.
- The user can set background color.
- The user can use a color picker.
- The user can enter hex color values manually.
- The product warns users when contrast is likely too low for reliable scanning.
- The product prevents transparent foreground colors that would make the QR unreadable.
- The user can reset colors to default black on white.

### Story 1.7: Support transparent background

As a visitor, I want to download a QR code with a transparent background so that I can place it cleanly on designed materials.

Acceptance criteria:

- The user can choose transparent background for supported export formats.
- PNG and SVG support transparent backgrounds.
- JPG export either disables transparency or explains that JPG does not support it.
- The preview clearly represents transparency.
- The product warns if the resulting QR code may not scan well on unknown backgrounds.

### Story 1.8: Customize QR module/dot style

As a visitor, I want to customize the shape of the QR code modules/dots so that the code looks more distinctive.

Acceptance criteria:

- The user can choose from multiple module styles.
- Initial module styles include square, circle/dot, rounded square, vertical rounded, horizontal rounded, diamond, star, and teardrop.
- The selected module style is reflected in live preview and export.
- The product preserves QR scannability as much as possible for each module style.
- The product warns when a selected style may require larger print size or higher contrast.
- The styling system is extensible so open-source contributors can add new module styles.

### Story 1.9: Customize finder/marker shapes

As a visitor, I want to customize the large QR corner markers so that the QR code has a more branded look.

Acceptance criteria:

- The user can customize finder marker outer shape.
- The user can customize finder marker inner shape.
- Initial outer marker styles include square, rounded square, circle, extra-rounded, cut-corner, leaf, and teardrop-inspired shapes.
- Initial inner marker styles include square, rounded square, circle, dot, diamond, and teardrop.
- Marker styling appears in preview and exported files.
- Marker customization remains compatible with standard QR scanner expectations.
- The product warns users when marker customization may reduce scannability.

### Story 1.10: Add a logo to the QR code

As a visitor, I want to add a logo to the center of the QR code so that the code is branded and recognizable.

Acceptance criteria:

- The user can upload a logo image.
- Supported upload formats include PNG, JPG, SVG, and WebP where technically practical.
- The user can resize the logo within safe limits.
- The user can choose whether the logo has a background plate.
- The user can choose logo plate shape, including square, rounded square, circle, and pill.
- The product automatically recommends or applies a high error correction level when a logo is added.
- The product warns if the logo is too large and may affect scanning.
- The uploaded logo is not permanently stored for anonymous users unless the user chooses to save the project after creating an account.

### Story 1.11: Add stickers, frames, and CTA text

As a visitor, I want to add a frame or sticker with optional CTA text so that the QR code is more noticeable and action-oriented.

Acceptance criteria:

- The user can choose from predefined frames/stickers.
- Initial frames include simple border, scan-me label, bottom CTA banner, speech bubble, ticket/pass style, coupon style, circular badge, and minimal no-frame.
- The user can edit CTA text.
- CTA text supports reasonable character limits.
- The user can customize frame color where appropriate.
- The frame does not interfere with QR payload modules.
- Exports include the selected frame and CTA text.

### Story 1.12: Choose overall QR shape treatment

As a visitor, I want to apply overall shape treatments so that the QR code can better fit campaign artwork or brand assets.

Acceptance criteria:

- The user can choose standard square QR layout.
- The user can choose visual treatments that make the overall QR appear circular, rounded, heart-like, hexagonal, star-like, or other decorative silhouettes where scannability allows.
- The product clearly distinguishes between true QR payload structure and decorative outer masking/treatment.
- The data-bearing QR area remains readable.
- The product warns when decorative treatments reduce scan reliability.
- The shape treatment system is extensible.

### Story 1.13: Download QR code files

As a visitor, I want to download my QR code in common formats so that I can use it across print and digital materials.

Acceptance criteria:

- The user can download PNG.
- The user can download JPG.
- The user can download SVG.
- The user can download EPS or an equivalent print-friendly vector format.
- The user can choose export size/resolution for raster formats.
- The user can choose margin/quiet-zone size.
- The exported file matches the preview.
- Downloads work without login.
- Downloaded file names are useful and safe.

### Story 1.14: Print-readiness controls

As a visitor, I want print-focused settings so that my QR code works reliably on physical materials.

Acceptance criteria:

- The user can select output size in pixels for digital use.
- The user can select physical size guidance for print use.
- The product provides quiet-zone recommendations.
- The product provides minimum-size guidance based on QR density and styling.
- The product recommends higher contrast and simpler shapes for small print sizes.
- The product can show a basic print-readiness checklist before download.

### Story 1.15: Scannability validation

As a visitor, I want the product to help me avoid creating a QR code that looks good but does not scan reliably.

Acceptance criteria:

- The product performs automated validation checks before download.
- Validation includes contrast, quiet zone, logo size, payload density, error correction level, foreground/background conflicts, and high-risk design combinations.
- The product shows warnings without being overly restrictive.
- The product provides clear fixes for each warning.
- The user can still download with warnings after acknowledging risk.

### Story 1.16: Reset, duplicate, and clear design controls

As a visitor, I want simple editing controls so that I can experiment without getting stuck.

Acceptance criteria:

- The user can reset design to default.
- The user can clear the current payload.
- The user can duplicate the current design locally within the session.
- The user can undo or revert recent design changes where feasible.
- The interface avoids destructive actions without warning.

### Story 1.17: Anonymous session persistence

As a visitor, I want my in-progress QR code to remain available during the current browser session so that I do not lose work accidentally.

Acceptance criteria:

- The current QR configuration persists locally during the browser session.
- Refreshing the page does not immediately wipe the user’s work.
- Anonymous state is stored locally, not server-side, unless the user creates an account and saves.
- The user can explicitly clear local work.
- Sensitive payload types are handled carefully and not unnecessarily retained.

### Story 1.18: Free-to-account handoff

As a visitor, I want the option to create an account after designing a QR code so that I can save it without starting over.

Acceptance criteria:

- The user can create an account from the completed QR flow.
- After account creation, the current QR configuration can be saved to the new account.
- The user is not forced to create an account to download.
- The transition from anonymous to authenticated state does not lose work.
- The product clearly explains what account creation unlocks.

## Non-Functional Requirements

- The anonymous creation flow should feel instant for common payloads.
- The generator should work reliably on modern desktop and mobile browsers.
- Generated direct QR codes should not require our backend to resolve scans.
- Anonymous uploads, such as logos, should be processed safely and not retained longer than necessary.
- Export rendering should be deterministic so the same configuration generates the same output.
- The implementation should be structured so design renderers, payload encoders, validators, and exporters are cleanly separated.
- The system should be ready for a Go backend, even if some preview rendering happens client-side.

---

# Epic 2: Account Creation, Saved QR Codes, Favorites, and Project Management

## Epic Summary

As a user who has created one or more QR codes, I want the option to create an account, save my QR codes, organize them, duplicate them, favorite them, and return later to manage my work so that I can use the product as an ongoing QR design and campaign workspace instead of a one-time generator.

This epic creates the bridge between the anonymous free experience and the deeper freemium product. Account creation should feel like a helpful upgrade, not a hostage situation. Users can still create and download QR codes for free without logging in, but accounts unlock persistence, organization, reuse, and future premium feature eligibility.

## Product Intent

The product should earn account creation by giving users a reason to come back. A user who creates a QR code anonymously should be able to save that exact work into a new account without losing anything. A returning user should have a lightweight dashboard where saved QR codes are easy to find, edit, duplicate, favorite, archive, and download again.

The account layer should also prepare the product for future paid plans, hosted tracking, team features, API access, brand kits, and reusable design templates, without prematurely forcing those concepts into the v1 free experience.

## User Stories

### Story 2.1: Create an account from the QR creation flow

As an anonymous user, I want to create an account after designing a QR code so that I can save my work without starting over.

Acceptance criteria:

- The user can create an account from the QR creation flow.
- The current anonymous QR configuration is preserved during account creation.
- After account creation, the user can save the QR code to their account.
- The user is not required to create an account before downloading a QR code.
- The UI explains what account creation unlocks, including saving, editing later, favoriting, organizing, and future tracking features.
- Failed account creation does not destroy the in-progress QR code.

### Story 2.2: Sign up with email and password

As a new user, I want to create an account with email and password so that I can access saved QR codes across devices.

Acceptance criteria:

- The user can sign up with a valid email address and password.
- The product validates email format.
- The product enforces reasonable password requirements.
- The user receives clear inline validation for signup errors.
- Duplicate email signups are handled securely without exposing unnecessary account information.
- Passwords are never stored in plain text.
- The system supports email verification, even if verification is optional in the first release.

### Story 2.3: Sign in and sign out

As a registered user, I want to sign in and sign out securely so that I can control access to my saved QR codes.

Acceptance criteria:

- The user can sign in with email and password.
- The user can sign out from any authenticated page.
- The product preserves safe return paths after login.
- Failed login attempts show clear but secure error messaging.
- Auth sessions use secure, HTTP-only cookies or an equivalent secure session strategy.
- The product avoids leaking whether a specific account exists through overly specific login errors.

### Story 2.4: Reset password

As a registered user, I want to reset my password if I forget it so that I can regain access to my saved QR codes.

Acceptance criteria:

- The user can request a password reset by email.
- Password reset links are time-limited and single-use.
- The product does not reveal whether an email address has an account.
- The user can set a new password using a valid reset token.
- Expired or invalid reset links produce clear recovery guidance.

### Story 2.5: View saved QR codes in a dashboard

As a registered user, I want a dashboard of my saved QR codes so that I can find and manage previous work.

Acceptance criteria:

- The user can view a list or grid of saved QR codes.
- Each saved QR code shows a preview thumbnail.
- Each saved QR code shows its name, type, destination or payload summary, creation date, and last updated date.
- The user can open a saved QR code for details or editing.
- The dashboard handles empty state with a clear prompt to create the first QR code.
- The dashboard loads quickly for typical user libraries.

### Story 2.6: Save a QR code

As a registered user, I want to save a QR code configuration so that I can edit, download, or reuse it later.

Acceptance criteria:

- The user can save a QR code from the creation flow.
- The saved record includes payload type, payload data, design settings, logo settings, frame settings, export preferences, and validation state.
- The user can name the saved QR code.
- If the user does not provide a name, the product generates a useful default name.
- Saving does not change a direct QR code into a redirect QR code.
- Saved static QR codes remain direct unless the user explicitly enables tracking later.

### Story 2.7: Edit a saved QR code

As a registered user, I want to reopen and edit a saved QR code so that I can update its design or payload when needed.

Acceptance criteria:

- The user can open a saved QR code in the editor.
- The editor loads the saved payload and design settings accurately.
- The user can modify supported fields.
- The user can save changes.
- The user can cancel changes without overwriting the saved version.
- The product makes it clear that changing the payload of a direct static QR code requires downloading and redistributing a new QR code.
- The product does not imply that already-printed direct static QR codes can be changed after distribution.

### Story 2.8: Duplicate a saved QR code

As a registered user, I want to duplicate an existing QR code so that I can reuse a design without rebuilding it from scratch.

Acceptance criteria:

- The user can duplicate a saved QR code from the dashboard or detail page.
- The duplicate preserves payload type, design settings, logo settings, frame settings, and export preferences.
- The duplicate receives a distinct name, such as “Copy of [Original Name].”
- The duplicate can be edited independently.
- Duplicating a QR code does not enable tracking or paid features automatically.

### Story 2.9: Favorite saved QR codes

As a registered user, I want to favorite important QR codes so that I can quickly find the ones I use most.

Acceptance criteria:

- The user can mark a saved QR code as a favorite.
- The user can remove a QR code from favorites.
- Favorites are visible in the dashboard.
- The user can filter or sort by favorites.
- Favorite state persists across sessions and devices.

### Story 2.10: Search saved QR codes

As a registered user, I want to search my saved QR codes so that I can quickly locate a specific code.

Acceptance criteria:

- The user can search by QR code name.
- The user can search by destination URL or payload summary where safe and appropriate.
- Search results update quickly.
- Empty search results provide useful guidance.
- Search respects the authenticated user’s ownership boundaries.

### Story 2.11: Filter and sort saved QR codes

As a registered user, I want to filter and sort saved QR codes so that I can manage larger collections efficiently.

Acceptance criteria:

- The user can filter by QR type.
- The user can filter by direct, self-tracked, or hosted-tracked status once tracking exists.
- The user can filter by favorite status.
- The user can sort by newest, oldest, recently updated, name, and QR type.
- Filter and sort state is reflected clearly in the UI.
- The user can reset filters easily.

### Story 2.12: Organize QR codes with folders or collections

As a registered user, I want to group saved QR codes into folders or collections so that I can organize work by campaign, customer, location, brand, or use case.

Acceptance criteria:

- The user can create a folder or collection.
- The user can rename a folder or collection.
- The user can move saved QR codes into and out of folders.
- A QR code can exist in at least one folder or collection.
- The product has a sensible default location for uncategorized QR codes.
- Deleting a folder does not accidentally delete QR codes unless explicitly chosen and confirmed.

### Story 2.13: Add tags to saved QR codes

As a registered user, I want to tag saved QR codes so that I can organize and find them across folders or campaigns.

Acceptance criteria:

- The user can add one or more tags to a saved QR code.
- The user can remove tags.
- The user can filter by tag.
- Tags are user-scoped.
- Duplicate tags are normalized safely.
- Tag names have reasonable length limits.

### Story 2.14: Archive and restore saved QR codes

As a registered user, I want to archive old QR codes instead of deleting them so that I can clean up my dashboard without losing history.

Acceptance criteria:

- The user can archive a saved QR code.
- Archived QR codes are hidden from the default dashboard view.
- The user can view archived QR codes.
- The user can restore an archived QR code.
- Archiving a direct static QR code does not affect scans, because scans go directly to the encoded destination.
- Archiving a future hosted-tracked QR code should not break its redirect behavior unless the user explicitly disables it.

### Story 2.15: Delete a saved QR code

As a registered user, I want to delete saved QR codes I no longer need so that I can manage my account cleanly.

Acceptance criteria:

- The user can delete a saved QR code.
- The product requires confirmation before deletion.
- The confirmation explains what deletion does and does not do.
- Deleting a direct static QR record does not affect already-downloaded QR codes.
- Deleted QR codes are removed from the dashboard.
- The system supports soft delete or recoverability according to product policy.

### Story 2.16: Re-download a saved QR code

As a registered user, I want to download a saved QR code again so that I can reuse it without rebuilding it.

Acceptance criteria:

- The user can download a saved QR code from the dashboard, detail page, or editor.
- The user can choose supported formats and sizes during re-download.
- The exported file matches the saved configuration.
- Re-download does not require re-generating the QR code manually.
- Direct QR codes remain direct during re-download.

### Story 2.17: View QR code detail page

As a registered user, I want a detail page for each saved QR code so that I can understand its configuration and available actions.

Acceptance criteria:

- The detail page shows a large preview.
- The detail page shows name, type, destination or payload summary, created date, updated date, direct/tracking status, and design summary.
- The detail page provides actions for edit, duplicate, favorite, download, archive, delete, and future tracking setup.
- The detail page clearly distinguishes static direct QR behavior from tracked QR behavior.
- The page is accessible only to the owner unless sharing features are introduced later.

### Story 2.18: Preserve anonymous work after login or signup

As a user moving from anonymous to authenticated, I want my current QR work to survive login or signup so that creating an account does not interrupt my workflow.

Acceptance criteria:

- If the user starts anonymously and then logs in, the in-progress QR code remains available.
- If the user starts anonymously and then signs up, the in-progress QR code remains available.
- The user can choose whether to save the anonymous QR code into the account.
- The product handles conflicts between local anonymous state and existing account state.
- The user does not lose uploaded logo or design choices during the handoff, subject to safe upload handling.

### Story 2.19: Account profile basics

As a registered user, I want to manage basic account information so that I can maintain access and identity.

Acceptance criteria:

- The user can view account email.
- The user can update display name.
- The user can change password if using password-based authentication.
- The user can request email change if supported.
- The user can see current plan status, starting with Free.
- The account page is simple and does not distract from QR creation and management.

### Story 2.20: Free plan limits and upgrade readiness

As a product owner, I want the Free account plan to have clear, generous limits and upgrade-ready boundaries so that we can monetize later without making the free product feel crippled.

Acceptance criteria:

- The system supports plan-aware limits even if v1 has generous or unlimited free limits.
- Initial free account capabilities include saving QR codes, editing saved QR codes, favoriting, folders or collections, tags, and re-downloads.
- Future premium capabilities can be gated without rewriting the account model.
- The UI does not aggressively upsell features that do not exist yet.
- Upgrade prompts are contextual, honest, and dismissible.
- The account model can support future subscriptions, hosted analytics, team accounts, brand kits, API access, and custom domains.

### Story 2.21: Privacy and ownership boundaries

As a registered user, I want my saved QR codes to be private to my account so that other users cannot access or modify my work.

Acceptance criteria:

- Saved QR codes are scoped to the owning user.
- Unauthorized users cannot view, edit, download, archive, or delete another user’s saved QR codes.
- Backend authorization checks are enforced server-side.
- Public sharing is not available unless explicitly introduced as a future feature.
- Logs avoid exposing sensitive payloads unnecessarily.

### Story 2.22: Safe handling of saved logos and assets

As a registered user, I want logos and uploaded assets used in saved QR codes to be stored safely so that my saved designs render correctly later.

Acceptance criteria:

- If a user saves a QR code with a logo, the logo asset can be associated with the saved QR code.
- Uploaded assets are scanned or validated according to security policy.
- SVG uploads are sanitized or restricted.
- Asset storage is scoped to the user.
- The user can remove or replace a saved logo.
- Deleting a QR code handles associated assets according to storage policy.

### Story 2.23: Saved design metadata for open-source extensibility

As an open-source contributor, I want saved QR configurations to use a clear, versioned schema so that future renderers, import/export tools, and migrations are manageable.

Acceptance criteria:

- Saved QR configurations are represented using a documented schema.
- The schema includes a version field.
- The schema separates payload, design, frame, logo, export, and tracking configuration.
- Unknown future fields can be handled safely.
- Migrations can upgrade older saved configurations when the schema changes.
- The schema is readable enough for contributors to understand without reverse-engineering database internals.

## Non-Functional Requirements

- Account creation must not block anonymous QR creation or anonymous download.
- Authentication and authorization must be implemented securely from the first release.
- Saved QR operations should be fast for normal user libraries.
- The account model should support future team/workspace functionality without overcomplicating v1.
- User-owned records must be isolated at the backend, not just filtered in the frontend.
- Saved QR configuration should be deterministic and portable.
- The system should be designed for a Go backend with clear service boundaries around auth, user profiles, QR projects, assets, and future billing/tracking.
- The account experience should be lightweight enough that users still perceive the product as fast and free-first.

---

---

# Epic 3: Optional Self-Managed Scan Tracking

## Epic Summary

As a user creating a QR code, I want to choose whether scans go directly to my destination or through a tracking mechanism I control so that I can measure engagement without being forced into a paid subscription or an opaque platform redirect.

This epic introduces the product’s most important strategic differentiation: tracking is optional, transparent, and user-controlled. The default QR code remains direct. If the user wants scan data, they can opt into self-managed tracking for free by providing their own tracking destination, analytics endpoint, webhook, or third-party analytics integration. Future hosted analytics can become a paid upgrade, but the free product should still empower technical and semi-technical users to track scans themselves.

## Product Intent

Most QR platforms use dynamic QR codes as a subscription wedge. They route scans through their own redirect domain, collect scan data, and require paid plans to access meaningful analytics or keep editability alive. This product should invert that relationship.

Users should clearly understand the three available scan modes:

1. Direct QR: Encodes the final destination URL directly. No redirect. No platform tracking. Best for permanence, trust, privacy, and print reliability.
2. Self-managed tracking: Encodes a user-controlled tracking URL or integration path. The user owns the analytics path. The product helps construct and validate it, but does not own the redirect or require a subscription.
3. Hosted tracking: A future paid capability where our platform provides managed redirects, dashboards, analytics, attribution, and campaign reporting.

In v1, this epic focuses on direct QR and self-managed tracking. Hosted premium tracking should be represented only as an upgrade-ready concept, not as a blocking dependency.

## User Stories

### Story 3.1: Choose scan behavior explicitly

As a QR creator, I want to choose whether my QR code is direct or tracked so that I understand exactly what scanners will hit.

Acceptance criteria:

- The QR creation flow defaults to Direct QR.
- The user can switch to Self-managed tracking.
- The UI clearly explains the difference between Direct QR and Self-managed tracking.
- The selected scan mode is visible before download.
- The selected scan mode is stored with saved QR codes.
- The product never silently changes a Direct QR into a tracked QR.
- The product never silently changes a user’s final URL into a platform redirect.

### Story 3.2: Direct QR mode remains the default

As a user who does not need analytics, I want QR codes to point directly to my destination by default so that I avoid unnecessary redirects, subscriptions, platform lock-in, and privacy concerns.

Acceptance criteria:

- For URL QR codes, Direct QR mode encodes the entered destination URL exactly after safe normalization.
- The generated QR payload does not use the product’s domain.
- The generated QR payload does not use a short link service.
- The generated QR payload does not include tracking parameters unless the user explicitly adds them or enables a tracking option.
- The UI labels the QR code as direct.
- The detail page for saved QR codes clearly shows direct status.

### Story 3.3: Explain the tradeoffs between direct and tracked QR codes

As a user, I want a simple explanation of direct versus tracked QR codes so that I can choose the right mode for my use case.

Acceptance criteria:

- The UI explains that Direct QR codes are permanent and scan straight to the encoded destination.
- The UI explains that Direct QR codes cannot provide scan analytics through our platform.
- The UI explains that changing the destination of an already-printed Direct QR code requires generating and redistributing a new QR code.
- The UI explains that tracking requires some form of redirect or analytics-enabled URL.
- The UI explains that Self-managed tracking means the user controls the tracking infrastructure or third-party analytics destination.
- The explanation is concise and appears contextually, not as a blocking wall of text.

### Story 3.4: Enable self-managed tracking with a user-owned tracking URL

As a user, I want to provide my own tracking URL so that my QR code can route through infrastructure I control before reaching the final destination.

Acceptance criteria:

- The user can select Self-managed tracking.
- The user can enter a tracking URL.
- The user can enter the final destination URL separately.
- The product explains that the QR code will encode the tracking URL, not the final destination URL.
- The product validates that the tracking URL is a valid HTTP or HTTPS URL.
- The product validates that the final destination URL is a valid HTTP or HTTPS URL when required.
- The user can preview the actual encoded QR payload.
- The product does not host, operate, or guarantee the user’s tracking redirect unless hosted tracking is explicitly selected in a future paid feature.

### Story 3.5: Support destination URL parameter injection

As a user with my own tracking endpoint, I want the product to append the final destination as a parameter so that my tracking service knows where to redirect after logging the scan.

Acceptance criteria:

- The user can configure a destination parameter name, such as `url`, `dest`, `redirect`, or a custom value.
- The product can generate a tracking URL that includes the encoded final destination as a query parameter.
- The product safely URL-encodes the destination parameter.
- The product shows the full final encoded QR payload before download.
- The product warns users about open redirect risks if their tracking endpoint blindly redirects to arbitrary URLs.
- The product provides safe implementation guidance for self-hosted tracking endpoints.

### Story 3.6: Support UTM parameter builder

As a marketer, I want to add UTM parameters to my destination URL so that I can track QR traffic in my existing analytics tools without needing a redirect.

Acceptance criteria:

- The user can enable UTM parameters in Direct QR mode.
- The user can enter source, medium, campaign, term, and content values.
- The product defaults source or medium values sensibly for QR usage, such as `qr` or `offline`.
- The product appends UTM parameters to the destination URL safely.
- The final encoded payload is visible before download.
- The product clearly communicates that UTM tracking depends on the destination website’s analytics setup.
- UTM parameters do not require an account.

### Story 3.7: Save reusable tracking presets

As a registered user, I want to save tracking presets so that I can reuse the same self-managed tracking configuration across multiple QR codes.

Acceptance criteria:

- The user can save a self-managed tracking preset.
- A preset can include tracking base URL, destination parameter name, fixed query parameters, UTM defaults, and notes.
- The user can name a preset.
- The user can apply a preset to a new or saved QR code.
- The user can edit or delete presets.
- Presets are scoped to the authenticated user.
- Anonymous users can configure self-managed tracking for a single session, but cannot save presets unless they create an account.

### Story 3.8: Provide common third-party analytics patterns

As a user, I want guided setup for common analytics tools so that I can track QR traffic using tools I already have.

Acceptance criteria:

- The product provides guidance for common analytics approaches, including UTM tracking for Google Analytics, privacy-friendly analytics tools, custom webhook endpoints, and self-hosted redirect services.
- The product supports configurable URL parameters for third-party tools.
- The product does not claim to integrate directly with tools unless an actual integration exists.
- The guidance distinguishes between analytics that happen on the destination website and analytics that happen at redirect time.
- The UI helps users understand whether they need access to the destination website, a redirect endpoint, or both.

### Story 3.9: Generate a sample self-hosted tracking endpoint

As a technical user, I want example code for a self-hosted tracking endpoint so that I can run tracking myself.

Acceptance criteria:

- The product includes documentation for a minimal self-hosted tracking endpoint.
- The example includes request logging and redirect behavior.
- The example warns against unsafe open redirects.
- The example includes validation of allowed destination domains.
- The example can be implemented in Go to align with the product backend stack.
- The documentation explains what data is captured, such as timestamp, user agent, IP-derived approximate location if implemented, referrer, and QR identifier.
- The documentation avoids implying that all scan metadata is perfectly reliable.

### Story 3.10: Optional QR identifier parameter

As a user tracking multiple QR codes through my own endpoint, I want each QR code to include an identifier so that I can distinguish scans by code or campaign.

Acceptance criteria:

- The user can add a QR identifier parameter to self-managed tracking URLs.
- The user can choose a parameter name, such as `qr`, `qid`, or `campaign`.
- The user can enter a custom identifier or use a generated one.
- The identifier is included in the final encoded tracking URL.
- The identifier is stored with saved QR codes.
- The product explains that identifier reporting depends on the user’s tracking endpoint or analytics tool.

### Story 3.11: Validate tracking URL behavior

As a user, I want the product to validate my self-managed tracking URL so that I can avoid broken QR codes.

Acceptance criteria:

- The product validates tracking URL syntax client-side.
- The product can optionally perform a server-side reachability check for registered users.
- The product can show whether the tracking URL appears reachable.
- The product can identify obvious redirect loops where feasible.
- The product warns if the tracking URL does not include the final destination parameter when one is expected.
- The product does not require reachability checks to download, because some endpoints may block automated checks.
- The product clearly distinguishes between validation warnings and hard errors.

### Story 3.12: Preview final scan path

As a user, I want to preview the scan path so that I understand where a scanner will go.

Acceptance criteria:

- Direct QR mode shows a single-step path from QR code to destination URL.
- Self-managed tracking mode shows a multi-step path from QR code to tracking URL to final destination.
- The preview shows the actual encoded QR payload.
- The preview shows any appended query parameters.
- The preview warns if the scan path depends on infrastructure outside our product.
- The preview is visible before download.

### Story 3.13: Make self-managed tracking available without subscription

As a user, I want to use self-managed tracking without paying a subscription so that I can own my analytics workflow.

Acceptance criteria:

- Self-managed tracking is available on the free plan.
- Self-managed tracking does not require a paid subscription.
- Anonymous users can configure self-managed tracking for a downloadable QR code.
- Registered free users can save self-managed tracking configurations with their QR codes.
- The product does not artificially restrict scan volume for self-managed tracking because scans do not hit our hosted redirect service.
- The product clearly explains that the user is responsible for operating their own tracking endpoint or analytics setup.

### Story 3.14: Prepare for future hosted tracking upgrade

As a product owner, I want the tracking model to support future hosted analytics so that paid tracking can be added later without redesigning the product.

Acceptance criteria:

- Saved QR codes include a tracking mode field.
- Supported tracking modes include at least `direct`, `self_managed`, and future-ready `hosted`.
- The data model can distinguish final destination URL, encoded URL, tracking provider, tracking configuration, and analytics ownership.
- The UI can show hosted tracking as “coming later” or hide it until available.
- The architecture allows future hosted redirect links without changing the direct QR behavior.
- The product does not advertise paid hosted tracking as available until it exists.

### Story 3.15: Prevent misleading analytics claims

As a user, I want the product to be honest about what it can and cannot track so that I can make informed decisions.

Acceptance criteria:

- Direct QR mode does not claim scan analytics are available through our platform.
- UTM tracking is described as website analytics, not QR scan analytics.
- Self-managed redirect tracking is described as dependent on the user’s endpoint.
- The product explains that QR scans cannot always identify unique people accurately.
- The product explains that device, location, and browser data may be approximate or unavailable.
- Marketing copy avoids implying that free self-managed tracking includes our hosted dashboard.

### Story 3.16: Privacy-aware tracking guidance

As a user, I want guidance on responsible tracking so that I do not accidentally collect sensitive or unnecessary scan data.

Acceptance criteria:

- The product includes basic privacy guidance for tracking setups.
- The product warns against collecting unnecessary personal information.
- The product explains that IP addresses, user agents, and precise location handling may have privacy and compliance implications.
- The product encourages clear notices where appropriate for campaigns that collect user data.
- The product provides safe defaults for UTM-based tracking.
- The product avoids adding hidden tracking parameters without user consent.

### Story 3.17: Store tracking configuration with saved QR codes

As a registered user, I want my tracking configuration saved with each QR code so that I can understand and reproduce the scan behavior later.

Acceptance criteria:

- Saved QR records include tracking mode.
- Saved QR records include the encoded QR payload.
- Saved QR records include final destination URL where applicable.
- Saved QR records include self-managed tracking URL and parameter configuration where applicable.
- Saved QR records preserve UTM settings.
- The detail page clearly displays tracking configuration in a readable format.
- Sensitive secrets are not stored in QR tracking configuration unless explicitly supported and securely handled.

### Story 3.18: Warn when editing tracked or direct saved codes

As a registered user, I want clear warnings when changing saved QR codes so that I understand whether printed codes will still work as expected.

Acceptance criteria:

- Editing a Direct QR payload warns that already-downloaded or printed codes will not change.
- Editing a Self-managed tracking destination explains whether the encoded tracking URL changes.
- If the self-managed tracking endpoint uses a destination parameter embedded in the QR payload, changing the destination requires redistributing a new QR code.
- If the self-managed tracking endpoint owns destination lookup by QR identifier, the product explains that changes happen in the user’s system, not ours.
- Future hosted tracking can support editable destinations through our redirect service, but that behavior is not implied for direct or self-managed modes.

### Story 3.19: Export tracking setup summary

As a registered user, I want to export or copy a summary of my tracking setup so that I can configure my analytics system or share instructions with a developer.

Acceptance criteria:

- The user can copy the final encoded QR URL.
- The user can copy the final destination URL.
- The user can copy the tracking URL template.
- The user can copy UTM parameters.
- The user can export a simple text or JSON summary of tracking configuration.
- The exported summary avoids including secrets.

### Story 3.20: Tracking mode visual indicator

As a user, I want a clear visual indicator of the QR code’s scan mode so that I do not confuse direct, self-managed, and hosted-tracked codes.

Acceptance criteria:

- The editor shows the current tracking mode.
- The dashboard shows the current tracking mode for saved QR codes.
- The detail page shows the current tracking mode.
- Download confirmation or export summary includes the tracking mode.
- Direct QR mode is visually distinct from tracked modes.
- Visual indicators are accessible and not color-only.

## Non-Functional Requirements

- Direct QR generation must not depend on our backend redirect infrastructure.
- Self-managed tracking should be configuration-driven and should not require our servers to receive scan traffic.
- The product must avoid hidden redirects or undisclosed tracking behavior.
- Tracking configuration should be represented using a clear, versioned schema.
- URL construction must be safe, deterministic, and well-tested.
- The system should sanitize and validate user-provided URLs carefully.
- The architecture should leave room for a future Go-based hosted redirect and analytics service without coupling it to static QR generation.
- Documentation for self-managed tracking should be understandable by technical users and transparent enough for non-technical users to know when they need help.
- The product should avoid storing secrets in QR configurations unless a future secure secret-management design exists.

---

---

# Epic 4: Hosted Dynamic QR Codes, Redirects, and Premium Analytics

## Epic Summary

As a registered user with business, campaign, or operational needs, I want to create hosted dynamic QR codes that use a managed redirect, allow destination changes after distribution, and provide robust scan analytics so that I can measure performance, update campaigns, and manage QR codes at scale.

This epic defines the paid upgrade foundation. Hosted dynamic QR codes are different from free Direct QR codes and free Self-managed tracking. In hosted mode, scans route through our redirect infrastructure, which enables editable destinations, analytics, attribution, dashboards, exports, alerts, and future enterprise features.

## Product Intent

The product should monetize hosted capabilities without breaking trust. Direct QR codes remain free and direct. Self-managed tracking remains free and user-owned. Hosted tracking is a premium convenience and power layer for users who want us to operate the redirect infrastructure, collect analytics, display dashboards, manage destinations, and support more advanced campaign workflows.

The user must always understand that hosted dynamic QR codes encode one of our managed redirect URLs, not the final destination URL. This is acceptable because the user explicitly chooses hosted tracking for the benefits it provides.

## User Stories

### Story 4.1: Upgrade to hosted dynamic QR mode

As a registered user, I want to upgrade a QR code to hosted dynamic mode so that I can change its destination later and use managed analytics.

Acceptance criteria:

- Hosted dynamic mode is available only to authenticated users.
- The user can select Hosted tracking or Dynamic QR mode from the QR editor.
- The UI clearly explains that hosted dynamic QR codes route through our managed redirect URL.
- The UI clearly explains the benefits: editable destination, analytics, dashboards, exports, and future campaign tools.
- The user must explicitly confirm hosted mode before download.
- The generated QR payload uses a managed redirect URL.
- The final destination URL is stored separately from the encoded managed redirect URL.
- Direct QR codes are not silently converted to hosted dynamic mode.

### Story 4.2: Create a hosted redirect link

As a hosted tracking user, I want the system to create a managed redirect link so that scans can be routed, measured, and forwarded to the final destination.

Acceptance criteria:

- The system creates a unique redirect identifier for each hosted dynamic QR code.
- The redirect URL is stable after creation.
- The redirect URL resolves quickly to the current destination URL.
- The redirect service records eligible scan events before redirecting.
- The redirect service handles unavailable or disabled QR codes gracefully.
- The redirect service avoids exposing internal database identifiers where practical.
- The redirect service supports a future custom-domain mapping model.

### Story 4.3: Edit destination after QR distribution

As a hosted dynamic QR user, I want to change the destination URL after the QR code has already been downloaded or printed so that I can update campaigns without redistributing the QR code.

Acceptance criteria:

- The user can edit the destination URL for a hosted dynamic QR code.
- The encoded QR payload remains the same after destination edits.
- Future scans route to the updated destination.
- The user can see current destination URL.
- The user can see destination last updated date.
- The UI explains that this editability applies only to hosted dynamic QR codes, not Direct QR codes.
- Invalid destination URLs are rejected with clear validation.

### Story 4.4: Maintain destination history

As a hosted dynamic QR user, I want to see destination history so that I can audit where a QR code has pointed over time.

Acceptance criteria:

- The system stores destination change history.
- Destination history includes previous URL, new URL, timestamp, and actor.
- The user can view destination history from the QR detail page.
- The user can optionally restore a prior destination.
- Destination history is scoped to the owning user or workspace.
- Sensitive query parameters are handled according to privacy policy and redaction settings.

### Story 4.5: Pause and resume a hosted QR code

As a hosted dynamic QR user, I want to pause a QR code so that scans stop redirecting during expired, incorrect, or risky campaigns.

Acceptance criteria:

- The user can pause a hosted dynamic QR code.
- Paused QR codes do not redirect to the destination.
- Paused QR codes show a configurable fallback page or default inactive message.
- The user can resume a paused QR code.
- Pause/resume events are recorded in QR history.
- Direct QR codes cannot be paused by our platform because they do not route through us.

### Story 4.6: Configure fallback destination or inactive page

As a hosted dynamic QR user, I want to configure what scanners see when a QR code is paused, expired, or unavailable so that the experience remains professional.

Acceptance criteria:

- The user can choose a default inactive page.
- The user can configure a fallback URL.
- The user can configure simple fallback copy for hosted inactive pages.
- The fallback behavior is used when a code is paused, expired, disabled, or blocked.
- The fallback behavior is shown clearly in QR settings.
- The fallback configuration is plan-aware if advanced customization becomes premium-only.

### Story 4.7: Set QR expiration rules

As a hosted dynamic QR user, I want to set expiration rules so that campaign QR codes stop working or redirect elsewhere after a campaign ends.

Acceptance criteria:

- The user can set an optional expiration date and time.
- The user can choose what happens after expiration: inactive page, fallback URL, or preserve current destination if no expiration behavior is selected.
- Expiration status is visible on the dashboard and detail page.
- Expired QR codes stop redirecting to the destination when configured to do so.
- Expiration events are included in QR history.
- The product supports timezone-aware expiration settings.

### Story 4.8: Capture scan events

As a hosted analytics user, I want scan events recorded when people scan my hosted QR code so that I can measure engagement.

Acceptance criteria:

- The redirect service records scan timestamp.
- The redirect service records QR code identifier.
- The redirect service records destination active at the time of scan.
- The redirect service records user agent where available.
- The redirect service records referrer where available.
- The redirect service records IP address or privacy-preserving IP-derived metadata according to policy.
- The redirect service records approximate geography where supported and allowed.
- The redirect service records device, OS, and browser classification where reasonably inferred.
- The system makes clear that scan analytics are approximate and may include bot or duplicate activity.

### Story 4.9: Respect privacy and compliance in scan collection

As a platform owner, I want hosted tracking to collect analytics responsibly so that users get useful insights without creating unnecessary privacy risk.

Acceptance criteria:

- The product defines a scan data collection policy.
- The system supports IP truncation or hashing according to privacy settings.
- The system avoids collecting unnecessary personal information.
- The system supports configurable data retention windows by plan.
- The system provides clear disclosures about what hosted tracking collects.
- The system supports deletion of hosted scan data when a user deletes a QR code or account, according to policy.
- The system is designed with privacy laws and regional requirements in mind, including opt-out and consent patterns where applicable.

### Story 4.10: View scan analytics summary

As a hosted analytics user, I want a simple analytics summary so that I can quickly understand QR performance.

Acceptance criteria:

- The QR detail page shows total scans.
- The QR detail page shows unique-ish scans where the system can estimate them responsibly.
- The QR detail page shows scans over time.
- The QR detail page shows first scan and most recent scan.
- The QR detail page shows top countries, regions, or cities where available.
- The QR detail page shows top device types, browsers, and operating systems where available.
- The page clearly labels approximate metrics.
- Empty analytics states are helpful and explain that data appears after scans occur.

### Story 4.11: Analytics dashboard across QR codes

As a hosted analytics user, I want an account-level analytics dashboard so that I can compare QR performance across campaigns.

Acceptance criteria:

- The dashboard shows total hosted scans across selected QR codes.
- The dashboard shows top-performing QR codes.
- The dashboard shows scans over time.
- The dashboard supports filtering by date range.
- The dashboard supports filtering by folder, collection, tag, or campaign where available.
- The dashboard distinguishes hosted analytics from self-managed tracking.
- The dashboard excludes Direct QR codes unless they have no hosted analytics data and are shown separately.

### Story 4.12: Date range filtering

As a hosted analytics user, I want to filter analytics by date range so that I can measure specific campaign windows.

Acceptance criteria:

- The user can select common date ranges such as today, yesterday, last 7 days, last 30 days, this month, last month, and custom range.
- Date range filters apply to charts, totals, and tables.
- Date range filters use the user’s selected timezone where possible.
- The UI clearly shows active date range.
- The user can reset date filters.

### Story 4.13: Scan event table

As a hosted analytics user, I want to view a scan event table so that I can inspect individual scan records when needed.

Acceptance criteria:

- The user can view recent scan events for a hosted QR code.
- Each row can show timestamp, approximate location, device type, browser, OS, referrer, destination, and bot/duplicate indicators where available.
- The table supports pagination.
- The table supports date filtering.
- The table avoids exposing raw sensitive data unnecessarily.
- The table is plan-aware if detailed event logs become premium-tier gated.

### Story 4.14: Bot and duplicate filtering

As a hosted analytics user, I want scans filtered for bots and obvious duplicates so that analytics are more useful.

Acceptance criteria:

- The system attempts to identify likely bot scans using user agent, request patterns, known crawlers, and other safe heuristics.
- The analytics UI can show total scans and filtered scans.
- The system marks likely duplicate scans within a configurable time window.
- The UI explains that filtering is approximate.
- The user can toggle inclusion of likely bots where supported.
- Filtering logic is documented for open-source contributors.

### Story 4.15: Export hosted analytics

As a hosted analytics user, I want to export scan analytics so that I can analyze campaign performance outside the product.

Acceptance criteria:

- The user can export summary analytics as CSV.
- The user can export scan event data as CSV if included in their plan.
- Exports respect date range filters.
- Exports respect QR code, folder, tag, or campaign filters where available.
- The export includes clear column names.
- The export avoids including raw sensitive data unless explicitly supported and allowed.

### Story 4.16: Webhook notifications for hosted scans

As an advanced hosted analytics user, I want webhook notifications for scans so that I can send scan events into my own systems.

Acceptance criteria:

- The user can configure a webhook URL for hosted scan events.
- The system sends webhook payloads for eligible scans.
- Webhook payloads include QR identifier, timestamp, destination, and available analytics metadata.
- Webhook delivery is retried according to a documented retry policy.
- The user can view recent webhook delivery status.
- Webhook signing is supported to verify authenticity.
- Webhooks are plan-aware and can be gated to higher tiers.

### Story 4.17: Custom short slug

As a hosted dynamic QR user, I want to customize the short slug for my hosted QR code so that the encoded URL is readable and campaign-friendly.

Acceptance criteria:

- The user can request a custom slug where available.
- Slugs are validated for allowed characters and length.
- Slugs must be unique within the selected domain.
- Reserved slugs are blocked.
- The user can see the final hosted URL before download.
- Changing a slug after distribution requires clear warnings because old printed codes may continue to encode the old URL.

### Story 4.18: Custom domain support

As a business user, I want hosted QR redirects to use my own domain so that scanners trust the link and the experience is brand-aligned.

Acceptance criteria:

- The user can add a custom domain for hosted redirects.
- The system provides DNS setup instructions.
- The system verifies domain ownership.
- The system provisions TLS for verified domains.
- The user can select a verified domain when creating hosted QR codes.
- Custom domains are scoped to the owning user or workspace.
- Custom domain usage is plan-aware.

### Story 4.19: Managed hosted domain

As a hosted QR user without a custom domain, I want a trustworthy managed short domain so that I can use hosted tracking without configuring DNS.

Acceptance criteria:

- The platform provides a default managed redirect domain.
- The managed domain is short, readable, and brand-appropriate.
- Hosted QR URLs on the managed domain are stable.
- The product avoids using suspicious-looking domains.
- The managed domain supports HTTPS.
- The final hosted URL is visible before download.

### Story 4.20: Campaign grouping for hosted analytics

As a marketer, I want to group hosted QR codes into campaigns so that I can measure related codes together.

Acceptance criteria:

- The user can create a campaign.
- The user can assign hosted QR codes to a campaign.
- Campaigns can have name, description, start date, end date, and tags.
- The analytics dashboard can filter by campaign.
- Campaign detail pages show aggregate scan performance.
- Campaign grouping builds on folders/tags but supports analytics-specific reporting.

### Story 4.21: Plan-aware hosted QR limits

As a product owner, I want hosted dynamic QR usage to be plan-aware so that we can monetize fairly while preserving a generous free product.

Acceptance criteria:

- The system can enforce limits by plan.
- Limits can include number of hosted dynamic QR codes, scan volume, analytics retention, event export, custom domains, webhooks, team seats, and API access.
- Free users can see hosted features but are not misled into thinking they are already included.
- Upgrade prompts explain what limit was reached and what plan unlocks it.
- Existing hosted QR behavior after downgrade is explicitly defined.
- The limit system is configurable without code changes where practical.

### Story 4.22: Downgrade behavior for hosted QR codes

As a subscribed user, I want to understand what happens to hosted QR codes if I cancel or downgrade so that I can avoid breaking printed campaigns unexpectedly.

Acceptance criteria:

- The product clearly explains downgrade behavior before cancellation.
- The system defines whether hosted QR codes continue redirecting, pause, switch to limited mode, or enter grace period.
- The system can enforce grace periods.
- The user receives warnings before hosted QR codes are affected.
- The user can export QR data and analytics before losing access.
- Direct QR codes and self-managed tracking QR codes are unaffected by hosted subscription changes.

### Story 4.23: Hosted QR health monitoring

As a platform operator, I want hosted redirect health monitored so that paid QR scans remain fast and reliable.

Acceptance criteria:

- The redirect service has uptime monitoring.
- The redirect service tracks latency.
- The redirect service tracks error rates.
- The system alerts operators on elevated failure rates.
- The redirect service has graceful degradation behavior.
- The product can show user-facing status when there is a known incident.

### Story 4.24: Abuse prevention for hosted redirects

As a platform owner, I want to prevent hosted redirects from being used for phishing, malware, spam, or abuse so that the service remains trustworthy.

Acceptance criteria:

- The system validates destination URLs.
- The system can block known malicious domains.
- The system can suspend abusive hosted QR codes.
- The system can show a safe interstitial or inactive page for blocked codes.
- The system logs abuse-related actions.
- Users can appeal or request review if their code is blocked.
- Abuse prevention is designed carefully to avoid overreaching into Direct QR codes we do not host.

### Story 4.25: Open-source redirect and analytics architecture

As an open-source contributor, I want the hosted redirect and analytics system to be clearly designed so that it can be reviewed, extended, and self-hosted where appropriate.

Acceptance criteria:

- The hosted redirect service has a documented architecture.
- The scan event schema is documented and versioned.
- The redirect flow is testable in local development.
- Analytics aggregation jobs are separated from redirect latency-sensitive paths.
- The system can support self-hosted deployments with clear configuration.
- The code separates redirect handling, event capture, analytics aggregation, billing enforcement, and abuse controls.
- The Go backend uses clear boundaries and small, understandable packages.

## Non-Functional Requirements

- Hosted redirects must be fast, reliable, and globally scalable over time.
- Redirect latency should be minimized because every scan depends on it.
- Analytics capture must not materially slow redirects.
- Scan event ingestion should tolerate bursts from campaigns, launches, and viral usage.
- The analytics system should separate raw event ingestion from aggregate reporting.
- Privacy and compliance controls must be designed before broad hosted tracking launch.
- Hosted tracking must be explicit and opt-in.
- Direct QR and self-managed tracking features must continue working without hosted subscriptions.
- The architecture should be suitable for a Go backend with separate services or packages for redirects, analytics, billing, domains, and abuse prevention.
- Hosted functionality should be deployable by the project maintainers while still understandable for open-source contributors.

---

---

# Epic 5: Advanced Design Studio, Brand Kits, Templates, and Reusable Styles

## Epic Summary

As a user creating branded QR codes, I want a powerful but easy design studio with reusable styles, templates, brand assets, logo management, frame presets, shape controls, and scannability guidance so that I can create QR codes that look polished, on-brand, and reliable without needing design or technical expertise.

This epic expands the visual customization foundation from Epic 1 into a true design system. It should compete with existing QR design tools on customization depth while being more trustworthy, more reusable, more open, and more scannability-aware.

## Product Intent

QR customization can quickly become a mess: too many controls, bad defaults, low contrast, oversized logos, broken finder patterns, and beautiful codes that do not scan. The design studio should solve that by organizing customization into sensible layers:

1. Quick templates for users who want a good result fast.
2. Brand kits for reusable colors, logos, fonts, and style rules.
3. Fine-grained controls for advanced users.
4. Scannability warnings and guardrails throughout.
5. Reusable saved styles so users can create once and apply everywhere.

The design studio should work for anonymous users at a basic level, while saved brand kits, reusable styles, asset libraries, and advanced templates require an account and can become premium-ready over time.

## User Stories

### Story 5.1: Choose from design templates

As a QR creator, I want to start from a design template so that I can create a polished QR code quickly.

Acceptance criteria:

- The user can browse predefined QR design templates.
- Templates include combinations of module style, marker style, colors, logo plate, frame, CTA text, and export defaults.
- Templates are grouped by use case, such as business card, restaurant menu, coupon, event, social profile, product packaging, real estate sign, flyer, table tent, and donation/payment.
- Selecting a template applies the full design configuration to the current QR code.
- Applying a template does not overwrite payload data.
- The user can customize the design after applying a template.
- Templates are previewed before selection.

### Story 5.2: Support template categories

As a user, I want templates organized by category so that I can quickly find a design appropriate to my use case.

Acceptance criteria:

- Templates are organized into clear categories.
- The user can filter templates by category.
- The user can search templates by name or use case.
- Template categories can support business, restaurant, retail, event, education, nonprofit, personal, social, and developer use cases.
- Template category metadata is extensible for future community templates.

### Story 5.3: Save a custom design as a reusable style

As a registered user, I want to save my current QR design as a reusable style so that I can apply the same look to future QR codes.

Acceptance criteria:

- The user can save the current design settings as a style.
- Saved styles include module style, marker styles, colors, frame settings, CTA styling, logo plate settings, quiet-zone settings, and export preferences.
- Saved styles do not include payload data unless explicitly duplicated as a QR code.
- The user can name a saved style.
- The user can apply a saved style to new or existing QR codes.
- Saved styles are scoped to the user or workspace.

### Story 5.4: Manage reusable styles

As a registered user, I want to manage saved styles so that I can keep my design library clean and useful.

Acceptance criteria:

- The user can view saved styles.
- The user can rename a saved style.
- The user can duplicate a saved style.
- The user can delete a saved style.
- The user can favorite a saved style.
- The user can preview a saved style before applying it.
- Deleting a saved style does not change QR codes that already used it unless the system later supports linked style inheritance.

### Story 5.5: Create a brand kit

As a registered user, I want to create a brand kit so that I can reuse my brand colors, logos, and design defaults across QR codes.

Acceptance criteria:

- The user can create a brand kit.
- A brand kit can include brand name, primary color, secondary color, accent colors, default foreground color, default background color, logos, and default style preferences.
- The user can choose a default brand kit.
- The user can apply a brand kit to a QR code.
- Brand kits are scoped to the user or workspace.
- Free and paid plan limits for brand kits are supported by the data model.

### Story 5.6: Manage brand colors

As a registered user, I want to manage brand colors so that QR codes stay visually consistent with my brand.

Acceptance criteria:

- The user can add colors to a brand kit.
- The user can name colors.
- The user can enter colors by hex value.
- The user can use a color picker.
- The product validates color values.
- The user can remove colors from a brand kit.
- The design studio surfaces brand colors prominently when editing QR colors.
- The product warns when brand color combinations are too low contrast for QR scanning.

### Story 5.7: Manage logo library

As a registered user, I want a logo library so that I can reuse logos without uploading them every time.

Acceptance criteria:

- The user can upload logos to an asset library.
- Supported formats include PNG, JPG, SVG, and WebP where safely supported.
- The user can name uploaded logos.
- The user can preview logos.
- The user can remove logos.
- The user can apply a saved logo to a QR code.
- Logo assets are scoped to the user or workspace.
- SVG logos are sanitized or restricted according to security policy.

### Story 5.8: Configure logo placement and plate

As a QR designer, I want precise logo placement and background plate controls so that my logo looks clean without breaking scan reliability.

Acceptance criteria:

- The user can place a logo in the center of the QR code.
- The user can adjust logo size within safe limits.
- The user can choose a logo plate shape, including none, square, rounded square, circle, pill, and soft badge.
- The user can customize logo plate color.
- The user can customize logo plate padding.
- The product warns when logo size or placement may reduce scan reliability.
- The product can recommend higher error correction when a logo is used.

### Story 5.9: Advanced module style controls

As an advanced designer, I want detailed control over QR module shape so that I can create distinctive QR codes.

Acceptance criteria:

- The user can choose module styles, including square, circle/dot, rounded square, extra-rounded, vertical rounded, horizontal rounded, diamond, star, teardrop, leaf, and mixed organic styles.
- The user can adjust roundness where applicable.
- The user can adjust module spacing within safe limits.
- The user can preview changes live.
- The renderer ensures data modules remain aligned to the QR grid.
- High-risk styles show scan warnings.
- Module style definitions are extensible for open-source contributors.

### Story 5.10: Advanced finder marker controls

As an advanced designer, I want detailed control over finder markers so that the QR code corners fit my brand style.

Acceptance criteria:

- The user can configure finder marker outer shape.
- The user can configure finder marker inner shape.
- Outer styles include square, rounded square, circle, extra-rounded, cut-corner, bracket, leaf, shield, and teardrop-inspired styles.
- Inner styles include square, rounded square, circle, dot, diamond, star, and teardrop.
- The user can configure marker color separately from module color.
- The user can configure inner marker color separately where supported.
- The product warns if marker styling may reduce scanner recognition.
- The renderer keeps finder markers in correct QR positions.

### Story 5.11: Advanced color modes

As a designer, I want advanced color options so that QR codes can match more sophisticated visual systems.

Acceptance criteria:

- The user can apply solid foreground and background colors.
- The user can apply gradients to foreground modules where supported.
- The user can choose linear or radial gradient styles where supported.
- The user can configure different colors for modules, finder markers, inner markers, frames, and CTA text.
- The product warns when gradients or color combinations reduce contrast.
- The product can recommend safer contrast adjustments.
- Exported files preserve selected color modes where format supports them.

### Story 5.12: Background image or texture support

As a designer, I want to place a QR code on a subtle background image or texture so that it fits branded creative.

Acceptance criteria:

- The user can upload or choose a background image or texture for the overall QR artwork, not inside critical data modules by default.
- The product can place the QR code over the background with a safe quiet zone or background plate.
- The user can adjust background opacity where supported.
- The product warns when background complexity reduces scan reliability.
- Background image support is plan-aware and can be gated later if needed.
- Uploaded backgrounds are handled safely.

### Story 5.13: Frame and sticker library

As a user, I want a library of frames and stickers so that my QR code has clear visual context and a call to action.

Acceptance criteria:

- The user can browse frame and sticker presets.
- Presets include no frame, simple border, scan me, menu, coupon, event ticket, social follow, app download, Wi-Fi access, payment, feedback, review us, and contact card styles.
- The user can customize frame color.
- The user can customize CTA text.
- The user can customize CTA text color where supported.
- The frame does not cover QR data modules.
- Exports include the selected frame/sticker artwork.

### Story 5.14: CTA text customization

As a user, I want to edit the text around my QR code so that scanners know what action to take.

Acceptance criteria:

- The user can edit CTA text on supported frames.
- The user can choose from suggested CTA copy.
- Suggested CTAs vary by QR type, such as “Scan to order,” “View menu,” “Join Wi-Fi,” “Save contact,” “Get coupon,” “Leave a review,” and “Follow us.”
- The user can control basic CTA typography where supported.
- CTA text has reasonable length limits.
- The preview updates live.

### Story 5.15: Design-safe presets by QR type

As a user, I want design defaults tailored to the QR type so that the QR code looks appropriate for its use case.

Acceptance criteria:

- URL QR codes have general-purpose templates.
- Menu QR codes emphasize restaurant/table use.
- Coupon QR codes emphasize offer clarity.
- Event QR codes emphasize ticket/pass styling.
- Wi-Fi QR codes emphasize simple utility and readability.
- Social QR codes emphasize logo and brand styling.
- Feedback/review QR codes emphasize CTA clarity.
- Applying QR-type templates does not alter payload unless the user chooses a different QR type.

### Story 5.16: Scannability score

As a user, I want a scannability score so that I know whether my design is likely to scan reliably.

Acceptance criteria:

- The product displays a scannability score or status.
- The score considers contrast, quiet zone, logo size, error correction, payload density, module shape, marker shape, background complexity, and output size.
- The score updates as the user edits the design.
- The score explains the main risk factors.
- The product provides recommended fixes.
- The score is presented as guidance, not a guarantee.

### Story 5.17: One-click fix recommendations

As a user, I want one-click fixes for scan risks so that I can improve reliability without understanding QR technical details.

Acceptance criteria:

- The product recommends fixes for common issues.
- Fixes include increase contrast, restore quiet zone, reduce logo size, increase error correction, simplify module shape, simplify marker shape, remove background complexity, and increase export size.
- The user can apply a recommended fix with one action.
- The user can undo an applied fix where feasible.
- The product explains what changed.

### Story 5.18: Before-and-after preview

As a designer, I want to compare design variations so that I can choose the best-looking scannable option.

Acceptance criteria:

- The user can preview the current design and a recommended safer version.
- The user can switch between variations.
- The user can duplicate a design variation.
- The user can save a variation as a reusable style if authenticated.
- The comparison is visual and easy to understand.

### Story 5.19: Versioned design configuration schema

As an open-source contributor, I want QR design configurations represented in a documented versioned schema so that renderers, saved styles, templates, and migrations remain maintainable.

Acceptance criteria:

- Design configuration has a version field.
- The schema separates modules, markers, colors, logo, frame, CTA, background, quiet zone, export preferences, and validation metadata.
- Templates and saved styles use the same underlying schema where practical.
- Unknown future fields are handled safely.
- The schema is documented for contributors.
- Migration tooling can upgrade older design configurations.

### Story 5.20: Community template support

As an open-source contributor, I want to add community templates so that the template library can grow beyond core maintainers.

Acceptance criteria:

- Templates can be defined in a portable configuration format.
- Each template includes name, category, preview metadata, design configuration, supported QR types, and attribution where appropriate.
- Templates can be validated automatically.
- Unsafe template values are rejected.
- The project documents how to contribute templates.
- The product can distinguish official templates from community templates where needed.

### Story 5.21: Import and export design styles

As a power user, I want to import and export design styles so that I can share branded QR styles across environments or self-hosted instances.

Acceptance criteria:

- The user can export a saved style as JSON.
- The user can import a compatible style JSON file.
- Imported styles are validated before saving.
- The product rejects unsupported or unsafe style definitions with clear errors.
- Imported styles do not include sensitive payload data.
- Import/export uses the versioned design schema.

### Story 5.22: Plan-aware premium design features

As a product owner, I want advanced design features to be plan-aware so that we can monetize power features without crippling the free creator.

Acceptance criteria:

- The plan model can gate premium templates, multiple brand kits, larger asset libraries, advanced gradients, background images, team brand kits, custom fonts, and bulk style application.
- Free users retain enough customization to create attractive QR codes.
- Gated features are clearly labeled.
- Upgrade prompts are contextual and dismissible.
- Existing designs using premium features after downgrade follow a clearly defined policy.
- The system avoids destructive downgrades that break already-exported QR codes.

### Story 5.23: Accessibility of the design studio

As a user with accessibility needs, I want the design studio to be usable with keyboard and assistive technologies so that I can create QR codes effectively.

Acceptance criteria:

- Design controls are keyboard accessible.
- Color controls have text alternatives and manual input.
- Template previews have meaningful names.
- Form controls have labels.
- Warnings and validation messages are announced appropriately.
- The UI does not rely on color alone to communicate scan risk or selected state.

### Story 5.24: Mobile-friendly design editing

As a mobile user, I want to customize QR codes on a phone or tablet so that I can create and edit QR codes without needing a desktop.

Acceptance criteria:

- The design studio works on mobile screen sizes.
- Core controls are usable with touch.
- The preview remains visible or easily accessible while editing.
- Long control panels are organized into collapsible sections.
- Downloads work on mobile where browser support allows.
- Mobile users can still create and download without login.

### Story 5.25: Design performance and rendering reliability

As a user, I want design changes to preview quickly and export accurately so that the studio feels professional and dependable.

Acceptance criteria:

- Common design changes update preview quickly.
- Exports match preview.
- Complex designs do not freeze the browser under normal use.
- The renderer handles large export sizes safely.
- Rendering errors produce useful messages.
- The rendering pipeline is tested against representative style combinations.

## Non-Functional Requirements

- The design studio should be modular, with clean separation between controls, configuration schema, preview rendering, validation, and export rendering.
- The renderer should support deterministic output from a saved design configuration.
- The design schema should be portable across hosted and self-hosted deployments.
- The product should preserve scannability as a first-class concern, not an afterthought.
- User-uploaded assets must be validated, sanitized, stored securely, and scoped correctly.
- Advanced design features should degrade gracefully in export formats that do not support every visual effect.
- The system should be ready for a Go backend serving templates, brand kits, assets, validation APIs, and export jobs where needed.
- Client-side preview should stay fast, while server-side export can be introduced for heavy formats or premium workflows.

---

---

# Epic 6: QR Code Types and Scan Destinations

## Epic Summary

As a QR creator, I want to choose the type of QR code I am creating and configure the right destination or scan experience for that use case so that scanners get the intended action, page, file, contact, message, network, coupon, event, review flow, or other experience.

This epic defines the QR solution catalog. It covers static payload types, URL-based destinations, and hosted mini-page experiences. The product should support the broad set of QR types users expect from commercial QR platforms while preserving clear behavior around direct, self-managed, and hosted tracking modes.

## Product Intent

Users do not think in terms of QR payload syntax. They think in terms of outcomes: “scan to open my menu,” “scan to join Wi-Fi,” “scan to save my contact,” “scan to leave a review,” “scan to get a coupon,” or “scan to view this PDF.”

The product should translate those intent-based choices into correct QR payloads and destinations. The catalog should be simple for beginners, flexible for power users, and technically clean enough to support open-source contribution.

QR types should be grouped into three categories:

1. Static payload QR types: the QR code directly encodes the full payload, such as text, Wi-Fi, email, SMS, phone, vCard, calendar event, and crypto wallet address.
2. URL-assisted QR types: the QR code ultimately points to a URL, but the product provides a purpose-built form, such as website, social profile, app download, map/location, menu link, review link, or payment link.
3. Hosted destination experiences: the product hosts a lightweight landing page or asset experience, such as business profile, coupon, event page, feedback form, PDF landing page, image gallery, menu page, or multi-link social page.

Hosted destination experiences can be free, account-required, or premium depending on storage, branding, analytics, and complexity. Direct QR codes should remain direct wherever possible.

## User Stories

### Story 6.1: Choose QR type from a catalog

As a creator, I want to choose a QR type from a catalog so that I start with the right fields and defaults for my use case.

Acceptance criteria:

- The user can view a catalog of supported QR types.
- QR types are grouped by clear categories.
- The catalog includes at least Website URL, Text, Email, Phone, SMS, Wi-Fi, vCard/contact, Location, Social, App Download, PDF, Image, Menu, Coupon, Event, Feedback, Review/Rating, Business Page, Multi-link Page, Crypto, and Payment Link.
- Each QR type has a short description.
- Each QR type indicates whether it can be direct/static, self-managed tracked, hosted dynamic, or hosted destination.
- The user can switch QR type before download.
- Switching QR type warns before discarding incompatible fields.

### Story 6.2: Website URL QR type

As a user, I want to create a website QR code so that scanners open a web page.

Acceptance criteria:

- The user can enter an HTTP or HTTPS URL.
- The product validates URL format.
- Direct mode encodes the destination URL directly.
- Self-managed tracking mode uses the configured tracking URL behavior.
- Hosted mode encodes a managed redirect URL.
- The user can add UTM parameters.
- The user can preview the final encoded payload before download.

### Story 6.3: Plain text QR type

As a user, I want to create a plain text QR code so that scanners see or copy a text payload.

Acceptance criteria:

- The user can enter plain text.
- The product enforces practical payload length limits.
- The preview shows the encoded text payload.
- The product warns when long text increases QR density and may reduce scan reliability.
- Plain text QR codes can be created and downloaded without login.
- Plain text QR codes are static and do not require tracking unless the product later supports hosted text pages.

### Story 6.4: Email QR type

As a user, I want to create an email QR code so that scanners can start an email draft.

Acceptance criteria:

- The user can enter recipient email address.
- The user can optionally enter subject.
- The user can optionally enter body text.
- The product generates a valid `mailto:` payload.
- The user can preview the generated payload.
- The product validates email format.
- The product warns that device behavior depends on the scanner’s email client configuration.

### Story 6.5: Phone QR type

As a user, I want to create a phone QR code so that scanners can initiate a call.

Acceptance criteria:

- The user can enter a phone number.
- The product supports international number formats.
- The product generates a valid `tel:` payload.
- The user can preview the generated payload.
- The product warns that scan behavior depends on device and scanner app.

### Story 6.6: SMS QR type

As a user, I want to create an SMS QR code so that scanners can start a text message.

Acceptance criteria:

- The user can enter a phone number.
- The user can optionally enter message body.
- The product generates a valid SMS payload.
- The user can preview the generated payload.
- The product supports common mobile SMS conventions.
- The product warns that prefilled message behavior may vary by device.

### Story 6.7: Wi-Fi QR type

As a user, I want to create a Wi-Fi QR code so that scanners can join a network easily.

Acceptance criteria:

- The user can enter network SSID.
- The user can enter password.
- The user can select encryption type, including WPA/WPA2/WPA3, WEP, or none.
- The user can mark the network as hidden.
- The product generates a valid Wi-Fi QR payload.
- The product warns users to avoid sharing private network credentials broadly.
- Wi-Fi QR codes can be created and downloaded without login.

### Story 6.8: vCard/contact QR type

As a user, I want to create a contact QR code so that scanners can save my contact details.

Acceptance criteria:

- The user can enter first name, last name, organization, title, phone, email, website, address, and notes.
- The product generates a valid vCard payload.
- Required fields are minimal so users can create simple contact cards quickly.
- The product warns when the vCard payload becomes dense.
- The user can preview the contact information before download.
- The product supports saving contact QR configurations for registered users.

### Story 6.9: Location QR type

As a user, I want to create a location QR code so that scanners can open a map or navigation destination.

Acceptance criteria:

- The user can enter an address, map URL, or coordinates.
- Direct mode can encode a map URL.
- The product can normalize common map links where safe.
- The user can preview the final destination.
- The product explains that map behavior may depend on the scanner’s device and installed apps.
- The user can add optional label or location name for saved QR records.

### Story 6.10: Social profile QR type

As a user, I want to create a social profile QR code so that scanners can open my social account.

Acceptance criteria:

- The user can choose a social platform.
- Supported platforms include Instagram, TikTok, Facebook, LinkedIn, X/Twitter, YouTube, Pinterest, Snapchat, Threads, WhatsApp, and other configurable platforms.
- The user can enter a handle or URL.
- The product generates the correct destination URL where possible.
- The user can override the generated URL.
- Design templates can adapt to the selected social platform.

### Story 6.11: Multi-link social page QR type

As a creator, I want a hosted multi-link page so that one QR code can point to multiple social profiles, websites, or calls to action.

Acceptance criteria:

- The user can create a hosted multi-link destination page.
- The user can add multiple links with labels.
- The user can reorder links.
- The user can choose a simple page theme.
- The hosted page has a stable URL.
- The hosted page can be used with hosted tracking where plan allows.
- Anonymous users can preview this type but must create an account to save and publish hosted pages.

### Story 6.12: App download QR type

As a user, I want to create an app download QR code so that scanners can install or open an app.

Acceptance criteria:

- The user can enter App Store URL.
- The user can enter Google Play URL.
- The user can enter fallback website URL.
- Direct mode can encode a single chosen app or landing URL.
- Hosted mode can route users based on device type where supported.
- The product explains that device-based routing requires hosted dynamic behavior.
- The user can preview the configured destinations.

### Story 6.13: PDF QR type

As a user, I want to create a PDF QR code so that scanners can view or download a PDF.

Acceptance criteria:

- The user can enter an existing PDF URL for direct mode.
- Registered users can upload a PDF for hosted storage if supported by plan.
- Uploaded PDFs are validated for file type and size.
- The hosted PDF experience provides a stable view/download page.
- The product distinguishes between direct PDF URL codes and hosted PDF codes.
- The product warns that updating a direct PDF URL QR requires redistributing the QR code unless the original PDF URL itself is controlled by the user.

### Story 6.14: Image QR type

As a user, I want to create an image QR code so that scanners can view an image.

Acceptance criteria:

- The user can enter an existing image URL for direct mode.
- Registered users can upload an image for hosted storage if supported by plan.
- Supported image formats include PNG, JPG, WebP, and GIF where appropriate.
- Uploaded images are validated for file type and size.
- Hosted image pages are mobile-friendly.
- The product distinguishes between direct image URL codes and hosted image codes.

### Story 6.15: Restaurant menu QR type

As a restaurant operator, I want to create a menu QR code so that guests can quickly view my menu.

Acceptance criteria:

- The user can enter an existing menu URL for direct mode.
- The user can optionally create a hosted menu landing page if hosted menu support exists.
- Menu QR templates emphasize table tent, counter sign, and sticker use cases.
- CTA suggestions include “View Menu,” “Scan for Menu,” and “Order Online.”
- Hosted menu pages can support sections, items, descriptions, prices, dietary markers, and ordering links in future iterations.
- The product makes clear whether the QR points to an external menu URL or a hosted menu page.

### Story 6.16: Coupon QR type

As a marketer, I want to create a coupon QR code so that scanners can view or redeem an offer.

Acceptance criteria:

- The user can enter a coupon landing page URL for direct mode.
- Registered users can create a hosted coupon page if supported.
- Coupon fields include offer title, description, promo code, expiration date, redemption instructions, and terms.
- The hosted coupon page is mobile-friendly.
- The product can show expiration state for hosted coupons.
- Coupon QR templates emphasize offer clarity and scannability.
- Analytics can be attached through hosted dynamic QR mode where available.

### Story 6.17: Event QR type

As an event organizer, I want to create an event QR code so that scanners can view event details, RSVP, or add the event to a calendar.

Acceptance criteria:

- The user can create a static calendar-style payload where supported.
- The user can enter event name, location, start date/time, end date/time, timezone, description, and URL.
- The user can create a direct QR to an external event page.
- Registered users can create a hosted event page if supported.
- Hosted event pages can include event details, CTA link, and calendar add links.
- The product handles timezone-aware event data.

### Story 6.18: Feedback QR type

As a business owner, I want to create a feedback QR code so that customers can send feedback after an experience.

Acceptance criteria:

- The user can enter an external feedback form URL for direct mode.
- Registered users can create a hosted feedback form if supported.
- Hosted feedback forms can collect rating, comment, name, email, phone, and optional custom fields according to configuration.
- Feedback submissions are stored securely and scoped to the user.
- The product can notify the user about new feedback in future notification features.
- The product distinguishes feedback collection from public review generation.

### Story 6.19: Review/rating QR type

As a business owner, I want to create a review QR code so that happy customers can leave a public review or rating.

Acceptance criteria:

- The user can enter a Google review URL, Yelp URL, TripAdvisor URL, Facebook review URL, or other supported review destination.
- The product provides guidance for obtaining review links where possible.
- The user can configure CTA copy such as “Leave us a review.”
- Direct mode encodes the review destination URL.
- Hosted mode can support a review routing page in future iterations.
- The product avoids deceptive review gating patterns unless a compliant feedback-first workflow is explicitly designed and reviewed.

### Story 6.20: Business page QR type

As a business owner, I want to create a hosted business profile page so that scanners can view my business information from one QR code.

Acceptance criteria:

- Registered users can create a hosted business page.
- Business page fields include business name, logo, description, website, phone, email, address, hours, social links, and CTA buttons.
- The hosted page is mobile-friendly.
- The user can apply a brand kit to the hosted business page.
- The hosted page has a stable URL.
- Business pages can be used as destinations for hosted dynamic QR codes.

### Story 6.21: Crypto wallet QR type

As a user, I want to create a crypto wallet QR code so that scanners can copy or open a wallet/payment address.

Acceptance criteria:

- The user can select a crypto network or asset.
- The user can enter a wallet address.
- The user can optionally enter an amount, label, or message where supported by the asset URI scheme.
- The product validates basic address format where practical.
- The product warns users to verify wallet addresses carefully.
- The product does not provide financial advice or custody funds.
- The final encoded payload is visible before download.

### Story 6.22: Payment link QR type

As a user, I want to create a payment link QR code so that scanners can pay through an existing payment provider.

Acceptance criteria:

- The user can enter an external payment link.
- The product supports common payment link destinations such as Stripe Payment Links, Square, PayPal, Venmo, Cash App, Toast ordering/payment links, and other configurable providers.
- Direct mode encodes the payment link URL.
- The product validates URL format but does not guarantee the provider link is valid.
- The product warns users to verify payment links before printing.
- Hosted analytics can be used if the user explicitly chooses hosted dynamic QR mode.

### Story 6.23: File and asset storage model for hosted destination types

As a platform owner, I want a clear storage model for hosted PDFs, images, and mini-pages so that user content is secure, scalable, and plan-aware.

Acceptance criteria:

- Hosted files are associated with the owning user or workspace.
- File size limits are plan-aware.
- Supported file types are explicitly allowed.
- Uploaded files are validated before storage.
- Unsafe files are rejected.
- Hosted assets can be deleted by the owner.
- Deleting a hosted asset handles dependent QR codes gracefully.

### Story 6.24: Destination experience preview

As a creator, I want to preview the scan destination experience so that I can verify what scanners will see.

Acceptance criteria:

- The user can preview static payload summary.
- The user can preview URL destination.
- The user can preview hosted mini-pages before publishing.
- The preview clearly distinguishes editor preview from public published page.
- The preview works on desktop and mobile viewports.
- The preview includes warnings for unpublished, invalid, expired, or incomplete hosted destinations.

### Story 6.25: Publish hosted destination pages

As a registered user, I want to publish hosted destination pages so that scanners can access them through a QR code.

Acceptance criteria:

- Hosted destination pages can be saved as draft.
- Hosted destination pages can be published.
- Hosted destination pages can be unpublished or paused.
- Published pages have stable URLs.
- Hosted destination pages support basic SEO/noindex controls where appropriate.
- Hosted destination pages are scoped to the owning user or workspace.
- The product indicates whether a QR code points to draft, published, paused, or unpublished content.

### Story 6.26: Hosted destination page themes

As a registered user, I want to apply themes to hosted destination pages so that scan experiences look professional and brand-aligned.

Acceptance criteria:

- The user can select a basic theme for hosted pages.
- The user can apply brand kit colors and logo where available.
- The user can preview themes before publishing.
- Hosted pages are mobile-first.
- Hosted pages meet basic accessibility requirements.
- Premium themes can be plan-aware.

### Story 6.27: QR type compatibility with scan modes

As a user, I want to understand which QR types work with direct, self-managed, and hosted tracking so that I choose the right setup.

Acceptance criteria:

- Each QR type declares compatible scan modes.
- Static payload types show direct/static as the default and may not support hosted tracking without conversion to a hosted page.
- URL-based types support direct, self-managed, and hosted dynamic modes where applicable.
- Hosted destination types require account creation and published hosted content.
- The UI prevents invalid combinations or explains how to convert them.
- Compatibility rules are represented in a documented configuration model.

### Story 6.28: QR type schema and contribution model

As an open-source contributor, I want QR types defined through clear schemas and handlers so that new QR types can be added safely.

Acceptance criteria:

- Each QR type has a schema for fields, validation rules, payload generation, preview behavior, and scan-mode compatibility.
- QR type definitions are versioned.
- QR type payload generation is covered by tests.
- QR type definitions can be documented automatically.
- New QR types can be contributed without modifying unrelated product areas.
- The Go backend can validate and generate payloads consistently with client-side behavior.

### Story 6.29: QR type-specific design recommendations

As a user, I want each QR type to suggest appropriate designs and CTAs so that the final QR code makes sense for its purpose.

Acceptance criteria:

- Each QR type can suggest templates.
- Each QR type can suggest CTA text.
- Each QR type can suggest frames or stickers.
- Restaurant menu QR codes suggest menu/table templates.
- Review QR codes suggest review CTA templates.
- Wi-Fi QR codes suggest simple utility templates.
- Coupon QR codes suggest offer templates.
- Suggestions do not block users from choosing other designs.

### Story 6.30: Safe handling of sensitive QR payloads

As a user, I want sensitive QR payloads handled carefully so that private data is not exposed unnecessarily.

Acceptance criteria:

- The product warns users before creating QR codes containing passwords, private contact details, wallet addresses, or other sensitive information.
- Anonymous sensitive payloads are stored only locally unless the user chooses to save them.
- Saved sensitive payloads are protected by account authorization.
- Logs avoid storing full sensitive payloads unnecessarily.
- The product provides clear guidance that anyone who scans or sees the QR code may access the encoded data.

## Non-Functional Requirements

- QR type definitions should be modular and extensible.
- Static payload generation should be deterministic and well-tested.
- URL generation should be safe, validated, and transparent.
- Hosted destination pages should be mobile-first, accessible, and fast.
- Hosted content storage should be plan-aware and secure.
- The product should clearly distinguish static payloads, URL destinations, hosted redirects, and hosted pages.
- The Go backend should expose clean validation and payload generation services for QR types.
- The client should provide immediate feedback, but backend validation should remain authoritative for saved and hosted QR codes.
- Hosted destination experiences should not be introduced in a way that forces users away from simple direct QR codes.

---

---

# Epic 7: Export, Print Production, and Asset Delivery

## Epic Summary

As a QR creator, I want to export QR codes in high-quality digital and print-ready formats so that the final asset works reliably across websites, signage, packaging, menus, business cards, stickers, posters, presentations, and production workflows.

## Product Intent

The export experience is a major trust moment. Users should not spend time designing a QR code only to discover the downloaded file is blurry, missing transparency, incompatible with print software, or visually different from the preview. Exports should be predictable, high quality, and honest about format limitations.

## User Stories

### Story 7.1: Export as PNG

As a user, I want to download a PNG so that I can use the QR code in digital and print materials.

Acceptance criteria:

- The user can export PNG without login.
- The user can choose size/resolution.
- PNG supports transparent background where selected.
- The exported PNG matches the preview.
- The file name is safe and useful.

### Story 7.2: Export as JPG

As a user, I want to download a JPG so that I can use the QR code in common image workflows.

Acceptance criteria:

- The user can export JPG without login.
- The product explains that JPG does not support transparency.
- The user can choose quality/compression where appropriate.
- The exported JPG uses a solid background.
- The export preserves scan reliability.

### Story 7.3: Export as SVG

As a user, I want to download an SVG so that I can use the QR code as a scalable vector asset.

Acceptance criteria:

- The user can export SVG.
- SVG output scales without pixelation.
- SVG preserves supported design settings.
- Unsupported visual effects are either flattened or clearly warned before export.
- SVG output is sanitized and safe.

### Story 7.4: Export as EPS or print vector format

As a print user, I want an EPS or equivalent print-friendly vector export so that I can send QR assets to production vendors.

Acceptance criteria:

- The user can export EPS or a suitable print-focused vector format.
- The product explains any design features that cannot be represented in EPS.
- The export preserves QR geometry and quiet zone.
- The export is compatible with common print workflows where practical.
- If EPS is deferred, PDF/SVG print export is clearly offered as the initial alternative.

### Story 7.5: Export as PDF

As a user, I want to export a print-ready PDF so that I can share or print QR assets reliably.

Acceptance criteria:

- The user can export PDF.
- PDF output can include the QR code alone or QR code with frame/CTA.
- The user can choose page size or asset-only output where supported.
- The PDF preserves vector quality where possible.
- PDF export honors margins and quiet zones.

### Story 7.6: Configure export size

As a user, I want to choose export dimensions so that the QR code fits my target use case.

Acceptance criteria:

- The user can choose common sizes.
- The user can enter custom pixel dimensions for raster exports.
- The product enforces safe min/max sizes.
- The product warns when small exports may scan poorly.
- Export size is saved with QR configuration for registered users.

### Story 7.7: Configure quiet zone

As a user, I want to configure QR margin/quiet zone so that the code scans reliably in real-world placements.

Acceptance criteria:

- The user can choose quiet-zone size.
- The product recommends a safe default.
- The product warns when quiet zone is too small.
- Frames and stickers do not violate the quiet zone.
- Exported files preserve quiet-zone settings.

### Story 7.8: Print-readiness checklist

As a user, I want a print-readiness checklist so that I avoid costly mistakes before ordering materials.

Acceptance criteria:

- The checklist includes scan test, contrast, size, quiet zone, logo size, and destination verification.
- The checklist appears before high-resolution or print-format download.
- The user can proceed after acknowledging warnings.
- The checklist is concise and actionable.

### Story 7.9: Download design package

As a registered user, I want to download a package of QR assets so that I have all formats needed for production.

Acceptance criteria:

- The user can download a ZIP package.
- The package can include PNG, SVG, PDF, JPG, and metadata summary.
- The package includes the encoded payload or hosted URL summary.
- Package generation is plan-aware if needed.
- The package file name is useful and safe.

### Story 7.10: Ensure preview/export parity

As a user, I want downloads to match the on-screen preview so that I trust the design studio.

Acceptance criteria:

- Export rendering uses the same canonical configuration as preview rendering.
- Known format differences are disclosed before export.
- Regression tests verify representative preview/export parity.
- Export errors produce clear messages.

## Non-Functional Requirements

- Export generation must be deterministic from the saved QR configuration.
- Raster exports should support large sizes without crashing normal browsers.
- Heavy export jobs can move server-side later.
- Export code should be modular by format.
- Export metadata should be useful for support and debugging without leaking sensitive payloads.

---

# Epic 8: Bulk QR Code Creation and Batch Operations

## Epic Summary

As a power user, marketer, operator, agency, or enterprise customer, I want to create, edit, organize, and export many QR codes at once so that I can support campaigns, locations, products, tables, events, assets, employees, or inventory without manually creating each code one by one.

## Product Intent

Bulk creation is a strong paid/business wedge. It turns the product from a simple generator into an operational tool. The product should support CSV-driven generation, batch design application, bulk exports, and eventually API-driven creation.

## User Stories

### Story 8.1: Upload CSV for bulk creation

As a user, I want to upload a CSV so that I can generate many QR codes at once.

Acceptance criteria:

- The user can upload a CSV file.
- The product validates file type and size.
- The product detects headers.
- The product previews parsed rows before generation.
- Invalid rows are clearly identified.

### Story 8.2: Map CSV columns to QR fields

As a user, I want to map CSV columns to QR fields so that my data generates the right QR codes.

Acceptance criteria:

- The user can map columns to required and optional QR fields.
- The product suggests mappings based on header names.
- Required fields are enforced.
- The mapping can be saved as a preset for registered users.
- The user can preview sample generated payloads.

### Story 8.3: Generate many QR codes from one design

As a user, I want to apply one design to many QR codes so that a batch looks consistent.

Acceptance criteria:

- The user can choose a template, saved style, or brand kit for a batch.
- The design applies consistently to all generated QR codes.
- Per-row overrides are supported where mapped.
- Scannability validation runs across the batch.
- Problem rows are flagged before export.

### Story 8.4: Bulk create hosted dynamic QR codes

As a paid user, I want to bulk create hosted dynamic QR codes so that I can manage destinations and analytics at scale.

Acceptance criteria:

- Bulk hosted creation is plan-aware.
- Each row creates a unique hosted redirect.
- Each hosted QR stores its destination and metadata.
- Failed rows do not block successful rows unless the user chooses all-or-nothing.
- The product summarizes success and failure counts.

### Story 8.5: Bulk download QR codes

As a user, I want to download many QR codes at once so that I can hand them off to production.

Acceptance criteria:

- The user can download a ZIP of generated QR codes.
- File names can use mapped row fields.
- The user can choose export format and size.
- The product handles duplicate file names safely.
- Large jobs use asynchronous job handling where needed.

### Story 8.6: Bulk edit metadata

As a registered user, I want to edit metadata for multiple saved QR codes so that I can manage campaigns efficiently.

Acceptance criteria:

- The user can select multiple QR codes.
- The user can apply tags, folders, campaigns, or favorites in bulk.
- The user can archive or restore in bulk.
- Destructive actions require confirmation.
- Ownership and permission checks are enforced server-side.

### Story 8.7: Bulk update hosted destinations

As a hosted analytics user, I want to update destinations for multiple hosted QR codes so that I can manage campaign changes quickly.

Acceptance criteria:

- The user can upload destination updates by CSV.
- The product matches rows to QR codes by ID, slug, name, or external reference.
- The product previews changes before applying.
- Destination history records each change.
- The product prevents updates to Direct QR codes that cannot be changed after export.

### Story 8.8: Batch analytics comparison

As a marketer, I want to compare analytics across a batch so that I can see which codes or locations perform best.

Acceptance criteria:

- The user can select a batch, folder, tag, or campaign.
- The dashboard shows top and bottom performers.
- The dashboard supports date filtering.
- The user can export batch analytics.
- Metrics are available only for hosted QR codes unless self-managed data import is later supported.

### Story 8.9: Bulk job status

As a user, I want to see bulk job status so that large imports and exports feel reliable.

Acceptance criteria:

- The user can see queued, processing, completed, failed, and partially completed states.
- The user can download error reports.
- The user can retry failed rows where practical.
- Bulk job history is available to registered users.
- The system prevents duplicate accidental submissions where feasible.

### Story 8.10: Bulk limits and plan enforcement

As a product owner, I want bulk usage to be plan-aware so that heavy users can be monetized fairly.

Acceptance criteria:

- The system can limit rows per import, jobs per day, hosted QR creation volume, and export package size by plan.
- The UI explains limits before upload where possible.
- Upgrade prompts appear when limits are reached.
- Free users can try small batches if desired.

## Non-Functional Requirements

- Bulk operations must be resilient to partial failure.
- Large jobs should not block normal app usage.
- CSV parsing must be safe and robust.
- Bulk operations must be auditable for hosted QR changes.
- The data model should include optional external reference IDs for customer systems.

---

# Epic 9: Teams, Workspaces, Collaboration, and Permissions

## Epic Summary

As a business, agency, or organization, I want to collaborate with teammates in shared workspaces so that QR codes, brand kits, campaigns, assets, and analytics can be managed by the right people with the right permissions.

## Product Intent

Teams turn the product from an individual tool into a business platform. This should support agencies, restaurants, franchises, retailers, event teams, schools, nonprofits, and internal marketing teams.

## User Stories

### Story 9.1: Create a workspace

As a registered user, I want to create a workspace so that QR codes and assets can belong to an organization instead of only my personal account.

Acceptance criteria:

- The user can create a workspace.
- The creator becomes owner/admin.
- Workspace records include name, slug, plan, and settings.
- QR codes, brand kits, templates, assets, campaigns, and domains can belong to a workspace.

### Story 9.2: Invite team members

As a workspace admin, I want to invite teammates so that they can collaborate.

Acceptance criteria:

- Admins can invite users by email.
- Invites have expiration and status.
- Invited users can accept into the workspace.
- Admins can resend or revoke invites.
- Invite usage is plan-aware.

### Story 9.3: Assign roles

As a workspace admin, I want role-based permissions so that users have appropriate access.

Acceptance criteria:

- Roles include owner, admin, editor, analyst, and viewer.
- Owners can manage billing and delete workspace.
- Admins can manage members and settings.
- Editors can create/edit QR codes and assets.
- Analysts can view analytics but not modify QR destinations.
- Viewers can view but not change workspace content.

### Story 9.4: Share QR codes within a workspace

As a team member, I want workspace QR codes visible to the team so that work is not trapped in one person’s account.

Acceptance criteria:

- Workspace QR codes are accessible to authorized members.
- Personal QR codes remain separate unless moved or copied.
- Permissions are enforced server-side.
- Dashboard filters distinguish personal and workspace content.

### Story 9.5: Collaborative brand kits

As a workspace user, I want shared brand kits so that team QR codes stay consistent.

Acceptance criteria:

- Workspace brand kits can be created by authorized roles.
- Authorized users can apply workspace brand kits.
- Brand kit editing permissions are role-based.
- Existing QR codes are not unexpectedly changed by brand kit edits unless linked inheritance is explicitly supported.

### Story 9.6: Campaign collaboration

As a team, I want campaigns to be shared workspace objects so that multiple people can manage related QR codes and analytics.

Acceptance criteria:

- Authorized users can create workspace campaigns.
- QR codes can be assigned to campaigns.
- Analysts and viewers can see campaign analytics according to role.
- Editors can modify campaign QR codes according to role.

### Story 9.7: Audit activity

As a workspace owner, I want activity history so that I can see who changed important QR settings.

Acceptance criteria:

- The system records key events such as destination edits, hosted QR pause/resume, deletes, member changes, role changes, and billing changes.
- Activity entries include actor, timestamp, action, and target.
- Activity logs are visible to authorized roles.
- Sensitive data is redacted where appropriate.

### Story 9.8: Transfer ownership

As a workspace owner, I want to transfer ownership so that the workspace can survive role or employment changes.

Acceptance criteria:

- Owners can transfer ownership to another active member.
- The transfer requires confirmation.
- The new owner receives owner permissions.
- The previous owner’s role is adjusted according to product policy.

### Story 9.9: Workspace plan and limits

As a product owner, I want workspace features to be plan-aware so that business collaboration can be monetized.

Acceptance criteria:

- Plans can limit seats, workspaces, brand kits, custom domains, hosted QR codes, analytics retention, and bulk jobs.
- Workspace billing is distinct from personal free usage.
- Upgrade prompts are clear and contextual.

## Non-Functional Requirements

- Authorization must be enforced on every workspace resource.
- Workspace data isolation must be tested.
- Role checks should be centralized and understandable.
- The data model should support future enterprise features without overbuilding v1.

---

# Epic 10: Billing, Plans, Subscriptions, and Entitlements

## Epic Summary

As a product owner, I want a clear freemium billing and entitlement system so that free users get real value, paid users unlock premium capabilities, and the platform can grow sustainably.

## Product Intent

Billing should support the business model without poisoning the user experience. The free product must remain genuinely useful. Paid plans should unlock hosted infrastructure, scale, collaboration, and advanced analytics, not basic QR creation.

## User Stories

### Story 10.1: Define plans and entitlements

As a product owner, I want configurable plans so that features can be enabled by tier.

Acceptance criteria:

- The system supports Free, Pro, Business, and future Enterprise tiers.
- Entitlements can gate hosted QR codes, analytics retention, custom domains, webhooks, bulk volume, team seats, brand kits, asset storage, API access, and premium templates.
- Entitlements are enforced server-side.
- The UI can read entitlement state.

### Story 10.2: Upgrade from free to paid

As a free user, I want to upgrade when I need premium features so that I can continue my workflow.

Acceptance criteria:

- Upgrade prompts are contextual.
- The user can choose a plan.
- Checkout is secure.
- After successful payment, entitlements update promptly.
- The user returns to the original workflow after upgrade where practical.

### Story 10.3: Manage subscription

As a paying user, I want to manage my subscription so that I can update billing details, change plans, or cancel.

Acceptance criteria:

- The user can access billing management.
- The user can update payment method.
- The user can view current plan.
- The user can upgrade, downgrade, or cancel.
- The product clearly explains consequences of downgrade/cancellation.

### Story 10.4: Enforce limits gracefully

As a user, I want clear explanations when I hit a plan limit so that I know what to do next.

Acceptance criteria:

- The product detects entitlement and usage limits.
- The UI explains which limit was reached.
- The UI explains what plan unlocks the desired action.
- Existing free capabilities remain accessible.
- Limit messaging avoids deceptive urgency.

### Story 10.5: Handle payment failure

As a paying user, I want reasonable grace behavior if payment fails so that my hosted QR campaigns do not break unexpectedly.

Acceptance criteria:

- Payment failure triggers notifications.
- The system supports grace periods.
- The user can update payment method.
- The product defines what happens after grace period.
- Direct and self-managed QR codes remain unaffected.

### Story 10.6: Invoice and receipt access

As a paying user, I want invoices and receipts so that I can manage business expenses.

Acceptance criteria:

- The user can view billing history.
- The user can download invoices/receipts.
- Workspace owners can access workspace billing documents.
- Billing records are access-controlled.

### Story 10.7: Trials and promotional plans

As a product owner, I want trials or promotions so that users can experience premium value before committing.

Acceptance criteria:

- The system can support trials.
- Trial entitlements are clearly shown.
- Trial expiration behavior is defined.
- Promotions can be applied through codes or admin configuration where supported.

## Non-Functional Requirements

- Billing provider integration should be isolated behind clear interfaces.
- Entitlement checks must be authoritative on the backend.
- Billing state changes must be auditable.
- Downgrade behavior must be designed to avoid surprising breakage.
- Open-source deployments should be able to disable hosted billing features cleanly.

---

# Epic 11: Admin, Abuse Prevention, Moderation, and Trust/Safety

## Epic Summary

As a platform operator, I want administrative tools and abuse prevention controls so that hosted redirects, uploaded content, public pages, and accounts are protected from spam, phishing, malware, fraud, and misuse.

## Product Intent

A hosted QR platform can be abused because QR codes hide destinations from casual inspection. Trust and safety must be built into hosted features from the start, while avoiding overreach into direct QR codes that do not use our infrastructure.

## User Stories

### Story 11.1: Admin user search and account review

As an admin, I want to find users and review account status so that I can support customers and investigate abuse.

Acceptance criteria:

- Admins can search users by email, ID, workspace, or plan.
- Admins can view account status and high-level usage.
- Admin access is restricted and audited.
- Sensitive data is minimized.

### Story 11.2: Hosted QR moderation controls

As an admin, I want to pause or block abusive hosted QR codes so that the platform is not used for harmful redirects.

Acceptance criteria:

- Admins can pause hosted QR codes.
- Admins can block destinations.
- Blocked scans show a safe fallback page.
- Actions are logged with actor, reason, and timestamp.
- Users can be notified according to policy.

### Story 11.3: Destination safety checks

As a platform operator, I want destination URLs checked for obvious abuse so that hosted redirects remain trustworthy.

Acceptance criteria:

- The system validates hosted destination URLs.
- The system can block known malicious domains.
- The system can flag suspicious patterns.
- Manual review can be triggered.
- False-positive handling exists.

### Story 11.4: Uploaded asset scanning

As a platform operator, I want uploaded files checked so that hosted PDFs, images, SVGs, and logos do not introduce security risk.

Acceptance criteria:

- Uploads are type-validated.
- File size limits are enforced.
- SVGs are sanitized or blocked according to policy.
- Suspicious files are rejected or quarantined.
- Upload failures give clear user-facing errors.

### Story 11.5: Rate limiting and bot protection

As a platform operator, I want rate limits so that the product is protected from abuse and denial-of-service attempts.

Acceptance criteria:

- Auth endpoints are rate-limited.
- Anonymous generation endpoints are rate-limited where backend resources are used.
- Hosted redirect endpoints are protected without harming legitimate scan traffic.
- Bulk operations have limits.
- Admins can inspect rate-limit events where appropriate.

### Story 11.6: Admin audit log

As a platform owner, I want admin actions logged so that sensitive operations are accountable.

Acceptance criteria:

- Admin actions are recorded.
- Logs include actor, action, target, timestamp, and reason where applicable.
- Audit logs are tamper-resistant within practical system constraints.
- Audit logs are available only to authorized admins.

### Story 11.7: User appeal or review request

As a user, I want to request review if my hosted QR code is blocked so that mistakes can be corrected.

Acceptance criteria:

- Blocked users can see a reason category where safe.
- Users can submit a review request.
- Admins can view and resolve review requests.
- Resolution is communicated according to policy.

### Story 11.8: Public trust preview for hosted QR URLs

As a scanner, I want hosted QR URLs to behave safely so that I am not silently sent to dangerous content.

Acceptance criteria:

- The platform can show interstitial warnings for blocked or suspicious destinations.
- The platform uses HTTPS.
- The platform avoids deceptive URL presentation.
- Hosted redirect pages can include minimal branding/trust signals where appropriate.

## Non-Functional Requirements

- Admin tools must be strongly access-controlled.
- Moderation actions must be audited.
- Abuse detection should be modular so providers and rules can evolve.
- The platform should distinguish hosted responsibilities from direct QR generation.
- Trust/safety controls must not add meaningful latency to normal hosted redirects.

---

# Epic 12: Developer API, Webhooks, CLI, and Open-Source Self-Hosting

## Epic Summary

As a developer, agency, enterprise, or open-source adopter, I want APIs, webhooks, CLI tools, documentation, and self-hosting support so that I can integrate QR generation, tracking, exports, and hosted capabilities into my own workflows or infrastructure.

## Product Intent

Because this product is open source, developer experience is not optional. The project should be easy to run locally, easy to extend, easy to integrate, and cleanly separated between open-source core capabilities and hosted commercial services.

## User Stories

### Story 12.1: Public API for QR creation

As a developer, I want an API to create QR codes so that I can generate QR assets programmatically.

Acceptance criteria:

- The API supports creating QR configurations.
- The API supports static/direct QR generation.
- The API supports design configuration.
- The API validates payloads server-side.
- API errors are clear and documented.

### Story 12.2: API authentication

As a developer, I want API keys so that I can securely access the API.

Acceptance criteria:

- Users can create API keys.
- Users can revoke API keys.
- API keys are scoped to user or workspace.
- API key permissions can be limited where supported.
- Raw API keys are stored securely.

### Story 12.3: API for saved QR management

As a developer, I want to manage saved QR codes through the API so that I can integrate with internal systems.

Acceptance criteria:

- The API can list, retrieve, create, update, archive, and delete QR records according to permissions.
- Hosted destination edits are supported where entitled.
- Direct QR limitations are clearly represented.
- Pagination is supported.

### Story 12.4: API for export generation

As a developer, I want to request exports through the API so that I can automate production workflows.

Acceptance criteria:

- The API can generate PNG and SVG at minimum.
- The API can support PDF/EPS where available.
- Export size and quiet-zone options are configurable.
- Large export jobs can be asynchronous.
- API responses include download links or file content according to design.

### Story 12.5: Webhooks for hosted events

As a developer, I want webhooks so that scan events and lifecycle changes can flow into other systems.

Acceptance criteria:

- Users can configure webhook endpoints.
- Webhook events include hosted scan, destination changed, QR paused, QR resumed, QR expired, and abuse blocked where appropriate.
- Webhooks are signed.
- Delivery attempts are logged.
- Retries follow documented policy.

### Story 12.6: CLI tool

As a developer or operator, I want a CLI so that I can generate and manage QR codes from scripts and terminals.

Acceptance criteria:

- The CLI can generate direct QR codes locally.
- The CLI can output PNG/SVG where supported.
- The CLI can read configuration files.
- The CLI can authenticate to hosted API for account-bound operations.
- The CLI has clear help text.

### Story 12.7: Local development setup

As an open-source contributor, I want a simple local setup so that I can run and contribute to the project.

Acceptance criteria:

- The repo includes clear setup instructions.
- Local development can run the Go backend.
- Required dependencies are documented.
- Tests can be run locally.
- Seed data or examples are provided.

### Story 12.8: Self-hosting configuration

As a self-hosting user, I want deployment documentation so that I can run the product on my own infrastructure.

Acceptance criteria:

- The project documents self-hosting requirements.
- Environment variables are documented.
- Storage, database, redirect domain, and email configuration are documented.
- Hosted commercial features can be disabled or configured.
- A Docker-based setup is available where practical.

### Story 12.9: OpenAPI documentation

As a developer, I want machine-readable API docs so that integrations are easier to build.

Acceptance criteria:

- APIs are documented using OpenAPI or equivalent.
- Request/response schemas are included.
- Error models are documented.
- Auth requirements are documented.
- Docs are updated as APIs evolve.

### Story 12.10: Extension model for QR types and styles

As an open-source contributor, I want clear extension points so that I can add QR types, render styles, templates, and validators.

Acceptance criteria:

- Extension points are documented.
- QR type handlers follow a consistent interface.
- Style renderers follow a consistent interface.
- Contributions include tests.
- Unsafe extensions can be rejected by validation.

## Non-Functional Requirements

- The public API must be versioned.
- API rate limiting must be plan-aware.
- Local generation should not require hosted services.
- Self-hosting should be first-class for the open-source core.
- Documentation should be accurate enough for contributor onboarding.
- The Go backend should use clean, small packages with obvious responsibilities.

---

# Epic 13: Core Technical Architecture, Go Backend, Data Model, and Operations

## Epic Summary

As an engineering team, I want a clean, secure, observable, and maintainable technical foundation so that the product can scale from a free QR generator to a hosted analytics platform without becoming a fragile mess.

## Product Intent

This epic is the engineering backbone. The product must support anonymous creation, accounts, saved projects, hosted redirects, analytics, assets, billing, teams, APIs, and self-hosting. The backend should be written in Go and structured for clarity, testability, and open-source contribution.

## User Stories

### Story 13.1: Establish Go service architecture

As an engineer, I want a clear Go backend architecture so that services and packages have obvious responsibilities.

Acceptance criteria:

- The backend is written in Go.
- Core packages separate auth, users, QR projects, payload generation, design config, exports, assets, redirects, analytics, billing, workspaces, and admin.
- Package boundaries are documented.
- The architecture supports monolith-first deployment with service extraction later if needed.

### Story 13.2: Define canonical data model

As an engineer, I want a canonical data model so that QR records, users, assets, tracking, and billing are consistent.

Acceptance criteria:

- The data model covers users, workspaces, QR codes, payload configs, design configs, tracking configs, assets, campaigns, scans, domains, plans, subscriptions, API keys, and audit logs.
- Schemas include timestamps and ownership fields.
- Versioned config blobs are used where appropriate.
- Migrations are managed cleanly.

### Story 13.3: Implement payload generation service

As an engineer, I want a shared payload generation service so that client and server behavior remain consistent.

Acceptance criteria:

- Payload generation supports all defined QR types.
- Payload generation is deterministic.
- Payload validation is covered by tests.
- The service can return final encoded payload previews.
- Backend validation is authoritative for saved and hosted QR codes.

### Story 13.4: Implement rendering/export pipeline

As an engineer, I want a reliable rendering pipeline so that previews and exports are consistent.

Acceptance criteria:

- Rendering accepts canonical QR configuration.
- Rendering supports configured module/marker styles.
- Exporters are separated by file format.
- Tests cover representative designs.
- Server-side export jobs can be added for heavy work.

### Story 13.5: Implement hosted redirect service

As an engineer, I want a fast redirect path so that hosted QR scans resolve reliably.

Acceptance criteria:

- Redirect lookup is optimized for low latency.
- Event capture does not significantly delay redirects.
- Disabled, expired, blocked, or missing codes return safe fallback behavior.
- Redirect behavior is covered by tests.
- The service supports managed and custom domains.

### Story 13.6: Implement analytics ingestion and aggregation

As an engineer, I want scan analytics ingestion separated from reporting so that the system can scale.

Acceptance criteria:

- Raw scan events can be captured.
- Aggregations are computed separately from redirect handling.
- Reporting queries are efficient for common dashboards.
- Data retention policies are enforceable.
- Bot/duplicate filtering can evolve independently.

### Story 13.7: Implement authorization model

As an engineer, I want consistent authorization checks so that users cannot access each other’s data.

Acceptance criteria:

- Ownership checks are enforced server-side.
- Workspace role checks are centralized.
- Admin permissions are separate from user permissions.
- Tests cover unauthorized access attempts.
- API and UI paths use the same authorization model.

### Story 13.8: Observability and operational health

As an operator, I want logs, metrics, traces, and health checks so that the hosted service can be run reliably.

Acceptance criteria:

- Services expose health checks.
- Redirect latency is measured.
- Error rates are measured.
- Background job failures are visible.
- Structured logs avoid leaking sensitive data.
- Alerts can be configured for critical paths.

### Story 13.9: CI/CD and quality gates

As an engineering team, I want automated quality gates so that open-source contributions and production deployments remain safe.

Acceptance criteria:

- CI runs tests, linting, formatting, and security checks.
- Database migrations are validated.
- Frontend and backend builds are tested.
- PR checks are documented.
- Release artifacts are reproducible where practical.

### Story 13.10: Secure configuration and secrets

As an operator, I want configuration and secrets handled safely so that deployments are secure.

Acceptance criteria:

- Secrets are not committed to source control.
- Environment variables are documented.
- Local development uses safe example config.
- Hosted production can use managed secret storage.
- Sensitive logs are redacted.

## Non-Functional Requirements

- Prefer a modular monolith first unless scale requires service extraction.
- Keep Go packages small, explicit, and easy for bots/contributors to understand.
- Use versioned schemas for QR payload, design, tracking, and hosted destination config.
- Build direct QR generation so it can run without hosted infrastructure.
- Hosted redirect and analytics paths must be observable and resilient.
- Open-source self-hosting must be considered in architecture decisions.

---

# Epic 14: AI-Assisted Creation, Design Suggestions, and Campaign Optimization

## Epic Summary

As a user, I want optional AI assistance to help create QR content, choose designs, improve scannability, write CTA text, and optimize campaigns so that I can produce better QR codes faster.

## Product Intent

AI should be a helper, not a dependency. The product must work beautifully without AI. AI features should assist with copy, templates, design choices, accessibility, scannability recommendations, and analytics interpretation.

## User Stories

### Story 14.1: AI CTA suggestions

As a user, I want CTA suggestions so that my QR code tells scanners what to do.

Acceptance criteria:

- The user can request CTA suggestions based on QR type and destination.
- Suggestions are concise.
- The user can apply or edit a suggestion.
- AI suggestions do not overwrite user content without confirmation.

### Story 14.2: AI design recommendation

As a user, I want design suggestions so that my QR code fits my use case and brand.

Acceptance criteria:

- The product can suggest templates based on QR type, industry, brand colors, and use case.
- Suggestions prioritize scannability.
- The user can preview suggestions.
- The user can apply or dismiss suggestions.

### Story 14.3: AI scannability explanation

As a user, I want plain-English explanations of scan risks so that I know how to fix my design.

Acceptance criteria:

- The AI can explain validation warnings in plain language.
- The AI can recommend fixes.
- The AI does not claim guaranteed scan performance.
- Recommendations align with deterministic validation rules.

### Story 14.4: AI campaign naming and organization

As a marketer, I want help naming and organizing QR campaigns so that dashboards stay readable.

Acceptance criteria:

- The product can suggest QR names, tags, and campaign names based on payload and context.
- The user can accept, edit, or ignore suggestions.
- Suggestions do not expose private data unnecessarily.

### Story 14.5: AI analytics summary

As a hosted analytics user, I want a plain-English analytics summary so that I can understand campaign performance quickly.

Acceptance criteria:

- The product can summarize scans over time, top performers, geography, device mix, and anomalies.
- The summary cites the underlying metrics shown in the dashboard.
- The AI avoids unsupported conclusions.
- The user can copy the summary.

### Story 14.6: AI destination/page copy

As a hosted destination user, I want help drafting page copy so that business pages, coupons, events, and feedback pages are easier to create.

Acceptance criteria:

- The AI can draft copy based on user-provided facts.
- The user must approve before publishing.
- The AI does not fabricate business details when missing.
- Generated copy can be edited.

## Non-Functional Requirements

- AI features are optional and not required for core QR generation.
- AI outputs require user confirmation before changing published or exported content.
- Sensitive data handling must be explicit.
- AI prompts and outputs should be observable for debugging while respecting privacy policy.
- AI features should be plan-aware and disable cleanly in self-hosted deployments.

---

## Open Questions

1. What should the product be called?
2. Should the first release include every payload type, or should URL-first ship before the full catalog?
3. Should EPS be native in v1, or should SVG/PDF be the initial vector strategy?
4. How aggressive should “custom overall shapes” be in v1 versus later advanced design tooling?
5. Should anonymous users be allowed to upload SVG logos in v1, given the security hardening required?
6. Should free accounts have unlimited saved QR codes at launch, or should there be a generous cap to prepare for paid tiers?
7. Should folders, tags, and favorites all ship in v1, or should v1 include favorites plus one organization primitive?
8. Should account authentication include OAuth/social login in v1, or start with email/password only?
9. Should self-managed tracking in v1 support only UTM/link construction, or should it include guided templates for user-owned redirect endpoints?
10. Should we provide an official open-source self-hosted tracking microservice as part of the repo, or keep it as documentation/examples until later?
11. Should anonymous users be allowed to run tracking URL reachability checks, or should that be account-only to reduce abuse?
12. Should future hosted tracking use our primary domain, a dedicated short domain, user-owned custom domains, or all three?
13. What should happen to hosted dynamic QR codes when a paid subscription expires or downgrades?
14. Should hosted analytics launch with raw event tables, or only aggregate dashboards first?
15. Should custom domains be included in the first paid tier, or reserved for a higher business tier?
16. Should the managed hosted redirect domain be branded around the product name or intentionally generic?
17. Should hosted scan events store raw IPs, truncated IPs, hashed IPs, or only derived approximate metadata?
18. Should hosted QR abuse prevention use third-party threat intelligence at launch, or start with internal rules and manual review?
19. Which design features should remain free forever versus become premium after account creation?
20. Should brand kits be free with one kit per user, then paid for multiple kits and team sharing?
21. Should custom fonts be supported in v1, or avoided until licensing and export complexity are solved?
22. Should community templates be included in the hosted product, the open-source repo only, or both?
23. Should scannability scoring be deterministic rules-only at first, or eventually include scan simulation/testing across QR scanner libraries?
24. Which QR types must ship in v1 versus later releases?
25. Should hosted destination pages be part of v1, or should v1 focus on direct/static and external URL QR types first?
26. Should PDF/image hosting be available to free users with strict limits, or paid-only due to storage and abuse risk?
27. Should feedback forms and business pages be their own product modules later, or included as basic hosted destination types from the start?
28. Should review QR flows include any rating-first routing, or avoid that entirely due to policy and trust concerns?
29. Should QR type definitions be data-driven configuration files, code modules, or a hybrid?
