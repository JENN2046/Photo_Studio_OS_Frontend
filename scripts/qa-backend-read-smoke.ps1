# Photo Studio OS Frontend backend read-model smoke QA.
# Safe local QA only. This script starts a temporary local Vite server with
# VITE_BACKEND_API_BASE_URL in the child process environment only.
# It does not edit .env files, deploy, push, call backend writes, or change
# dependency manifests.

param(
  [Parameter(Mandatory = $true)]
  [string]$BackendBaseUrl,
  [string]$FrontendBaseUrl = "http://127.0.0.1:5173",
  [string]$BackendUserRole = "owner",
  [string]$BackendUserName = "Backend Smoke Operator",
  [string]$SessionName = "photo-studio-backend-read-smoke",
  [switch]$ExpectReadFailure,
  [switch]$AllowNonLocalBackend,
  [switch]$KeepBrowser
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
  Write-Host "package.json not found. Run this script from the frontend repo root."
  exit 1
}

. (Join-Path $PSScriptRoot "qa-readonly-fixtures.ps1")

$normalizedFrontendUrl = $FrontendBaseUrl.TrimEnd("/")
$playwrightPackage = "@playwright/cli"
$npx = "npx"
$serverProcess = $null
$serverOwnerPid = $null

function Invoke-PlaywrightCli {
  param([string[]]$Arguments)

  & $npx --yes --package $playwrightPackage playwright-cli "-s=$SessionName" @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "playwright-cli failed: $($Arguments -join ' ')"
  }
}

function Invoke-PlaywrightRaw {
  param([string[]]$Arguments)

  $output = & $npx --yes --package $playwrightPackage playwright-cli "-s=$SessionName" @Arguments 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw ($output -join [Environment]::NewLine)
  }

  return $output
}

