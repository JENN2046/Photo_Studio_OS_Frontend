# Photo Studio OS Frontend read-only boundary-state QA matrix.
# Safe local QA only. This script does not deploy, push, edit env files,
# call backend writes, or change dependency manifests.

param(
  [string]$BaseUrl = "http://127.0.0.1:5173",
  [string]$SessionName = "photo-studio-readonly-boundary-qa",
  [switch]$KeepBrowser
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
  Write-Host "package.json not found. Run this script from the frontend repo root."
  exit 1
}

. (Join-Path $PSScriptRoot "qa-readonly-fixtures.ps1")

$normalizedBaseUrl = $BaseUrl.TrimEnd("/")
$playwrightPackage = "@playwright/cli"
$npx = "npx"

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
  return "$normalizedBaseUrl/$Hash"
}

function Test-BoundaryCase {
  param(
    [hashtable]$Case,
    [hashtable]$Viewport
  )

  $payload = @{
    name = $Case.Name
    url = New-RouteUrl $Case.Hash
    stateSelector = $Case.StateSelector
    workspaceSelector = $Case.WorkspaceSelector
    expectedEncoded = $Case.ExpectedEncoded
    expectRetry = [bool]$Case.ExpectRetry
  } | ConvertTo-Json -Compress -Depth 6

  $code = "async (page) => { const testCase = $payload; page.removeAllListeners('console'); const consoleErrors = []; page.on('console', (message) => { if (message.type() === 'error') { consoleErrors.push(message.text()); } }); await page.goto(testCase.url); await page.waitForLoadState('domcontentloaded'); await page.waitForTimeout(50); await page.waitForSelector(testCase.stateSelector, { timeout: 2000 }).catch(() => undefined); const result = await page.evaluate((testCase) => { const text = document.body.innerText; const root = document.documentElement; const expected = testCase.expectedEncoded.map((item) => decodeURIComponent(item)); const missing = expected.filter((item) => !text.includes(item)); const stateCount = document.querySelectorAll('.read-model-state').length; const stateSelectorCount = document.querySelectorAll(testCase.stateSelector).length; const workspaceCount = document.querySelectorAll(testCase.workspaceSelector).length; const retryButtonCount = document.querySelectorAll('.read-model-state button').length; const overflow = root.scrollWidth > root.clientWidth + 1; return { name: testCase.name, url: location.href, missing, stateCount, stateSelectorCount, workspaceCount, retryButtonCount, overflow, scrollWidth: root.scrollWidth, clientWidth: root.clientWidth }; }, testCase); return Object.assign({}, result, { viewport: '$($Viewport.Name)', width: $($Viewport.Width), height: $($Viewport.Height), consoleErrorCount: consoleErrors.length, consoleErrors: consoleErrors, expectRetry: testCase.expectRetry }); }"
  $playwrightDir = Join-Path (Get-Location) ".playwright-cli"
  if (-not (Test-Path $playwrightDir)) {
    New-Item -ItemType Directory -Path $playwrightDir | Out-Null
  }

  $codePath = Join-Path $playwrightDir "qa-readonly-boundary-check.js"
  Set-Content -LiteralPath $codePath -Value $code -Encoding UTF8
  $raw = Invoke-PlaywrightRaw @("run-code", "--filename", $codePath, "--raw")

  try {
    $result = $raw | ConvertFrom-Json
  } catch {
    throw "Could not parse boundary QA result for $($Case.Name): $raw"
  }

  $problems = @()
  if ($result.stateCount -ne 1) {
    $problems += "state notice count mismatch: $($result.stateCount)"
  }
  if ($result.stateSelectorCount -ne 1) {
    $problems += "state selector missing: $($Case.StateSelector)"
  }
  if ($result.workspaceCount -ne 0) {
    $problems += "workspace rendered during boundary state: $($Case.WorkspaceSelector)"
  }
  if ($result.missing.Count -gt 0) {
    $problems += "missing copy: $($result.missing -join ', ')"
  }
  if ($Case.ExpectRetry -and $result.retryButtonCount -lt 1) {
    $problems += "retry button missing"
  }
  if ((-not $Case.ExpectRetry) -and $result.retryButtonCount -gt 0) {
    $problems += "unexpected retry button"
  }
  if ($result.overflow) {
    $problems += "horizontal overflow: $($result.scrollWidth) > $($result.clientWidth)"
  }
  if ($result.consoleErrorCount -gt 0) {
    $problems += "console errors: $($result.consoleErrors -join ' | ')"
  }

  if ($problems.Count -gt 0) {
    Write-Host "[FAIL] $($Viewport.Name) / $($Case.Name): $($problems -join '; ')"
    return $false
  }

  Write-Host "[PASS] $($Viewport.Name) / $($Case.Name)"
  return $true
}

