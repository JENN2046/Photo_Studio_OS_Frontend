# TASK_QUEUE.md — Photo Studio OS Frontend

Persistent local task queue for sustained Codex autopilot.

This file is local project coordination state.
It does not authorize remote writes, commits, pushes, deployments, backend changes, dependency changes, secret changes, or destructive actions.

---

## Current Mission

```text
P3.6/P3.7 Read-only QA Matrix Hardening Batch
```

Mode:

```text
A4-Sustained Local Frontend Autopilot
```

Goal:

```text
Refresh post-commit board facts and harden the read-only browser QA matrix with Command Center Golden Loop entry-click checks plus 1024px middle viewport coverage.
```

---

## Queue Rules

Codex must:

1. Keep only one main task `in_progress` at a time.
2. Prefer small, local, reversible frontend-only tasks.
3. Continue automatically while safe tasks remain.
4. Add newly discovered safe tasks under `todo`.
5. Move completed tasks to `done`.
6. Move unsafe or blocked tasks to `blocked` with a reason.
7. Re-scan the repository when `todo` is empty.
8. Stop only for hard stop gates.

Codex must not use this queue to authorize:

- backend changes
- root control repo changes
- dependency additions
- `.env` or secret changes
- deployment
- push / PR / remote branch
- production writes
- destructive commands
- overwriting user-owned changes

---

## Hard Stop Gates

Stop and update `BLOCKERS.md` plus `HANDOFF.md` if the next step requires:

- backend repo modification
- root control repo modification
- dependency addition / upgrade / removal
- `.env`, secret, token, credential, or private URL change
- deployment / release / publish
- push / PR / remote branch / tag
- upload / download / auth / storage implementation
- production or external service write
- destructive command
- overwriting user-owned uncommitted work
- validation failure that requires scope expansion
- replacing the approved Command Center visual direction

---

## Queue

### in_progress

```text
none
```

### todo

Current safe queue after starting Batch B/C read-only QA matrix hardening.

```text
none
```

### done

