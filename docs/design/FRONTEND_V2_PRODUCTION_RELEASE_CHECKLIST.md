# Frontend v2 Production Release Checklist

Date: 2026-05-08
Repo: `A:\Photo_Studio_OS_Frontend`
Related roadmap stage: `S7 Production QA And Release`

This checklist gates production release for Frontend v2. Every item must pass before cutover. It converts the staged roadmap into a repeatable release procedure.

## Release Header

| Item | Value |
|---|---|
| Release version | |
| Release date | |
| Release manager | |
| Frontend commit | |
| Backend version | |
| Staging environment | |
| Production environment | |
| Rollback plan owner | |

## Pre-flight Validation

Run in a clean checkout on the release commit:

```powershell
npm ci
npm run lint
npm run build
powershell -ExecutionPolicy Bypass -File scripts\validate-local.ps1
powershell -ExecutionPolicy Bypass -File scripts\qa-package-boundary.ps1
powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-source-boundary.ps1
powershell -ExecutionPolicy Bypass -File scripts\qa-backend-read-contract-map.ps1
powershell -ExecutionPolicy Bypass -File scripts\qa-auth-role-matrix.ps1
powershell -ExecutionPolicy Bypass -File scripts\qa-auth-provider-preflight.ps1
powershell -ExecutionPolicy Bypass -File scripts\qa-internal-pilot-manifest.ps1
powershell -ExecutionPolicy Bypass -File scripts\qa-internal-pilot-goal-audit.ps1
powershell -ExecutionPolicy Bypass -File scripts\qa-release-boundary-docs.ps1
powershell -ExecutionPolicy Bypass -File scripts\qa-backend-read-signoff-guards.ps1
powershell -ExecutionPolicy Bypass -File scripts\qa-backend-read-all.ps1
powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-auth-live-roles.ps1
powershell -ExecutionPolicy Bypass -File scripts\qa-internal-pilot-readiness.ps1
```

When an approved local/staging backend is in scope, run the aggregate with the
approved URL instead of relying only on the default local mock-backend path:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-internal-pilot-readiness.ps1 -ApprovedBackendEnvironment local -ApprovedBackendBaseUrl http://127.0.0.1:8080
```

| Check | Status |
|---|---|
| `npm ci` completes without errors | |
| `npm run lint` passes | |
| `npm run build` passes | |
| `validate-local.ps1` passes (including secret scan) | |
| `qa-package-boundary.ps1` passes minimal dependency boundary checks | |
| `qa-readonly-source-boundary.ps1` passes | |
| `qa-backend-read-contract-map.ps1` passes fetcher/smoke/mock/docs contract-map checks | |
| `qa-auth-role-matrix.ps1` passes 7-role / 10-route static matrix checks | |
| `qa-auth-provider-preflight.ps1` passes provider/session/role-claim preflight checks | |
| `qa-internal-pilot-manifest.ps1` passes source/script/doc evidence checks | |
| `qa-internal-pilot-goal-audit.ps1` passes local-candidate/external-blocker guard checks | |
| `qa-release-boundary-docs.ps1` passes signoff/release boundary checks | |
| `qa-backend-read-signoff-guards.ps1` passes unsafe backend URL rejection and expected failure-state option checks | |
| `qa-backend-read-all.ps1` passes connected, 403, 404, and failure local backend read smoke | |
| `qa-backend-read-signoff.ps1` passes with an approved local/staging backend URL, including explicit expected 403 / 404 states when backend signoff is in scope | |
| `qa-readonly-auth-live-roles.ps1` passes representative `VITE_BACKEND_USER_ROLE` paths | |
| `qa-internal-pilot-readiness.ps1` passes on a machine with no pre-existing Vite server | |

## Browser QA Matrix

Start the dev server and run the full QA suite:

```powershell
npm run dev
powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-all.ps1
```

### Route Matrix (16 routes × 3 viewports)

| Route | 1440x960 | 1024x768 | 390x844 |
|---|---|---|---|
| `#` (Command Center) | | | |
| `#?commandCenterState=loading` | | | |
| `#?commandCenterState=error` | | | |
| `#?commandCenterState=forbidden` | | | |
| `#?commandCenterState=invalid-id` | | | |
| `#?commandCenterState=invalid` | | | |
| `#risk` | | | |
| `#projects` | | | |
| `#approvals` | | | |
| `#activity` | | | |
| `#inspections` | | | |
| `#asset-inbox?projectId=PRJ-128&reviewSessionId=REV-441&deliveryId=DEL-220` | | | |
| `#asset-inbox?projectId=PRJ-128&readModelState=invalid-state` | | | |
| `#qc-retouch?projectId=PRJ-128&reviewSessionId=REV-441&deliveryId=DEL-220` | | | |
| `#review-gallery?reviewSessionId=REV-441&projectId=PRJ-128&deliveryId=DEL-220` | | | |
| `#delivery-readiness?deliveryId=DEL-220&projectId=PRJ-128&reviewSessionId=REV-441` | | | |

