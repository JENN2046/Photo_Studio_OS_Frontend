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

The QA scripts use transient `npx --package @playwright/cli` execution without
changing `package.json` or `package-lock.json`. The full QA script runs the
route, boundary-state, and interaction matrices in sequence. The route matrix
checks Command Center scenes plus the four read-model hash pages at `1440x960` and `390x844`
for expected Chinese copy, required workspace selectors, Command Center
`aria-current` state, console errors, and horizontal overflow. The boundary
matrix checks loading, error, missing-config, and missing-id idle states for all
four read-model pages at `1024x768` and `390x844`. The interaction matrix checks
read-model tab switching, local selection state, and disabled read-only action
posture at `1440x960` and `390x844`.

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
- Disabled upload, download, public review, delivery, and write-action buttons
  must remain disabled and expose clear read-only posture.

DEV-only read-model boundary rehearsals:

- Add `readModelState=loading` to a read-model hash query to hold the loading state.
- Add `readModelState=error` to rehearse the read-only error state.
- Add `readModelState=missing-config` to rehearse a missing backend read-model config.
- Omit the required id such as `deliveryId` on `#delivery-readiness` to check idle context handling.
- Run `scripts\qa-readonly-boundary-states.ps1` to verify these states across the four read-model pages.

These rehearsals are local UI states. They do not enable uploads, downloads,
public links, auth, storage, backend writes, or production access.

## Read-only Contract

The frontend alpha may define read-only interfaces and consume mock adapters.
It must not add `POST`, `PATCH`, `DELETE`, upload, download, auth token, storage
provider, external review, or external delivery flows.

Mock mode is the default. Optional backend read-model smoke testing is documented
in `docs/design/COMMAND_CENTER_READONLY_API_CONTRACT_NOTE.md` and only activates
when `VITE_BACKEND_API_BASE_URL` is deliberately configured outside this repo.
