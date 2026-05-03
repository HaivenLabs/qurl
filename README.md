# qurl

**QR codes for people who don’t want weird redirects, ransom analytics, or ugly little checkerboards.**

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

* Free users can create and download QR codes without logging in.
* Direct QR codes point directly to the destination the user enters.
* QR designs can be customized with colors, logos, dots, markers, frames, and templates.
* Production exports should be clean, predictable, and scannable.
* Accounts are optional and useful, not forced.
* Tracking is explicit, not sneaky.
* The product is open source and built to be understandable by humans and coding agents.

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

* Self-managed tracking helpers
* Hosted dynamic QR codes
* Premium analytics
* Bulk QR generation
* Teams and workspaces
* Billing and subscriptions
* Admin and abuse prevention tooling
* Developer API, webhooks, CLI, and self-hosting polish
* AI-assisted creation and optimization

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
8. Templates an
