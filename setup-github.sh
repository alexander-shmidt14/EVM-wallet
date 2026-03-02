#!/usr/bin/env bash
# ─── EVM Wallet: GitHub Repository Setup ────────────────────────────
# Run this script AFTER authenticating: gh auth login
# Usage: bash setup-github.sh
set -e

REPO_NAME="evm-wallet"
GH_USER="alexander-shmidt14"

echo "=== EVM Wallet — GitHub Setup ==="
echo ""

# 1. Check gh auth
if ! gh auth status &>/dev/null; then
  echo "❌ Not authenticated. Run: gh auth login"
  exit 1
fi

# 2. Create repo
echo "[1/5] Creating GitHub repo: $GH_USER/$REPO_NAME ..."
gh repo create "$REPO_NAME" --private --description "EVM Wallet — non-custodial Ethereum wallet (Desktop + Android)" || echo "Repo may already exist, continuing..."

# 3. Set remote
echo "[2/5] Setting remote origin..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/$GH_USER/$REPO_NAME.git"

# 4. Initial commit + push to main
echo "[3/5] Committing and pushing to main..."
git add -A
git commit -m "chore: initial clean workspace setup

- Monorepo: pnpm workspaces (wallet-core, ui-tokens, desktop, mobile)
- Docker: multi-stage Dockerfile + docker-compose (dev, test, build)
- CI/CD: GitHub Actions (ci.yml, windows-build.yml, android-build.yml)
- Branches: dev / staging / main
- Cleaned: removed redundant batch scripts, stale files, build artifacts"
git push -u origin main

# 5. Create branches
echo "[4/5] Creating dev and staging branches..."
git checkout -b staging
git push -u origin staging

git checkout -b dev
git push -u origin dev

# 6. Set default branch
echo "[5/5] Setting default branch to dev..."
gh repo edit --default-branch dev

echo ""
echo "✅ Done! Repository: https://github.com/$GH_USER/$REPO_NAME"
echo ""
echo "Branch structure:"
echo "  dev      — active development (default branch)"
echo "  staging  — pre-release testing"
echo "  main     — production releases"
