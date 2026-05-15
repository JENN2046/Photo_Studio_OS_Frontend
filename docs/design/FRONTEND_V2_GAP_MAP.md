# Photo Studio OS Frontend v2 Gap Map

Date: 2026-05-07
Target repo: `A:\Photo_Studio_OS_Frontend`
Source reference set: `A:\Photo_Studio_OS\.agent_board\references\photo_studio_v2`

This gap map compares the current read-only Frontend Alpha against the selected v2 product, UI, visual, token, and fixture references copied into the control workspace.

Boundary:

- This is a planning document only.
- The frontend remains read-only and mock-first.
- Do not add upload, download, auth, storage, external Review links, external Delivery links, approval writes, backend mutations, or production connections from this task.
- Current frontend `AGENTS.md`, repository reality, and approved Command Center Alpha scope override the v2 reference documents.

## Implementation Status

As of the current Frontend v2 local state, the read-only production loop has moved through the P1B realization slice:

- Command Center visible copy, rail labels, gauge labels, risk/approval/activity copy, and read-model surfaces are Chinese-first.
- Four dedicated hash read-only pages exist: `#asset-inbox`, `#qc-retouch`, `#review-gallery`, and `#delivery-readiness`.
- These pages are mock-first by default and only call backend read-model fetchers when `VITE_BACKEND_API_BASE_URL` is configured.
- Asset Inbox is now a dedicated read-only production workspace with Capture One intake status, thumbnail grid, selected asset preview, binding/file detail, disabled upload/download posture, and QC checklist.
- QC / Retouch is now a dedicated read-only queue workspace with selected item detail, failure reasons, severity, owner, due time, technical/manual checks, retouch instructions, and disabled suggested-action posture.
- Review Gallery is now a dedicated read-only client review workspace with gallery grid, selected review item, client feedback/revision state, status summary, disabled public review, and disabled feedback write posture.
- Delivery Readiness is now a dedicated read-only delivery outbox workspace with package/manifest summary, readiness checklist, blockers, selected output preview, disabled download, and disabled external delivery posture.
- All four read-model hash pages share a production context bar for `projectId`, `reviewSessionId`, `deliveryId`, `mock-first / read-only`, and return-to-Command-Center navigation.
- Command Center now exposes the first Golden Product Loop IDs through a compact `黄金链路` entry strip with four read-only page links.
- P2 cockpit browser polish has fixed the 1280px side-rail breakpoint and the 390px Command Center topbar status line.
- Read-model UI now shares repeated disabled action pairs and repeated metric strip rendering.
- DEV-only read-model boundary rehearsals exist for `readModelState=loading`, `readModelState=error`, `readModelState=missing-config`, `readModelState=empty`, `readModelState=partial`, `readModelState=stale`, `readModelState=forbidden`, and `readModelState=invalid-id`; idle context handling is also browser-checked.
- README.md now documents the local Frontend v2 QA runway for Command Center, the four hash pages, 390px checks, and DEV-only state rehearsals.
- P2.5 RC hardening has browser-clicked the Command Center `黄金链路` entries, verified visible keyboard focus rings, and re-run the five-page RC matrix at 1440px / 1024px / 390px.
- Boundary-state matrix now checks loading, error, missing-config, empty, partial, stale, forbidden, invalid-id, and missing-id idle states at 1024px and 390px with no console errors or horizontal overflow.
- P2.6 click affordance pass has converted Command Center fake heading actions into real links, confirmed read-model card selection, and clarified disabled read-only action semantics.
- P2.7 command rail hygiene has reduced Command Center rail entries to unique hash scenes and added hash-aware `aria-current` active state.
- P2.8 Risk / Approval scene depth adds read-only detail cards for risk impact, owner, suggested action, approval state, approval impact, and next step; direct `#risk` / `#approvals` hash loads are stabilized with Command Center scene state.
- P2.9 Command Center side-detail helpers now live in the view-model layer, using stable risk IDs plus approval type/state instead of component-local copy guessing.
- P2.11 read-model workspace helpers now live in `readModelViewModels.ts`: asset labels/tone, QC result labels, review item tone, delivery checklist labels, and delivery artifact derivation are no longer component-local.
- P2.12 read-model workspace components now live in `readModelWorkspaces.tsx`, while `ReadModelPages.tsx` owns route params, read-model state, mock-first loading, and page shell only.
- P2.13 read-only route QA is now scripted through `scripts/qa-readonly-routes.ps1`, covering Command Center plus six promoted hash scenes and the four read-model pages at 1440px and 390px.
- P2.14/P3.8 read-model boundary-state QA is scripted through `scripts/qa-readonly-boundary-states.ps1`, covering loading, error, missing-config, empty, partial, stale, forbidden, invalid-id, and missing-id idle states at 1024px and 390px.
- P2.15 local validation orchestration now allows `scripts/validate-local.ps1 -IncludeBrowserQa` to run lint/build, whitespace, changed-file secret scan, route QA, and boundary-state QA from one local entry point.
- P2.16/P2.17 now align the Bash validation helper and add `scripts/qa-readonly-interactions.ps1` for read-model tabs, local selection state, and disabled action posture.
- P2.18 adds a Bash validation runtime preflight so incompatible Bash/WSL Node versions fail early with a clear Vite 7 Node requirement instead of failing deep inside `npm run build`.
- P2.19 adds the same Node runtime preflight to the PowerShell validation helper so both local validation entry points guard Vite 7's Node requirement before npm gates.
- P2.20 adds `scripts/qa-readonly-all.ps1` as a single local browser-QA entry point and makes both validation helpers call it in browser-QA mode.
- P3.1 read-model runtime state surface now exposes visible chips for read source, runtime status, transport posture, and `mock-first / read-only` write boundary across all four read-model pages.
- P3.2/P3.9 Command Center runtime state surface now exposes the same read source, runtime status, transport posture, and `mock-first / read-only` write boundary chips on the main cockpit, including DEV-only loading/error/forbidden/invalid-id rehearsals; route QA now asserts the cockpit runtime chip copy across ready/loading/error/forbidden/invalid-id states.
- P3.3 shared runtime chip rendering now keeps Command Center and read-model runtime posture chips on the same frontend-only renderer and tone rules.
- P3.4 read-only QA scripts now share one Golden Product Loop fixture for `PRJ-128`, `REV-441`, and `DEL-220`.
- P3.5 route QA now checks invalid DEV debug query values fall back to the normal mock-first ready path without console errors or overflow.
- P3.6 post-commit board facts now record Batch A as committed in `07e0e08` instead of leaving stale pending-commit wording.
- P3.7 read-only browser QA now checks Command Center `黄金链路` entry clicks and extends route/interaction coverage to `1024x768`.
- S2 backend read smoke now has `scripts/qa-backend-read-all.ps1`, which runs connected-path local mock backend smoke plus unreachable-backend failure smoke without editing `.env`.
- `--ps-*` token aliases and text-color compatibility aliases exist in `src/styles/tokens.css`.
- Current long-track focus is post-RC read-only UX tightening, reusable local QA, and optional backend read-model smoke testing only when a local backend base URL is explicitly configured.

