# BLOCKERS.md — Photo Studio OS Frontend

Hard stops and blocked work.

Codex should update this only when it cannot safely continue.

---

## Active Blockers

```text
BLOCKER-20260515-01: Approved local/staging backend URL is required before real backend read signoff can run.
BLOCKER-20260515-02: Real auth provider/backend enforcement evidence is required before Studio Operator Internal Pilot Ready can be signed off.
```

## BLOCKER-20260515-01 — Approved Backend Read Signoff URL

Status: active external blocker
Detected during: Internal pilot goal audit
Task: S2 Backend Read Integration signoff
Reason: Local mock-backend smoke and guarded signoff scripts exist, but no approved local/staging backend base URL has been provided in this repo or session.
Hard stop gate: Do not guess backend URLs, edit `.env`, use production endpoints, or include credentials in commands.
Files involved: `scripts\qa-backend-read-signoff.ps1`, `scripts\qa-internal-pilot-readiness.ps1`, `docs\design\FRONTEND_V2_INTERNAL_PILOT_GOAL_AUDIT.md`
Validation state: local mock-backend read smoke is covered; real backend read signoff is not run.
Why Codex stopped: running a real backend signoff requires an explicit approved local/staging URL from the user or backend/platform owner.
Required human decision: provide the approved backend environment (`local` or `staging`) and base URL.
Safe next action: run `scripts\qa-internal-pilot-readiness.ps1 -ApprovedBackendEnvironment <local|staging> -ApprovedBackendBaseUrl <approved-url>` after the URL is provided.
Rollback or cleanup path: no local repo cleanup needed; no backend command has been run.

## BLOCKER-20260515-02 — Real Auth Provider / Backend Enforcement Evidence

Status: active external blocker
Detected during: Internal pilot goal audit
Task: S3 Auth / Role Readiness signoff
Reason: Frontend role gates, session states, and env-role rehearsals are covered locally, but real auth provider/session source/role claims and backend endpoint enforcement evidence are external to this frontend repo.
Hard stop gate: Do not implement production auth, store tokens, edit `.env`, or call credentialed production services from this repo.
Files involved: `docs\design\FRONTEND_V2_AUTH_PROVIDER_PREFLIGHT.md`, `docs\design\FRONTEND_V2_INTERNAL_PILOT_SIGNOFF_RECORD.md`, `scripts\qa-auth-provider-preflight.ps1`
Validation state: frontend auth/role readiness is locally validated; platform auth/backend enforcement is not evidenced.
Why Codex stopped: real provider and backend enforcement proof requires backend/platform owner evidence or an approved staging fixture.
Required human decision: provide auth provider owner evidence, session/role claim mapping, and backend enforcement results for each read-model endpoint.
Safe next action: record the external evidence in the signoff record after it is actually provided and verified.
Rollback or cleanup path: no local repo cleanup needed; current frontend remains mock-first/read-only.

---

## Blocker Template

```text
## BLOCKER-YYYYMMDD-NN — Title

Status:
Detected during:
Task:
Reason:
Hard stop gate:
Files involved:
Validation state:
Why Codex stopped:
Required human decision:
Safe next action:
Rollback or cleanup path:
```

---

## Hard Stop Gate Reference

Codex must stop if the next step requires:

```text
backend changes
root control repo changes
dependency changes
.env or secret changes
deploy / release / publish
push / PR / remote branch / tag
upload / download / auth / storage
production or external service write
destructive command
overwriting user-owned uncommitted work
validation failure requiring scope expansion
breaking approved Command Center visual direction
```
