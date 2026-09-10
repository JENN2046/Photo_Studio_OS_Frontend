# R1 Creative Workbench

Status: implementation available for local integration validation. Live identity-provider
configuration, public publication, production deployment, and cross-platform acceptance
are not established by frontend unit tests or a successful build.

The existing Command Center visual composition remains: three gauges, right-side Risk
Pulse and Approval Queue, and lower Project Execution, Activity Timeline, and AI Inspection
cards. The new `#creative-workbench` detail route uses the same shell. Live views display
provided facts or explicit unavailable states; operational statuses do not become invented
AI scores, project progress, studio readiness, timestamps, or inferred relationships.

## Persisted workflow

The authenticated workbench selects real projects and production units, creates deliverables
and subject bindings, edits provenance-aware creative fields, preserves locked content,
and appends immutable specification versions. Recipe compilation binds the exact selected
version; compiled prompts remain a projection of canonical creative truth.

Scratchpads and manual exploration attempts accept one PNG/JPEG file, up to 8 MiB and
16 million pixels. The backend performs full decoding and media-boundary checks. Candidate
images are fetched with Bearer authentication, checked against their SHA-256, and displayed
using revocable object URLs. A comparison view does not perform automatic quality scoring.

An owner reviews the displayed content with its exact revision, SHA and reason. Formal
promotion is a separate explicit action tied to that review and an idempotency key. A
committed promotion receipt records historical success; current formal-media availability
is checked separately. Supplied-metadata evaluation uses the existing five-dimension,
integer 0–5 policy and is not equivalent to human approval or independent visual inspection.

Local image plans bind the exact source Candidate, Recipe and target Scratchpad. The current
capability resizes images to bounded dimensions, outputs PNG, preserves aspect ratio and
does not enlarge. It does not assemble video or execute arbitrary commands.

Execution panels expose grant limits, expiry, attempt reservations, actual consumption,
operation state, budget history, events, and local pool status. Credit totals preserve decimal
integer precision. Unknown outcomes remain visible and are never automatically resubmitted.
Pause/drain controls stay available during a pending local execution request. They request
stopping; only server-observed process termination can release capacity. Owner reconciliation
requires fresh revision/epoch and an explicit stop attestation; lease expiry alone is not proof.

## API and authentication boundary

The workbench derives `/api/v1` on the configured read-base origin from the existing public
`VITE_BACKEND_API_BASE_URL` path `/api/v2/read`. Unknown base shapes fail closed. No active
environment or identity-provider configuration is read or changed by this feature.

Default workbench requests require the existing Bearer session. Owner presentation permits
command controls; backend RBAC and organization scope remain authoritative. Mock sessions,
DEV role query parameters and environment-role fallbacks do not create command credentials.
The client does not send dev-role headers or cookies, follow redirects, store tokens in
URLs/localStorage, or render raw server/provider errors. A 401 invalidates the workbench
command session. 409 requests a state reload, not an automatic command retry.

V2 public display IDs are not canonical UUIDs. Command Center links open the project chooser;
the workbench uses UUIDs discovered from the existing scoped project list. A scoped unit
aggregate provides nine independently paginated collections. Partial collection responses
merge only that collection; pagination counts and hasMore remain visible. Detailed objects,
media, grant ledgers and operations use their existing endpoints.

Required aggregate contract: `GET /api/v1/projects/:projectId/production-units/:unitId/workbench`,
`schemaVersion: creative_workbench.v1`, and `collections` containing independently bounded
`recipes`, `evaluations`, `scratchpads`, `explorationAttempts`, `candidates`, `grants`,
`operations`, `localMediaRecipes`, and `mediaResults`. A collection cursor is opaque and
returned unchanged to the same scope. Budget-entry and execution-event history are separately
paginated. No direct database or filesystem access is performed by the frontend.

## Validation

- `npm run test:s6`: portable source-level domain/client tests plus real React server rendering
  for the live dashboard. These use synthetic injected responses, no services or provider calls.
- `npm run lint`: TypeScript noEmit.
- `npm run build`: TypeScript and Vite production bundle. Build does not deploy.
- A separate exact-owned integration harness must verify the entire real HTTP/browser chain,
  reload recovery, permissions, stale CAS, uncertain outcomes, media SHA, explicit promotion,
  actual local resized output, pool stopping, and frozen-layout screenshots.

Test authentication may only be injected into a separate disposable harness. It is not a
default application login path and is not evidence of live identity-provider write readiness.
The existing external identity subject-to-Core-user mapping must be verified independently.

The build-tool dependency refresh uses Vite 7.3.6 and esbuild 0.28.2; the current
lockfile audit reports zero vulnerabilities. The frontend adds no runtime dependencies.
Do not treat a Linux build as Windows security acceptance or publish this public repository
without the required specific publication authorization.

Live dashboard gauges render backend values with the existing SVG dial and visible dynamic
readout. Missing readiness displays “未提供” with no needle or status dot. Baked numeric
reference textures are reserved for explicitly marked mock presentation and are never
rendered or requested by the live dashboard. SVG definitions use unique React instance IDs.