```text
1. Inspected repo reality: branch, status, diff, scripts, package files, and current src structure.
2. Verified the existing Vite + React + TypeScript baseline.
3. Confirmed the Command Center screen and root component exist.
4. Refined the read-only Command Center shell as a local Alpha complete candidate.
5. Preserved the three-gauge visual anchor.
6. Verified Risk Pulse and Approval Queue read-only panels.
7. Verified Project Execution, Activity Timeline, and AI Inspection Feed read-only panels.
8. Kept command center mock data isolated under src/mocks.
9. Extracted local Command Center view model helpers.
10. Strengthened the mock read client by returning cloned snapshots.
11. Fixed desktop and narrow viewport Command Center title wrapping.
12. Ran lint, build, whitespace checks, secret scan, HTTP check, and headless Chrome screenshot QA.
13. Created local commit 180a708: feat: refine command center alpha.
14. Pushed commits 180a708 and 4f4e504 to origin/main after explicit approval.
15. Ran local QA at 1024px, 780px, and 390px state surfaces.
16. Fixed narrow viewport ordering so the primary gauge and main status surface appear before secondary rails.
17. Fixed narrow status message wrapping for long error text.
18. Added optional Command Center backend v2 read-model bridge in src/api while preserving mock-first default behavior.
19. Added typed read-only API fetchers for Asset Inbox, QC / Retouch Queue, Review Gallery, and Delivery Readiness.
20. Validated the five-endpoint API bridge with npm run lint, npm run build, and an HTTP 200 check against the existing local Vite server.
21. Pushed docs/design/FRONTEND_V2_GAP_MAP.md to origin/main in 57439ff.
22. Wired read-model surfaces into Command Center entry points in 4c7459c.
23. Localized Command Center and read-model surfaces, added mock-first read-model fixtures, and pushed a872b2b.
24. Refreshed frontend v2 implementation map and board state, pushed 0ddd546.
25. Aligned read-model mocks with the first Golden Product Loop fixture, pushed f5f6692.
26. Deepened #asset-inbox into a read-only production workspace, pushed eedf48a.
27. Deepened #qc-retouch into a read-only QC / Retouch workspace, pushed 3bbe680.
28. Cleared frontend v2 browser QA blockers: favicon 404 and 390px rail overflow, pushed c19e171.
29. Refreshed P1B/P2 completion track and pushed e529c3b.
30. Deepened #review-gallery into a read-only client review workspace with gallery grid, selected item, client feedback/revision state, status summary, disabled public review, and disabled feedback write posture.
31. Deepened #delivery-readiness into a read-only delivery outbox workspace with package/manifest summary, readiness checklist, blockers, output count, disabled download, and disabled external delivery posture.
32. Aligned all four read-model hash pages with a shared production context bar showing projectId, reviewSessionId, deliveryId, mock-first/read-only posture, and a return link to Command Center.
33. Strengthened Command Center production navigation with a `黄金链路` strip showing PRJ-128, REV-441, DEL-220, and four read-only page entries.
34. Ran final P1B browser QA for Command Center entry clicks, read-model tab switching, Chinese mock data, console errors, and 390px viewport overflow.
35. Fixed the P2 1280px cockpit breakpoint so Risk / Approval side rail remains in the right column instead of dropping below the main panel.
36. Added frontend-only backend read-model smoke contract notes without enabling backend, auth, tokens, uploads, downloads, or writes.
37. Extracted repeated read-only disabled action pairs across Asset Inbox, QC / Retouch, Review Gallery, and Delivery Readiness.
38. Committed and pushed the read-only action pair extraction as 59c04a5.
39. Ran the P2 browser-led cockpit pass at 1440px, 1024px, and 390px for Command Center and the four read-model hash pages; no console errors or horizontal overflow were observed.
40. Fixed the 390px Command Center status bar so studio, date, time, and live dot stay in one compact line.
41. Validated the mobile status bar batch with git diff --check, changed-file secret scan, npm run lint, npm run build, 390px screenshot inspection, overflow probe, and console error check.
42. Extracted the repeated read-model metric panel rendering into a shared ReadModelMetricStrip component without changing fetchers or data shape.
43. Browser-checked the four read-model hash pages at 390px after the metric strip extraction; each page retained 3 metric cards, no horizontal overflow, and console error count remained 0.
44. Added local DEV-only readModelState overrides for read-model loading, error, and missing-config boundary rehearsals.
45. Clarified read-model state notices with explicit status labels and mock-first/read-only posture.
46. Browser-checked loading, error, missing-config, and idle states at 390px with no horizontal overflow and console error count 0.
47. Documented the local Frontend v2 QA runway in README.md, including Command Center, four read-model hash routes, 390px expectations, and DEV-only readModelState rehearsals.
48. Refreshed docs/design/FRONTEND_V2_GAP_MAP.md with P2 cockpit polish, component consolidation, boundary-state rehearsal, local QA runway, and optional backend smoke blocker status.
49. Started P2.5 Frontend v2 Read-only RC Hardening from clean local commit 27ba2b5.
50. Browser-clicked Command Center 黄金链路 entries into Asset Inbox, QC / Retouch, Review Gallery, and Delivery Readiness; all headings and URLs were correct with console error count 0.
51. Hardened keyboard focus visibility for Command Center rail/production links/side links and read-model tabs/context/state/selectable cards.
52. Ran RC browser matrix at 1440px, 1024px, and 390px across Command Center plus four read-model pages; no horizontal overflow or console errors were observed.
53. Validated the focus hardening batch with git diff --check, changed-file secret scan, npm run lint, and npm run build.
54. Locally committed 6f1666b: improved RC keyboard focus visibility.
55. Re-ran the boundary-state matrix at 1024px and 390px for loading, error, missing-config, and missing-id idle states; no missing copy, horizontal overflow, or console errors were observed.
56. Refreshed README.md, FRONTEND_V2_GAP_MAP.md, and .agent_board with P2.5 RC hardening evidence.
57. Validated the P2.5 RC closeout docs batch with git diff --check, changed-file secret scan, npm run lint, and npm run build.
58. Fixed Command Center rail scene clicks so #projects, #activity, and #inspections visibly promote their target panel to the desktop first viewport.
59. Added active rail highlighting for #projects, #activity, #inspections, #risk, and #approvals.
60. Browser-validated rail scene clicks at 1513px and 390px with no horizontal overflow or console errors.
61. Validated the rail scene-click fix with git diff --check, changed-file secret scan, npm run lint, and npm run build.
62. Started P2.6 Read-only Click Affordance Pass from local commit ea67bc1.
63. Converted Command Center fake heading actions for Agent inspection and Risk detail into real hash navigation links.
64. Added explicit title, aria-disabled, disabled, and cursor affordances for shared read-only action buttons.
65. Browser-clicked Command Center heading actions in the in-app browser and verified they navigate to #inspections and #risk.
66. Browser-validated read-model local selection and disabled action semantics across Asset Inbox, QC / Retouch, Review Gallery, and Delivery Readiness.
67. Browser-validated a 10-route desktop/mobile matrix with no horizontal overflow or console errors.
68. Locally committed d68fdcf: clarified read-only click affordances.
69. Started P2.7 Command Rail Scene Hygiene from clean local commit d68fdcf.
70. Reduced the Command Center rail to five unique hash scene entries: #risk, #projects, #approvals, #activity, and #inspections.
71. Added hash-aware aria-current state in AppShell so exactly one Command Center rail target is exposed as the current page.
72. Browser-clicked all five rail scene entries in the in-app browser and verified one unique active state after each click.
73. Browser-validated # plus five rail scenes at 1513px and 390px with unique rail links, one active state, no horizontal overflow, and no console errors.
74. Locally committed ab11292: fix: make command rail scene state unique.
75. Started P2.8 Risk / Approval Scene Depth from clean local commit ab11292.
76. Added Command Center hash-derived data-scene state so direct #risk and #approvals loads reveal their target UI after React render.
77. Deepened #risk with read-only detail cards for risk impact, owner, and suggested next action.
78. Deepened #approvals with read-only detail cards for approval type, state, impact, and next step.
79. Browser-validated #risk and #approvals in the in-app browser and at 390px with no horizontal overflow or console errors.
80. Locally committed 96ef6ad: feat: deepen risk approval read-only scenes.
81. Started P2.9 Command Center Side-detail View Model from clean local commit 96ef6ad.
82. Moved risk detail and approval detail derivation into src/features/command-center/commandCenterViewModel.ts.
83. Kept CommandCenter.tsx focused on rendering the read-only detail cards.
84. Browser-validated #risk and #approvals in the in-app browser and at 390px after the view-model extraction.
85. Locally committed 6d33e17: refactor: derive command center side details.
86. Started P2.10 Command Center Gap Table Fact Refresh from clean local commit 6d33e17.
87. Refreshed the Command Center gap table to reflect current Chinese rail, topbar, gauges, golden loop, risk/approval details, activity, and Agent inspection state.
88. Locally committed 32ab2f6: refreshed Command Center gap table facts.
89. Started P2.11 Read-model Workspace View-model Cleanup from clean local commit 32ab2f6.
90. Moved asset label/tone helpers, QC result labels, review tone, delivery checklist labels, and delivery artifact derivation into src/features/read-models/readModelViewModels.ts.
91. Browser-validated the four read-model hash pages in the in-app browser and at 390px after the P2.11 view-model cleanup.
92. Validated P2.11 with git diff --check, changed-file secret scan, npm run lint, and npm run build.
93. Locally committed e3bd271: refactor: derive read model workspace details.
94. Started P2.12 Read-model Workspace Component Split from clean local commit e3bd271.
95. Created src/features/read-models/readModelWorkspaces.tsx for Asset Inbox, QC / Retouch, Review Gallery, and Delivery Readiness workspace components.
96. Reduced src/features/read-models/ReadModelPages.tsx to route params, read-model state, mock-first loading, state notices, context bar, and page shell orchestration.
97. Browser-validated #asset-inbox, #qc-retouch, #review-gallery, and #delivery-readiness in the in-app browser after the workspace component split.
98. Playwright CLI validated the four read-model hash pages at 390px with no horizontal overflow or console errors.
99. Validated P2.12 with git diff --check, changed-file secret scan, npm run lint, and npm run build.
100. Started P2.13 Read-only Route QA Matrix Automation from clean local commit 25110ed.
101. Added scripts/qa-readonly-routes.ps1 as a local Playwright CLI matrix runner without changing package.json or package-lock.json.
102. Covered #, #risk, #projects, #approvals, #activity, #inspections, #asset-inbox, #qc-retouch, #review-gallery, and #delivery-readiness.
103. Added desktop 1440x960 and mobile 390x844 checks for required selectors, expected Chinese copy, Command Center rail aria-current state, console errors, and horizontal overflow.
104. Fixed the route QA harness to use a temporary Playwright CLI filename so PowerShell native argument quoting does not strip JavaScript string quotes.
105. Added a short selector wait after hash navigation so React hash-scene updates are checked after render instead of racing the route transition.
106. Ran scripts/qa-readonly-routes.ps1 successfully across all 20 route/viewport checks.
107. Validated P2.13 with scripts/qa-readonly-routes.ps1, git diff --check, changed-file secret scan, npm run lint, and npm run build.
108. Started P2.14 Read-model Boundary State QA Automation from clean local commit 699a71c.
109. Added scripts/qa-readonly-boundary-states.ps1 as a local Playwright CLI matrix runner without changing package.json or package-lock.json.
110. Covered Asset Inbox, QC / Retouch, Review Gallery, and Delivery Readiness boundary states.
111. Added 1024x768 and 390x844 checks for loading, error, missing-config, and missing required id idle states.
112. Checked required state selectors, expected Chinese copy, retry button posture, absence of workspace content during boundary states, console errors, and horizontal overflow.
113. Ran scripts/qa-readonly-boundary-states.ps1 successfully across all 32 state/viewport checks.
114. Re-ran scripts/qa-readonly-routes.ps1 and validated P2.14 with git diff --check, changed-file secret scan, npm run lint, and npm run build.
115. Started P2.15 Local Validation Orchestrator from clean local commit 7eafcc8.
116. Added changed-file secret scan to scripts/validate-local.ps1.
117. Added optional -IncludeBrowserQa mode to scripts/validate-local.ps1 to run read-only route QA and read-model boundary-state QA.
118. Kept default validate-local mode light: npm gates, git diff --check, changed-file secret scan, and a clear browser-QA skip notice.
119. Documented the fast and full local validation commands in README.md and FRONTEND_V2_GAP_MAP.md.
120. Validated P2.15 with scripts/validate-local.ps1 -IncludeBrowserQa.
121. Re-ran scripts/validate-local.ps1 in default mode after final board updates.
122. Started P2.16/P2.17 from clean local commit 60b74a1.
123. Aligned scripts/validate-local.sh with changed-file secret scan and optional --include-browser-qa behavior.
124. Added scripts/qa-readonly-interactions.ps1 for read-model tab switching, local card selection, disabled action posture, console errors, and horizontal overflow.
125. Updated scripts/validate-local.ps1 -IncludeBrowserQa to include the new interaction QA matrix.
126. Ran scripts/qa-readonly-interactions.ps1 successfully at 1440x960 and 390x844.
127. Ran scripts/validate-local.ps1 default mode successfully after P2.16/P2.17 changes.
128. Ran bash scripts/validate-local.sh; it reached npm build but is blocked by the bash/WSL Node 18.19.1 toolchain and missing Rollup optional native package.
129. Ran git diff --check and changed-file secret scan successfully after final board updates.
130. Started P2.18 from clean local commit 1184d7d.
131. Added a Node.js runtime preflight to scripts/validate-local.sh before npm gates.
132. Documented the Bash helper's Vite 7 Node requirement in README.md and FRONTEND_V2_GAP_MAP.md.
133. Validated P2.18 with scripts/validate-local.ps1, Bash runtime-preflight check, git diff --check, and changed-file secret scan.
134. Started P2.19 from clean local commit fc6b2a0.
135. Added a matching Node.js runtime preflight to scripts/validate-local.ps1 before npm gates.
136. Updated README.md and FRONTEND_V2_GAP_MAP.md to describe both validation helpers as runtime-guarded.
137. Validated P2.19 with scripts/validate-local.ps1, Bash runtime-preflight check, git diff --check, and changed-file secret scan.
138. Started P2.20 from clean local commit 6605681.
139. Added scripts/qa-readonly-all.ps1 to run route, boundary-state, and interaction QA matrices in sequence.
140. Updated scripts/validate-local.ps1 and scripts/validate-local.sh browser-QA mode to call the aggregate QA script.
141. Updated README.md and FRONTEND_V2_GAP_MAP.md to document the full browser-QA aggregate entry point.
142. Validated P2.20 with scripts/validate-local.ps1, scripts/qa-readonly-all.ps1, git diff --check, and changed-file secret scan.
143. Started P3.1 from clean local commit 320b086.
144. Extended useBackendReadModel with a frontend-only runtime view for read source, transport posture, and mock-first/read-only boundary.
145. Updated all four read-model context bars to show source, runtime status, transport, and write boundary chips.
146. Added restrained runtime chip styling for mock, backend, debug, missing-config, and read-only states.
147. Documented P3.1 runtime state surface in README.md and FRONTEND_V2_GAP_MAP.md.
148. Validated P3.1 with scripts/validate-local.ps1, scripts/qa-readonly-all.ps1, git diff --check, and changed-file secret scan.
149. Started P3.2 from clean local commit 8c6b37d.
150. Extended useCommandCenterSnapshot with frontend-only runtime view metadata for initializing, mock, backend, error, and DEV debug states.
151. Rendered Command Center runtime chips for read source, runtime status, transport posture, and mock-first/read-only write boundary in ready/loading/error states.
152. Added restrained Command Center runtime chip styling without changing the three-gauge visual anchor.
153. Refreshed README.md and FRONTEND_V2_GAP_MAP.md with P3.2 runtime state facts.
154. Extended read-only route QA to assert Command Center runtime chip copy across ready/loading/error states.
155. Started Batch A P3.3/P3.4/P3.5 from clean local commit aad1371.
156. Added shared RuntimeChipList for Command Center and read-model runtime/context bars.
157. Added read-model route helpers for route IDs, labels, shared context query, and Command Center read-model href construction.
158. Centralized Golden Product Loop QA IDs and route hashes in scripts/qa-readonly-fixtures.ps1.
159. Updated route, boundary-state, and interaction QA scripts to reuse the shared read-only fixture.
160. Extended route QA with invalid commandCenterState and readModelState fallback coverage.
161. Refreshed README.md, FRONTEND_V2_GAP_MAP.md, and .agent_board for Batch A.
162. Validated Batch A with scripts/validate-local.ps1 and scripts/qa-readonly-all.ps1.
163. Locally committed 07e0e08: refactor: consolidate runtime qa fixtures.
164. Started Batch B/C from clean local commit 07e0e08.
165. Corrected .agent_board post-commit facts so Batch A is no longer described as pending commit.
166. Added shared QA fixture targets for the four Command Center 黄金链路 entry clicks.
167. Extended read-only route QA to include a 1024x768 middle viewport.
168. Extended read-model interaction QA to click Command Center 黄金链路 entries and verify target page, active tab, Golden Loop IDs, console errors, and horizontal overflow across 1440px, 1024px, and 390px.
169. Validated Batch B/C browser QA with scripts/qa-readonly-interactions.ps1 and scripts/qa-readonly-all.ps1.
170. Validated Batch B/C local gates with scripts/validate-local.ps1.
171. Started Frontend v2 Review Fix Pass from current main worktree, preserving untracked .claude/, .mcp.json, and .omc/.
172. Confirmed authState=signed-out is already supported as a DEV alias for internal no-auth.
173. Changed frontend backend-read default x-user-role hints from owner to operator across client/hook/smoke defaults and docs.
174. Confirmed Command Center subscene hashes parse as AppRoute values and pass currentRoute into AuthGate.
175. Clarified read/summary-only permission notices while preserving none => forbidden and read-only behavior.
176. Preserved empty/partial/stale readModelState mock data so available workspace content still renders.
177. Confirmed fetchReadModel data-envelope guard remains covered by backend read contract-map QA.
178. Added npm run qa:readonly and updated browser QA expectations for preserved data-state workspaces and clearer permission copy.
179. Validated Review Fix Pass with npm run lint, npm run build, scripts/validate-local.ps1, scripts/qa-readonly-all.ps1, git diff --check, and changed-file secret scan.
```

### blocked

```text
Optional backend read-model smoke remains blocked until a local backend base URL is intentionally configured outside this repo.
Full Bash validation helper execution remains blocked until the bash/WSL environment uses Node 20.19+ or 22.12+ and a compatible Rollup optional native package install.
```

### skipped

```text
none
```

---

## Task Template

When Codex adds a task, use:

```text
- [ ] ID:
      Title:
      Reason:
      Scope:
      Files likely affected:
      Validation:
      Risk:
      Stop condition:
```

When Codex completes a task, move it to `done` with:

```text
- [x] ID:
      Title:
      Changed files:
      Validation:
      Result:
```

When blocked, move it to `blocked` with:

```text
- [!] ID:
      Title:
      Blocker:
      Required human decision:
      Safe next action:
```
