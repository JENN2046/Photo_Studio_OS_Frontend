# Command Center Read-only API Contract Note

Date: 2026-05-07
Scope: T128 Command Center read-only Alpha and Frontend v2 read-model surfaces

This note records future read-only API expectations for the Command Center. It is a frontend planning artifact only. It does not connect to a backend, change backend response shapes, add API calls, or implement production access.

## Current Frontend Boundary

- The Command Center Alpha uses local mock data.
- The API client remains interface-first and read-only.
- Mock mode remains the default unless `VITE_BACKEND_API_BASE_URL` is explicitly configured.
- No auth token handling is implemented.
- No POST, PATCH, DELETE, upload, download, external Review, or external Delivery flow is implemented.

## Future Snapshot Shape

The current mock-first page expects one read-only dashboard snapshot that can be fetched later after the backend contract is approved.

Candidate read-only groups:

| Group | Purpose | Current mock surface |
|---|---|---|
| Studio | Operator context, mode, location, active project count | `studio` |
| Coverage | SKU coverage and completed/total counts | `coverage` |
| QC | QC health, passed, flagged, pending counts | `qc` |
| Workflow stages | Product Golden Path visibility | `workflowStages` |
| Projects | Project execution table | `projects` |
| SKUs | SKU matrix | `skus` |
| Assets | Asset watch | `assets` |
| Reviews | Review session read-only status | `reviews` |
| Deliveries | Delivery package read-only status | `deliveries` |
| Risk pulse | Operator risk signals | `riskPulse` |
| Approval queue | Human decision pressure | `approvalQueue` |
| Activity | Curated operational timeline | `activityTimeline` |
| AI inspection | Mock/future-assisted inspection feed | `aiInspectionFeed` |

## Contract Gaps To Resolve Later

- Which backend read endpoint should provide the dashboard snapshot.
- Whether dashboard data should be a single aggregate endpoint or multiple read-only endpoints.
- Exact timestamp format and timezone policy.
- Whether risk and approval labels are backend-owned or frontend display mappings.
- Whether AI inspection feed is backend-owned, AI-service-owned, or mock-only until a later phase.
- Pagination or item limits for project execution, activity timeline, and inspection feed.
- Error and loading states for a read-only dashboard fetch.

## Current Frontend Read-model Fetchers

The frontend now has optional, read-only fetchers in `src/api/backendReadModels.ts`.
They remain dormant in normal development because mock data is used unless `VITE_BACKEND_API_BASE_URL` is configured.

| Fetcher | Read path | Required context | Current UI surface |
|---|---|---|---|
| `fetchCommandCenterV2Snapshot()` | `/command-center/v2` | backend base URL | Command Center |
| `fetchAssetInboxReadModel()` | `/projects/:projectId/asset-inbox` | `projectId` | `#asset-inbox` |
| `fetchQcRetouchQueueReadModel()` | `/projects/:projectId/qc-retouch-queue` | `projectId` | `#qc-retouch` |
| `fetchReviewGalleryReadModel()` | `/review-sessions/:reviewSessionId/gallery` | `reviewSessionId` | `#review-gallery` |
| `fetchDeliveryReadinessReadModel()` | `/deliveries/:deliveryId/readiness` | `deliveryId` | `#delivery-readiness` |

Optional request headers are frontend-only operator hints:

- `VITE_BACKEND_USER_ROLE`, default `owner`
- `VITE_BACKEND_USER_NAME`, default `Frontend Operator`

These headers must not become auth. Production auth remains out of scope.

## Optional Local Smoke Checklist

The full backend read smoke procedure, including environment setup, per-surface verification, runtime chip checks, failure mode diagnosis, and stop gates, is documented in `docs/design/FRONTEND_V2_BACKEND_READ_SMOKE_PLAN.md`.

Quick smoke path (requires a local backend stack and intentionally configured `VITE_BACKEND_API_BASE_URL` outside this repo):

1. Start the frontend with `VITE_BACKEND_API_BASE_URL=<local backend base URL>`.
2. Open `http://127.0.0.1:5173/#` through `#delivery-readiness?deliveryId=DEL-220`.
3. Confirm runtime chips show `后端只读` / `已连接`.
4. Confirm the UI remains read-only, console errors are absent, and disabled actions stay disabled.

Stop immediately if the smoke path requires tokens, `.env` edits, backend code changes, uploads, downloads, approval writes, public links, or production endpoints.

## Explicit Non-goals

- No mutation endpoints.
- No approval write actions.
- No asset deletion.
- No upload/download.
- No public client-facing Review or Delivery links.
- No production auth.
- No production backend URL.
- No token storage.
- No direct database access.

## Next Safe Frontend Step

The next safe implementation step is still mock-first:

1. Keep `CommandCenterReadClient` read-only.
2. Preserve the mock adapter as the default.
3. Keep the five read-model fetchers read-only and compatible with the documented paths.
4. Run `npm run lint` and `npm run build` for any future code change.

Stop before any real backend connection or token handling.
