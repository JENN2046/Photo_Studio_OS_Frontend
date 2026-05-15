# Photo Studio OS Frontend backend read-model smoke QA with a local mock backend.
# Safe local QA only. This script starts a temporary localhost GET/OPTIONS JSON
# server, then runs scripts\qa-backend-read-smoke.ps1 against it.
# It does not edit .env files, deploy, push, call backend writes, or change
# dependency manifests.

param(
  [int]$BackendPort = 5181,
  [string]$FrontendBaseUrl = "http://127.0.0.1:5173",
  [string]$SessionName = "photo-studio-backend-read-smoke-mock",
  [ValidateSet("ready", "forbidden", "invalid-id")]
  [string]$ResponseMode = "ready",
  [switch]$KeepBrowser
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
  Write-Host "package.json not found. Run this script from the frontend repo root."
  exit 1
}

$backendBaseUrl = "http://127.0.0.1:$BackendPort"
$playwrightDir = Join-Path (Get-Location) ".playwright-cli"
$mockBackendScript = Join-Path $playwrightDir "qa-backend-read-smoke-mock-server.cjs"
$mockBackendOut = Join-Path $playwrightDir "qa-backend-read-smoke-mock-server.out.log"
$mockBackendErr = Join-Path $playwrightDir "qa-backend-read-smoke-mock-server.err.log"
$mockBackendProcess = $null

function Test-Reachable {
  param([string]$Url)

  try {
    $statusCode = (Invoke-WebRequest -UseBasicParsing $Url -TimeoutSec 2).StatusCode
    return $statusCode -eq 200
  } catch {
    return $false
  }
}

function Wait-ForBackend {
  param([string]$Url)

  $deadline = (Get-Date).AddSeconds(20)
  while ((Get-Date) -lt $deadline) {
    if (Test-Reachable $Url) {
      return $true
    }

    Start-Sleep -Milliseconds 400
  }

  return $false
}

if (Test-Reachable "$FrontendBaseUrl/") {
  Write-Host "Local frontend server is already reachable at $FrontendBaseUrl."
  Write-Host "Stop it before running this mock backend smoke so the child Vite process can set VITE_BACKEND_API_BASE_URL safely."
  exit 1
}

if (Test-Reachable "$backendBaseUrl/health") {
  Write-Host "Mock backend port is already in use: $backendBaseUrl"
  exit 1
}

if (-not (Test-Path $playwrightDir)) {
  New-Item -ItemType Directory -Path $playwrightDir | Out-Null
}

$mockServerCode = @"
const http = require('node:http');

const port = Number(process.env.BACKEND_READ_SMOKE_PORT || '$BackendPort');
const responseMode = '$ResponseMode';

const sku = {
  id: 'SKU-AUR-001',
  code: 'AUR-CHAIR-0012',
  name: 'Aurora Chair'
};

const shot = {
  id: 'SHOT-AUR-HERO',
  shotTypeCode: 'Hero',
  status: 'ready'
};

