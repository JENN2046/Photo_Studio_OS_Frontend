# Photo Studio OS Frontend - Command Center Design Brief

Version: v0.1
Status: Frontend read-only alpha design brief
Owner: Photo Studio OS Control
Target Repo: `A:\Photo_Studio_OS_Frontend`
Recommended Path: `A:\Photo_Studio_OS_Frontend\docs\design\COMMAND_CENTER_DESIGN_BRIEF.md`

---

## 1. Purpose

This document defines the first frontend visual and product direction for Photo Studio OS.

The frontend is the **operator cockpit** for a professional product photography studio.
It should help the studio owner or operator understand project readiness, SKU progress, QC health, review pressure, delivery risk, and execution flow at a glance.

This brief is for the first frontend stage:

```text
T128-001 Command Center Read-only Frontend Skeleton
```

This stage must prove the visual shell, layout logic, information architecture, and mock-data flow before any production write action, external access, upload/download, real auth, or storage integration.

---

## 2. Product Positioning

Photo Studio OS is not a generic SaaS dashboard.

It is a professional studio operating system for product and e-commerce photography workflows.

The Command Center should feel like:

```text
a quiet, premium, dark photography studio control room
```

Not like:

```text
a startup analytics template
a cyberpunk poster
a gaming HUD
a noisy neon dashboard
a generic admin panel
```

The frontend must serve the Product Golden Path:

```text
Client / Brand
-> Project
-> SKU
-> Shot Requirement
-> Asset Intake
-> Retouch Task
-> QC Check
-> Review Session
-> Approval
-> Delivery Package
-> Archive
-> Activity / Audit Trail
```

---

## 3. Current Frontend Mission

The first frontend mission is:

```text
Build a read-only Command Center Alpha.
```

The frontend may visualize business state.

The frontend must not mutate business truth.

Allowed:

- read-only dashboard shell
- mock data
- read-only project / SKU / asset / review / delivery views
- visual information architecture
- design tokens
- component skeleton
- future API interface draft

Forbidden:

- upload
- download
- approval write actions
- asset deletion
- external Review links
- external Delivery links
- production auth
- real storage provider integration
- backend schema changes
- backend API changes
- deploy
- release publish
- production data

---

## 4. Approved Visual Direction

The approved design direction is:

```text
premium dark cockpit
luxury photography studio command center
cold-white thin-line OS interface
near-black background with deep cold-blue undertone
central analog gauge cluster as visual anchor
right-side Risk Pulse and Approval Queue
lower execution cards
restrained metallic depth
```

The visual language should feel precise, calm, expensive, and operational.

It should not feel decorative for decoration's sake.

---

## 5. Master Layout

Target canvas:

```text
16:9 widescreen desktop-first layout
```

Recommended first screen:

```text
┌────────────────────────────────────────────────────────────────────┐
│ Top System Bar                                                     │
├───────────────────────┬───────────────────────────┬────────────────┤
│ Left Context Rail     │ Central Gauge Cluster      │ Right Ops Rail │
│                       │                           │                │
│ Project / Studio      │ SKU Coverage               │ Risk Pulse     │
│ Context               │ Studio Readiness           │ Approval Queue │
│                       │ QC Health                  │                │
├───────────────────────┴───────────────────────────┴────────────────┤
│ Lower Execution Layer                                               │
│ Project Execution | Activity Timeline | AI Inspection Feed          │
└────────────────────────────────────────────────────────────────────┘
```

The first page should prioritize:

1. Studio readiness
2. SKU coverage
3. QC health
4. review / approval pressure
5. delivery risk
6. active execution flow

---

## 6. Main Visual Anchor: Three-Gauge Cluster

The gauge cluster is the only area allowed to feel strongly mechanical.

### Gauge Roles

```text
Left Gauge:
SKU Coverage

Center Gauge:
Studio Readiness / Project Progress

Right Gauge:
QC Health
```

### Gauge Requirements

The gauges should have:

- realistic metallic bezels
- premium glass reflection
- elegant tick marks
- clear needle hierarchy
- inner depth and shadow
- restrained glow
- cold-white typography
- subtle warm alert accents only when needed

