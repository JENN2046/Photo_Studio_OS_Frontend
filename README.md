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

## Validation Status

Recent local validation:

- `npm run lint` passes.
- `npm run build` passes in a terminal that allows Node `child_process.spawn`.
- Sandboxed sessions that block Node child process spawning may fail during
  Vite/esbuild startup with `spawn EPERM`; that is an environment limitation,
  not a source change requirement.

## Read-only Contract

The frontend alpha may define read-only interfaces and consume mock adapters.
It must not add `POST`, `PATCH`, `DELETE`, upload, download, auth token, storage
provider, external review, or external delivery flows.

Mock mode is the default. Optional backend read-model smoke testing is documented
in `docs/design/COMMAND_CENTER_READONLY_API_CONTRACT_NOTE.md` and only activates
when `VITE_BACKEND_API_BASE_URL` is deliberately configured outside this repo.
