# AGENTS.md — Photo Studio OS Frontend

Project-level instructions for Codex working inside `Photo_Studio_OS_Frontend`.

This file narrows the global Codex behavior for this specific frontend repository. It does not weaken global safety gates. If this file conflicts with actual repository files, current command output, or the user's latest instruction, repository reality and the latest instruction win inside safety boundaries.

---

## 0. Project Identity

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

---

## 1. Current Mission

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

The frontend may open its eyes. It must not touch the engine.

---

## 2. Operating Mode

Default mode: `A2-Safe Frontend`.

Codex may automatically proceed when the work is:

- local
- frontend-only
- reversible
- inside the current task
- not destructive
- not remote
- not production-sensitive
- not secret-sensitive
- not overwriting user-owned work

Codex should keep moving inside that boundary. Do not stop for ordinary implementation choices when a small safe path is available.

Codex must stop before hidden cost, remote side effects, backend changes, production risk, dependency changes, or destructive actions.

---

## 3. Authority Order

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

## 4. Language and Communication Policy

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

## 5. Required Workspace Reality Check

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

---

## 6. Visual North Star

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

## 7. Command Center Composition Rules

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

## 8. Product Scope For This Stage

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

## 9. Backend Boundary

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

## 10. Root Control Repo Boundary

The frontend must not modify the root control repo unless explicitly approved.

Forbidden without approval:

- editing `A:\Photo_Studio_OS`
- editing `.agent_board`
- editing `PROJECT_MASTER_PLAN.md`
- editing root control repo policies
- committing root control repo changes

If a planning update is needed, report it instead of editing.

---

## 11. Port Ownership Policy

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

---

## 12. Stack Policy

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

## 13. Dependency Policy

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

## 14. Mock-First Rule

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

## 15. API Boundary

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

## 16. Design Implementation Rules

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

## 17. File Structure Preference

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

---

## 18. File Modification Policy

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

---

## 19. Git Rules

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

Do not commit unless the user has approved the current scope or the task explicitly permits low-risk frontend skeleton commits.

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

---

## 20. Validation Rules

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

---

## 21. Dev Server Policy

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

---

## 22. High-Risk Frontend Areas

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

High-risk changes require a short plan before editing and staged validation.

---

## 23. Hard Stop Gates

Stop and request explicit approval before:

- committing
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

## 24. Stop Conditions

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

Report instead of continuing.

---

## 25. Reporting Format

Every task report must include:

```text
Goal:
Repo:
Mode:
Risk:
Branch:
Worktree:
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
Next recommended step:
Result:
```

For design polish, also include:

```text
Preserved:
Improved:
Not changed:
```

Never overclaim. Never hide skipped validation. Never bury risk in beautiful words.

---

## 26. Preferred Frontend Progression

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

## 27. Product Domain Assumptions

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

## 28. Completion Definition

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

---

## 29. Final Rule

This frontend is not just a screen.

It is the black glass door of the studio's operating system.

Codex should make it sharper, quieter, colder, and more real.

Move when the path is clear.  
Narrow when the path is cloudy.  
Stop when the cost is hidden.  
Validate before claiming victory.
