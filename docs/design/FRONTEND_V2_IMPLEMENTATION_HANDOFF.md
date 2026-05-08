# Frontend v2 Implementation Handoff

Date: 2026-05-08
Repo: `A:\Photo_Studio_OS_Frontend`
Audience: next frontend implementer and reviewer
Baseline anchor: `frontend-v2-qa-2026.05.07`

This handoff explains where the frontend is now, how to continue safely, and which boundaries must not be crossed without explicit approval.

## One-line Summary

Frontend v2 is a mock-first, read-only cockpit with Command Center plus four production workspaces. The next coding work should start with contract-safe backend read integration and role-state scaffolding, not uploads, downloads, public links, writes, auth production rollout, or deployment.

## Read These First

1. `docs/design/FRONTEND_V2_PRODUCTION_ROADMAP.md`
2. `docs/design/FRONTEND_V2_CONTRACT_REVIEW.md`
3. `docs/design/FRONTEND_V2_PRODUCTION_REVIEW_CHECKLIST.md`
4. `docs/design/FRONTEND_V2_RISK_REGISTER.md`
5. `docs/design/FRONTEND_V2_GAP_MAP.md`
6. `docs/design/COMMAND_CENTER_READONLY_API_CONTRACT_NOTE.md`
7. `README.md`
8. `AGENTS.md`

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
- DEV-only loading/error/missing-config state rehearsals.
- Local browser QA scripts covering route, boundary-state, interaction, and responsive checks.

Not implemented:

- Production auth.
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
| API types | `src/api/types.ts` |
| Command Center mock | `src/mocks/commandCenter.mock.ts` |
| Read-model mocks | `src/features/read-models/readModelMocks.ts` |
| Global styles | `src/styles/global.css` |
| Tokens | `src/styles/tokens.css` |

Current fetcher boundary:

- Mock remains the default.
- Backend read-model fetchers activate only when `VITE_BACKEND_API_BASE_URL` is deliberately configured outside the repo.
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

Full read-only browser QA while Vite is already running:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\validate-local.ps1 -IncludeBrowserQa
```

Direct full browser QA:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-all.ps1
```

## First Coding Track For New Implementer

### Track 1: Contract parity before behavior

Goal:

Make sure frontend types, mocks, view-model derivations, and backend read responses agree.

Allowed:

- Add type guards or lightweight compatibility mapping for backend read responses.
- Add empty, partial, stale, permission-denied, and invalid-id display states.
- Extend mocks only to mirror approved read-model fields.
- Keep UI behavior read-only.

Blocked:

- Backend repo edits.
- Backend schema edits.
- Write endpoints.
- Production auth.
- `.env` edits with real values.

Validation:

- `npm run lint`
- `npm run build`
- `scripts/validate-local.ps1`
- Browser QA when state or route behavior changes.

### Track 2: Backend read smoke, still read-only

Goal:

Confirm real backend reads can render without breaking mock-first fallback.

Allowed:

- Add local smoke notes or scripts that require an intentionally configured local/staging base URL.
- Keep backend read activation behind `VITE_BACKEND_API_BASE_URL`.
- Surface backend error states calmly.

Blocked:

- Tokens in frontend code.
- Production URLs in docs or source.
- Any upload/download/write behavior.

Validation:

- Mock-first validation must still pass with no backend configured.
- Optional backend smoke can run only with sanitized local/staging config.

### Track 3: Role-state scaffolding

Goal:

Prepare signed-out, forbidden, expired-session, and insufficient-role UI states before real auth.

Allowed:

- Display-only role matrices and disabled navigation states.
- Mock role rehearsal states.
- UI copy that explains permission posture.

Blocked:

- Production auth provider integration.
- Token storage.
- Real user/session mutation.

Validation:

- Route QA for role states once implemented.
- Keyboard and focus checks for role-gated surfaces.

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

Start with `P4-A Production Contract Pack`:

- Expand contract review for all five read surfaces.
- Add state coverage for empty, partial, stale, permission-denied, and invalid-id states.
- Keep all changes docs/type/mock/view-model only.
- Run docs or local validation depending on whether code changes occur.
