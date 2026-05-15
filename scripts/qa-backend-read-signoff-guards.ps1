# Photo Studio OS Frontend backend read signoff guard QA.
# Safe local static/negative-path check only. This script verifies that the
# guarded backend signoff wrapper rejects unsafe backend URL shapes before any
# browser/backend smoke can run. It does not edit files, deploy, push, call
# backend writes, or change dependency manifests.

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
  Write-Host "package.json not found. Run this script from the frontend repo root."
  exit 1
}

$cases = @(
  @{
    Name = "production-like-host"
    Args = @("-EnvironmentName", "staging", "-BackendBaseUrl", "https://prod.example.com")
    Expected = "production-like"
  },
  @{
    Name = "credentialed-url"
    Args = @("-EnvironmentName", "staging", "-BackendBaseUrl", "https://user:example@staging.example.com")
    Expected = "must not include credentials"
  },
  @{
    Name = "local-scope-non-local-url"
    Args = @("-EnvironmentName", "local", "-BackendBaseUrl", "https://staging.example.com")
    Expected = "local only accepts localhost"
  },
  @{
    Name = "non-local-staging-http"
    Args = @("-EnvironmentName", "staging", "-BackendBaseUrl", "http://staging.example.com")
    Expected = "must use https"
  },
  @{
    Name = "query-string-url"
    Args = @("-EnvironmentName", "local", "-BackendBaseUrl", "http://127.0.0.1:8080?token=example")
    Expected = "must not include query strings or fragments"
  }
)

$failed = $false
$signoffSource = Get-Content -LiteralPath "scripts\qa-backend-read-signoff.ps1" -Raw

Write-Host "== Photo Studio OS backend read signoff guard QA =="
Write-Host "Cases: $($cases.Count)"

if ($signoffSource -notmatch "ExpectedFailureState" -or $signoffSource -notmatch "ExpectReadFailure") {
  $failed = $true
  Write-Host "[FAIL] signoff wrapper must expose expected backend failure-state smoke options"
}

foreach ($case in $cases) {
  $output = & powershell -ExecutionPolicy Bypass -File "scripts\qa-backend-read-signoff.ps1" @($case.Args) 2>&1
  $exitCode = $LASTEXITCODE
  $text = $output -join [Environment]::NewLine

  if ($exitCode -eq 1 -and $text -match [regex]::Escape($case.Expected)) {
    Write-Host "[PASS] $($case.Name)"
  } else {
    $failed = $true
    Write-Host "[FAIL] $($case.Name)"
    Write-Host "       Expected failure containing: $($case.Expected)"
    Write-Host "       Exit code: $exitCode"
    Write-Host "       Output: $text"
  }
}

if ($failed) {
  Write-Host ""
  Write-Host "Result: FAILED"
  exit 1
}

Write-Host ""
Write-Host "Result: PASSED"
exit 0
