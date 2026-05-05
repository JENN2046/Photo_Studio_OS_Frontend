# Command Center Read-only API Contract Note

Date: 2026-05-05
Scope: T128 Command Center read-only Alpha

This note records future read-only API expectations for the Command Center. It is a frontend planning artifact only. It does not connect to a backend, change backend response shapes, add API calls, or implement production access.

## Current Frontend Boundary

- The Command Center Alpha uses local mock data.
- The API client remains interface-first and read-only.
- No live backend URL is configured.
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
3. Add backend contract gaps only as documentation until backend read endpoints are explicitly approved.
4. Run `npm run lint` and `npm run build` for any future code change.

Stop before any real backend connection or token handling.
