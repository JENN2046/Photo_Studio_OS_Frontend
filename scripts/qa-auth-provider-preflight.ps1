# Photo Studio OS Frontend auth provider preflight QA.
# Safe local static check only. This script verifies that the real-auth
# integration preflight still documents the required owners, session/role
# contracts, staging fixtures, and hard boundaries before any provider work.
# It does not edit files, deploy, push, call auth services, call backend writes,
# or change dependency manifests.

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

$preflightPath = "docs\design\FRONTEND_V2_AUTH_PROVIDER_PREFLIGHT.md"
$authDesignPath = "docs\design\FRONTEND_V2_AUTH_ROLE_STATE_DESIGN.md"
$authTypesPath = "src\features\auth\authTypes.ts"
$authHookPath = "src\features\auth\useAuthState.ts"

$requiredFiles = @(
  @{ Path = $preflightPath; Label = "Auth provider preflight" },
  @{ Path = $authDesignPath; Label = "Auth role-state design" },
  @{ Path = $authTypesPath; Label = "Auth types" },
  @{ Path = $authHookPath; Label = "Auth state hook" },
  @{ Path = "scripts\qa-auth-role-matrix.ps1"; Label = "Auth role matrix QA" },
  @{ Path = "scripts\qa-readonly-auth-states.ps1"; Label = "Auth state browser QA" },
  @{ Path = "scripts\qa-readonly-auth-live-roles.ps1"; Label = "Live env role QA" }
)

foreach ($file in $requiredFiles) {
  Assert-RequiredFile -Path $file.Path -Label $file.Label
}

$requiredDecisionRows = @(
  "Provider",
  "Session transport",
  "Role claim",
  "Expiry model",
  "Forbidden model",
  "Partial access",
  "Retry behavior",
  "Audit identity"
)

foreach ($decision in $requiredDecisionRows) {
  Assert-FileContains -Path $preflightPath -Pattern "\|\s*$([regex]::Escape($decision))\s*\|" -Label "required decision row: $decision"
}

$requiredFixtures = @(
  "No session",
  "Expired session",
  "Provider failure",
  "Operator",
  "Photographer",
  "Retoucher",
  "QC reviewer",
  "Client reviewer",
  "Delivery approver"
)

foreach ($fixture in $requiredFixtures) {
  Assert-FileContains -Path $preflightPath -Pattern "\|\s*$([regex]::Escape($fixture))\s*\|" -Label "required staging fixture: $fixture"
}

$requiredReviewChecks = @(
  "Provider owner named",
  "Session source documented",
  'Role claim mapping reviewed against `src\\features\\auth\\authTypes\.ts`',
  "Backend enforcement confirmed for each read-model endpoint",
  "Signed-out, expired, loading, error, forbidden, and partial-access fixtures exist",
  "No frontend credential storage is introduced",
  "No production auth endpoint appears in source or docs",
  "scripts\\qa-auth-role-matrix\.ps1",
  "scripts\\qa-readonly-auth-states\.ps1",
  "scripts\\qa-readonly-auth-live-roles\.ps1"
)

foreach ($check in $requiredReviewChecks) {
  Assert-FileContains -Path $preflightPath -Pattern $check -Label "required auth preflight review check: $check"
}

$roleIdentifiers = @(
  "admin",
  "operator",
  "photographer",
  "retoucher",
  "qc_reviewer",
  "client",
  "delivery_approver"
)

foreach ($role in $roleIdentifiers) {
  Assert-FileContains -Path $authTypesPath -Pattern "`"$([regex]::Escape($role))`"" -Label "auth type role identifier: $role"
  Assert-FileContains -Path $preflightPath -Pattern $role -Label "auth preflight role-claim mention: $role"
}

Assert-FileContains -Path $preflightPath -Pattern "It is a planning and review artifact only" -Label "preflight remains planning-only"
Assert-FileContains -Path $preflightPath -Pattern "does not\s+implement production auth" -Label "preflight does not claim production auth"
Assert-FileContains -Path $preflightPath -Pattern "replace backend authorization" -Label "preflight preserves backend enforcement boundary"
Assert-FileContains -Path $preflightPath -Pattern "Still external" -Label "preflight records external blockers"
Assert-FileContains -Path $preflightPath -Pattern "Auth provider ownership" -Label "preflight records provider ownership blocker"
Assert-FileContains -Path $preflightPath -Pattern "Backend authorization enforcement" -Label "preflight records backend enforcement blocker"
Assert-FileContains -Path $preflightPath -Pattern "Do not place the approved URL in docs, source, ``\.env``, screenshots, or commit\s+messages\." -Label "preflight preserves approved URL secrecy"
Assert-FileContains -Path $preflightPath -Pattern "Stop and request explicit approval" -Label "preflight has stop conditions"
Assert-FileContains -Path $authDesignPath -Pattern "Frontend enforcement is presentation-only" -Label "auth design preserves frontend display-only boundary"
Assert-FileContains -Path $authDesignPath -Pattern "Backend must independently enforce permissions" -Label "auth design preserves backend enforcement boundary"

Write-Host "== Photo Studio OS auth provider preflight QA =="
Write-Host "Decision rows: $($requiredDecisionRows.Count)"
Write-Host "Staging fixtures: $($requiredFixtures.Count)"
Write-Host "Role identifiers: $($roleIdentifiers.Count)"

if ($failures.Count -gt 0) {
  foreach ($failure in $failures) {
    Write-Host "[FAIL] $failure"
  }

  Write-Host ""
  Write-Host "Result: FAILED"
  exit 1
}

Write-Host "Auth provider preflight remains blocked on explicit backend/platform signoff."
Write-Host ""
Write-Host "Result: PASSED"
exit 0