$states = @{
  Loading = @{
    StateSelector = ".read-model-state-loading"
    ExpectRetry = $false
    ExpectedEncoded = @(
      "%E5%8F%AA%E8%AF%BB%E6%A8%A1%E5%9E%8B%E5%8A%A0%E8%BD%BD%E4%B8%AD",
      "%E8%AF%BB%E5%8F%96%E4%B8%AD"
    )
  }
  Error = @{
    StateSelector = ".read-model-state-error"
    ExpectRetry = $true
    ExpectedEncoded = @(
      "%E5%8F%AA%E8%AF%BB%E6%A8%A1%E5%9E%8B%E4%B8%8D%E5%8F%AF%E7%94%A8",
      "%E8%AF%BB%E5%8F%96%E5%A4%B1%E8%B4%A5",
      "%E9%87%8D%E8%AF%95"
    )
  }
  MissingConfig = @{
    StateSelector = ".read-model-state-missing-config"
    ExpectRetry = $false
    ExpectedEncoded = @(
      "%E5%90%8E%E7%AB%AF%E5%8F%AA%E8%AF%BB%E6%A8%A1%E5%9E%8B%E6%9C%AA%E9%85%8D%E7%BD%AE",
      "%E5%90%8E%E7%AB%AF%E6%9C%AA%E9%85%8D%E7%BD%AE",
      "%E5%86%85%E9%83%A8%E8%B0%83%E8%AF%95%EF%BC%9A%E6%A8%A1%E6%8B%9F%E5%90%8E%E7%AB%AF%E5%8F%AA%E8%AF%BB%E6%A8%A1%E5%9E%8B%E6%9C%AA%E9%85%8D%E7%BD%AE%E3%80%82"
    )
  }
  Idle = @{
    StateSelector = ".read-model-state-idle"
    ExpectRetry = $false
    ExpectedEncoded = @(
      "%E7%AD%89%E5%BE%85%E4%B8%8A%E4%B8%8B%E6%96%87"
    )
  }
}

$readModelPages = @(
  @{
    Name = "asset-inbox"
    HashBase = $ReadOnlyRouteHashes.AssetInbox
    IdleHash = $ReadOnlyRouteHashes.AssetInboxIdle
    WorkspaceSelector = ".asset-inbox-console"
    LoadingMessage = "%E5%86%85%E9%83%A8%E8%B0%83%E8%AF%95%EF%BC%9AAsset%20Inbox%20%E5%8F%AA%E8%AF%BB%E6%A8%A1%E5%9E%8B%E4%BF%9D%E6%8C%81%E5%8A%A0%E8%BD%BD%E6%80%81%E3%80%82"
    ErrorMessage = "Simulated%20Asset%20Inbox%20read-model%20boundary%20fault"
    IdleExpectedEncoded = @(
      "%E8%AF%B7%E5%85%88%E9%80%89%E6%8B%A9%20projectId",
      "%E8%AF%B7%E5%85%88%E9%80%89%E6%8B%A9%20projectId%20%E5%8A%A0%E8%BD%BD%E7%B4%A0%E6%9D%90%E6%94%B6%E4%BB%B6%E7%AE%B1%E3%80%82"
    )
  },
  @{
    Name = "qc-retouch"
    HashBase = $ReadOnlyRouteHashes.QcRetouch
    IdleHash = $ReadOnlyRouteHashes.QcRetouchIdle
    WorkspaceSelector = ".qc-retouch-console"
    LoadingMessage = "%E5%86%85%E9%83%A8%E8%B0%83%E8%AF%95%EF%BC%9AQC%20%2F%20Retouch%20%E5%8F%AA%E8%AF%BB%E6%A8%A1%E5%9E%8B%E4%BF%9D%E6%8C%81%E5%8A%A0%E8%BD%BD%E6%80%81%E3%80%82"
    ErrorMessage = "Simulated%20QC%20%2F%20Retouch%20read-model%20boundary%20fault"
    IdleExpectedEncoded = @(
      "%E8%AF%B7%E5%85%88%E9%80%89%E6%8B%A9%20projectId",
      "%E8%AF%B7%E5%85%88%E9%80%89%E6%8B%A9%20projectId%20%E5%8A%A0%E8%BD%BD%E8%B4%A8%E6%A3%80%20%2F%20%E7%B2%BE%E4%BF%AE%E9%98%9F%E5%88%97%E3%80%82"
    )
  },
  @{
    Name = "review-gallery"
    HashBase = $ReadOnlyRouteHashes.ReviewGallery
    IdleHash = $ReadOnlyRouteHashes.ReviewGalleryIdle
    WorkspaceSelector = ".review-gallery-console"
    LoadingMessage = "%E5%86%85%E9%83%A8%E8%B0%83%E8%AF%95%EF%BC%9AReview%20Gallery%20%E5%8F%AA%E8%AF%BB%E6%A8%A1%E5%9E%8B%E4%BF%9D%E6%8C%81%E5%8A%A0%E8%BD%BD%E6%80%81%E3%80%82"
    ErrorMessage = "Simulated%20Review%20Gallery%20read-model%20boundary%20fault"
    IdleExpectedEncoded = @(
      "%E8%AF%B7%E5%85%88%E9%80%89%E6%8B%A9%20reviewSessionId",
      "%E8%AF%B7%E5%85%88%E9%80%89%E6%8B%A9%20reviewSessionId%20%E5%8A%A0%E8%BD%BD%E5%AE%A1%E6%A0%B8%E7%94%BB%E5%BB%8A%E3%80%82"
    )
  },
  @{
    Name = "delivery-readiness"
    HashBase = $ReadOnlyRouteHashes.DeliveryReadiness
    IdleHash = $ReadOnlyRouteHashes.DeliveryReadinessIdle
    WorkspaceSelector = ".delivery-readiness-console"
    LoadingMessage = "%E5%86%85%E9%83%A8%E8%B0%83%E8%AF%95%EF%BC%9ADelivery%20Readiness%20%E5%8F%AA%E8%AF%BB%E6%A8%A1%E5%9E%8B%E4%BF%9D%E6%8C%81%E5%8A%A0%E8%BD%BD%E6%80%81%E3%80%82"
    ErrorMessage = "Simulated%20Delivery%20Readiness%20read-model%20boundary%20fault"
    IdleExpectedEncoded = @(
      "%E8%AF%B7%E5%85%88%E9%80%89%E6%8B%A9%20deliveryId",
      "%E8%AF%B7%E5%85%88%E9%80%89%E6%8B%A9%20deliveryId%20%E5%8A%A0%E8%BD%BD%E4%BA%A4%E4%BB%98%E5%B0%B1%E7%BB%AA%E3%80%82"
    )
  }
)

