# Frontend v2 S1 Contract Freeze

Date: 2026-05-08
Roadmap stage: S1 — Contract Freeze
Status: Frozen

This document records the frozen frontend/backend read-model contracts for Frontend v2. It answers the open questions raised during contract review (`FRONTEND_V2_CONTRACT_REVIEW.md`) and serves as the authoritative reference for all five read surfaces.

Code artifacts that embody these contracts:

- Backend wire types: `src/api/backendReadModels.ts`
- Frontend display types: `src/api/types.ts`
- View-model derivation: `src/features/read-models/readModelViewModels.ts`
- Mock fixtures: `src/features/read-models/readModelMocks.ts`
- Runtime state hooks: `src/features/read-models/useBackendReadModel.ts`

---

## 1. Stable ID Conventions

| Entity | Format | Example | Notes |
|---|---|---|---|
| Client | `CLIENT-<CODE>` | `CLIENT-NOIR` | Studio workspace anchor |
| Project | `PRJ-<nnn>` | `PRJ-128` | Primary routing context |
| SKU | `SKU-<CODE>-<nnn>` | `SKU-AUR-001` | Backend-owned product code |
| Shot Requirement | `SHOT-<CODE>-<TYPE>` | `SHOT-AUR-HERO` | Per-SKU shoot plan |
| Asset | `AST-<nnnn>` | `AST-9012` | Four-digit stable |
| QC Check | `QC-<nnnn>` | `QC-9012` | Referenced by asset |
| Review Session | `REV-<nnn>` | `REV-441` | Three-digit stable |
| Review Item | `RVI-<nnnn>` | `RVI-9012` | Referenced from review session |
| Delivery Package | `DEL-<nnn>` | `DEL-220` | Three-digit stable |
| Retouch Task | `RET-<nnnn>` | `RET-4401` | Linked to asset version |
| Operator | free text | `运营值班` | Not ID-bound in current read-only phase |

Golden Product Loop canonical fixture: `PRJ-128` / `REV-441` / `DEL-220`.

---

## 2. Common Contract Decisions

### Response envelope

Backend returns `{ data: T, meta?: { requestId?: string } }`. Frontend strips the envelope in `fetchReadModel()`. Errors use HTTP status codes (`ReadModelHttpError`).

### Timezone policy

All timestamps (`generatedAt`, `dueAt`, `expiresAt`, `at`) are RFC 3339 with offset (e.g. `2026-05-07T18:00:00+08:00`). Frontend formats to local time via `Intl.DateTimeFormat("zh-CN", ...)`. No UTC-only assumption.

### Pagination and list limits

| Surface | Page param | Limit param | Max reasonable items |
|---|---|---|---|
| Asset Inbox | `page` | `limit` (default 24) | ~500 per project |
| QC / Retouch | `page` | `limit` (default 24) | ~200 per project |
| Review Gallery | none (full list) | n/a | ~50 items per session |
| Delivery Readiness | none (single) | n/a | single package view |
| Command Center | none (single) | n/a | aggregate snapshot |

Review Gallery and Delivery Readiness return full lists because review sessions and delivery packages are bounded. Asset Inbox and QC/Retouch use pagination because project-level asset counts can grow.

### Backend labels vs frontend labels

Backend owns: status enums (`uploaded`, `matched`, `qc_failed`, etc.), failure reason codes (`focus_left_edge`, `color_label_shift`), blocker codes (`missing_approved_qc`), and entity IDs.

Frontend owns: all display labels (Chinese-first via `formatStatus`, `formatReason`, `formatSource`), grouping, tone assignment (`ReadModelTone`), and layout.

Backend `labelKey` / `titleKey` values (e.g. `stage.intake`) are localization keys that frontend maps through `stageLabels` — backend never sends end-user-facing Chinese directly.

### Unknown fields

Frontend must tolerate additive backend fields without error (TypeScript structural typing handles this at compile time; `fetchReadModel<T>()` JSON parsing is structurally tolerant at runtime).

### Missing required fields

The view-model layer handles absent fields defensively: `undefined` → placeholder text (e.g. "未绑定 SKU", "时间待定", "体积待定"). No crash on missing optional fields.

### Numeric units

Backend sends raw values. Frontend formats: `formatBytes()` for file sizes, `formatPercent()` for ratios, `formatShortDateTime()` for timestamps, `formatDimensions()` for pixel sizes.

---

## 3. Per-Surface Contract Decisions

### 3.1 Command Center (`/command-center/v2`)

