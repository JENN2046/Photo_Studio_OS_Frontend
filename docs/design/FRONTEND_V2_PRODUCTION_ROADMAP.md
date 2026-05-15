# Photo Studio OS Frontend v2 Production Roadmap

Date: 2026-05-08
Repo: `A:\Photo_Studio_OS_Frontend`
Current anchor: `frontend-v2-qa-2026.05.07`

This roadmap turns the current mock-first, read-only Frontend v2 cockpit into a staged production path.

It is a planning document only. It does not authorize backend writes, auth rollout, upload/download, storage integration, public review links, public delivery links, deployment, release, push, PR, dependency changes, secret changes, or production operations.

## Current Baseline

Current frontend state:

- Command Center cockpit is implemented with the approved premium dark studio direction.
- Four read-only hash workspaces exist: `#asset-inbox`, `#qc-retouch`, `#review-gallery`, and `#delivery-readiness`.
- Frontend remains mock-first by default.
- Backend read-model fetchers are available but only used when `VITE_BACKEND_API_BASE_URL` is intentionally configured.
- Runtime state chips expose source, runtime status, transport posture, and `mock-first / read-only` boundary.
- Local QA scripts cover route, boundary-state, interaction, Command Center entry-click, and responsive checks.
- Latest pushed QA tag: `frontend-v2-qa-2026.05.07`.

Primary gap:

The frontend now has a strong read-only operational shell, but production requires staged work across backend contracts, identity, storage, public review/delivery flows, QA gates, release governance, and rollback.

## Planning And Review Pack

Use these companion documents before handing production implementation to a new teammate:

- `docs/design/FRONTEND_V2_IMPLEMENTATION_HANDOFF.md`: implementation entry point, current architecture, first coding tracks, validation, and stop gates.
- `docs/design/FRONTEND_V2_CONTRACT_REVIEW.md`: read-model and future write-contract review surface.
- `docs/design/FRONTEND_V2_PRODUCTION_REVIEW_CHECKLIST.md`: reviewer checklist for implementation, QA, release, and rollback.
- `docs/design/FRONTEND_V2_INTERNAL_PILOT_READINESS.md`: internal studio-operator pilot readiness matrix, evidence, and remaining external signoff gates.
- `docs/design/FRONTEND_V2_RISK_REGISTER.md`: active risks and stage-specific watchpoints.

## Production Principles

1. Keep mock-first available until backend parity is proven.
2. Turn on real backend reads before any write behavior.
3. Add identity before any user-specific or external-facing surface.
4. Add upload/download only after storage, permissions, audit, and virus/content safety are designed.
5. Treat public review and delivery links as production-grade security boundaries, not UI links.
6. Every write action needs backend ownership, frontend confirmation states, audit visibility, and rollback behavior.
7. Production release requires repeatable validation, not manual confidence.

## Stage Map

| Stage | Name | Outcome | Risk | Production gate |
|---|---|---|---|---|
| S0 | Read-only QA baseline | Current mock-first cockpit and read-model workspaces are tagged and reproducible. | Low | Existing local QA remains green. |
| S1 | Contract freeze — 完成 | Frontend/backend read-model contracts are documented, fixture-aligned, and versioned. | Medium | Backend confirms response shapes and null/error semantics. |
| S2 | Backend read integration — 前端就绪 | Frontend can run against backend read models without losing mock-first fallback. Blocked on backend availability. | Medium | Local/staging backend smoke passes with no writes. |
| S3 | Auth and roles — 前端完成 | Frontend has mock-first auth state machine, role matrix, session gates, and DEV debug rehearsal. Backend auth provider pending. | High | Auth is owned by backend/platform and verified in staging. |
| S4 | Upload/download foundation | Asset ingest and delivery download are designed and implemented through approved storage APIs. | High | Storage, scan, audit, permission, quota, and failure handling pass. |
| S5 | Review/delivery flows | Public or client-facing review/delivery experiences are secure, expirable, audited, and observable. | High | Token/link model and external access rules pass security review. |
| S6 | Write-capable operations | Approval, QC, retouch, review feedback, and delivery state changes are enabled behind explicit APIs. | High | Backend write contracts, audit trail, idempotency, and rollback are proven. |
| S7 | Production QA and release | CI, browser matrix, staging signoff, release checklist, monitoring, and rollback are ready. | Critical | Release manager approves production cutover. |

