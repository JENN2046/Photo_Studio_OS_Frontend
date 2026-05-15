# Frontend v2 Implementation Handoff

Date: 2026-05-15
Repo: `A:\Photo_Studio_OS_Frontend`
Audience: next frontend implementer and reviewer
Baseline anchor: `frontend-v2-qa-2026.05.07`

This handoff explains where the frontend is now, how to continue safely, and which boundaries must not be crossed without explicit approval.

## One-line Summary

Frontend v2 is a mock-first, read-only cockpit with Command Center plus four production workspaces, local backend-read smoke automation, frontend auth/role readiness, and an internal-pilot QA aggregate. The next coding work should start with approved local/staging backend smoke or platform-auth integration planning, not uploads, downloads, public links, writes, production rollout, or deployment.

## Read These First

1. `docs/design/FRONTEND_V2_PRODUCTION_ROADMAP.md`
2. `docs/design/FRONTEND_V2_CONTRACT_REVIEW.md`
3. `docs/design/FRONTEND_V2_PRODUCTION_REVIEW_CHECKLIST.md`
4. `docs/design/FRONTEND_V2_RISK_REGISTER.md`
5. `docs/design/FRONTEND_V2_INTERNAL_PILOT_READINESS.md`
6. `docs/design/FRONTEND_V2_INTERNAL_PILOT_GOAL_AUDIT.md`
7. `docs/design/FRONTEND_V2_INTERNAL_PILOT_SIGNOFF_RECORD.md`
8. `docs/design/FRONTEND_V2_AUTH_PROVIDER_PREFLIGHT.md`
9. `docs/design/FRONTEND_V2_GAP_MAP.md`
10. `docs/design/COMMAND_CENTER_READONLY_API_CONTRACT_NOTE.md`
11. `README.md`
12. `AGENTS.md`

## Current Product State

Implemented:

- Command Center cockpit with the approved premium dark studio visual direction.
- Chinese-first visible UI copy across Command Center and read-model workspaces.
- Dedicated read-only hash pages:
  - `#asset-inbox`
  - `#qc-retouch`
  - `#review-gallery`
  - `#delivery-readiness`
- Command Center `黄金链路` entries into the four read-model pages.
- Runtime chips showing read source, runtime status, transport posture, and `mock-first / read-only` boundary.
- DEV-only loading/error/missing-config/empty/partial/stale/forbidden/invalid-id state rehearsals.
- Mock-first auth gates, role matrix, role-derived access posture, and `VITE_BACKEND_USER_ROLE` local role QA.
- Local backend-read smoke automation for connected mock backend and unreachable-backend failure paths.
- Internal pilot readiness aggregate QA.
- Local browser QA scripts covering route, boundary-state, interaction, auth, role, and responsive checks.

Not implemented:

- Production auth.
- Backend/platform auth enforcement.
- Upload.
- Download.
- Public review links.
- Public delivery links.
- Storage integration.
- Approval writes.
- QC / retouch writes.
- Delivery publish.
- Deployment or release.

## Current Technical Shape

Main areas:

| Area | Files |
|---|---|
| App shell and rail | `src/components/layout/AppShell.tsx` |
| Shared runtime chips | `src/components/panels/RuntimeChipList.tsx` |
| Command Center UI | `src/features/command-center/CommandCenter.tsx` |
| Command Center view model | `src/features/command-center/commandCenterViewModel.ts` |
| Command Center runtime hook | `src/features/command-center/useCommandCenterSnapshot.ts` |
| Read-model page shell | `src/features/read-models/ReadModelPages.tsx` |
| Read-model workspaces | `src/features/read-models/readModelWorkspaces.tsx` |
| Read-model view models | `src/features/read-models/readModelViewModels.ts` |
| Read-model runtime hook | `src/features/read-models/useBackendReadModel.ts` |
| Read-model routes | `src/features/read-models/readModelRoutes.ts` |
| Backend read fetchers | `src/api/backendReadModels.ts` |
| API client boundary | `src/api/client.ts` |
| Auth / role gate | `src/features/auth/` |
| API types | `src/api/types.ts` |
| Command Center mock | `src/mocks/commandCenter.mock.ts` |
| Read-model mocks | `src/features/read-models/readModelMocks.ts` |
| Global styles | `src/styles/global.css` |
| Tokens | `src/styles/tokens.css` |

Current fetcher boundary:

- Mock remains the default.
- Backend read-model fetchers activate only when `VITE_BACKEND_API_BASE_URL` is deliberately configured outside the repo.
- Local connected/failure smoke is automated through `scripts\qa-backend-read-all.ps1`.
- Approved local/staging backend signoff should use `scripts\qa-backend-read-signoff.ps1` so production-like URLs and credentialed URLs are rejected before smoke runs.
- The frontend must not add POST, PATCH, DELETE, upload, download, storage, public link, or production auth behavior without stage approval.

## Local Commands

Install dependencies from lockfile:

```powershell
npm ci
```

Run the app:

```powershell
npm run dev
```

Fast validation:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\validate-local.ps1
```

Internal pilot candidate validation:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-internal-pilot-readiness.ps1
```

With approved local/staging backend read signoff:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-internal-pilot-readiness.ps1 -ApprovedBackendEnvironment local -ApprovedBackendBaseUrl http://127.0.0.1:8080
```

Full read-only browser QA while Vite is already running:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\validate-local.ps1 -IncludeBrowserQa
```

