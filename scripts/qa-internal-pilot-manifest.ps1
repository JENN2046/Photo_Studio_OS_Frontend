# Photo Studio OS Frontend internal pilot evidence manifest QA.
# Safe local static check only. This script verifies that the key source,
# script, and documentation artifacts for the internal-pilot goal still exist
# and point to the expected gates. It does not edit files, deploy, push, call
# backend writes, or change dependency manifests.

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
  Write-Host "package.json not found. Run this script from the frontend repo root."
  exit 1
}

$failures = @()

function Add-Failure {
  param([string]$Message)
  $script:failures += $Message
}

function Assert-RequiredFile {
  param(
    [string]$Path,
    [string]$Label
  )

  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    Add-Failure "$Label missing: $Path"
  }
}

function Assert-FileContains {
  param(
    [string]$Path,
    [string]$Pattern,
    [string]$Label
  )

  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    Add-Failure "$Label file missing: $Path"
    return
  }

  $content = Get-Content -LiteralPath $Path -Raw
  if ($content -notmatch $Pattern) {
    Add-Failure "$Label missing in $Path"
  }
}

$sourceArtifacts = @(
  @{ Path = "src\api\client.ts"; Label = "API client switch" },
  @{ Path = "src\api\backendReadModels.ts"; Label = "Backend read-model fetchers" },
  @{ Path = "src\features\command-center\useCommandCenterSnapshot.ts"; Label = "Command Center runtime hook" },
  @{ Path = "src\features\read-models\useBackendReadModel.ts"; Label = "Read-model runtime hook" },
  @{ Path = "src\features\read-models\ReadModelPages.tsx"; Label = "Read-model page shell" },
  @{ Path = "src\features\read-models\readModelWorkspaces.tsx"; Label = "Read-model workspaces" },
  @{ Path = "src\features\auth\authTypes.ts"; Label = "Auth role matrix" },
  @{ Path = "src\features\auth\useAuthState.ts"; Label = "Auth state hook" },
  @{ Path = "src\features\auth\AuthGate.tsx"; Label = "Auth gate components" }
)

$qaArtifacts = @(
  @{ Path = "scripts\validate-local.ps1"; Label = "PowerShell local validation" },
  @{ Path = "scripts\validate-local.sh"; Label = "Bash local validation" },
  @{ Path = "scripts\qa-readonly-source-boundary.ps1"; Label = "Read-only source boundary QA" },
  @{ Path = "scripts\qa-auth-role-matrix.ps1"; Label = "Auth role matrix QA" },
  @{ Path = "scripts\qa-backend-read-all.ps1"; Label = "Backend read aggregate smoke" },
  @{ Path = "scripts\qa-backend-read-smoke.ps1"; Label = "Backend read smoke" },
  @{ Path = "scripts\qa-backend-read-smoke-mock.ps1"; Label = "Backend read mock smoke" },
  @{ Path = "scripts\qa-backend-read-signoff.ps1"; Label = "Guarded backend read signoff" },
  @{ Path = "scripts\qa-readonly-auth-states.ps1"; Label = "Auth state browser QA" },
  @{ Path = "scripts\qa-readonly-auth-live-roles.ps1"; Label = "Live env role QA" },
  @{ Path = "scripts\qa-readonly-all.ps1"; Label = "Full read-only browser QA" },
  @{ Path = "scripts\qa-internal-pilot-readiness.ps1"; Label = "Internal pilot aggregate QA" }
)

$docArtifacts = @(
  @{ Path = "docs\design\FRONTEND_V2_PRODUCTION_ROADMAP.md"; Label = "Production roadmap" },
  @{ Path = "docs\design\FRONTEND_V2_INTERNAL_PILOT_READINESS.md"; Label = "Internal pilot readiness" },
  @{ Path = "docs\design\FRONTEND_V2_INTERNAL_PILOT_GOAL_AUDIT.md"; Label = "Internal pilot goal audit" },
  @{ Path = "docs\design\FRONTEND_V2_INTERNAL_PILOT_SIGNOFF_RECORD.md"; Label = "Internal pilot signoff record" },
  @{ Path = "docs\design\FRONTEND_V2_AUTH_PROVIDER_PREFLIGHT.md"; Label = "Auth provider preflight" },
  @{ Path = "docs\design\FRONTEND_V2_PRODUCTION_RELEASE_CHECKLIST.md"; Label = "Production release checklist" },
  @{ Path = "docs\design\FRONTEND_V2_RISK_REGISTER.md"; Label = "Risk register" },
  @{ Path = "docs\design\FRONTEND_V2_IMPLEMENTATION_HANDOFF.md"; Label = "Implementation handoff" },
  @{ Path = "docs\design\FRONTEND_V2_BACKEND_READ_SMOKE_PLAN.md"; Label = "Backend read smoke plan" },
  @{ Path = "docs\design\FRONTEND_V2_AUTH_ROLE_STATE_DESIGN.md"; Label = "Auth role state design" }
)

