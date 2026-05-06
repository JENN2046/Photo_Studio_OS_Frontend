# Photo Studio OS Frontend v2 Gap Map

Date: 2026-05-06
Target repo: `A:\Photo_Studio_OS_Frontend`
Source reference set: `A:\Photo_Studio_OS\.agent_board\references\photo_studio_v2`

This gap map compares the current read-only Frontend Alpha against the selected v2 product, UI, visual, token, and fixture references copied into the control workspace.

Boundary:

- This is a planning document only.
- The frontend remains read-only and mock-first.
- Do not add upload, download, auth, storage, external Review links, external Delivery links, approval writes, backend mutations, or production connections from this task.
- Current frontend `AGENTS.md`, repository reality, and approved Command Center Alpha scope override the v2 reference documents.

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
| App shell | Command Center-only cockpit with left rail, topbar, and anchor navigation. | `src/components/layout/AppShell.tsx` |
| Command Center | Implemented as a read-only mock page with gauge cluster, studio context, Golden Path, Risk Pulse, Approval Queue, Project Execution, Activity Timeline, AI Inspection Feed, SKU, Asset, Review, and Delivery summary panels. | `src/features/command-center/CommandCenter.tsx` |
| Data model | Mock-first `CommandCenterSnapshot` includes studio, coverage, qc, workflow stages, projects, skus, assets, reviews, deliveries, approvals, risks, activity, and AI inspection. | `src/api/types.ts`, `src/mocks/commandCenter.mock.ts` |
| Labels | Status, risk, approval, and stage labels are centralized, but still English. | `src/features/command-center/commandCenterViewModel.ts` |
| Visual tokens | Existing tokens use generic `--color-*` names. The v2 visual package expects `--ps-*` token usage for new v2 work. | `src/styles/tokens.css` |
| Dedicated pages | Asset Inbox, QC, Review, and Delivery are only compact Command Center sections, not dedicated scenes. | `src/features/command-center/CommandCenter.tsx` |

## Overall Gaps

| Gap | Impact | Recommended action | Priority |
|---|---|---|---|
| User-facing copy is mostly English. | Fails v2 visual checklist: all user-facing text should be Chinese. | Add a Chinese label map, then replace Command Center-visible labels without changing behavior. | P0 |
| v2 `--ps-*` visual tokens are copied but not used. | Future work may drift into generic color naming and inconsistent visual tone. | Introduce a local token bridge or migrate new v2 components to `--ps-*` names. | P0 |
| Command Center exists, but v2 Chinese Command Center structure is only partially aligned. | The page feels close visually, but not yet like the final Chinese production console. | Keep the current gauge anchor; localize nav/topbar/panels and tighten right rail / bottom timeline naming. | P0 |
| Asset Inbox / QC is not a real scene. | Missing the Capture One intake, binding, file info, right preview, and QC checklist workflow. | Add a read-only Asset Inbox scene or full-width section using mock data only. | P1 |
| QC is only represented as aggregate health and AI score. | QC failures are not explainable or actionable. | Add read-only QC checklist, failure reason, severity, and retouch feedback surfaces. | P1 |
| Review / Delivery are compact summaries only. | Client review state and delivery readiness are not visible enough for the Golden Product Loop. | Add read-only Review / Revision and Delivery readiness surfaces with disabled future-action placeholders. | P1 |
| Mock data does not mirror the v2 fixture exactly. | The first Golden Product Loop is not visible as `1 client / 1 project / 3 SKUs / 9 shots / 6 assets / 3 QC checks / 1 review / 1 delivery`. | Add fixture-aligned mock fields: `shotRequirements`, `qcChecks`, `revisionRequests`, `deliveryReadiness`, binding state. | P1 |

## Command Center Gap Table

v2 target references: A + C visual anchors, UI/UX principles, information architecture, visual checklist.

