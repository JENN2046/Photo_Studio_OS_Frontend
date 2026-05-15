# Photo Studio OS Frontend package boundary QA.
# Safe local static check only. This script verifies that the current frontend
# keeps its minimal dependency boundary and package-lock root manifest aligned.
# It does not install dependencies, edit files, deploy, push, or change
# dependency manifests.

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
  Write-Host "package.json not found. Run this script from the frontend repo root."
  exit 1
}

if (-not (Test-Path "package-lock.json")) {
  Write-Host "package-lock.json not found. Dependency boundary cannot be verified."
  exit 1
}

$failures = @()

function Add-Failure {
  param([string]$Message)
  $script:failures += $Message
}

function Get-ObjectPropertyMap {
  param([object]$Object)

  $map = [ordered]@{}
  if ($null -eq $Object) {
    return $map
  }

  foreach ($property in $Object.PSObject.Properties) {
    $map[$property.Name] = [string]$property.Value
  }

  return $map
}

function Assert-ExactMap {
  param(
    [string]$Name,
    [hashtable]$Actual,
    [hashtable]$Expected
  )

  $actualKeys = @($Actual.Keys)
  $expectedKeys = @($Expected.Keys)
  $missing = @($expectedKeys | Where-Object { $actualKeys -notcontains $_ })
  $extra = @($actualKeys | Where-Object { $expectedKeys -notcontains $_ })

  foreach ($key in $missing) {
    Add-Failure "$Name missing dependency: $key"
  }

  foreach ($key in $extra) {
    Add-Failure "$Name unexpected dependency: $key"
  }

  foreach ($key in $expectedKeys) {
    if ($Actual.Contains($key) -and $Actual[$key] -ne $Expected[$key]) {
      Add-Failure "$Name version mismatch: $key expected $($Expected[$key]) got $($Actual[$key])"
    }
  }
}

function Assert-RequiredScript {
  param(
    [object]$Scripts,
    [string]$Name,
    [string]$Command
  )

  $actual = [string]$Scripts.$Name
  if ($actual -ne $Command) {
    Add-Failure "package script mismatch: $Name expected '$Command' got '$actual'"
  }
}

$pkg = Get-Content -LiteralPath "package.json" -Raw | ConvertFrom-Json
$lockRootJson = & node -e "const fs = require('node:fs'); const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8')); const root = lock.packages && lock.packages['']; console.log(JSON.stringify({ lockfileVersion: lock.lockfileVersion, root }));"
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($lockRootJson)) {
  Write-Host "Unable to parse package-lock.json with Node."
  exit 1
}

$lockSummary = $lockRootJson | ConvertFrom-Json
$lockRoot = $lockSummary.root

$expectedDependencies = [ordered]@{
  "react" = "^19.0.0"
  "react-dom" = "^19.0.0"
}

$expectedDevDependencies = [ordered]@{
  "@types/react" = "^19.0.0"
  "@types/react-dom" = "^19.0.0"
  "@vitejs/plugin-react" = "^5.0.0"
  "typescript" = "^5.8.0"
  "vite" = "^7.0.0"
}

if ($pkg.name -ne "photo-studio-os-frontend") {
  Add-Failure "package name changed: $($pkg.name)"
}
if ($pkg.private -ne $true) {
  Add-Failure "package must remain private"
}
if ($pkg.type -ne "module") {
  Add-Failure "package type must remain module"
}
if ($lockSummary.lockfileVersion -ne 3) {
  Add-Failure "package-lock lockfileVersion expected 3 got $($lockSummary.lockfileVersion)"
}
if ($lockRoot.name -ne $pkg.name) {
  Add-Failure "package-lock root name does not match package.json"
}
if ($lockRoot.version -ne $pkg.version) {
  Add-Failure "package-lock root version does not match package.json"
}

Assert-RequiredScript -Scripts $pkg.scripts -Name "dev" -Command "vite --host 127.0.0.1 --port 5173"
Assert-RequiredScript -Scripts $pkg.scripts -Name "build" -Command "tsc --noEmit -p tsconfig.typecheck.json && vite build"
Assert-RequiredScript -Scripts $pkg.scripts -Name "lint" -Command "tsc --noEmit -p tsconfig.typecheck.json"
Assert-RequiredScript -Scripts $pkg.scripts -Name "preview" -Command "vite preview --host 127.0.0.1 --port 4173"

$packageDependencies = Get-ObjectPropertyMap $pkg.dependencies
$packageDevDependencies = Get-ObjectPropertyMap $pkg.devDependencies
$lockDependencies = Get-ObjectPropertyMap $lockRoot.dependencies
$lockDevDependencies = Get-ObjectPropertyMap $lockRoot.devDependencies

Assert-ExactMap -Name "package dependencies" -Actual $packageDependencies -Expected $expectedDependencies
Assert-ExactMap -Name "package devDependencies" -Actual $packageDevDependencies -Expected $expectedDevDependencies
Assert-ExactMap -Name "package-lock root dependencies" -Actual $lockDependencies -Expected $expectedDependencies
Assert-ExactMap -Name "package-lock root devDependencies" -Actual $lockDevDependencies -Expected $expectedDevDependencies

$forbiddenTopLevelPatterns = @(
  "tailwind",
  "mui",
  "antd",
  "chakra",
  "radix",
  "lucide",
  "framer",
  "zustand",
  "redux",
  "recharts",
  "chart",
  "d3",
  "axios"
)

foreach ($dependencyName in @($packageDependencies.Keys + $packageDevDependencies.Keys)) {
  foreach ($pattern in $forbiddenTopLevelPatterns) {
    if ($dependencyName -match [regex]::Escape($pattern)) {
      Add-Failure "unexpected top-level package for current no-library boundary: $dependencyName"
    }
  }
}

Write-Host "== Photo Studio OS package boundary QA =="
Write-Host "Dependencies: $($packageDependencies.Count)"
Write-Host "Dev dependencies: $($packageDevDependencies.Count)"

if ($failures.Count -gt 0) {
  foreach ($failure in $failures) {
    Write-Host "[FAIL] $failure"
  }

  Write-Host ""
  Write-Host "Result: FAILED"
  exit 1
}

Write-Host "Minimal dependency boundary is intact."
Write-Host ""
Write-Host "Result: PASSED"
exit 0
