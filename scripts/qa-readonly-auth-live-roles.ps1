# Photo Studio OS Frontend live env role QA matrix.
# Safe local QA only. This script starts temporary local Vite servers with
# VITE_BACKEND_USER_ROLE in each child process environment only.
# It does not edit .env files, deploy, push, call backend writes, or change
# dependency manifests.

param(
  [string]$BaseUrl = "http://127.0.0.1:5173",
  [string]$SessionNamePrefix = "photo-studio-auth-live-role",
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

function ConvertTo-SingleQuotedPowerShellLiteral {
  param([string]$Value)
  return "'$($Value.Replace("'", "''"))'"
}

function Invoke-PlaywrightCli {
  param(
    [string]$SessionName,
    [string[]]$Arguments
  )

  & $npx --yes --package $playwrightPackage playwright-cli "-s=$SessionName" @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "playwright-cli failed: $($Arguments -join ' ')"
  }
}

function Invoke-PlaywrightRaw {
  param(
    [string]$SessionName,
    [string[]]$Arguments
  )

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

function Start-RoleFrontend {
  param([string]$Role)

  $playwrightDir = Join-Path (Get-Location) ".playwright-cli"
  if (-not (Test-Path $playwrightDir)) {
    New-Item -ItemType Directory -Path $playwrightDir | Out-Null
  }

  $safeRole = $Role.Replace("_", "-")
  $serverScript = Join-Path $playwrightDir "qa-readonly-auth-live-role-$safeRole-server.ps1"
  $serverOut = Join-Path $playwrightDir "qa-readonly-auth-live-role-$safeRole-server.out.log"
  $serverErr = Join-Path $playwrightDir "qa-readonly-auth-live-role-$safeRole-server.err.log"
  $script = @(
    "`$env:VITE_BACKEND_USER_ROLE = $(ConvertTo-SingleQuotedPowerShellLiteral $Role)",
    "`$env:VITE_BACKEND_USER_NAME = 'Readonly Role QA'",
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

function Stop-RoleFrontend {
  param(
    [object]$ServerProcess,
    [int]$ListenerPid
  )

  if ($ListenerPid) {
    try {
      Stop-Process -Id $ListenerPid -ErrorAction Stop
    } catch {
      Write-Host "Warning: could not stop frontend listener process $ListenerPid"
    }
  }

  if ($ServerProcess -and -not $ServerProcess.HasExited) {
    try {
      Stop-Process -Id $ServerProcess.Id -ErrorAction Stop
    } catch {
      Write-Host "Warning: could not stop frontend server wrapper process $($ServerProcess.Id)"
    }
  }

  for ($i = 0; $i -lt 20; $i++) {
    if (-not (Test-Reachable "$normalizedBaseUrl/")) {
      return
    }

    Start-Sleep -Milliseconds 300
  }
}

function Test-LiveRoleCase {
  param(
    [string]$SessionName,
    [hashtable]$Case,
    [hashtable]$Viewport
  )

  $payload = @{
    name = $Case.Name
    url = New-RouteUrl $Case.Hash
    expectedEncoded = $Case.ExpectedEncoded
    expectChipEncoded = $Case.ExpectedChipEncoded
    expectContentHidden = [bool]$Case.ExpectContentHidden
    expectContentVisible = [bool]$Case.ExpectContentVisible
    contentSelector = $Case.ContentSelector
    expectNoticeSelector = $Case.ExpectNoticeSelector
  } | ConvertTo-Json -Compress -Depth 6

  $code = @"
async (page) => {
  const testCase = $payload;
  const expectedEncoded = Array.isArray(testCase.expectedEncoded) ? testCase.expectedEncoded : [testCase.expectedEncoded].filter(Boolean);
  const chipEncoded = Array.isArray(testCase.expectChipEncoded) ? testCase.expectChipEncoded : [testCase.expectChipEncoded].filter(Boolean);
  page.removeAllListeners('console');
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  await page.goto(testCase.url);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(50);
  await page.waitForSelector('.read-model-page, .cockpit-command-center', { timeout: 2500 }).catch(() => undefined);
  if (testCase.expectNoticeSelector) {
    await page.waitForSelector(testCase.expectNoticeSelector, { timeout: 2500 }).catch(() => undefined);
  } else if (testCase.contentSelector) {
    await page.waitForSelector(testCase.contentSelector, { timeout: 2500 }).catch(() => undefined);
  }
  const result = await page.evaluate(({ testCase, expectedEncoded, chipEncoded }) => {
    const text = document.body.innerText;
    const root = document.documentElement;
    const expected = expectedEncoded.map((item) => decodeURIComponent(item));
    const chipExpected = chipEncoded.map((item) => decodeURIComponent(item));
    const missing = expected.filter((item) => !text.includes(item));
    const missingChips = chipExpected.filter((item) => !text.includes(item));
    const noticeSelectorCount = testCase.expectNoticeSelector ? document.querySelectorAll(testCase.expectNoticeSelector).length : null;
    const contentCount = testCase.contentSelector ? document.querySelectorAll(testCase.contentSelector).length : null;
    const contentHidden = testCase.expectContentHidden && testCase.contentSelector ? contentCount === 0 : null;
    const contentVisible = testCase.expectContentVisible && testCase.contentSelector ? contentCount > 0 : null;
    const overflow = root.scrollWidth > root.clientWidth + 1;
    const storageKeys = [];
    try {
      storageKeys.push(...Object.keys(window.localStorage));
      storageKeys.push(...Object.keys(window.sessionStorage));
    } catch {
      storageKeys.push('__storage_unavailable__');
    }
    const suspiciousStorageKeyCount = storageKeys.filter((key) => /auth|token|session|jwt|secret|password/i.test(key)).length;
    return {
      name: testCase.name,
      url: location.href,
      missing,
      missingChips,
      noticeSelectorCount,
      contentCount,
      contentHidden,
      contentVisible,
      overflow,
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
      suspiciousStorageKeyCount
    };
  }, { testCase, expectedEncoded, chipEncoded });
  return Object.assign({}, result, {
    viewport: '$($Viewport.Name)',
    width: $($Viewport.Width),
    height: $($Viewport.Height),
    consoleErrorCount: consoleErrors.length,
    consoleErrors
  });
}
"@

  $playwrightDir = Join-Path (Get-Location) ".playwright-cli"
  if (-not (Test-Path $playwrightDir)) {
    New-Item -ItemType Directory -Path $playwrightDir | Out-Null
  }

  $codePath = Join-Path $playwrightDir "qa-readonly-auth-live-role-check.js"
  Set-Content -LiteralPath $codePath -Value $code -Encoding UTF8
  $raw = Invoke-PlaywrightRaw -SessionName $SessionName -Arguments @("run-code", "--filename", $codePath, "--raw")

  try {
    $result = $raw | ConvertFrom-Json
  } catch {
    throw "Could not parse live role QA result for $($Case.Name): $raw"
  }

  $problems = @()
  if (@($result.missing).Count -gt 0) {
    $problems += "missing copy: $(@($result.missing) -join ', ')"
  }
  if (@($result.missingChips).Count -gt 0) {
    $problems += "missing auth chips: $(@($result.missingChips) -join ', ')"
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
  if ($result.suspiciousStorageKeyCount -gt 0) {
    $problems += "auth/session storage keys observed: $($result.suspiciousStorageKeyCount)"
  }

  if ($problems.Count -gt 0) {
    Write-Host "[FAIL] $($Viewport.Name) / $($Case.Name): $($problems -join '; ')"
    return $false
  }

  Write-Host "[PASS] $($Viewport.Name) / $($Case.Name)"
  return $true
}

if (Test-Reachable "$normalizedBaseUrl/") {
  Write-Host "Local frontend server is already reachable at $normalizedBaseUrl."
  Write-Host "Stop it before running live role QA so each child Vite process can set VITE_BACKEND_USER_ROLE safely."
  exit 1
}

$roleSuites = @(
  @{
    Role = "operator"
    Cases = @(
      @{
        Name = "operator-asset-inbox-full"
        Hash = $ReadOnlyRouteHashes.AssetInbox
        ExpectedEncoded = @("%E7%B4%A0%E6%9D%90%E6%94%B6%E4%BB%B6%E7%AE%B1")
        ExpectedChipEncoded = @("%E7%8E%AF%E5%A2%83%E8%A7%92%E8%89%B2%E8%AE%A4%E8%AF%81", "%E8%BF%90%E8%90%A5", "%E8%AE%BF%E9%97%AE%E6%9D%83%E9%99%90", "%E5%AE%8C%E5%85%A8")
        ExpectContentHidden = $false
        ExpectContentVisible = $true
        ContentSelector = ".asset-inbox-console"
        ExpectNoticeSelector = ""
      }
    )
  },
  @{
    Role = "photographer"
    Cases = @(
      @{
        Name = "photographer-command-center-summary"
        Hash = $ReadOnlyRouteHashes.CommandCenter
        ExpectedEncoded = @("%E6%AD%A4%E5%8C%BA%E5%9F%9F%E9%9C%80%E8%A6%81%E8%BF%90%E8%90%A5%E6%9D%83%E9%99%90")
        ExpectedChipEncoded = @("%E7%8E%AF%E5%A2%83%E8%A7%92%E8%89%B2%E8%AE%A4%E8%AF%81", "%E6%91%84%E5%BD%B1%E5%B8%88", "%E8%AE%BF%E9%97%AE%E6%9D%83%E9%99%90", "%E6%91%98%E8%A6%81")
        ExpectContentHidden = $false
        ExpectContentVisible = $true
        ContentSelector = ".cockpit-command-center"
        ExpectNoticeSelector = ".insufficient-role-notice"
      }
    )
  },
  @{
    Role = "retoucher"
    Cases = @(
      @{
        Name = "retoucher-asset-inbox-read"
        Hash = $ReadOnlyRouteHashes.AssetInbox
        ExpectedEncoded = @("%E6%AD%A4%E5%8C%BA%E5%9F%9F%E9%9C%80%E8%A6%81%E8%BF%90%E8%90%A5%E6%9D%83%E9%99%90")
        ExpectedChipEncoded = @("%E7%8E%AF%E5%A2%83%E8%A7%92%E8%89%B2%E8%AE%A4%E8%AF%81", "%E7%B2%BE%E4%BF%AE%E5%B8%88", "%E8%AE%BF%E9%97%AE%E6%9D%83%E9%99%90", "%E5%8F%AA%E8%AF%BB")
        ExpectContentHidden = $false
        ExpectContentVisible = $true
        ContentSelector = ".asset-inbox-console"
        ExpectNoticeSelector = ".insufficient-role-notice"
      }
    )
  },
  @{
    Role = "delivery_approver"
    Cases = @(
      @{
        Name = "delivery-approver-delivery-full"
        Hash = $ReadOnlyRouteHashes.DeliveryReadiness
        ExpectedEncoded = @("%E4%BA%A4%E4%BB%98%E5%B0%B1%E7%BB%AA")
        ExpectedChipEncoded = @("%E7%8E%AF%E5%A2%83%E8%A7%92%E8%89%B2%E8%AE%A4%E8%AF%81", "%E4%BA%A4%E4%BB%98%E5%AE%A1%E6%89%B9", "%E8%AE%BF%E9%97%AE%E6%9D%83%E9%99%90", "%E5%AE%8C%E5%85%A8")
        ExpectContentHidden = $false
        ExpectContentVisible = $true
        ContentSelector = ".delivery-readiness-console"
        ExpectNoticeSelector = ""
      }
    )
  },
  @{
    Role = "client"
    Cases = @(
      @{
        Name = "client-delivery-forbidden"
        Hash = $ReadOnlyRouteHashes.DeliveryReadiness
        ExpectedEncoded = @("%E6%97%A0%E6%9D%83%E8%AE%BF%E9%97%AE%E8%AF%A5%E9%A1%B5%E9%9D%A2")
        ExpectedChipEncoded = @("%E7%8E%AF%E5%A2%83%E8%A7%92%E8%89%B2%E8%AE%A4%E8%AF%81", "%E5%AE%A2%E6%88%B7", "%E8%AE%BF%E9%97%AE%E6%9D%83%E9%99%90", "%E6%97%A0%E6%9D%83")
        ExpectContentHidden = $true
        ExpectContentVisible = $false
        ContentSelector = ".delivery-readiness-console"
        ExpectNoticeSelector = ".read-model-state-forbidden"
      }
    )
  }
)

$viewports = @(
  @{ Name = "tablet"; Width = 1024; Height = 768 },
  @{ Name = "mobile"; Width = 390; Height = 844 }
)

Write-Host "== Photo Studio OS live env role QA =="
Write-Host "BaseUrl: $normalizedBaseUrl"
Write-Host "Roles: $($roleSuites.Count)"
Write-Host "Viewports: $($viewports.Count)"

$allPassed = $true
$frontendPort = Get-FrontendPort

foreach ($suite in $roleSuites) {
  $role = $suite.Role
  $sessionName = "$SessionNamePrefix-$($role.Replace('_', '-'))"
  $serverProcess = $null
  $listenerPid = $null

  Write-Host ""
  Write-Host "== Role: $role =="

  try {
    $serverProcess = Start-RoleFrontend -Role $role
    if (-not (Wait-ForFrontend)) {
      Write-Host "[FAIL] frontend did not become ready for role $role"
      $allPassed = $false
      continue
    }

    $listenerPid = Get-FrontendListenerPid -Port $frontendPort
    Invoke-PlaywrightCli -SessionName $sessionName -Arguments @("open", (New-RouteUrl "#"))

    foreach ($viewport in $viewports) {
      Write-Host ""
      Write-Host "== Viewport: $($viewport.Name) $($viewport.Width)x$($viewport.Height) =="
      Invoke-PlaywrightCli -SessionName $sessionName -Arguments @("resize", [string]$viewport.Width, [string]$viewport.Height)

      foreach ($case in $suite.Cases) {
        $passed = Test-LiveRoleCase -SessionName $sessionName -Case $case -Viewport $viewport
        if (-not $passed) {
          $allPassed = $false
        }
      }
    }
  } finally {
    if (-not $KeepBrowser) {
      try {
        Invoke-PlaywrightCli -SessionName $sessionName -Arguments @("close")
      } catch {
        Write-Host "Warning: could not close Playwright QA session $sessionName"
      }
    }

    Stop-RoleFrontend -ServerProcess $serverProcess -ListenerPid $listenerPid
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
