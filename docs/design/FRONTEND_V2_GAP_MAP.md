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
- DEV-only read-model boundary rehearsals exist for `readModelState=loading`, `readModelState=error`, and `readModelState=missing-config`; idle context handling is also browser-checked.
- README.md now documents the local Frontend v2 QA runway for Command Center, the four hash pages, 390px checks, and DEV-only state rehearsals.
- P2.5 RC hardening has browser-clicked the Command Center `黄金链路` entries, verified visible keyboard focus rings, and re-run the five-page RC matrix at 1440px / 1024px / 390px.
- P2.5 boundary-state matrix has rechecked loading, error, missing-config, and missing-id idle states at 1024px and 390px with no console errors or horizontal overflow.
- P2.6 click affordance pass has converted Command Center fake heading actions into real links, confirmed read-model card selection, and clarified disabled read-only action semantics.
- P2.7 command rail hygiene has reduced Command Center rail entries to unique hash scenes and added hash-aware `aria-current` active state.
- `--ps-*` token aliases and text-color compatibility aliases exist in `src/styles/tokens.css`.
- Current long-track focus is post-RC read-only UX tightening and optional backend read-model smoke testing only when a local backend base URL is explicitly configured.

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
| RC QA posture | Command Center entry clicks, keyboard focus visibility, five-page responsive matrix, and read-model boundary states have current browser evidence. | `.agent_board/VALIDATION_LOG.md` |

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
| Read-model boundary-state rehearsal. | DEV-only query states cover loading, error, missing-config, and missing-id idle checks without backend writes. | Keep these states local and read-only; do not use them as production auth/backend behavior. | P2 done |
| Local QA runway. | README documents local routes, 390px checks, and DEV-only boundary rehearsals. | Use the README route list before future P2/P3 visual or read-model changes. | P2 done |
| Keyboard focus visibility. | Command Center links and read-model tabs/cards now expose visible focus rings. | Keep future links/buttons/selectable cards covered by `:focus-visible` styles. | P2.5 done |
| RC browser matrix. | Command Center plus four read-model pages passed 1440px / 1024px / 390px checks; boundary states passed 1024px / 390px checks. | Re-run this matrix after route, layout, or shared style changes. | P2.5 done |
| Click affordance clarity. | Command Center heading actions navigate to target hash scenes; read-model cards select local detail; disabled actions expose read-only disabled posture. | Future visible actions must either navigate, update local read-only UI state, or remain clearly disabled. | P2.6 done |
| Command rail scene hygiene. | The rail now exposes one entry each for #risk, #projects, #approvals, #activity, and #inspections, with one hash-aware active state. | Keep future rail additions unique and browser-check `aria-current` after click. | P2.7 done |
| Optional backend read-model smoke. | Still intentionally not run in this frontend-only mock-first batch. | Run only with a deliberately configured local `VITE_BACKEND_API_BASE_URL` outside this repo. | P2 blocked |

## Command Center Gap Table

v2 target references: A + C visual anchors, UI/UX principles, information architecture, visual checklist.

| Dimension | Current frontend | v2 target | Gap | Copy alignment | Priority |
|---|---|---|---|---|---|
| Left navigation | Rail uses abbreviations and English titles: `Risk`, `Approvals`, `Projects`, `SKUs`, `Assets`, `Reviews`, `Activity`, `AI`, `Deliveries`. | Left Chinese navigation should clearly expose production scenes. | Structure exists, but the user-facing nav is not Chinese and scene naming is generic. | `风险雷达`, `审批队列`, `项目执行`, `SKU 覆盖`, `素材收件箱`, `审核返修`, `活动时间线`, `Agent 巡检`, `交付包`. | P0 |
| Top bar | `Command Center Alpha / mock read-only cockpit`, date/time, studio name. | Project switcher / search / risk summary / Agent status. Calm Chinese operator wording. | Good shell, but no search placeholder, risk summary, or Agent status copy. | `命令中心 Alpha / 只读模拟驾驶舱`, `当前项目`, `风险摘要`, `Agent 巡检在线`. | P1 |
| Visual tone | Premium dark cockpit is already close to approved direction. | Near-black cold blue, cold white text, restrained border, no cyberpunk, no SaaS table feeling. | Keep current direction; migrate new work to v2 token names and avoid extra saturated colors. | No visible copy change. | P0 |
| Main overview | Three-gauge cluster shows `SKU Coverage`, `Studio Readiness`, `QC Health`. | Keep the three operational gauges as the main anchor. | Visual anchor matches, but gauge labels and captions are English. | `SKU 覆盖率`, `工作室就绪度`, `质检健康度`, `已覆盖`, `待质检`. | P0 |
| Studio context | `Studio Context`, `Operator`, `Mode`, `Assets`, `Delivery Set`. | Owner/operator should see project health, today focus, risk, next action. | Context is useful but too generic; no "today's action" or delivery pressure language. | `工作室概况`, `负责人`, `运行模式`, `素材数`, `交付集`, `今日优先处理`. | P1 |
| Golden Path | Command Center exposes a compact `黄金链路` strip for the first fixture IDs and links to Asset / QC / Review / Delivery. | Golden Product Loop should expose client -> project -> SKU -> shot -> asset -> retouch -> QC -> review -> delivery. | P1B cockpit entry is done; deeper client/SKU/shot drilldown can remain P2. | `客户接入`, `拍摄`, `素材入库`, `精修`, `质检`, `客户审核`, `交付`. | P1B done |
| Right rail risk | `Risk Pulse` exists with high/medium/low. | Right side should show intelligent inspection, risk, pending work. Risk uses orange-red only. | Layout matches; copy should become calmer Chinese; include specific risk consequence. | `风险雷达`, `高风险`, `需关注`, `低风险`, `可能影响交付`. | P0 |
| Approval queue | `Approval Queue` exists with review/qc/delivery/retouch types. | Approval UI should show risk label, consequence, approval state, request id, activity link for L3/L4 later. | Queue exists, but lacks `request_id`, payload preview/hash, and plain-language consequence. Keep disabled/read-only. | `审批队列`, `待处理`, `已清除`, `阻塞`, `审批编号`, `影响说明`. | P1 |
| Activity timeline | Present in lower layer. | Bottom timeline should be visible and curated, not raw logs. | Exists, but English and visually secondary; OK for alpha. | `活动时间线`, `素材导入`, `质检失败`, `精修完成`, `交付包已准备`. | P0 |
| Agent inspection | `AI Inspection Feed` exists. | Agent is an inspector, not an unauthorized operator. | Label says AI, while v2 prefers Agent Inspector / Agent 巡检 language and safe suggestions. | `Agent 巡检`, `发现问题`, `建议动作`, `只读预览`, `不会自动执行`. | P0 |

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
16. Next: optional backend read-model smoke remains blocked until a local backend base URL is intentionally configured outside this repo.
17. Always run `npm run lint` and `npm run build` after code/style changes.

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
