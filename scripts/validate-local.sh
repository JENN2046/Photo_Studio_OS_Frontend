#!/usr/bin/env bash
# Photo Studio OS Frontend local validation helper
# Safe local validation only.
# This script does not install dependencies, deploy, push, edit env files,
# call backend writes, or change dependency manifests.

set -euo pipefail

include_browser_qa=0
for arg in "$@"; do
  case "$arg" in
    --include-browser-qa)
      include_browser_qa=1
      ;;
    -h|--help)
      echo "Usage: scripts/validate-local.sh [--include-browser-qa]"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg"
      echo "Usage: scripts/validate-local.sh [--include-browser-qa]"
      exit 1
      ;;
  esac
done

echo "== Photo Studio OS Frontend local validation =="

if [ ! -f "package.json" ]; then
  echo "package.json not found. Are you in the frontend repo root?"
  exit 1
fi

echo ""
echo "== Runtime preflight =="
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js was not found in this shell. Use a shell with the project Node runtime before running Bash validation."
  exit 1
fi

node_version="$(node -p "process.versions.node" 2>/dev/null || true)"
if [ -z "$node_version" ]; then
  echo "Unable to read the Node.js version from this shell."
  exit 1
fi

if ! node -e 'const [major, minor] = process.versions.node.split(".").map(Number); const ok = (major === 20 && minor >= 19) || (major === 22 && minor >= 12) || major > 22; process.exit(ok ? 0 : 1);'; then
  echo "Node.js $node_version detected in this shell."
  echo "Vite 7 requires Node.js 20.19+ or 22.12+ for this project's build gate."
  echo "Use a Bash/WSL shell with a compatible Node runtime, or run the validated PowerShell helper:"
  echo "  powershell -ExecutionPolicy Bypass -File scripts\\validate-local.ps1"
  exit 1
fi

echo "Node.js $node_version"

echo ""
echo "== Git status =="
git branch --show-current
git status --short
git diff --stat || true

echo ""
echo "== Available npm scripts =="
npm run

has_script() {
  node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts['$1'] ? 0 : 1)"
}

for script in typecheck lint build test; do
  if has_script "$script"; then
    echo ""
    echo "== npm run $script =="
    npm run "$script"
  else
    echo "Skip: npm run $script is not defined"
  fi
done

echo ""
echo "== git diff --check =="
git diff --check

echo ""
echo "== changed-file secret scan =="
mapfile -t changed_files < <(
  {
    git diff --name-only
    git diff --cached --name-only
    git ls-files --others --exclude-standard
  } | sed '/^$/d' | sort -u
)

if [ "${#changed_files[@]}" -eq 0 ]; then
  echo "No changed files to scan"
else
  existing_files=()
  for file in "${changed_files[@]}"; do
    if [ -f "$file" ]; then
      existing_files+=("$file")
    fi
  done

  if [ "${#existing_files[@]}" -eq 0 ]; then
    echo "No existing changed files to scan"
  else
    sensitive_key_pattern='(TOKEN|SECRET|PASSWORD|API_KEY)'
    assignment_pattern="[A-Za-z0-9_]*${sensitive_key_pattern}[A-Za-z0-9_]*[[:space:]]*=[[:space:]]*[\"'][^\"']{8,}"
    scan_patterns=(
      'AKIA[0-9A-Z]{16}'
      'AIza[0-9A-Za-z_-]{35}'
      'sk-[A-Za-z0-9]{20,}'
      'gh[pousr]_[A-Za-z0-9_]{36,}'
      'xox[baprs]-[A-Za-z0-9-]{10,}'
      '-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----'
      "$assignment_pattern"
    )
    found_secret=0
    for pattern in "${scan_patterns[@]}"; do
      if grep -I -E -n "$pattern" -- "${existing_files[@]}"; then
        found_secret=1
      fi
    done
    if [ "$found_secret" -ne 0 ]; then
      echo "changed-file secret scan failed"
      exit 1
    fi
    echo "changed-file secret scan passed"
  fi
fi

run_powershell_script() {
  local script_path="$1"
  if command -v pwsh >/dev/null 2>&1; then
    pwsh -ExecutionPolicy Bypass -File "$script_path"
  elif command -v powershell >/dev/null 2>&1; then
    powershell -ExecutionPolicy Bypass -File "$script_path"
  else
    echo "PowerShell is required for browser QA scripts."
    exit 1
  fi
}

if [ "$include_browser_qa" -eq 1 ]; then
  echo ""
  echo "== read-only route QA =="
  run_powershell_script "scripts/qa-readonly-routes.ps1"

  echo ""
  echo "== read-model boundary-state QA =="
  run_powershell_script "scripts/qa-readonly-boundary-states.ps1"

  echo ""
  echo "== read-model interaction QA =="
  run_powershell_script "scripts/qa-readonly-interactions.ps1"
else
  echo ""
  echo "Skip: browser QA scripts. Re-run with --include-browser-qa to include route, boundary-state, and interaction matrices."
fi

echo ""
echo "Result: PASSED"
