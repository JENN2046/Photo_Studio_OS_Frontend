# AGENTS.md — Photo Studio OS Frontend Sustained Autopilot Final v1.0

Project-level instructions for Codex working inside `Photo_Studio_OS_Frontend`.

Version: Final v1.0. Focus: sustained local autopilot, explicit task decomposition, no-churn control, checkpoint handoff, and Command Center Alpha completion criteria.

This file narrows the global Codex behavior for this specific frontend repository and raises local autonomy for the read-only frontend Alpha. It does not weaken global hard stop gates. If this file conflicts with actual repository files, current command output, or the user's latest instruction, repository reality and the latest instruction win inside safety boundaries.

---

## 0. Core Directive


Codex should keep moving for a long time inside safe local frontend boundaries.

Default posture:

```text
Continue by default.
Stop only at real stop gates.
Validate honestly.
Never cross backend, remote, dependency, production, secret, destructive, or user-owned-work boundaries without approval.
```

This file is not a caution-only document. It is an execution document.

Codex should not stop merely because:

- the next step is small
- there are multiple safe implementation choices
- the task can be broken down further
- a component name needs a reasonable choice
- mock data needs a reasonable shape
- a safe local UI refinement can be made
- documentation can be improved locally
- validation is available and can be run

Codex must stop only when a true stop condition is reached.

---

## 1. Project Identity


This repository is the frontend cockpit for Photo Studio OS.

It is not the backend repo.  
It is not the root control repo.  
It is not a deploy repo.  
It is not allowed to become the engine.

Repository role:

```text
Photo_Studio_OS_Control  = project control tower
Photo_Studio_OS_Backend  = backend engine
Photo_Studio_OS_Frontend = frontend cockpit
```

The frontend begins as a read-only Command Center Alpha. It may visualize workflow state, rehearse future API shapes, and prove the operator interface, but it must not mutate business truth.

The frontend may open its eyes. It must not touch the engine.

---

## 2. Current Mission


Primary stage:

```text
T128-001 Command Center Read-only Frontend Skeleton
```

The current mission is to build and refine the first read-only Command Center skeleton for Photo Studio OS.

This stage should prove:

- visual shell
- information architecture
- cockpit dashboard layout
- mock data structure
- component boundaries
- design token direction
- future API consumption boundaries
- validation path for frontend-only work

This stage must not attempt:

- production readiness
- public client access
- upload / download
- storage integration
- real approval writes
- real delivery links
- real authentication
- deployment
- release publishing

---

## 3. Default Operating Mode


Default mode:

```text
A4-Sustained Local Frontend Autopilot
```

Meaning:

Codex should actively and continuously advance the read-only frontend Alpha inside safe local boundaries until the current goal is complete, the session/tool budget is exhausted, or a true stop condition is reached.

Codex may automatically proceed when the work is:

- inside `Photo_Studio_OS_Frontend`
- local
- frontend-only
- read-only product behavior
- reversible
- inside the current mission
- not destructive
- not remote
- not production-sensitive
- not secret-sensitive
- not adding dependencies
- not changing `.env`
- not overwriting user-owned work

Codex should not stop after only planning when implementation is safe.

Codex should not stop after one small successful change if more safe work remains in the same mission.

Codex should not ask for approval for ordinary frontend implementation details.

Codex should ask or stop only when the next action crosses a real boundary.

---

## 4. What Counts as a Real Stop Gate


Stop immediately and report when the next step requires or risks any of the following:

- backend repo modification
- root control repo modification
- deployment
- release publishing
- push, merge, tag, PR creation, issue creation, or remote branch operation
- dependency addition, removal, upgrade, downgrade, or package manager change
- `.env`, secret, token, credential, or production URL modification
- auth implementation beyond read-only placeholder/interface work
- upload / download / storage integration
- real approval write action
- production or external service write
- destructive file operation
- database migration
- command that writes outside the frontend workspace
- overwrite, delete, reset, or clean user-owned uncommitted work
- replacing the approved Command Center visual direction
- validation failure that requires architecture or scope expansion
- user decision genuinely required because multiple choices have different product consequences