| Dimension | Current frontend | v2 target | Gap | Copy alignment | Priority |
|---|---|---|---|---|---|
| Left navigation | Rail uses abbreviations and English titles: `Risk`, `Approvals`, `Projects`, `SKUs`, `Assets`, `Reviews`, `Activity`, `AI`, `Deliveries`. | Left Chinese navigation should clearly expose production scenes. | Structure exists, but the user-facing nav is not Chinese and scene naming is generic. | `风险雷达`, `审批队列`, `项目执行`, `SKU 覆盖`, `素材收件箱`, `审核返修`, `活动时间线`, `Agent 巡检`, `交付包`. | P0 |
| Top bar | `Command Center Alpha / mock read-only cockpit`, date/time, studio name. | Project switcher / search / risk summary / Agent status. Calm Chinese operator wording. | Good shell, but no search placeholder, risk summary, or Agent status copy. | `命令中心 Alpha / 只读模拟驾驶舱`, `当前项目`, `风险摘要`, `Agent 巡检在线`. | P1 |
| Visual tone | Premium dark cockpit is already close to approved direction. | Near-black cold blue, cold white text, restrained border, no cyberpunk, no SaaS table feeling. | Keep current direction; migrate new work to v2 token names and avoid extra saturated colors. | No visible copy change. | P0 |
| Main overview | Three-gauge cluster shows `SKU Coverage`, `Studio Readiness`, `QC Health`. | Keep the three operational gauges as the main anchor. | Visual anchor matches, but gauge labels and captions are English. | `SKU 覆盖率`, `工作室就绪度`, `质检健康度`, `已覆盖`, `待质检`. | P0 |
| Studio context | `Studio Context`, `Operator`, `Mode`, `Assets`, `Delivery Set`. | Owner/operator should see project health, today focus, risk, next action. | Context is useful but too generic; no "today's action" or delivery pressure language. | `工作室概况`, `负责人`, `运行模式`, `素材数`, `交付集`, `今日优先处理`. | P1 |
| Golden Path | Current flow stages: intake, shoot, retouch, review, delivery. | Golden Product Loop should expose client -> project -> SKU -> shot -> asset -> retouch -> QC -> review -> delivery. | Current path omits explicit Shot Requirement, Asset Intake, QC, Activity / Audit Trail. | `客户接入`, `拍摄`, `素材入库`, `精修`, `质检`, `客户审核`, `交付`. | P1 |
| Right rail risk | `Risk Pulse` exists with high/medium/low. | Right side should show intelligent inspection, risk, pending work. Risk uses orange-red only. | Layout matches; copy should become calmer Chinese; include specific risk consequence. | `风险雷达`, `高风险`, `需关注`, `低风险`, `可能影响交付`. | P0 |
| Approval queue | `Approval Queue` exists with review/qc/delivery/retouch types. | Approval UI should show risk label, consequence, approval state, request id, activity link for L3/L4 later. | Queue exists, but lacks `request_id`, payload preview/hash, and plain-language consequence. Keep disabled/read-only. | `审批队列`, `待处理`, `已清除`, `阻塞`, `审批编号`, `影响说明`. | P1 |
| Activity timeline | Present in lower layer. | Bottom timeline should be visible and curated, not raw logs. | Exists, but English and visually secondary; OK for alpha. | `活动时间线`, `素材导入`, `质检失败`, `精修完成`, `交付包已准备`. | P0 |
| Agent inspection | `AI Inspection Feed` exists. | Agent is an inspector, not an unauthorized operator. | Label says AI, while v2 prefers Agent Inspector / Agent 巡检 language and safe suggestions. | `Agent 巡检`, `发现问题`, `建议动作`, `只读预览`, `不会自动执行`. | P0 |

## Asset Inbox / QC Gap Table

v2 target references: E / F visual anchors, role-based Photographer View, page mapping, frontend task 5.

| Dimension | Current frontend | v2 target | Gap | Copy alignment | Priority |
|---|---|---|---|---|---|
| Scene presence | Only `Asset Watch` compact list inside Command Center. | Dedicated Asset Inbox / QC scene. | No dedicated intake page, no production workspace. | `素材收件箱 / 质检中心`. | P1 |
| Capture One intake | Not represented. | Show Capture One Export Directory status. | Missing source folder / intake state / import batch summary. | `Capture One 导出目录`, `导入批次`, `等待登记`, `已登记`. | P1 |
| Thumbnail grid | Current asset list is text-only with generated abstract markers. | Image-first thumbnail grid with binding and QC badges. | No image grid, no selected asset state. | `素材缩略图`, `选中素材`, `可用`, `需检查`, `不通过`. | P1 |
| Binding state | Asset summary has `skuId` and `usage`, but no Shot Requirement binding. | Bind asset to SKU and ShotRequirement. | Missing shot requirement target and binding confidence/status. | `绑定 SKU`, `绑定 Shot Requirement`, `未绑定`, `绑定冲突`. | P1 |
| File info | Current shows file name and usage only. | File info should be visible: name, format, source, capture time, size, profile if available. | Missing file metadata display. | `文件信息`, `文件名`, `格式`, `来源`, `拍摄时间`, `色彩配置`. | P2 |
| Right preview | Not present. | Right side large image preview. | Missing preview panel and selected-asset details. | `右侧预览`, `素材详情`, `放大检查`. | P1 |
| QC checklist | Not present in Asset surface. | QC checklist visible beside preview. | Missing checklist categories and pass/warn/fail state. | `质检清单`, `曝光`, `构图`, `裁切`, `阴影`, `商品标签可见`. | P1 |
| Risk highlight | Inspection score is shown, but not explained. | Risk points should be specific and restrained. | Score lacks reason/actionability. | `风险点`, `原因`, `建议复查`, `需返修`. | P1 |