### Boundary State Matrix (4 pages × 9 states × 2 viewports)

| Page | empty | partial | stale | forbidden | invalid-id |
|---|---|---|---|---|---|
| Asset Inbox (1024) | | | | | |
| Asset Inbox (390) | | | | | |
| QC / Retouch (1024) | | | | | |
| QC / Retouch (390) | | | | | |
| Review Gallery (1024) | | | | | |
| Review Gallery (390) | | | | | |
| Delivery Readiness (1024) | | | | | |
| Delivery Readiness (390) | | | | | |

Trigger via `readModelState=` query param. Loading, error, missing-config, empty,
partial, stale, forbidden, invalid-id, and missing-id idle states are covered by
`scripts\qa-readonly-boundary-states.ps1`.

### Auth State Matrix (10 cases × 2 viewports)

| Case | 1024x768 | 390x844 |
|---|---|---|
| signed-out (未登录) | | |
| expired (会话过期) | | |
| loading (认证中) | | |
| error (认证故障) | | |
| forbidden (权限不足) | | |
| signed-in with content (已登录) | | |
| photographer summary-only partial access | | |
| retoucher read-only partial access | | |
| photographer no-access forbidden route | | |
| delivery approver full delivery access | | |

Trigger via `?authState=` / `?authRole=` query params on Command Center and
read-model pages. Covered by `scripts\qa-readonly-auth-states.ps1`.

### Live Env Role Matrix (5 roles × 2 viewports)

Run with no existing dev server. The script starts temporary local Vite child
processes and sets `VITE_BACKEND_USER_ROLE` without editing `.env`.

```powershell
powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-auth-live-roles.ps1
```

| Role path | 1024x768 | 390x844 |
|---|---|---|
| operator full Asset Inbox access | | |
| photographer summary Command Center access | | |
| retoucher read-only Asset Inbox access | | |
| delivery approver full Delivery Readiness access | | |
| client no-access Delivery Readiness gate | | |

### Interaction Matrix (6 checks × 3 viewports)

| Check | 1440x960 | 1024x768 | 390x844 |
|---|---|---|---|
| Read-model tab navigation | | | |
| Command Center 黄金链路 entry clicks | | | |
| Asset Inbox card selection | | | |
| QC / Retouch card selection | | | |
| Review Gallery card selection | | | |
| Delivery Readiness selection | | | |

### Console and Overflow Checks (all routes)

| Check | Status |
|---|---|
| No console errors on any route | |
| No horizontal overflow at 390px on any route | |
| Runtime chips visible and correct | |
| Read-only action buttons disabled and labelled | |

## Keyboard and Accessibility

| Check | Status |
|---|---|
| Tab order reaches rail, 黄金链路 entries, read-model tabs, context links, retry button, selectable cards | |
| Active element has visible 2px focus ring | |
| Focus movement does not resize or shift layout | |
| `aria-current="page"` on active rail entry after click | |
| `aria-pressed` on selected read-model cards | |
| `aria-disabled="true"` on disabled action buttons | |
| `aria-label` on metric strips, workspace sections | |

## Feature Gate Validation

### Mock-first Gate

| Check | Status |
|---|---|
| App works with no `VITE_BACKEND_API_BASE_URL` | |
| Runtime chips show `本地模拟` | |
| All 5 surfaces render with mock data | |
| Golden Product Loop IDs (`PRJ-128`, `REV-441`, `DEL-220`) work | |

### Read-only Boundary

| Check | Status |
|---|---|
| No POST/PATCH/DELETE in network tab | |
| All upload buttons disabled and labelled `上传未启用` | |
| All download buttons disabled and labelled `下载未启用` | |
| All write actions disabled with read-only posture | |
| 写入边界 chip shows `mock-first / read-only` on every page | |
| Source boundary scan reports no POST/PATCH/DELETE, file input, signed URL, browser storage, token, storage-provider URL, or public-access enablement signal | |

### Auth Boundary

| Check | Status |
|---|---|
| No token values in localStorage or sessionStorage | |
| No auth headers beyond `x-user-role` and `x-user-name` | |
| No sign-in page | |
| No production auth URLs in source or config | |
| `认证源`, `会话`, `角色`, and `访问权限` chips are visible on Command Center and read-model pages | |
| `qa-auth-role-matrix.ps1` passes 70 role-route matrix cell checks | |
| `qa-readonly-auth-live-roles.ps1` passes without `.env` changes | |