Do not stop for ordinary uncertainty. Narrow the task and continue.

---

## 5. Language and Communication Policy


Default user-facing communication language: Simplified Chinese.

Codex should reply to the user in Chinese by default, including:

- task reports
- progress summaries
- risk explanations
- validation results
- handoff notes
- recommendations
- implementation summaries
- blocker reports

Keep the following in their original language unless the user explicitly asks otherwise:

- code
- commands
- file paths
- package names
- API fields
- error messages
- logs
- branch names
- commit hashes
- technical identifiers

When writing project files, code comments, README sections, or documentation, follow the language style already used by the repository unless the user explicitly requests Chinese or English.

Be concise, direct, practical, and truthful. Do not over-explain ordinary steps. Do not translate technical terms in a way that damages precision.

---

## 6. Authority Order


Use this order when deciding what to do:

1. Safety gates and hard stop rules.
2. Current explicit user instruction.
3. Actual repository state and command output.
4. This project-level `AGENTS.md`.
5. Checked-in project documentation.
6. Global `AGENTS.md`.
7. Durable memory or prior conversation.
8. General model knowledge.

Memory is a map. Repository reality is the ground.

If prior memory says the project uses a certain stack, but `package.json` says otherwise, follow `package.json`.

---

## 7. Required Workspace Reality Check


Before editing, Codex must inspect the current workspace:

```bash
git branch --show-current
git status --short
git diff --stat
```

Then inspect available project scripts:

```bash
npm run
```

If this is not an npm project, inspect the actual package manager files before choosing commands.

Do not assume script names.  
Do not invent validation success.  
Do not run broad commands before reading available scripts.

If uncommitted changes exist, treat them as user-owned unless clearly created by the current task. Do not overwrite, delete, reset, or clean them.

Uncommitted user-owned work does not automatically block all progress. Codex may continue in untouched files or clearly separate areas if safe. Codex must stop only if the next useful change could overwrite, conflict with, or obscure user-owned work.

---

## 8. Continuous Local Execution Loop


For frontend Alpha work, Codex must use this loop:

1. Inspect repo reality.
2. Identify the next highest-value safe frontend task.
3. Make a small focused change.
4. Inspect the diff.
5. Run the narrowest available validation.
6. If validation fails and the fix is obvious, apply one narrow fix.
7. Re-run validation.
8. Record what changed.
9. Choose the next safe task.
10. Continue.

Continue until one of these happens:

- the requested goal is complete
- all obvious safe local frontend work for the current mission is exhausted
- a real stop gate is reached
- validation blocks further safe progress
- the execution session/tool budget is exhausted

Do not stop after the first completed task when more safe tasks remain.

Do not stop because the next task is merely small.

Do not stop because the next task is documentation, typing, mock data, component extraction, style refinement, or validation cleanup when those are inside scope.

---

## 9. Automatic Next Task Selection


When the user says any of the following:

```text
continue
继续
推进
自动推进
继续优化
往前做
自己跑
长时间推进
```

Codex should automatically select and execute the next safe frontend task.

Priority order:

1. Verify repository reality:
   - branch
   - worktree status
   - diff
   - package scripts
   - app structure

2. Restore or preserve a runnable frontend baseline:
   - build
   - lint
   - typecheck if available
   - clear report if scripts are missing

3. Improve Command Center Alpha shell:
   - dashboard layout
   - visual hierarchy
   - 16:9 command center structure
   - central gauge cluster balance
   - right-side Risk Pulse
   - Approval Queue
   - lower execution panels

4. Strengthen visual system:
   - design tokens
   - typography
   - spacing
   - near-black / cold-white balance
   - restrained orange-red risk accents
   - alignment precision

5. Strengthen mock-first architecture:
   - command center mock data
   - typed mock records
   - read-only adapter boundary
   - fixture clarity
   - no real writes

6. Improve component structure:
   - gauges
   - panels
   - layout primitives
   - command-center feature components
   - shared presentational components

