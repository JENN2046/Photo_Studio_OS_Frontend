# Photo Studio OS Frontend backend read-model smoke aggregate.
# Safe local QA only. This script runs the backend-connected mock smoke and the
# backend-failure smoke in sequence.
# It does not edit .env files, deploy, push, call backend writes, or change
# dependency manifests.

param(
  [string]$FrontendBaseUrl = "http://127.0.0.1:5173",
  [int]$MockBackendPort = 5181,
  [int]$FailureBackendPort = 59999,
  [string]$SessionNamePrefix = "photo-studio-backend-read-all",
  [switch]$KeepBrowser
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
  Write-Host "package.json not found. Run this script from the frontend repo root."
  exit 1
}

function Test-Reachable {
  param([string]$Url)

  try {
    $statusCode = (Invoke-WebRequest -UseBasicParsing $Url -TimeoutSec 2).StatusCode
    return $statusCode -eq 200
  } catch {
    return $false
  }
}

if (Test-Reachable "$($FrontendBaseUrl.TrimEnd('/'))/") {
  Write-Host "Local frontend server is already reachable at $FrontendBaseUrl."
  Write-Host "Stop it before running backend read smoke so each child Vite process can set VITE_BACKEND_API_BASE_URL safely."
  exit 1
}

$matrices = @(
  @{
    Name = "backend connected path with local mock backend"
    Arguments = @(
      "-ExecutionPolicy", "Bypass",
      "-File", "scripts\qa-backend-read-smoke-mock.ps1",
      "-BackendPort", [string]$MockBackendPort,
      "-FrontendBaseUrl", $FrontendBaseUrl,
      "-SessionName", "$SessionNamePrefix-connected"
    )
  },
  @{
    Name = "backend forbidden path with local mock backend"
    Arguments = @(
      "-ExecutionPolicy", "Bypass",
      "-File", "scripts\qa-backend-read-smoke-mock.ps1",
      "-BackendPort", [string]$MockBackendPort,
      "-FrontendBaseUrl", $FrontendBaseUrl,
      "-SessionName", "$SessionNamePrefix-forbidden",
      "-ResponseMode", "forbidden"
    )
  },
  @{
    Name = "backend invalid-id path with local mock backend"
    Arguments = @(
      "-ExecutionPolicy", "Bypass",
      "-File", "scripts\qa-backend-read-smoke-mock.ps1",
      "-BackendPort", [string]$MockBackendPort,
      "-FrontendBaseUrl", $FrontendBaseUrl,
      "-SessionName", "$SessionNamePrefix-invalid-id",
      "-ResponseMode", "invalid-id"
    )
  },
  @{
    Name = "backend failure path with unreachable local backend"
    Arguments = @(
      "-ExecutionPolicy", "Bypass",
      "-File", "scripts\qa-backend-read-smoke.ps1",
      "-BackendBaseUrl", "http://127.0.0.1:$FailureBackendPort",
      "-FrontendBaseUrl", $FrontendBaseUrl,
      "-SessionName", "$SessionNamePrefix-failure",
      "-ExpectReadFailure"
    )
  }
)

Write-Host "== Photo Studio OS backend read-model full smoke =="
Write-Host "FrontendBaseUrl: $($FrontendBaseUrl.TrimEnd('/'))"
Write-Host "Matrices: $($matrices.Count)"

$failed = $false

foreach ($matrix in $matrices) {
  Write-Host ""
  Write-Host "== $($matrix.Name) =="

  $arguments = @($matrix.Arguments)
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
