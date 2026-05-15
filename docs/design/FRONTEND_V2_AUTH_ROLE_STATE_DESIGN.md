# Frontend v2 Auth / Role State Design

Date: 2026-05-08
Repo: `A:\Photo_Studio_OS_Frontend`
Related roadmap stage: `S3 Auth And Role Readiness`

This document defines the role matrix, session state machine, page-role visibility mapping, and auth state UI for Frontend v2. It is a design document only. It does not implement production auth, store tokens, or connect to an auth provider.

## Design Principles

1. Frontend reflects auth state; backend owns authorization.
2. No token storage, no session mutation from frontend.
3. Role gates are display-only until backend auth is approved.
4. Signed-out, expired, and forbidden states must be calm and recoverable.
5. Mock role rehearsal must be clearly marked as mock.
6. Chinese-first copy for all auth-state UI.

## Role Matrix

| Role | Identifier | Description | Primary surfaces |
|---|---|---|---|
| Admin / Owner | `admin` | Full read access to all read-only surfaces. Future: manage users, configure studio. | All |
| Studio Operator | `operator` | Day-to-day production oversight. Owns project execution, risk, approvals. | Command Center, all read-model pages |
| Photographer | `photographer` | Capture One export, asset intake, shot requirement binding. | Asset Inbox, limited Command Center |
| Retoucher | `retoucher` | Retouch task queue, revision tracking, reference assets. | QC / Retouch, Asset Inbox |
| QC Reviewer | `qc_reviewer` | QC checks, failure reasons, technical/manual inspection. | QC / Retouch, Asset Inbox |
| Client Reviewer | `client` | Review gallery, feedback, approval decisions. | Review Gallery (future: client-facing) |
| Delivery Approver | `delivery_approver` | Delivery readiness, package manifest, release approval. | Delivery Readiness |

## Session State Machine

```
                   ┌──────────┐
                   │  NO_AUTH │  (no session token present)
                   └────┬─────┘
                        │ loadSession()
                   ┌────▼─────┐
                   │ LOADING   │  (fetching session from auth provider)
                   └────┬─────┘
                        │
              ┌─────────┼──────────┐
              │         │          │
         ┌────▼──┐ ┌───▼────┐ ┌───▼──────┐
         │SIGNED │ │EXPIRED │ │  ERROR    │
         │  _IN  │ │        │ │           │
         └───┬───┘ └────────┘ └───────────┘
             │
    ┌────────┼────────┐
    │        │        │
┌───▼──┐ ┌──▼───┐ ┌──▼──────────┐
│FULL  │ │PARTIAL│ │FORBIDDEN    │
│ACCESS│ │ACCESS │ │(no matching  │
│      │ │       │ │ role for page)│
└──────┘ └───────┘ └──────────────┘
```

### State Definitions

| State | Trigger | UI behavior | Recovery |
|---|---|---|---|
| No Auth | No session token | Show sign-in prompt. Hide all production data. | Redirect to sign-in. |
| Loading | Session fetch in progress | Calm loading state. No layout jump. No fake data. | Wait for response. |
| Signed In | Valid session, role claims present | Render role-gated surfaces. Runtime chips show auth source. | N/A |
| Expired | Token expiry | Show expired-session notice. Keep current page layout. Offer re-auth. | Re-authenticate via auth provider. |
| Error | Auth provider unreachable | Show error state. No data leak. Offer retry. | Retry or fall back to mock. |
| Forbidden | Valid session, no matching role for page | Show forbidden notice. Hide page content. Offer navigation to allowed surfaces. | Navigate to allowed page or sign out. |
| Insufficient Role | Valid session, partial role match | Render allowed sections. Visually disable forbidden sections. Show role-explanation tooltip. | View read-only content for allowed sections. |

## Page-Role Visibility Matrix

| Surface | Admin | Operator | Photographer | Retoucher | QC Reviewer | Client | Delivery Approver |
|---|---|---|---|---|---|---|---|
| Command Center `#` | Full | Full | Summary-only | Summary-only | Summary-only | - | Summary-only |
| Risk `#risk` | Full | Full | Read | Read | Read | - | Read |
| Projects `#projects` | Full | Full | Read | Read | Read | - | Read |
| Approvals `#approvals` | Full | Full | - | - | - | - | Read |
| Activity `#activity` | Full | Full | Read | Read | Read | - | Read |
| Inspections `#inspections` | Full | Full | - | - | Read | - | - |
| Asset Inbox `#asset-inbox` | Full | Full | Full | Read | Read | - | - |
| QC / Retouch `#qc-retouch` | Full | Full | Read | Full | Full | - | - |
| Review Gallery `#review-gallery` | Full | Full | - | Read | Read | Full | Read |
| Delivery Readiness `#delivery-readiness` | Full | Full | - | - | - | - | Full |

Key:
- `Full` — All visible content, selection, and navigation.
- `Read` — View content; write actions remain disabled (read-only posture).
- `Summary-only` — Gauge cluster and summary cards only; no detail drill-down.
- `-` — Page not accessible; navigation entry hidden or disabled.

## Auth State UI Components

### Signed-out State

```
┌──────────────────────────────────────────────────┐
│                                                  │
│              Photo Studio OS                     │
│                                                  │
│          请登录以访问命令中心。                      │
│                                                  │
│          [登录]  (disabled placeholder)           │
│                                                  │
│     当前阶段：前端只读驾驶舱，不启用生产认证。         │
│                                                  │
└──────────────────────────────────────────────────┘
```

