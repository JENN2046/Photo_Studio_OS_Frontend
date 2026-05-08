# Frontend v2 Review / Delivery External Access Design

Date: 2026-05-08
Repo: `A:\Photo_Studio_OS_Frontend`
Related roadmap stage: `S5 Review / Delivery External Flows`

This document defines public-facing review and delivery access behavior for Frontend v2. It is a design document only. It does not implement public links, external routes, or client-facing access.

## Design Principles

1. Public links use scoped, time-limited tokens. No guessable URLs.
2. Every public link has an expiry. No permanent external access.
3. Links can be revoked at any time by operators.
4. External pages must not expose internal operator data.
5. All external access is audit-logged.
6. Rate limiting and abuse controls on all public endpoints.
7. Frontend shows external access posture but does not construct links from secrets.

## Internal vs External Page Separation

| Surface | Internal operator page | External client page | Shared |
|---|---|---|---|
| Command Center | `#` (full cockpit) | None | None |
| Asset Inbox | `#asset-inbox` (full workspace) | None | None |
| QC / Retouch | `#qc-retouch` (full queue) | None | None |
| Review Gallery | `#review-gallery` (internal preview) | `/review/:token` (client view) | Asset display component |
| Delivery Readiness | `#delivery-readiness` (internal outbox) | `/delivery/:token` (recipient view) | Manifest display component |

External pages are separate routes with restricted data visibility. They must never render the Command Center shell, left rail, runtime chips, or internal navigation.

## Public Review Link Contract

### Token Model

```typescript
interface ReviewSessionToken {
  token: string;           // opaque, non-sequential, min 128 bits entropy
  reviewSessionId: string;
  expiresAt: string;       // ISO 8601
  revokedAt?: string;      // ISO 8601, set on revocation
  scope: "review";         // scope-limited to this session
  maxViews?: number;       // optional view limit
  viewCount: number;       // current view count
}
```

### External Review Page

Route: `/review/:token`

Visible to client:
- Review session title and studio name.
- Asset grid with approved/revision-requested status.
- Selected asset preview (watermarked if policy requires).
- Per-item approval or revision-request action.
- Optional client comment field.
- Session expiry countdown.

Not visible to client:
- Asset IDs, SKU codes, file metadata, internal file paths.
- QC results, retouch status, binding information.
- Other client review sessions.
- Operator identity or internal notes.
- Runtime chips, Command Center navigation.

### Review Token Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/review-sessions/:id/token` | `POST` | Create/recreate a review token (operator only) |
| `/review-sessions/:id/token` | `DELETE` | Revoke a review token (operator only) |
| `/review/:token` | `GET` | Fetch review session data for token (public) |

### Review Token States

| State | Trigger | Client sees |
|---|---|---|
| Active | Token valid, not expired, not revoked | Review gallery with allowed content |
| Expired | `expiresAt` passed | `审核链接已过期。请联系工作室获取新链接。` |
| Revoked | Operator revoked token | `审核链接已被撤销。如需继续审核请联系工作室。` |
| View Limit Reached | `viewCount >= maxViews` | `审核链接已达到最大查看次数。` |
| Not Found | Invalid token | `审核链接无效。请检查链接是否完整。` |

### Client Review Actions

| Action | Method | Path | Audit event |
|---|---|---|---|
| Approve item | `POST` | `/review/:token/items/:id/approve` | `review.item.approved` |
| Request revision | `POST` | `/review/:token/items/:id/revision` | `review.item.revision_requested` |
| Add comment | `POST` | `/review/:token/items/:id/comment` | `review.item.commented` |

All actions are scope-limited to the token's `reviewSessionId`. Backend enforces token validity, expiry, and revocation before processing.

## Public Delivery Link Contract

### Token Model

```typescript
interface DeliveryToken {
  token: string;           // opaque, non-sequential, min 128 bits entropy
  deliveryId: string;
  expiresAt: string;
  revokedAt?: string;
  scope: "delivery";
  maxDownloads?: number;
  downloadCount: number;
}
```