Direct full browser QA:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-all.ps1
```

Focused checks:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-backend-read-all.ps1
powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-auth-live-roles.ps1
powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-source-boundary.ps1
```

## Next Safe Tracks For New Implementer

### Track 1: Approved real backend read smoke

Goal:

Run the existing frontend against an approved local or staging backend base URL.

Allowed:

- Use `scripts\qa-backend-read-smoke.ps1` with a deliberately configured local/staging URL.
- Prefer `scripts\qa-backend-read-signoff.ps1` for approved local/staging signoff because it wraps backend smoke with URL guards and local validation gates.
- Keep `VITE_BACKEND_API_BASE_URL` outside the repo.
- Add narrow compatibility handling only if the backend returns an additive or nullable read-model shape.
- Keep mock-first validation green.

Blocked:

- Backend repo edits.
- Backend schema edits.
- Write endpoints.
- `.env` edits with real values.
- Production URLs or credentials.

Validation:

- `npm run lint`
- `npm run build`
- `scripts/validate-local.ps1`
- `scripts\qa-backend-read-smoke.ps1`
- `scripts\qa-backend-read-signoff.ps1`
- `scripts\qa-internal-pilot-readiness.ps1` after local compatibility fixes.

### Track 2: Platform auth integration plan

Goal:

Prepare real auth/session integration without implementing token handling in this repo yet.

Allowed:

- Contract docs for provider ownership, session source, role claims, expiry, and forbidden behavior.
- Use `docs\design\FRONTEND_V2_AUTH_PROVIDER_PREFLIGHT.md` as the entry checklist before any real auth integration.
- Frontend adapter interface sketches that do not store tokens or call production auth.
- More local UI state tests if a new read-only auth boundary state is required.

Blocked:

- Production auth provider integration without approval.
- Token storage.
- Real login/logout/refresh mutation.
- Auth secrets, client secrets, or production auth URLs.

Validation:

- `scripts\qa-readonly-auth-states.ps1`
- `scripts\qa-readonly-auth-live-roles.ps1`
- `scripts\qa-readonly-source-boundary.ps1`

### Track 3: Internal pilot evidence maintenance

Goal:

Keep the internal pilot candidate reproducible as backend/auth details arrive.

Allowed:

- Update `FRONTEND_V2_INTERNAL_PILOT_READINESS.md`.
- Update release and review checklists when QA gates change.
- Add narrowly scoped local QA scripts when a manual verification repeats.

Blocked:

- Broad refactors for documentation-only gaps.
- Any production release operation.

Validation:

- Docs-only: `git diff --check` and changed-file secret scan.
- Code or script changes: `scripts\validate-local.ps1`.

### Track 4: Upload/download design before implementation

Goal:

Define storage, signing, audit, scan, expiry, retry, and permission requirements before file movement.

Allowed:

- Contract docs.
- Disabled UI placeholders.
- Non-production mock rehearsals clearly marked as mock.

Blocked:

- Real file upload.
- Real file download.
- Storage provider credentials.
- Raw storage URLs.

### Track 5: Review/delivery public access design

Goal:

Design secure public review/delivery access before adding external-facing routes.

Allowed:

- Token/link state design.
- Expired/revoked/forbidden UI states.
- Contract docs and test plan.

Blocked:

- Public review links.
- Public delivery links.
- Client-facing production access.

## Coding Rules For The Next Implementer

- Preserve mock-first default behavior.
- Keep visible UI Chinese-first.
- Keep the Command Center three-gauge composition intact.
- Use existing view-model files before adding new data derivation inside JSX.
- Use existing QA scripts before adding new automation.
- Do not change `package.json` or lockfiles without explicit dependency approval.
- Do not edit `.env` or commit secrets.
- Do not use `git add .`.
- Do not push, tag, deploy, or create PRs without explicit approval.

## Review Expectations

Every implementation PR or local handoff should answer:

- What stage from `FRONTEND_V2_PRODUCTION_ROADMAP.md` does this implement?
- Which files changed?
- Does mock-first still work without backend config?
- Did any write behavior appear?
- Did any upload/download/public link/auth/storage behavior appear?
- Which validation ran?
- Which browser routes were checked?
- What remains blocked by backend/platform/security approval?

## Stop Immediately If

- A task requires backend repo changes.
- A task requires dependency changes.
- A task requires real credentials, `.env`, token storage, or production URLs.
- A task requires upload/download/storage integration.
- A task requires public review/delivery links.
- A task requires POST/PATCH/DELETE behavior.
- A task requires deployment, release, push, tag, or PR creation.
- A task could overwrite uncommitted user work.

## Suggested First Assignment

Start with `S2-External Backend Read Smoke` after a local/staging backend URL is approved:

- Run `scripts\qa-backend-read-smoke.ps1` against the approved backend URL.
- Or run `scripts\qa-backend-read-signoff.ps1` for the guarded signoff path.
- Confirm Command Center plus the four read-model pages request the five expected GET paths.
- Confirm backend 403/404/network states remain calm and read-only.
- Keep `.env`, backend repo, root repo, dependency files, upload/download, public links, writes, push, tag, and deploy untouched.
- If backend shape mismatches appear, make the narrowest frontend compatibility patch and rerun `scripts\qa-internal-pilot-readiness.ps1`.