7. Strengthen TypeScript contracts:
   - UI data types
   - API-shaped read-only response types
   - view model types
   - mock adapter types

8. Improve documentation:
   - README
   - frontend assumptions
   - backend contract notes
   - validation instructions
   - known limitations

9. Run validation again.

10. Continue to the next safe task.

Codex should choose the smallest useful task from this list, complete it, validate it, then continue.

---

## 10. Task Decomposition Contract


For sustained frontend autopilot work, Codex must decompose broad goals into a local task queue.

When the user gives a broad instruction such as:

```text
continue
继续
推进
自动推进
继续优化
往前做
自己跑
长时间推进
```

Codex should not ask the user for a task list.

Instead, Codex must create and maintain a temporary local execution queue in its working context.

The queue should be derived from:

1. current repository reality
2. current mission: `Command Center Read-only Alpha`
3. existing files and scripts
4. validation failures
5. missing frontend structure
6. missing mock data
7. missing read-only API/type boundaries
8. visual and component gaps
9. documentation gaps
10. safe follow-up tasks discovered during implementation

Each task must be small enough to complete, inspect, and validate locally.

Good task size:

- one component extraction
- one mock data improvement
- one type/interface improvement
- one panel refinement
- one design token cleanup
- one README section
- one validation fix
- one layout polish pass
- one frontend assumption or backend contract note

Bad task size:

- rewrite the whole UI
- redesign the product
- connect the real backend
- migrate the build system
- replace the visual language
- add a new library
- change deployment
- implement auth, upload, storage, or write actions

The queue should use this shape internally:

```text
todo:
- task

in_progress:
- task

done:
- task

blocked:
- task with reason
```

Codex should keep only one main task `in_progress` at a time unless true parallel work is safe.

After completing a task, Codex must:

1. mark it done
2. inspect the diff
3. validate or report why validation was not possible
4. select the next safe task
5. continue automatically

Codex should not stop merely because the original queue is empty.

When the queue is empty, Codex should rescan the repository for the next safe improvement inside the current mission.

A queue item is blocked only when it reaches a true stop gate, needs a real product decision, or cannot be safely completed locally.

Blocked items should not freeze the whole run if unrelated safe tasks remain.

Stop only when:

- a true stop gate is reached
- no safe local frontend task remains after rescanning
- validation blocks further safe progress
- session/tool budget is exhausted

Task decomposition is not ceremony. It is the engine that keeps the run moving.

---

## 11. No Churn Policy


Sustained autopilot means meaningful progress, not endless motion.

Codex should continue only when the next task creates material frontend value for the current mission.

Do not keep making cosmetic changes with no clear improvement.
Do not repeatedly refactor the same files without a validation, readability, component-boundary, or maintainability reason.
Do not rename, reorganize, re-polish, or re-layer files merely to appear active.
Do not churn design tokens, mock data, or component names after they are already coherent unless a concrete issue is found.

Good reasons to continue:

- a required Command Center Alpha element is missing
- validation is failing and a narrow safe fix exists
- mock data is unclear, duplicated, or not typed
- a component is too large or repeated and can be safely extracted
- visual hierarchy is inconsistent with the approved direction
- README or frontend assumptions are missing useful run/validation information
- a read-only API/type boundary is absent or ambiguous
- a safe browser/build/lint/typecheck validation step remains to be run

Bad reasons to continue:

- changing names only for taste
- moving files only to look more architectural
- adding visual noise to make the screen feel busier
- polishing the same panel repeatedly without a measurable improvement
- creating empty folders or speculative abstractions
- expanding scope into backend, auth, upload, storage, deployment, or production behavior

When no meaningful safe frontend task remains after rescanning, Codex should stop and report:

```text
No meaningful safe local frontend task remains inside the current mission.
Completed:
Validated:
Not validated:
Why stopping:
Next useful human decision:
```

No-churn is not a brake against progress. It is protection against hollow movement.

## 12. Do Not Ask For Ordinary Frontend Choices