## Source Files Used

Product and UI:

- `docs/01_professional_golden_loop_plan.md`
- `docs/05_professional_golden_loop_spec.md`
- `docs/06_acceptance_criteria.md`
- `docs/09_ui_ux_master_principles.md`
- `docs/10_role_based_view_model.md`
- `docs/11_information_architecture.md`
- `docs/12_codex_ui_execution_order.md`
- `docs/13_golden_product_loop_ui.fixture.json`

Visual system:

- `docs/15_visual_decision_record.md`
- `docs/16_layout_and_component_rules.md`
- `docs/17_page_style_mapping.md`
- `docs/18_visual_codex_frontend_tasks.md`
- `docs/19_visual_acceptance_checklist.md`
- `tokens/photo_studio_visual_tokens.css`
- `tokens/photo_studio_visual_tokens.json`

Image references:

- `images/visual_reference_contact_sheet.jpg`
- `images/command_center_9_2.png`
- `images/command_center_v0_999.png`
- `images/asset_inbox_qc.png`
- `images/combo_command_asset_qc_394c.png`
- `images/combo_command_asset_qc_08c.png`

## Current Frontend Snapshot

| Area | Current state | Evidence |
|---|---|---|
| App shell | Command Center cockpit with Chinese left rail, topbar status, and anchor navigation. | `src/components/layout/AppShell.tsx` |
| Command Center | Implemented as a read-only mock page with gauge cluster, Risk Pulse, Approval Queue, Project Execution, Activity Timeline, and Agent Inspection Feed. | `src/features/command-center/CommandCenter.tsx` |
| Data model | Mock-first `CommandCenterSnapshot` plus backend v2 read-only boundary and per-surface mock read models. | `src/api/types.ts`, `src/api/backendReadModels.ts`, `src/mocks/commandCenter.mock.ts`, `src/features/read-models/readModelMocks.ts` |
| Labels | Command Center and read-model visible copy are Chinese-first; technical IDs such as `SKU`, `QC`, `CR3`, and backend query names remain intentional. | `src/features/command-center/commandCenterViewModel.ts`, `src/features/read-models/readModelViewModels.ts` |
| Visual tokens | `--ps-*` bridge tokens and read-model text aliases are available for new v2 work. | `src/styles/tokens.css` |
| Dedicated pages | Asset Inbox, QC / Retouch, Review Gallery, and Delivery Readiness are dedicated read-only hash scenes with mock-first fallback. | `src/features/read-models/ReadModelPages.tsx` |
| Runtime state surface | Command Center and the four read-model pages show source/status/transport/auth-session/auth-role/write-boundary chips from their frontend runtime hooks through a shared renderer. | `src/components/panels/RuntimeChipList.tsx`, `src/features/command-center/useCommandCenterSnapshot.ts`, `src/features/command-center/CommandCenter.tsx`, `src/features/read-models/useBackendReadModel.ts`, `src/features/read-models/ReadModelPages.tsx` |
| Auth / Role gates | Mock-first auth state machine with 7 roles, 10-route permission matrix, 6 gate components (SignedOut, Expired, Loading, Error, Forbidden, InsufficientRole), and `?authState=` DEV debug rehearsal. | `src/features/auth/authTypes.ts`, `src/features/auth/useAuthState.ts`, `src/features/auth/AuthGate.tsx`, `src/App.tsx` |
| RC QA posture | Command Center entry clicks, keyboard focus visibility, five-page responsive matrix, read-model boundary states, auth state boundary QA, scripted read-only route QA, scripted boundary-state QA, scripted interaction QA, full read-only browser QA aggregation, shared Golden Loop QA fixtures, 1024px middle-viewport coverage, and the local validation orchestrator have current evidence. | `.agent_board/VALIDATION_LOG.md`, `scripts/validate-local.ps1`, `scripts/validate-local.sh`, `scripts/qa-readonly-all.ps1`, `scripts/qa-readonly-fixtures.ps1`, `scripts/qa-readonly-routes.ps1`, `scripts/qa-readonly-boundary-states.ps1`, `scripts/qa-readonly-interactions.ps1`, `scripts/qa-readonly-auth-states.ps1` |

