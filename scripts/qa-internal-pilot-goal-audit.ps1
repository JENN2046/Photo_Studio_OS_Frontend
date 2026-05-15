# Photo Studio OS Frontend internal pilot goal audit QA.
# Safe local static check only. This script verifies that the active internal
# pilot goal is represented as a local frontend-ready candidate with external
# backend/auth signoff blockers still explicit. It does not edit files, deploy,
# push, call backend writes, or change dependency manifests.

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

$goalAuditPath = "docs\design\FRONTEND_V2_INTERNAL_PILOT_GOAL_AUDIT.md"
$signoffPath = "docs\design\FRONTEND_V2_INTERNAL_PILOT_SIGNOFF_RECORD.md"
$readinessPath = "docs\design\FRONTEND_V2_INTERNAL_PILOT_READINESS.md"
$authPreflightPath = "docs\design\FRONTEND_V2_AUTH_PROVIDER_PREFLIGHT.md"
$releaseChecklistPath = "docs\design\FRONTEND_V2_PRODUCTION_RELEASE_CHECKLIST.md"
$boardBlockersPath = ".agent_board\BLOCKERS.md"

$requiredFiles = @(
  @{ Path = $goalAuditPath; Label = "Internal pilot goal audit" },
  @{ Path = $signoffPath; Label = "Internal pilot signoff record" },
  @{ Path = $readinessPath; Label = "Internal pilot readiness" },
  @{ Path = $authPreflightPath; Label = "Auth provider preflight" },
  @{ Path = $releaseChecklistPath; Label = "Production release checklist" },
  @{ Path = $boardBlockersPath; Label = "Agent board blocker ledger" },
  @{ Path = "scripts\qa-internal-pilot-readiness.ps1"; Label = "Internal pilot aggregate QA" },
  @{ Path = "scripts\qa-internal-pilot-manifest.ps1"; Label = "Internal pilot evidence manifest QA" },
  @{ Path = "scripts\qa-internal-pilot-readiness-guards.ps1"; Label = "Internal pilot aggregate guard QA" },
  @{ Path = "scripts\qa-internal-pilot-signoff-record.ps1"; Label = "Internal pilot signoff record QA" },
  @{ Path = "scripts\qa-release-boundary-docs.ps1"; Label = "Release-boundary docs QA" },
  @{ Path = "scripts\qa-backend-read-signoff.ps1"; Label = "Guarded backend read signoff" },
  @{ Path = "scripts\qa-backend-read-signoff-guards.ps1"; Label = "Backend read signoff guard QA" },
  @{ Path = "scripts\qa-auth-role-matrix.ps1"; Label = "Auth role matrix QA" },
  @{ Path = "scripts\qa-auth-provider-preflight.ps1"; Label = "Auth provider preflight QA" }
)

foreach ($file in $requiredFiles) {
  Assert-RequiredFile -Path $file.Path -Label $file.Label
}

Assert-FileContains -Path $goalAuditPath -Pattern "Studio Operator Internal Pilot Ready:\s*LOCAL_FRONTEND_READY_CANDIDATE" -Label "goal audit records local candidate status"
Assert-FileContains -Path $goalAuditPath -Pattern "Blocked externally" -Label "goal audit keeps external blockers visible"
Assert-FileContains -Path $goalAuditPath -Pattern "Real backend read smoke" -Label "goal audit records backend smoke blocker"
Assert-FileContains -Path $goalAuditPath -Pattern "Real backend authorization enforcement" -Label "goal audit records backend authorization blocker"
Assert-FileContains -Path $goalAuditPath -Pattern "Real platform auth/session" -Label "goal audit records platform auth blocker"
Assert-FileContains -Path $goalAuditPath -Pattern "qa-internal-pilot-readiness-guards\.ps1" -Label "goal audit records aggregate guard evidence"
Assert-FileContains -Path $goalAuditPath -Pattern "qa-internal-pilot-signoff-record\.ps1" -Label "goal audit records signoff record guard evidence"
Assert-FileContains -Path $goalAuditPath -Pattern "No production release, push, tag, deploy" -Label "goal audit preserves remote/release boundary"

