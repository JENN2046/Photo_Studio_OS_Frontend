# Frontend v2 Internal Pilot Goal Audit

Date: 2026-05-15
Repo: `A:\Photo_Studio_OS_Frontend`
Branch: `main`
Target: `Studio Operator Internal Pilot Ready`

This audit maps the active goal to concrete repository evidence. It is a
readiness and handoff document only. It does not authorize push, tag, release,
deployment, production auth, upload, download, public review links, public
delivery links, storage integration, backend repo changes, root repo changes,
dependency changes, `.env` edits, or business writes.

## Goal Restatement

The frontend should be ready for an internal studio-operator pilot when an
operator can inspect the production loop in read-only mode:

- Project risk and execution state.
- Asset intake and SKU / shot binding state.
- QC / retouch failure reasons, owner, and next step.
- Review status and revision posture.
- Delivery readiness, manifest posture, and blockers.

The goal is not production launch. Real backend read smoke and real platform
auth/backend authorization still require approved local or staging environments.

## Prompt-to-Artifact Checklist

| Goal requirement | Artifact or command | Evidence status | Audit result |
|---|---|---|---|
| Keep mock-first default behavior. | `src\api\client.ts`, `scripts\validate-local.ps1`, `scripts\qa-readonly-all.ps1` | Local validation and browser QA cover mock-first route behavior. | Covered locally |
| Preserve dependency boundary. | `scripts\qa-package-boundary.ps1`, `package.json`, `package-lock.json` | Static QA checks the approved Vite/React/TypeScript top-level package set remains unchanged. | Covered locally |
| Enable backend reads only when configured. | `src\api\backendReadModels.ts`, `src\api\client.ts`, `scripts\qa-backend-read-all.ps1` | Backend-connected mock smoke, mock-backend 403 / 404 smoke, and unreachable-backend failure smoke are automated. | Covered locally |
| Keep backend read contract map aligned. | `scripts\qa-backend-read-contract-map.ps1` | Static QA checks all five fetchers, smoke routes, mock backend paths, and smoke-plan docs stay synchronized. | Covered locally |
| Provide guarded local/staging backend signoff path. | `scripts\qa-backend-read-signoff.ps1` | Wrapper rejects production-like URLs and credentialed/non-local misuse before smoke runs. | Covered locally |
| Verify real local/staging backend reads. | `scripts\qa-backend-read-signoff.ps1 -BackendBaseUrl <approved-url>` | No approved backend URL is present in this repo or session. | Blocked externally |
| Keep all backend traffic read-only. | `scripts\qa-backend-read-smoke.ps1`, `scripts\qa-readonly-source-boundary.ps1` | Browser request monitor fails on non-read methods; source scan blocks write-method signals. | Covered locally |
| Stabilize backend error states. | `scripts\qa-readonly-boundary-states.ps1`, `scripts\qa-backend-read-all.ps1` | Loading, error, missing-config, empty, partial, stale, forbidden, invalid-id, and failure paths are checked locally. | Covered locally |
| Provide role/session UI readiness. | `src\features\auth\*`, `scripts\qa-readonly-auth-states.ps1` | Signed-out, expired, loading, error, forbidden, partial, no-access, and signed-in paths are scripted. | Covered locally |
| Keep role matrix complete. | `scripts\qa-auth-role-matrix.ps1` | Static QA checks 7 roles, 10 routes, 70 cells, session states, access labels, and auth rehearsal signals. | Covered locally |
| Keep auth provider preflight explicit. | `scripts\qa-auth-provider-preflight.ps1` | Static QA checks provider owner, session source, role claim, backend enforcement, staging fixtures, and hard boundaries remain documented before real auth work. | Covered locally |
| Verify env-role rehearsal without `.env`. | `scripts\qa-readonly-auth-live-roles.ps1` | Temporary child Vite processes set `VITE_BACKEND_USER_ROLE`; `.env` is not edited. | Covered locally |
| Verify real auth provider and backend enforcement. | Platform/backend auth stack | No platform auth provider, token model, or backend enforcement evidence is present in this repo. | Blocked externally |
| Keep visible UI Chinese-first. | `scripts\qa-readonly-routes.ps1`, `scripts\qa-readonly-all.ps1` | Scripted copy checks cover Command Center scenes and read-model pages. | Covered locally |
| Verify responsive internal pilot surfaces. | `scripts\qa-readonly-all.ps1` | 1440px, 1024px, and 390px route/interaction checks include overflow checks. | Covered locally |
| Preserve read-only hard boundaries. | `scripts\qa-readonly-source-boundary.ps1`, `scripts\qa-readonly-interactions.ps1` | Source scan and interaction QA cover disabled write/upload/download/public-link posture. | Covered locally |
| Keep release candidate docs current. | `docs\design\FRONTEND_V2_PRODUCTION_ROADMAP.md`, `FRONTEND_V2_INTERNAL_PILOT_READINESS.md`, `FRONTEND_V2_PRODUCTION_RELEASE_CHECKLIST.md`, `FRONTEND_V2_RISK_REGISTER.md`, `FRONTEND_V2_IMPLEMENTATION_HANDOFF.md` | Planning, risk, readiness, checklist, and handoff docs exist and point to current gates. | Covered locally |
| Preserve final signoff evidence slot. | `docs\design\FRONTEND_V2_INTERNAL_PILOT_SIGNOFF_RECORD.md` | Blank signoff record exists for the eventual approved local/staging acceptance run. | Covered locally |
| Keep evidence artifacts present. | `scripts\qa-internal-pilot-manifest.ps1` | Static manifest QA checks required source, QA, and documentation artifacts for the local internal-pilot goal. | Covered locally |
| Keep goal status honest. | `scripts\qa-internal-pilot-goal-audit.ps1` | Static audit QA checks this goal remains a local frontend-ready candidate until backend/auth signoff blockers are cleared. | Covered locally |
| Keep release/signoff docs unapproved. | `scripts\qa-release-boundary-docs.ps1` | Static QA checks internal-pilot, signoff, release, risk, and review docs still separate local readiness from production release. | Covered locally |
| Avoid remote side effects. | Git status and commit history | Local commits exist; push/tag/deploy are not authorized by this audit. | Covered locally |

