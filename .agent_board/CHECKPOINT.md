# CHECKPOINT.md — Photo Studio OS Frontend

Resume-ready checkpoint for sustained frontend autopilot.

Codex should update this after each meaningful batch of local frontend work.

---

## Latest Checkpoint

```text
Status: complete-candidate
Updated: 2026-05-07 19:15 +0800
Repo: Photo_Studio_OS_Frontend
Mode: A4-Sustained Local Frontend Autopilot
Mission: P3.3/P3.4/P3.5 Runtime QA Consolidation Batch
```

---

## Repository Reality

Fill from actual command output.

```text
Workspace: A:\Photo_Studio_OS_Frontend
Branch: main
Worktree: intentionally editing Batch A source/docs/scripts/.agent_board after local aad1371; final validation and local commit pending
Diff stat: RuntimeChipList.tsx, CommandCenter.tsx, ReadModelPages.tsx, readModelRoutes.ts, global.css, readModelPages.css, QA scripts, README.md, FRONTEND_V2_GAP_MAP.md, and .agent_board
Package manager: npm with package-lock.json
Available scripts: dev, build, lint, preview
```

Recommended commands:

```bash
git branch --show-current
git status --short
git diff --stat
npm run
```

---

## Completed Since Last Checkpoint

```text
Pushed 0ddd546: refreshed frontend v2 implementation map.
Pushed f5f6692: aligned read-model mocks with Golden Product Loop.
Pushed eedf48a: deepened Asset Inbox into a read-only production workspace.
Pushed 3bbe680: deepened QC / Retouch into a read-only queue workspace.
Pushed c19e171: cleared favicon 404 and 390px rail overflow browser QA blockers.
Started P1B Review / Delivery realization run.
Pushed e529c3b: refreshed the P1B/P2 gap map and task rail.
Pushed da8f32b: deepened #review-gallery into a read-only client review workspace.
Pushed 4f61aa6: deepened #delivery-readiness into a read-only delivery outbox workspace.
Pushed f249a8a: implemented a shared read-model context bar for #asset-inbox, #qc-retouch, #review-gallery, and #delivery-readiness.
Pushed c1dd63f: implemented Command Center 黄金链路 strip and refreshed P1B completion docs/board.
Pushed 9b47889: fixed P2 1280px cockpit breakpoint so Risk / Approval rail remains visible in the right column.
Pushed 11b4b5e: added frontend-only backend read-model smoke contract notes.
Pushed 59c04a5: extracted repeated read-only disabled action pairs.
Started P2 Read-only Cockpit Maturation.
Ran browser-led cockpit QA at 1440px, 1024px, and 390px for Command Center plus #asset-inbox, #qc-retouch, #review-gallery, and #delivery-readiness.
Fixed the 390px Command Center status bar so studio, date, time, and live dot remain one compact line.
Locally committed 472d848: tightened mobile Command Center status bar.
Extracted repeated read-model metric panel rendering into a shared ReadModelMetricStrip component.
Browser-checked #asset-inbox, #qc-retouch, #review-gallery, and #delivery-readiness at 390px after the metric strip extraction.
Locally committed 078f894: shared read-model metric strip.
Added DEV-only readModelState boundary rehearsals for loading, error, and missing-config.
Clarified read-model state notices with mock-first/read-only status labels.
Browser-checked loading, error, missing-config, and idle states at 390px.
Locally committed f7b1b8f: rehearsed read-model boundary states.
Documented the local Frontend v2 QA runway in README.md.
Locally committed 1265584: documented frontend v2 QA runway.
Refreshed FRONTEND_V2_GAP_MAP.md with P2 completion facts and optional backend smoke blocker status.
Locally committed 27ba2b5: refreshed P2 frontend completion map.
Started P2.5 RC hardening from a clean worktree.
Browser-clicked Command Center 黄金链路 entries into all four read-model hash pages.
Hardened keyboard focus visibility across Command Center rail/production/side links and read-model tabs/context/state/selectable cards.
Ran the RC browser matrix at 1440px, 1024px, and 390px across Command Center plus four read-model pages.
Locally committed 6f1666b: improved RC keyboard focus visibility.
Re-ran the boundary-state matrix at 1024px and 390px for loading, error, missing-config, and missing-id idle states.
Refreshed README.md, FRONTEND_V2_GAP_MAP.md, and .agent_board with P2.5 RC hardening evidence.
Locally committed 4cc1539: closed the P2.5 RC hardening runway.
Fixed Command Center rail scene clicks so selected command scenes visibly switch focus instead of only changing the hash.
Browser-validated rail clicks at 1513px and 390px for #projects, #activity, #inspections, #risk, and #approvals.
Locally committed ea67bc1: fixed Command Center rail scene click visibility.
Started P2.6 Read-only Click Affordance Pass.
Converted Command Center heading actions for Agent inspection and Risk detail from fake labels into real scene links.
Added explicit disabled title/aria/cursor semantics to shared read-only action buttons.
Browser-clicked heading actions in the in-app browser and verified navigation to #inspections and #risk.
Browser-validated read-model local selection and disabled action semantics across Asset Inbox, QC / Retouch, Review Gallery, and Delivery Readiness.
Browser-validated the 10-route desktop/mobile matrix with no horizontal overflow or console errors.
Locally committed d68fdcf: clarified read-only click affordances.
Started P2.7 Command Rail Scene Hygiene.
Reduced Command Center rail to five unique hash scene entries.
Added hash-aware aria-current state in AppShell.
Browser-clicked all five rail scene entries in the in-app browser with one unique active state after each click.
Browser-validated # plus five rail scenes at 1513px and 390px with no horizontal overflow or console errors.
Locally committed ab11292: fixed command rail scene state uniqueness.
Started P2.8 Risk / Approval Scene Depth from a clean worktree after ab11292.
Added hash-derived Command Center data-scene state so direct #risk and #approvals loads reveal scene UI after React render.
Deepened #risk with read-only detail cards for risk impact, owner, and suggested action.
Deepened #approvals with read-only detail cards for approval type, state, impact, and next step.
Browser-validated #risk and #approvals in the in-app browser and at 390px with no horizontal overflow or console errors.
Locally committed 96ef6ad: deepened risk / approval read-only scenes.
Started P2.9 Command Center Side-detail View Model from clean local commit 96ef6ad.
Moved risk and approval detail derivation into commandCenterViewModel.ts.
Kept CommandCenter.tsx focused on rendering detail cards from view-model helpers.
Browser-validated #risk and #approvals in the in-app browser and at 390px after the extraction.
Locally committed 6d33e17: derived Command Center side details from the view-model layer.
Started P2.10 Command Center Gap Table Fact Refresh from clean local commit 6d33e17.
Refreshed the stale Command Center gap table so it no longer describes old English rail/topbar/gauge/Agent states as current.
Locally committed 32ab2f6: refreshed Command Center gap table facts.
Started P2.11 Read-model Workspace View-model Cleanup from clean local commit 32ab2f6.
Moved asset label/tone helpers, QC result labels, review item tone, delivery checklist labels, and delivery artifact derivation from ReadModelPages.tsx into readModelViewModels.ts.
Kept all four read-model pages mock-first/read-only and did not touch backend fetchers, mocks, CSS, dependencies, or package files.
Browser-checked the four read-model hash pages in the in-app browser and at 390px with no console errors or horizontal overflow.
Locally committed e3bd271: derived read-model workspace details.
Started P2.12 Read-model Workspace Component Split from clean local commit e3bd271.
Created readModelWorkspaces.tsx and moved the four workspace components plus their local shared primitives into it.
Reduced ReadModelPages.tsx to route params, read-model state, mock-first loading, state notices, context bar, and page shell orchestration.
Browser-checked the four read-model hash pages in the in-app browser after the component split.
Playwright CLI checked all four read-model hash pages at 390px with no horizontal overflow or console errors.
Started P2.16/P2.17 validation parity and interaction QA from clean local commit 60b74a1.
Aligned scripts/validate-local.sh with changed-file secret scan and optional --include-browser-qa behavior.
Added scripts/qa-readonly-interactions.ps1 for tab switching, local card selection, disabled action posture, console errors, and horizontal overflow.
Added the interaction QA script to scripts/validate-local.ps1 -IncludeBrowserQa.
scripts/qa-readonly-interactions.ps1 passed at 1440x960 and 390x844.
scripts/validate-local.ps1 default mode passed.
bash scripts/validate-local.sh reached npm build but is blocked by the bash/WSL Node 18.19.1 toolchain and missing Rollup optional native package.
git diff --check and changed-file secret scan passed.
Started P2.18 Bash validation runtime guard from clean local commit 1184d7d.
Added Node.js runtime preflight to scripts/validate-local.sh before npm gates.
Documented the Bash helper's Vite 7 Node requirement in README.md and FRONTEND_V2_GAP_MAP.md.
Started P2.19 PowerShell validation runtime guard from clean local commit fc6b2a0.
Added matching Node.js runtime preflight to scripts/validate-local.ps1 before npm gates.
Updated README.md and FRONTEND_V2_GAP_MAP.md so both validation helpers are documented as runtime-guarded.
Started P2.20 Full Browser QA Aggregation from clean local commit 6605681.
Added scripts/qa-readonly-all.ps1 as a single route, boundary-state, and interaction QA entry point.
Updated scripts/validate-local.ps1 and scripts/validate-local.sh browser-QA mode to call the aggregate script.
Updated README.md and FRONTEND_V2_GAP_MAP.md to document the full browser-QA aggregate entry point.
Started P3.1 Read-model Runtime State Surface from clean local commit 320b086.
Extended useBackendReadModel with frontend-only runtime view metadata.
Updated all four read-model context bars to show read source, runtime status, transport posture, and mock-first/read-only write boundary.
Added restrained runtime chip styling for mock, backend, debug, missing-config, and read-only states.
Committed 8c6b37d: exposed read model runtime state.
Started P3.2 Command Center Runtime State Surface from clean local commit 8c6b37d.
Extended useCommandCenterSnapshot with frontend-only runtime view metadata.
Rendered Command Center runtime chips in ready/loading/error states for read source, runtime status, transport posture, and mock-first/read-only write boundary.
Added restrained Command Center runtime chip styling while preserving the three-gauge cockpit anchor.
Updated README.md and FRONTEND_V2_GAP_MAP.md with P3.2 facts.
Extended scripts/qa-readonly-routes.ps1 to assert Command Center runtime chip copy across ready/loading/error states.
Committed aad1371: exposed Command Center runtime state.
Started Batch A P3.3/P3.4/P3.5 from clean local commit aad1371.
Added RuntimeChipList as a shared frontend-only runtime chip renderer.
Moved read-model route IDs, labels, shared query preservation, and Command Center read-model href construction into readModelRoutes.ts.
Centralized Golden Product Loop QA IDs and read-model route hashes in scripts/qa-readonly-fixtures.ps1.
Updated route, boundary-state, and interaction QA scripts to reuse the shared fixture.
Extended route QA to verify invalid commandCenterState and readModelState values fall back to the normal mock-first ready path.
```