The center gauge should be larger and visually dominant.

The left and right gauges should align cleanly with the center gauge.

### Gauge Constraints

Avoid:

- toy-like dials
- racing dashboard clichés
- excessive red / orange
- cyberpunk neon
- heavy fake shadows
- unreadable ticks
- decorative numbers with no meaning

---

## 7. Right Rail

The right rail contains the most urgent operator attention.

### Risk Pulse

Purpose:

```text
show operational risk before it becomes delivery failure
```

Example risk signals:

- QC failure spike
- overdue retouch tasks
- review session delay
- delivery package not ready
- missing final exports
- asset intake incomplete
- approval queue congestion

Visual style:

- compact
- high contrast
- thin dividers
- quiet alert glow
- orange-red only for real risk

### Approval Queue

Purpose:

```text
show work waiting for human decision
```

Example items:

- review sessions waiting for approval
- delivery packages waiting for final confirmation
- QC exceptions
- retouch rework decisions
- blocked SKU groups

The queue should feel like an operator list, not a generic notification feed.

---

## 8. Lower Execution Layer

The lower area should feel like a thin precision information layer.

### Project Execution

Shows current active project flow.

Possible fields:

- active project name
- client / brand
- project status
- SKU count
- completed shot requirements
- retouch progress
- QC progress
- delivery readiness

### Activity Timeline

Shows recent meaningful events.

Examples:

- asset imported
- retouch task completed
- QC failed
- review session opened
- approval received
- delivery package prepared

Avoid raw logs.
Show curated operational events.

### AI Inspection Feed

Shows future AI-assisted inspection results.

For now, this can use mock data.

Examples:

- background consistency warning
- missing angle detection
- color mismatch
- crop / margin issue
- product label visibility issue
- possible duplicate asset

This section must not imply production AI is already implemented.

Label clearly as mock / future-assisted where appropriate.

---

## 9. Color System

Recommended palette direction:

```text
Background:
near-black, deep graphite, cold blue-black

Primary text:
cold white

Secondary text:
muted icy gray

Lines:
thin cold-white / blue-white with low opacity

Panels:
dark translucent surfaces

Gauge metal:
dark chrome, graphite, silver edge highlights

Risk accent:
orange-red only for meaningful alerts

Success accent:
restrained green / cool cyan, used sparingly
```

Avoid:

- bright saturated cyberpunk colors
- large neon fills
- generic blue SaaS palette
- purple gradient overuse
- random rainbow status colors

---

## 10. Typography

Typography should feel precise and premium.

Recommended rules:

- uppercase micro labels for system areas
- clear numeric hierarchy for metrics
- generous spacing
- no cartoon weights
- no overly futuristic unreadable fonts
- no dense cramped paragraphs

Text should feel like:

```text
instrument labels
studio control notes
operator-readable telemetry
```

Not like:

```text
marketing landing page copy
```

---

## 11. Surface and Line Language

The non-gauge UI should use a refined OS layer style.

Rules:

- thin luminous borders
- subtle panel separation
- restrained glass / acrylic feel
- precise alignment
- quiet inner shadows
- minimal card bulk
- calm micro-glow

Avoid:

- bulky dashboard cards
- over-rounded SaaS widgets
- heavy drop shadows
- fake 3D everywhere
- sci-fi clutter

---

## 12. Read-Only Alpha Scope

The first skeleton should include:

```text
/dashboard
```

Recommended first route:

```text
/command-center
```

Initial components:

```text
CommandCenterPage
CommandCenterLayout
TopSystemBar
StudioGaugeCluster
GaugeDial
RiskPulsePanel
ApprovalQueuePanel
ProjectExecutionPanel
ActivityTimelinePanel
AIInspectionFeedPanel
StatusChip
MetricLabel
```

Do not implement:

- login
- mutation forms
- file upload
- delivery download
- real token flows
- external client pages
- storage browser
- production settings

---

## 13. Mock Data Model

Create mock data first.

Recommended mock shape:

