# Photo Studio OS Auth0 setup evidence QA.
# Safe local static check only. This script verifies that the Auth0 setup
# evidence sheet exists, records local live smoke status, and remains sanitized.

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

$evidencePath = "docs\design\FRONTEND_V2_AUTH0_SETUP_EVIDENCE.md"

Assert-FileContains -Path $evidencePath -Pattern "Auth0 setup evidence decision\s*\|\s*Provided" -Label "setup evidence decision is recorded"
Assert-FileContains -Path $evidencePath -Pattern "Live frontend login verified\s*\|\s*Verified locally 2026-06-01" -Label "live frontend login local verification is recorded"
Assert-FileContains -Path $evidencePath -Pattern "Backend Auth0 smoke verified\s*\|\s*Verified locally 2026-06-01" -Label "backend Auth0 smoke local verification is recorded"
Assert-FileContains -Path $evidencePath -Pattern "Raw token recorded\s*\|\s*No" -Label "raw token not recorded"
Assert-FileContains -Path $evidencePath -Pattern "dev-2n3z8xing6eekyok\.us\.auth0\.com" -Label "Auth0 tenant domain is recorded"
Assert-FileContains -Path $evidencePath -Pattern "1rU1X0nHkjrvpg043fS5GasaSpQBt8C9" -Label "SPA client ID is recorded"
Assert-FileContains -Path $evidencePath -Pattern "https://photo-studio-os-api" -Label "Auth0 audience is documented"
Assert-FileContains -Path $evidencePath -Pattern "http://127\.0\.0\.1:5173" -Label "local frontend allowlist is documented"
Assert-FileContains -Path $evidencePath -Pattern "https://photo-studio-os/organization_id" -Label "organization claim is documented"
Assert-FileContains -Path $evidencePath -Pattern "https://photo-studio-os/role" -Label "role claim is documented"
Assert-FileContains -Path $evidencePath -Pattern "owner" -Label "owner smoke role is documented"
Assert-FileContains -Path $evidencePath -Pattern "retoucher" -Label "retoucher smoke role is documented"
Assert-FileContains -Path $evidencePath -Pattern "client_reviewer" -Label "client reviewer smoke role is documented"
Assert-FileContains -Path $evidencePath -Pattern "AUTH0_LIVE_SMOKE_PASSED" -Label "Auth0 live smoke passed status is recorded"
Assert-FileContains -Path $evidencePath -Pattern "TOKEN_CLEARED" -Label "temporary token cleanup is recorded"
Assert-FileContains -Path $evidencePath -Pattern 'reviews:read.+expected `200`, actual `200`, decision `allowed`, passed `true`' -Label "reviews read RBAC evidence is recorded"
Assert-FileContains -Path $evidencePath -Pattern 'projects:write.+expected `200`, actual `200`, decision `allowed`, passed `true`' -Label "projects write RBAC evidence is recorded"
Assert-FileContains -Path $evidencePath -Pattern 'Smoke exit status\s*\|\s*`0`' -Label "smoke command exit status is recorded"

$sensitivePattern = '(?i)(AUTH0_ACCESS_TOKEN\s*=|Bearer\s+eyJ|client_secret\s*[:=]|AUTH0_CLIENT_SECRET\s*=|password\s*[:=]\s*[''"][^''"]{6,}|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)'
Assert-FileNotContains -Path $evidencePath -Pattern $sensitivePattern -Label "credential-bearing Auth0 evidence"

Write-Host "== Photo Studio OS Auth0 setup evidence QA =="
Write-Host "Evidence file: $evidencePath"

if ($failures.Count -gt 0) {
  foreach ($failure in $failures) {
    Write-Host "[FAIL] $failure"
  }

  Write-Host ""
  Write-Host "Result: FAILED"
  exit 1
}

Write-Host "Auth0 setup evidence sheet is present, recorded, and sanitized."
Write-Host ""
Write-Host "Result: PASSED"
exit 0