---

## Changed Files

```text
docs/design/FRONTEND_V2_GAP_MAP.md
.agent_board/CHECKPOINT.md
.agent_board/RUN_STATE.md
.agent_board/TASK_QUEUE.md
.agent_board/VALIDATION_LOG.md
.agent_board/HANDOFF.md
README.md
src/components/panels/RuntimeChipList.tsx
src/features/command-center/CommandCenter.tsx
src/features/read-models/ReadModelPages.tsx
src/features/read-models/readModelRoutes.ts
src/features/read-models/readModelPages.css
src/styles/global.css
scripts/qa-readonly-fixtures.ps1
scripts/qa-readonly-routes.ps1
scripts/qa-readonly-boundary-states.ps1
scripts/qa-readonly-interactions.ps1
```

---

## Validation Run

```text
Current focus hardening batch:
- npm run lint passed.
- Command Center scoped 黄金链路 entry clicks passed for Asset Inbox, QC / Retouch, Review Gallery, and Delivery Readiness.
- RC browser matrix passed at 1440px, 1024px, and 390px across Command Center plus four read-model pages.
- Focus smoke confirmed selectable read-model cards use 2px solid focus ring.
- Console error count was 0.
- git diff --check passed.
- changed-file secret scan passed.
- npm run build passed.

Current P2.5 RC closeout docs batch:
- Boundary-state matrix passed at 1024px and 390px for loading, error, missing-config, and missing-id idle states.
- No missing expected copy, horizontal overflow, or console errors were observed.
- git diff --check passed.
- changed-file secret scan passed.
- npm run lint passed.
- npm run build passed.

Current rail scene-click fix:
- 1513px rail clicks passed for #projects, #activity, #inspections, #risk, and #approvals.
- #projects, #activity, and #inspections promote the selected panel to the desktop first viewport.
- #risk and #approvals expand/highlight the right-side target panel.
- 390px rail clicks scroll to the target scene with no horizontal overflow.
- Console error count was 0.
- git diff --check passed.
- changed-file secret scan passed.
- npm run lint passed.
- npm run build passed.

Current P2.6 click affordance pass:
- In-app browser verified Command Center `查看全部` navigates to #inspections.
- In-app browser verified Command Center `查看详情` navigates to #risk.
- Playwright CLI verified read-model local selection changes selected detail across Asset Inbox, QC / Retouch, Review Gallery, and Delivery Readiness.
- Playwright CLI verified shared disabled action buttons expose title, aria-disabled, disabled, and not-allowed cursor posture.
- Playwright CLI verified 10 routes at 1440px and 390px with no horizontal overflow or console errors.
- git diff --check passed.
- changed-file secret scan passed.
- npm run lint passed.
- npm run build passed.

Current P2.7 command rail scene hygiene:
- In-app browser verified the rail has 5 scene links.
- In-app browser clicked #risk, #projects, #approvals, #activity, and #inspections; each target had exactly one matching link and one aria-current state.
- Playwright CLI verified # plus five rail scenes at 1513px and 390px.
- Each checked route retained 5 rail links, one link for each scene hash, one active state, no horizontal overflow, and no console errors.
- npm run lint passed before board update.
- git diff --check passed.
- changed-file secret scan passed.
- npm run lint passed.
- npm run build passed.

Current P2.8 risk / approval scene depth:
- npm run lint passed after source changes.
- In-app browser verified #risk shows 3 risk detail cards, owner/action copy, hides approval details, and has console error count 0.
- In-app browser verified #approvals shows 4 approval detail cards, next-step/read-only copy, hides risk details, and has console error count 0.
- Playwright CLI verified direct #risk and #approvals loads at 390px set data-scene, reveal matching details, hide the other detail list, and have no horizontal overflow.
- Playwright CLI console error check returned 0 errors.

Current P2.9 side-detail view-model cleanup:
- npm run lint passed after source changes.
- In-app browser verified #risk and #approvals retain the expected visible detail copy after the view-model extraction.
- Playwright CLI verified direct #risk and #approvals loads at 390px with no horizontal overflow and console error count 0.

Current P2.10 gap table fact refresh:
- Docs-only diff inspected.
- git diff --check passed.
- changed-file secret scan passed.

Current P2.11 read-model workspace view-model cleanup:
- npm run lint passed after source changes.
- In-app browser verified #asset-inbox, #qc-retouch, #review-gallery, and #delivery-readiness headings, tab count, metric count, key read-only copy, and console error count 0.
- Playwright CLI 390px matrix verified all four read-model hash pages have one workspace console, 4 tabs, 3 metrics, expected copy, no horizontal overflow, and console error count 0.
- git diff --check passed.
- changed-file secret scan passed.
- npm run lint passed.
- npm run build passed.

Current P2.12 read-model workspace component split:
- npm run lint passed after source changes.
- In-app browser verified #asset-inbox, #qc-retouch, #review-gallery, and #delivery-readiness each have one heading, one workspace console, 4 tabs, 3 metrics, expected read-only copy, and console error count 0.
- Playwright CLI 390px matrix verified all four read-model hash pages have one workspace console, 4 tabs, 3 metrics, expected read-only copy, no horizontal overflow, and console error count 0.
- git diff --check passed.
- changed-file secret scan passed.
- npm run lint passed.
- npm run build passed.

Current P2.13 read-only route QA matrix automation:
- Added scripts/qa-readonly-routes.ps1 as a local Playwright CLI route matrix without adding project dependencies.
- The script covers #, #risk, #projects, #approvals, #activity, #inspections, #asset-inbox, #qc-retouch, #review-gallery, and #delivery-readiness.
- The script checks 1440x960 and 390x844 for expected Chinese copy, required selectors, Command Center rail aria-current state, console errors, and horizontal overflow.
- First run exposed a harness quoting issue with inline JavaScript passed through Windows PowerShell native arguments; fixed by using a temporary Playwright CLI filename.
- Second run exposed a hash navigation race on desktop Asset Inbox; fixed by waiting briefly for the target selector after hash navigation.
- scripts/qa-readonly-routes.ps1 passed across all 20 route/viewport checks.
- git diff --check passed.
- changed-file secret scan passed.
- npm run lint passed.
- npm run build passed.

Current P2.14 read-model boundary-state QA automation:
- Added scripts/qa-readonly-boundary-states.ps1 as a local Playwright CLI boundary-state matrix without adding project dependencies.
- The script covers Asset Inbox, QC / Retouch, Review Gallery, and Delivery Readiness.
- The script checks loading, error, missing-config, and missing required id idle states at 1024x768 and 390x844.
- Checks include required state selectors, expected Chinese copy, retry button posture, absence of workspace content during boundary states, console errors, and horizontal overflow.
- scripts/qa-readonly-boundary-states.ps1 passed across all 32 state/viewport checks.
- scripts/qa-readonly-routes.ps1 passed after the boundary-state script was added.
- git diff --check passed.
- changed-file secret scan passed.
- npm run lint passed.
- npm run build passed.

Current P2.15 local validation orchestration:
- Added changed-file secret scan to scripts/validate-local.ps1.
- Added optional -IncludeBrowserQa mode to run scripts/qa-readonly-routes.ps1 and scripts/qa-readonly-boundary-states.ps1.
- Default validate-local mode remains lightweight and prints a clear browser-QA skip notice.
- Fixed the validation helper's secret-scan self-check so the scanner does not match its own scan pattern text.
- scripts/validate-local.ps1 passed in default mode.
- scripts/validate-local.ps1 -IncludeBrowserQa passed, including route QA and boundary-state QA.

Current P2.16/P2.17 validation parity and interaction QA:
- Aligned scripts/validate-local.sh with changed-file secret scan and optional --include-browser-qa behavior.
- Added scripts/qa-readonly-interactions.ps1 for tab switching, local card selection, disabled action posture, console errors, and horizontal overflow.
- Added the interaction QA script to scripts/validate-local.ps1 -IncludeBrowserQa.
- scripts/qa-readonly-interactions.ps1 passed at 1440x960 and 390x844.
- scripts/validate-local.ps1 default mode passed.
- bash scripts/validate-local.sh reached npm build but is blocked by the bash/WSL Node 18.19.1 toolchain and missing Rollup optional native package.
- git diff --check passed.
- changed-file secret scan passed.

Current P2.18 Bash validation runtime guard:
- scripts/validate-local.sh now checks Node.js before npm gates.
- Incompatible Bash/WSL Node versions now fail with a clear Vite 7 requirement message instead of reaching npm build first.
- scripts/validate-local.ps1 passed.
- bash scripts/validate-local.sh reported Node.js 18.19.1 plus Vite 7's Node.js 20.19+ or 22.12+ requirement before exiting.
- git diff --check passed.
- changed-file secret scan passed.

Current P2.19 PowerShell validation runtime guard:
- scripts/validate-local.ps1 now checks Node.js before npm gates.
- PowerShell and Bash validation helpers now expose the same Vite 7 runtime requirement before lint/build.
- scripts/validate-local.ps1 passed with Node.js 22.22.0, lint, build, git diff --check, and changed-file secret scan.
- bash scripts/validate-local.sh reported Node.js 18.19.1 plus Vite 7's Node.js 20.19+ or 22.12+ requirement before exiting.

Current P2.20 full browser QA aggregation:
- scripts/qa-readonly-all.ps1 runs route, boundary-state, and interaction matrices in sequence.
- scripts/validate-local.ps1 and scripts/validate-local.sh browser-QA mode now call the aggregate script.
- scripts/validate-local.ps1 passed.
- scripts/qa-readonly-all.ps1 passed route, boundary-state, and interaction matrices.
- git diff --check passed.
- changed-file secret scan passed.

Current P3.1 read-model runtime state surface:
- scripts/validate-local.ps1 passed.
- scripts/qa-readonly-all.ps1 passed route, boundary-state, and interaction matrices.
- git diff --check passed.
- changed-file secret scan passed.

Current P3.2 Command Center runtime state surface:
- scripts/validate-local.ps1 passed with Node.js 22.22.0, npm run lint, npm run build, git diff --check, and changed-file secret scan.
- scripts/qa-readonly-all.ps1 passed.
- Route QA covered 12 routes at 1440x960 and 390x844, including Command Center ready/loading/error runtime chip checks.
- Boundary-state QA covered 16 read-model cases at 1024x768 and 390x844.
- Interaction QA covered read-model tabs, local selection, and disabled actions at 1440x960 and 390x844.

Current Batch A runtime QA consolidation:
- npm run lint passed after source/script changes.
- scripts/validate-local.ps1 passed after an elevated rerun for the known Vite/esbuild spawn EPERM sandbox limitation.
- scripts/qa-readonly-all.ps1 passed route, boundary-state, and interaction matrices.
- Route QA covered 14 routes at 1440x960 and 390x844, including invalid commandCenterState and readModelState fallback checks.
- Boundary-state QA covered 16 read-model cases at 1024x768 and 390x844.
- Interaction QA covered read-model tabs, local selection, and disabled actions at 1440x960 and 390x844.
```