**Decision: one aggregate snapshot endpoint.**

Backend provides a single `BackendCommandCenterV2` response covering all groups. Frontend maps it to the legacy `CommandCenterSnapshot` shape through `mapCommandCenterV2()`. This keeps the UI stable while allowing backend evolution.

**Field ownership table:**

| Group | Backend-owned | Frontend-derived |
|---|---|---|
| Studio | `name`, `timezone`, `mode`, `organizationId` | `locationLabel` (from timezone), `modeLabel` (Chinese), `readinessPercent` (computed), `activeProjectCount` (from previews) |
| Coverage | `skuCoveragePercent`, `completedSkus`, `totalSkus`, `missingShotCount` | none |
| QC | `qcHealthPercent`, `passed`, `warning`, `failed`, `pendingAssets` | `flagged` = `warning + failed` |
| Workflow Stages | `id`, `labelKey`, `status`, `count`, `riskLevel` | `label` (from labelKey map), `status` enum, `state` enum, `detail` text |
| Risk Pulse | `id`, `type`, `severity`, `titleKey`, `count`, `consequence`, `href` | `label` = consequence, `level` enum, `signal` = count string |
| Approval Queue | `id`, `kind`, `titleKey`, `subtitle`, `priority`, `href`, `readOnly` | `type` enum (from kind), `state` enum (from priority), `ageHours` (future) |
| Activity Timeline | `id`, `at`, `actorName?`, `action`, `entityType`, `entityId?`, `summary` | `at` formatted to local time |
| Previews (projects/skus/assets/reviews/deliveries) | `id`, `name`/`code`/`originalFilename`, `status`, `thumbnailKey`, `pendingCount`, `itemCount` | All display labels, status enums, tone |

**Risk and approval severity:** Backend sends `severity` as `"low" | "medium" | "high" | "critical"`. Frontend maps to `RiskLevel` enum. Backend owns the severity decision.

**Agent inspection feed:** Currently derived from `riskPulse` array (same data, different presentation). Future: separate AI-service read model when available.

**Freshness:** `generatedAt` is the single source of truth. Frontend displays it as the snapshot timestamp. Stale detection (>5 min since `generatedAt`) is possible but not yet implemented.

### 3.2 Asset Inbox (`/projects/:projectId/asset-inbox`)

**Decision: paginated, filterable per-project list.**

**Required fields per item:**

| Field | Required | Nullable | Notes |
|---|---|---|---|
| `assetId` | Yes | No | |
| `status` | Yes | No | One of `BackendAssetStatus` enum |
| `sku` | No | Yes | `undefined` when unbound |
| `shotRequirement` | No | Yes | `undefined` when unmatched |
| `file.originalFilename` | No | Yes | Empty for placeholder assets |
| `file.fileExt` | No | Yes | |
| `file.fileSizeBytes` | No | Yes | String to avoid JS integer overflow |
| `file.width` | No | Yes | |
| `file.height` | No | Yes | |
| `file.colorSpace` | No | Yes | |
| `keys.thumbnailKey` | No | Yes | Key only — frontend never resolves to URL |
| `keys.previewKey` | No | Yes | |
| `binding.status` | Yes | No | `"bound" | "unbound" | "ambiguous"` |
| `binding.matchStatus` | No | Yes | |
| `binding.confidence` | No | Yes | 0.0 – 1.0 |
| `binding.reason` | No | Yes | Code, not user text |
| `latestQc.status` | No | Yes | Absent when not yet QC'd |
| `latestQc.failedReasons` | No | Yes | Array of codes |
| `latestQc.notes` | No | Yes | Operator note string |

**Open questions answered:**

- **File metadata ownership:** All file metadata is backend-owned (extracted server-side during intake). Frontend never reads file headers client-side.
- **Duplicate representation:** Backend reports `binding.matchStatus: "ambiguous"` with `confidence` score. Frontend surfaces via tone + reason label.
- **Unbound/conflict/low-confidence states:** Each has a distinct `binding.status` value. View model uses `unboundCount` metric for at-a-glance risk.
- **Missing thumbnails:** `thumbnailKey` is absent; frontend renders a placeholder state (not implemented in current read-only phase — safe future addition).
- **Capture One source:** `intake.source` identifies the intake origin. `capture_one_placeholder` is current mock; `backend_upload_placeholder` reserved for future.

### 3.3 QC / Retouch (`/projects/:projectId/qc-retouch-queue`)