## Overall Gaps

| Gap | Impact | Recommended action | Priority |
|---|---|---|---|
| User-facing copy was mostly English. | Completed for main Command Center and read-model surfaces; continue watching new UI copy. | Keep future visible copy Chinese-first. | P0 done |
| v2 `--ps-*` visual tokens were absent from local token bridge. | Completed as a compatibility bridge; future components should prefer stable token aliases. | Use existing `--ps-*` and `--color-text-*` aliases before adding new token names. | P0 done |
| Command Center needed Chinese alignment. | Completed for shell, gauges, rail, risk, approval, activity, and Agent inspection copy. | Preserve the current composition while adding P1 scene depth. | P0 done |
| Asset Inbox dedicated workspace. | Completed as a read-only scene; continue browser QA when shared rail or read-model styles change. | Preserve the current read-only posture and reuse its selection/preview pattern. | P1 done |
| QC / Retouch dedicated workspace. | Completed as a read-only scene; continue checking failure-detail and disabled action posture. | Preserve the current read-only posture and reuse its queue/detail pattern. | P1 done |
| Review Gallery dedicated workspace. | Completed as a read-only client-review scene. | Preserve the current read-only posture and reuse its grid/selected-detail pattern. | P1B done |
| Delivery Readiness dedicated workspace. | Completed as a read-only delivery outbox scene. | Preserve disabled download/external delivery posture until a separate approved production phase. | P1B done |
| Mock data mirrors the first Golden Product Loop at the read-model level. | Completed for P1 asset/QC/review/delivery fixture counts. | Reuse fixture IDs across Review / Delivery UI, deriving extra frontend context in view models only. | P1 done |
| Cross-page production context and Command Center entry clarity. | Completed with shared read-model context bar plus Command Center `黄金链路` strip. | Keep entry links read-only and verify them when route or fixture IDs change. | P1B done |
| Command Center responsive cockpit polish. | 1280px side rail and 390px topbar status issues were fixed and browser-checked. | Continue checking 1440px / 1024px / 390px after future cockpit layout changes. | P2 done |
| Read-model shared UI duplication. | Disabled action pairs and metric strips are shared components. | Add more shared pieces only when concrete duplication appears; avoid speculative abstractions. | P2 done |
| Read-model boundary-state rehearsal. | DEV-only query states cover loading, error, missing-config, empty, partial, stale, forbidden, invalid-id, and missing-id idle checks without backend writes. | Keep these states local and read-only; do not use them as production auth/backend behavior. | P3.8 done |
| Local QA runway. | README documents local routes, 390px checks, and DEV-only boundary rehearsals. | Use the README route list before future P2/P3 visual or read-model changes. | P2 done |
| Keyboard focus visibility. | Command Center links and read-model tabs/cards now expose visible focus rings. | Keep future links/buttons/selectable cards covered by `:focus-visible` styles. | P2.5 done |
| RC browser matrix. | Command Center plus four read-model pages passed 1440px / 1024px / 390px checks; boundary states passed 1024px / 390px checks. | Re-run this matrix after route, layout, or shared style changes. | P2.5 done |
| Click affordance clarity. | Command Center heading actions navigate to target hash scenes; read-model cards select local detail; disabled actions expose read-only disabled posture. | Future visible actions must either navigate, update local read-only UI state, or remain clearly disabled. | P2.6 done |
| Command rail scene hygiene. | The rail now exposes one entry each for #risk, #projects, #approvals, #activity, and #inspections, with one hash-aware active state. | Keep future rail additions unique and browser-check `aria-current` after click. | P2.7 done |
| Risk / Approval scene depth. | #risk and #approvals now expose focused read-only detail lists, and direct hash loads are stable after React render. | Keep details derived from read-model/mock state and avoid introducing approval writes. | P2.8 done |
| Command Center side-detail view model. | Risk detail and approval detail derivation moved out of the component and into `commandCenterViewModel.ts`. | Extend stable mapping in the view-model layer when adding risk IDs or approval types. | P2.9 done |
| Read-model workspace view model cleanup. | Asset label/tone, QC result label/value, review tone, delivery checklist labels, and delivery artifact derivation moved out of `ReadModelPages.tsx`. | Keep page components focused on local selection state and rendering; add future read-model derivation to `readModelViewModels.ts`. | P2.11 done |
| Read-model workspace component split. | Asset Inbox, QC / Retouch, Review Gallery, and Delivery Readiness workspace components moved out of `ReadModelPages.tsx` into `readModelWorkspaces.tsx`. | Keep route/data-state orchestration in `ReadModelPages.tsx`; add future workspace-only UI changes in `readModelWorkspaces.tsx`. | P2.12 done |
| Scripted read-only route QA. | Local QA script checks Command Center scenes, read-model pages, runtime chips, rail active state, invalid DEV debug fallback, console errors, and horizontal overflow across 1440px, 1024px, and 390px. | Run `scripts/qa-readonly-routes.ps1` after route, layout, rail, runtime-state, or read-model page changes while the Vite server is running. | P3.7 done |
| Scripted boundary-state QA. | Local QA script checks all four read-model pages across loading, error, missing-config, empty, partial, stale, forbidden, invalid-id, and missing-id idle states at 1024px and 390px. | Run `scripts/qa-readonly-boundary-states.ps1` after read-model state, shell, notice, or responsive style changes. | P3.8 done |
| Local validation orchestration. | `scripts/validate-local.ps1` now performs changed-file secret scan and can run both browser QA matrices via `-IncludeBrowserQa`. | Use default mode for fast local gates and `-IncludeBrowserQa` before larger read-only UI commits when the dev server is running. | P2.15 done |
| Scripted interaction QA. | Local QA script checks read-model tab switching, local card selection, and disabled read-only actions at desktop and 390px. | Run through `scripts/qa-readonly-interactions.ps1` or the full validation helper after read-model interaction changes. | P2.17 done |
| Bash validation environment guard. | `scripts/validate-local.sh` checks Node.js before npm gates and reports the Vite 7 requirement when Bash/WSL exposes an incompatible runtime. | Use PowerShell validation on this machine unless the Bash/WSL Node runtime is `20.19+` or `22.12+`. | P2.18 done |
| PowerShell validation environment guard. | `scripts/validate-local.ps1` also checks Node.js before npm gates and reports the Vite 7 requirement when the shell runtime is incompatible. | Keep both validation helpers aligned when changing project runtime gates. | P2.19 done |
| Full browser QA aggregation. | `scripts/qa-readonly-all.ps1` runs the route, boundary-state, and interaction matrices in sequence; both validation helpers use it for browser-QA mode. | Run the aggregate script before broad read-only UI handoffs instead of remembering three separate commands. | P2.20 done |
| Backend read smoke aggregation. | `scripts/qa-backend-read-all.ps1` runs connected-path mock backend smoke and unreachable-backend failure smoke in sequence. | Use this local aggregate before requesting a real staging backend smoke. | S2 done |
| Backend connected-path smoke. | `scripts/qa-backend-read-smoke-mock.ps1` starts a temporary localhost read-model mock backend and verifies Command Center plus the four read-model pages through the real backend-read client path; the shared smoke harness now confirms all five expected backend read paths were actually requested. | Keep this wrapper GET/OPTIONS only; use it before any real staging backend smoke so connected UI regressions are caught locally. | S2 done |
| Read-model runtime state surface. | Context bar now shows read source, runtime status, transport posture, and read-only write boundary across all four read-model scenes. | Keep future runtime states derived in `useBackendReadModel`; do not leak production URLs or secrets into UI. | P3.1 done |
| Command Center runtime state surface. | Main cockpit now shows read source, runtime status, transport posture, and read-only write boundary in ready/loading/error/forbidden/invalid-id states. | Keep future Command Center runtime posture derived in `useCommandCenterSnapshot`; do not expose backend URLs or secret-bearing config. | P3.9 done |
| Shared runtime chip renderer. | Command Center and read-model runtime/context bars now use one `RuntimeChipList` component and shared tone rules. | Extend the shared chip shape only when a real runtime-state field appears; avoid page-local duplicate chip markup. | P3.3 done |
| Golden Loop QA fixtures. | Route, boundary-state, and interaction QA scripts now reuse one local fixture for Golden Product Loop IDs and read-model hashes. | Update `scripts/qa-readonly-fixtures.ps1` first when the canonical local fixture IDs change. | P3.4 done |
| Invalid debug-state fallback QA. | Route QA covers unknown `commandCenterState` and `readModelState` values falling back to normal mock-first ready screens. | Keep unknown DEV query values non-destructive and read-only. | P3.5 done |
| Post-commit board facts. | `.agent_board` now records Batch A as committed in `07e0e08` and uses Batch B/C as the active local task. | Keep board state tied to actual `git log` rather than pending handoff text. | P3.6 done |
| Command Center entry-click QA. | Interaction QA now clicks the four Command Center `黄金链路` entries and checks target page, active tab, Golden Loop IDs, console errors, and horizontal overflow. | Keep this check green whenever Command Center entry labels, IDs, or read-model routes change. | P3.7 done |
| Real backend read-model smoke. | Local connected/failure smoke is automated; real backend smoke is still intentionally not run without a local or staging backend base URL. | Run only with a deliberately configured local/staging `VITE_BACKEND_API_BASE_URL` outside this repo. | S2 blocked on backend URL |

