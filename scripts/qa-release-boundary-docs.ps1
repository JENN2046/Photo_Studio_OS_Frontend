# Photo Studio OS Frontend release-boundary documentation QA.
# Safe local static check only. This script verifies that key docs still
# separate local internal-pilot readiness from production release, and that
# release/signoff execution checkboxes remain unapproved. It does not edit
# files, deploy, push, tag, call backend writes, or change dependency manifests.

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

$roadmapPath = "docs\design\FRONTEND_V2_PRODUCTION_ROADMAP.md"
$releaseChecklistPath = "docs\design\FRONTEND_V2_PRODUCTION_RELEASE_CHECKLIST.md"
$pilotReadinessPath = "docs\design\FRONTEND_V2_INTERNAL_PILOT_READINESS.md"
$goalAuditPath = "docs\design\FRONTEND_V2_INTERNAL_PILOT_GOAL_AUDIT.md"
$localValidationLogPath = "docs\design\FRONTEND_V2_INTERNAL_PILOT_LOCAL_VALIDATION_LOG.md"
$signoffPath = "docs\design\FRONTEND_V2_INTERNAL_PILOT_SIGNOFF_RECORD.md"
$riskRegisterPath = "docs\design\FRONTEND_V2_RISK_REGISTER.md"
$reviewChecklistPath = "docs\design\FRONTEND_V2_PRODUCTION_REVIEW_CHECKLIST.md"

$requiredDocs = @(
  @{ Path = $roadmapPath; Label = "Production roadmap" },
  @{ Path = $releaseChecklistPath; Label = "Production release checklist" },
  @{ Path = $pilotReadinessPath; Label = "Internal pilot readiness" },
  @{ Path = $goalAuditPath; Label = "Internal pilot goal audit" },
  @{ Path = $localValidationLogPath; Label = "Internal pilot local validation log" },
  @{ Path = $signoffPath; Label = "Internal pilot signoff record" },
  @{ Path = $riskRegisterPath; Label = "Risk register" },
  @{ Path = $reviewChecklistPath; Label = "Production review checklist" }
)

foreach ($doc in $requiredDocs) {
  Assert-RequiredFile -Path $doc.Path -Label $doc.Label
}

Assert-FileContains -Path $roadmapPath -Pattern "It is a planning document only" -Label "roadmap remains planning-only"
Assert-FileContains -Path $roadmapPath -Pattern "does not authorize backend writes, auth rollout, upload/download, storage integration, public review links, public delivery links, deployment, release, push, PR, dependency changes, secret changes, or production operations" -Label "roadmap preserves no-release authority"
Assert-FileContains -Path $roadmapPath -Pattern "Deployment, release, production write, tag, push, PR, and remote actions require explicit approval" -Label "roadmap preserves release stop gate"
Assert-FileContains -Path $roadmapPath -Pattern "Do not treat a local QA pass as production approval" -Label "roadmap separates local QA from production approval"

Assert-FileContains -Path $releaseChecklistPath -Pattern "Do not execute these steps without explicit approval" -Label "release checklist preserves explicit approval gate"
Assert-FileContains -Path $releaseChecklistPath -Pattern "\- \[ \] Tag created:" -Label "release tag-created checkbox remains unchecked"
Assert-FileContains -Path $releaseChecklistPath -Pattern "\- \[ \] Tag pushed:" -Label "release tag-pushed checkbox remains unchecked"
Assert-FileContains -Path $releaseChecklistPath -Pattern "\- \[ \] Release deployed to production" -Label "release deployed checkbox remains unchecked"
Assert-FileContains -Path $releaseChecklistPath -Pattern "\- \[ \] Post-deploy smoke test passed" -Label "post-deploy checkbox remains unchecked"
Assert-FileContains -Path $releaseChecklistPath -Pattern "\- \[ \] Release announced to team" -Label "release announced checkbox remains unchecked"
Assert-FileNotContains -Path $releaseChecklistPath -Pattern "(?im)^\- \[[xX]\] (Tag created|Tag pushed|Release deployed to production|Post-deploy smoke test passed|Release announced to team)" -Label "checked release execution checkbox"