**Decision: paginated queue per project.**

**Required fields per item:**

| Field | Required | Nullable | Notes |
|---|---|---|---|
| `assetId` | Yes | No | |
| `assetVersionId` | No | Yes | Tracks which retouch version is being QC'd |
| `previewKey` | No | Yes | |
| `qc.latestStatus` | No | Yes | `"passed" | "failed" | "warning"` |
| `qc.failedReasons` | Yes | No | Empty array when no failures |
| `qc.technicalResults` | Yes | No | Map of check code → result |
| `qc.manualResults` | Yes | No | Map of check code → result |
| `qc.nextAction` | No | Yes | `"none" | "send_back_to_retouch" | "mark_for_reshoot"` |
| `retouch` | No | Yes | Entire object absent when not in retouch workflow |
| `retouch.taskId` | Yes (if retouch present) | No | |
| `retouch.status` | Yes (if retouch present) | No | |
| `retouch.assignedTo` | No | Yes | |
| `retouch.instructions` | No | Yes | |
| `retouch.complexity` | Yes (if retouch present) | No | `"low" | "normal" | "high"` |
| `retouch.dueAt` | No | Yes | |
| `retouch.revisionCount` | Yes (if retouch present) | No | |

**Open questions answered:**

- **Canonical QC status enum:** `BackendQcStatus = "passed" | "failed" | "warning"`. Multiple active QC checks per asset are not supported — `latestStatus` is authoritative.
- **Failure reason format:** Structured codes (`focus_left_edge`, `color_label_shift`, `shadow_balance_watch`, `sku_match_ambiguous`). Frontend maps to Chinese via `formatReason()`. Backend may add codes; frontend falls back to `formatStatus()` for unknown codes.
- **Reshoot vs retouch:** Encoded in `qc.nextAction`: `"send_back_to_retouch"` vs `"mark_for_reshoot"`.
- **Deadline/SLA ownership:** `retouch.dueAt` is backend-owned. Frontend displays only.

### 3.4 Review Gallery (`/review-sessions/:reviewSessionId/gallery`)

**Decision: full list per review session (no pagination — sessions are bounded).**

**Required fields per item:**

| Field | Required | Nullable | Notes |
|---|---|---|---|
| `reviewItemId` | Yes | No | |
| `assetId` | Yes | No | |
| `previewKey` | No | Yes | |
| `status` | Yes | No | `"pending" | "approved" | "revision_requested" | "withdrawn"` |
| `clientComment` | No | Yes | Client-provided text |
| `issueType` | No | Yes | Code when marked as issue |
| `reviewedAt` | No | Yes | |

**Open questions answered:**

- **Client feedback visibility:** All fields in the endpoint are internal-only for current read-only phase. `clientComment` and `issueType` may become client-facing in S5 after external access review. Backend must not include internal-only fields in the client-visible subset (future).
- **Pagination:** Not needed. Review sessions contain at most ~50 items.
- **Safe fields for clients:** Not yet defined — S5 external access contract will define the client-safe subset.
- **Expired/revoked sessions:** `status: "closed"` with `expiresAt` in the past. Frontend displays calm closed state.
- **Approval granularity:** Per review item (`reviewItemId` × `status`), not per session.

### 3.5 Delivery Readiness (`/deliveries/:deliveryId/readiness`)

**Decision: single delivery package view (no pagination).**

**Required fields:**

| Field | Required | Nullable | Notes |
|---|---|---|---|
| `deliveryId` | Yes | No | |
| `status` | Yes | No | `"preparing" | "ready" | "delivered" | "expired" | "failed" | "canceled"` |
| `packageKey` | No | Yes | Key only — frontend never resolves to URL |
| `manifestKey` | No | Yes | |
| `expiresAt` | No | Yes | |
| `itemCount` | Yes | No | |
| `checklist.*` | Yes | No | Four boolean keys |
| `blockers[]` | Yes | No | Empty array when clear |
| `blockers[].code` | Yes | No | Machine-readable code |
| `blockers[].message` | Yes | No | Human-readable (but still a code — mapped by frontend) |

**Open questions answered:**

- **Canonical delivery status enum:** `BackendDeliveryStatus` as above.
- **Output artifact access:** `packageKey` and `manifestKey` are opaque keys. Frontend never constructs storage URLs. Download stays disabled until S4.
- **Package completeness:** `checklist.*` booleans define completeness. `allItemsHaveFileKey` gates final delivery.
- **Publication blockers:** `blockers[]` array. Empty = ready. Non-empty = each entry explains one blocking condition.
- **Confirmation:** Currently internal operator views only. Recipient confirmation is an S5 concern.

