# Photo Studio OS Frontend auth/backend enforcement signoff QA.
# Safe local static check only. This script verifies that the S3 external
# auth/backend enforcement evidence pack stays concrete, owner-oriented, and
# boundary-safe before any real auth provider work begins. It does not edit
# files, deploy, push, call auth services, call backend writes, or change
# dependency manifests.

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

function Assert-FileNotContains {
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
  if ($content -match $Pattern) {
    Add-Failure "$Label found in $Path"
  }
}

$signoffPackPath = "docs\design\FRONTEND_V2_AUTH_BACKEND_ENFORCEMENT_SIGNOFF.md"
$preflightPath = "docs\design\FRONTEND_V2_AUTH_PROVIDER_PREFLIGHT.md"
$authDesignPath = "docs\design\FRONTEND_V2_AUTH_ROLE_STATE_DESIGN.md"
$pilotSignoffPath = "docs\design\FRONTEND_V2_INTERNAL_PILOT_SIGNOFF_RECORD.md"

$requiredFiles = @(
  @{ Path = $signoffPackPath; Label = "Auth/backend enforcement signoff pack" },
  @{ Path = $preflightPath; Label = "Auth provider preflight" },
  @{ Path = $authDesignPath; Label = "Auth role-state design" },
  @{ Path = $pilotSignoffPath; Label = "Internal pilot signoff record" },
  @{ Path = "scripts\qa-auth-role-matrix.ps1"; Label = "Auth role matrix QA" },
  @{ Path = "scripts\qa-readonly-auth-states.ps1"; Label = "Auth state browser QA" },
  @{ Path = "scripts\qa-readonly-auth-live-roles.ps1"; Label = "Live env role QA" },
  @{ Path = "scripts\qa-internal-pilot-readiness.ps1"; Label = "Internal pilot aggregate QA" }
)

foreach ($file in $requiredFiles) {
  Assert-RequiredFile -Path $file.Path -Label $file.Label
}

$requiredDecisions = @(
  "Auth provider owner",
  "Session source",
  "Role claim",
  "Role mapping",
  "Forbidden response contract",
  "Session expiry contract",
  "Backend enforcement owner",
  "Staging fixture owner"
)

foreach ($decision in $requiredDecisions) {
  $decisionPattern = "\|\s*" + [regex]::Escape($decision) + "\s*\|"
  Assert-FileContains -Path $signoffPackPath -Pattern $decisionPattern -Label "required owner decision: $decision"
}

$roles = @(
  "admin",
  "operator",
  "photographer",
  "retoucher",
  "qc_reviewer",
  "client",
  "delivery_approver"
)

foreach ($role in $roles) {
  $rolePattern = [regex]::Escape("``$role``")
  Assert-FileContains -Path $signoffPackPath -Pattern $rolePattern -Label "role evidence row: $role"
}

$endpoints = @(
  "/command-center/v2",
  "/projects/:projectId/asset-inbox",
  "/projects/:projectId/qc-retouch-queue",
  "/review-sessions/:reviewSessionId/gallery",
  "/deliveries/:deliveryId/readiness"
)

foreach ($endpoint in $endpoints) {
  Assert-FileContains -Path $signoffPackPath -Pattern $([regex]::Escape($endpoint)) -Label "endpoint enforcement row: $endpoint"
}

$fixtures = @(
  "Signed-out",
  "Expired session",
  "Provider error",
  "Forbidden role",
  "Partial-access role",
  "Empty read model",
  "Partial read model",
  "Stale read model"
)

foreach ($fixture in $fixtures) {
  $fixturePattern = "\|\s*" + [regex]::Escape($fixture) + "\s*\|"
  Assert-FileContains -Path $signoffPackPath -Pattern $fixturePattern -Label "staging fixture row: $fixture"
}

$requiredBoundaryPatterns = @(
  "planning and evidence intake artifact only",
  "does not implement\s+production auth",
  "No secret",
  "Production URLs",
  "frontend route gates are enforcement",
  "Backend enforcement must be described as backend-owned",
  "Frontend route gates must remain presentation-only",
  'signoff record decision must remain `Not signed off`',
  "Push, tag, deploy, release",
  "Stop and request explicit approval"
)

foreach ($pattern in $requiredBoundaryPatterns) {
  Assert-FileContains -Path $signoffPackPath -Pattern $pattern -Label "boundary phrase: $pattern"
}

$requiredCommandPatterns = @(
  "qa-auth-role-matrix\.ps1",
  "qa-readonly-auth-states\.ps1",
  "qa-readonly-auth-live-roles\.ps1",
  "qa-auth-provider-preflight\.ps1",
  "qa-internal-pilot-readiness\.ps1"
)

foreach ($pattern in $requiredCommandPatterns) {
  Assert-FileContains -Path $signoffPackPath -Pattern $pattern -Label "local evidence command: $pattern"
}

Assert-FileContains -Path $preflightPath -Pattern "FRONTEND_V2_AUTH_BACKEND_ENFORCEMENT_SIGNOFF\.md" -Label "auth preflight points to enforcement signoff pack"
Assert-FileContains -Path $pilotSignoffPath -Pattern "FRONTEND_V2_AUTH_BACKEND_ENFORCEMENT_SIGNOFF\.md" -Label "pilot signoff record points to enforcement signoff pack"
Assert-FileContains -Path $authDesignPath -Pattern "Frontend enforcement is presentation-only" -Label "auth design preserves frontend display-only boundary"
Assert-FileContains -Path $authDesignPath -Pattern "Backend must independently enforce permissions" -Label "auth design preserves backend enforcement boundary"
Assert-FileNotContains -Path $signoffPackPath -Pattern "(?i)(bearer\s+[A-Za-z0-9._-]+|api[_-]?key\s*[:=]|password\s*[:=]|secret\s*[:=])" -Label "secret-like value"
Assert-FileNotContains -Path $signoffPackPath -Pattern "(?i)https?://(?!127\.0\.0\.1|localhost)" -Label "non-local URL"

Write-Host "== Photo Studio OS auth/backend enforcement signoff QA =="
Write-Host "Owner decisions: $($requiredDecisions.Count)"
Write-Host "Roles: $($roles.Count)"
Write-Host "Endpoints: $($endpoints.Count)"
Write-Host "Fixtures: $($fixtures.Count)"

if ($failures.Count -gt 0) {
  foreach ($failure in $failures) {
    Write-Host "[FAIL] $failure"
  }

  Write-Host ""
  Write-Host "Result: FAILED"
  exit 1
}

Write-Host "Auth/backend enforcement signoff pack remains boundary-safe."
Write-Host ""
Write-Host "Result: PASSED"
exit 0