## Current Local Signoff Stack

Run the full local internal-pilot candidate stack:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-internal-pilot-readiness.ps1
```

This command currently chains:

- `npm run lint`
- `npm run build`
- `scripts\validate-local.ps1`
- `scripts\qa-package-boundary.ps1`
- `scripts\qa-internal-pilot-manifest.ps1`
- `scripts\qa-internal-pilot-goal-audit.ps1`
- `scripts\qa-backend-read-contract-map.ps1`
- `scripts\qa-auth-provider-preflight.ps1`
- `scripts\qa-release-boundary-docs.ps1`
- `scripts\qa-backend-read-all.ps1`
- optional approved backend signoff when `-ApprovedBackendBaseUrl` is provided
- `scripts\qa-readonly-auth-live-roles.ps1`
- `scripts\qa-readonly-auth-states.ps1`
- `scripts\qa-readonly-all.ps1`

For approved local/staging backend signoff, use:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-internal-pilot-readiness.ps1 -ApprovedBackendEnvironment local -ApprovedBackendBaseUrl http://127.0.0.1:8080
```

Use `-ApprovedBackendEnvironment staging` only with an explicitly approved
HTTPS staging backend URL. Do not use production endpoints.

## Missing or Weakly Verified Requirements

| Requirement | Why not complete | Required unblock |
|---|---|---|
| Real backend read smoke | No approved local/staging backend base URL is available in this frontend repo. | Backend/platform owner provides an approved local or staging read-model base URL. |
| Real backend authorization enforcement | Frontend role gates are display-only by design. | Backend verifies role enforcement for every read-model endpoint. |
| Real platform auth/session | Current auth state is mock-first and env-role rehearsal only. | Auth provider, session source, role claims, expiry, and forbidden behavior are approved and available in staging. |
| Staging signoff for empty/partial/stale and backend-specific 403/404 bodies | Local DEV/query rehearsal and localhost HTTP 403 / 404 smoke exist, but staging behavior has not been observed. | Run backend smoke and auth QA against approved staging fixtures. |
| Production release | Push/tag/deploy/release are explicitly out of scope. | Release manager approval plus production checklist completion. |

## Audit Conclusion

Current status:

```text
Studio Operator Internal Pilot Ready: LOCAL_FRONTEND_READY_CANDIDATE
```

Meaning:

- The frontend cockpit, read-only workspaces, mock-first behavior, S2 local
  backend-read path, S3 frontend auth/role readiness, and internal pilot QA
  automation are locally covered.
- The goal is not fully complete until approved local/staging backend read smoke
  and platform auth/backend enforcement are verified.
- No production release, push, tag, deploy, upload, download, public link, or
  business write is authorized by this audit.