Assert-FileContains -Path $pilotReadinessPath -Pattern "The pilot is not production ready until backend read smoke and platform auth are\s+verified" -Label "pilot readiness remains non-production"
Assert-FileContains -Path $pilotReadinessPath -Pattern "External Signoff Still Required" -Label "pilot readiness keeps external signoff section"
Assert-FileContains -Path $pilotReadinessPath -Pattern "Release manager approval for push, tag, deploy, or production rollout" -Label "pilot readiness preserves release approval blocker"

Assert-FileContains -Path $goalAuditPath -Pattern "Studio Operator Internal Pilot Ready:\s*LOCAL_FRONTEND_READY_CANDIDATE" -Label "goal audit remains local candidate"
Assert-FileContains -Path $goalAuditPath -Pattern "No production release, push, tag, deploy" -Label "goal audit preserves production boundary"
Assert-FileNotContains -Path $goalAuditPath -Pattern "Studio Operator Internal Pilot Ready:\s*(COMPLETE|DONE|PRODUCTION_READY|SIGNED_OFF)" -Label "goal audit must not claim full completion"

Assert-FileContains -Path $localValidationLogPath -Pattern "records local validation evidence only" -Label "local validation log remains local-only"
Assert-FileContains -Path $localValidationLogPath -Pattern "does not approve\s+backend signoff, platform auth, staging acceptance, push, tag, deploy, release" -Label "local validation log preserves approval boundary"
Assert-FileContains -Path $localValidationLogPath -Pattern "Approved backend signoff was skipped" -Label "local validation log keeps backend signoff gap"
Assert-FileContains -Path $localValidationLogPath -Pattern "Studio Operator Internal Pilot Ready:\s*LOCAL_FRONTEND_READY_CANDIDATE" -Label "local validation log remains candidate-only"
Assert-FileNotContains -Path $localValidationLogPath -Pattern "Studio Operator Internal Pilot Ready:\s*(COMPLETE|DONE|PRODUCTION_READY|SIGNED_OFF)" -Label "local validation log must not claim full completion"

Assert-FileContains -Path $signoffPath -Pattern "\|\s*Decision\s*\|\s*Not signed off\s*\|" -Label "signoff decision remains unapproved"
Assert-FileNotContains -Path $signoffPath -Pattern "(?im)^\- \[[xX]\] Approved as" -Label "checked signoff approval checkbox"

Assert-FileContains -Path $riskRegisterPath -Pattern "Production release is treated as a continuation of local QA" -Label "risk register keeps production-release risk"
Assert-FileContains -Path $riskRegisterPath -Pattern "Internal pilot readiness is not production release approval" -Label "risk register preserves pilot/release separation"
Assert-FileContains -Path $reviewChecklistPath -Pattern "does not authorize remote writes, deployment, production config changes, dependency changes, or backend changes" -Label "review checklist preserves authority boundary"

$docFiles = @(
  git ls-files "README.md" "docs/**/*.md"
) | Where-Object { $_ -and (Test-Path -LiteralPath $_ -PathType Leaf) }

$nonLocalUrlPattern = "https?://(?!(127\.0\.0\.1|localhost|example\.com|photo-studio-os-api)([:/]|$))"
$urlMatches = @()
if ($docFiles.Count -gt 0) {
  $urlMatches = @(Select-String -Path $docFiles -Pattern $nonLocalUrlPattern)
}

if ($urlMatches.Count -gt 0) {
  foreach ($match in $urlMatches) {
    Add-Failure "non-local/non-example URL in docs: $($match.Path):$($match.LineNumber)"
  }
}

Write-Host "== Photo Studio OS release-boundary docs QA =="
Write-Host "Required docs: $($requiredDocs.Count)"
Write-Host "Docs scanned for non-local URLs: $($docFiles.Count)"

if ($failures.Count -gt 0) {
  foreach ($failure in $failures) {
    Write-Host "[FAIL] $failure"
  }

  Write-Host ""
  Write-Host "Result: FAILED"
  exit 1
}

Write-Host "Release, signoff, and production boundaries remain explicit."
Write-Host ""
Write-Host "Result: PASSED"
exit 0
