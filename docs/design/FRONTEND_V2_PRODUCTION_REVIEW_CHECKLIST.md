# Frontend v2 Production Review Checklist

Date: 2026-05-08
Repo: `A:\Photo_Studio_OS_Frontend`
Related roadmap stage: `S7 Production QA and release`

This checklist is for reviewing implementation batches before merge, release, or production rollout. It does not authorize remote writes, deployment, production config changes, dependency changes, or backend changes.

## Review Header

Fill this for each implementation batch:

| Item | Value |
|---|---|
| Change title | |
| Roadmap stage | |
| Reviewer | |
| Author | |
| Date | |
| Branch / commit | |
| Related backend change | |
| Related config change | |
| Release target | local / staging / production |

## Scope Gate

- [ ] The change maps to a named roadmap stage.
- [ ] The changed files are listed.
- [ ] The change is frontend-only unless explicitly approved otherwise.
- [ ] The change does not modify backend repo files.
- [ ] The change does not modify root control repo files.
- [ ] The change does not modify dependency manifests or lockfiles unless approved.
- [ ] The change does not modify `.env` or secret-bearing files.
- [ ] The change does not include production URLs or credentials.
- [ ] The change does not deploy, release, push, tag, or create PRs without approval.

## Mock-first Gate

- [ ] The app still works with no `VITE_BACKEND_API_BASE_URL`.
- [ ] Mock data remains clearly named and isolated.
- [ ] Backend mode is intentionally configured, not accidental.
- [ ] Runtime chips or equivalent state clearly indicate mock vs backend source.
- [ ] Missing backend config has a calm fallback or boundary state.

## Read-model Gate

- [ ] Read response shape is covered by contract docs.
- [ ] Required fields are handled.
- [ ] Optional fields are handled.
- [ ] Nullable fields are handled.
- [ ] Unknown additive fields do not break rendering.
- [ ] Empty state is handled.
- [ ] Partial state is handled.
- [ ] Stale state is handled or explicitly deferred.
- [ ] Error state is handled.
- [ ] Invalid-id state is handled.
- [ ] Forbidden state is handled when auth/roles are in scope.

## UI / UX Gate

- [ ] Visible operator copy is Chinese-first unless technical identifiers are intentional.
- [ ] Command Center three-gauge composition is preserved unless a redesign was approved.
- [ ] Risk accents remain restrained and meaningful.
- [ ] Disabled actions are visually and semantically disabled.
- [ ] Clickable elements either navigate, update local read-only state, or perform an approved action.
- [ ] Keyboard focus remains visible.
- [ ] Text does not overflow or clip at target viewports.
- [ ] No horizontal overflow appears at narrow mobile width.
- [ ] Loading and error states do not cause major layout jump.

## Auth / Role Gate

Required when auth or role behavior is in scope:

- [ ] Auth provider and session model are approved.
- [ ] Role matrix is documented.
- [ ] Signed-out state is handled.
- [ ] Expired-session state is handled.
- [ ] Forbidden state is handled.
- [ ] Insufficient-role state is handled.
- [ ] Tokens are not printed, logged, stored in mocks, or committed.
- [ ] Frontend role gating does not replace backend permission enforcement.

Stop if:

- Production auth is being implemented without explicit approval.
- Real token values appear in code, docs, logs, or screenshots.

## Upload / Download Gate

Required when file movement is in scope:

- [ ] Storage provider contract is approved.
- [ ] Upload signing endpoint is approved.
- [ ] Download signing endpoint is approved.
- [ ] File type and size limits are defined.
- [ ] Malware/content scan posture is defined.
- [ ] Audit events are defined.
- [ ] Expiry behavior is defined.
- [ ] Retry behavior is defined.
- [ ] Permission checks are server-side.
- [ ] Frontend never constructs raw storage URLs from secrets.

Stop if:

- Real upload/download is added before storage and security review.
- Storage credentials appear in frontend code or docs.

## Review / Delivery External Access Gate

Required when public/client-facing access is in scope:

- [ ] Public link token model is approved.
- [ ] Link expiry is approved.
- [ ] Link revocation is approved.
- [ ] Scope-limited access is enforced server-side.
- [ ] External pages do not expose internal operator data.
- [ ] Rate-limit or abuse posture is defined.
- [ ] Audit events are defined for view, feedback, approval, and download.
- [ ] Expired and revoked link states are tested.

Stop if:

- Public review or delivery links are implemented before token model approval.
- Mock links look like production links.

## Write-action Gate

Required when POST, PATCH, DELETE, or equivalent mutation is in scope:

- [ ] Endpoint method and path are documented.
- [ ] Request body is documented.
- [ ] Server-side permission rule is documented.
- [ ] Idempotency or conflict behavior is documented.
- [ ] Audit event is documented.
- [ ] Success response is documented.
- [ ] Validation error response is documented.
- [ ] Retry behavior is documented.
- [ ] Rollback or correction path is documented.
- [ ] Frontend confirmation state exists for high-impact actions.
- [ ] Pending, success, and failure states are visible.
- [ ] No optimistic success is shown without reconciliation.

Stop if:

- Write behavior is simulated as production truth.
- A write action lacks backend ownership.

## Validation Gate

Minimum for docs-only changes:

- [ ] `git diff --check`
- [ ] Changed-file secret scan

Minimum for frontend code changes:

- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `powershell -ExecutionPolicy Bypass -File scripts\validate-local.ps1`

For route, layout, state, or read-model interaction changes:

- [ ] `npm run dev` running locally on `127.0.0.1:5173`
- [ ] `powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-all.ps1`

Manual browser QA when relevant:

- [ ] `#`
- [ ] `#risk`
- [ ] `#projects`
- [ ] `#approvals`
- [ ] `#activity`
- [ ] `#inspections`
- [ ] `#asset-inbox?projectId=PRJ-128&reviewSessionId=REV-441&deliveryId=DEL-220`
- [ ] `#qc-retouch?projectId=PRJ-128&reviewSessionId=REV-441&deliveryId=DEL-220`
- [ ] `#review-gallery?projectId=PRJ-128&reviewSessionId=REV-441&deliveryId=DEL-220`
- [ ] `#delivery-readiness?projectId=PRJ-128&reviewSessionId=REV-441&deliveryId=DEL-220`

Target viewports:

- [ ] `1440x960`
- [ ] `1024x768`
- [ ] `390x844`

## Release Gate

Required before production release:

- [ ] Staging environment passed.
- [ ] Backend/frontend compatibility confirmed.
- [ ] Auth and role behavior verified in staging.
- [ ] Upload/download flows verified in staging when in scope.
- [ ] Review/delivery external flows verified in staging when in scope.
- [ ] Monitoring or error reporting is available.
- [ ] Rollback plan is documented.
- [ ] Release notes are prepared.
- [ ] Human signoff is recorded.
- [ ] Tag creation is approved.
- [ ] Push/deploy/release is explicitly approved.

## Reviewer Decision

Choose one:

- [ ] Approved for local continuation.
- [ ] Approved for staging only.
- [ ] Blocked pending contract clarification.
- [ ] Blocked pending backend/platform approval.
- [ ] Blocked pending security review.
- [ ] Blocked pending validation.
- [ ] Rejected due to boundary violation.

Reviewer notes:

```text

```