Codex must not ask the user to decide ordinary local implementation details when a safe conventional choice is available.

Do not ask for approval for:

- local component names
- local folder placement inside approved structure
- mock data sample count
- mock field naming when types make intent clear
- minor CSS/token refinements
- spacing and alignment polish inside approved visual direction
- extracting repeated UI into components
- adding local read-only TypeScript interfaces
- adding or refining frontend-only documentation
- fixing obvious TypeScript, lint, or build errors
- choosing between equally safe small implementations

If multiple safe options exist, choose the smallest, most reversible, most conventional option and continue.

If the choice changes product behavior, backend contract, dependency policy, deployment, auth, storage, write actions, or visual direction, stop and report.

---

## 13. Handling Unclear Goals


If the user gives a broad goal such as "continue the frontend", "make it better", or "auto-advance", do not stop and ask for a task list.

Instead:

1. Inspect repo reality.
2. Infer the safest current mission from this file and repository docs.
3. Select the next task from `Automatic Next Task Selection`.
4. Execute locally.
5. Validate.
6. Continue.

If the broad goal could mean backend, deployment, production, or write behavior, choose the lowest-side-effect frontend-only interpretation and proceed locally.

---

## 14. Handling Validation Failures


Validation failures should not automatically end the run.

If validation fails:

1. Determine whether the failure is caused by the current change.
2. If the fix is obvious, narrow, local, and frontend-only, fix it once.
3. Re-run the relevant validation.
4. If it still fails but the cause is unrelated pre-existing baseline failure, record it clearly and continue only if further work is safe and does not depend on that broken area.
5. If it fails because of the current change and no obvious fix exists, stop and report.
6. If fixing requires dependency changes, backend changes, broad refactor, or architecture decision, stop and report.

Do not claim validation passed unless it passed.

Do not hide baseline failures.

Do not stop merely because one optional validation script is missing. Report the missing script and continue with available validation.

---

## 15. Sustained Run Checkpoint and Resume Policy


For long-running frontend work, Codex must leave clear checkpoints.

A checkpoint is required after every meaningful batch of work, after validation changes state, before stopping, or whenever another session may need to resume the run.

A checkpoint should include:

```text
Completed task queue items:
In-progress item:
Blocked items:
Changed files:
Validation run:
Validation failures:
Validation skipped:
Remaining safe tasks:
Stop gate reached: yes/no
Next safe task:
Resume note:
```

If the work spans many files or is likely to be resumed later, Codex may create or update a local frontend handoff file only when useful and inside scope.

Preferred local handoff path, if needed:

```text
docs/FRONTEND_AUTOPILOT_HANDOFF.md
```

The handoff should be concise and resume-ready. It should not become a second project management system.

Do not use the root control repo or `.agent_board` from this frontend repo unless explicitly approved.

When resuming from a checkpoint or handoff, Codex must:

1. verify current repo reality again
2. inspect branch, status, and diff
3. check whether files changed since the handoff
4. treat the handoff as advisory, not authority
5. continue from the next safe local frontend task

A checkpoint is not a reason to stop. It is a trail marker for the long run.

## 16. Visual North Star


The approved visual language is:

- premium dark cockpit
- luxury photography studio command center
- cold-white thin-line operating interface
- restrained metallic depth
- near-black / deep cold-blue background
- central analog gauge cluster as visual anchor
- right-side Risk Pulse and Approval Queue
- lower execution panels for Project Execution, Activity Timeline, and AI Inspection Feed
- calm density
- precise spacing
- cinematic black-glass restraint

Avoid:

- cyberpunk
- gaming HUD
- generic SaaS dashboard
- noisy gradients
- bulky cards
- neon overload
- washed-out grey admin UI
- fake decorative interface with no operational logic
- concept poster behavior

The first screen should feel like a professional studio control room, not a template dashboard.

---

## 17. Command Center Composition Rules


Unless the current user instruction explicitly says otherwise, preserve the established command center composition:

- 16:9 widescreen dashboard direction
- near-black background with subtle cold-blue depth
- premium cold-white typography
- orange-red only for risk, warning, approval, or critical accents
- three analog-style gauges as the visual centerpiece
- one large central gauge as the primary focal point
- left small gauge for SKU Coverage or equivalent production coverage signal
- right small gauge for QC Health or equivalent quality signal
- right-side Risk Pulse and Approval Queue area
- lower Project Execution / Activity Timeline / AI Inspection Feed panels
- thin, precise, cold-white OS line language outside the gauges
- restrained glow
- disciplined spacing
- realistic product UI hierarchy

The three gauges are the sacred visual anchor.

Do not casually redesign them.  
Do not replace them with generic charts.  
Do not move them into an unrelated layout.  
Do not let the side gauges become visually unbalanced.  
Do not let the right gauge crowd the right sidebar.  
Do not make the center gauge lose dominance.

Gauge refinement should be micro-polish only:

- metallic bezel
- inner ring
- fine tick marks
- needle clarity
- glass curvature
- subtle reflection
- depth
- shadow
- alignment
- equal spacing
- precision

The mechanical language belongs mainly to the gauges. Everything outside the gauges should remain a refined cold-white operating system layer.

---

## 18. Product Scope For This Stage


Allowed in this stage:

- read-only Command Center shell
- dashboard layout
- mock Project / SKU / Asset / Review / Delivery data
- read-only project list
- read-only workflow status cards
- read-only Risk Pulse
- read-only Approval Queue
- read-only Activity Timeline
- read-only AI Inspection Feed
- frontend README
- frontend AGENTS.md
- design tokens
- component skeletons
- API client interface draft without real writes
- mock adapters
- TypeScript types for future API consumption
- local docs that clarify frontend assumptions
- local frontend handoff notes when useful

Forbidden in this stage:

- upload
- download
- asset deletion
- approval write actions
- external review links
- external delivery links
- production auth
- real storage provider integration
- schema changes
- backend API changes
- deploy
- release publish
- production data
- public client-facing access

---

## 19. Command Center Alpha Completion Criteria


The Command Center Read-only Alpha is considered complete only when the following are true or explicitly marked out of scope by the current user instruction:

- the frontend app has a runnable local baseline
- the main Command Center route or screen exists
- the approved premium dark cockpit direction is visible
- the three-gauge command center composition exists
- the center gauge remains the primary focal point
- the left and right gauge roles are represented or clearly stubbed
- Risk Pulse exists as read-only UI
- Approval Queue exists as read-only UI
- Project Execution exists as read-only UI
- Activity Timeline exists as read-only UI
- AI Inspection Feed exists as read-only UI
- mock data is isolated and clearly named
- mock data covers projects, SKUs, assets, risks, approvals, activity, and AI inspection where needed
- read-only TypeScript data contracts exist for the main dashboard data shape
- a read-only API/client or adapter boundary is drafted if useful for future backend connection
- no backend mutation exists
- no POST / PATCH / DELETE behavior exists
- no upload / download / auth / storage flow exists
- no production URL or secret is introduced
- validation status is clear
- README or frontend notes explain how to run and validate the skeleton
- remaining backend needs are documented as contract notes, not implemented from this repo

When these criteria are met, Codex may report the stage as:

```text
Command Center Read-only Alpha: COMPLETE_CANDIDATE
```

If some criteria are not met but cannot be safely completed without crossing a stop gate, report:

```text
Command Center Read-only Alpha: PARTIAL_BLOCKED
Blocked criteria:
Required approval or external work:
```

Completion means the Alpha can be inspected, validated, and continued safely. It does not mean production readiness.

## 20. Backend Boundary


The frontend must not modify the backend repo.

Forbidden:

- do not edit backend code
- do not edit backend schema
- do not edit backend `.env`
- do not edit backend package or lockfile
- do not add backend dependencies
- do not create backend APIs
- do not change backend response shapes
- do not run backend migrations
- do not deploy backend services

If a backend gap is discovered, record it as a frontend/backend contract note. Do not fix it from this repo.

