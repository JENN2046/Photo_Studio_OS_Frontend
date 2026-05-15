# Photo Studio OS Frontend backend read-model smoke QA.
# Safe local QA only. This script starts a temporary local Vite server with
# VITE_BACKEND_API_BASE_URL in the child process environment only.
# It does not edit .env files, deploy, push, call backend writes, or change
# dependency manifests.

param(
  [Parameter(Mandatory = $true)]
  [string]$BackendBaseUrl,
  [string]$FrontendBaseUrl = "http://127.0.0.1:5173",
  [string]$BackendUserRole = "operator",
  [string]$BackendUserName = "Backend Smoke Operator",
  [string]$SessionName = "photo-studio-backend-read-smoke",
  [ValidateSet("ready", "empty", "partial", "stale")]
  [string]$ExpectedReadModelState = "ready",
  [switch]$ExpectReadFailure,
  [ValidateSet("error", "forbidden", "invalid-id")]
  [string]$ExpectedFailureState = "error",
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
    backendBaseUrl = $BackendBaseUrl.TrimEnd("/")
    expectReadFailure = [bool]$ExpectReadFailure
    routes = $Routes
  } | ConvertTo-Json -Compress -Depth 8

  $code = @"
async (page) => {
  const payload = $payload;
  const blockedMethods = [];
  const consoleErrors = [];
  const backendRequests = [];
  const backendBase = payload.backendBaseUrl.replace(/\/$/, '');
  page.removeAllListeners('request');
  page.removeAllListeners('console');
  page.on('request', (request) => {
    const method = request.method();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      blockedMethods.push({ method, url: request.url() });
    }
    const requestUrl = request.url();
    if (requestUrl.startsWith(backendBase)) {
      const pathWithQuery = requestUrl.slice(backendBase.length) || '/';
      const path = pathWithQuery.split(/[?#]/)[0] || '/';
      backendRequests.push({ method, path, url: requestUrl });
    }
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await page.goto('about:blank');
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
    const backendHits = backendRequests.filter((request) => request.path === route.backendPath);
    const backendReadHits = backendHits.filter((request) => request.method === 'GET' || request.method === 'HEAD');
    checks.push(Object.assign({}, state, {
      backendPath: route.backendPath,
      backendRequestCount: backendHits.length,
      backendReadRequestCount: backendReadHits.length,
      backendMethods: Array.from(new Set(backendHits.map((request) => request.method)))
    }));
  }

  return { checks, blockedMethods, consoleErrors, backendRequests };
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

$failureStateConfig = @{
  error = @{
    TransportExpectedEncoded = @("%E8%AF%B7%E6%B1%82%E5%A4%B1%E8%B4%A5")
    CommandSelector = ".status-command-error"
    CommandExpectedEncoded = @("%E5%8F%AA%E8%AF%BB%E4%BF%9D%E7%95%99%E6%80%81", "%E5%BC%82%E5%B8%B8%E8%AF%B4%E6%98%8E")
    ReadModelSelector = ".read-model-state-error"
    ReadModelExpectedEncoded = @("%E5%8F%AA%E8%AF%BB%E6%A8%A1%E5%9E%8B%E4%B8%8D%E5%8F%AF%E7%94%A8", "%E8%AF%BB%E5%8F%96%E5%A4%B1%E8%B4%A5")
  }
  forbidden = @{
    TransportExpectedEncoded = @("%E6%9D%83%E9%99%90%E4%B8%8D%E8%B6%B3")
    CommandSelector = ".status-command-state-forbidden"
    CommandExpectedEncoded = @("%E6%9D%83%E9%99%90%E4%B8%8D%E8%B6%B3", "%E6%9D%83%E9%99%90%E8%AF%B4%E6%98%8E")
    ReadModelSelector = ".read-model-state-forbidden"
    ReadModelExpectedEncoded = @("%E6%97%A0%E6%9D%83%E8%AE%BF%E9%97%AE%E8%AF%A5%E5%8F%AA%E8%AF%BB%E6%A8%A1%E5%9E%8B", "%E6%9D%83%E9%99%90%E4%B8%8D%E8%B6%B3")
  }
  "invalid-id" = @{
    TransportExpectedEncoded = @("ID%20%E6%9C%AA%E6%89%BE%E5%88%B0", "ID%20%E6%97%A0%E6%95%88")
    CommandSelector = ".status-command-state-invalid-id"
    CommandExpectedEncoded = @("%E5%BF%AB%E7%85%A7%E6%9C%AA%E6%89%BE%E5%88%B0", "ID%20%E7%8A%B6%E6%80%81")
    ReadModelSelector = ".read-model-state-invalid-id"
    ReadModelExpectedEncoded = @("%E8%AF%B7%E6%B1%82%E7%9A%84%20ID%20%E6%97%A0%E6%95%88%E6%88%96%E6%9C%AA%E6%89%BE%E5%88%B0", "ID%20%E6%97%A0%E6%95%88")
  }
}
$failureConfig = $failureStateConfig[$ExpectedFailureState]
$readModelSuccessStateConfig = @{
  ready = @{
    Selector = ".asset-inbox-console,.qc-retouch-console,.review-gallery-console,.delivery-readiness-console"
    ExpectedEncoded = @("%E5%B7%B2%E8%BF%9E%E6%8E%A5")
  }
  empty = @{
    Selector = ".read-model-state-empty"
    ExpectedEncoded = @("%E8%AF%A5%E8%A7%86%E5%9B%BE%E6%9A%82%E6%97%A0%E6%95%B0%E6%8D%AE", "%E6%95%B0%E6%8D%AE%E4%B8%BA%E7%A9%BA")
  }
  partial = @{
    Selector = ".read-model-state-partial"
    ExpectedEncoded = @("%E8%AF%A5%E8%A7%86%E5%9B%BE%E4%BB%85%E5%8A%A0%E8%BD%BD%E4%BA%86%E9%83%A8%E5%88%86%E6%95%B0%E6%8D%AE", "%E9%83%A8%E5%88%86%E6%95%B0%E6%8D%AE")
  }
  stale = @{
    Selector = ".read-model-state-stale"
    ExpectedEncoded = @("%E6%95%B0%E6%8D%AE%E5%8F%AF%E8%83%BD%E5%B7%B2%E8%BF%87%E6%9C%9F", "%E6%95%B0%E6%8D%AE%E8%BF%87%E6%9C%9F")
  }
}
$readModelSuccessConfig = $readModelSuccessStateConfig[$ExpectedReadModelState]
$commonReadyExpected = @(
  "%E5%90%8E%E7%AB%AF%E5%8F%AA%E8%AF%BB",
  "mock-first%20%2F%20read-only"
)
$commonFailureExpected = @(
  @("%E5%90%8E%E7%AB%AF%E5%8F%AA%E8%AF%BB", "mock-first%20%2F%20read-only") +
  $failureConfig.TransportExpectedEncoded
)

$routes = @(
  @{
    name = "command-center"
    url = New-RouteUrl $ReadOnlyRouteHashes.CommandCenter
    backendPath = "/command-center/v2"
    readySelector = ".cockpit-command-center"
    failureSelector = $failureConfig.CommandSelector
    readyExpectedEncoded = @($commonReadyExpected + @("%E5%B7%B2%E8%BF%9E%E6%8E%A5"))
    failureExpectedEncoded = @($commonFailureExpected + $failureConfig.CommandExpectedEncoded)
  },
  @{
    name = "asset-inbox"
    url = New-RouteUrl $ReadOnlyRouteHashes.AssetInbox
    backendPath = "/projects/PRJ-128/asset-inbox"
    readySelector = $(if ($ExpectedReadModelState -eq "ready") { ".asset-inbox-console" } else { $readModelSuccessConfig.Selector })
    failureSelector = $failureConfig.ReadModelSelector
    readyExpectedEncoded = @($commonReadyExpected + $readModelSuccessConfig.ExpectedEncoded)
    failureExpectedEncoded = @($commonFailureExpected + $failureConfig.ReadModelExpectedEncoded)
  },
  @{
    name = "qc-retouch"
    url = New-RouteUrl $ReadOnlyRouteHashes.QcRetouch
    backendPath = "/projects/PRJ-128/qc-retouch-queue"
    readySelector = $(if ($ExpectedReadModelState -eq "ready") { ".qc-retouch-console" } else { $readModelSuccessConfig.Selector })
    failureSelector = $failureConfig.ReadModelSelector
    readyExpectedEncoded = @($commonReadyExpected + $readModelSuccessConfig.ExpectedEncoded)
    failureExpectedEncoded = @($commonFailureExpected + $failureConfig.ReadModelExpectedEncoded)
  },
  @{
    name = "review-gallery"
    url = New-RouteUrl $ReadOnlyRouteHashes.ReviewGallery
    backendPath = "/review-sessions/REV-441/gallery"
    readySelector = $(if ($ExpectedReadModelState -eq "ready") { ".review-gallery-console" } else { $readModelSuccessConfig.Selector })
    failureSelector = $failureConfig.ReadModelSelector
    readyExpectedEncoded = @($commonReadyExpected + $readModelSuccessConfig.ExpectedEncoded)
    failureExpectedEncoded = @($commonFailureExpected + $failureConfig.ReadModelExpectedEncoded)
  },
  @{
    name = "delivery-readiness"
    url = New-RouteUrl $ReadOnlyRouteHashes.DeliveryReadiness
    backendPath = "/deliveries/DEL-220/readiness"
    readySelector = $(if ($ExpectedReadModelState -eq "ready") { ".delivery-readiness-console" } else { $readModelSuccessConfig.Selector })
    failureSelector = $failureConfig.ReadModelSelector
    readyExpectedEncoded = @($commonReadyExpected + $readModelSuccessConfig.ExpectedEncoded)
    failureExpectedEncoded = @($commonFailureExpected + $failureConfig.ReadModelExpectedEncoded)
  }
)

Write-Host "== Photo Studio OS backend read-model smoke QA =="
Write-Host "FrontendBaseUrl: $normalizedFrontendUrl"
Write-Host "BackendBaseUrl: $BackendBaseUrl"
Write-Host "Mode: $(if ($ExpectReadFailure) { "expect backend $ExpectedFailureState UI" } else { "expect backend $ExpectedReadModelState UI" })"
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
    if ($check.backendReadRequestCount -lt 1) {
      $problems += "backend read endpoint not requested: $($check.backendPath)"
    }
    if ($check.backendMethods.Count -gt 0) {
      $nonReadBackendMethods = @($check.backendMethods | Where-Object {
        $_ -ne "GET" -and $_ -ne "HEAD" -and $_ -ne "OPTIONS"
      })
      if ($nonReadBackendMethods.Count -gt 0) {
        $problems += "non-read backend methods observed: $($nonReadBackendMethods -join ', ')"
      }
    }

    if ($problems.Count -gt 0) {
      $allPassed = $false
      Write-Host "[FAIL] $($check.name): $($problems -join '; ')"
    } else {
      Write-Host "[PASS] $($check.name) -> $($check.backendPath)"
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
      -not ($ExpectReadFailure -and $_ -like "Failed to load resource:*")
    }
  )
  $expectedResourceErrors = @(
    $result.consoleErrors | Where-Object {
      $ExpectReadFailure -and $_ -like "Failed to load resource:*"
    }
  )

  if ($expectedResourceErrors.Count -gt 0) {
    Write-Host "[INFO] expected backend resource errors observed: $($expectedResourceErrors.Count)"
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
