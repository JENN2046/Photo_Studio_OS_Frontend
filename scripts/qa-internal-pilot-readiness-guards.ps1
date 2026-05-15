# Photo Studio OS Frontend internal pilot readiness guard QA.
# Safe local static/negative-path check only. This script verifies that the
# internal pilot aggregate exposes approved backend expectation controls and
# rejects mixed backend expectation modes before long browser/backend QA can run.
# It does not edit files, deploy, push, call backend writes, or change
# dependency manifests.

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
  Write-Host "package.json not found. Run this script from the frontend repo root."
  exit 1
}

$readinessPath = "scripts\qa-internal-pilot-readiness.ps1"

if (-not (Test-Path -LiteralPath $readinessPath -PathType Leaf)) {
  Write-Host "Internal pilot readiness script missing: $readinessPath"
  exit 1
}

$readinessSource = Get-Content -LiteralPath $readinessPath -Raw
$failed = $false

function Add-Failure {
  param([string]$Message)
  $script:failed = $true
  Write-Host "[FAIL] $Message"
}

Write-Host "== Photo Studio OS internal pilot readiness guard QA =="

if ($readinessSource -notmatch "ApprovedBackendExpectedReadModelState" -or $readinessSource -notmatch '"ready", "empty", "partial", "stale"') {
  Add-Failure "aggregate must expose approved backend ready/empty/partial/stale data-state expectations"
}

foreach ($routeStateOption in @(
  "ApprovedBackendAssetInboxExpectedReadModelState",
  "ApprovedBackendQcRetouchExpectedReadModelState",
  "ApprovedBackendReviewGalleryExpectedReadModelState",
  "ApprovedBackendDeliveryReadinessExpectedReadModelState"
)) {
  if ($readinessSource -notmatch $routeStateOption) {
    Add-Failure "aggregate must expose $routeStateOption"
  }
}

if ($readinessSource -notmatch "ApprovedBackendUserRole" -or $readinessSource -notmatch "ApprovedBackendUserName") {
  Add-Failure "aggregate must expose backend smoke role/name options for local/staging signoff"
}

if ($readinessSource -notmatch "ApprovedBackendExpectReadFailure" -or $readinessSource -notmatch "ApprovedBackendExpectedFailureState") {
  Add-Failure "aggregate must expose approved backend failure-state expectations"
}

if ($readinessSource -notmatch "qa-backend-read-signoff\.ps1") {
  Add-Failure "aggregate must delegate approved backend smoke through the guarded signoff wrapper"
}

if ($readinessSource -notmatch '\$signoffArgs \+= "-ExpectedReadModelState"' -or $readinessSource -notmatch '\$signoffArgs \+= \$ApprovedBackendExpectedReadModelState') {
  Add-Failure "aggregate must pass expected backend data-state options to the signoff wrapper"
}

if ($readinessSource -notmatch '\$signoffArgs \+= "-AssetInboxExpectedReadModelState"' -or
  $readinessSource -notmatch '\$signoffArgs \+= "-QcRetouchExpectedReadModelState"' -or
  $readinessSource -notmatch '\$signoffArgs \+= "-ReviewGalleryExpectedReadModelState"' -or
  $readinessSource -notmatch '\$signoffArgs \+= "-DeliveryReadinessExpectedReadModelState"') {
  Add-Failure "aggregate must pass per-route expected data-state options to the signoff wrapper"
}

if ($readinessSource -notmatch '\$signoffArgs \+= "-ExpectedFailureState"' -or $readinessSource -notmatch '\$signoffArgs \+= \$ApprovedBackendExpectedFailureState') {
  Add-Failure "aggregate must pass expected backend failure-state options to the signoff wrapper"
}

if ($readinessSource -notmatch "cannot be combined with ApprovedBackendExpectReadFailure") {
  Add-Failure "aggregate must reject mixed backend data-state and failure-state expectations"
}

$output = & powershell `
  -ExecutionPolicy Bypass `
  -File $readinessPath `
  -ApprovedBackendExpectReadFailure `
  -ApprovedBackendExpectedReadModelState stale 2>&1
$exitCode = $LASTEXITCODE
$text = $output -join [Environment]::NewLine

if ($exitCode -eq 1 -and $text -match "cannot be combined") {
  Write-Host "[PASS] mixed backend expectation modes are rejected before aggregate QA starts"
} else {
  Add-Failure "mixed backend expectation modes must fail before aggregate QA starts"
  Write-Host "       Exit code: $exitCode"
  Write-Host "       Output: $text"
}

$output = & powershell `
  -ExecutionPolicy Bypass `
  -File $readinessPath `
  -ApprovedBackendExpectReadFailure `
  -ApprovedBackendAssetInboxExpectedReadModelState partial 2>&1
$exitCode = $LASTEXITCODE
$text = $output -join [Environment]::NewLine

if ($exitCode -eq 1 -and $text -match "cannot be combined") {
  Write-Host "[PASS] mixed backend route-state and failure modes are rejected before aggregate QA starts"
} else {
  Add-Failure "mixed backend route-state and failure modes must fail before aggregate QA starts"
  Write-Host "       Exit code: $exitCode"
  Write-Host "       Output: $text"
}

if ($failed) {
  Write-Host ""
  Write-Host "Result: FAILED"
  exit 1
}

Write-Host ""
Write-Host "Result: PASSED"
exit 0
