# Photo Studio OS Frontend read-only interaction QA matrix.
# Safe local QA only. This script does not deploy, push, edit env files,
# call backend writes, or change dependency manifests.

param(
  [string]$BaseUrl = "http://127.0.0.1:5173",
  [string]$SessionName = "photo-studio-readonly-interaction-qa",
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

function Invoke-QaCode {
  param([string]$Code)

  $playwrightDir = Join-Path (Get-Location) ".playwright-cli"
  if (-not (Test-Path $playwrightDir)) {
    New-Item -ItemType Directory -Path $playwrightDir | Out-Null
  }

  $codePath = Join-Path $playwrightDir "qa-readonly-interaction-check.js"
  Set-Content -LiteralPath $codePath -Value $Code -Encoding UTF8
  return Invoke-PlaywrightRaw @("run-code", "--filename", $codePath, "--raw")
}

function Test-Tabs {
  param([hashtable]$Viewport)

  $targetRoutes = $ReadModelRouteNames | ConvertTo-Json -Compress
  $entryUrl = New-RouteUrl $ReadOnlyRouteHashes.AssetInbox
  $code = "async (page) => { const targets = $targetRoutes; const consoleErrors = []; page.removeAllListeners('console'); page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); }); await page.goto('$entryUrl'); await page.waitForLoadState('domcontentloaded'); await page.waitForSelector('.read-model-tabs a', { timeout: 2000 }); const checks = []; for (const target of targets) { const clickResult = await page.evaluate((target) => { const links = Array.from(document.querySelectorAll('.read-model-tabs a')); const link = links.find((item) => (item.getAttribute('href') || '').startsWith('#' + target)); if (!link) return { target, clicked: false }; link.click(); return { target, clicked: true, href: link.getAttribute('href') }; }, target); await page.waitForTimeout(80); const state = await page.evaluate((target) => { const current = Array.from(document.querySelectorAll('.read-model-tabs a[aria-current=""page""]')).map((item) => item.getAttribute('href') || ''); const root = document.documentElement; return { target, hash: location.hash, current, overflow: root.scrollWidth > root.clientWidth + 1, scrollWidth: root.scrollWidth, clientWidth: root.clientWidth }; }, target); checks.push(Object.assign({}, clickResult, state)); } return { viewport: '$($Viewport.Name)', checks, consoleErrorCount: consoleErrors.length, consoleErrors }; }"
  $raw = Invoke-QaCode $code
  $result = $raw | ConvertFrom-Json
  $problems = @()
  foreach ($check in $result.checks) {
    if (-not $check.clicked) {
      $problems += "tab link missing: $($check.target)"
    }
    if (-not ($check.hash -like "#$($check.target)*")) {
      $problems += "tab hash mismatch: $($check.target) => $($check.hash)"
    }
    if ($check.current.Count -ne 1 -or -not ($check.current[0] -like "#$($check.target)*")) {
      $problems += "tab active mismatch: $($check.target)"
    }
    if ($check.overflow) {
      $problems += "tab overflow: $($check.scrollWidth) > $($check.clientWidth)"
    }
  }
  if ($result.consoleErrorCount -gt 0) {
    $problems += "console errors: $($result.consoleErrors -join ' | ')"
  }

  if ($problems.Count -gt 0) {
    Write-Host "[FAIL] $($Viewport.Name) / tabs: $($problems -join '; ')"
    return $false
  }

  Write-Host "[PASS] $($Viewport.Name) / tabs"
  return $true
}

function Test-Workspace {
  param(
    [hashtable]$Route,
    [hashtable]$Viewport
  )

  $payload = @{
    name = $Route.Name
    url = New-RouteUrl $Route.Hash
    cardSelector = $Route.CardSelector
    actionSelector = $Route.ActionSelector
  } | ConvertTo-Json -Compress -Depth 4
  $code = "async (page) => { const route = $payload; const consoleErrors = []; page.removeAllListeners('console'); page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); }); await page.goto(route.url); await page.waitForLoadState('domcontentloaded'); await page.waitForSelector(route.cardSelector, { timeout: 2000 }); const result = await page.evaluate((route) => { const cards = Array.from(document.querySelectorAll(route.cardSelector)); const beforePressed = cards.filter((card) => card.getAttribute('aria-pressed') === 'true').length; const target = cards[1] || cards[0]; if (target) target.click(); return { cardCount: cards.length, beforePressed, clickedIndex: cards.indexOf(target) }; }, route); await page.waitForTimeout(80); const state = await page.evaluate((route) => { const cards = Array.from(document.querySelectorAll(route.cardSelector)); const pressed = cards.map((card, index) => ({ index, pressed: card.getAttribute('aria-pressed') === 'true' })).filter((item) => item.pressed); const actions = Array.from(document.querySelectorAll(route.actionSelector + ' button')).map((button) => ({ disabled: button.disabled, ariaDisabled: button.getAttribute('aria-disabled'), title: button.getAttribute('title') || '' })); const readOnlyText = decodeURIComponent('%E5%8F%AA%E8%AF%BB'); const root = document.documentElement; return { pressed, actionCount: actions.length, allActionsDisabled: actions.every((button) => button.disabled && button.ariaDisabled === 'true' && button.title.includes(readOnlyText)), overflow: root.scrollWidth > root.clientWidth + 1, scrollWidth: root.scrollWidth, clientWidth: root.clientWidth }; }, route); return Object.assign({}, result, state, { viewport: '$($Viewport.Name)', route: route.name, consoleErrorCount: consoleErrors.length, consoleErrors }); }"
  $raw = Invoke-QaCode $code
  $result = $raw | ConvertFrom-Json
  $problems = @()
  if ($result.cardCount -lt 1) {
    $problems += "selectable cards missing: $($Route.CardSelector)"
  }
  if ($result.pressed.Count -ne 1) {
    $problems += "pressed state count mismatch: $($result.pressed.Count)"
  }
  if ($result.cardCount -gt 1 -and $result.pressed[0].index -ne 1) {
    $problems += "second card did not become selected"
  }
  if ($result.actionCount -lt 2) {
    $problems += "disabled action buttons missing: $($Route.ActionSelector)"
  }
  if (-not $result.allActionsDisabled) {
    $problems += "disabled/read-only action posture mismatch"
  }
  if ($result.overflow) {
    $problems += "horizontal overflow: $($result.scrollWidth) > $($result.clientWidth)"
  }
  if ($result.consoleErrorCount -gt 0) {
    $problems += "console errors: $($result.consoleErrors -join ' | ')"
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
    Name = "asset-inbox"
    Hash = $ReadOnlyRouteHashes.AssetInbox
    CardSelector = ".asset-thumbnail"
    ActionSelector = ".asset-preview-actions"
  },
  @{
    Name = "qc-retouch"
    Hash = $ReadOnlyRouteHashes.QcRetouch
    CardSelector = ".qc-queue-card"
    ActionSelector = ".qc-suggestion-actions"
  },
  @{
    Name = "review-gallery"
    Hash = $ReadOnlyRouteHashes.ReviewGallery
    CardSelector = ".review-card"
    ActionSelector = ".review-actions"
  },
  @{
    Name = "delivery-readiness"
    Hash = $ReadOnlyRouteHashes.DeliveryReadiness
    CardSelector = ".delivery-artifact-card"
    ActionSelector = ".delivery-actions"
  }
)

$viewports = @(
  @{ Name = "desktop"; Width = 1440; Height = 960 },
  @{ Name = "mobile"; Width = 390; Height = 844 }
)

Write-Host "== Photo Studio OS read-only interaction QA =="
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

  Invoke-PlaywrightCli @("open", (New-RouteUrl $ReadOnlyRouteHashes.AssetInbox))

  $allPassed = $true
  foreach ($viewport in $viewports) {
    Write-Host ""
    Write-Host "== Viewport: $($viewport.Name) $($viewport.Width)x$($viewport.Height) =="
    Invoke-PlaywrightCli @("resize", [string]$viewport.Width, [string]$viewport.Height)

    if (-not (Test-Tabs -Viewport $viewport)) {
      $allPassed = $false
    }

    foreach ($route in $routes) {
      if (-not (Test-Workspace -Route $route -Viewport $viewport)) {
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