---

## 4. State Semantics

All five surfaces share the same state model implemented in `useBackendReadModel.ts`:

| State | Trigger | Frontend behavior | Recovery |
|---|---|---|---|
| `loading` | Fetch in progress | Calm loading UI, no layout jump | Auto-resolves on response |
| `ready` | 200 with data | Normal workspace rendering | n/a |
| `empty` | 200 with 0 items / empty list | Clear empty explanation, next safe action | Future: add create/take-action link |
| `partial` | 200 with incomplete fields | Show available data, mark missing sections | Data completion depends on backend |
| `stale` | `generatedAt` > threshold | Stale warning with available read-only data | Re-fetch |
| `error` | Network failure or 500 | Recoverable error state, retry available | Retry button |
| `missing-config` | No `VITE_BACKEND_API_BASE_URL` | Fall back to mock data ("本地模拟") | Configure env var |
| `forbidden` | 403 response | Clear permission state, no data leak | Requires auth/role resolution |
| `invalid-id` | 404 response | Clear invalid context state | Correct the ID |

Empty vs partial distinction:
- **Empty:** response succeeds, `items` is `[]`, `total` is `0`. Valid but nothing to show.
- **Partial:** response succeeds, some items have `undefined` optional fields or missing sub-objects. Data is present but incomplete.

Stale detection: read-model pages compare optional `generatedAt` to current time
with a 5-minute threshold and show a `数据可能已过期` notice when exceeded.

---

## 5. Backend Versioning Strategy

For the read-only mock-first phase:

- **No API version header or path segment required.** The current read-model paths (`/command-center/v2`, `/projects/:id/asset-inbox`, etc.) are considered v1 of the read contract.
- **Backward compatibility:** Additive field changes (new optional fields) must not break the frontend. Frontend tolerates unknown fields.
- **Breaking changes:** Field removal or type change requires a new path (e.g. `/command-center/v3`) and a deprecation notice period.
- **Deprecation notice:** Backend should notify frontend team at least one sprint before removing fields or changing types.
- **Fixture update process:** When backend examples change, update `src/mocks/commandCenter.mock.ts` and `src/features/read-models/readModelMocks.ts` to match, then re-run `scripts/qa-readonly-all.ps1`.
- **QA fixture IDs:** `PRJ-128`, `REV-441`, `DEL-220` are canonical and shared across all QA scripts via `scripts/qa-readonly-fixtures.ps1`.

---

## 6. Verification Evidence

| Check | Evidence |
|---|---|
| Mock fixtures aligned | `readModelMocks.ts` uses `BackendAssetInbox`, `BackendQcRetouchQueue`, `BackendReviewGallery`, `BackendDeliveryReadiness` types |
| View models are derivation-only | `readModelViewModels.ts` functions take backend types, return `ReadModelViewModel` — no mutation of source |
| All 8 boundary states handled | `useBackendReadModel.ts` status union: `loading | idle | ready | empty | partial | stale | forbidden | invalid-id | error | missing-config` |
| No write behavior | All API calls in `backendReadModels.ts` are `fetch()` GET only. All action buttons disabled with `aria-disabled` |
| No production auth | `x-user-role` and `x-user-name` headers are frontend-only hints, not auth tokens |
| No upload/download | UI placeholders labeled "上传未启用" / "下载未启用" |
| No public links | `publicAccess.enabled: false` and `externalAccess.enabled: false` in all mock data |
| QA fixture IDs stable | `PRJ-128`, `REV-441`, `DEL-220` shared across all QA scripts |
| Browser QA green | `scripts/qa-readonly-all.ps1` passes in mock-first mode |

---

## 7. S1 Exit Gates

- [x] Read-model response shapes frozen for all 5 surfaces
- [x] Required / optional / nullable / derived fields documented per surface
- [x] State semantics defined (loading, empty, partial, stale, error, missing-config, forbidden, invalid-id)
- [x] Stable ID conventions documented
- [x] Backend versioning strategy defined
- [x] Timezone policy defined
- [x] Pagination / list limits defined
- [x] Mock fixtures aligned with frozen contract
- [x] View models strictly derive display context
- [x] QA fixture IDs valid and shared
- [x] No write behavior introduced
- [x] No production auth introduced
- [x] No upload/download introduced
- [x] No public review/delivery links introduced
