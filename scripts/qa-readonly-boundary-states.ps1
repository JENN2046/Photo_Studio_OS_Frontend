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

function ConvertTo-ExpectedEncoded {
  param([string[]]$Items)

  return @($Items | ForEach-Object { [uri]::EscapeDataString($_) })
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
    expectWorkspace = [bool]$Case.ExpectWorkspace
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
  if ($Case.ExpectWorkspace) {
    if ($result.workspaceCount -lt 1) {
      $problems += "workspace should render with available boundary data: $($Case.WorkspaceSelector)"
    }
  } elseif ($result.workspaceCount -ne 0) {
    $problems += "workspace rendered during blocking boundary state: $($Case.WorkspaceSelector)"
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
  Empty = @{
    StateSelector = ".read-model-state-empty"
    ExpectRetry = $false
    ExpectedEncoded = @(
      "%E8%AF%A5%E8%A7%86%E5%9B%BE%E6%9A%82%E6%97%A0%E6%95%B0%E6%8D%AE",
      "%E6%95%B0%E6%8D%AE%E4%B8%BA%E7%A9%BA"
    )
  }
  Partial = @{
    StateSelector = ".read-model-state-partial"
    ExpectRetry = $false
    ExpectedEncoded = @(
      "%E8%AF%A5%E8%A7%86%E5%9B%BE%E4%BB%85%E5%8A%A0%E8%BD%BD%E4%BA%86%E9%83%A8%E5%88%86%E6%95%B0%E6%8D%AE",
      "%E9%83%A8%E5%88%86%E6%95%B0%E6%8D%AE"
    )
  }
  Stale = @{
    StateSelector = ".read-model-state-stale"
    ExpectRetry = $true
    ExpectedEncoded = @(
      "%E6%95%B0%E6%8D%AE%E5%8F%AF%E8%83%BD%E5%B7%B2%E8%BF%87%E6%9C%9F",
      "%E6%95%B0%E6%8D%AE%E8%BF%87%E6%9C%9F",
      "%E9%87%8D%E8%AF%95"
    )
  }
  Forbidden = @{
    StateSelector = ".read-model-state-forbidden"
    ExpectRetry = $false
    ExpectedEncoded = @(
      "%E6%97%A0%E6%9D%83%E8%AE%BF%E9%97%AE%E8%AF%A5%E5%8F%AA%E8%AF%BB%E6%A8%A1%E5%9E%8B",
      "%E6%9D%83%E9%99%90%E4%B8%8D%E8%B6%B3"
    )
  }
  InvalidId = @{
    StateSelector = ".read-model-state-invalid-id"
    ExpectRetry = $false
    ExpectedEncoded = @(
      "%E8%AF%B7%E6%B1%82%E7%9A%84%20ID%20%E6%97%A0%E6%95%88%E6%88%96%E6%9C%AA%E6%89%BE%E5%88%B0",
      "ID%20%E6%97%A0%E6%95%88"
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
    DebugLabel = "Asset Inbox"
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
    DebugLabel = "QC / Retouch"
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
    DebugLabel = "Review Gallery"
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
    DebugLabel = "Delivery Readiness"
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
    ExpectWorkspace = $false
    ExpectedEncoded = @($states.Loading.ExpectedEncoded + $page.LoadingMessage)
  }
  $cases += @{
    Name = "$($page.Name)-error"
    Hash = "$($page.HashBase)&readModelState=error"
    StateSelector = $states.Error.StateSelector
    WorkspaceSelector = $page.WorkspaceSelector
    ExpectRetry = $states.Error.ExpectRetry
    ExpectWorkspace = $false
    ExpectedEncoded = @($states.Error.ExpectedEncoded + $page.ErrorMessage)
  }
  $cases += @{
    Name = "$($page.Name)-missing-config"
    Hash = "$($page.HashBase)&readModelState=missing-config"
    StateSelector = $states.MissingConfig.StateSelector
    WorkspaceSelector = $page.WorkspaceSelector
    ExpectRetry = $states.MissingConfig.ExpectRetry
    ExpectWorkspace = $false
    ExpectedEncoded = $states.MissingConfig.ExpectedEncoded
  }
  $cases += @{
    Name = "$($page.Name)-empty"
    Hash = "$($page.HashBase)&readModelState=empty"
    StateSelector = $states.Empty.StateSelector
    WorkspaceSelector = $page.WorkspaceSelector
    ExpectRetry = $states.Empty.ExpectRetry
    ExpectWorkspace = $true
    ExpectedEncoded = @($states.Empty.ExpectedEncoded + "%E5%86%85%E9%83%A8%E8%B0%83%E8%AF%95%EF%BC%9A$([uri]::EscapeDataString($page.DebugLabel))%20%E5%8F%AA%E8%AF%BB%E6%A8%A1%E5%9E%8B%E8%BF%94%E5%9B%9E%E7%A9%BA%E6%95%B0%E6%8D%AE%E3%80%82")
  }
  $cases += @{
    Name = "$($page.Name)-partial"
    Hash = "$($page.HashBase)&readModelState=partial"
    StateSelector = $states.Partial.StateSelector
    WorkspaceSelector = $page.WorkspaceSelector
    ExpectRetry = $states.Partial.ExpectRetry
    ExpectWorkspace = $true
    ExpectedEncoded = @($states.Partial.ExpectedEncoded + "%E5%86%85%E9%83%A8%E8%B0%83%E8%AF%95%EF%BC%9A$([uri]::EscapeDataString($page.DebugLabel))%20%E5%8F%AA%E8%AF%BB%E6%A8%A1%E5%9E%8B%E8%BF%94%E5%9B%9E%E4%B8%8D%E5%AE%8C%E6%95%B4%E6%95%B0%E6%8D%AE%E3%80%82")
  }
  $cases += @{
    Name = "$($page.Name)-stale"
    Hash = "$($page.HashBase)&readModelState=stale"
    StateSelector = $states.Stale.StateSelector
    WorkspaceSelector = $page.WorkspaceSelector
    ExpectRetry = $states.Stale.ExpectRetry
    ExpectWorkspace = $true
    ExpectedEncoded = @($states.Stale.ExpectedEncoded + "%E5%86%85%E9%83%A8%E8%B0%83%E8%AF%95%EF%BC%9A$([uri]::EscapeDataString($page.DebugLabel))%20%E6%95%B0%E6%8D%AE%E5%B7%B2%E8%BF%87%E6%9C%9F%EF%BC%8C%E9%9C%80%E8%A6%81%E5%88%B7%E6%96%B0%E3%80%82")
  }
  $cases += @{
    Name = "$($page.Name)-forbidden"
    Hash = "$($page.HashBase)&readModelState=forbidden"
    StateSelector = $states.Forbidden.StateSelector
    WorkspaceSelector = $page.WorkspaceSelector
    ExpectRetry = $states.Forbidden.ExpectRetry
    ExpectWorkspace = $false
    ExpectedEncoded = @($states.Forbidden.ExpectedEncoded + (ConvertTo-ExpectedEncoded @("Simulated $($page.DebugLabel) access denied")))
  }
  $cases += @{
    Name = "$($page.Name)-invalid-id"
    Hash = "$($page.HashBase)&readModelState=invalid-id"
    StateSelector = $states.InvalidId.StateSelector
    WorkspaceSelector = $page.WorkspaceSelector
    ExpectRetry = $states.InvalidId.ExpectRetry
    ExpectWorkspace = $false
    ExpectedEncoded = @($states.InvalidId.ExpectedEncoded + (ConvertTo-ExpectedEncoded @("Simulated $($page.DebugLabel) invalid context id")))
  }
  $cases += @{
    Name = "$($page.Name)-idle"
    Hash = $page.IdleHash
    StateSelector = $states.Idle.StateSelector
    WorkspaceSelector = $page.WorkspaceSelector
    ExpectRetry = $states.Idle.ExpectRetry
    ExpectWorkspace = $false
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