Preferred response to backend gaps:

```text
Frontend can prepare the read-only interface and mock adapter.
Backend support needed later: <specific missing endpoint/field/behavior>.
No backend changes made.
```

---

## 21. Root Control Repo Boundary


The frontend must not modify the root control repo unless explicitly approved.

Forbidden without approval:

- editing `A:\Photo_Studio_OS`
- editing `.agent_board`
- editing `PROJECT_MASTER_PLAN.md`
- editing root control repo policies
- committing root control repo changes

If a planning update is needed, report it instead of editing.

---

## 22. Port Ownership Policy


Do not use these ports:

```text
3000 = NewAPI external owned service
6005 = VCPToolBox backend service
6006 = VCPToolBox Admin panel service
6379 = default Redis, not for frontend
6380 = Photo Studio OS Redis validation
5432 = Photo Studio OS local PostgreSQL test dependency
```

Preferred frontend dev ports:

```text
5173 = preferred Vite dev port
5174 = alternate Vite dev port
3101 = fixed Photo Studio frontend dev candidate
4173 = preview candidate
```

If a framework defaults to `3000`, override it.

Do not start long-running services unless useful for validation and safe. If a dev server is started, report the port and whether it was stopped.

A local dev server is validation support. It is not deployment.

---

## 23. Stack Policy


Follow the actual repository stack shown by project files.

If no stack has been approved yet, propose before installing dependencies.

Recommended default proposal:

```text
Vite + React + TypeScript
```

Do not install dependencies until the stack is explicitly approved.

If the stack has already been approved or is already present in `package.json`, keep dependencies minimal and explain every new package.

Do not add UI libraries, chart libraries, animation libraries, state managers, CSS frameworks, icon packs, or visual effect libraries unless explicitly approved.

---

## 24. Dependency Policy


Do not add, remove, upgrade, downgrade, or replace dependencies without explicit approval.

Allowed without approval:

- inspect package files
- inspect lockfile presence
- run existing validation scripts
- run lockfile-based local install only when needed for validation and safe

Allowed install example only when appropriate:

```bash
npm ci
```

Do not run without explicit approval:

```bash
npm audit fix
npm update
npm install <new-package>
npm install -g <package>
```

Changing package manager, lockfile, build tool, UI framework, charting library, animation library, or design system requires explicit approval.

---

## 25. Mock-First Rule


This frontend begins mock-first.

Use local mock data for:

- projects
- SKUs
- assets
- review sessions
- delivery packages
- approval queue
- risk pulse
- activity timeline
- AI inspection feed

Do not require a live backend for the first skeleton.

Any API client should be interface-first and read-only.

Mock data must be clearly named and easy to remove or replace later. Do not hide mock behavior as if it were production integration.

Preferred boundary:

```text
UI component
  -> frontend hook / view model
    -> mock adapter or read-only API adapter interface
      -> fixture data or future real client
```

---

## 26. API Boundary


Allowed:

- define read-only API client interfaces
- map current backend API assumptions
- document missing dashboard needs
- create mock adapters
- create typed response contracts

Forbidden:

- POST calls
- PATCH calls
- DELETE calls
- upload/download calls
- auth token implementation
- external Review/Delivery token flows
- direct database access
- hardcoded production URLs
- public client-facing endpoints

Production endpoints must not be hardcoded. Secrets must never be added.

`.env` must not be edited unless explicitly instructed. `.env.example` may be updated with sanitized placeholder names if needed.

---

## 27. Design Implementation Rules


When changing UI:

1. Preserve the current layout unless the task explicitly asks for redesign.
2. Prefer local, surgical component edits over broad rewrites.
3. Preserve naming and file conventions.
4. Keep mock data separate from real API assumptions.
5. Use design tokens or shared style primitives when they already exist.
6. Avoid scattered one-off colors.
7. Avoid excessive shadows, gradients, animations, and glow.
8. Keep text legible.
9. Keep alignment strict.
10. Keep visual hierarchy calm.

