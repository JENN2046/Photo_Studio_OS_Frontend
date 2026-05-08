# Frontend v2 Contract Review

Date: 2026-05-08
Repo: `A:\Photo_Studio_OS_Frontend`
Related roadmap stage: `S1 Contract freeze` — **frozen**, see `FRONTEND_V2_S1_CONTRACT_FREEZE.md`

This document is the review surface for frontend/backend contracts. All open questions have been resolved and the frozen contract is recorded in `FRONTEND_V2_S1_CONTRACT_FREEZE.md`. This document remains as the review frame; the freeze document is authoritative for implementation.

## Review Goal

Before the frontend moves beyond mock-first read-only behavior, reviewers should confirm:

- Each read-model endpoint has a stable owner and response shape.
- Required, optional, nullable, and frontend-derived fields are explicit.
- Empty, partial, stale, error, missing-config, forbidden, and invalid-id states are defined.
- Mock fixtures match the agreed contract closely enough to catch UI drift.
- Future write actions are separated from current read models.

## Current Read Surfaces

| Surface | Route | Fetcher | Required ID | Current default |
|---|---|---|---|---|
| Command Center | `#` | `fetchCommandCenterV2Snapshot()` | none | mock |
| Asset Inbox | `#asset-inbox` | `fetchAssetInboxReadModel()` | `projectId` | mock |
| QC / Retouch | `#qc-retouch` | `fetchQcRetouchQueueReadModel()` | `projectId` | mock |
| Review Gallery | `#review-gallery` | `fetchReviewGalleryReadModel()` | `reviewSessionId` | mock |
| Delivery Readiness | `#delivery-readiness` | `fetchDeliveryReadinessReadModel()` | `deliveryId` | mock |

Current backend activation rule:

- Backend reads are optional.
- Backend reads activate only when `VITE_BACKEND_API_BASE_URL` is configured outside the repo.
- Mock-first behavior must remain the default local path.

## Common Contract Requirements

Each read response should define:

- `id` fields as stable strings.
- `updatedAt` or equivalent freshness metadata.
- `source` or equivalent read-model provenance when available.
- Empty-state semantics.
- Partial-data semantics.
- Stale-data semantics.
- Permission-denied semantics.
- Error envelope shape.
- Pagination or item limits when lists can grow.
- Timezone policy for timestamps and due dates.
- Numeric units and formatting ownership.
- Which labels are backend-owned vs frontend display mappings.

Recommended response posture:

- Backend owns durable business facts.
- Frontend owns presentation labels, tone, grouping, and layout.
- Frontend may derive display helpers, but must not invent production truth.
- Unknown fields should not break the UI.
- Missing required fields should produce a clear boundary state.

## Surface Contract Matrix

### Command Center

Purpose:

Show operator-level studio readiness, project execution, risk, approval, activity, and Agent inspection signals.

Required groups:

- Studio context.
- Coverage summary.
- QC summary.
- Project execution list.
- Risk pulse.
- Approval queue.
- Activity timeline.
- Agent inspection feed.

Open review questions:

- Is this one aggregate endpoint or several read endpoints composed by frontend?
- What is the maximum number of projects, risk items, approvals, and activity items?
- Are risk and approval severities backend-owned?
- Does Agent inspection data come from backend, AI service, or a separate read model?
- What freshness indicator should operators trust?

Must not include yet:

- Approval mutation links.
- Production auth tokens.
- Upload/download links.
- Public review/delivery URLs.

### Asset Inbox

Purpose:

Show where assets came from, how they bind to SKU / shot requirements, and what QC risk exists.

Required groups:

- Project identity.
- Intake source and batch status.
- Asset list.
- Selected asset detail.
- SKU / shot binding.
- File metadata.
- QC checklist summary.

Open review questions:

- Which file metadata is backend-owned vs extracted client-side?
- How are duplicates represented?
- How are unbound, conflict, and low-confidence binding states represented?
- How should missing thumbnails be represented?
- Does Capture One source status come from backend, local agent, or operator input?

Must not include yet:

- Real upload.
- Real download.
- Asset deletion.
- Storage URLs.
- Binding confirmation write.

### QC / Retouch

Purpose:

Explain why an asset failed or needs attention, who owns the next step, and what retouch instruction applies.

Required groups:

- Queue items.
- QC check results.
- Failure reasons.
- Severity.
- Owner / assignee.
- Due time.
- Technical checks.
- Manual checks.
- Retouch instructions.

Open review questions:

- What is the canonical QC status enum?
- Can one asset have multiple active QC checks?
- Are failure reasons structured codes, localized strings, or both?
- How are reshoot vs retouch decisions represented?
- Who owns deadlines and SLA calculations?

