# Frontend v2 Auth Provider Preflight

Date: 2026-05-15
Repo: `A:\Photo_Studio_OS_Frontend`
Related roadmap stage: `S3 Auth And Role Readiness`

This preflight defines what must be known before the frontend integrates a real
auth/session provider. It is a planning and review artifact only. It does not
implement production auth, store credentials, edit `.env`, create sign-in
routes, call external auth services, or replace backend authorization.

## Current Frontend Posture

The current frontend is ready to display auth and role state, but it is not a
production auth client.

Implemented locally:

- Mock-first auth state machine.
- Role matrix for 7 roles across 10 routes.
- Signed-out, expired, loading, error, forbidden, insufficient-role, and
  signed-in UI states.
- `VITE_BACKEND_USER_ROLE` local role rehearsal without `.env` edits.
- Static role-matrix QA through `scripts\qa-auth-role-matrix.ps1`.
- Browser auth-state QA through `scripts\qa-readonly-auth-states.ps1`.
- Live env-role QA through `scripts\qa-readonly-auth-live-roles.ps1`.

Still external:

- Auth provider ownership.
- Session source and refresh model.
- Role and permission claim contract.
- Backend authorization enforcement on every read-model endpoint.
- Staging fixtures for signed-out, expired, forbidden, and partial-access paths.

## Required Decisions Before Integration

| Decision | Required owner | Required answer |
|---|---|---|
| Provider | Backend/platform | Which provider owns session identity for internal operators? |
| Session transport | Backend/platform | Is the frontend reading session state from a same-origin endpoint, cookie-backed session, or another approved mechanism? |
| Role claim | Backend/platform | Which exact claim maps to `admin`, `operator`, `photographer`, `retoucher`, `qc_reviewer`, `client`, and `delivery_approver`? |
| Expiry model | Backend/platform | How does the frontend learn `signed-out`, `expired`, `loading`, and provider `error` states? |
| Forbidden model | Backend/platform | How are 403 read-model responses shaped and correlated with frontend role state? |
| Partial access | Product/backend | Which surfaces should render `full`, `read`, `summary-only`, or `none` for each role in staging? |
| Retry behavior | Backend/platform | Which auth/read failures are retryable and which require re-authentication? |
| Audit identity | Backend/platform | Which backend-owned operator identity appears in future audit events? |

## Frontend Integration Contract

Allowed frontend shape after explicit approval:

- A read-only session adapter that derives display state from approved provider
  data.
- Runtime chips that show auth source, session state, role label, and access
  posture.
- Route gates that hide or reduce UI according to the frontend role matrix.
- Calm signed-out, expired, loading, error, forbidden, and partial-access UI.
- Staging-only QA commands that verify provider states without committing config.

Forbidden without separate approval:

- Storing credentials in `localStorage` or `sessionStorage`.
- Printing credential-bearing values in logs, screenshots, docs, or QA output.
- Editing `.env` or committing provider config.
- Implementing sign-in, sign-out, refresh, or account management flows.
- Treating frontend route gates as backend authorization.
- Calling production auth endpoints from local QA.
- Enabling upload, download, public review, public delivery, or business writes.

## Required Staging Fixtures

Before production-auth implementation begins, staging should provide stable test
users or sessions for:

| Fixture | Expected frontend state |
|---|---|
| No session | Signed-out state; no production data visible. |
| Expired session | Expired-session state; re-auth placeholder visible. |
| Provider failure | Auth error state; no data leak. |
| Operator | Full Command Center and read-model access. |
| Photographer | Summary Command Center, full Asset Inbox, forbidden approvals. |
| Retoucher | Read Asset Inbox, full QC / Retouch. |
| QC reviewer | Read Asset Inbox, full QC / Retouch, inspections access. |
| Client reviewer | Review Gallery access only; no internal cockpit data. |
| Delivery approver | Delivery Readiness access and read-only approval context. |

## Preflight Validation

Before merging any real auth integration:

```powershell
npm run lint
npm run build
powershell -ExecutionPolicy Bypass -File scripts\validate-local.ps1
powershell -ExecutionPolicy Bypass -File scripts\qa-auth-role-matrix.ps1
powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-auth-states.ps1
powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-auth-live-roles.ps1
```

With an approved staging backend/auth environment, also run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-internal-pilot-readiness.ps1 -ApprovedBackendEnvironment staging -ApprovedBackendBaseUrl <approved-staging-backend-url>
```

Do not place the approved URL in docs, source, `.env`, screenshots, or commit
messages.

## Review Checklist

| Check | Status |
|---|---|
| Provider owner named | |
| Session source documented | |
| Role claim mapping reviewed against `src\features\auth\authTypes.ts` | |
| Backend enforcement confirmed for each read-model endpoint | |
| Signed-out, expired, loading, error, forbidden, and partial-access fixtures exist | |
| No frontend credential storage is introduced | |
| No production auth endpoint appears in source or docs | |
| `scripts\qa-auth-role-matrix.ps1` passes | |
| `scripts\qa-readonly-auth-states.ps1` passes | |
| `scripts\qa-readonly-auth-live-roles.ps1` passes | |
| `scripts\qa-internal-pilot-readiness.ps1` passes with approved staging signoff when available | |

## Stop Conditions

Stop and request explicit approval if integration requires:

- Provider credentials in frontend code, docs, or `.env`.
- Production endpoint usage.
- New dependency installation.
- Backend repo edits from this frontend workspace.
- Business writes, upload/download, public review/delivery, or storage access.
- Weakening `scripts\qa-readonly-source-boundary.ps1` or
  `scripts\qa-auth-role-matrix.ps1` to make auth integration pass.