## Command Center Gap Table

v2 target references: A + C visual anchors, UI/UX principles, information architecture, visual checklist.

| Dimension | Current frontend | v2 target | Gap | Copy alignment | Priority |
|---|---|---|---|---|---|
| Left navigation | Rail exposes five unique Chinese hash scenes: `风险雷达`, `项目执行`, `审批队列`, `活动时间线`, and `Agent 巡检`. | Left Chinese navigation should clearly expose production scenes without duplicate active targets. | Done for current Command Center scenes; Asset/QC/Review/Delivery stay in the `黄金链路` strip for this stage. | Keep future rail additions unique and Chinese-first. | P2.7 done |
| Top bar | Compact Chinese studio/date/time status line is visible and 390px browser-checked. | Project switcher / search / risk summary / Agent status can become later operator controls. | Current stage keeps topbar read-only; no search or write-capable controls are implemented. | `布鲁克林影棚 A`, date, time, live dot. | P2 done |
| Visual tone | Premium dark cockpit is already close to approved direction. | Near-black cold blue, cold white text, restrained border, no cyberpunk, no SaaS table feeling. | Keep current direction; migrate new work to v2 token names and avoid extra saturated colors. | No visible copy change. | P0 |
| Main overview | Three-gauge cluster shows Chinese labels: `SKU 覆盖率`, `工作室就绪度`, and `质检健康度`. | Keep the three operational gauges as the main anchor. | Done for current read-only cockpit; do not replace gauges with generic charts. | Preserve current Chinese labels and readouts. | P0 done |
| Studio context | Command Center exposes project progress, golden loop IDs, risk/approval rail, activity, and Agent inspection context. | Owner/operator should see project health, today focus, risk, next action. | Done for read-only Alpha context; richer operator controls remain future work. | `黄金链路`, `项目`, `审核`, `交付`, `打开质检 / 精修`. | P1B done |
| Golden Path | Command Center exposes a compact `黄金链路` strip for the first fixture IDs and links to Asset / QC / Review / Delivery. | Golden Product Loop should expose client -> project -> SKU -> shot -> asset -> retouch -> QC -> review -> delivery. | P1B cockpit entry is done; deeper client/SKU/shot drilldown can remain P2. | `客户接入`, `拍摄`, `素材入库`, `精修`, `质检`, `客户审核`, `交付`. | P1B done |
| Right rail risk | `风险雷达` exists with high/medium/low signals plus read-only impact, owner, and suggested action details. | Right side should show intelligent inspection, risk, pending work. Risk uses orange-red only. | Done for current read-only side rail; details are view-model derived. | `风险雷达`, `负责人`, `建议`, `打开质检 / 精修`. | P2.9 done |
| Approval queue | `审批队列` exists with request IDs, type/state labels, consequence, and read-only next step details. | Approval UI should show risk label, consequence, approval state, request id, activity link for L3/L4 later. | Done for current read-only side rail; no approval writes or payload mutation are implemented. | `审批队列`, `待处理`, `已清除`, `阻塞`, `下一步`. | P2.9 done |
| Activity timeline | Chinese curated activity timeline is visible in the lower execution panel and can be promoted by `#activity`. | Bottom timeline should be visible and curated, not raw logs. | Done for current Alpha. | `活动时间线`, `拍摄完成`, `质检通过`, `精修完成`. | P2.7 done |
| Agent inspection | `Agent 巡检` feed is visible and can be promoted by `#inspections`. | Agent is an inspector, not an unauthorized operator. | Done for read-only Alpha; suggestions remain non-mutating. | `Agent 巡检`, `巡检预警`, `打开质检 / 精修`. | P2.7 done |