## S0: Read-only QA Baseline

Goal:

Freeze the current frontend as a known-good read-only baseline.

Already done:

- Command Center and four read-model pages are implemented.
- Golden Product Loop fixture IDs are shared across UI and QA scripts.
- Local validation helpers exist.
- Tag `frontend-v2-qa-2026.05.07` marks the latest pushed QA state.

Exit criteria:

- `scripts/validate-local.ps1` passes.
- `scripts/qa-readonly-all.ps1` passes when the local Vite server is running.
- No upload/download/auth/write behavior exists.
- Docs clearly mark backend smoke as optional and blocked until configuration is intentional.

## S1: Contract Freeze — 完成

Status: **Frozen** as of 2026-05-08.

Frozen contract document: `docs/design/FRONTEND_V2_S1_CONTRACT_FREEZE.md`

Scope:

- Confirm read-model response shapes for Command Center, Asset Inbox, QC / Retouch, Review Gallery, and Delivery Readiness.
- Define required, optional, nullable, and derived frontend fields.
- Define loading, empty, partial, stale, error, missing-config, and permission-denied states.
- Define stable IDs for client, project, SKU, shot, asset, QC check, review session, delivery package, and operator.
- Document backend versioning strategy for read-model changes.

Frontend deliverables:

- Contract notes updated under `docs/design/`.
- Mock fixtures aligned with the agreed read-model contract.
- UI view models derive display-only context instead of mutating backend wire shape.
- Browser QA continues to pass in mock-first mode.

Backend deliverables required later:

- Read endpoint ownership.
- Response examples.
- Error envelope.
- Auth-required behavior.
- Stale/cache metadata if applicable.

Stop gates:

- Do not change backend repo from this frontend task.
- Do not introduce write APIs.
- Do not hardcode production URLs.

## S2: Backend Read Integration — 前端就绪，等待后端

Status: Frontend infrastructure complete. Blocked on backend read endpoint availability.

Frontend-side deliverables (done):
- Five read-model fetchers (`backendReadModels.ts`) with typed contracts
- Mock-first client switching (`client.ts`) via `VITE_BACKEND_API_BASE_URL`
- Runtime state surface with source/status/transport chips
- Complete error handling: loading / error / forbidden / invalid-id states
- Debug state rehearsal via `?readModelState=`

Backend-side deliverables (pending):
- Read endpoint ownership and availability
- Response examples matching frozen contracts
- Error envelope verification
- Stale/cache metadata

Goal:

Scope:

- Use `VITE_BACKEND_API_BASE_URL` only when intentionally configured outside the repo.
- Keep mock data as the default local development path.
- Add read-only smoke checks for real backend responses.
- Surface backend read errors without breaking the cockpit.
- Verify runtime chips correctly show mock vs backend source.

Acceptance:

- Command Center can load from backend read model in a controlled environment.
- Asset Inbox, QC / Retouch, Review Gallery, and Delivery Readiness can load from backend read models.
- Missing backend config still returns the mock-first local experience.
- Network errors are visible, calm, and non-destructive.
- No POST, PATCH, DELETE, upload, download, auth token handling, or storage integration is introduced in this stage.

Validation:

- `npm run lint`
- `npm run build`
- `scripts/validate-local.ps1`
- `scripts/qa-readonly-all.ps1`
- Backend read smoke with sanitized local/staging config only.

Stop gates:

- Stop if backend requires auth, token, schema, or write behavior before read smoke can pass.
- Stop if production credentials or `.env` changes are needed.

## S3: Auth And Role Readiness — 前端完成

Status: Frontend implementation complete as of 2026-05-08. Backend auth provider pending.

Implementation:
- `src/features/auth/authTypes.ts` — Role matrix (7 roles × 10 routes), PageAccess enum, SessionState union
- `src/features/auth/useAuthState.ts` — mock-first auth hook with `?authState=` DEV debug rehearsal
- `src/features/auth/AuthGate.tsx` — SignedOut, Expired, AuthLoading, AuthError, Forbidden, InsufficientRole gate components
- Wired into `App.tsx` — effective session derivation from role matrix
- Runtime chips extended with auth source, session, and role labels on Command Center and ReadModel pages

Goal:

Introduce identity and role-aware frontend behavior before exposing user-specific data or external-facing workflows.

Roles to model:

- Studio operator
- Photographer
- Retoucher
- QC reviewer
- Client reviewer
- Delivery approver
- Admin / owner

Frontend scope:

- Add role-aware navigation and disabled states.
- Add session loading, signed-out, expired-session, forbidden, and insufficient-role screens.
- Keep all role gates display-only until backend/platform auth is approved.
- Ensure runtime chips and state notices do not expose secrets or token values.

Backend/platform requirements:

- Auth provider decision.
- Session model.
- Role and permission claims.
- Token refresh and expiry behavior.
- Audit identity for future writes.

Acceptance:

- A signed-in operator sees only allowed surfaces.
- A forbidden role receives a clear read-only denial state.
- Signed-out and expired-session states are calm and recoverable.
- No fake production auth is shipped.

Stop gates:

- Do not edit `.env` with real auth values.
- Do not implement production auth without explicit approval.
- Do not store tokens in local mock fixtures or docs.

## S4: Upload / Download Foundation

Goal:

Implement real asset ingest and delivery download only after storage, security, and audit boundaries are ready.

Upload scope:

- Capture One export intake.
- Asset metadata extraction.
- Upload progress and retry states.
- File type, size, color profile, and naming validation.
- Duplicate detection and binding to SKU / shot requirement.
- Operator confirmation before any durable write.

Download scope:

- Delivery package manifest.
- Signed or permissioned download links.
- Expiry handling.
- Watermark / rendition policy if needed.
- Download audit events.

Backend/storage requirements:

- Storage provider and bucket/path policy.
- Upload signing endpoint.
- Download signing endpoint.
- Malware/content scan policy.
- File retention and deletion policy.
- Audit trail.
- Quota and timeout behavior.

Acceptance:

- Upload cannot bypass auth and permissions.
- Download cannot expose unpublished or unauthorized delivery files.
- Failed uploads and expired downloads are understandable and retryable.
- Frontend never constructs raw storage URLs from secrets.

Stop gates:

- Stop before any real upload/download implementation unless backend/storage contracts are approved.
- Stop if storage provider credentials or production URLs are needed in frontend code.

## S5: Review / Delivery External Flows

Goal:

Move Review Gallery and Delivery Readiness from internal read-only workspaces toward secure client-facing flows.

Review scope:

- Client review session landing state.
- Review item grid and detail.
- Comment and feedback capture.
- Approve / request revision actions.
- Revision deadline and status visibility.
- Expired or revoked review link state.

Delivery scope:

- Delivery package landing state.
- Manifest and usage notes.
- Download readiness and blocker explanation.
- Delivery confirmation state.
- Expired, revoked, or already-consumed delivery link state.

Security requirements:

- Public link token model.
- Expiration and revocation.
- Scope-limited access.
- Rate limiting and abuse handling.
- Audit events for view, feedback, approval, and download.

Acceptance:

- A client can review only the intended session.
- A delivery recipient can access only the intended package.
- Expired/revoked links fail closed.
- Public pages do not expose internal operator data.

Stop gates:

- Do not implement public review or delivery links until token model and backend ownership are approved.
- Do not use mock links that look like production URLs.

## S6: Write-capable Operations

Goal:

Enable selected production actions after read, auth, storage, and external access foundations are proven.

Candidate write actions:

- Asset binding confirmation.
- QC pass / fail / warning.
- Return to retouch.
- Mark for reshoot.
- Retouch task status update.
- Client feedback submit.
- Review approve / request revision.
- Delivery package publish.
- Delivery confirmation.

Required backend guarantees:

- Idempotent write endpoints.
- Validation errors with field-level detail.
- Audit events.
- Conflict handling.
- Optimistic concurrency or version checks.
- Rollback or correction path.
- Permission enforcement server-side.

Frontend requirements:

- Confirmation for high-impact writes.
- Clear pending/success/failure states.
- No silent mutation.
- No optimistic success without reconciliation.
- Human-readable conflict messages.
- Disabled states tied to permission and workflow state.

Acceptance:

- Every visible write maps to a documented backend endpoint.
- Every write failure is recoverable or clearly escalated.
- Audit identity is attached by backend/platform, not invented by frontend.

Stop gates:

