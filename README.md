# Photo Studio OS Frontend

Frontend cockpit for Photo Studio OS.

This repository is for the Command Center read-only frontend alpha.

## T128-001 Command Center Read-only Alpha

This workspace starts the frontend as a mock-first cockpit. It is independent
from the backend engine and root control tower, and it must not mutate business
truth.

Current stack:

- Vite
- React
- TypeScript
- No UI library
- No chart library
- No state manager
- No CSS framework

The first skeleton includes a dashboard shell, typed local mock data, a
read-only API client interface, design tokens, and cockpit layout surfaces for
projects, SKUs, assets, reviews, deliveries, risk, approvals, activity, and AI
inspection.

## Current Scope

- Read-only Command Center
- Mock data first
- Project / SKU / Asset / Review / Delivery visual surfaces
- Premium dark cockpit UI
- No backend mutation
- No upload/download
- No production auth
- No deploy

## Related Repositories

- Photo_Studio_OS_Control: project control tower
- Photo_Studio_OS_Backend: backend engine
- Photo_Studio_OS_Frontend: frontend cockpit

## Port Policy

Do not use:

- 3000: NewAPI
- 6005: VCPToolBox backend
- 6006: VCPToolBox Admin

Preferred frontend dev port:

- 5173
- 3101

## Local Commands

Dependencies are tracked with `package-lock.json`. For a clean local setup, use:

```powershell
npm ci
```

Common local commands:

```powershell
npm run dev
npm run lint
npm run build
npm run preview
```

The Vite dev server is configured for `127.0.0.1:5173`; preview is configured
for `127.0.0.1:4173`.

Local validation helper:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\validate-local.ps1
```

Full local validation with browser QA, while `npm run dev` is already running:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\validate-local.ps1 -IncludeBrowserQa
```

Optional Bash helper:

```bash
bash scripts/validate-local.sh
bash scripts/validate-local.sh --include-browser-qa
```

Both validation helpers perform a Node runtime preflight before npm gates. This
project uses Vite 7, so the shell running either helper must expose Node.js
`20.19+` or `22.12+`.

Backend read-model smoke helper:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-backend-read-smoke.ps1 -BackendBaseUrl http://127.0.0.1:8080
```

Full local backend read smoke, with connected and failure paths:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-backend-read-all.ps1
```

Connected-path smoke without a real backend:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-backend-read-smoke-mock.ps1
```

For local failure-mode rehearsal without a real backend:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-backend-read-smoke.ps1 -BackendBaseUrl http://127.0.0.1:59999 -ExpectReadFailure
```

Guarded local/staging backend read signoff, for an approved backend URL:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-backend-read-signoff.ps1 -EnvironmentName local -BackendBaseUrl http://127.0.0.1:8080
```

Use `-EnvironmentName staging` only for an explicitly approved HTTPS staging
backend. The signoff wrapper rejects production-like hostnames, refuses URL
credentials, delegates to the read-only backend smoke helper, and then reruns
lint, build, and local validation.

The backend smoke helper starts a temporary local Vite server with
`VITE_BACKEND_API_BASE_URL` set only inside that child process. It refuses
non-local backend URLs unless `-AllowNonLocalBackend` is passed for an explicitly
approved staging smoke, checks Command Center plus the four read-model pages, and
fails if the browser does not request each expected backend read-model path or
observes non-read request methods.
The mock-backend wrapper starts a temporary localhost GET/OPTIONS JSON server,
then reuses the same smoke helper to verify the backend-connected UI path.
The aggregate backend smoke runs the connected-path mock backend smoke and the
unreachable-backend failure smoke in sequence.

## Validation Status

Recent local validation:

- `npm run lint` passes.
- `npm run build` passes in a terminal that allows Node `child_process.spawn`.
- Sandboxed sessions that block Node child process spawning may fail during
  Vite/esbuild startup with `spawn EPERM`; that is an environment limitation,
  not a source change requirement.
- The four read-model pages expose visible runtime chips for read source,
  request state, transport posture, and the `mock-first / read-only` write
  boundary.
- Command Center exposes matching runtime chips for read source, request state,
  transport posture, and the `mock-first / read-only` write boundary.
- Command Center and read-model pages share the same runtime chip renderer, and
  browser QA uses one Golden Product Loop fixture for `PRJ-128`, `REV-441`, and
  `DEL-220`.

## Frontend v2 Local QA Runway

Use the local Vite server only:

```powershell
npm run dev
```

Automated full read-only browser QA:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-all.ps1
```

