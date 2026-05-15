# Photo Studio OS Frontend internal pilot signoff record QA.
# Safe local static check only. This script verifies that the signoff record
# still covers the current internal-pilot evidence stack and remains unapproved.
# It does not edit files, deploy, push, tag, call backend writes, or change
# dependency manifests.

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
  Write-Host "package.json not found. Run this script from the frontend repo root."
  exit 1
}

$signoffPath = "docs\design\FRONTEND_V2_INTERNAL_PILOT_SIGNOFF_RECORD.md"
$failures = @()

function Add-Failure {
  param([string]$Message)
  $script:failures += $Message
}

function Assert-ContainsLiteral {
  param(
    [string]$Content,
    [string]$Text,
    [string]$Label
  )

  if (-not $Content.Contains($Text)) {
    Add-Failure "$Label missing from signoff record"
  }
}

function Assert-ContainsPattern {
  param(
    [string]$Content,
    [string]$Pattern,
    [string]$Label
  )

  if ($Content -notmatch $Pattern) {
    Add-Failure "$Label missing from signoff record"
  }
}

if (-not (Test-Path -LiteralPath $signoffPath -PathType Leaf)) {
  Write-Host "Internal pilot signoff record missing: $signoffPath"
  exit 1
}

$content = Get-Content -LiteralPath $signoffPath -Raw

$requiredLiterals = @(
  @{ Text = 'Target: `Studio Operator Internal Pilot Ready`'; Label = "target header" },
  @{ Text = '| Decision | Not signed off |'; Label = "unapproved decision row" },
  @{ Text = '`npm run lint`'; Label = "lint evidence row" },
  @{ Text = '`npm run build`'; Label = "build evidence row" },
  @{ Text = 'scripts\validate-local.ps1'; Label = "local validation row" },
  @{ Text = 'scripts\qa-internal-pilot-readiness.ps1'; Label = "internal pilot aggregate row" },
  @{ Text = 'docs\design\FRONTEND_V2_INTERNAL_PILOT_LOCAL_VALIDATION_LOG.md'; Label = "local validation evidence log row" },
  @{ Text = 'scripts\qa-readonly-source-boundary.ps1'; Label = "source boundary row" },
  @{ Text = 'scripts\qa-auth-role-matrix.ps1'; Label = "auth role matrix row" },
  @{ Text = 'scripts\qa-internal-pilot-manifest.ps1'; Label = "evidence manifest row" },
  @{ Text = 'scripts\qa-internal-pilot-readiness-guards.ps1'; Label = "pilot readiness guard row" },
  @{ Text = 'scripts\qa-internal-pilot-goal-audit.ps1'; Label = "goal audit guard row" },
  @{ Text = 'scripts\qa-release-boundary-docs.ps1'; Label = "release-boundary docs guard row" },
  @{ Text = 'scripts\qa-backend-read-signoff-guards.ps1'; Label = "backend signoff guard row" },
  @{ Text = 'scripts\qa-readonly-all.ps1'; Label = "full browser QA row" },
  @{ Text = 'scripts\qa-backend-read-all.ps1'; Label = "backend aggregate smoke row" },
  @{ Text = 'scripts\qa-backend-read-signoff.ps1 -BackendBaseUrl <approved-url>'; Label = "approved backend signoff row" },
  @{ Text = '/command-center/v2'; Label = "Command Center backend endpoint row" },
  @{ Text = '/projects/:projectId/asset-inbox'; Label = "Asset Inbox backend endpoint row" },
  @{ Text = '/projects/:projectId/qc-retouch-queue'; Label = "QC backend endpoint row" },
  @{ Text = '/review-sessions/:reviewSessionId/gallery'; Label = "Review backend endpoint row" },
  @{ Text = '/deliveries/:deliveryId/readiness'; Label = "Delivery backend endpoint row" },
  @{ Text = '403 / forbidden state'; Label = "forbidden fixture row" },
  @{ Text = '404 / invalid-id state'; Label = "invalid-id fixture row" },
  @{ Text = 'empty / partial / stale states'; Label = "data-state fixture row" },
  @{ Text = 'Provider owner named'; Label = "auth provider owner row" },
  @{ Text = 'Session source documented'; Label = "session source row" },
  @{ Text = 'Role claim mapping approved'; Label = "role claim row" },
  @{ Text = 'Backend enforcement confirmed'; Label = "backend enforcement row" },
  @{ Text = 'Signed-out fixture'; Label = "signed-out fixture row" },
  @{ Text = 'Expired-session fixture'; Label = "expired-session fixture row" },
  @{ Text = 'Provider-error fixture'; Label = "provider-error fixture row" },
  @{ Text = 'Operator fixture'; Label = "operator fixture row" },
  @{ Text = 'Photographer fixture'; Label = "photographer fixture row" },
  @{ Text = 'Retoucher fixture'; Label = "retoucher fixture row" },
  @{ Text = 'QC reviewer fixture'; Label = "QC reviewer fixture row" },
  @{ Text = 'Client reviewer fixture'; Label = "client reviewer fixture row" },
  @{ Text = 'Delivery approver fixture'; Label = "delivery approver fixture row" },
  @{ Text = 'No backend repo changes'; Label = "backend repo hard boundary row" },
  @{ Text = 'No root repo changes'; Label = "root repo hard boundary row" },
  @{ Text = 'No `.env` or secret-bearing file changes'; Label = "env/secret hard boundary row" },
  @{ Text = 'No dependency manifest or lockfile changes'; Label = "dependency hard boundary row" },
  @{ Text = 'No upload implementation'; Label = "upload hard boundary row" },
  @{ Text = 'No download implementation'; Label = "download hard boundary row" },
  @{ Text = 'No public review links'; Label = "public review hard boundary row" },
  @{ Text = 'No public delivery links'; Label = "public delivery hard boundary row" },
  @{ Text = 'No POST/PATCH/DELETE or business writes'; Label = "write-method hard boundary row" },
  @{ Text = 'No production endpoint usage'; Label = "production endpoint hard boundary row" },
  @{ Text = 'No push/tag/deploy/release performed by this signoff'; Label = "remote/release hard boundary row" },
  @{ Text = '- [ ] Approved as `Studio Operator Internal Pilot Ready`.'; Label = "unchecked final approval option" },
  @{ Text = '- [ ] Approved as local frontend ready candidate only.'; Label = "unchecked local-candidate option" },
  @{ Text = '- [ ] Blocked pending backend read smoke.'; Label = "backend blocker option" },
  @{ Text = '- [ ] Blocked pending platform auth/backend enforcement.'; Label = "auth blocker option" }
)

