# Photo Studio OS Frontend auth role matrix QA.
# Safe local static check only. This script verifies that the frontend role
# matrix, session states, and auth rehearsal hook stay complete and mock-first.
# It does not edit files, deploy, push, call backend writes, or change
# dependency manifests.

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
  Write-Host "package.json not found. Run this script from the frontend repo root."
  exit 1
}

$authTypesPath = "src\features\auth\authTypes.ts"
$authHookPath = "src\features\auth\useAuthState.ts"

if (-not (Test-Path $authTypesPath)) {
  Write-Host "Auth types file not found: $authTypesPath"
  exit 1
}

if (-not (Test-Path $authHookPath)) {
  Write-Host "Auth hook file not found: $authHookPath"
  exit 1
}

$authTypes = Get-Content -Path $authTypesPath -Raw
$authHook = Get-Content -Path $authHookPath -Raw
$failures = @()

function Add-Failure {
  param([string]$Message)
  $script:failures += $Message
}

function Get-UnionLiterals {
  param(
    [string]$Source,
    [string]$TypeName
  )

  $match = [regex]::Match(
    $Source,
    "export\s+type\s+$([regex]::Escape($TypeName))\s*=\s*(?<body>.*?);",
    [System.Text.RegularExpressions.RegexOptions]::Singleline
  )

  if (-not $match.Success) {
    Add-Failure "Union type not found: $TypeName"
    return @()
  }

  return @(
    [regex]::Matches($match.Groups["body"].Value, '"([^"]+)"') |
      ForEach-Object { $_.Groups[1].Value }
  )
}

function Assert-ExactSet {
  param(
    [string]$Name,
    [string[]]$Actual,
    [string[]]$Expected
  )

  $missing = @($Expected | Where-Object { $Actual -notcontains $_ })
  $extra = @($Actual | Where-Object { $Expected -notcontains $_ })

  if ($missing.Count -gt 0) {
    Add-Failure "$Name missing: $($missing -join ', ')"
  }

  if ($extra.Count -gt 0) {
    Add-Failure "$Name unexpected: $($extra -join ', ')"
  }
}

function Get-RouteMatrixBlock {
  param(
    [string]$Source,
    [string]$Route
  )

  $keyPattern = if ($Route -match "-") {
    '"' + [regex]::Escape($Route) + '"'
  } else {
    "\b$([regex]::Escape($Route))\b"
  }

  $match = [regex]::Match(
    $Source,
    "(?ms)^\s*$keyPattern\s*:\s*\{\r?\n(?<body>.*?)\r?\n\s*\}",
    [System.Text.RegularExpressions.RegexOptions]::Multiline
  )

  if (-not $match.Success) {
    Add-Failure "pageRoleMatrix route missing: $Route"
    return ""
  }

  return $match.Groups["body"].Value
}

$expectedRoles = @(
  "admin",
  "operator",
  "photographer",
  "retoucher",
  "qc_reviewer",
  "client",
  "delivery_approver"
)

$expectedRoutes = @(
  "command-center",
  "risk",
  "projects",
  "approvals",
  "activity",
  "inspections",
  "asset-inbox",
  "qc-retouch",
  "review-gallery",
  "delivery-readiness"
)

$expectedSessionStates = @(
  "no-auth",
  "loading",
  "signed-in",
  "expired",
  "error",
  "forbidden",
  "insufficient-role"
)

$expectedAccessLabels = @{
  full = "完全"
  read = "只读"
  "summary-only" = "摘要"
  none = "无权"
}

