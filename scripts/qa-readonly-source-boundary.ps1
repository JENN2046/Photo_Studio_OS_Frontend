# Photo Studio OS Frontend read-only source boundary QA.
# Safe local static check only. This script scans source files for hard-boundary
# signals that must not appear in the current mock-first/read-only pilot.
# It does not edit files, deploy, push, call backend writes, or change
# dependency manifests.

param(
  [string]$SourceRoot = "src"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
  Write-Host "package.json not found. Run this script from the frontend repo root."
  exit 1
}

if (-not (Test-Path $SourceRoot)) {
  Write-Host "Source root not found: $SourceRoot"
  exit 1
}

$sourceFiles = @(
  git ls-files "$SourceRoot/**/*.ts" "$SourceRoot/**/*.tsx" "$SourceRoot/**/*.css"
) | Where-Object { $_ -and (Test-Path -LiteralPath $_ -PathType Leaf) }

if ($sourceFiles.Count -eq 0) {
  Write-Host "No source files found under $SourceRoot."
  exit 1
}

$rules = @(
  @{
    Name = "write-http-method"
    Pattern = "(?i)\bmethod\s*:\s*[""'](POST|PUT|PATCH|DELETE)[""']"
    Message = "Write-capable HTTP method in source."
  },
  @{
    Name = "form-data"
    Pattern = "(?i)\bnew\s+FormData\s*\("
    Message = "File upload FormData construction in source."
  },
  @{
    Name = "file-input"
    Pattern = "(?i)<input[^>]+type\s*=\s*[""']file[""']"
    Message = "File input control in source."
  },
  @{
    Name = "object-url"
    Pattern = "(?i)\bURL\.createObjectURL\s*\("
    Message = "Blob/object URL creation in source."
  },
  @{
    Name = "window-open"
    Pattern = "(?i)\bwindow\.open\s*\("
    Message = "Window-opening external access in source."
  },
  @{
    Name = "browser-storage-auth"
    Pattern = "(?i)\b(localStorage|sessionStorage)\b"
    Message = "Browser storage usage in source; current stage must not store auth/session state."
  },
  @{
    Name = "auth-header"
    Pattern = "(?i)\bAuthorization\b|Bearer\s+[A-Za-z0-9._~+/-]+=*"
    Message = "Authorization token/header handling in source."
  },
  @{
    Name = "enabled-public-access"
    Pattern = "(?is)\b(publicAccess|externalAccess)\s*:\s*\{[^}]*enabled\s*:\s*true"
    Message = "Public review/delivery access enabled in source."
  },
  @{
    Name = "signed-url-field"
    Pattern = "(?i)\b(uploadUrl|downloadUrl)\b"
    Message = "Upload/download signed URL field in source."
  },
  @{
    Name = "external-http-url"
    Pattern = "(?i)https?://(?!127\.0\.0\.1|localhost)"
    Message = "Non-local HTTP URL in source."
  },
  @{
    Name = "storage-provider-url"
    Pattern = "(?i)(s3://|amazonaws\.com|storage\.googleapis\.com|cloudfront\.net|blob\.vercel-storage\.com)"
    Message = "Storage provider URL in source."
  }
)

$failures = @()
foreach ($rule in $rules) {
  $matches = Select-String -Path $sourceFiles -Pattern $rule.Pattern -AllMatches
  foreach ($match in $matches) {
    $normalizedPath = $match.Path.Replace("\", "/")
    $isApprovedAuthBridge =
      $rule.Name -eq "auth-header" -and
      (
        $normalizedPath.EndsWith("/src/api/client.ts") -or
        $normalizedPath.EndsWith("/src/features/read-models/useBackendReadModel.ts")
      )
    $isApprovedAuthClaimNamespace =
      $rule.Name -eq "external-http-url" -and
      $match.Line -match "https://photo-studio-os/(organization_id|role)"

    if ($isApprovedAuthBridge -or $isApprovedAuthClaimNamespace) {
      continue
    }

    $failures += [pscustomobject]@{
      Rule = $rule.Name
      Path = $match.Path
      Line = $match.LineNumber
      Message = $rule.Message
      Text = $match.Line.Trim()
    }
  }
}

Write-Host "== Photo Studio OS read-only source boundary QA =="
Write-Host "Source files: $($sourceFiles.Count)"
Write-Host "Rules: $($rules.Count)"

if ($failures.Count -gt 0) {
  foreach ($failure in $failures) {
    Write-Host "[FAIL] $($failure.Rule) $($failure.Path):$($failure.Line)"
    Write-Host "       $($failure.Message)"
    Write-Host "       $($failure.Text)"
  }

  Write-Host ""
  Write-Host "Result: FAILED"
  exit 1
}

Write-Host "No read-only boundary violations found in source."
Write-Host ""
Write-Host "Result: PASSED"
exit 0