Every visual change should make the product feel more real, not more decorative.

Good frontend changes:

- clarify layout hierarchy
- reduce visual noise
- improve spacing
- improve type scale
- improve component consistency
- improve responsive behavior without damaging the 16:9 hero direction
- isolate mock data
- strengthen type safety
- keep the design system reusable

Bad frontend changes:

- random redesign
- over-bright panels
- generic card dashboard
- too many colors
- fake sci-fi clutter
- duplicated components without reason
- hardcoded production endpoints
- mixing backend assumptions into UI
- massive refactors for small visual requests

---

## 28. File Structure Preference


Recommended initial structure:

```text
A:\Photo_Studio_OS_Frontend
  AGENTS.md
  README.md
  package.json
  index.html
  src/
    main.tsx
    App.tsx
    styles/
      tokens.css
      global.css
    components/
      gauges/
      panels/
      layout/
    features/
      command-center/
      projects/
      skus/
      assets/
      reviews/
      deliveries/
    mocks/
      commandCenter.mock.ts
    api/
      client.ts
      types.ts
```

Keep the first skeleton small. Do not create folders that are not needed yet just to look complete.

For long-running work, create new files only when they serve the current implementation or handoff clearly.

---

## 29. File Modification Policy


Before editing:

- identify exact target files
- inspect nearby context
- preserve existing style
- avoid unrelated formatting
- avoid mass rewrites

During editing:

- make the smallest useful change
- keep changes reviewable
- avoid mixing visual polish with architecture refactor
- avoid renaming files unless necessary
- avoid deleting files without explicit approval

After editing:

- inspect diff
- run relevant validation
- report changed files
- report uncertainty

Small local edits should chain together into sustained progress. Do not treat every file edit as a stopping point.

---

## 30. Git Rules


Never use:

```bash
git add .
```

Always add files explicitly.

Before commit, run:

```bash
git diff --check
git diff --cached --check
git diff --cached --name-only
git diff --cached --stat
```

Also run a high-confidence secret scan on changed files before commit.

Do not commit unless the user has explicitly approved autonomous local commits for the current run or the current task explicitly permits low-risk frontend skeleton commits.

Never push without explicit user approval.

Forbidden without explicit approval:

- push
- merge
- tag
- release
- deploy
- branch cleanup
- production write
- remote branch creation
- PR creation
- issue creation
- GitHub setting changes

Autopilot does not imply remote authority.

---

## 31. Validation Rules


A task is not complete until validation status is clear.

For docs-only changes:

```bash
git diff --check
```

For frontend skeleton code, prefer the existing scripts if present:

```bash
npm run typecheck
npm run lint
npm run build
npm run test
```

If those scripts do not exist, report that they are missing. Do not invent validation success.

For visual-only work:

- inspect the diff
- run typecheck if available
- run build if available and reasonable
- run lint if available and relevant
- if browser or screenshot validation is available and safe, use it

Do not claim visual correctness if no browser or screenshot was checked. Say plainly:

```text
Visual browser validation not run.
```

Do not claim full validation if only typecheck ran. Do not say tests passed if tests were not run.

Use result labels:

- `COMPLETED_VALIDATED`
- `COMPLETED_UNVALIDATED`
- `PARTIAL`
- `BLOCKED`
- `FAILED`

Validation is proof. It is not a ritual.

---

## 32. Dev Server Policy


Codex may start a local dev or preview server only when useful for validation and safe.

Before starting, inspect scripts first.

If starting a server:

- use the project's existing script
- keep it local
- do not expose it publicly
- do not connect real production services
- stop it when finished if possible
- report whether any server may still be running
- report port if known

Do not bind to port `3000`.

Preferred:

```text
5173, 5174, 3101, or 4173
```

A dev server may be used for validation, but a long-running hidden process must not be left behind without reporting.

---

## 33. High-Risk Frontend Areas


Treat these as high risk:

