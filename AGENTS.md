# AGENTS.md - Photo Studio OS Frontend

## Project Identity

This repository is the frontend cockpit for Photo Studio OS.

It is not the backend repo.
It is not the root control repo.
It is not a deploy repo.

Repository role:

```text
Photo_Studio_OS_Control  = project control tower
Photo_Studio_OS_Backend  = backend engine
Photo_Studio_OS_Frontend = frontend cockpit
```

The frontend must begin as a read-only Command Center Alpha.
It may visualize workflow state, but it must not mutate business truth.

## Current Frontend Mission

Build the first read-only Command Center skeleton for Photo Studio OS.

Primary goal:

```text
T128-001 Command Center Read-only Frontend Skeleton
```

This stage should prove:

- the visual shell
- the information architecture
- the operator dashboard layout
- mock data structure
- future API consumption boundaries

It must not attempt production readiness, public access, upload/download, storage, or real client-facing workflows.

## Visual Direction

The approved visual language is:

- premium dark cockpit
- luxury photography studio command center
- cold-white thin-line OS interface
- restrained metallic depth
- near-black / deep cold blue background
- central analog gauge cluster as visual anchor
- right side Risk Pulse and Approval Queue
- lower execution cards for Project Execution, Activity Timeline, and AI Inspection Feed

Avoid:

- cyberpunk
- gaming HUD
- generic SaaS dashboard
- noisy gradients
- bulky cards
- neon overload
- decorative fake UI with no operational logic

The first screen should feel like a professional studio control room, not a template dashboard.

## Product Scope For This Stage

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
- design tokens / component skeleton
- API client interface draft without real writes

Forbidden in this stage:

- upload
- download
- asset deletion
- approval write actions
- external Review links
- external Delivery links
- production auth
- real storage provider integration
- schema changes
- backend API changes
- deploy
- release publish
- production data
- public client-facing access

## Backend Boundary

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

If the frontend discovers a backend gap, record it as a frontend/backend contract note. Do not fix it from this repo.

## Root Control Repo Boundary

The frontend must not modify the root control repo unless explicitly approved.

Forbidden without approval:

- editing `A:\Photo_Studio_OS`
- editing `.agent_board`
- editing `PROJECT_MASTER_PLAN.md`
- editing root control repo policies
- committing root control repo changes

If a planning update is needed, report it instead of editing.

## Port Ownership Policy

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

## Stack Policy

If no stack has been approved yet, propose before installing dependencies.

Recommended default proposal:

```text
Vite + React + TypeScript
```

Do not install dependencies until the stack is explicitly approved.

If the stack has been approved, keep dependencies minimal and explain every new package.

Do not add UI libraries, chart libraries, animation libraries, state managers, or CSS frameworks unless explicitly approved.

## Mock-First Rule

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

## API Boundary

Allowed:

- define read-only API client interfaces
- map current backend API assumptions
- document missing dashboard needs
- create mock adapters

Forbidden:

- POST / PATCH / DELETE calls
- upload/download calls
- auth token implementation
- external Review/Delivery token flows
- direct database access
- hardcoded production URLs
- public client-facing endpoints

## Git Rules

Never use:

```text
git add .
```

Always add files explicitly.

Before commit, run:

```text
git diff --check
git diff --cached --check
git diff --cached --name-only
git diff --cached --stat
```

Also run a high-confidence secret scan on changed files.

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

## Validation Rules

For docs-only changes:

```text
git diff --check
```

For frontend skeleton code:

```text
npm run build
npm run lint
```

If those scripts do not exist yet, report that they are missing. Do not invent validation success.

For Vite preview or dev server:

- do not start long-running services unless approved
- do not bind to port 3000
- prefer port 5173 or 3101

## Security Rules

Never commit:

- `.env`
- secrets
- tokens
- API keys
- private keys
- service account files
- production URLs with credentials
- local credential stores
- raw customer data
- private delivery links
- auth tokens
- database connection strings with passwords

Use example placeholders only.

## File Structure Preference

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

Keep the first skeleton small.

## Reporting Format

Every task report must include:

```text
Goal:
Repo:
Mode:
Risk:
Changed files:
Validation:
Git status:
Backend touched: yes/no
Root control repo touched: yes/no
Ports used:
Remaining risks:
Next recommended step:
```

## Stop Conditions

Stop immediately if:

- backend changes appear necessary
- root control repo changes appear necessary
- package dependency additions are needed but not approved
- a port conflict touches 3000 / 6005 / 6006
- auth / storage / upload / download becomes required
- a production or external access decision appears
- validation fails in a way that requires scope expansion

Report instead of continuing.

## Current Rule

Frontend may start now, but only as:

```text
Command Center Read-only Alpha
```

The frontend may open its eyes.
It must not touch the engine.