- Stop before adding POST/PATCH/DELETE unless explicitly approved for the stage.
- Stop if write behavior would be simulated as production truth.

## S7: Production QA And Release Gates

Goal:

Make the release repeatable, observable, and reversible.

QA gates:

- Type/build validation.
- Lint validation.
- Read-only route matrix.
- Boundary-state matrix.
- Interaction matrix.
- Auth/session matrix.
- Upload/download staging matrix.
- Review/delivery external-link matrix.
- Accessibility smoke for keyboard focus, labels, and status announcements.
- Responsive matrix for desktop, tablet, and narrow mobile.
- Console error and horizontal overflow checks.
- Backend contract smoke.
- Secret scan on changed files.

Release gates:

- Staging environment configured without secrets in repo.
- Backend and frontend version compatibility confirmed.
- Rollback plan documented.
- Monitoring and error reporting available.
- Release notes prepared.
- Human signoff recorded.
- Tag created only after validation.
- Production push/deploy only after explicit approval.

Rollback requirements:

- Known previous frontend build or tag.
- Backend compatibility window.
- Feature flags or config toggles for risky flows.
- Clear owner for rollback decision.

Stop gates:

- Deployment, release, production write, tag, push, PR, and remote actions require explicit approval.
- Do not treat a local QA pass as production approval.

## Recommended Execution Order

1. Keep S0 as the recovery baseline.
2. Complete S1 contract freeze before widening backend usage.
3. Run S2 backend read smoke in local/staging only.
4. Implement S3 auth/role states before exposing user-specific or external surfaces.
5. Design and approve S4 upload/download storage contracts before implementing real file movement.
6. Design and approve S5 public review/delivery token model before external links.
7. Add S6 write actions one workflow at a time after backend write contracts exist.
8. Promote through S7 production QA and release gates.

## Near-term Next Batches

### Batch P4-A: Production Contract Pack — 完成

Deliverable: `docs/design/FRONTEND_V2_S1_CONTRACT_FREEZE.md`

### Batch P4-B: Backend Read Smoke Plan

Scope:

- Define how to run backend smoke without committing `.env` or secrets.
- Add sanitized examples for local environment variables if needed.
- Clarify expected smoke output and failure handling.

Validation:

- Docs diff check.
- Optional local smoke only when backend base URL is deliberately configured.

### Batch P4-C: Auth / Role State Design — 完成

Deliverables: `FRONTEND_V2_AUTH_ROLE_STATE_DESIGN.md`, `src/features/auth/` (types, hook, gate components)

### Batch P4-D: Upload / Download Contract Design

Scope:

- Define asset ingest workflow.
- Define delivery package download workflow.
- Document storage, signing, audit, scan, expiry, and retry requirements.

Validation:

- Docs diff check.
- No frontend file movement or storage integration in this batch.

### Batch P4-E: Review / Delivery External Access Design

Scope:

- Define public review and delivery token/link behavior.
- Define expiry, revocation, permission, rate-limit, and audit states.
- Separate internal operator pages from client-facing pages.

Validation:

- Docs diff check.
- No public links implemented in this batch.

### Batch P4-F: Production QA Gate Checklist

Scope:

- Convert this roadmap into a release checklist.
- Add required commands and browser matrices.
- Add release/rollback signoff fields.

Validation:

- Docs diff check.
- Later CI integration requires explicit approval.

## Definition Of Production Ready

Frontend v2 can be considered production-ready only when:

- Mock-first local development remains available.
- Backend read integration is verified against real read models.
- Auth and role behavior are verified in staging.
- Upload/download uses approved storage APIs and no frontend secrets.
- Review/delivery external flows use secure scoped links.
- Write actions have backend contracts, audit, conflict handling, and rollback.
- Production QA gates are repeatable.
- Release and rollback paths are documented.
- Human approval has been given for remote/deploy/release actions.

## Explicit Non-goals For Current Read-only Phase

These remain out of scope until their named production stage is approved:

- Real upload.
- Real download.
- Public review links.
- Public delivery links.
- Production auth.
- Storage integration.
- Approval writes.
- QC/retouch state mutations.
- Delivery publish.
- Deployment.
- Release.
- Production monitoring changes.
- Backend repo edits.
- Root control repo edits.
- Dependency changes.
- Secret or `.env` changes.
