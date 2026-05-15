# Frontend v2 Risk Register

Date: 2026-05-15
Repo: `A:\Photo_Studio_OS_Frontend`
Related roadmap: `docs/design/FRONTEND_V2_PRODUCTION_ROADMAP.md`

This register tracks product, engineering, security, and release risks for moving Frontend v2 from mock-first read-only cockpit to production. It is a planning and review artifact only.

## Risk Rating

Severity:

- Low: inconvenience or isolated UI issue.
- Medium: workflow confusion or limited release delay.
- High: data exposure, broken production workflow, or blocked launch.
- Critical: credential leak, unauthorized access, destructive production action, or unsafe release.

Likelihood:

- Low: unlikely with current controls.
- Medium: plausible during implementation.
- High: likely unless actively mitigated.

Status:

- Open: needs active tracking.
- Watching: mitigated for now but should be rechecked.
- Blocked: cannot be closed until external decision or implementation exists.
- Closed: no longer applicable.

## Active Risks

| ID | Risk | Severity | Likelihood | Status | Mitigation |
|---|---|---|---|---|---|
| R01 | Mock fixtures drift from backend read-model truth. | High | Medium | Watching | S1 contract freeze complete; fixtures aligned with frozen types. Recheck when backend examples arrive in S2. |
| R02 | Backend read integration breaks mock-first local development. | High | Medium | Watching | Backend reads stay behind `VITE_BACKEND_API_BASE_URL`; `scripts\qa-backend-read-all.ps1` and `scripts\qa-internal-pilot-readiness.ps1` validate mock-first, connected mock-backend, 403/404, empty/partial/stale, and unreachable-backend paths. |
| R03 | Frontend starts treating display-derived values as business truth. | High | Medium | Watching | Keep durable facts backend-owned; keep view-model derivations presentation-only; source boundary QA blocks write methods and public-access enablement in `src`. |
| R04 | Production auth is added without a clear role and session model. | Critical | Medium | Watching | S3 mock-first auth gates, role matrix, and session state machine implemented. `FRONTEND_V2_AUTH_PROVIDER_PREFLIGHT.md` defines provider/session/role-claim prerequisites. Auth provider integration still blocked. |
| R05 | Token or secret values leak into source, docs, logs, screenshots, or mocks. | Critical | Medium | Watching | Keep `.env` unmodified; run changed-file secret scans; `scripts\qa-readonly-source-boundary.ps1` blocks token/browser-storage/Authorization signals in source. |
| R06 | Upload implementation bypasses storage, scan, audit, or permission review. | Critical | Medium | Blocked | Do not implement real upload before storage signing, scan, audit, quota, and permission contracts exist. |
| R07 | Download implementation exposes unpublished or unauthorized delivery files. | Critical | Medium | Blocked | Require signed/permissioned download endpoints, expiry, audit, and server-side authorization. |
| R08 | Public review links expose internal operator data or broad asset access. | Critical | Medium | Blocked | Separate internal and external surfaces; require scoped token model, expiry, revocation, and abuse controls. |
| R09 | Public delivery links cannot be revoked or expire safely. | Critical | Medium | Blocked | Require token revocation and expiry states before external delivery access. |
| R10 | Write actions are introduced without idempotency, conflict handling, or audit. | Critical | Medium | Blocked | No POST/PATCH/DELETE until write contract includes permission, audit, idempotency, error, and rollback behavior; source boundary QA fails if write methods appear in `src`. |
| R11 | Disabled read-only UI is mistaken for implemented production action. | Medium | Medium | Watching | Keep disabled buttons semantically disabled and copy explicit about read-only posture. |
| R12 | Chinese-first operator copy regresses as new pages are added. | Medium | Medium | Watching | Review visible copy in PR checklist; keep technical identifiers intentional. |
| R13 | Command Center visual anchor is accidentally redesigned during feature work. | Medium | Low | Watching | Preserve three-gauge composition; treat broad visual redesign as approval-required. |
| R14 | Responsive or keyboard QA coverage regresses when shared layout changes. | High | Medium | Watching | Run `scripts\qa-readonly-all.ps1`; `scripts\qa-internal-pilot-readiness.ps1` now aggregates route, boundary, interaction, auth, role, and responsive QA for internal-pilot candidate checks. |
| R15 | Browser QA depends on a local dev server that is not running or uses wrong port. | Medium | Medium | Watching | Document `npm run dev` on `127.0.0.1:5173`; fail clearly when server is absent. |
| R16 | Bash/WSL Node runtime is incompatible with Vite 7. | Medium | High | Watching | Prefer PowerShell validation unless Bash/WSL Node is `20.19+` or `22.12+`. |
| R17 | Production release is treated as a continuation of local QA. | Critical | Medium | Watching | `FRONTEND_V2_INTERNAL_PILOT_READINESS.md` separates internal pilot readiness from production readiness; `scripts\qa-release-boundary-docs.ps1` guards release/signoff docs; release checklist still requires staging signoff, rollback plan, tag approval, and explicit deploy approval. |
| R18 | New teammate changes package dependencies to solve UI gaps quickly. | High | Medium | Watching | Dependency changes require explicit approval; `scripts\qa-package-boundary.ps1` guards the current Vite/React/TypeScript top-level dependency set and no UI/chart/state/CSS framework. |
| R19 | Backend smoke testing accidentally uses production endpoints. | Critical | Low | Watching | `scripts\qa-backend-read-smoke.ps1` refuses non-local URLs unless `-AllowNonLocalBackend` is explicitly used for approved staging; docs continue to forbid production endpoint smoke. |
| R20 | Review/delivery client-facing pages blur internal vs external data boundary. | Critical | Medium | Blocked | Create explicit external-access contract before public pages; audit safe fields. |

