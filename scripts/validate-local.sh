#!/usr/bin/env bash
# Photo Studio OS Frontend local validation helper
# Safe local validation only.
# This script does not install dependencies, deploy, push, or call external services.

set -euo pipefail

echo "== Photo Studio OS Frontend local validation =="

if [ ! -f "package.json" ]; then
  echo "package.json not found. Are you in the frontend repo root?"
  exit 1
fi

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
echo "Result: PASSED"