const dataByPath = new Map([
  ['/health', { ok: true }],
  ['/command-center/v2', {
    data: {
      generatedAt: '2026-05-15T10:00:00+08:00',
      studio: {
        organizationId: 'ORG-SMOKE',
        name: 'Backend Smoke Studio',
        timezone: 'Asia/Shanghai',
        mode: 'read_only'
      },
      coverage: {
        skuCoveragePercent: 93,
        completedSkus: 28,
        totalSkus: 30,
        missingShotCount: 2
      },
      qc: {
        qcHealthPercent: 96,
        passed: 142,
        warning: 2,
        failed: 1,
        pendingAssets: 4
      },
      workflowStages: [
        { id: 'stage-asset-intake', labelKey: 'stage.asset_intake', status: 'active', count: 6, riskLevel: 'medium' },
        { id: 'stage-qc', labelKey: 'stage.qc', status: 'watch', count: 3, riskLevel: 'medium' },
        { id: 'stage-review', labelKey: 'stage.review', status: 'stable', count: 1, riskLevel: 'low' },
        { id: 'stage-delivery', labelKey: 'stage.delivery', status: 'stable', count: 1, riskLevel: 'low' }
      ],
      riskPulse: [
        {
          id: 'risk-focus',
          type: 'qc',
          severity: 'medium',
          titleKey: 'risk.focus',
          count: 1,
          consequence: 'Focus review pending',
          href: 'AST-9012'
        }
      ],
      approvalQueue: [
        {
          id: 'APR-001',
          kind: 'qc_pending',
          titleKey: 'approval.qc',
          subtitle: 'QC review awaits operator confirmation',
          priority: 'medium',
          href: 'PRJ-128',
          readOnly: true
        }
      ],
      activityTimeline: [
        {
          id: 'ACT-001',
          at: '2026-05-15T09:42:00+08:00',
          actorName: 'Smoke Backend',
          action: 'read',
          entityType: 'asset',
          entityId: 'AST-9012',
          summary: 'Local mock backend returned a read-only snapshot'
        }
      ],
      previews: {
        projects: [{ id: 'PRJ-128', name: 'Aurora Product Shoot', status: 'shoot' }],
        skus: [{ id: sku.id, code: sku.code, name: sku.name, status: 'review_pending' }],
        assets: [{ id: 'AST-9012', originalFilename: 'AUR-CHAIR-0012_0342.CR3', thumbnailKey: 'mock/aur-chair-hero-thumb', status: 'qc_passed' }],
        reviews: [{ id: 'REV-441', title: 'Aurora Client Review', status: 'published', pendingCount: 1 }],
        deliveries: [{ id: 'DEL-220', status: 'preparing', itemCount: 1 }]
      }
    }
  }],
  ['/projects/PRJ-128/asset-inbox', {
    data: {
      projectId: 'PRJ-128',
      page: 1,
      limit: 24,
      total: 1,
      intake: {
        source: 'capture_one_placeholder',
        status: 'ready',
        message: 'capture_one_export'
      },
      selectedAssetId: 'AST-9012',
      items: [{
        assetId: 'AST-9012',
        projectId: 'PRJ-128',
        status: 'matched',
        sku,
        shotRequirement: shot,
        file: {
          originalFilename: 'AUR-CHAIR-0012_0342.CR3',
          fileExt: 'CR3',
          mimeType: 'image/x-canon-cr3',
          fileSizeBytes: '48234496',
          width: 6720,
          height: 4480,
          colorSpace: 'Adobe RGB'
        },
        keys: {
          thumbnailKey: 'mock/aur-chair-hero-thumb',
          previewKey: 'mock/aur-chair-hero-preview'
        },
        binding: {
          status: 'bound',
          matchStatus: 'matched',
          confidence: 0.97,
          reason: 'sku_and_shot_matched'
        },
        latestQc: {
          status: 'warning',
          failedReasons: ['focus_left_edge'],
          notes: 'Local smoke: left edge focus needs manual review.'
        }
      }]
    }
  }],
  ['/projects/PRJ-128/qc-retouch-queue', {
    data: {
      projectId: 'PRJ-128',
      page: 1,
      limit: 24,
      total: 1,
      items: [{
        assetId: 'AST-9012',
        assetVersionId: 'AST-9012-V2',
        previewKey: 'mock/aur-chair-hero-preview',
        sku,
        shotRequirement: shot,
        qc: {
          latestStatus: 'warning',
          failedReasons: ['focus_left_edge'],
          technicalResults: { focus: 'warning', exposure: 'passed', crop: 'passed' },
          manualResults: { producer: 'needs_review', retouchLead: 'assigned' },
          nextAction: 'send_back_to_retouch'
        },
        retouch: {
          taskId: 'RET-4401',
          status: 'in_progress',
          assignedTo: 'Retouch Team A',
          instructions: 'Local smoke: reduce left highlight and check edge focus.',
          complexity: 'normal',
          dueAt: '2026-05-15T18:00:00+08:00',
          revisionCount: 1
        }
      }]
    }
  }],
  ['/review-sessions/REV-441/gallery', {
    data: {
      reviewSessionId: 'REV-441',
      title: 'Aurora Client Review',
      status: 'published',
      expiresAt: '2026-05-20T18:00:00+08:00',
      items: [{
        reviewItemId: 'RVI-9012',
        assetId: 'AST-9012',
        previewKey: 'mock/aur-chair-hero-preview',
        sku,
        shotRequirement: shot,
        status: 'pending',
        clientComment: 'Local smoke: waiting for client confirmation.',
        issueType: 'awaiting_client_decision'
      }],
      summary: {
        pending: 1,
        approved: 0,
        revisionRequested: 0,
        withdrawn: 0
      },
      publicAccess: {
        enabled: false,
        reason: 'storage_auth_and_public_review_not_approved'
      }
    }
  }],
  ['/deliveries/DEL-220/readiness', {
    data: {
      deliveryId: 'DEL-220',
      status: 'preparing',
      packageKey: 'mock/delivery/aurora-package.zip',
      manifestKey: 'mock/delivery/aurora-manifest.json',
      expiresAt: '2026-05-20T18:00:00+08:00',
      itemCount: 1,
      checklist: {
        hasItems: true,
        hasPackageKey: true,
        hasManifestKey: true,
        allItemsHaveFileKey: false
      },
      blockers: [{
        code: 'missing_approved_qc',
        message: 'missing_approved_qc'
      }],
      externalAccess: {
        enabled: false,
        reason: 'storage_auth_and_public_delivery_not_approved'
      }
    }
  }]
]);

function writeJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,HEAD,OPTIONS',
    'access-control-allow-headers': 'x-user-role,x-user-name,content-type',
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  if (response.req.method !== 'HEAD') {
    response.end(JSON.stringify(body));
  } else {
    response.end();
  }
}

const server = http.createServer((request, response) => {
  response.req = request;

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,HEAD,OPTIONS',
      'access-control-allow-headers': 'x-user-role,x-user-name,content-type',
      'cache-control': 'no-store'
    });
    response.end();
    return;
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    writeJson(response, 405, { error: 'read_only_mock_backend' });
    return;
  }

  const url = new URL(request.url, 'http://' + request.headers.host);

  if (url.pathname !== '/health') {
    if (responseMode === 'forbidden') {
      writeJson(response, 403, { error: 'forbidden_read_model' });
      return;
    }

    if (responseMode === 'invalid-id') {
      writeJson(response, 404, { error: 'read_model_not_found' });
      return;
    }
  }

  const body = dataByPath.get(url.pathname);

  if (!body) {
    writeJson(response, 404, { error: 'not_found' });
    return;
  }

  writeJson(response, 200, body);
});

server.listen(port, '127.0.0.1', () => {
  console.log('backend read smoke mock server listening on http://127.0.0.1:' + port);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
"@

Set-Content -LiteralPath $mockBackendScript -Value $mockServerCode -Encoding UTF8

Write-Host "== Photo Studio OS backend read-model smoke with local mock backend =="
Write-Host "BackendBaseUrl: $backendBaseUrl"
Write-Host "ResponseMode: $ResponseMode"

try {
  $mockBackendProcess = Start-Process `
    -FilePath "node" `
    -ArgumentList @($mockBackendScript) `
    -WorkingDirectory (Get-Location) `
    -WindowStyle Hidden `
    -RedirectStandardOutput $mockBackendOut `
    -RedirectStandardError $mockBackendErr `
    -PassThru

  if (-not (Wait-ForBackend "$backendBaseUrl/health")) {
    throw "Mock backend did not become reachable at $backendBaseUrl."
  }

  $arguments = @(
    "-ExecutionPolicy", "Bypass",
    "-File", "scripts\qa-backend-read-smoke.ps1",
    "-BackendBaseUrl", $backendBaseUrl,
    "-FrontendBaseUrl", $FrontendBaseUrl,
    "-SessionName", $SessionName
  )

  if ($KeepBrowser) {
    $arguments += "-KeepBrowser"
  }

  if ($ResponseMode -ne "ready") {
    $arguments += "-ExpectReadFailure"
    $arguments += "-ExpectedFailureState"
    $arguments += $ResponseMode
  }

  powershell @arguments
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  Write-Host ""
  Write-Host "Result: PASSED"
  exit 0
} finally {
  if ($mockBackendProcess -and -not $mockBackendProcess.HasExited) {
    try {
      Stop-Process -Id $mockBackendProcess.Id -ErrorAction Stop
    } catch {
      Write-Host "Warning: could not stop mock backend process $($mockBackendProcess.Id)"
    }
  }
}