---

## Validation Not Run

```text
No npm test script is defined.
No backend live integration request is needed for this mock-first UI batch.
No push is authorized for this batch until the user explicitly asks for push.
Full Bash helper validation awaits a compatible bash/WSL Node 20.19+ or 22.12+ environment and Rollup optional native package availability; P2.18 makes that blocker explicit before npm gates.
```

---

## Validation Failures

```text
bash scripts/validate-local.sh cannot complete full validation in the current bash/WSL environment because Node.js is 18.19.1 and the Rollup optional native package is unavailable there. P2.18 changes this into an early runtime preflight failure.
```

---

## Remaining Safe Tasks

```text
Next safe local P3 slice can continue after committing Batch A.
```

---

## Blockers

```text
none
```

---

## Remaining Risks

```text
No known uncommitted user-owned changes at the start of this run.
Live backend toggle still requires configuring VITE_BACKEND_API_BASE_URL and running the backend stack.
The QA script uses transient npx @playwright/cli execution and does not change dependency manifests.
The boundary-state QA script uses transient npx @playwright/cli execution and does not change dependency manifests.
The centralized QA fixture is local only and does not alter backend contracts or production IDs.
The Bash validation helper source is updated, but full Bash execution is environment-blocked until bash/WSL Node matches Vite's required version range.
```

---

## Next Safe Task

```text
Run final validation; commit Batch A locally if final staged checks are green, then stop at remote push boundary.
```

---

## Resume Instruction

```text
Read AGENTS.md.
Read .agent_board/TASK_QUEUE.md.
Read this CHECKPOINT.md.
Verify repository reality.
Continue from Next Safe Task if no hard stop gate is present.
```
