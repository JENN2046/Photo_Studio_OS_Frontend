# VALIDATION_LOG.md — Photo Studio OS Frontend

Validation history for sustained frontend autopilot.

Codex should append entries after running validation.

Do not claim validation that was not run.

---

## Validation Commands Reference

Use only commands that actually exist in the repository.

Common candidates, if available:

```bash
npm run typecheck
npm run lint
npm run build
npm run test
```

Docs-only candidate:

```bash
git diff --check
```

Local helper candidates, if added and safe:

```powershell
./scripts/validate-local.ps1
```

```bash
./scripts/validate-local.sh
```

---

## Entries

```text
## VALIDATION-20260505-2020

Task: Command Center Alpha and Autopilot Rails Pack local validation.
Commands run:
- npm run lint
- npm run build
- git diff --check
- high-confidence secret scan on changed rails/frontend files
Result: passed
Failures: none
Fix attempted: none required
Re-run result: not applicable
Not validated: npm test is not defined; no remote push/deploy validation
Notes: Vite build required sandbox escalation because the sandbox blocks esbuild child process spawn with EPERM.

## VALIDATION-20260505-2045

Task: Local frontend viewport QA and responsive status/gauge polish.
Commands run:
- powershell -ExecutionPolicy Bypass -File scripts\validate-local.ps1
- npm run lint
- npm run build
- Headless Chrome screenshots for 1024x768, 780x844, 390x844 loading, and 390x844 error
Result: passed after responsive CSS fixes
Failures:
- Sandbox run of validate-local.ps1 failed at Vite/esbuild with spawn EPERM.
- 780px screenshot initially showed the secondary SKU gauge before the primary Studio Readiness gauge.
- 390px loading screenshot initially showed the side Read Boundary rail before the main status surface.
- 390px error screenshot initially clipped the long Fault note text.
Fix attempted:
- Reordered primary gauge and main status surface at narrow breakpoints.
- Made mobile status headers vertical.
- Added wrapping and smaller mobile type for status message text.
Re-run result:
- npm run lint passed.
- npm run build passed.
- validate-local.ps1 passed outside sandbox.
- Updated screenshots showed the primary gauge/status first and readable error text.
Not validated:
- No npm test script is defined.
- No commit or push was performed for this follow-up.
Notes:
- The reused local dev server at 127.0.0.1:5173 was not stopped.

## VALIDATION-20260506-1505

Task: Optional frontend v2 backend read-model API bridge.
Commands run:
- npm run lint
- npm run build
- Invoke-WebRequest http://127.0.0.1:5173
- git diff --check
Result: passed
Failures:
- Initial typecheck rejected passing specific query interfaces into a Record<string, string | number | undefined> helper.
Fix attempted:
- Narrowed query serialization to accept object input and serialize only string/number values.
Re-run result:
- npm run lint passed.
- npm run build passed.
- HTTP check returned 200.
- git diff --check passed.
Not validated:
- No npm test script is defined.
- No backend live integration request was run from the frontend in this slice.
- No screenshot QA was run because this was an API boundary change.
Notes:
- Existing Vite dev server at 127.0.0.1:5173 was reused and not stopped.
- Frontend remains mock-first unless VITE_BACKEND_API_BASE_URL is configured.
- API bridge covers Command Center, Asset Inbox, QC / Retouch Queue, Review Gallery, and Delivery Readiness.

## VALIDATION-20260507-P1B-DOCS

Task: Refresh Frontend v2 P1B/P2 implementation map and sustained task rail.
Commands run:
- git diff --check
- changed-file secret scan on docs and .agent_board files
- npm run lint
- npm run build
Result: passed
Failures: none
Fix attempted: none required
Re-run result: not applicable
Not validated:
- No npm test script is defined.
- No browser QA was needed for docs/board-only changes.
Notes:
- This batch updates current facts after c19e171 and points the next safe work at Review Gallery / Delivery Readiness.

## VALIDATION-20260507-REVIEW-GALLERY

Task: Deepen #review-gallery into a read-only client review workspace.
Commands run:
- git diff --check
- changed-file secret scan on ReadModelPages.tsx and readModelPages.css
- npm run lint
- npm run build
- Playwright CLI direct hash check for #review-gallery
- Playwright CLI 390px horizontal-overflow probe
- Playwright CLI console error check
Result: passed
Failures: none
Fix attempted: none required
Re-run result: not applicable
Not validated:
- No npm test script is defined.
- Full four-page browser QA remains queued for the final cross-page batch.
Notes:
- Verified visible content includes 审核画廊, 公开审核未启用, 反馈写入未启用, 标签颜色需要回到参考图, and 需返修.
- 390px viewport reported no horizontal overflow and console error count was 0.

## VALIDATION-20260507-DELIVERY-READINESS

Task: Deepen #delivery-readiness into a read-only delivery outbox workspace.
Commands run:
- git diff --check
- changed-file secret scan on ReadModelPages.tsx and readModelPages.css
- npm run lint
- npm run build
- Playwright CLI direct hash check for #delivery-readiness
- Playwright CLI 390px horizontal-overflow probe
- Playwright CLI console error check
Result: passed
Failures: none
Fix attempted: none required
Re-run result: not applicable
Not validated:
- No npm test script is defined.
- Full four-page browser QA remains queued for the final cross-page batch.
Notes:
- Verified visible content includes 交付就绪, Delivery Outbox, 下载未开放, 外部交付未启用, 缺少已通过的质检结果, and 交付清单已生成.
- 390px viewport reported no horizontal overflow and console error count was 0.

## VALIDATION-20260507-READ-MODEL-CONTEXT

Task: Align all four read-model hash pages with shared production context and Command Center return path.
Commands run:
- git diff --check
- changed-file secret scan on ReadModelPages.tsx and readModelPages.css
- npm run lint
- npm run build
- in-app browser QA for #asset-inbox, #qc-retouch, #review-gallery, and #delivery-readiness context bar text and console errors
- in-app browser click check for 返回命令中心 from #qc-retouch
- Playwright CLI 390px horizontal-overflow probe for all four hash pages
- Playwright CLI console error check
Result: passed
Failures:
- Initial browser text check used the wrong QC title label; the page itself was correct and was rechecked with 质检 / 精修队列.
- A first temporary `npx --package playwright node -` viewport probe could not resolve the transient playwright module; no dependency files were changed, and Playwright CLI was used instead.
Fix attempted: none required for application code
Re-run result: not applicable
Not validated:
- No npm test script is defined.
- Command Center entry-click QA remains queued for the next batch.
Notes:
- Verified context bar text includes 项目 PRJ-128, 审核会话 REV-441, 交付包 DEL-220, mock-first / read-only, and 返回命令中心.
- 390px viewport reported no horizontal overflow across all four hash pages and console error count was 0.

## VALIDATION-20260507-COMMAND-CENTER-LINKS

Task: Strengthen Command Center production navigation and close P1B browser QA.
Commands run:
- git diff --check
- changed-file secret scan on CommandCenter.tsx and global.css
- npm run lint
- npm run build
- in-app browser QA for Command Center 黄金链路 strip and four entry clicks
- in-app browser QA for read-model tab switching back to 素材收件箱
- Playwright CLI 390px Command Center horizontal-overflow probe
- Playwright CLI console error check
Result: passed
Failures: none
Fix attempted: none required
Re-run result: not applicable
Not validated:
- No npm test script is defined.
- No backend live integration was run; frontend remains mock-first unless VITE_BACKEND_API_BASE_URL is configured.
Notes:
- Verified Command Center displays 黄金链路 plus PRJ-128, REV-441, DEL-220.
- Verified 黄金链路 entries navigate to #asset-inbox, #qc-retouch, #review-gallery, and #delivery-readiness with the expected read-model context.
- 390px viewport reported no horizontal overflow and console error count was 0.

## VALIDATION-20260507-P2-COCKPIT-BREAKPOINT

Task: Keep Command Center Risk / Approval side rail visible at the 1280px cockpit breakpoint.
Commands run:
- npm run lint
- npm run build
- Playwright CLI 1280px screenshot inspection
- Playwright CLI 1280px side-rail bounding-box probe
- Playwright CLI 390px horizontal-overflow and stacking probe
- Playwright CLI console error check
Result: passed
Failures:
- Initial 1280px screenshot showed the right rail content below the main cockpit, leaving the first viewport right column blank.
Fix attempted:
- Scoped the `max-width: 1320px` cockpit rule to reset `.cockpit-frame > .cockpit-side` back to the right column while keeping mobile stacking below 1100px.
Re-run result:
- 1280px side rail returned to x=994, y=56, width=286 with Risk / Approval text visible.
- 390px remains stacked below the main panel with no horizontal overflow.
Not validated:
- No npm test script is defined.
Notes:
- This is a frontend-only CSS breakpoint fix; no data, backend, dependency, or write-action boundary changed.

## VALIDATION-20260507-BACKEND-SMOKE-DOCS

Task: Document optional backend read-model smoke boundary.
Commands run:
- git diff --check
- changed-file secret scan on README.md, COMMAND_CENTER_READONLY_API_CONTRACT_NOTE.md, and .agent_board files
Result: passed
Failures: none
Fix attempted: not applicable
Re-run result: not applicable
Not validated:
- npm run lint and npm run build were not required for docs-only changes.
- No backend live integration was run.
Notes:
- Documentation keeps mock-first default and forbids tokens, .env edits, auth, upload/download, writes, public links, and production endpoints.

## VALIDATION-20260507-READONLY-ACTION-PAIR

Task: Extract repeated read-only disabled action pairs.
Commands run:
- git diff --check
- changed-file secret scan on ReadModelPages.tsx
- npm run lint
- npm run build
- in-app browser QA for disabled action buttons across #asset-inbox, #qc-retouch, #review-gallery, and #delivery-readiness
Result: passed
Failures: none
Fix attempted: none required
Re-run result: not applicable
Not validated:
- No npm test script is defined.
Notes:
- Verified 上传未启用, 下载未启用, 退回精修, 只读建议, 公开审核未启用, 反馈写入未启用, 下载未开放, and 外部交付未启用 each appear once and remain disabled.
- Console error count was 0.

## VALIDATION-20260507-MOBILE-TOPBAR-STATUS

Task: Keep Command Center topbar status compact at 390px.
Commands run:
- Browser-led probe at 1440px, 1024px, and 390px for Command Center plus #asset-inbox, #qc-retouch, #review-gallery, and #delivery-readiness
- Playwright CLI 390px before/after screenshot inspection
- Playwright CLI 390px overflow probe
- Playwright CLI console error check
- git diff --check
- changed-file secret scan on current diff
- npm run lint
- npm run build
Result: passed
Failures:
- Initial 390px screenshot showed the Command Center topbar status split across multiple lines with the live dot on its own line.
Fix attempted:
- Scoped the mobile topbar status rules so studio, date, time, and live dot stay in one compact row with overflow protection.
Re-run result:
- 390px screenshot passed after the fix.
- Overflow probe returned scrollWidth 390 and clientWidth 390.
- Console error count was 0.
- git diff --check passed.
- changed-file secret scan passed.
- npm run lint passed.
- npm run build passed.
Not validated:
- No npm test script is defined.
- No backend live integration was run; frontend remains mock-first.
Notes:
- This is a frontend-only CSS and local task-rail batch.

## VALIDATION-20260507-READMODEL-METRIC-STRIP

Task: Extract repeated read-model metric panel rendering.
Commands run:
- npm run lint
- Playwright CLI 390px browser check for #asset-inbox, #qc-retouch, #review-gallery, and #delivery-readiness
- Playwright CLI console error check
- git diff --check
- changed-file secret scan on current diff
- npm run build
Result: passed
Failures: none
Fix attempted: none required
Re-run result: not applicable
Not validated:
- No npm test script is defined.
Notes:
- Each of the four checked hash pages retained 3 .read-model-metric cards after the extraction.
- 390px overflow was false on all four checked pages.
- Console error count was 0.
- git diff --check passed.
- changed-file secret scan passed.
- npm run build passed.

## VALIDATION-20260507-READMODEL-BOUNDARY-STATES

Task: Add local read-model boundary-state rehearsal.
Commands run:
- npm run lint
- Playwright CLI 390px browser check for loading, error, missing-config, and idle states
- Playwright CLI console error check
- git diff --check
- changed-file secret scan on current diff
- npm run build
Result: passed
Failures: none
Fix attempted: none required
Re-run result: not applicable
Not validated:
- No npm test script is defined.
Notes:
- Verified readModelState=loading shows 只读模型加载中.
- Verified readModelState=error shows 只读模型不可用.
- Verified readModelState=missing-config shows 后端只读模型未配置.
- Verified missing deliveryId shows 请先选择 deliveryId.
- Each checked state included mock-first / read-only status meta, had no horizontal overflow at 390px, and console error count was 0.
- git diff --check passed.
- changed-file secret scan passed.
- npm run build passed.

## VALIDATION-20260507-QA-RUNWAY-DOCS

Task: Document Frontend v2 local QA runway.
Commands run:
- git diff --check
- changed-file secret scan on current diff
- npm run lint
- npm run build
Result: passed
Failures: none
Fix attempted: not applicable
Re-run result: not applicable
Not validated:
- No npm test script is defined.
Notes:
- README.md now lists the local Command Center route, four read-model hash routes, 390px QA expectations, and DEV-only readModelState rehearsals.
```

---

## Entry Template

```text
## VALIDATION-YYYYMMDD-HHMM

Task:
Commands run:
Result:
Failures:
Fix attempted:
Re-run result:
Not validated:
Notes:
```