foreach ($artifact in @($sourceArtifacts + $qaArtifacts + $docArtifacts)) {
  Assert-RequiredFile -Path $artifact.Path -Label $artifact.Label
}

Assert-FileContains -Path "scripts\validate-local.ps1" -Pattern "qa-readonly-source-boundary\.ps1" -Label "validate-local includes source boundary QA"
Assert-FileContains -Path "scripts\validate-local.ps1" -Pattern "qa-auth-role-matrix\.ps1" -Label "validate-local includes auth role matrix QA"
Assert-FileContains -Path "scripts\validate-local.sh" -Pattern "qa-readonly-source-boundary\.ps1" -Label "Bash validation includes source boundary QA"
Assert-FileContains -Path "scripts\validate-local.sh" -Pattern "qa-auth-role-matrix\.ps1" -Label "Bash validation includes auth role matrix QA"

Assert-FileContains -Path "scripts\qa-internal-pilot-readiness.ps1" -Pattern "qa-backend-read-all\.ps1" -Label "internal pilot aggregate includes backend read smoke"
Assert-FileContains -Path "scripts\qa-internal-pilot-readiness.ps1" -Pattern "ApprovedBackendBaseUrl" -Label "internal pilot aggregate has approved backend signoff switch"
Assert-FileContains -Path "scripts\qa-internal-pilot-readiness.ps1" -Pattern "qa-readonly-auth-live-roles\.ps1" -Label "internal pilot aggregate includes live role QA"
Assert-FileContains -Path "scripts\qa-internal-pilot-readiness.ps1" -Pattern "qa-readonly-auth-states\.ps1" -Label "internal pilot aggregate includes auth-state QA"
Assert-FileContains -Path "scripts\qa-internal-pilot-readiness.ps1" -Pattern "qa-readonly-all\.ps1" -Label "internal pilot aggregate includes full browser QA"

Assert-FileContains -Path "docs\design\FRONTEND_V2_INTERNAL_PILOT_READINESS.md" -Pattern "Blocked on backend URL" -Label "readiness records backend blocker"
Assert-FileContains -Path "docs\design\FRONTEND_V2_INTERNAL_PILOT_READINESS.md" -Pattern "Blocked on platform auth" -Label "readiness records auth blocker"
Assert-FileContains -Path "docs\design\FRONTEND_V2_INTERNAL_PILOT_GOAL_AUDIT.md" -Pattern "LOCAL_FRONTEND_READY_CANDIDATE" -Label "goal audit records local candidate status"
Assert-FileContains -Path "docs\design\FRONTEND_V2_INTERNAL_PILOT_GOAL_AUDIT.md" -Pattern "Blocked externally" -Label "goal audit records external blockers"
Assert-FileContains -Path "docs\design\FRONTEND_V2_INTERNAL_PILOT_SIGNOFF_RECORD.md" -Pattern "Not signed off" -Label "signoff record remains unapproved template"
Assert-FileContains -Path "docs\design\FRONTEND_V2_AUTH_PROVIDER_PREFLIGHT.md" -Pattern "Provider owner named" -Label "auth preflight includes provider owner check"
Assert-FileContains -Path "docs\design\FRONTEND_V2_PRODUCTION_RELEASE_CHECKLIST.md" -Pattern "qa-internal-pilot-readiness\.ps1" -Label "release checklist includes pilot aggregate"

Assert-FileContains -Path "src\api\backendReadModels.ts" -Pattern "fetchCommandCenterV2Snapshot" -Label "backend read fetcher includes Command Center"
Assert-FileContains -Path "src\api\backendReadModels.ts" -Pattern "fetchDeliveryReadinessReadModel" -Label "backend read fetcher includes Delivery Readiness"
Assert-FileContains -Path "src\features\auth\authTypes.ts" -Pattern "pageRoleMatrix" -Label "auth types include role matrix"
Assert-FileContains -Path "src\features\auth\useAuthState.ts" -Pattern "VITE_BACKEND_USER_ROLE" -Label "auth hook includes env role rehearsal"

Write-Host "== Photo Studio OS internal pilot evidence manifest QA =="
Write-Host "Source artifacts: $($sourceArtifacts.Count)"
Write-Host "QA artifacts: $($qaArtifacts.Count)"
Write-Host "Documentation artifacts: $($docArtifacts.Count)"

if ($failures.Count -gt 0) {
  foreach ($failure in $failures) {
    Write-Host "[FAIL] $failure"
  }

  Write-Host ""
  Write-Host "Result: FAILED"
  exit 1
}

Write-Host "All internal-pilot evidence artifacts are present."
Write-Host ""
Write-Host "Result: PASSED"
exit 0
