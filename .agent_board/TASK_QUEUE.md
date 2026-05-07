# TASK_QUEUE.md — Photo Studio OS Frontend

Persistent local task queue for sustained Codex autopilot.

This file is local project coordination state.
It does not authorize remote writes, commits, pushes, deployments, backend changes, dependency changes, secret changes, or destructive actions.

---

## Current Mission

```text
P1B Review / Delivery read-only realization and P2 cockpit completion track
```

Mode:

```text
A4-Sustained Local Frontend Autopilot
```

Goal:

```text
Complete the read-only Frontend v2 production loop by deepening Review Gallery and Delivery Readiness, then aligning all four read-model scenes with Command Center navigation and browser QA.
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

Current safe queue after commit `c19e171`.

```text
1. Refresh docs/design/FRONTEND_V2_GAP_MAP.md and board state to current P1B/P2 facts.
2. Deepen #review-gallery into a read-only client review workspace with gallery grid, selected review item, comment/revision state, status summary, and disabled public-review/write posture.
3. Deepen #delivery-readiness into a read-only delivery outbox workspace with package/manifest summary, readiness checklist, blockers, output count, and disabled external delivery/download posture.
4. Align cross-page selection, preview, detail, and disabled action patterns across Asset Inbox, QC / Retouch, Review Gallery, and Delivery Readiness.
5. Strengthen Command Center production navigation so the first Golden Product Loop IDs and four hash entry points remain clear.
6. Run browser QA for all four hash pages, Command Center entry clicks, tab switching, Chinese mock data, console errors, and 390px viewport.
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
```

### blocked

```text
none
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
