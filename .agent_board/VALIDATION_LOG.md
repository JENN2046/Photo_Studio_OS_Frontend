# VALIDATION_LOG.md — Photo Studio OS Frontend

Validation history for sustained frontend autopilot.

Codex should append entries after running validation.

Do not claim validation that was not run.

---

## Validation Commands Reference

Use only commands that actually exist in the repository.

Common candidates, if available:

```bash
npm run typecheck
npm run lint
npm run build
npm run test
```

Docs-only candidate:

```bash
git diff --check
```

Local helper candidates, if added and safe:

```powershell
./scripts/validate-local.ps1
```

```bash
./scripts/validate-local.sh
```

---

## Entries

```text
## VALIDATION-20260505-2020

Task: Command Center Alpha and Autopilot Rails Pack local validation.
Commands run:
- npm run lint
- npm run build
- git diff --check
- high-confidence secret scan on changed rails/frontend files
Result: passed
Failures: none
Fix attempted: none required
Re-run result: not applicable
Not validated: npm test is not defined; no remote push/deploy validation
Notes: Vite build required sandbox escalation because the sandbox blocks esbuild child process spawn with EPERM.

## VALIDATION-20260505-2045

Task: Local frontend viewport QA and responsive status/gauge polish.
Commands run:
- powershell -ExecutionPolicy Bypass -File scripts\validate-local.ps1
- npm run lint
- npm run build
- Headless Chrome screenshots for 1024x768, 780x844, 390x844 loading, and 390x844 error
Result: passed after responsive CSS fixes
Failures:
- Sandbox run of validate-local.ps1 failed at Vite/esbuild with spawn EPERM.
- 780px screenshot initially showed the secondary SKU gauge before the primary Studio Readiness gauge.
- 390px loading screenshot initially showed the side Read Boundary rail before the main status surface.
- 390px error screenshot initially clipped the long Fault note text.
Fix attempted:
- Reordered primary gauge and main status surface at narrow breakpoints.
- Made mobile status headers vertical.
- Added wrapping and smaller mobile type for status message text.
Re-run result:
- npm run lint passed.
- npm run build passed.
- validate-local.ps1 passed outside sandbox.
- Updated screenshots showed the primary gauge/status first and readable error text.
Not validated:
- No npm test script is defined.
- No commit or push was performed for this follow-up.
Notes:
- The reused local dev server at 127.0.0.1:5173 was not stopped.

## VALIDATION-20260506-1505

Task: Optional frontend v2 backend read-model API bridge.
Commands run:
- npm run lint
- npm run build
- Invoke-WebRequest http://127.0.0.1:5173
- git diff --check
Result: passed
Failures:
- Initial typecheck rejected passing specific query interfaces into a Record<string, string | number | undefined> helper.
Fix attempted:
- Narrowed query serialization to accept object input and serialize only string/number values.
Re-run result:
- npm run lint passed.
- npm run build passed.
- HTTP check returned 200.
- git diff --check passed.
Not validated:
- No npm test script is defined.
- No backend live integration request was run from the frontend in this slice.
- No screenshot QA was run because this was an API boundary change.
Notes:
- Existing Vite dev server at 127.0.0.1:5173 was reused and not stopped.
- Frontend remains mock-first unless VITE_BACKEND_API_BASE_URL is configured.
- API bridge covers Command Center, Asset Inbox, QC / Retouch Queue, Review Gallery, and Delivery Readiness.
```

---

## Entry Template

```text
## VALIDATION-YYYYMMDD-HHMM

Task:
Commands run:
Result:
Failures:
Fix attempted:
Re-run result:
Not validated:
Notes:
```
