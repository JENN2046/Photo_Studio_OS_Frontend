# Photo Studio OS Frontend backend read contract-map QA.
# Safe local static check only. This script verifies that the five frontend
# backend read-model fetchers, smoke routes, mock backend fixtures, and docs keep
# the same read-only contract map. It does not edit files, deploy, push, call
# backend writes, or change dependency manifests.

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
  Write-Host "package.json not found. Run this script from the frontend repo root."
  exit 1
}

$failures = @()

function Add-Failure {
  param([string]$Message)
  $script:failures += $Message
}

function Assert-RequiredFile {
  param(
    [string]$Path,
    [string]$Label
  )

  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    Add-Failure "$Label missing: $Path"
  }
}

function Assert-ContainsLiteral {
  param(
    [string]$Content,
    [string]$Needle,
    [string]$Label
  )

  if (-not $Content.Contains($Needle)) {
    Add-Failure $Label
  }
}

$fetcherPath = "src\api\backendReadModels.ts"
$smokePath = "scripts\qa-backend-read-smoke.ps1"
$mockPath = "scripts\qa-backend-read-smoke-mock.ps1"
$smokePlanPath = "docs\design\FRONTEND_V2_BACKEND_READ_SMOKE_PLAN.md"
$readinessPath = "docs\design\FRONTEND_V2_INTERNAL_PILOT_READINESS.md"

$requiredFiles = @(
  @{ Path = $fetcherPath; Label = "Backend read-model fetchers" },
  @{ Path = $smokePath; Label = "Backend read smoke QA" },
  @{ Path = $mockPath; Label = "Backend read mock smoke QA" },
  @{ Path = $smokePlanPath; Label = "Backend read smoke plan" },
  @{ Path = $readinessPath; Label = "Internal pilot readiness" }
)

foreach ($file in $requiredFiles) {
  Assert-RequiredFile -Path $file.Path -Label $file.Label
}

$fetcherSource = if (Test-Path -LiteralPath $fetcherPath -PathType Leaf) {
  Get-Content -LiteralPath $fetcherPath -Raw
} else {
  ""
}
$smokeSource = if (Test-Path -LiteralPath $smokePath -PathType Leaf) {
  Get-Content -LiteralPath $smokePath -Raw
} else {
  ""
}
$mockSource = if (Test-Path -LiteralPath $mockPath -PathType Leaf) {
  Get-Content -LiteralPath $mockPath -Raw
} else {
  ""
}
$smokePlan = if (Test-Path -LiteralPath $smokePlanPath -PathType Leaf) {
  Get-Content -LiteralPath $smokePlanPath -Raw
} else {
  ""
}

$contractMap = @(
  @{
    Name = "command-center"
    Fetcher = "fetchCommandCenterV2Snapshot"
    SourcePath = '"/command-center/v2"'
    SmokePath = "/command-center/v2"
    DocPath = "/command-center/v2"
    RouteFragment = "#"
  },
  @{
    Name = "asset-inbox"
    Fetcher = "fetchAssetInboxReadModel"
    SourcePath = '`/projects/${encodeURIComponent(projectId)}/asset-inbox`'
    SmokePath = "/projects/PRJ-128/asset-inbox"
    DocPath = "/projects/:projectId/asset-inbox"
    RouteFragment = "#asset-inbox?projectId=PRJ-128"
  },
  @{
    Name = "qc-retouch"
    Fetcher = "fetchQcRetouchQueueReadModel"
    SourcePath = '`/projects/${encodeURIComponent(projectId)}/qc-retouch-queue`'
    SmokePath = "/projects/PRJ-128/qc-retouch-queue"
    DocPath = "/projects/:projectId/qc-retouch-queue"
    RouteFragment = "#qc-retouch?projectId=PRJ-128"
  },
  @{
    Name = "review-gallery"
    Fetcher = "fetchReviewGalleryReadModel"
    SourcePath = '`/review-sessions/${encodeURIComponent(reviewSessionId)}/gallery`'
    SmokePath = "/review-sessions/REV-441/gallery"
    DocPath = "/review-sessions/:reviewSessionId/gallery"
    RouteFragment = "#review-gallery?reviewSessionId=REV-441"
  },
  @{
    Name = "delivery-readiness"
    Fetcher = "fetchDeliveryReadinessReadModel"
    SourcePath = '`/deliveries/${encodeURIComponent(deliveryId)}/readiness`'
    SmokePath = "/deliveries/DEL-220/readiness"
    DocPath = "/deliveries/:deliveryId/readiness"
    RouteFragment = "#delivery-readiness?deliveryId=DEL-220"
  }
)

foreach ($contract in $contractMap) {
  Assert-ContainsLiteral -Content $fetcherSource -Needle "export async function $($contract.Fetcher)" -Label "$($contract.Name): fetcher export missing"
  Assert-ContainsLiteral -Content $fetcherSource -Needle $contract.SourcePath -Label "$($contract.Name): fetcher source path missing"
  Assert-ContainsLiteral -Content $smokeSource -Needle "name = `"$($contract.Name)`"" -Label "$($contract.Name): smoke route name missing"
  Assert-ContainsLiteral -Content $smokeSource -Needle "backendPath = `"$($contract.SmokePath)`"" -Label "$($contract.Name): smoke backend path missing"
  Assert-ContainsLiteral -Content $mockSource -Needle "['$($contract.SmokePath)'" -Label "$($contract.Name): mock backend path missing"
  Assert-ContainsLiteral -Content $smokePlan -Needle ('`' + $contract.Fetcher + '()') -Label "$($contract.Name): smoke plan fetcher missing"
  Assert-ContainsLiteral -Content $smokePlan -Needle $contract.DocPath -Label "$($contract.Name): smoke plan read path missing"
  Assert-ContainsLiteral -Content $smokePlan -Needle $contract.RouteFragment -Label "$($contract.Name): smoke plan route fragment missing"
}

if ($fetcherSource -match "(?i)\bmethod\s*:") {
  Add-Failure "backendReadModels.ts contains an explicit fetch method; read-model fetchers should rely on GET-only fetch defaults"
}

Assert-ContainsLiteral -Content $fetcherSource -Needle "createReadModelUrl(baseUrl, path, query)" -Label "fetcher source must build read-model URLs through createReadModelUrl"
Assert-ContainsLiteral -Content $fetcherSource -Needle '!("data" in envelope)' -Label "fetcher source must enforce data envelope checks"
Assert-ContainsLiteral -Content $smokeSource -Needle "backendReadRequestCount" -Label "smoke script must assert backend read requests"
Assert-ContainsLiteral -Content $smokeSource -Needle "non-read backend methods observed" -Label "smoke script must fail on backend non-read methods"
Assert-ContainsLiteral -Content $mockSource -Needle "'access-control-allow-methods': 'GET,HEAD,OPTIONS'" -Label "mock backend must advertise read-only methods"
Assert-ContainsLiteral -Content $mockSource -Needle "request.method !== 'GET' && request.method !== 'HEAD'" -Label "mock backend must reject non-read methods"

Write-Host "== Photo Studio OS backend read contract-map QA =="
Write-Host "Read surfaces: $($contractMap.Count)"

if ($failures.Count -gt 0) {
  foreach ($failure in $failures) {
    Write-Host "[FAIL] $failure"
  }

  Write-Host ""
  Write-Host "Result: FAILED"
  exit 1
}

foreach ($contract in $contractMap) {
  Write-Host "[PASS] $($contract.Name) -> $($contract.DocPath)"
}

Write-Host ""
Write-Host "Result: PASSED"
exit 0
