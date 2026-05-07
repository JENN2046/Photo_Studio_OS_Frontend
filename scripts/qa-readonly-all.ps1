# Photo Studio OS Frontend full read-only browser QA matrix.
# Safe local QA only. This script does not deploy, push, edit env files,
# call backend writes, or change dependency manifests.

param(
  [string]$BaseUrl = "http://127.0.0.1:5173",
  [string]$SessionNamePrefix = "photo-studio-readonly-all",
  [switch]$KeepBrowser
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
  Write-Host "package.json not found. Run this script from the frontend repo root."
  exit 1
}

$matrices = @(
  @{
    Name = "read-only route QA"
    Script = "scripts\qa-readonly-routes.ps1"
    SessionName = "$SessionNamePrefix-routes"
  },
  @{
    Name = "read-model boundary-state QA"
    Script = "scripts\qa-readonly-boundary-states.ps1"
    SessionName = "$SessionNamePrefix-boundary"
  },
  @{
    Name = "read-model interaction QA"
    Script = "scripts\qa-readonly-interactions.ps1"
    SessionName = "$SessionNamePrefix-interactions"
  }
)

Write-Host "== Photo Studio OS full read-only browser QA =="
Write-Host "BaseUrl: $($BaseUrl.TrimEnd('/'))"
Write-Host "Matrices: $($matrices.Count)"

$failed = $false

foreach ($matrix in $matrices) {
  Write-Host ""
  Write-Host "== $($matrix.Name) =="

  $arguments = @(
    "-ExecutionPolicy", "Bypass",
    "-File", $matrix.Script,
    "-BaseUrl", $BaseUrl,
    "-SessionName", $matrix.SessionName
  )

  if ($KeepBrowser) {
    $arguments += "-KeepBrowser"
  }

  powershell @arguments
  if ($LASTEXITCODE -ne 0) {
    $failed = $true
    Write-Host "Matrix failed: $($matrix.Name)"
    break
  }
}

if ($failed) {
  Write-Host ""
  Write-Host "Result: FAILED"
  exit 1
}

Write-Host ""
Write-Host "Result: PASSED"
exit 0
