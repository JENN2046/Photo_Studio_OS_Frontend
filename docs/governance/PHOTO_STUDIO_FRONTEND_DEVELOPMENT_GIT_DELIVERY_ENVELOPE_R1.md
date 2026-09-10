# PHOTO_STUDIO_FRONTEND_DEVELOPMENT_GIT_DELIVERY_ENVELOPE_R1

Owner-issued authority, received 2026-09-10. This repository record preserves the
operative scope of Jenn's durable envelope. The current explicit owner message
is authoritative if a transcription or interpretation differs.

```text
STATUS: AUTHORIZED / DURABLE
PROJECT: Photo Studio OS
TARGET_REPOSITORY: JENN2046/Photo_Studio_OS_Frontend
INHERITS: GLOBAL_MAXIMUM_BOUNDED_AUTONOMY_PRINCIPLE_R1
INHERITS: PHOTO_STUDIO_R1_AUTONOMOUS_EXECUTION_CONTRACT_R1
AUTHORITY_CLASS: DEVELOPMENT_GIT_DELIVERY
PRODUCTION_DEPLOY: NOT AUTHORIZED
PUBLIC_PRODUCT_RELEASE: NOT AUTHORIZED
```

## 1. Purpose

This durable authority removes the previous Frontend public-push micro-approval
boundary. Within Photo Studio Frontend engineering scope, the default is
AUTONOMOUS GIT DELIVERY. No separate approval is needed for push, PR, review
repair, repair commit, PR update or eligible merge to development main, provided
the action remains inside this envelope.

## 2. Immediate delivery target

Source commit: `a1c4629c8d7fd12e8f9cb4e43273cb632ff2148e`.
Known source validation: 31 frontend tests PASS, typecheck PASS, build PASS,
dependency audit 0 vulnerabilities, browser validation PASS.
Initial state: LOCAL_ONLY.
Desired state: DELIVERED_TO_CANONICAL_FRONTEND_DEVELOPMENT_MAIN.

## 3. Existing workspace boundary

The historical/original Frontend workspace has approximately 97 unrelated
changes. They are not included in this authority. Do not use `git add .` or
`git add -A` against a dirty workspace and absorb unrelated work. Prefer the
clean existing S6 worktree or a new isolated worktree from the exact accepted
commit/base. Immediate delivery must derive from `a1c4629...` and its intended
S6 Frontend delta only.

## 4. Remote identity gate

Before remote mutation verify origin is `JENN2046/Photo_Studio_OS_Frontend`.
If it differs: STOP_AUTHORITY_TARGET_MISMATCH. Do not rewrite the remote
automatically.

## 5. Fetch and base resolution

`git fetch --prune origin` is authorized. Determine the current development base
from actual repository state, not a cached base. Prove that the accepted S6 delta
plus current remote base is bounded Frontend-only delivery. Ordinary bounded
reconciliation is autonomous when upstream advances, provided Frozen
Architecture and the accepted S6 outcome remain intact.

## 6. Immediate branch

Prefer `codex/ps-r1-s6`. If it exists remotely, verify its identity/history before
use. If incompatible, create another clearly Photo-Studio-owned development
branch instead of force-rewriting unknown history. No force push for convenience.

## 7. Durable Git authority

Authorized for Photo Studio Frontend development: creating worktrees and
development branches; commits and repair commits; development-branch pushes;
PR creation/updates; reading/responding to review; repairing P1/P2/P3
implementation findings; resolving review threads after proof; inspecting/fixing
CI failures; ordinary branch reconciliation; merging eligible development PRs
into canonical Frontend development main. No new approval is required for these
ordinary Git delivery operations.

## 8. Review and repair loop

Review findings are engineering inputs, not Human approval gates. Current-change
P1 and material P2 findings are AUTO REPAIR; P3 is AUTO REPAIR OR RECORD FOLLOW-UP.
Continue review → diagnose → repair → validate → push → re-review while bounded
and converging. Do not expand S6 delivery to unrelated pre-existing defects
unless they invalidate current correctness or safety.

## 9. Validation before push and merge

Reverify the exact S6 candidate with proportionate tests before first push.
Tests, typecheck and build must PASS. Rerun browser validation when reconciliation
or repair changes behavior relevant to the validated Workbench flow. If a
dependency manifest changes during legitimate repair, rerun the appropriate
dependency audit. Do not call old evidence current after material source changes.

