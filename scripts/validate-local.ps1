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
Write-Host "== Runtime preflight =="
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
  Write-Host "Node.js was not found in this shell. Use a shell with the project Node runtime before running validation."
  exit 1
}

$nodeVersion = (& node -p "process.versions.node").Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($nodeVersion)) {
  Write-Host "Unable to read the Node.js version from this shell."
  exit 1
}

$nodeVersionParts = $nodeVersion.Split(".")
$nodeMajor = [int]$nodeVersionParts[0]
$nodeMinor = [int]$nodeVersionParts[1]
$nodeOk = (($nodeMajor -eq 20 -and $nodeMinor -ge 19) -or ($nodeMajor -eq 22 -and $nodeMinor -ge 12) -or ($nodeMajor -gt 22))
if (-not $nodeOk) {
  Write-Host "Node.js $nodeVersion detected in this shell."
  Write-Host "Vite 7 requires Node.js 20.19+ or 22.12+ for this project's build gate."
  Write-Host "Use a shell with a compatible Node runtime before running validation."
  exit 1
}

Write-Host "Node.js $nodeVersion"

$failed = $false

Write-Host ""
Write-Host "== Git status =="
git branch --show-current
git status --short
git diff --stat

Write-Host ""
Write-Host "== Available npm scripts =="
npm run

Write-Host ""
Write-Host "== package boundary QA =="
powershell -ExecutionPolicy Bypass -File "scripts\qa-package-boundary.ps1"
if ($LASTEXITCODE -ne 0) {
  $failed = $true
}

function Test-NpmScript {
  param([string]$ScriptName)
  $pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
  return $null -ne $pkg.scripts.$ScriptName
}

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

Write-Host ""
Write-Host "== read-only source boundary QA =="
powershell -ExecutionPolicy Bypass -File "scripts\qa-readonly-source-boundary.ps1"
if ($LASTEXITCODE -ne 0) {
  $failed = $true
}

Write-Host ""
Write-Host "== backend read contract-map QA =="
powershell -ExecutionPolicy Bypass -File "scripts\qa-backend-read-contract-map.ps1"
if ($LASTEXITCODE -ne 0) {
  $failed = $true
}

Write-Host ""
Write-Host "== auth role matrix QA =="
powershell -ExecutionPolicy Bypass -File "scripts\qa-auth-role-matrix.ps1"
if ($LASTEXITCODE -ne 0) {
  $failed = $true
}

Write-Host ""
Write-Host "== auth provider preflight QA =="
powershell -ExecutionPolicy Bypass -File "scripts\qa-auth-provider-preflight.ps1"
if ($LASTEXITCODE -ne 0) {
  $failed = $true
}

Write-Host ""
Write-Host "== internal pilot evidence manifest QA =="
powershell -ExecutionPolicy Bypass -File "scripts\qa-internal-pilot-manifest.ps1"
if ($LASTEXITCODE -ne 0) {
  $failed = $true
}

Write-Host ""
Write-Host "== internal pilot readiness guard QA =="
powershell -ExecutionPolicy Bypass -File "scripts\qa-internal-pilot-readiness-guards.ps1"
if ($LASTEXITCODE -ne 0) {
  $failed = $true
}

Write-Host ""
Write-Host "== internal pilot signoff record QA =="
powershell -ExecutionPolicy Bypass -File "scripts\qa-internal-pilot-signoff-record.ps1"
if ($LASTEXITCODE -ne 0) {
  $failed = $true
}

Write-Host ""
Write-Host "== internal pilot goal audit QA =="
powershell -ExecutionPolicy Bypass -File "scripts\qa-internal-pilot-goal-audit.ps1"
if ($LASTEXITCODE -ne 0) {
  $failed = $true
}

Write-Host ""
Write-Host "== release-boundary docs QA =="
powershell -ExecutionPolicy Bypass -File "scripts\qa-release-boundary-docs.ps1"
if ($LASTEXITCODE -ne 0) {
  $failed = $true
}

Write-Host ""
Write-Host "== backend read signoff guard QA =="
powershell -ExecutionPolicy Bypass -File "scripts\qa-backend-read-signoff-guards.ps1"
if ($LASTEXITCODE -ne 0) {
  $failed = $true
}

if ($IncludeBrowserQa) {
  Write-Host ""
  Write-Host "== full read-only browser QA =="
  powershell -ExecutionPolicy Bypass -File "scripts\qa-readonly-all.ps1"
  if ($LASTEXITCODE -ne 0) {
    $failed = $true
  }
} else {
  Write-Host ""
  Write-Host "Skip: browser QA scripts. Re-run with -IncludeBrowserQa to include the full read-only browser QA matrix."
}

if ($failed) {
  Write-Host ""
  Write-Host "Result: FAILED"
  exit 1
}

Write-Host ""
Write-Host "Result: PASSED"
exit 0
