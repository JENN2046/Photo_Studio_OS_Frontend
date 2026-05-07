# Photo Studio OS Frontend read-only route QA matrix.
# Safe local QA only. This script does not deploy, push, edit env files,
# call backend writes, or change dependency manifests.

param(
  [string]$BaseUrl = "http://127.0.0.1:5173",
  [string]$SessionName = "photo-studio-readonly-qa",
  [switch]$KeepBrowser
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
  Write-Host "package.json not found. Run this script from the frontend repo root."
  exit 1
}

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

function Test-Route {
  param(
    [hashtable]$Route,
    [hashtable]$Viewport
  )

  $payload = @{
    name = $Route.Name
    url = New-RouteUrl $Route.Hash
    selector = $Route.Selector
    expectedEncoded = $Route.ExpectedEncoded
    railHref = $Route.RailHref
  } | ConvertTo-Json -Compress -Depth 6

  $code = "async (page) => { const route = $payload; const consoleErrors = []; page.on('console', (message) => { if (message.type() === 'error') { consoleErrors.push(message.text()); } }); await page.goto(route.url); await page.waitForLoadState('domcontentloaded'); await page.waitForTimeout(50); await page.waitForSelector(route.selector, { timeout: 2000 }).catch(() => undefined); const result = await page.evaluate((route) => { const text = document.body.innerText; const root = document.documentElement; const expected = route.expectedEncoded.map((item) => decodeURIComponent(item)); const currentRailLinks = Array.from(document.querySelectorAll('.command-rail a[aria-current=""page""]')).map((link) => link.getAttribute('href')); const missing = expected.filter((item) => !text.includes(item)); const selectorCount = document.querySelectorAll(route.selector).length; const overflow = root.scrollWidth > root.clientWidth + 1; const railOk = !route.railHref || (currentRailLinks.length === 1 && currentRailLinks[0] === route.railHref); return { name: route.name, url: location.href, selectorCount, missing, overflow, scrollWidth: root.scrollWidth, clientWidth: root.clientWidth, railOk, currentRailLinks }; }, route); return Object.assign({}, result, { viewport: '$($Viewport.Name)', width: $($Viewport.Width), height: $($Viewport.Height), consoleErrorCount: consoleErrors.length, consoleErrors: consoleErrors }); }"
  $playwrightDir = Join-Path (Get-Location) ".playwright-cli"
  if (-not (Test-Path $playwrightDir)) {
    New-Item -ItemType Directory -Path $playwrightDir | Out-Null
  }

  $codePath = Join-Path $playwrightDir "qa-readonly-route-check.js"
  Set-Content -LiteralPath $codePath -Value $code -Encoding UTF8
  $raw = Invoke-PlaywrightRaw @("run-code", "--filename", $codePath, "--raw")

  try {
    $result = $raw | ConvertFrom-Json
  } catch {
    throw "Could not parse route QA result for $($Route.Name): $raw"
  }

  $problems = @()
  if ($result.selectorCount -lt 1) {
    $problems += "selector missing: $($Route.Selector)"
  }
  if ($result.missing.Count -gt 0) {
    $problems += "missing copy: $($result.missing -join ', ')"
  }
  if ($result.overflow) {
    $problems += "horizontal overflow: $($result.scrollWidth) > $($result.clientWidth)"
  }
  if ($result.consoleErrorCount -gt 0) {
    $problems += "console errors: $($result.consoleErrors -join ' | ')"
  }
  if (-not $result.railOk) {
    $problems += "rail current mismatch: $($result.currentRailLinks -join ', ')"
  }

  if ($problems.Count -gt 0) {
    Write-Host "[FAIL] $($Viewport.Name) / $($Route.Name): $($problems -join '; ')"
    return $false
  }

  Write-Host "[PASS] $($Viewport.Name) / $($Route.Name)"
  return $true
}

