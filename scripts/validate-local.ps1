# Photo Studio OS Frontend local validation helper
# Safe local validation only.
# This script does not install dependencies, deploy, push, edit env files,
# call backend writes, or change dependency manifests.

param(
  [switch]$IncludeBrowserQa
)

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

Write-Host ""
Write-Host "== changed-file secret scan =="
$changedFiles = @(
  git diff --name-only
  git diff --cached --name-only
  git ls-files --others --exclude-standard
) | Where-Object { $_ } | Sort-Object -Unique

if ($changedFiles.Count -eq 0) {
  Write-Host "No changed files to scan"
} else {
  $sensitiveKeyPattern = [string]::Join("|", @("TOKEN", "SECRET", "PASSWORD", "API_KEY"))
  $assignmentPattern = "[A-Za-z0-9_]*($sensitiveKeyPattern)[A-Za-z0-9_]*\s*=\s*[""'][^""']{8,}"
  $scanPattern = "(?i)(AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z\-_]{35}|sk-[A-Za-z0-9]{20,}|gh[pousr]_[A-Za-z0-9_]{36,}|xox[baprs]-[A-Za-z0-9-]{10,}|-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----|$assignmentPattern)"
  $existingChangedFiles = $changedFiles | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf }
  if ($existingChangedFiles.Count -gt 0) {
    $scanMatches = Select-String -Path $existingChangedFiles -Pattern $scanPattern
    if ($scanMatches) {
      $scanMatches | ForEach-Object {
        Write-Host "$($_.Path):$($_.LineNumber): potential secret pattern"
      }
      $failed = $true
    } else {
      Write-Host "changed-file secret scan passed"
    }
  } else {
    Write-Host "No existing changed files to scan"
  }
}

if ($IncludeBrowserQa) {
  Write-Host ""
  Write-Host "== read-only route QA =="
  powershell -ExecutionPolicy Bypass -File "scripts\qa-readonly-routes.ps1"
  if ($LASTEXITCODE -ne 0) {
    $failed = $true
  }

  Write-Host ""
  Write-Host "== read-model boundary-state QA =="
  powershell -ExecutionPolicy Bypass -File "scripts\qa-readonly-boundary-states.ps1"
  if ($LASTEXITCODE -ne 0) {
    $failed = $true
  }
} else {
  Write-Host ""
  Write-Host "Skip: browser QA scripts. Re-run with -IncludeBrowserQa to include route and boundary-state matrices."
}

if ($failed) {
  Write-Host ""
  Write-Host "Result: FAILED"
  exit 1
}

Write-Host ""
Write-Host "Result: PASSED"
exit 0