$cases = @()
foreach ($page in $readModelPages) {
  $cases += @{
    Name = "$($page.Name)-loading"
    Hash = "$($page.HashBase)&readModelState=loading"
    StateSelector = $states.Loading.StateSelector
    WorkspaceSelector = $page.WorkspaceSelector
    ExpectRetry = $states.Loading.ExpectRetry
    ExpectedEncoded = @($states.Loading.ExpectedEncoded + $page.LoadingMessage)
  }
  $cases += @{
    Name = "$($page.Name)-error"
    Hash = "$($page.HashBase)&readModelState=error"
    StateSelector = $states.Error.StateSelector
    WorkspaceSelector = $page.WorkspaceSelector
    ExpectRetry = $states.Error.ExpectRetry
    ExpectedEncoded = @($states.Error.ExpectedEncoded + $page.ErrorMessage)
  }
  $cases += @{
    Name = "$($page.Name)-missing-config"
    Hash = "$($page.HashBase)&readModelState=missing-config"
    StateSelector = $states.MissingConfig.StateSelector
    WorkspaceSelector = $page.WorkspaceSelector
    ExpectRetry = $states.MissingConfig.ExpectRetry
    ExpectedEncoded = $states.MissingConfig.ExpectedEncoded
  }
  $cases += @{
    Name = "$($page.Name)-idle"
    Hash = $page.IdleHash
    StateSelector = $states.Idle.StateSelector
    WorkspaceSelector = $page.WorkspaceSelector
    ExpectRetry = $states.Idle.ExpectRetry
    ExpectedEncoded = @($states.Idle.ExpectedEncoded + $page.IdleExpectedEncoded)
  }
}

$viewports = @(
  @{ Name = "tablet"; Width = 1024; Height = 768 },
  @{ Name = "mobile"; Width = 390; Height = 844 }
)

Write-Host "== Photo Studio OS read-only boundary-state QA =="
Write-Host "BaseUrl: $normalizedBaseUrl"
Write-Host "Cases: $($cases.Count)"
Write-Host "Viewports: $($viewports.Count)"

try {
  try {
    $statusCode = (Invoke-WebRequest -UseBasicParsing "$normalizedBaseUrl/" -TimeoutSec 5).StatusCode
    if ($statusCode -ne 200) {
      throw "Unexpected HTTP status: $statusCode"
    }
  } catch {
    Write-Host "Local frontend server is not reachable at $normalizedBaseUrl."
    Write-Host "Start it first with: npm run dev"
    throw
  }

  Invoke-PlaywrightCli @("open", (New-RouteUrl $ReadOnlyRouteHashes.AssetInbox))

  $allPassed = $true
  foreach ($viewport in $viewports) {
    Write-Host ""
    Write-Host "== Viewport: $($viewport.Name) $($viewport.Width)x$($viewport.Height) =="
    Invoke-PlaywrightCli @("resize", [string]$viewport.Width, [string]$viewport.Height)

    foreach ($case in $cases) {
      $passed = Test-BoundaryCase -Case $case -Viewport $viewport
      if (-not $passed) {
        $allPassed = $false
      }
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
}