### External Delivery Page

Route: `/delivery/:token`

Visible to recipient:
- Studio name and delivery package title.
- Manifest summary (item count, file types).
- Download button per artifact.
- Delivery expiry countdown.
- Usage notes from operator.

Not visible to recipient:
- Internal delivery IDs, project context.
- Blockers or readiness checklist.
- Other delivery packages.
- Operator identity.
- Runtime chips, Command Center navigation.

### Delivery Token Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/deliveries/:id/token` | `POST` | Create/recreate a delivery token (operator only) |
| `/deliveries/:id/token` | `DELETE` | Revoke a delivery token (operator only) |
| `/delivery/:token` | `GET` | Fetch delivery package data for token (public) |

### Delivery Token States

| State | Trigger | Recipient sees |
|---|---|---|
| Active | Token valid, not expired, not revoked | Delivery page with manifest and downloads |
| Expired | `expiresAt` passed | `交付链接已过期。请联系工作室获取新链接。` |
| Revoked | Operator revoked token | `交付链接已被撤销。如需继续下载请联系工作室。` |
| Download Limit Reached | `downloadCount >= maxDownloads` | `已达到最大下载次数。` |
| Already Confirmed | Recipient confirmed delivery | `交付已确认。感谢您的工作。` |
| Not Found | Invalid token | `交付链接无效。请检查链接是否完整。` |

## Security Requirements

| Requirement | Implementation |
|---|---|
| Token entropy | Minimum 128 bits, generated by backend CSPRNG |
| Token scope | Each token is scoped to exactly one session or one delivery |
| Expiry | Enforced server-side. Frontend shows countdown. |
| Revocation | Immediate server-side. Frontend checks on every navigation. |
| Rate limiting | Per-token: 60 requests/minute. Per-IP: 120 requests/minute. |
| Abuse handling | 429 response with `Retry-After` header. Repeat offenders blocked for 15 minutes. |
| Audit | Every view, feedback, approval, download, and confirmation is logged with token, timestamp, IP, and user agent. |
| No internal data leak | Backend strips internal fields before returning public-facing responses. |

## Frontend External Page Architecture

External pages use a separate lightweight shell:

```
/review/:token → ReviewExternalPage
  → usePublicReview(token)
    → fetch /review/:token
      → ReviewExternalWorkspace (stripped-down version of ReviewGalleryWorkspace)

/delivery/:token → DeliveryExternalPage
  → usePublicDelivery(token)
    → fetch /delivery/:token
      → DeliveryExternalWorkspace (stripped-down version of DeliveryReadinessWorkspace)
```

The external shell has:
- Studio branding only (logo, name).
- No left rail, no Command Center navigation.
- No runtime chips.
- Calm loading, error, expired, and revoked states.
- Responsive layout for desktop and mobile clients.

## Stop Gates

Do not implement the following without explicit approval:

- Public review links (`/review/:token` route).
- Public delivery links (`/delivery/:token` route).
- Token creation or revocation UI.
- Client-facing pages with any internal data.
- External routes accessible without token validation.
- Mock tokens that look like real tokens.

## Implementation Sequence

When S5 is approved:

1. Define token types and public response types in `src/api/types.ts`.
2. Add `fetchPublicReview(token)` and `fetchPublicDelivery(token)` placeholder fetchers.
3. Build `ReviewExternalPage` with stripped-down workspace.
4. Build `DeliveryExternalPage` with stripped-down workspace.
5. Add operator-facing token management UI (create/revoke) in internal pages.
6. Run lint, build, validate-local, browser QA for both internal and external routes.
7. Security review on token model and public data exposure before any public access.

## Reference

- Roadmap: `docs/design/FRONTEND_V2_PRODUCTION_ROADMAP.md` — S5 Review / Delivery External Flows
- Risk register: `docs/design/FRONTEND_V2_RISK_REGISTER.md` — R08, R09, R20
- Review checklist: `docs/design/FRONTEND_V2_PRODUCTION_REVIEW_CHECKLIST.md` — Review / Delivery External Access Gate