Automated read-only route matrix:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-routes.ps1
```

Automated read-model boundary-state matrix:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-boundary-states.ps1
```

Automated read-model interaction matrix:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-interactions.ps1
```

Automated auth state boundary matrix:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-auth-states.ps1
```

Automated live env role matrix:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-auth-live-roles.ps1
```

Automated read-only source boundary scan:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-source-boundary.ps1
```

Automated internal pilot readiness aggregate:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-internal-pilot-readiness.ps1
```

Optional internal pilot aggregate with an approved local/staging backend read
signoff:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-internal-pilot-readiness.ps1 -ApprovedBackendEnvironment local -ApprovedBackendBaseUrl http://127.0.0.1:8080
```

The QA scripts use transient `npx --package @playwright/cli` execution without
changing `package.json` or `package-lock.json`. The full QA script runs the
route, boundary-state, interaction, and auth-state matrices in sequence. The route
matrix checks Command Center scenes plus the four read-model hash pages at
`1440x960`, `1024x768`, and `390x844` for expected Chinese copy, runtime chips,
invalid debug-state fallbacks, required workspace selectors, Command Center
`aria-current` state, console errors, and horizontal overflow. The boundary
matrix checks loading, error, missing-config, empty, partial, stale, forbidden,
invalid-id, and missing-id idle states for all four read-model pages at
`1024x768` and `390x844`. The interaction matrix checks
Command Center `黄金链路` entry clicks, read-model tab switching, local selection
state, and disabled read-only action posture at `1440x960`, `1024x768`, and
`390x844`. The auth-state matrix checks signed-out, expired, loading, error,
forbidden, signed-in, and role-derived full/read/summary/no-access states at
`1024x768` and `390x844`. The live env role matrix starts temporary local Vite
servers with `VITE_BACKEND_USER_ROLE` set only in child process environments and
checks representative non-debug role paths without editing `.env`.
The internal pilot readiness aggregate runs local lint/build/validation,
backend read aggregate smoke, live env role QA, and the browser QA matrices from
one local command. It skips real backend signoff by default and only runs
`scripts\qa-backend-read-signoff.ps1` when an approved local/staging backend URL
is passed through `-ApprovedBackendBaseUrl`.
`validate-local.ps1` and `validate-local.sh` also run the read-only source
boundary scan so source-level POST/PATCH/DELETE, file input, signed URL, token,
browser-storage, storage-provider URL, or public-access enablement signals fail
before browser QA.

Baseline cockpit routes:

- `http://127.0.0.1:5173/#`
- `http://127.0.0.1:5173/#risk`
- `http://127.0.0.1:5173/#projects`
- `http://127.0.0.1:5173/#approvals`
- `http://127.0.0.1:5173/#activity`
- `http://127.0.0.1:5173/#inspections`
- `http://127.0.0.1:5173/#asset-inbox?projectId=PRJ-128&reviewSessionId=REV-441&deliveryId=DEL-220`
- `http://127.0.0.1:5173/#qc-retouch?projectId=PRJ-128&reviewSessionId=REV-441&deliveryId=DEL-220`
- `http://127.0.0.1:5173/#review-gallery?projectId=PRJ-128&reviewSessionId=REV-441&deliveryId=DEL-220`
- `http://127.0.0.1:5173/#delivery-readiness?projectId=PRJ-128&reviewSessionId=REV-441&deliveryId=DEL-220`

For manual browser QA, check the four read-model pages and Command Center at
desktop, tablet, and 390px widths. Confirm Chinese mock content, tab navigation,
Command Center entry links, no console errors, and no horizontal overflow.

Keyboard QA:

- Tab through the Command Center rail, `黄金链路` entries, right-side status
  links, read-model tabs, context links, state retry button, and selectable
  read-model cards.
- Confirm the active item has a visible 2px focus ring and that focus movement
  does not resize or shift the layout.

Click affordance QA:

- Visible Command Center text actions should navigate to the matching hash scene
  or use a normal link style.
- The Command Center rail should expose one scene entry per hash target:
  `#risk`, `#projects`, `#approvals`, `#activity`, and `#inspections`.
- Only one Command Center rail entry should expose `aria-current="page"` after
  a scene click.
- Direct Command Center hash loads for `#risk` and `#approvals` should reveal
  their read-only detail lists at desktop and 390px widths.
- Read-model cards may update local selected detail state only.
- Command Center `黄金链路` entries should click through to the matching read-model
  page with `PRJ-128`, `REV-441`, and `DEL-220` preserved.
- Disabled upload, download, public review, delivery, and write-action buttons
  must remain disabled and expose clear read-only posture.

DEV-only read-model boundary rehearsals:

- Add `readModelState=loading` to a read-model hash query to hold the loading state.
- Add `readModelState=error` to rehearse the read-only error state.
- Add `readModelState=missing-config` to rehearse a missing backend read-model config.
- Add `readModelState=empty`, `readModelState=partial`, or
  `readModelState=stale` to rehearse backend data-quality boundary states.
- Add `readModelState=forbidden` or `readModelState=invalid-id` to rehearse
  backend 403 / 404-style read-model gates.
- Unknown `readModelState` values should fall back to the normal mock-first
  ready path.
- Omit the required id such as `deliveryId` on `#delivery-readiness` to check idle context handling.
- Run `scripts\qa-readonly-boundary-states.ps1` to verify these states across the four read-model pages.

DEV-only auth state boundary rehearsals:

- Add `authState=signed-out` to the hash query to rehearse the signed-out gate.
- Add `authState=expired` to rehearse the expired-session gate.
- Add `authState=loading` to rehearse the auth loading gate.
- Add `authState=error` to rehearse the auth error gate.
- Add `authState=forbidden` to rehearse the forbidden (no page access) gate.
- Add `authState=insufficient-role` to rehearse the partial-access overlay.
- Add `authState=signed-in` with a page hash to confirm signed-in content renders.
- Add DEV-only `authRole=<role>` with `authState=signed-in` to rehearse role-specific access without editing `.env`.
- Run `scripts\qa-readonly-auth-states.ps1` to verify these states across Command
  Center, Asset Inbox, and Delivery Readiness at tablet and mobile widths.
- Set `VITE_BACKEND_USER_ROLE` env var (e.g. `photographer`, `retoucher`) to
  simulate a specific role in live (non-debug) mode.
- Run `scripts\qa-readonly-auth-live-roles.ps1` with no existing dev server to
  verify representative `VITE_BACKEND_USER_ROLE` role paths without editing `.env`.

The default role is `operator` (full access). Auth gates are display-only; they
do not implement production authentication, store tokens, or replace backend
authorization.

These rehearsals are local UI states. They do not enable uploads, downloads,
public links, auth, storage, backend writes, or production access.

DEV-only Command Center boundary rehearsals:

- Add `commandCenterState=loading` to rehearse the Command Center loading state.
- Add `commandCenterState=error` to rehearse the Command Center read-boundary error state.
- Add `commandCenterState=forbidden` or `commandCenterState=invalid-id` to
  rehearse backend 403 / 404-style Command Center read boundaries.
- Unknown `commandCenterState` values should fall back to the normal mock-first
  cockpit path.
- The Command Center runtime chips should remain visible in ready, loading,
  error, forbidden, and invalid-id states.
- `scripts\qa-readonly-routes.ps1` checks ready, loading, error, and invalid
  debug-state fallback runtime chip copy, plus the Command Center forbidden and
  invalid-id boundary copy.

## Read-only Contract

The frontend alpha may define read-only interfaces and consume mock adapters.
It must not add `POST`, `PATCH`, `DELETE`, upload, download, auth token, storage
provider, external review, or external delivery flows.

Mock mode is the default. Optional backend read-model smoke testing is documented
in `docs/design/COMMAND_CENTER_READONLY_API_CONTRACT_NOTE.md` and
`docs/design/FRONTEND_V2_BACKEND_READ_SMOKE_PLAN.md`, and only activates when
`VITE_BACKEND_API_BASE_URL` is deliberately configured outside this repo.