## Asset Inbox / QC Gap Table

v2 target references: E / F visual anchors, role-based Photographer View, page mapping, frontend task 5.

| Dimension | Current frontend | v2 target | Gap | Copy alignment | Priority |
|---|---|---|---|---|---|
| Scene presence | Dedicated Asset Inbox and QC / Retouch hash scenes are implemented. | Dedicated Asset Inbox / QC scene. | Done for read-only P1. | `素材收件箱 / 质检中心`. | P1 done |
| Capture One intake | Asset Inbox shows Capture One placeholder source and intake state. | Show Capture One Export Directory status. | Done as read-only mock. | `Capture One 导出目录`, `导入批次`, `等待登记`, `已登记`. | P1 done |
| Thumbnail grid | Asset Inbox has a local thumbnail-style grid and selected asset state. | Image-first thumbnail grid with binding and QC badges. | Done without real upload/download assets. | `素材缩略图`, `选中素材`, `可用`, `需检查`, `不通过`. | P1 done |
| Binding state | Selected asset shows SKU, Shot Requirement, binding status, reason, and confidence. | Bind asset to SKU and ShotRequirement. | Done as read-only frontend fixture/view state. | `绑定 SKU`, `绑定 Shot Requirement`, `未绑定`, `绑定冲突`. | P1 done |
| File info | Selected asset shows dimensions, size, extension, and color space. | File info should be visible. | Capture time/source can remain future fixture enrichment. | `文件信息`, `文件名`, `格式`, `来源`, `拍摄时间`, `色彩配置`. | P1 done |
| Right preview | Asset Inbox has a generated read-only preview panel. | Right side large image preview. | Done without real image download. | `右侧预览`, `素材详情`, `放大检查`. | P1 done |
| QC checklist | Asset Inbox selected detail shows latest QC state and failed reasons. | QC checklist visible beside preview. | Done for first P1 slice; richer category checklist can be P2. | `质检清单`, `曝光`, `构图`, `裁切`, `阴影`, `商品标签可见`. | P1 done |
| Risk highlight | Failed/warning assets expose reasons and badges. | Risk points should be specific and restrained. | Done for read-model fixture reasons. | `风险点`, `原因`, `建议复查`, `需返修`. | P1 done |