Assert-FileContains -Path $signoffPath -Pattern "\|\s*Decision\s*\|\s*Not signed off\s*\|" -Label "signoff decision remains unapproved"
Assert-FileContains -Path $signoffPath -Pattern '\- \[ \] Approved as `Studio Operator Internal Pilot Ready`\.' -Label "final approval checkbox remains unchecked"
Assert-FileContains -Path $signoffPath -Pattern "\- \[ \] Approved as local frontend ready candidate only\." -Label "local-candidate approval checkbox remains unchecked"
Assert-FileContains -Path $signoffPath -Pattern "\- \[ \] Blocked pending backend read smoke\." -Label "backend-smoke blocker checkbox remains available"
Assert-FileContains -Path $signoffPath -Pattern "\- \[ \] Blocked pending platform auth/backend enforcement\." -Label "auth/backend-enforcement blocker checkbox remains available"
Assert-FileContains -Path $signoffPath -Pattern "No push/tag/deploy/release performed by this signoff" -Label "signoff preserves remote/release boundary"

$signoffContent = if (Test-Path -LiteralPath $signoffPath -PathType Leaf) {
  Get-Content -LiteralPath $signoffPath -Raw
} else {
  ""
}

if ($signoffContent -match "(?im)^\- \[[xX]\] Approved as") {
  Add-Failure "signoff record contains a checked approval box"
}

Assert-FileContains -Path $readinessPath -Pattern "Blocked on backend URL" -Label "readiness records backend URL blocker"
Assert-FileContains -Path $readinessPath -Pattern "Blocked on platform auth" -Label "readiness records platform auth blocker"
Assert-FileContains -Path $readinessPath -Pattern "External Signoff Still Required" -Label "readiness keeps external signoff section"
Assert-FileContains -Path $readinessPath -Pattern "Signoff record coverage" -Label "readiness records signoff record guard"
Assert-FileContains -Path $readinessPath -Pattern "Release manager approval for push, tag, deploy, or production rollout" -Label "readiness preserves release approval boundary"

Assert-FileContains -Path $authPreflightPath -Pattern "Provider owner named" -Label "auth preflight keeps provider owner gate"
Assert-FileContains -Path $releaseChecklistPath -Pattern "qa-internal-pilot-signoff-record\.ps1" -Label "release checklist keeps signoff record guard"
Assert-FileContains -Path $releaseChecklistPath -Pattern "qa-backend-read-signoff\.ps1" -Label "release checklist keeps backend signoff gate"
Assert-FileContains -Path $releaseChecklistPath -Pattern "Do not execute these steps without explicit approval" -Label "release checklist preserves explicit release approval boundary"

Assert-FileContains -Path $boardBlockersPath -Pattern "BLOCKER-20260515-01" -Label "agent board records backend URL blocker"
Assert-FileContains -Path $boardBlockersPath -Pattern "Approved local/staging backend URL" -Label "agent board names approved backend URL blocker"
Assert-FileContains -Path $boardBlockersPath -Pattern "BLOCKER-20260515-02" -Label "agent board records auth/backend enforcement blocker"
Assert-FileContains -Path $boardBlockersPath -Pattern "Real auth provider/backend enforcement evidence" -Label "agent board names auth/backend enforcement blocker"
Assert-FileContains -Path $boardBlockersPath -Pattern "Studio Operator Internal Pilot Ready" -Label "agent board keeps full pilot readiness blocked until external evidence exists"

Write-Host "== Photo Studio OS internal pilot goal audit QA =="

if ($failures.Count -gt 0) {
  foreach ($failure in $failures) {
    Write-Host "[FAIL] $failure"
  }

  Write-Host ""
  Write-Host "Result: FAILED"
  exit 1
}

Write-Host "Status: LOCAL_FRONTEND_READY_CANDIDATE"
Write-Host "External blockers remain documented."
Write-Host "Signoff record remains unapproved."
Write-Host ""
Write-Host "Result: PASSED"
exit 0