## 10. PR scope

The PR represents S6 Creative Workbench frontend delivery and directly necessary
reconciliation/repair only. Its body must truthfully state source lineage,
tests, typecheck, build, browser validation, dependency audit, known limitations
and production status. Do not claim production deployment, Windows runtime
acceptance or real provider acceptance unless separately proven.

## 11. Main merge authority

Autonomous merge into canonical development main is permitted when repository,
base and head identities are verified; the diff matches intended Frontend scope;
required validation passes; configured CI passes if present; no unresolved
merge-blocking current-change review finding remains; Frozen Architecture is
unchanged; no production deployment occurs; and no uncertain external side effect
exists. Use the repository's appropriate merge method unless ancestry
requirements specify one.

## 12. Protected Git operations

Default forbidden: force push to canonical/shared history, direct overwrite of
main, history rewriting to bypass review, and deleting unrelated remote branches.
Published history may be rewritten only where clearly safe, project-owned,
non-canonical and genuinely necessary. Never rewrite history to evade a gate.

## 13. Production boundary

This authority does not authorize production deployment, traffic cutover,
domain/DNS changes, public product release, production secret changes,
customer-facing publication, client communication or commercial commitment.
Development main merge does not equal production deployment.

## 14. Durable nature

The authority is not limited to `a1c4629...`; that is the immediate first target.
Future Photo Studio Frontend development stages retain autonomous development
push, PR creation/update, review repair, CI repair and eligible development-main
merge authority unless Jenn explicitly revokes/narrows it or a higher Authority
changes it.

## 15. Immediate mission

Deliver the exact source from its actual clean Frontend state into the canonical
development repository: inspect → verify exact commit/diff → fetch → resolve
base → bounded reconciliation if required → validate → push development branch
→ create/update PR → review → ordinary repair loop → validate → eligible merge
→ verify canonical main. Do not return to Jenn for ordinary execution approvals.

## 16. Successful terminal state

```text
RESULT: PHOTO_STUDIO_FRONTEND_S6_DELIVERED
SOURCE_COMMIT: a1c4629c8d7fd12e8f9cb4e43273cb632ff2148e
PR: merged
CANONICAL_FRONTEND_MAIN: <actual resulting SHA>
TESTS: PASS
TYPECHECK: PASS
BUILD: PASS
BROWSER_VALIDATION: <actual evidence>
CI: <actual evidence>
PRODUCTION_DEPLOY: false
```

## 17. Next mainline transition

Immediately after Frontend S6 delivery, PHOTO STUDIO LINUX ENGINEERING DELIVERY
is CLOSED. Transition to PHOTO_STUDIO_R1_WINDOWS_11_ACCEPTANCE. Do not reopen
S1–S8 architecture or Linux implementation planning.

## 18. Windows 11 acceptance scope

Validate/harden the delivered architecture, without redesign. Prove the delivered
R1 baseline on an actual admitted Windows 11 environment. Coverage includes, as
applicable, Backend, Frontend, Prisma/PostgreSQL, Redis/BullMQ, S1–S8 contracts,
Edge Worker, filesystem/process adapters, local service lifecycle, browser
Workbench, platform-specific paths, dependencies and runtime behavior. Linux
PASS must not be treated as Windows PASS.

## 19. Windows environment hard gate

If an explicitly owned and authorized Windows 11 validation environment already
exists, continue autonomously under the active Photo Studio contract. Otherwise:

```text
HARD_STOP: WINDOWS_11_VALIDATION_ENVIRONMENT_AUTHORITY_REQUIRED
BLOCKED_ACTION: Run actual Windows 11 acceptance.
RECOMMENDED_SMALLEST_DURABLE_GRANT:
Authorize one specified Windows 11 machine/environment for Photo Studio
engineering validation, including project checkout/build/test/runtime,
disposable test infrastructure, and bounded platform repair.
```

Do not ask for individual Windows commands after that durable environment
authority is admitted.

## 20. Final rule

```text
Frontend engineering Git delivery: AUTO
Frontend review / repair: AUTO
Eligible development-main merge: AUTO
Production deployment: NOT AUTHORIZED
After Frontend delivery: ENTER WINDOWS 11 ACCEPTANCE
```