Must not include yet:

- Return to retouch write.
- Mark reshoot write.
- QC pass/fail write.
- Retouch task mutation.

### Review Gallery

Purpose:

Show internal review session status before public/client-facing review is approved.

Required groups:

- Review session identity.
- Review item list.
- Selected item detail.
- Client feedback state.
- Revision request state.
- Approval summary.
- Deadline or expiry metadata.

Open review questions:

- Is client feedback public-facing or internal-only in this endpoint?
- How are comments, annotations, and revisions paginated?
- What content is safe to show to clients?
- How are expired or revoked sessions represented?
- Is approval state per asset, per SKU, or per session?

Must not include yet:

- Public review links.
- Feedback submit write.
- Approve/request revision write.
- Client auth or token handling.

### Delivery Readiness

Purpose:

Show whether a delivery package is ready, what is included, and what blocks release.

Required groups:

- Delivery package identity.
- Manifest.
- Output artifacts.
- Readiness checklist.
- Blockers.
- Recipient or channel metadata when safe.
- Expiry and confirmation state when applicable.

Open review questions:

- What is the canonical delivery status enum?
- Are output artifacts signed, public, or permissioned?
- How is package completeness calculated?
- What blocks delivery publish?
- Is confirmation required from internal operator or external recipient?

Must not include yet:

- Real download.
- Public delivery links.
- Delivery publish write.
- External recipient access.
- Raw storage URLs.

## State Review Matrix

| State | Required frontend behavior | Review questions |
|---|---|---|
| Loading | Calm loading UI; no layout jump; no fake data claim. | Does backend expose enough metadata for progressive loading? |
| Empty | Clear empty explanation and next safe action. | Is empty valid, blocked, or misconfigured? |
| Partial | Show available data and mark missing sections. | Does response identify partial groups? |
| Stale | Show stale/freshness warning. | What timestamp and threshold define stale? |
| Error | Show recoverable error state; no stack traces. | What error envelope is canonical? |
| Missing config | Keep mock-first local path or clear disabled state. | How does staging differ from local? |
| Forbidden | Clear permission state; no data leak. | Does backend return 403 with safe body? |
| Invalid ID | Clear invalid context state. | Is this 404, 400, or empty response? |

## Versioning Review

Before broad backend integration, decide:

- Read-model API version naming.
- Backward compatibility window.
- Required deprecation notice period.
- Fixture update process.
- How QA scripts track canonical fixture IDs.
- Whether frontend accepts additive fields without code changes.

## Future Write Contract Gate

No write action should be implemented until the corresponding review entry has:

- Endpoint method and path.
- Required request body.
- Server-side permission rule.
- Idempotency or conflict behavior.
- Audit event.
- Success response.
- Validation error response.
- Retry and rollback posture.
- Frontend confirmation copy.
- Browser QA path.

Candidate future write contracts:

- Asset binding confirmation.
- QC pass / fail / warning.
- Return to retouch.
- Mark for reshoot.
- Retouch task status update.
- Client feedback submit.
- Review approve / request revision.
- Delivery package publish.
- Delivery confirmation.

## Contract Freeze Checklist

All items resolved in `FRONTEND_V2_S1_CONTRACT_FREEZE.md`.

- [x] Backend owner named for each read surface. (Frontend-defined; backend ownership pending S2)
- [x] Response examples reviewed for all five read surfaces. (Frozen in code via `Backend*` types)
- [x] Required fields identified.
- [x] Optional fields identified.
- [x] Nullable fields identified.
- [x] Frontend-derived fields identified.
- [x] Empty state defined.
- [x] Partial state defined.
- [x] Stale state defined. (5-min threshold defined; UI implementation future)
- [x] Error envelope defined. (`{ data: T, meta?: { requestId? } }`)
- [x] Forbidden state defined. (403 → `forbidden` with calm permission message)
- [x] Invalid-id state defined. (404 → `invalid-id` with clear context message)
- [x] Timezone policy defined. (RFC 3339 with offset; local display via `Intl.DateTimeFormat`)
- [x] Pagination or list limits defined.
- [x] Mock fixtures updated to match contract.
- [x] QA fixture IDs still valid.
- [x] No write behavior introduced.
- [x] No production auth introduced.
- [x] No upload/download introduced.
- [x] No public review/delivery links introduced.

## Reviewer Notes

Use this document as a stoplight:

- Green: read-only contract clarification, mock fixture alignment, display-state coverage.
- Yellow: backend read smoke, auth state rehearsal, role-gated display behavior.
- Red: writes, auth production rollout, upload/download, storage, public links, deployment, release.
