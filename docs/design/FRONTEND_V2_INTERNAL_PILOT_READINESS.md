# Frontend v2 Internal Pilot Readiness

Date: 2026-05-15
Repo: `A:\Photo_Studio_OS_Frontend`
Target: `Studio Operator Internal Pilot Ready`

This document is the local readiness checklist for an internal studio-operator
pilot. It does not authorize production release, deployment, push, tag, public
review links, public delivery links, uploads, downloads, storage integration,
real business writes, dependency changes, backend repo changes, root repo
changes, or `.env` edits.

## Pilot Definition

Internal pilot ready means an internal operator can use the frontend to observe
the production loop in read-only mode:

- Project risk and execution posture.
- Asset intake and SKU / shot binding posture.
- QC / retouch failure reasons, owners, and next-step guidance.
- Review gallery status and retouch feedback posture.
- Delivery readiness, package checklist, and blockers.

The pilot is not production ready until real backend read smoke and platform
auth are verified in an approved local or staging environment.

## Readiness Matrix

| Area | Required for internal pilot | Current evidence | Status |
|---|---|---|---|
| Mock-first baseline | App runs with no backend URL and remains read-only. | `README.md`, `scripts\validate-local.ps1`, `scripts\qa-readonly-all.ps1` | Ready |
| Command Center | Premium dark cockpit, three-gauge anchor, risk, projects, approvals, activity, inspections, and Golden Loop entries. | `src\features\command-center\CommandCenter.tsx`, route QA matrix | Ready |
| Asset Inbox | Operator can see source posture, SKU / shot binding, selected asset detail, file context, and QC checklist. | `src\features\read-models\readModelWorkspaces.tsx`, `#asset-inbox` QA | Ready |
| QC / Retouch | Operator can see queue, failure reasons, severity, owner, deadline, and read-only suggestions. | `src\features\read-models\readModelWorkspaces.tsx`, `#qc-retouch` QA | Ready |
| Review Gallery | Operator can see review status, feedback, selected item detail, and public review boundary. | `src\features\read-models\readModelWorkspaces.tsx`, `#review-gallery` QA | Ready |
| Delivery Readiness | Operator can see checklist, package artifacts, blockers, and download/public delivery boundary. | `src\features\read-models\readModelWorkspaces.tsx`, `#delivery-readiness` QA | Ready |
| Backend read switch | Backend reads activate only through `VITE_BACKEND_API_BASE_URL`; mock-first remains default. | `src\api\client.ts`, `src\api\backendReadModels.ts` | Frontend ready |
| Backend smoke | Connected-path local mock and unreachable-backend failure path are automated. | `scripts\qa-backend-read-all.ps1` | Local ready |
| Real backend smoke | Approved local/staging backend URL is required; production endpoints are not allowed. | `scripts\qa-backend-read-smoke.ps1`, `scripts\qa-backend-read-signoff.ps1` | Blocked on backend URL |
| Auth/session states | Signed-out, expired, loading, error, forbidden, insufficient-role, and signed-in states are stable. | `src\features\auth\*`, `scripts\qa-readonly-auth-states.ps1` | Frontend ready |
| Env role readiness | Representative `VITE_BACKEND_USER_ROLE` paths are verified without `.env` edits. | `scripts\qa-readonly-auth-live-roles.ps1` | Frontend ready |
| Real auth provider | Backend/platform auth provider, token model, and enforcement are not implemented in this frontend. | `docs\design\FRONTEND_V2_AUTH_ROLE_STATE_DESIGN.md` | Blocked on platform auth |
| Responsive QA | 1440px, 1024px, and 390px scripted matrices pass without horizontal overflow. | `scripts\qa-readonly-all.ps1` | Ready |
| Chinese-first copy | Operator-facing copy is Chinese-first; technical identifiers remain intentional. | README QA route list and scripted copy checks | Ready |
| Read-only boundary | Upload, download, public review, public delivery, and write actions remain disabled / not implemented. | Interaction QA and release checklist | Ready |

## Required Local Signoff Commands

Run these before calling the frontend an internal-pilot candidate:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-internal-pilot-readiness.ps1
```

The aggregate script runs the same gates as the expanded command list below and
starts a temporary local Vite server only for browser QA.
`scripts\validate-local.ps1` includes the read-only source boundary scan.

Expanded command list:

```powershell
npm run lint
npm run build
powershell -ExecutionPolicy Bypass -File scripts\validate-local.ps1
powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-source-boundary.ps1
powershell -ExecutionPolicy Bypass -File scripts\qa-backend-read-all.ps1
powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-auth-live-roles.ps1
```

Then start the local Vite server and run:

```powershell
npm run dev
powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-auth-states.ps1
powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-all.ps1
```

## External Signoff Still Required

These items are outside the current frontend-only local boundary:

- Real local/staging backend read smoke with approved `VITE_BACKEND_API_BASE_URL`.
- Guarded local/staging backend signoff through `scripts\qa-backend-read-signoff.ps1`.
- Backend/platform auth provider and token/session model.
- Backend authorization enforcement for every role and read-model endpoint.
- Staging signoff for 403, 404, empty, partial, stale, and network failure states.
- Release manager approval for push, tag, deploy, or production rollout.

## Stop Conditions

Stop and request explicit approval if any next step requires:

- Backend repo edits.
- Root control repo edits.
- `.env` or secret changes.
- Dependency manifest or lockfile changes.
- Production URL usage.
- Upload, download, storage, public review, public delivery, POST, PATCH,
  DELETE, or any business write.
- Push, tag, release, deploy, PR, or remote branch operation.