## QC Gap Table

v2 target references: G visual anchor, role-based Retoucher View, visual checklist, frontend task 6.

| Dimension | Current frontend | v2 target | Gap | Copy alignment | Priority |
|---|---|---|---|---|---|
| QC scene | Dedicated QC / Retouch read-only queue workspace exists. | Dedicated QC surface that explains failure reasons. | Done for P1. | `质检中心`, `QC 队列`. | P1 done |
| QC states | Per-item latest status, technical/manual checks, and next action are visible. | Pass / warning / fail per QC check. | Done with read-model queue fixture. | `通过`, `警告`, `失败`, `待质检`. | P1 done |
| Failure reason | Selected QC item shows failure reasons, severity, owner, and suggestion. | QC failure reason must be specific. | Done for first Golden Product Loop. | `失败原因`, `返修意见`, `影响范围`, `负责人`. | P1 done |
| Retouch feedback | Selected QC item shows assignee, due time, instructions, complexity, and revision count. | Retoucher should see standard, deadline, revision notes, references. | Done for read-only P1; reference assets can be P2. | `修图标准`, `截止时间`, `返修说明`, `参考图`. | P1 done |
| Visual layout | Queue list, selected preview, and feedback detail grid exist. | Queue lanes plus large preview and feedback detail. | Done without real image download or write actions. | `待修`, `修图中`, `QC 失败`, `返修`, `已通过`. | P1 done |