$routes = @(
  @{
    Name = "command-center"
    Hash = "#"
    Selector = ".cockpit-command-center"
    ExpectedEncoded = @("SKU%20%E8%A6%86%E7%9B%96%E7%8E%87", "%E5%B7%A5%E4%BD%9C%E5%AE%A4%E5%B0%B1%E7%BB%AA%E5%BA%A6", "%E9%BB%84%E9%87%91%E9%93%BE%E8%B7%AF", "Agent%20%E5%B7%A1%E6%A3%80", "%E8%AF%BB%E5%8F%96%E6%BA%90", "%E8%BF%90%E8%A1%8C%E7%8A%B6%E6%80%81", "%E4%BC%A0%E8%BE%93", "%E5%86%99%E5%85%A5%E8%BE%B9%E7%95%8C", "mock-first%20%2F%20read-only")
  },
  @{
    Name = "command-center-loading"
    Hash = "?commandCenterState=loading#"
    Selector = ".status-command-loading"
    ExpectedEncoded = @("%E9%81%A5%E6%B5%8B%E5%AF%B9%E9%BD%90%E4%B8%AD", "%E8%AF%BB%E5%8F%96%E6%BA%90", "%E8%BF%90%E8%A1%8C%E7%8A%B6%E6%80%81", "DEV%20%E8%B0%83%E8%AF%95", "%E5%91%BD%E4%BB%A4%E4%B8%AD%E5%BF%83%E8%BE%B9%E7%95%8C%E6%80%81%E6%BC%94%E7%BB%83", "mock-first%20%2F%20read-only")
  },
  @{
    Name = "command-center-error"
    Hash = "?commandCenterState=error#"
    Selector = ".status-command-error"
    ExpectedEncoded = @("%E5%8F%AA%E8%AF%BB%E4%BF%9D%E7%95%99%E6%80%81", "%E8%AF%BB%E5%8F%96%E6%BA%90", "%E8%BF%90%E8%A1%8C%E7%8A%B6%E6%80%81", "DEV%20%E8%B0%83%E8%AF%95", "%E5%91%BD%E4%BB%A4%E4%B8%AD%E5%BF%83%E8%BE%B9%E7%95%8C%E6%80%81%E6%BC%94%E7%BB%83", "mock-first%20%2F%20read-only")
  },
  @{
    Name = "command-risk"
    Hash = "#risk"
    Selector = "#risk"
    RailHref = "#risk"
    ExpectedEncoded = @("%E9%A3%8E%E9%99%A9%E9%9B%B7%E8%BE%BE", "%E8%B4%9F%E8%B4%A3%E4%BA%BA", "%E5%BB%BA%E8%AE%AE")
  },
  @{
    Name = "command-projects"
    Hash = "#projects"
    Selector = ".project-execution-panel"
    RailHref = "#projects"
    ExpectedEncoded = @("%E9%A1%B9%E7%9B%AE%E6%89%A7%E8%A1%8C", "%E6%9E%81%E5%85%89%E7%B3%BB%E5%88%97", "%E9%A1%B9%E7%9B%AE")
  },
  @{
    Name = "command-approvals"
    Hash = "#approvals"
    Selector = "#approvals"
    RailHref = "#approvals"
    ExpectedEncoded = @("%E5%AE%A1%E6%89%B9%E9%98%9F%E5%88%97", "%E4%B8%8B%E4%B8%80%E6%AD%A5", "%E5%BE%85%E5%A4%84%E7%90%86")
  },
  @{
    Name = "command-activity"
    Hash = "#activity"
    Selector = ".timeline-panel"
    RailHref = "#activity"
    ExpectedEncoded = @("%E6%B4%BB%E5%8A%A8%E6%97%B6%E9%97%B4%E7%BA%BF", "%E6%8B%8D%E6%91%84%E5%AE%8C%E6%88%90", "%E8%B4%A8%E6%A3%80%E9%80%9A%E8%BF%87")
  },
  @{
    Name = "command-inspections"
    Hash = "#inspections"
    Selector = ".inspection-panel"
    RailHref = "#inspections"
    ExpectedEncoded = @("Agent%20%E5%B7%A1%E6%A3%80", "%E7%84%A6%E7%82%B9%E5%BC%82%E5%B8%B8", "%E6%9F%A5%E7%9C%8B%E5%85%A8%E9%83%A8")
  },
  @{
    Name = "asset-inbox"
    Hash = "#asset-inbox?projectId=PRJ-128&reviewSessionId=REV-441&deliveryId=DEL-220"
    Selector = ".asset-inbox-console"
    ExpectedEncoded = @("%E7%B4%A0%E6%9D%90%E6%94%B6%E4%BB%B6%E7%AE%B1", "%E7%BB%91%E5%AE%9A%E7%8A%B6%E6%80%81", "%E4%B8%8A%E4%BC%A0%E6%9C%AA%E5%90%AF%E7%94%A8", "%E4%B8%8B%E8%BD%BD%E6%9C%AA%E5%90%AF%E7%94%A8")
  },
  @{
    Name = "qc-retouch"
    Hash = "#qc-retouch?projectId=PRJ-128&reviewSessionId=REV-441&deliveryId=DEL-220"
    Selector = ".qc-retouch-console"
    ExpectedEncoded = @("%E8%B4%A8%E6%A3%80%20%2F%20%E7%B2%BE%E4%BF%AE%E9%98%9F%E5%88%97", "%E6%8A%80%E6%9C%AF%E6%A3%80%E6%9F%A5", "%E9%80%80%E5%9B%9E%E7%B2%BE%E4%BF%AE", "%E5%8F%AA%E8%AF%BB%E5%BB%BA%E8%AE%AE")
  },
  @{
    Name = "review-gallery"
    Hash = "#review-gallery?projectId=PRJ-128&reviewSessionId=REV-441&deliveryId=DEL-220"
    Selector = ".review-gallery-console"
    ExpectedEncoded = @("%E5%AE%A1%E6%A0%B8%E7%94%BB%E5%BB%8A", "%E5%AE%A2%E6%88%B7%E5%8F%8D%E9%A6%88", "%E5%85%AC%E5%BC%80%E5%AE%A1%E6%A0%B8%E6%9C%AA%E5%90%AF%E7%94%A8", "%E5%8F%8D%E9%A6%88%E5%86%99%E5%85%A5%E6%9C%AA%E5%90%AF%E7%94%A8")
  },
  @{
    Name = "delivery-readiness"
    Hash = "#delivery-readiness?projectId=PRJ-128&reviewSessionId=REV-441&deliveryId=DEL-220"
    Selector = ".delivery-readiness-console"
    ExpectedEncoded = @("%E4%BA%A4%E4%BB%98%E5%B0%B1%E7%BB%AA", "%E5%B0%B1%E7%BB%AA%E6%A3%80%E6%9F%A5", "%E4%B8%8B%E8%BD%BD%E6%9C%AA%E5%BC%80%E6%94%BE", "%E5%A4%96%E9%83%A8%E4%BA%A4%E4%BB%98%E6%9C%AA%E5%90%AF%E7%94%A8")
  }
)

$viewports = @(
  @{ Name = "desktop"; Width = 1440; Height = 960 },
  @{ Name = "mobile"; Width = 390; Height = 844 }
)

Write-Host "== Photo Studio OS read-only route QA =="
Write-Host "BaseUrl: $normalizedBaseUrl"
Write-Host "Routes: $($routes.Count)"
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

  Invoke-PlaywrightCli @("open", (New-RouteUrl "#"))

  $allPassed = $true
  foreach ($viewport in $viewports) {
    Write-Host ""
    Write-Host "== Viewport: $($viewport.Name) $($viewport.Width)x$($viewport.Height) =="
    Invoke-PlaywrightCli @("resize", [string]$viewport.Width, [string]$viewport.Height)

    foreach ($route in $routes) {
      $passed = Test-Route -Route $route -Viewport $viewport
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
