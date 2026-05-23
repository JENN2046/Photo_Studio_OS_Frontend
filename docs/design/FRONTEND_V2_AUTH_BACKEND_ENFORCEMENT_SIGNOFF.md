# Frontend v2 Auth / Backend Enforcement Signoff Pack

Date prepared: 2026-05-15
Repo: `A:\Photo_Studio_OS_Frontend`
Related stage: `S3 Auth / Role Readiness`

This is a planning and evidence intake artifact only. It does not implement
production auth, store credentials, edit `.env`, call external auth services,
call backend writes, change backend code, deploy, release, or approve the final
internal pilot.

The goal is to make the remaining auth/backend evidence concrete enough for a
backend or platform owner to provide, and for the frontend repo to record
without exposing secrets or pretending frontend route gates are enforcement.

## Evidence Boundary

Allowed evidence:

- Provider owner name or team.
- Session source shape without tokens or credential values.
- Role claim name and allowed role identifiers.
- Backend-owned enforcement results for each read-model endpoint.
- Staging fixture names or sanitized labels.
- HTTP status and UI state outcomes.

Forbidden evidence:

- Tokens, cookies, API keys, passwords, or signed URLs.
- Production URLs.
- `.env` values.
- User PII beyond sanitized fixture labels.
- Screenshots or logs containing credential-bearing headers.
- Claims that frontend gates replace backend authorization.

## Required Owner Decisions

| Decision | Required owner | Evidence to record |
|---|---|---|
| Auth provider owner | Backend/platform | Named owner or team. |
| Session source | Backend/platform | Same-origin endpoint, cookie-backed session, or approved provider mechanism. |
| Role claim | Backend/platform | Exact claim name that maps to frontend roles. |
| Role mapping | Backend/platform/product | Mapping from provider/backend roles to frontend roles. |
| Forbidden response contract | Backend/platform | 403 body shape and correlation with frontend forbidden UI. |
| Session expiry contract | Backend/platform | How expired sessions are detected without exposing tokens. |
| Backend enforcement owner | Backend/platform | Owner confirming server-side permissions for read-model endpoints. |
| Staging fixture owner | Backend/platform/QA | Owner of signed-out, expired, forbidden, partial-access, and role fixtures. |

## Role Evidence Matrix

| Frontend role | Identifier | Required backend/platform evidence |
|---|---|---|
| Admin | `admin` | Maps from approved admin or privileged internal claim; read access to all read-model endpoints is backend-enforced. |
| Studio Operator | `operator` | Maps from approved operator claim; read access to all internal read-model endpoints is backend-enforced. |
| Photographer | `photographer` | Maps from approved photographer claim; Asset Inbox access and restricted internal surfaces are backend-enforced. |
| Retoucher | `retoucher` | Maps from approved retoucher claim; QC / Retouch and allowed Asset Inbox access are backend-enforced. |
| QC Reviewer | `qc_reviewer` | Maps from approved QC claim; QC / Retouch and inspection access are backend-enforced. |
| Client Reviewer | `client` | Maps from approved client review claim; internal cockpit access is denied by backend. |
| Delivery Approver | `delivery_approver` | Maps from approved delivery claim; Delivery Readiness access is backend-enforced. |

## Endpoint Enforcement Matrix

Record evidence for each endpoint with sanitized fixture labels only.

| Endpoint | Required proof |
|---|---|
| `/command-center/v2` | Allowed internal roles receive 200; forbidden roles receive 403 or sanitized denied state. |
| `/projects/:projectId/asset-inbox` | Allowed production roles receive 200; client-only roles are denied. |
| `/projects/:projectId/qc-retouch-queue` | Retouch/QC/operator roles receive 200; unrelated roles are denied. |
| `/review-sessions/:reviewSessionId/gallery` | Review-allowed roles receive 200; internal-only restrictions are documented. |
| `/deliveries/:deliveryId/readiness` | Delivery-allowed roles receive 200; unrelated roles are denied. |

## Required Staging Fixtures

| Fixture | Required frontend/backend evidence |
|---|---|
| Signed-out | No production data visible; backend read endpoints do not return protected data. |
| Expired session | Expired UI state appears; backend does not leak protected data. |
| Provider error | Auth error UI appears; no credential-bearing logs are captured. |
| Forbidden role | 403 or denied state maps to forbidden UI. |
| Partial-access role | Allowed sections render; disallowed sections remain hidden, disabled, or summarized. |
| Empty read model | 200 empty response preserves stable empty UI. |
| Partial read model | 200 partial response preserves available content and partial notice. |
| Stale read model | 200 stale response preserves data and stale notice. |

## Local Frontend Evidence Already Available

| Check | Command |
|---|---|
| Role matrix | `powershell -ExecutionPolicy Bypass -File scripts\qa-auth-role-matrix.ps1` |
| Auth state UI | `powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-auth-states.ps1` |
| Env role rehearsal | `powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-auth-live-roles.ps1` |
| Auth provider preflight | `powershell -ExecutionPolicy Bypass -File scripts\qa-auth-provider-preflight.ps1` |
| Internal pilot aggregate | `powershell -ExecutionPolicy Bypass -File scripts\qa-internal-pilot-readiness.ps1` |

## Signoff Recording Rules

Before any signoff row can be marked complete:

1. The evidence must be from an approved local or staging environment.
2. No secret or credential-bearing value may be copied into this repo.
3. Backend enforcement must be described as backend-owned.
4. Frontend route gates must remain presentation-only.
5. Any `summary-only` posture must be treated as a frontend rehearsal of partial visibility, never as backend authorization proof.
6. The signoff record decision must remain `Not signed off` until every required owner has approved.
7. Push, tag, deploy, release, production auth, upload, download, public review, public delivery, storage, and business writes remain out of scope.

## Stop Conditions

Stop and request explicit approval if evidence collection requires:

- Editing `.env`.
- Adding dependencies.
- Changing backend code.
- Calling production auth or production backend URLs.
- Capturing tokens, cookies, passwords, or signed URLs.
- Implementing sign-in, sign-out, refresh, upload, download, public review,
  public delivery, storage, or write actions.