## Review / Delivery Gap Table

v2 target references: role-based Client Review View, information architecture, page mapping, Golden Product Loop acceptance.

| Dimension | Current frontend | v2 target | Gap | Copy alignment | Priority |
|---|---|---|---|---|---|
| Review scene | Dedicated review workspace exists with reviewable assets, selected preview, feedback/revision state, and disabled public-review/write posture. | Review / Revision scene with reviewable assets, feedback, approval status, revision deadline. | Done for read-only P1B; public client review remains forbidden for this stage. | `审核与返修`, `待客户审核`, `已批准`, `需返修`, `返修截止`. | P1B done |
| Review state | Review status summary and selected feedback detail are visible. | Client-facing review progress should be clear and calm. | Done for mock-first read-only surface. | `待审核`, `需反馈`, `已确认`, `需修改`. | P1B done |
| Feedback panel | Read-only client feedback/revision panel exists with disabled feedback write action. | Comment field / feedback panel is expected, but alpha should remain read-only. | Done; no write action implemented. | `客户反馈`, `修改意见`, `只读预览`, `写入功能未启用`. | P1B done |
| Delivery scene | Dedicated delivery outbox exists with package/manifest summary, checklist, blockers, selected output preview, and disabled download/external delivery posture. | Delivery readiness, outbox state, package contents, confirmation. | Done for read-only P1B; delivery/download remain disabled. | `交付包`, `交付就绪度`, `输出规格`, `交付清单`, `待确认`. | P1B done |
| Delivery status | Delivery-specific readiness and blocker state are visible. | User-facing delivery state should explain readiness. | Done for mock-first read-only surface. | `草稿`, `已就绪`, `只读哨兵`, `等待确认`. | P1B done |
| External links/download | Not implemented, correctly blocked. | v2 may eventually need delivery links, but current frontend must not implement external delivery. | Keep disabled placeholders only; do not implement real links/download. | `外部交付未启用`, `下载未开放`, `需要人工审批`. | P0 enforced |

## Recommended Chinese Label Map

Use this as the first copy alignment pass before creating more pages.

| Current label | Recommended label |
|---|---|
| Command Center | 命令中心 |
| Command Center Alpha / mock read-only cockpit | 命令中心 Alpha / 只读模拟驾驶舱 |
| Risk | 风险雷达 |
| Risk Pulse | 风险雷达 |
| Approvals | 审批队列 |
| Approval Queue | 审批队列 |
| Projects | 项目执行 |
| Project Execution | 项目执行 |
| SKUs | SKU 覆盖 |
| SKU Matrix | SKU 覆盖矩阵 |
| SKU Coverage | SKU 覆盖率 |
| Assets | 素材收件箱 |
| Asset Watch | 素材巡检 |
| Reviews | 审核返修 |
| Review Sessions | 审核会话 |
| Deliveries | 交付包 |
| Delivery Packages | 交付包 |
| Activity | 活动时间线 |
| Activity Timeline | 活动时间线 |
| AI | Agent 巡检 |
| AI Inspection Feed | Agent 巡检 |
| Studio Context | 工作室概况 |
| Studio Operations | 工作室运营 |
| Studio Readiness | 工作室就绪度 |
| QC Health | 质检健康度 |
| Golden Path | 黄金生产链路 |
| Operator | 负责人 |
| Mode | 运行模式 |
| Assets | 素材数 |
| Delivery Set | 交付集 |
| Read-only | 只读 |
| Mock telemetry | 模拟遥测 |
| Intake | 接入 |
| Shoot | 拍摄 |
| Retouch | 精修 |
| Review | 审核 |
| Delivery | 交付 |
| Complete | 完成 |
| Waiting | 待处理 |
| Blocked | 阻塞 |
| Cleared | 已清除 |
| Low | 低风险 |
| Medium | 需关注 |
| High | 高风险 |

