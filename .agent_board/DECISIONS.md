# DECISIONS.md — Photo Studio OS Frontend

Local decision log for safe frontend autopilot choices.

This file records small implementation decisions made by Codex when multiple safe options existed.

It does not authorize high-risk changes.

---

## Decision Rules

Codex may decide ordinary local frontend details without asking the user, including:

- component names
- mock field names
- small CSS / token refinements
- read-only type boundaries
- local file organization inside existing structure
- obvious validation fixes

Codex must not decide without approval:

- dependency additions
- backend contracts that require backend changes now
- auth / upload / storage design
- production API URLs
- deployment strategy
- replacing the approved visual direction
- broad architecture rewrite

---

## Decisions

```text
DECISION-20260505-01: Commit Command Center Alpha UI/code separately from Autopilot Rails Pack.
Reason: Keep product frontend history separate from local agent workflow rails.

DECISION-20260505-02: Do not push after local commits without explicit remote approval.
Reason: Remote writes remain a hard stop gate.
```

---

## Decision Template

```text
## DECISION-YYYYMMDD-NN — Title

Context:
Options:
Chosen:
Reason:
Files affected:
Risk:
Validation:
Rollback:
```
