# Photo Studio OS Frontend guarded backend read-model signoff QA.
# Safe local/staging QA only. This wrapper runs the backend read smoke against an
# explicitly provided local or staging backend URL, then reruns local frontend
# gates. It does not edit .env files, deploy, push, call backend writes, or
# change dependency manifests.

param(
  [Parameter(Mandatory = $true)]
  [string]$BackendBaseUrl,
  [ValidateSet("local", "staging")]
  [string]$EnvironmentName = "local",
  [string]$FrontendBaseUrl = "http://127.0.0.1:5173",
  [string]$BackendUserRole = "owner",
  [string]$BackendUserName = "Backend Smoke Operator",
  [string]$SessionName = "photo-studio-backend-read-signoff",
  [switch]$SkipPostValidation,
  [switch]$KeepBrowser
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
  Write-Host "package.json not found. Run this script from the frontend repo root."
  exit 1
}

function Test-LocalBackendUri {
  param([Uri]$Uri)

  $localHosts = @("localhost", "127.0.0.1", "::1", "[::1]")
  return $localHosts -contains $Uri.Host
}

function Assert-BackendSignoffUrl {
  param(
    [string]$Url,
    [string]$Scope
  )

  $uri = $null
  if (-not [Uri]::TryCreate($Url, [UriKind]::Absolute, [ref]$uri)) {
    throw "BackendBaseUrl must be an absolute URL."
  }

  if ($uri.Scheme -ne "http" -and $uri.Scheme -ne "https") {
    throw "BackendBaseUrl must use http or https."
  }

  if (-not [string]::IsNullOrWhiteSpace($uri.UserInfo)) {
    throw "BackendBaseUrl must not include credentials."
  }

  if (-not [string]::IsNullOrWhiteSpace($uri.Query) -or -not [string]::IsNullOrWhiteSpace($uri.Fragment)) {
    throw "BackendBaseUrl must not include query strings or fragments."
  }

  $backendHost = $uri.Host.ToLowerInvariant()
  if ($backendHost -match "(^|[-.])(prod|production)([-.]|$)") {
    throw "BackendBaseUrl appears production-like. Production backend smoke is not allowed by this frontend QA script."
  }

  $isLocal = Test-LocalBackendUri $uri
  if ($Scope -eq "local" -and -not $isLocal) {
    throw "EnvironmentName local only accepts localhost backend URLs. Use -EnvironmentName staging for an approved staging smoke."
  }

  if ($Scope -eq "staging" -and -not $isLocal -and $uri.Scheme -ne "https") {
    throw "Non-local staging backend smoke must use https."
  }

  return @{
    IsLocal = $isLocal
    Scheme = $uri.Scheme
    Host = $uri.Host
  }
}

function Invoke-Step {
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

try {
  $urlInfo = Assert-BackendSignoffUrl -Url $BackendBaseUrl -Scope $EnvironmentName
  $allowNonLocalBackend = -not $urlInfo.IsLocal

  Write-Host "== Photo Studio OS guarded backend read signoff =="
  Write-Host "Environment: $EnvironmentName"
  Write-Host "Backend locality: $(if ($urlInfo.IsLocal) { 'local' } else { 'staging' })"
  Write-Host "FrontendBaseUrl: $($FrontendBaseUrl.TrimEnd('/'))"
  Write-Host "Write boundary: read-only GET smoke only"

  $smokeArgs = @(
    "-ExecutionPolicy", "Bypass",
    "-File", "scripts\qa-backend-read-smoke.ps1",
    "-BackendBaseUrl", $BackendBaseUrl,
    "-FrontendBaseUrl", $FrontendBaseUrl,
    "-BackendUserRole", $BackendUserRole,
    "-BackendUserName", $BackendUserName,
    "-SessionName", $SessionName
  )

  if ($allowNonLocalBackend) {
    $smokeArgs += "-AllowNonLocalBackend"
  }

  if ($KeepBrowser) {
    $smokeArgs += "-KeepBrowser"
  }

  Invoke-Step "backend read smoke" {
    powershell @smokeArgs
  }

  if (-not $SkipPostValidation) {
    Invoke-Step "npm run lint" {
      npm run lint
    }
    Invoke-Step "npm run build" {
      npm run build
    }
    Invoke-Step "validate local" {
      powershell -ExecutionPolicy Bypass -File scripts\validate-local.ps1
    }
  } else {
    Write-Host ""
    Write-Host "Post-validation skipped by explicit -SkipPostValidation."
  }

  Write-Host ""
  Write-Host "Result: PASSED"
  exit 0
} catch {
  Write-Host ""
  Write-Host "Result: FAILED"
  Write-Host $_
  exit 1
}