## QC Gap Table

v2 target references: G visual anchor, role-based Retoucher View, visual checklist, frontend task 6.

| Dimension | Current frontend | v2 target | Gap | Copy alignment | Priority |
|---|---|---|---|---|---|
| QC scene | Aggregate `QC Health` gauge and `AI Inspection Feed`. | Dedicated QC surface that explains failure reasons. | No QC queue/checklist/detail page. | `质检中心`, `QC 队列`. | P1 |
| QC states | `passed`, `flagged`, `pending` in data; no per-check result. | Pass / warning / fail per QC check. | Missing `qcChecks` array and per-asset result. | `通过`, `警告`, `失败`, `待质检`. | P1 |
| Failure reason | AI finding text exists, but QC failure model is absent. | QC failure reason must be specific. | No structured reason, severity, owner, or retouch action. | `失败原因`, `返修意见`, `影响范围`, `负责人`. | P1 |
| Retouch feedback | Retouch exists only as workflow status and approval type. | Retoucher should see standard, deadline, revision notes, references. | Missing retouch task standard and due date. | `修图标准`, `截止时间`, `返修说明`, `参考图`. | P2 |
| Visual layout | Compact feed. | Queue lanes plus large preview and feedback detail. | No selected asset/large image inspection layout. | `待修`, `修图中`, `QC 失败`, `返修`, `已通过`. | P2 |

## Review / Delivery Gap Table

v2 target references: role-based Client Review View, information architecture, page mapping, Golden Product Loop acceptance.

| Dimension | Current frontend | v2 target | Gap | Copy alignment | Priority |
|---|---|---|---|---|---|
| Review scene | `Review Sessions` compact list. | Review / Revision scene with reviewable assets, feedback, approval status, revision deadline. | No review gallery, selected item, comment summary, or revision loop. | `审核与返修`, `待客户审核`, `已批准`, `需返修`, `返修截止`. | P1 |
| Review state | Uses generic approval states. | Client-facing review progress should be clear and calm. | `waiting/blocked/cleared` not enough for client review semantics. | `待审核`, `需反馈`, `已确认`, `需修改`. | P1 |
| Feedback panel | Not present. | Comment field / feedback panel is expected, but alpha should remain read-only. | Need read-only feedback summary or disabled placeholder. | `客户反馈`, `修改意见`, `只读预览`, `写入功能未启用`. | P2 |
| Delivery scene | `Delivery Packages` compact list. | Delivery readiness, outbox state, package contents, confirmation. | No readiness checklist, output specs, blockers, or confirmation state. | `交付包`, `交付就绪度`, `输出规格`, `交付清单`, `待确认`. | P1 |
| Delivery status | Raw `ready`, `sentinel`, `draft` can leak into UI. | User-facing delivery state should explain readiness. | Needs mapping. | `草稿`, `已就绪`, `只读哨兵`, `等待确认`. | P0 |
| External links/download | Not implemented, correctly blocked. | v2 may eventually need delivery links, but current frontend must not implement external delivery. | Keep disabled placeholders only. | `外部交付未启用`, `下载未开放`, `需要人工审批`. | P0 |

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

1. Add a frontend Chinese label map for Command Center visible copy.
2. Bridge or adopt the copied v2 `--ps-*` visual tokens for new v2 page work.
3. Localize Command Center shell, gauges, right rail, activity, and compact entity panels.
4. Add fixture-aligned mock fields for the first Golden Product Loop:
   - `shotRequirements`
   - `assetBindings`
   - `qcChecks`
   - `retouchTasks`
   - `revisionRequests`
   - `deliveryReadiness`
5. Create read-only Asset Inbox / QC surface with thumbnail grid, binding state, right preview, and QC checklist.
6. Create read-only QC / Retouch queue surface with failure reasons and retouch standards.
7. Create read-only Review / Delivery surface with review gallery summary, revision state, delivery readiness, and disabled future external actions.
8. Run `npm run lint` and `npm run build` after code/style changes.

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