- routing architecture
- global state architecture
- auth boundary
- API client foundation
- file upload flow
- environment config
- build config
- package manager config
- deployment config
- design token rewrite
- component library migration
- broad responsive layout rewrite
- replacing the command center composition

High-risk does not always mean stop. It means plan briefly, stage changes, validate carefully, and stop before hard boundaries.

---

## 34. Hard Stop Gates


Stop and request explicit approval before:

- committing unless autonomous local commits were explicitly approved for this run
- pushing
- creating PRs
- merging
- deploying
- publishing
- changing remote branches
- changing GitHub settings
- modifying backend repo
- modifying root control repo
- changing secrets or `.env`
- adding dependencies
- deleting files broadly
- running destructive commands
- force pushing
- resetting hard
- cleaning untracked files
- connecting to live production services
- writing to external systems

Never auto-run:

```bash
git reset --hard
git clean -fd
git clean -fdx
git push --force
git push --force-with-lease
rm -rf
```

Never auto-run in PowerShell:

```powershell
Remove-Item -Recurse
Remove-Item -Recurse -Force
```

---

## 35. Stop Conditions


Stop immediately and report if:

- backend changes appear necessary
- root control repo changes appear necessary
- package dependency additions are needed but not approved
- a port conflict touches `3000`, `6005`, or `6006`
- auth, storage, upload, or download becomes required
- a production or external access decision appears
- validation fails in a way that requires scope expansion
- user-owned uncommitted work could be overwritten
- the requested change would damage the approved visual direction
- a decision would materially change product behavior rather than implementation detail

If none of the above is true, continue.

---

## 36. Reporting Format


Every task report must include:

```text
Goal:
Repo:
Mode:
Risk:
Branch:
Worktree:
Task queue:
Changed files:
Validation:
Not validated:
Visual impact:
Git status:
Backend touched: yes/no
Root control repo touched: yes/no
Deploy performed: yes/no
Ports used:
Remaining risks:
Next safe task:
Result:
```

For design polish, also include:

```text
Preserved:
Improved:
Not changed:
```

For long-running autopilot checkpoints, also include:

```text
Completed this stage:
Still continuing because:
Stop gate reached: yes/no
```

Never overclaim. Never hide skipped validation. Never bury risk in beautiful words.

---

## 37. Preferred Frontend Progression


When asked to continue improving the frontend, prioritize in this order:

1. preserve current Command Center direction
2. improve layout precision
3. improve component consistency
4. strengthen design tokens
5. improve typography and spacing
6. isolate mock data
7. strengthen TypeScript contracts
8. improve validation scripts only if already supported
9. document frontend assumptions
10. prepare safe backend integration boundaries

Do not rush into backend connection.

First make the black glass exact. Then make the arteries real.

---

## 38. Product Domain Assumptions


Unless repository docs say otherwise, assume the product domain includes:

- photography studio project tracking
- product / SKU shooting workflow
- shot requirements
- asset progress
- retouch tasks
- QC checks
- review sessions
- approvals
- delivery status
- risk monitoring
- AI inspection feed

Frontend may represent these concepts visually through mock data and typed contracts.

But do not claim real backend support exists unless verified in code.

---

## 39. Completion Definition


A task is complete only when:

- requested frontend change is made
- scope did not silently expand
- user-owned work was not overwritten
- changed files are known
- validation was run or explicitly marked unavailable
- remaining uncertainty is reported
- no unauthorized remote, backend, root repo, deploy, or production action occurred

If no validation was possible, mark:

```text
COMPLETED_UNVALIDATED
```

If only part of the task was done, mark:

```text
PARTIAL
```

If blocked by permission, missing dependency approval, unclear design decision, or unsafe repo state, mark:

```text
BLOCKED
```

For sustained autopilot, completing one small task does not mean the run should stop if more safe work remains inside the current mission.

---

## 40. Final Rule


This frontend is not just a screen.

It is the black glass door of the studio's operating system.

Codex should make it sharper, quieter, colder, and more real.

Continue while the path is safe.
Narrow when the path is cloudy.  
Stop only when the cost is real.
Validate before claiming victory.
