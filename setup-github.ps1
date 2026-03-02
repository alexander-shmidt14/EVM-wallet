# ─── EVM Wallet: GitHub Repository Setup (PowerShell) ─────────────
# Run AFTER authenticating: gh auth login
# Usage: .\setup-github.ps1

$ErrorActionPreference = "Stop"
$REPO_NAME = "evm-wallet"
$GH_USER = "alexander-shmidt14"

Write-Host "=== EVM Wallet — GitHub Setup ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check gh auth
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not authenticated. Run: gh auth login" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] GitHub CLI authenticated" -ForegroundColor Green

# 2. Create repo
Write-Host "[1/5] Creating GitHub repo: $GH_USER/$REPO_NAME ..." -ForegroundColor Yellow
gh repo create $REPO_NAME --private --description "EVM Wallet - non-custodial Ethereum wallet (Desktop + Android)" 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "  Repo may already exist, continuing..." }

# 3. Set remote
Write-Host "[2/5] Setting remote origin..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin "https://github.com/$GH_USER/$REPO_NAME.git"

# 4. Initial commit + push to main
Write-Host "[3/5] Committing and pushing to main..." -ForegroundColor Yellow
git add -A
git commit -m "chore: initial clean workspace setup"
git push -u origin main

# 5. Create branches
Write-Host "[4/5] Creating dev and staging branches..." -ForegroundColor Yellow
git checkout -b staging
git push -u origin staging
git checkout -b dev
git push -u origin dev

# 6. Set default branch
Write-Host "[5/5] Setting default branch to dev..." -ForegroundColor Yellow
gh repo edit --default-branch dev

Write-Host ""
Write-Host "Done! Repository: https://github.com/$GH_USER/$REPO_NAME" -ForegroundColor Green
Write-Host ""
Write-Host "Branch structure:" -ForegroundColor Cyan
Write-Host "  dev      - active development (default branch)"
Write-Host "  staging  - pre-release testing"
Write-Host "  main     - production releases"
