# Frontend v2 Backend Read Smoke Plan

Date: 2026-05-08
Repo: `A:\Photo_Studio_OS_Frontend`
Related roadmap stage: `S2 Backend Read Integration`
Depends on: `S1 Contract Freeze` (P4-A)

This plan defines how to run backend read-model smoke tests without committing secrets, editing `.env`, or introducing write behavior. It is a planning and procedure document only.

## Prerequisites

Before running backend smoke:

1. A backend read-model stack is available at a known base URL.
2. The backend supports the 5 read-model paths listed in [Current Frontend Read-model Fetchers](#current-frontend-read-model-fetchers).
3. The backend responds with JSON envelopes matching the contract shapes in `src/api/backendReadModels.ts`.
4. The backend does not require production auth tokens for read-only smoke.
5. No `.env` file is edited inside this repository.

## Environment Variable Activation

Backend reads activate only when `VITE_BACKEND_API_BASE_URL` is set **outside** the repository. Set it in the shell before starting the dev server:

```powershell
$env:VITE_BACKEND_API_BASE_URL = "http://localhost:8080"
npm run dev
```

Optional operator hints (must not become auth):

```powershell
$env:VITE_BACKEND_USER_ROLE = "owner"
$env:VITE_BACKEND_USER_NAME = "Smoke Operator"
```

If `VITE_BACKEND_API_BASE_URL` is unset or empty, the frontend falls back to mock-first mode. This is the default and must always work.

## Current Frontend Read-model Fetchers

| Fetcher | Read path | Required param | Smoke URL fragment |
|---|---|---|---|
| `fetchCommandCenterV2Snapshot()` | `/command-center/v2` | none | `#` |
| `fetchAssetInboxReadModel()` | `/projects/:projectId/asset-inbox` | `projectId` | `#asset-inbox?projectId=PRJ-128` |
| `fetchQcRetouchQueueReadModel()` | `/projects/:projectId/qc-retouch-queue` | `projectId` | `#qc-retouch?projectId=PRJ-128` |
| `fetchReviewGalleryReadModel()` | `/review-sessions/:reviewSessionId/gallery` | `reviewSessionId` | `#review-gallery?reviewSessionId=REV-441` |
| `fetchDeliveryReadinessReadModel()` | `/deliveries/:deliveryId/readiness` | `deliveryId` | `#delivery-readiness?deliveryId=DEL-220` |

## Smoke Procedure

### Automated helper

Use the local helper when you want a repeatable browser-led smoke. It starts a
temporary Vite server with `VITE_BACKEND_API_BASE_URL` set only in that child
process; it does not edit `.env`.

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-backend-read-smoke.ps1 -BackendBaseUrl http://127.0.0.1:8080
```

For the full local backend read smoke, run the aggregate helper. It checks the
connected path with a temporary mock backend and the unreachable-backend failure
path:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-backend-read-all.ps1
```

To verify the backend-connected UI path without a real backend, run the local
mock backend wrapper. It starts a temporary localhost GET/OPTIONS JSON server
with the five read-model paths, then reuses the same smoke helper:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-backend-read-smoke-mock.ps1
```

For a local failure-mode rehearsal without a real backend, use an unused local
port and expect read failure UI:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-backend-read-smoke.ps1 -BackendBaseUrl http://127.0.0.1:59999 -ExpectReadFailure
```

For approved local/staging signoff, use the guarded wrapper. It refuses
credentialed URLs, production-like hostnames, and non-local `http` staging
targets, then runs the backend read smoke and local frontend gates:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-backend-read-signoff.ps1 -EnvironmentName local -BackendBaseUrl http://127.0.0.1:8080
```

For staging, use `-EnvironmentName staging` only after a human explicitly
approves the staging backend base URL. Do not use this wrapper for production.

The helper checks Command Center plus the four read-model hash pages, verifies
the `后端只读` / `mock-first / read-only` runtime posture, checks that all five
expected backend read paths are requested, and fails if the browser observes
non-read request methods. Non-local backend URLs are blocked by default; use
`-AllowNonLocalBackend` only for an explicitly approved staging smoke, never for
production.

### Step 1: Verify mock-first baseline

```powershell
npm run dev
```

Open `http://127.0.0.1:5173/#`. Confirm:
- Command Center renders with mock data.
- Runtime chips show `读取源: 本地模拟`, `传输: 后端未配置`.
- Navigation works to all four read-model pages.

Stop here if mock-first is broken before introducing backend config.

### Step 2: Start with backend config

Stop the dev server. Set the backend URL and restart:

```powershell
$env:VITE_BACKEND_API_BASE_URL = "<local-or-staging-backend-base-url>"
npm run dev
```

### Step 3: Command Center smoke

Open `http://127.0.0.1:5173/#`.

Expected if backend is reachable:
- Runtime chips show `读取源: 后端只读`, `传输: 已连接`.
- Gauge cluster shows data from backend snapshot.
- No console errors.

Expected if backend is unreachable or misconfigured:
- Runtime chips show `读取源: 后端只读`, `传输: 请求失败`.
- State notice shows `只读模型不可用` with error message.
- `重试` button is available.
- Command Center layout is preserved.

Expected if backend returns 403 or 404:
- `403` shows `权限不足` while keeping the Command Center in a read-only boundary surface.
- `404` shows `ID 无效` / `快照未找到` while keeping the Command Center in a read-only boundary surface.
- No project, risk, approval, or execution data is inferred when the snapshot is not returned.

### Step 4: Asset Inbox smoke

Open `http://127.0.0.1:5173/#asset-inbox?projectId=PRJ-128`.

Expected if backend returns data:
- Runtime chips show `读取源: 后端只读`, `传输: 已连接`.
- Asset grid shows backend items.
- Selected asset detail shows binding, file info, QC checklist.
- Upload/download buttons remain disabled.

Check empty state:
- Use a `projectId` known to have zero assets on the backend.
- Workspace should show `该视图暂无数据` notice.
- Asset grid should be empty.

### Step 5: QC / Retouch smoke

Open `http://127.0.0.1:5173/#qc-retouch?projectId=PRJ-128`.

Expected if backend returns data:
- Queue items visible from backend.
- Selected item shows QC results, retouch status, failure reasons.
- Suggested action buttons remain disabled.

### Step 6: Review Gallery smoke

Open `http://127.0.0.1:5173/#review-gallery?reviewSessionId=REV-441`.

Expected if backend returns data:
- Review items visible from backend.
- Selected item shows status, client feedback state.
- Public review and feedback write buttons remain disabled.

### Step 7: Delivery Readiness smoke

Open `http://127.0.0.1:5173/#delivery-readiness?deliveryId=DEL-220`.

Expected if backend returns data:
- Delivery package info visible from backend.
- Checklist and blockers visible.
- Download and external delivery buttons remain disabled.

### Step 8: Verify mock fallback still works

Stop the dev server, unset the backend URL, restart:

```powershell
Remove-Item Env:\VITE_BACKEND_API_BASE_URL -ErrorAction SilentlyContinue
npm run dev
```

Confirm all surfaces render with mock data again. Runtime chips should show `本地模拟`.

## Response Shape Expectations

Each backend response must conform to the types defined in `src/api/backendReadModels.ts`:

| Surface | Key type | Envelope | Required at minimum |
|---|---|---|---|
| Command Center | `BackendCommandCenterV2` | `{ data: T }` | `studio`, `coverage`, `qc`, `previews` |
| Asset Inbox | `BackendAssetInbox` | `{ data: T }` | `projectId`, `items`, `total` |
| QC / Retouch | `BackendQcRetouchQueue` | `{ data: T }` | `projectId`, `items`, `total` |
| Review Gallery | `BackendReviewGallery` | `{ data: T }` | `reviewSessionId`, `items` |
| Delivery Readiness | `BackendDeliveryReadiness` | `{ data: T }` | `deliveryId`, `checklist`, `blockers` |

Frontend is designed to tolerate additive fields. Unknown fields in the response should not break rendering.

## Failure Modes

| Symptom | Likely cause | Action |
|---|---|---|
| `读取源: 本地模拟` when backend URL is set | `VITE_BACKEND_API_BASE_URL` not recognized; restart dev server | Re-check env var and restart Vite |
| `只读模型不可用` with `403` | Backend requires auth the frontend is not providing | Stop; auth is out of scope for this stage |
| `请求的 ID 未找到` with `404` | Wrong projectId/reviewSessionId/deliveryId | Confirm the ID exists on backend |
| `权限不足` state | Backend returned 403 even for read endpoints | Stop; confirm backend read-model auth posture |
| `只读模型不可用` with network error | Backend unreachable or CORS blocked | Check backend URL, network, CORS config |
| Workspace renders with zero items | Backend returned empty `items` array | Verify test data on backend; check `该视图暂无数据` notice |
| Console error but page still renders | Backend response shape mismatch | Compare response with types in `backendReadModels.ts` |
| Dev server fails to start | Port conflict | Check port 5173; kill stale process |

## State Verification

Confirm each state renders correctly when triggered by backend response:

| State | Trigger | Expected UI |
|---|---|---|
| Loading | Normal fetch delay | `读取中` notice with calm loading state |
| Ready | Successful response | Workspace renders; `已就绪` chip |
| Empty | Response with `total: 0` or `items: []` | `该视图暂无数据` notice; empty workspace |
| Error | Network failure or 5xx | `只读模型不可用` notice; `重试` button |
| Forbidden | 403 response | `无权访问该只读模型`; no data exposed |
| Invalid ID | 404 response | `请求的 ID 无效或未找到` notice |

## Runtime Chip Verification

| Source chip | Expected when |
|---|---|
| `本地模拟` | No `VITE_BACKEND_API_BASE_URL` configured |
| `后端只读` | Backend URL configured, request in flight or succeeded |
| `请求中` | Fetch in progress |
| `已连接` | Fetch succeeded |
| `请求失败` | Fetch failed (network, 5xx) |
| `权限不足` | 403 response |

The `写入边界` chip must always show `mock-first / read-only` regardless of backend config.

## Stop Gates

Stop the smoke run immediately if:

- Backend requires production auth tokens for read endpoints.
- Backend response shape differs from types in `backendReadModels.ts` and requires frontend type changes beyond additive tolerance.
- Backend returns 5xx for all endpoints.
- `.env` file changes are needed.
- Production URLs are needed.
- Any write behavior (POST/PATCH/DELETE) appears in request logs.

## Post-Smoke Validation

After smoke completes successfully:

```powershell
npm run lint
npm run build
powershell -ExecutionPolicy Bypass -File scripts\validate-local.ps1
```

If the dev server is still running:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-all.ps1
```

## Smoke Signoff

| Item | Status |
|---|---|
| Mock-first baseline intact | |
| Command Center backend read | |
| Asset Inbox backend read | |
| QC / Retouch backend read | |
| Review Gallery backend read | |
| Delivery Readiness backend read | |
| Empty state verified | |
| Error state verified | |
| Mock fallback confirmed | |
| No write behavior detected | |
| Runtime chips correct | |
| Lint passes | |
| Build passes | |
| Browser QA passes | |
| No secrets committed | |
| `scripts\qa-backend-read-all.ps1` passes for connected and failure local backend read smoke | |
| `scripts\qa-backend-read-smoke.ps1` passes for local/staging read smoke | |
| `scripts\qa-backend-read-signoff.ps1` passes for approved local/staging backend read signoff | |
| `scripts\qa-backend-read-smoke-mock.ps1` passes for connected-path local mock backend smoke | |

## Non-goals

This smoke plan does not cover:

- Performance or load testing.
- Auth token flows.
- Upload/download/storage integration.
- Public review or delivery links.
- Write operations.
- Production deployment.
- Backend schema or code changes.