Copy: `请登录以访问命令中心。`
Status label: `未登录`
Boundary: `mock-first / read-only`

### Expired Session State

```
┌──────────────────────────────────────────────────┐
│                                                  │
│              会话已过期                            │
│                                                  │
│     您的登录会话已过期。请重新认证以继续操作。         │
│                                                  │
│          [重新登录]  (disabled placeholder)        │
│                                                  │
│     状态 / 会话过期 · mock-first / read-only        │
│                                                  │
└──────────────────────────────────────────────────┘
```

Copy: `会话已过期。请重新认证以继续操作。`
Status label: `会话过期`
Recovery: `重新登录` button (disabled placeholder)

### Forbidden State (per-page)

```
┌──────────────────────────────────────────────────┐
│                                                  │
│              无权访问该页面                         │
│                                                  │
│     您当前的角色无权查看此页面内容。                  │
│     如需访问请切换账号或联系管理员。                  │
│                                                  │
│           [返回命令中心]                           │
│                                                  │
│     当前角色 / 摄影师 · 所需角色 / 管理员或运营       │
│                                                  │
└──────────────────────────────────────────────────┘
```

Copy: `您当前的角色无权查看此页面内容。`
Status label: `权限不足`
Recovery: `返回命令中心` navigation link

### Insufficient-role State (partial page)

When a user has partial access (e.g., Retoucher on Asset Inbox = Read):

- Allowed sections render normally.
- Forbidden sections show a muted overlay with role-explanation.
- Disabled actions show tooltip: `需要 [角色] 权限方可操作。当前角色：[当前角色]。`

Copy: `此区域需要更高权限才能操作。`
Tooltip: `需要 {{requiredRole}} 权限方可操作。当前角色：{{currentRole}}。`

## Runtime Chip Extensions

When auth is active, add to the runtime chip bar:

| Chip label | Value example | Meaning |
|---|---|---|
| 认证源 | `本地模拟` / `后端认证` | Auth provider status |
| 会话 | `已登录` / `未登录` / `已过期` | Session state |
| 角色 | `运营` / `摄影师` / `精修师` | Current role |
| 权限 | `完全` / `受限` / `禁止` | Permission posture for current page |

These chips must never expose token values, user IDs, or internal auth metadata.

## Mock Role Rehearsal

For DEV-only rehearsal before real auth:

```powershell
$env:VITE_BACKEND_USER_ROLE = "photographer"
```

This sets the `x-user-role` request header (already implemented). The frontend may also read this env var to simulate role-gated UI without a real auth provider.

Add a DEV-only query param for UI rehearsal:

```
?authState=signed-out
?authState=expired
?authState=forbidden
?authState=insufficient-role
?authState=loading
```

These rehearse the auth state UI components defined above. They are gated behind `import.meta.env.DEV`.

## Page-Role Enforcement Flow

```
URL hash → identify page
  → check session state
    → signed-out: render signed-out state
    → expired: render expired state
    → signed-in: check role matrix
      → role matches page: render page with role-gated sections
      → role insufficient: render partial page
      → role forbidden: render forbidden state
```

Frontend enforcement is presentation-only. Backend must independently enforce permissions on every read/write endpoint.

## Stop Gates

Do not implement the following without explicit approval:

- Real auth provider integration (OAuth, SSO, JWT validation).
- Token storage (localStorage, sessionStorage, cookies for auth).
- Session mutation (login, logout, refresh from frontend).
- Production auth URLs or client secrets.
- Real user identity in mock data.
- Auth-gated navigation that replaces backend enforcement.

## Implementation Sequence

When S3 is approved:

1. Add `AuthState` type and `useAuthState` hook (mock-first).
2. Add auth state UI components (signed-out, expired, forbidden, insufficient-role).
3. Add role matrix to a shared config.
4. Add `?authState=` DEV debug rehearsal.
5. Wire page components to check auth state before rendering.
6. Update runtime chips with auth posture.
7. Run lint, build, validate-local, browser QA.
8. Do NOT connect to real auth provider until explicitly approved.

## Current Frontend Status

- Steps 1-6 are implemented as mock-first, display-only frontend readiness.
- Runtime chips now expose role-derived access labels: `完全`, `只读`, `摘要`, and `无权`.
- `scripts\qa-readonly-auth-states.ps1` covers signed-out, expired, loading,
  error, forbidden, full access, read-only partial access, summary-only partial
  access, and no-access role paths at tablet and mobile widths.
- `scripts\qa-readonly-auth-live-roles.ps1` starts temporary local Vite servers
  with `VITE_BACKEND_USER_ROLE` set only in child process environments and
  verifies representative non-debug role paths without editing `.env`.
- Real auth provider integration, token handling, and backend authorization
  enforcement remain unimplemented and require separate approval.

## Reference

- Roadmap: `docs/design/FRONTEND_V2_PRODUCTION_ROADMAP.md` — S3 Auth And Role Readiness
- Contract review: `docs/design/FRONTEND_V2_CONTRACT_REVIEW.md` — State Review Matrix
- Risk register: `docs/design/FRONTEND_V2_RISK_REGISTER.md` — R04, R05
- Review checklist: `docs/design/FRONTEND_V2_PRODUCTION_REVIEW_CHECKLIST.md` — Auth / Role Gate