function New-RouteUrl {
  param([string]$Hash)
  return "$normalizedFrontendUrl/$Hash"
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

function Assert-SmokeUrl {
  param([string]$Url)

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

  $localHosts = @("localhost", "127.0.0.1", "::1", "[::1]")
  if (-not $AllowNonLocalBackend -and -not ($localHosts -contains $uri.Host)) {
    throw "BackendBaseUrl must be localhost unless -AllowNonLocalBackend is set for an explicitly approved staging smoke."
  }
}

function Get-FrontendPort {
  $uri = $null
  if (-not [Uri]::TryCreate($normalizedFrontendUrl, [UriKind]::Absolute, [ref]$uri)) {
    throw "FrontendBaseUrl must be an absolute URL."
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

function ConvertTo-SingleQuotedPowerShellLiteral {
  param([string]$Value)
  return "'$($Value.Replace("'", "''"))'"
}

function Start-SmokeFrontend {
  param(
    [string]$BackendUrl,
    [string]$Role,
    [string]$UserName
  )

  $playwrightDir = Join-Path (Get-Location) ".playwright-cli"
  if (-not (Test-Path $playwrightDir)) {
    New-Item -ItemType Directory -Path $playwrightDir | Out-Null
  }

  $serverScript = Join-Path $playwrightDir "qa-backend-read-smoke-dev-server.ps1"
  $serverOut = Join-Path $playwrightDir "qa-backend-read-smoke-dev-server.out.log"
  $serverErr = Join-Path $playwrightDir "qa-backend-read-smoke-dev-server.err.log"
  $script = @(
    "`$env:VITE_BACKEND_API_BASE_URL = $(ConvertTo-SingleQuotedPowerShellLiteral $BackendUrl)",
    "`$env:VITE_BACKEND_USER_ROLE = $(ConvertTo-SingleQuotedPowerShellLiteral $Role)",
    "`$env:VITE_BACKEND_USER_NAME = $(ConvertTo-SingleQuotedPowerShellLiteral $UserName)",
    "npm.cmd run dev"
  ) -join [Environment]::NewLine

  Set-Content -LiteralPath $serverScript -Value $script -Encoding UTF8

  $powershellPath = (Get-Command powershell -ErrorAction Stop).Source
  return Start-Process `
    -FilePath $powershellPath `
    -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $serverScript) `
    -WorkingDirectory (Get-Location) `
    -WindowStyle Hidden `
    -RedirectStandardOutput $serverOut `
    -RedirectStandardError $serverErr `
    -PassThru
}

function Wait-ForFrontend {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 30
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-Reachable $Url) {
      return $true
    }

    Start-Sleep -Milliseconds 500
  }

  return $false
}

function Invoke-SmokeRouteCheck {
  param([array]$Routes)

  $payload = @{
    expectReadFailure = [bool]$ExpectReadFailure
    routes = $Routes
  } | ConvertTo-Json -Compress -Depth 8

  $code = @"
async (page) => {
  const payload = $payload;
  const blockedMethods = [];
  const consoleErrors = [];
  page.removeAllListeners('request');
  page.removeAllListeners('console');
  page.on('request', (request) => {
    const method = request.method();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      blockedMethods.push({ method, url: request.url() });
    }
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  const checks = [];
  for (const route of payload.routes) {
    const selector = payload.expectReadFailure ? route.failureSelector : route.readySelector;
    const expectedEncoded = payload.expectReadFailure ? route.failureExpectedEncoded : route.readyExpectedEncoded;
    await page.goto(route.url);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector(selector, { timeout: 8000 }).catch(() => undefined);
    await page.waitForTimeout(100);
    const state = await page.evaluate(({ route, selector, expectedEncoded, expectReadFailure }) => {
      const text = document.body.innerText;
      const root = document.documentElement;
      const expected = expectedEncoded.map((item) => decodeURIComponent(item));
      const missing = expected.filter((item) => !text.includes(item));
      const selectorCount = document.querySelectorAll(selector).length;
      const readySurfaceCount = document.querySelectorAll(route.readySelector).length;
      const failureSurfaceCount = document.querySelectorAll(route.failureSelector).length;
      return {
        name: route.name,
        url: location.href,
        selectorCount,
        readySurfaceCount,
        failureSurfaceCount,
        missing,
        overflow: root.scrollWidth > root.clientWidth + 1,
        scrollWidth: root.scrollWidth,
        clientWidth: root.clientWidth,
        expectReadFailure
      };
    }, { route, selector, expectedEncoded, expectReadFailure: payload.expectReadFailure });
    checks.push(state);
  }

  return { checks, blockedMethods, consoleErrors };
}
"@

  $playwrightDir = Join-Path (Get-Location) ".playwright-cli"
  if (-not (Test-Path $playwrightDir)) {
    New-Item -ItemType Directory -Path $playwrightDir | Out-Null
  }

  $codePath = Join-Path $playwrightDir "qa-backend-read-smoke-check.js"
  Set-Content -LiteralPath $codePath -Value $code -Encoding UTF8
  $raw = Invoke-PlaywrightRaw @("run-code", "--filename", $codePath, "--raw")

  try {
    return $raw | ConvertFrom-Json
  } catch {
    throw "Could not parse backend read smoke result: $raw"
  }
}

Assert-SmokeUrl $BackendBaseUrl
$frontendPort = Get-FrontendPort

if (Test-Reachable "$normalizedFrontendUrl/") {
  Write-Host "Local frontend server is already reachable at $normalizedFrontendUrl."
  Write-Host "Stop the existing server before running backend read smoke so the script can set VITE_BACKEND_API_BASE_URL safely."
  exit 1
}

$commonReadyExpected = @(
  "%E5%90%8E%E7%AB%AF%E5%8F%AA%E8%AF%BB",
  "%E5%B7%B2%E8%BF%9E%E6%8E%A5",
  "mock-first%20%2F%20read-only"
)
$commonFailureExpected = @(
  "%E5%90%8E%E7%AB%AF%E5%8F%AA%E8%AF%BB",
  "%E8%AF%B7%E6%B1%82%E5%A4%B1%E8%B4%A5",
  "mock-first%20%2F%20read-only"
)

$routes = @(
  @{
    name = "command-center"
    url = New-RouteUrl $ReadOnlyRouteHashes.CommandCenter
    readySelector = ".cockpit-command-center"
    failureSelector = ".status-command-error"
    readyExpectedEncoded = $commonReadyExpected
    failureExpectedEncoded = $commonFailureExpected
  },
  @{
    name = "asset-inbox"
    url = New-RouteUrl $ReadOnlyRouteHashes.AssetInbox
    readySelector = ".asset-inbox-console"
    failureSelector = ".read-model-state-error"
    readyExpectedEncoded = $commonReadyExpected
    failureExpectedEncoded = $commonFailureExpected + @("%E5%8F%AA%E8%AF%BB%E6%A8%A1%E5%9E%8B%E4%B8%8D%E5%8F%AF%E7%94%A8")
  },
  @{
    name = "qc-retouch"
    url = New-RouteUrl $ReadOnlyRouteHashes.QcRetouch
    readySelector = ".qc-retouch-console"
    failureSelector = ".read-model-state-error"
    readyExpectedEncoded = $commonReadyExpected
    failureExpectedEncoded = $commonFailureExpected + @("%E5%8F%AA%E8%AF%BB%E6%A8%A1%E5%9E%8B%E4%B8%8D%E5%8F%AF%E7%94%A8")
  },
  @{
    name = "review-gallery"
    url = New-RouteUrl $ReadOnlyRouteHashes.ReviewGallery
    readySelector = ".review-gallery-console"
    failureSelector = ".read-model-state-error"
    readyExpectedEncoded = $commonReadyExpected
    failureExpectedEncoded = $commonFailureExpected + @("%E5%8F%AA%E8%AF%BB%E6%A8%A1%E5%9E%8B%E4%B8%8D%E5%8F%AF%E7%94%A8")
  },
  @{
    name = "delivery-readiness"
    url = New-RouteUrl $ReadOnlyRouteHashes.DeliveryReadiness
    readySelector = ".delivery-readiness-console"
    failureSelector = ".read-model-state-error"
    readyExpectedEncoded = $commonReadyExpected
    failureExpectedEncoded = $commonFailureExpected + @("%E5%8F%AA%E8%AF%BB%E6%A8%A1%E5%9E%8B%E4%B8%8D%E5%8F%AF%E7%94%A8")
  }
)

Write-Host "== Photo Studio OS backend read-model smoke QA =="
Write-Host "FrontendBaseUrl: $normalizedFrontendUrl"
Write-Host "BackendBaseUrl: $BackendBaseUrl"
Write-Host "Mode: $(if ($ExpectReadFailure) { 'expect read failure UI' } else { 'expect backend connected UI' })"
Write-Host "Routes: $($routes.Count)"

try {
  $serverProcess = Start-SmokeFrontend -BackendUrl $BackendBaseUrl -Role $BackendUserRole -UserName $BackendUserName
  if (-not (Wait-ForFrontend "$normalizedFrontendUrl/" 30)) {
    throw "Local frontend server did not become reachable at $normalizedFrontendUrl."
  }

  $serverOwnerPid = Get-FrontendListenerPid $frontendPort

  Invoke-PlaywrightCli @("open", (New-RouteUrl $ReadOnlyRouteHashes.CommandCenter))
  Invoke-PlaywrightCli @("resize", "1024", "768")

  $result = Invoke-SmokeRouteCheck -Routes $routes
  $allPassed = $true

  foreach ($check in $result.checks) {
    $problems = @()
    if ($check.selectorCount -lt 1) {
      $problems += "expected selector missing"
    }
    if ($check.missing.Count -gt 0) {
      $problems += "missing copy: $($check.missing -join ', ')"
    }
    if ($check.expectReadFailure -and $check.readySurfaceCount -gt 0) {
      $problems += "ready surface rendered while expecting read failure"
    }
    if ((-not $check.expectReadFailure) -and $check.failureSurfaceCount -gt 0) {
      $problems += "failure surface rendered while expecting backend connected UI"
    }
    if ($check.overflow) {
      $problems += "horizontal overflow: $($check.scrollWidth) > $($check.clientWidth)"
    }

    if ($problems.Count -gt 0) {
      $allPassed = $false
      Write-Host "[FAIL] $($check.name): $($problems -join '; ')"
    } else {
      Write-Host "[PASS] $($check.name)"
    }
  }

  if ($result.blockedMethods.Count -gt 0) {
    $allPassed = $false
    foreach ($request in $result.blockedMethods) {
      Write-Host "[FAIL] non-read request observed: $($request.method) $($request.url)"
    }
  }

  $blockingConsoleErrors = @(
    $result.consoleErrors | Where-Object {
      -not ($ExpectReadFailure -and $_ -like "Failed to load resource: net::*")
    }
  )
  $expectedNetworkErrors = @(
    $result.consoleErrors | Where-Object {
      $ExpectReadFailure -and $_ -like "Failed to load resource: net::*"
    }
  )

  if ($expectedNetworkErrors.Count -gt 0) {
    Write-Host "[INFO] expected backend network errors observed: $($expectedNetworkErrors.Count)"
  }

  if ($blockingConsoleErrors.Count -gt 0) {
    $allPassed = $false
    foreach ($consoleError in $blockingConsoleErrors) {
      Write-Host "[FAIL] console error: $consoleError"
    }
  }

  if (-not $allPassed) {
    Write-Host ""
    Write-Host "Result: FAILED"
    exit 1
  }

  Write-Host ""
  Write-Host "Result: PASSED"
  exit 0
} finally {
  if (-not $KeepBrowser) {
    try {
      Invoke-PlaywrightCli @("close")
    } catch {
      Write-Host "Warning: could not close Playwright QA session $SessionName"
    }
  }

  if ($serverOwnerPid) {
    try {
      Stop-Process -Id $serverOwnerPid -ErrorAction Stop
    } catch {
      Write-Host "Warning: could not stop frontend listener process $serverOwnerPid"
    }
  }

  if ($serverProcess -and -not $serverProcess.HasExited) {
    try {
      Stop-Process -Id $serverProcess.Id -ErrorAction Stop
    } catch {
      Write-Host "Warning: could not stop frontend server wrapper process $($serverProcess.Id)"
    }
  }
}
