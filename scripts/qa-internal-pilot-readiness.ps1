# Photo Studio OS Frontend internal pilot readiness QA aggregate.
# Safe local QA only. This script runs local validation, backend read smoke,
# live env role QA, then starts a temporary local Vite server for browser QA.
# It does not edit .env files, deploy, push, call backend writes, or change
# dependency manifests.

param(
  [string]$BaseUrl = "http://127.0.0.1:5173",
  [string]$ApprovedBackendBaseUrl = "",
  [ValidateSet("local", "staging")]
  [string]$ApprovedBackendEnvironment = "local",
  [ValidateSet("ready", "empty", "partial", "stale")]
  [string]$ApprovedBackendExpectedReadModelState = "ready",
  [switch]$ApprovedBackendExpectReadFailure,
  [ValidateSet("error", "forbidden", "invalid-id")]
  [string]$ApprovedBackendExpectedFailureState = "error"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
  Write-Host "package.json not found. Run this script from the frontend repo root."
  exit 1
}

$normalizedBaseUrl = $BaseUrl.TrimEnd("/")
$serverProcess = $null
$listenerPid = $null

if ($ApprovedBackendExpectReadFailure -and $ApprovedBackendExpectedReadModelState -ne "ready") {
  Write-Host "ApprovedBackendExpectedReadModelState cannot be combined with ApprovedBackendExpectReadFailure."
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

function Get-FrontendPort {
  $uri = $null
  if (-not [Uri]::TryCreate($normalizedBaseUrl, [UriKind]::Absolute, [ref]$uri)) {
    throw "BaseUrl must be an absolute URL."
  }

  return $uri.Port
}

function Get-FrontendListenerPid {
  param([int]$Port)

  try {
    return Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop |
      Select-Object -First 1 -ExpandProperty OwningProcess
  } catch {
    return $null
  }
}

function Invoke-CommandStep {
  param(
    [string]$Name,
    [scriptblock]$Command
  )

  Write-Host ""
  Write-Host "== $Name =="
  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Step failed: $Name"
  }
}

function Wait-ForFrontend {
  param([int]$TimeoutSeconds = 30)

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-Reachable "$normalizedBaseUrl/") {
      return $true
    }

    Start-Sleep -Milliseconds 500
  }

  return $false
}

function Start-FrontendServer {
  $serverOut = Join-Path $env:TEMP "photo-studio-internal-pilot-vite.out.log"
  $serverErr = Join-Path $env:TEMP "photo-studio-internal-pilot-vite.err.log"
  Remove-Item -LiteralPath $serverOut,$serverErr -ErrorAction SilentlyContinue

  return Start-Process `
    -FilePath "npm.cmd" `
    -ArgumentList @("run", "dev") `
    -WorkingDirectory (Get-Location) `
    -WindowStyle Hidden `
    -RedirectStandardOutput $serverOut `
    -RedirectStandardError $serverErr `
    -PassThru
}

function Stop-FrontendServer {
  if ($listenerPid) {
    try {
      Stop-Process -Id $listenerPid -Force -ErrorAction Stop
    } catch {
      Write-Host "Warning: could not stop frontend listener process $listenerPid"
    }
  }

  if ($serverProcess -and -not $serverProcess.HasExited) {
    try {
      Stop-Process -Id $serverProcess.Id -Force -ErrorAction Stop
    } catch {
      Write-Host "Warning: could not stop frontend server wrapper process $($serverProcess.Id)"
    }
  }

  Start-Sleep -Seconds 1
  if (Test-Reachable "$normalizedBaseUrl/") {
    Write-Host "Warning: frontend is still reachable at $normalizedBaseUrl after cleanup."
  } else {
    Write-Host "Frontend dev server stopped."
  }
}

if (Test-Reachable "$normalizedBaseUrl/") {
  Write-Host "Local frontend server is already reachable at $normalizedBaseUrl."
  Write-Host "Stop it before running internal pilot readiness QA so backend and role child servers can own their env safely."
  exit 1
}

Write-Host "== Photo Studio OS internal pilot readiness QA =="
Write-Host "BaseUrl: $normalizedBaseUrl"
if (-not [string]::IsNullOrWhiteSpace($ApprovedBackendBaseUrl)) {
  Write-Host "Approved backend signoff: enabled ($ApprovedBackendEnvironment)"
  Write-Host "Approved backend expectation: $(if ($ApprovedBackendExpectReadFailure) { "failure:$ApprovedBackendExpectedFailureState" } else { "data:$ApprovedBackendExpectedReadModelState" })"
} else {
  Write-Host "Approved backend signoff: skipped"
}

try {
  Invoke-CommandStep "npm run lint" { npm run lint }
  Invoke-CommandStep "npm run build" { npm run build }
  Invoke-CommandStep "validate local" {
    powershell -ExecutionPolicy Bypass -File scripts\validate-local.ps1
  }
  Invoke-CommandStep "backend read aggregate smoke" {
    powershell -ExecutionPolicy Bypass -File scripts\qa-backend-read-all.ps1 -FrontendBaseUrl $normalizedBaseUrl
  }
  if (-not [string]::IsNullOrWhiteSpace($ApprovedBackendBaseUrl)) {
    Invoke-CommandStep "approved backend read signoff" {
      $signoffArgs = @(
        "-ExecutionPolicy", "Bypass",
        "-File", "scripts\qa-backend-read-signoff.ps1",
        "-EnvironmentName", $ApprovedBackendEnvironment,
        "-BackendBaseUrl", $ApprovedBackendBaseUrl,
        "-FrontendBaseUrl", $normalizedBaseUrl,
        "-SkipPostValidation"
      )

      if ($ApprovedBackendExpectReadFailure) {
        $signoffArgs += "-ExpectReadFailure"
        $signoffArgs += "-ExpectedFailureState"
        $signoffArgs += $ApprovedBackendExpectedFailureState
      } else {
        $signoffArgs += "-ExpectedReadModelState"
        $signoffArgs += $ApprovedBackendExpectedReadModelState
      }

      powershell @signoffArgs
    }
  } else {
    Write-Host ""
    Write-Host "== approved backend read signoff =="
    Write-Host "Skip: no approved local/staging backend URL was provided."
  }
  Invoke-CommandStep "live env role QA" {
    powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-auth-live-roles.ps1 -BaseUrl $normalizedBaseUrl
  }

  Write-Host ""
  Write-Host "== start local Vite for browser QA =="
  $serverProcess = Start-FrontendServer
  if (-not (Wait-ForFrontend)) {
    throw "Frontend did not become reachable at $normalizedBaseUrl."
  }

  $listenerPid = Get-FrontendListenerPid -Port (Get-FrontendPort)
  Write-Host "Vite ready. wrapper pid=$($serverProcess.Id) listener pid=$listenerPid"

  Invoke-CommandStep "auth state boundary QA" {
    powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-auth-states.ps1 -BaseUrl $normalizedBaseUrl
  }
  Invoke-CommandStep "full read-only browser QA" {
    powershell -ExecutionPolicy Bypass -File scripts\qa-readonly-all.ps1 -BaseUrl $normalizedBaseUrl
  }

  Write-Host ""
  Write-Host "Result: PASSED"
  exit 0
} catch {
  Write-Host ""
  Write-Host "Result: FAILED"
  Write-Host $_
  exit 1
} finally {
  Stop-FrontendServer
}