```ts
export type CommandCenterMock = {
  studio: {
    name: string;
    locationLabel: string;
    readinessPercent: number;
    activeProjectCount: number;
  };

  coverage: {
    skuCoveragePercent: number;
    completedSkus: number;
    totalSkus: number;
  };

  qc: {
    qcHealthPercent: number;
    passed: number;
    failed: number;
    pending: number;
  };

  risks: Array<{
    id: string;
    severity: "low" | "medium" | "high";
    label: string;
    detail: string;
    relatedProjectId?: string;
  }>;

  approvalQueue: Array<{
    id: string;
    type: "review" | "delivery" | "qc" | "retouch";
    title: string;
    status: string;
    ageLabel: string;
  }>;

  projectExecution: Array<{
    id: string;
    projectName: string;
    clientName: string;
    status: string;
    progressPercent: number;
    skuCount: number;
  }>;

  activityTimeline: Array<{
    id: string;
    timestampLabel: string;
    eventType: string;
    message: string;
  }>;

  aiInspectionFeed: Array<{
    id: string;
    confidence: number;
    label: string;
    recommendation: string;
  }>;
};
```

This mock data should represent the Product Golden Path without requiring a live backend.

---

## 14. API Boundary

The frontend may define read-only API interfaces.

It must not require backend changes in this stage.

Allowed:

- API type definitions
- read-only client function stubs
- mock adapter
- future endpoint notes
- contract gap notes

Forbidden:

- POST / PATCH / DELETE calls
- file upload
- delivery download
- auth token implementation
- external Review / Delivery public access
- direct database access
- production URL hardcoding

If an API gap is found, document it as:

```text
Frontend Backend Contract Gap
```

Do not fix backend from the frontend repo.

---

## 15. Port Policy

Do not use:

```text
3000 = NewAPI
6005 = VCPToolBox backend
6006 = VCPToolBox Admin
6379 = default Redis
6380 = Photo Studio OS Redis validation
5432 = Photo Studio OS local PostgreSQL test dependency
```

Recommended frontend development ports:

```text
5173 = preferred Vite dev port
5174 = alternate Vite dev port
3101 = fixed Photo Studio frontend candidate
4173 = preview candidate
```

If a framework defaults to `3000`, override it.

---

## 16. Recommended Frontend Stack

Recommended default proposal:

```text
Vite + React + TypeScript
```

Do not install dependencies until the stack is approved.

Initial dependency additions should be minimal.

Avoid adding heavy UI libraries, chart libraries, animation libraries, state managers, or CSS frameworks until the first skeleton proves the information architecture.

---

## 17. Recommended File Structure

```text
A:\Photo_Studio_OS_Frontend
  AGENTS.md
  README.md
  .gitignore
  package.json
  index.html
  tsconfig.json
  tsconfig.node.json
  vite.config.ts

  docs
    design
      COMMAND_CENTER_DESIGN_BRIEF.md

  src
    main.tsx
    App.tsx

    styles
      tokens.css
      global.css

    components
      layout
      panels
      gauges
      cards

    features
      command-center
        CommandCenterPage.tsx
        CommandCenterLayout.tsx

      projects
      skus
      assets
      reviews
      deliveries

    mocks
      commandCenter.mock.ts

    api
      client.ts
      types.ts
```

Keep the first skeleton small.

---

## 18. Acceptance Criteria For T128-001

T128-001 is acceptable when:

- frontend repo is separate from backend and root control repo
- `AGENTS.md` exists
- `README.md` exists
- design brief exists
- mock data exists
- Command Center page skeleton exists
- visual direction is recognizable
- no backend modification occurred
- no upload/download/auth/storage was implemented
- dev port avoids `3000 / 6005 / 6006`
- validation commands are real, or missing scripts are honestly reported
- git status is known
- no push occurs without approval

---

## 19. Quality Bar

The first frontend should not try to be complete.

It should prove:

```text
Can this feel like the operating cockpit of a high-end product photography studio?
Can the Product Golden Path be understood visually?
Can the operator see risk, approval pressure, and execution state quickly?
Can the design avoid generic SaaS?
```

If the answer is yes, the skeleton succeeds.

---

## 20. Final Rule

The frontend may open its eyes.

It must not touch the engine.