### No Secrets

| Check | Status |
|---|---|
| `git diff --check` clean | |
| Secret scan on all changed files passes | |
| No `.env` changes committed | |
| No production URLs in source | |
| No credentials in docs or comments | |

## Chinese-first Copy Verification

| Surface | Check |
|---|---|
| Command Center shell, rail, gauges | Chinese labels visible |
| Risk / Approval / Activity / Inspection scenes | Chinese content visible |
| Asset Inbox workspace | Chinese labels, status, binding copy |
| QC / Retouch workspace | Chinese labels, failure reasons, retouch copy |
| Review Gallery workspace | Chinese labels, feedback copy |
| Delivery Readiness workspace | Chinese labels, checklist, blocker copy |
| Runtime chips | Chinese labels |
| State notices | Chinese titles and messages |
| 黄金链路 entry strip | Chinese labels |

## Responsive Visual Verification

| Viewport | Check |
|---|---|
| 1440x960 | Full cockpit layout; three-gauges centered; no clipping |
| 1024x768 | Rail and content both visible; gauges scaled appropriately |
| 390x844 | Single-column layout; no horizontal overflow; chips wrap |

## Staging Verification

If a staging backend is available and configured:

| Check | Status |
|---|---|
| `scripts\qa-backend-read-signoff.ps1` passes against approved local/staging backend URL | |
| `scripts\qa-backend-read-smoke.ps1` passes against approved local/staging backend URL | |
| Command Center loads from backend | |
| Asset Inbox loads from backend | |
| QC / Retouch loads from backend | |
| Review Gallery loads from backend | |
| Delivery Readiness loads from backend | |
| Runtime chips show `后端只读` / `已连接` | |
| Error state shows when backend unreachable | |
| Forbidden state shows on 403 (if testable) | |
| Mock fallback works after removing env var | |

## Release Preparation

| Check | Status |
|---|---|
| Release version determined | |
| Release notes written (see template below) | |
| Frontend/backend compatibility confirmed | |
| Rollback plan documented | |
| Monitoring or error reporting available in production | |
| Feature flags configured (if any) | |
| Tag name approved (`frontend-v2-release-YYYY.MM.DD`) | |

## Release Notes Template

```markdown
# Frontend v2 Release [VERSION] — [DATE]

## Changes
- [List key changes from commit log]

## Validation
- Lint: passed
- Build: passed
- validate-local.ps1: passed
- Browser QA: [result]
- Staging smoke: [result]

## Known Limitations
- Read-only posture: no upload, download, write, public links, or production auth.
- Backend integration: optional, behind VITE_BACKEND_API_BASE_URL.
- Mock-first fallback: intact.

## Rollback
- Previous known-good tag: [TAG]
- Rollback command: git checkout [TAG]
- Rebuild: npm ci && npm run build
```

## Rollback Plan

| Item | Detail |
|---|---|
| Previous known-good tag | |
| Rollback decision owner | |
| Rollback procedure | `git checkout <previous-tag> && npm ci && npm run build` |
| Post-rollback validation | Re-run `validate-local.ps1` and browser QA |
| Rollback notification | Notify [team/channel] |

## Signoff

| Role | Name | Date | Signature |
|---|---|---|---|
| Release manager | | | |
| QA reviewer | | | |
| Backend/platform owner | | | |
| Security reviewer (if auth/storage/links in scope) | | | |

## Release Execution

Do not execute these steps without explicit approval:

- [ ] Tag created: `git tag -a frontend-v2-release-YYYY.MM.DD -m "..." `
- [ ] Tag pushed: `git push origin frontend-v2-release-YYYY.MM.DD`
- [ ] Release deployed to production
- [ ] Post-deploy smoke test passed
- [ ] Release announced to team

## Post-release Verification

| Check | Status |
|---|---|
| Production URL loads without errors | |
| Runtime chips show correct source | |
| No console errors | |
| No broken navigation | |
| Rollback path confirmed available | |

## Reference

- Roadmap: `docs/design/FRONTEND_V2_PRODUCTION_ROADMAP.md` — S7
- Review checklist: `docs/design/FRONTEND_V2_PRODUCTION_REVIEW_CHECKLIST.md`
- Risk register: `docs/design/FRONTEND_V2_RISK_REGISTER.md`
- Smoke plan: `docs/design/FRONTEND_V2_BACKEND_READ_SMOKE_PLAN.md`