## Stage-specific Watchpoints

### S1 Contract Freeze

Status: **Complete** — see `FRONTEND_V2_S1_CONTRACT_FREEZE.md`.

Watched and resolved:

- Field ownership documented per surface.
- null/empty/partial semantics defined.
- Backend labels (codes) vs frontend labels (Chinese) explicitly separated.
- Pagination and item-limit assumptions frozen.

Recheck during S2 backend read integration when real response examples arrive.

### S2 Backend Read Integration

Watch:

- Mock-first fallback breakage.
- Unexpected backend auth requirement.
- Error envelope mismatch.
- Stale or partial data rendering as fresh complete data.

Required control:

- Validate no-backend mock mode, local connected mock backend mode, 403/404, empty/partial/stale, and unreachable-backend failure mode.
- Run real backend smoke only with an approved local/staging URL.

### S3 Auth And Roles

Watch:

- Frontend-only role gating mistaken for authorization.
- Expired sessions leaking data.
- Forbidden states showing internal details.
- Token values logged or committed.

Required control:

- Backend/platform must own authorization; frontend only reflects allowed state.
- Use `FRONTEND_V2_AUTH_PROVIDER_PREFLIGHT.md`, `scripts\qa-auth-provider-preflight.ps1`, `scripts\qa-auth-role-matrix.ps1`, `scripts\qa-readonly-auth-states.ps1`, and `scripts\qa-readonly-auth-live-roles.ps1` for local readiness checks.

### S4 Upload / Download

Watch:

- Raw storage URLs.
- Unsigned or long-lived download links.
- Missing file scan.
- Missing audit trail.
- Failed upload retry causing duplicates.

Required control:

- Storage and security review before implementation.

### S5 Review / Delivery External Access

Watch:

- Public links without expiry.
- Public links without revocation.
- Broad project data leaking to clients.
- Comment/feedback writes without audit.

Required control:

- Token/link model and external safe-field review before public routes.

### S6 Write-capable Operations

Watch:

- Double-submit.
- Race conditions.
- Optimistic UI hiding failed writes.
- Missing conflict messages.
- Missing rollback/correction path.

Required control:

- Idempotency, audit, validation errors, and conflict handling before frontend writes.

### S7 Production QA And Release

Watch:

- Local QA substituted for staging signoff.
- Missing rollback path.
- Untagged or untraceable release.
- Production monitoring absent.

Required control:

- Human release approval and rollback plan before deploy.
- Internal pilot readiness is not production release approval.

## Risk Review Cadence

Review this register:

- Before starting a new roadmap stage.
- Before enabling backend reads beyond local/staging smoke.
- Before adding auth or roles.
- Before upload/download implementation.
- Before public review/delivery access.
- Before any write action.
- Before staging release.
- Before production release.

## Immediate Top Risks

The next team should track these first:

1. `R01` Mock fixtures drift from backend read-model truth when real backend examples arrive.
2. `R04` Production auth provider and backend enforcement remain external blockers.
3. `R05` Token or secret leakage when real auth/staging config appears.
4. `R10` Write actions remain blocked until backend write contracts, audit, and rollback exist.
5. `R17` Production release still requires staging signoff, rollback, tag approval, and explicit deploy approval.

## Closure Rules

A risk can move to Closed only when:

- The relevant contract exists.
- The implementation exists or the risk is no longer in scope.
- Validation evidence exists.
- Reviewers agree no active stop gate remains.

Do not close a risk because it is inconvenient, deferred, or assumed unlikely.
