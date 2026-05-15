# Photo Studio OS Frontend auth state boundary QA matrix.
# Safe local QA only. This script does not deploy, push, edit env files,
# call backend writes, or change dependency manifests.

param(
  [string]$BaseUrl = "http://127.0.0.1:5173",
  [string]$SessionName = "photo-studio-readonly-auth-qa",
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

function Test-AuthCase {
  param(
    [hashtable]$Case,
    [hashtable]$Viewport
  )

  $payload = @{
    name = $Case.Name
    url = New-RouteUrl $Case.Hash
    expectedEncoded = $Case.ExpectedEncoded
    expectChipEncoded = if ($Case.ExpectedChipEncoded) { $Case.ExpectedChipEncoded } else { @() }
    expectContentHidden = [bool]$Case.ExpectContentHidden
    expectContentVisible = [bool]$Case.ExpectContentVisible
    contentSelector = $Case.ContentSelector
    expectNoticeSelector = $Case.ExpectNoticeSelector
  } | ConvertTo-Json -Compress -Depth 6

  $code = "async (page) => { const testCase = $payload; page.removeAllListeners('console'); const consoleErrors = []; page.on('console', (message) => { if (message.type() === 'error') { consoleErrors.push(message.text()); } }); await page.goto(testCase.url); await page.waitForLoadState('domcontentloaded'); await page.waitForTimeout(50); await page.waitForSelector('.read-model-page', { timeout: 2000 }).catch(() => undefined); if (testCase.expectNoticeSelector) { await page.waitForSelector(testCase.expectNoticeSelector, { timeout: 2000 }).catch(() => undefined); } else if (testCase.contentSelector) { await page.waitForSelector(testCase.contentSelector, { timeout: 2000 }).catch(() => undefined); } const result = await page.evaluate((testCase) => { const text = document.body.innerText; const root = document.documentElement; const expected = testCase.expectedEncoded.map((item) => decodeURIComponent(item)); const chipExpected = testCase.expectChipEncoded.map((item) => decodeURIComponent(item)); const missing = expected.filter((item) => !text.includes(item)); const missingChips = chipExpected.filter((item) => !text.includes(item)); const stateNoticeCount = document.querySelectorAll('.read-model-state').length; const noticeSelectorCount = testCase.expectNoticeSelector ? document.querySelectorAll(testCase.expectNoticeSelector).length : null; const contentCount = testCase.contentSelector ? document.querySelectorAll(testCase.contentSelector).length : null; const contentHidden = testCase.expectContentHidden && testCase.contentSelector ? contentCount === 0 : null; const contentVisible = testCase.expectContentVisible && testCase.contentSelector ? contentCount > 0 : null; const overflow = root.scrollWidth > root.clientWidth + 1; return { name: testCase.name, url: location.href, missing, missingChips, stateNoticeCount, noticeSelectorCount, contentCount, contentHidden, contentVisible, overflow, scrollWidth: root.scrollWidth, clientWidth: root.clientWidth }; }, testCase); return Object.assign({}, result, { viewport: '$($Viewport.Name)', width: $($Viewport.Width), height: $($Viewport.Height), consoleErrorCount: consoleErrors.length, consoleErrors: consoleErrors }); }"
  $playwrightDir = Join-Path (Get-Location) ".playwright-cli"
  if (-not (Test-Path $playwrightDir)) {
    New-Item -ItemType Directory -Path $playwrightDir | Out-Null
  }

  $codePath = Join-Path $playwrightDir "qa-readonly-auth-check.js"
  Set-Content -LiteralPath $codePath -Value $code -Encoding UTF8
  $raw = Invoke-PlaywrightRaw @("run-code", "--filename", $codePath, "--raw")

  try {
    $result = $raw | ConvertFrom-Json
  } catch {
    throw "Could not parse auth QA result for $($Case.Name): $raw"
  }

  $problems = @()
  if ($result.missing.Count -gt 0) {
    $problems += "missing copy: $($result.missing -join ', ')"
  }
  if ($result.missingChips.Count -gt 0) {
    $problems += "missing auth chips: $($result.missingChips -join ', ')"
  }
  if ($Case.ExpectNoticeSelector -and $result.noticeSelectorCount -lt 1) {
    $problems += "state notice not found"
  }
  if ($Case.ExpectContentHidden -and $result.contentHidden -eq $false) {
    $problems += "content should be hidden but was rendered"
  }
  if ($Case.ExpectContentVisible -and $result.contentVisible -eq $false) {
    $problems += "content should be visible but was not rendered"
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

$authCases = @(
  @{
    Name = "cc-signed-out"
    Hash = "#?authState=signed-out"
    ExpectedEncoded = @(
      "%E8%AF%B7%E7%99%BB%E5%BD%95%E4%BB%A5%E8%AE%BF%E9%97%AE%E5%91%BD%E4%BB%A4%E4%B8%AD%E5%BF%83",
      "%E6%9C%AA%E7%99%BB%E5%BD%95",
      "%E7%99%BB%E5%BD%95"
    )
    ExpectedChipEncoded = @(
      "%E8%AE%A4%E8%AF%81%E6%BA%90",
      "%E4%BC%9A%E8%AF%9D",
      "%E8%A7%92%E8%89%B2"
    )
    ExpectContentHidden = $true
    ContentSelector = ".cockpit-command-center"
    ExpectNoticeSelector = ".read-model-state-forbidden"
  },
  @{
    Name = "cc-expired"
    Hash = "#?authState=expired"
    ExpectedEncoded = @(
      "%E4%BC%9A%E8%AF%9D%E5%B7%B2%E8%BF%87%E6%9C%9F",
      "%E9%87%8D%E6%96%B0%E7%99%BB%E5%BD%95"
    )
    ExpectedChipEncoded = @(
      "%E8%AE%A4%E8%AF%81%E6%BA%90",
      "%E4%BC%9A%E8%AF%9D",
      "%E8%A7%92%E8%89%B2"
    )
    ExpectContentHidden = $true
    ContentSelector = ".cockpit-command-center"
    ExpectNoticeSelector = ".read-model-state-forbidden"
  },
  @{
    Name = "cc-loading"
    Hash = "#?authState=loading"
    ExpectedEncoded = @(
      "%E8%AE%A4%E8%AF%81%E9%AA%8C%E8%AF%81%E4%B8%AD",
      "%E6%AD%A3%E5%9C%A8%E9%AA%8C%E8%AF%81%E4%BC%9A%E8%AF%9D%E4%BB%A4%E7%89%8C"
    )
    ExpectedChipEncoded = @(
      "%E8%AE%A4%E8%AF%81%E6%BA%90",
      "%E4%BC%9A%E8%AF%9D",
      "%E8%A7%92%E8%89%B2"
    )
    ExpectContentHidden = $true
    ContentSelector = ".cockpit-command-center"
    ExpectNoticeSelector = ".read-model-state-forbidden"
  },
  @{
    Name = "cc-auth-error"
    Hash = "#?authState=error"
    ExpectedEncoded = @(
      "%E8%AE%A4%E8%AF%81%E6%9C%8D%E5%8A%A1%E4%B8%8D%E5%8F%AF%E7%94%A8",
      "%E8%AE%A4%E8%AF%81%E6%95%85%E9%9A%9C"
    )
    ExpectedChipEncoded = @(
      "%E8%AE%A4%E8%AF%81%E6%BA%90",
      "%E4%BC%9A%E8%AF%9D",
      "%E8%A7%92%E8%89%B2"
    )
    ExpectContentHidden = $true
    ContentSelector = ".cockpit-command-center"
    ExpectNoticeSelector = ".read-model-state-forbidden"
  },
  @{
    Name = "cc-forbidden"
    Hash = "#?authState=forbidden"
    ExpectedEncoded = @(
      "%E6%97%A0%E6%9D%83%E8%AE%BF%E9%97%AE%E8%AF%A5%E9%A1%B5%E9%9D%A2",
      "%E6%89%80%E9%9C%80%E8%A7%92%E8%89%B2",
      "%E5%BD%93%E5%89%8D%E8%A7%92%E8%89%B2",
      "%E8%BF%94%E5%9B%9E%E5%91%BD%E4%BB%A4%E4%B8%AD%E5%BF%83"
    )
    ExpectedChipEncoded = @(
      "%E8%AE%A4%E8%AF%81%E6%BA%90",
      "%E4%BC%9A%E8%AF%9D",
      "%E8%A7%92%E8%89%B2"
    )
    ExpectContentHidden = $true
    ContentSelector = ".cockpit-command-center"
    ExpectNoticeSelector = ".read-model-state-forbidden"
  },
  @{
    Name = "asset-inbox-signed-in"
    Hash = "#asset-inbox?projectId=PRJ-128&reviewSessionId=REV-441&deliveryId=DEL-220&authState=signed-in"
    ExpectedEncoded = @(
      "%E7%B4%A0%E6%9D%90%E6%94%B6%E4%BB%B6%E7%AE%B1",
      "%E4%BC%9A%E8%AF%9D",
      "%E8%A7%92%E8%89%B2"
    )
    ExpectedChipEncoded = @(
      "%E4%BC%9A%E8%AF%9D",
      "%E8%A7%92%E8%89%B2"
    )
    ExpectContentHidden = $false
    ExpectContentVisible = $true
    ContentSelector = ".asset-inbox-console"
    ExpectNoticeSelector = ""
  },
  @{
    Name = "approvals-photographer-forbidden"
    Hash = "#approvals?authState=signed-in&authRole=photographer"
    ExpectedEncoded = @(
      "%E6%97%A0%E6%9D%83%E8%AE%BF%E9%97%AE%E8%AF%A5%E9%A1%B5%E9%9D%A2",
      "%E6%89%80%E9%9C%80%E8%A7%92%E8%89%B2",
      "%E5%BD%93%E5%89%8D%E8%A7%92%E8%89%B2",
      "%E6%91%84%E5%BD%B1%E5%B8%88"
    )
    ExpectedChipEncoded = @(
      "%E8%AE%A4%E8%AF%81%E6%BA%90",
      "%E4%BC%9A%E8%AF%9D",
      "%E8%A7%92%E8%89%B2"
    )
    ExpectContentHidden = $true
    ContentSelector = ".cockpit-command-center"
    ExpectNoticeSelector = ".read-model-state-forbidden"
  },
  @{
    Name = "asset-inbox-retoucher-partial"
    Hash = "#asset-inbox?projectId=PRJ-128&reviewSessionId=REV-441&deliveryId=DEL-220&authState=signed-in&authRole=retoucher"
    ExpectedEncoded = @(
      "%E7%B4%A0%E6%9D%90%E6%94%B6%E4%BB%B6%E7%AE%B1",
      "%E6%AD%A4%E5%8C%BA%E5%9F%9F%E9%9C%80%E8%A6%81%E8%BF%90%E8%90%A5%E6%9D%83%E9%99%90",
      "%E5%BD%93%E5%89%8D%E8%A7%92%E8%89%B2%EF%BC%9A%E7%B2%BE%E4%BF%AE%E5%B8%88"
    )
    ExpectedChipEncoded = @(
      "%E4%BC%9A%E8%AF%9D",
      "%E8%A7%92%E8%89%B2"
    )
    ExpectContentHidden = $false
    ExpectContentVisible = $true
    ContentSelector = ".asset-inbox-console"
    ExpectNoticeSelector = ".insufficient-role-notice"
  }
)

$viewports = @(
  @{ Name = "tablet"; Width = 1024; Height = 768 },
  @{ Name = "mobile"; Width = 390; Height = 844 }
)

Write-Host "== Photo Studio OS auth state boundary QA =="
Write-Host "BaseUrl: $normalizedBaseUrl"
Write-Host "Cases: $($authCases.Count)"
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

    foreach ($case in $authCases) {
      $passed = Test-AuthCase -Case $case -Viewport $viewport
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