$expectedMatrix = [ordered]@{
  "command-center" = @{ admin = "FULL"; operator = "FULL"; photographer = "SUMMARY"; retoucher = "SUMMARY"; qc_reviewer = "SUMMARY"; client = "NONE"; delivery_approver = "SUMMARY" }
  risk = @{ admin = "FULL"; operator = "FULL"; photographer = "READ"; retoucher = "READ"; qc_reviewer = "READ"; client = "NONE"; delivery_approver = "READ" }
  projects = @{ admin = "FULL"; operator = "FULL"; photographer = "READ"; retoucher = "READ"; qc_reviewer = "READ"; client = "NONE"; delivery_approver = "READ" }
  approvals = @{ admin = "FULL"; operator = "FULL"; photographer = "NONE"; retoucher = "NONE"; qc_reviewer = "NONE"; client = "NONE"; delivery_approver = "READ" }
  activity = @{ admin = "FULL"; operator = "FULL"; photographer = "READ"; retoucher = "READ"; qc_reviewer = "READ"; client = "NONE"; delivery_approver = "READ" }
  inspections = @{ admin = "FULL"; operator = "FULL"; photographer = "NONE"; retoucher = "NONE"; qc_reviewer = "READ"; client = "NONE"; delivery_approver = "NONE" }
  "asset-inbox" = @{ admin = "FULL"; operator = "FULL"; photographer = "FULL"; retoucher = "READ"; qc_reviewer = "READ"; client = "NONE"; delivery_approver = "NONE" }
  "qc-retouch" = @{ admin = "FULL"; operator = "FULL"; photographer = "READ"; retoucher = "FULL"; qc_reviewer = "FULL"; client = "NONE"; delivery_approver = "NONE" }
  "review-gallery" = @{ admin = "FULL"; operator = "FULL"; photographer = "NONE"; retoucher = "READ"; qc_reviewer = "READ"; client = "FULL"; delivery_approver = "READ" }
  "delivery-readiness" = @{ admin = "FULL"; operator = "FULL"; photographer = "NONE"; retoucher = "NONE"; qc_reviewer = "NONE"; client = "NONE"; delivery_approver = "FULL" }
}

Write-Host "== Photo Studio OS auth role matrix QA =="

Assert-ExactSet "Role union" (Get-UnionLiterals -Source $authTypes -TypeName "Role") $expectedRoles
Assert-ExactSet "AppRoute union" (Get-UnionLiterals -Source $authTypes -TypeName "AppRoute") $expectedRoutes
Assert-ExactSet "SessionState union" (Get-UnionLiterals -Source $authTypes -TypeName "SessionState") $expectedSessionStates

foreach ($entry in $expectedAccessLabels.GetEnumerator()) {
  $labelPattern = if ($entry.Key -match "-") {
    '"' + [regex]::Escape($entry.Key) + '"\s*:\s*"' + [regex]::Escape($entry.Value) + '"'
  } else {
    "\b$([regex]::Escape($entry.Key))\s*:\s*""$([regex]::Escape($entry.Value))"""
  }

  if (-not [regex]::IsMatch($authTypes, $labelPattern)) {
    Add-Failure "Access label missing: $($entry.Key) -> $($entry.Value)"
  }
}

foreach ($route in $expectedRoutes) {
  $routeBlock = Get-RouteMatrixBlock -Source $authTypes -Route $route
  if ([string]::IsNullOrWhiteSpace($routeBlock)) {
    continue
  }

  foreach ($role in $expectedRoles) {
    $expectedAccess = $expectedMatrix[$route][$role]
    $rolePattern = "(?m)^\s*$([regex]::Escape($role))\s*:\s*$expectedAccess\s*,?\s*$"
    if (-not [regex]::IsMatch($routeBlock, $rolePattern)) {
      Add-Failure "pageRoleMatrix mismatch: $route / $role expected $expectedAccess"
    }
  }
}

foreach ($requiredHookSignal in @("VITE_BACKEND_USER_ROLE", "authState", "authRole")) {
  if ($authHook -notmatch [regex]::Escape($requiredHookSignal)) {
    Add-Failure "Auth hook missing rehearsal signal: $requiredHookSignal"
  }
}

if ($authHook -match "(?i)\b(localStorage|sessionStorage|Authorization|Bearer)\b") {
  Add-Failure "Auth hook must not use browser storage or token-bearing auth headers."
}

if ($authTypes -match "(?i)\b(localStorage|sessionStorage|Authorization|Bearer)\b") {
  Add-Failure "Auth types must not introduce browser storage or token-bearing auth headers."
}

if ($failures.Count -gt 0) {
  foreach ($failure in $failures) {
    Write-Host "[FAIL] $failure"
  }

  Write-Host ""
  Write-Host "Result: FAILED"
  exit 1
}

Write-Host "Roles: $($expectedRoles.Count)"
Write-Host "Routes: $($expectedRoutes.Count)"
Write-Host "Matrix cells: $($expectedRoles.Count * $expectedRoutes.Count)"
Write-Host "Session states: $($expectedSessionStates.Count)"
Write-Host "No token storage/header signals found in auth source."
Write-Host ""
Write-Host "Result: PASSED"
exit 0
