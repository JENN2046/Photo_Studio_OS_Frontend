# BLOCKERS.md — Photo Studio OS Frontend

Hard stops and blocked work.

Codex should update this only when it cannot safely continue.

---

## Active Blockers

```text
none
```

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