foreach ($item in $requiredLiterals) {
  Assert-ContainsLiteral -Content $content -Text $item.Text -Label $item.Label
}

Assert-ContainsPattern -Content $content -Pattern '(?im)^\- \[ \] Approved as `Studio Operator Internal Pilot Ready`\.' -Label "final approval checkbox stays unchecked"
Assert-ContainsPattern -Content $content -Pattern '(?im)^\- \[ \] Blocked pending backend read smoke\.' -Label "backend blocker checkbox stays available"
Assert-ContainsPattern -Content $content -Pattern '(?im)^\- \[ \] Blocked pending platform auth/backend enforcement\.' -Label "auth blocker checkbox stays available"

if ($content -match "(?im)^\- \[[xX]\] Approved as") {
  Add-Failure "signoff record contains a checked approval box"
}

if ($content -match "(?im)^\| Decision \| (?!Not signed off \|)") {
  Add-Failure "signoff decision is no longer Not signed off"
}

Write-Host "== Photo Studio OS internal pilot signoff record QA =="
Write-Host "Required signoff evidence markers: $($requiredLiterals.Count)"

if ($failures.Count -gt 0) {
  foreach ($failure in $failures) {
    Write-Host "[FAIL] $failure"
  }

  Write-Host ""
  Write-Host "Result: FAILED"
  exit 1
}

Write-Host "Signoff record covers the current internal-pilot evidence stack and remains unapproved."
Write-Host ""
Write-Host "Result: PASSED"
exit 0
