# Photo Studio OS Frontend local validation helper
# Safe local validation only.
# This script does not install dependencies, deploy, push, or call external services.

$ErrorActionPreference = "Stop"

Write-Host "== Photo Studio OS Frontend local validation =="

if (-not (Test-Path "package.json")) {
  Write-Host "package.json not found. Are you in the frontend repo root?"
  exit 1
}

Write-Host ""
Write-Host "== Git status =="
git branch --show-current
git status --short
git diff --stat

Write-Host ""
Write-Host "== Available npm scripts =="
npm run

function Test-NpmScript {
  param([string]$ScriptName)
  $pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
  return $null -ne $pkg.scripts.$ScriptName
}

$failed = $false

foreach ($script in @("typecheck", "lint", "build", "test")) {
  if (Test-NpmScript $script) {
    Write-Host ""
    Write-Host "== npm run $script =="
    npm run $script
    if ($LASTEXITCODE -ne 0) {
      $failed = $true
      Write-Host "Validation failed: npm run $script"
      break
    }
  } else {
    Write-Host "Skip: npm run $script is not defined"
  }
}

Write-Host ""
Write-Host "== git diff --check =="
git diff --check
if ($LASTEXITCODE -ne 0) {
  $failed = $true
}

if ($failed) {
  Write-Host ""
  Write-Host "Result: FAILED"
  exit 1
}

Write-Host ""
Write-Host "Result: PASSED"
exit 0
