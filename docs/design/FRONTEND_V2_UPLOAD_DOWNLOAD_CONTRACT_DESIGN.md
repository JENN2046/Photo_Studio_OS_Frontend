# Frontend v2 Upload / Download Contract Design

Date: 2026-05-08
Repo: `A:\Photo_Studio_OS_Frontend`
Related roadmap stage: `S4 Upload / Download Foundation`

This document defines the upload and download contract requirements for Frontend v2. It is a design document only. It does not implement file movement, connect to storage providers, or contain credentials.

## Design Principles

1. Frontend never constructs raw storage URLs from secrets.
2. All upload/download goes through backend signing endpoints.
3. Server-side permission checks on every file operation.
4. Malware/content scan before any file is made available.
5. Audit events for every upload and download.
6. Frontend shows progress, retry, expiry, and failure states without handling raw files.

## Upload Contract

### Asset Ingest Workflow

```
Capture One Export Directory
  → Operator selects files in Asset Inbox
    → Frontend requests upload signing URL from backend
      → Backend returns signed upload URL + file constraints
        → Frontend uploads to signed URL with progress tracking
          → Backend receives file, runs scan
            → Backend creates asset record, returns asset metadata
              → Frontend shows asset in inbox with binding status
```

### Upload Signing Endpoint

| Field | Value |
|---|---|
| Method | `POST` |
| Path | `/uploads/sign` |
| Auth required | Yes (operator or admin) |
| Request body | `{ fileName: string, fileSizeBytes: number, mimeType: string, projectId: string }` |
| Success response | `{ uploadUrl: string, uploadId: string, expiresAt: string, constraints: UploadConstraints }` |
| Error responses | `400` (invalid file type/size), `401` (no auth), `403` (insufficient role), `413` (too large), `429` (rate limit) |

### Upload Constraints

```typescript
interface UploadConstraints {
  maxFileSizeBytes: number;         // e.g. 200 * 1024 * 1024
  allowedMimeTypes: string[];       // e.g. ["image/x-canon-cr3", "image/x-canon-cr2", "image/tiff"]
  allowedExtensions: string[];      // e.g. [".CR3", ".CR2", ".TIFF", ".TIF"]
  maxFilesPerBatch: number;         // e.g. 50
  uploadUrlExpiresInSeconds: number; // e.g. 3600
}
```

### Upload Frontend States

| State | UI | User action |
|---|---|---|
| Idle | Disabled upload button with posture label `上传未启用` | N/A |
| Selecting | File picker open; drag-drop zone active | Choose files |
| Validating | File type/size check against constraints | Wait |
| Validation Failed | Red badge on rejected files; reason per file | Remove or replace |
| Signing | Requesting upload URL from backend | Wait |
| Signing Failed | Error notice with retry | Retry or cancel |
| Uploading | Per-file progress bar with percentage and speed | Cancel individual files |
| Upload Paused | Paused indicator; resume button | Resume or cancel |
| Upload Failed | Error notice per file; retry available | Retry or remove |
| Scanning | Backend scan in progress; `扫描中` status | Wait |
| Scan Failed | File rejected; reason from backend | Remove file |
| Complete | Asset appears in inbox grid; binding status visible | Continue to QC/binding |

### Upload Retry Strategy

- Retryable errors: network timeout, 429 (rate limit), 503 (temporary unavailable).
- Non-retryable errors: 400 (validation), 401 (auth), 403 (permission), 413 (too large).
- Maximum 3 retries per file with exponential backoff (1s, 4s, 16s).
- Failed files remain in the upload list with error reason until operator removes them.

## Download Contract

### Delivery Download Workflow

```
Operator or recipient opens Delivery Readiness
  → Delivery status is `ready`
    → Frontend requests download signing URL from backend
      → Backend verifies permission, package state, expiry
        → Backend returns signed download URL with expiry
          → Frontend presents download button
            → User clicks download
              → Download starts via signed URL
                → Backend logs audit event
```

### Download Signing Endpoint

| Field | Value |
|---|---|
| Method | `POST` |
| Path | `/downloads/sign` |
| Auth required | Yes (operator, admin, or authorized delivery recipient) |
| Request body | `{ deliveryId: string, artifactKey: string }` |
| Success response | `{ downloadUrl: string, expiresAt: string, fileName: string, fileSizeBytes: number }` |
| Error responses | `400` (invalid delivery/artifact), `401` (no auth), `403` (not authorized for this delivery), `404` (package not found), `409` (package not ready), `410` (expired) |

### Download Frontend States

| State | UI | User action |
|---|---|---|
| Not Ready | Disabled download button; blocker list visible | Resolve blockers |
| Ready | Enabled download button with file size and type | Click to download |
| Signing | Loading state on download button | Wait |
| Signing Failed | Error notice with reason | Retry |
| Downloading | Browser-native download progress | Wait or cancel |
| Expired | `下载链接已过期` notice | Request new link |
| Revoked | `下载链接已被撤销` notice | Contact admin |

### Download Audit Events

Each download must produce an audit event with:

- `deliveryId`
- `downloadedBy` (operator or recipient identity)
- `downloadedAt` (timestamp)
- `ipAddress`
- `userAgent`
- `artifactKey`
- `fileSizeBytes`

## Storage Provider Requirements

| Requirement | Description |
|---|---|
| Signed URLs | All upload and download must use time-limited signed URLs. |
| URL expiry | Upload URLs: 1 hour. Download URLs: 24 hours or until delivery expiry. |
| Content scan | All uploaded files must be scanned for malware before asset record creation. |
| Content policy | Reject files that fail scan. Notify operator with sanitized reason. |
| Retention | Files retained per project lifecycle policy. |
| Deletion | Deletion requires separate approval. Not in upload/download scope. |
| Quota | Per-project upload quota. Warn at 80%. Block at 100%. |
| Region | Storage region must comply with studio data policy. |

## Frontend Constraints

The frontend must never:

- Construct raw storage URLs (e.g., S3 bucket URLs, CDN paths).
- Store storage provider credentials.
- Bypass the signing endpoint.
- Cache signed URLs longer than their expiry.
- Expose signed URLs in console logs or error messages.
- Implement direct-to-storage upload without backend signing.
- Show un-scanned files to any user.

## Stop Gates

Do not implement the following without explicit approval:

- Real file upload.
- Real file download.
- Storage provider credentials in code or config.
- Raw storage URLs.
- Direct-to-storage upload.
- Upload/download without backend signing endpoints.
- File scan bypass.

## Implementation Sequence

When S4 is approved:

1. Define `UploadConstraints` and `DownloadSigning` types in `src/api/types.ts`.
2. Add `uploadSigning()` and `downloadSigning()` placeholder fetchers in `src/api/backendReadModels.ts` (returning mock responses).
3. Add upload progress UI component (file picker, progress bars, validation display).
4. Add download state UI (ready/signing/downloading/expired/revoked).
5. Keep all upload/download behind a feature flag until backend signing endpoints exist.
6. Run lint, build, validate-local, browser QA.
7. Do NOT connect to real storage until backend signing, scan, audit, quota, and retention are approved.

## Reference

- Roadmap: `docs/design/FRONTEND_V2_PRODUCTION_ROADMAP.md` — S4 Upload / Download Foundation
- Risk register: `docs/design/FRONTEND_V2_RISK_REGISTER.md` — R06, R07
- Review checklist: `docs/design/FRONTEND_V2_PRODUCTION_REVIEW_CHECKLIST.md` — Upload / Download Gate