## Recommended Execution Order

1. Completed: Chinese-first Command Center and read-model surface copy.
2. Completed: local `--ps-*` token bridge and read-model text aliases.
3. Completed: Command Center shell, gauges, right rail, activity, and compact entity panel localization.
4. Completed: add fixture-aligned mock fields for the first Golden Product Loop:
   - `shotRequirements`
   - `assetBindings`
   - `qcChecks`
   - `retouchTasks`
   - `revisionRequests`
   - `deliveryReadiness`
5. Completed: deepen read-only Asset Inbox with thumbnail grid, binding state, right preview, and QC checklist.
6. Completed: deepen read-only QC / Retouch queue with failure reasons, severity, ownership, and retouch standards.
7. Completed: deepen Review Gallery with selected review item, client comment/revision state, status summary, and disabled public-review/write posture.
8. Completed: deepen Delivery Readiness with package/manifest summary, readiness checklist, blockers, output count, and disabled external delivery/download posture.
9. Completed: align cross-page context, read-only posture, and return navigation across all four read-model scenes.
10. Completed: expose the first Golden Product Loop IDs and four read-only entries from Command Center.
11. Completed: P2 cockpit polish for 1280px side rail and 390px topbar status.
12. Completed: P2 read-model cleanup for shared action pairs, shared metric strips, local boundary-state rehearsals, and README QA runway.
13. Completed: P2.5 RC hardening for Command Center entry clicks, visible keyboard focus, five-page responsive matrix, and boundary-state matrix.
14. Completed: P2.6 read-only click affordance pass for Command Center heading actions, read-model local selection, and disabled action posture.
15. Completed: P2.7 command rail scene hygiene for unique rail entries and hash-aware active state.
16. Completed: P2.8 Risk / Approval scene depth with direct hash stabilization and browser QA.
17. Completed: P2.9 Command Center side-detail view-model consolidation.
18. Completed: P2.10 Command Center gap table fact refresh.
19. Completed: P2.11 read-model workspace helper derivation into `readModelViewModels.ts`.
20. Completed: P2.12 read-model workspace component split into `readModelWorkspaces.tsx`.
21. Completed: P2.13 scripted read-only route QA for Command Center scenes plus four read-model pages at 1440px and 390px.
22. Completed: P2.14/P3.8 scripted read-model boundary-state QA for loading, error, missing-config, empty, partial, stale, forbidden, invalid-id, and missing-id idle states at 1024px and 390px.
23. Completed: P2.15 local validation orchestration with optional browser QA aggregation.
24. Completed: P2.16/P2.17 Bash validation helper parity plus read-model interaction QA.
25. Completed: P3.1/P3.2/P3.9 visible runtime state surfaces for read-model pages and Command Center, including Command Center forbidden/invalid-id read-boundary states.
26. Completed: P3.3/P3.4/P3.5 shared runtime chip renderer, centralized Golden Loop QA fixtures, and invalid debug-state fallback route QA.
27. Completed: P3.6/P3.7 post-commit board fact refresh plus Command Center Golden Loop entry-click QA and 1024px route/interaction matrix coverage.
28. Completed: S2 local backend connected/failure smoke aggregation through `scripts/qa-backend-read-all.ps1`.
29. Next: real backend read-model smoke remains blocked until a local or staging backend base URL is intentionally configured outside this repo.
30. Always run `scripts/validate-local.ps1`; add `-IncludeBrowserQa` after route/layout/read-model changes while the dev server is running.

## Stop Conditions

Stop before:

- backend changes
- dependency changes
- upload/download implementation
- auth/token/storage implementation
- external Review or Delivery links
- approval writes
- real file movement
- deployment or remote writes
