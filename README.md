# EVM Wallet

Non-custodial Ethereum wallet — desktop (Windows) + mobile (Android).

## Architecture

```
evm-wallet/
├── packages/
│   ├── wallet-core/     # Shared: HD wallet, ETH/ERC-20, tx history (ethers v6)
│   └── ui-tokens/       # Design tokens (colors, spacing, typography)
├── apps/
│   ├── desktop/         # Electron + React + Vite + Tailwind
│   └── mobile/          # React Native (Android)
├── .github/workflows/   # CI/CD pipelines
├── Dockerfile           # Multi-stage dev/test/build
├── docker-compose.yml   # Docker services
└── .devcontainer/       # VS Code Dev Container config
```

## Quick Start

### Prerequisites

- **Node.js** 20+
- **pnpm** 9+ (`corepack enable && corepack prepare pnpm@9.6.0 --activate`)
- **Docker** (optional, for containerized dev)

### Local Development

```bash
# Install dependencies
pnpm install

# Build shared packages (required once)
pnpm -F @wallet/wallet-core build
pnpm -F @wallet/ui-tokens build

# Desktop: dev mode (Vite + Electron)
pnpm desktop:dev

# Desktop: production build
pnpm desktop:build

# Desktop: package Windows EXE
cd apps/desktop
npx electron-builder --win --dir --x64

# NSIS installer (if makensis available)
copy assets\icon.ico release\icon.ico
makensis release\installer.nsi
```

### Docker Development

```bash
# Start dev server (Vite on :5173)
docker compose up dev

# Run tests
docker compose run --rm test

# Run typecheck
docker compose run --rm typecheck

# Build renderer
docker compose run --rm build
```

### VS Code Dev Container

1. Install **Dev Containers** extension
2. Ctrl+Shift+P → "Dev Containers: Reopen in Container"
3. Container auto-installs deps and builds packages

## Git Workflow

Three branches with protection:

| Branch    | Purpose              | Deploys to       | Triggers              |
|-----------|----------------------|------------------|-----------------------|
| `dev`     | Active development   | —                | CI (lint, test, type) |
| `staging` | Pre-release testing  | Staging artifacts| CI + Windows/Android build |
| `main`    | Production releases  | GitHub Releases  | CI + builds + release on tag |

### Day-to-day workflow

```bash
# 1. Create feature branch from dev
git checkout dev
git pull
git checkout -b feature/my-feature

# 2. Develop, commit, push
git add .
git commit -m "feat: add feature"
git push -u origin feature/my-feature

# 3. Open PR to dev → CI runs → merge

# 4. When ready for testing: PR dev → staging → builds run

# 5. Release: PR staging → main → tag for GitHub Release
git checkout main
git pull
git tag v1.0.1
git push origin v1.0.1   # triggers release build + upload
```

## Scripts Reference

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm build` | Build all packages |
| `pnpm test` | Run desktop tests |
| `pnpm typecheck` | Typecheck all packages |
| `pnpm desktop:dev` | Desktop dev mode |
| `pnpm desktop:build` | Build desktop (main + renderer) |
| `pnpm docker:dev` | Docker dev server |
| `pnpm docker:test` | Docker test runner |

## Environment Variables

Copy `.env.example` → `.env` and fill in your keys:

```
ALCHEMY_RPC_MAINNET=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
ETHERSCAN_API_KEY=YOUR_KEY
```

## Documentation

Полная документация проекта — Obsidian vault в папке `docs/`.

```bash
# Открыть в Obsidian:
# 1. File → Open Vault → выбрать папку docs/
# 2. Или: Open folder as vault → docs/
```

Структура документации:

| Раздел | Описание |
|--------|----------|
| `architecture/` | Архитектура, data flow, безопасность |
| `backend/` | Electron main process, IPC, secure store |
| `frontend/` | React UI, store, компоненты, 8 экранов |
| `packages/` | wallet-core, ui-tokens |
| `devops/` | CI/CD, Docker, Git-стратегия, релизы |
| `guides/` | Быстрый старт, ENV, contributing |
| `changelog/` | Лог изменений |

> Документация написана на русском языке с Mermaid-диаграммами и wikilinks для навигации.

## Security

- Non-custodial: private keys never leave the device
- HD wallet (BIP-39/BIP-44) via ethers.js
- Desktop: encrypted local storage
- See [PRIVACY.md](PRIVACY.md) and [TERMS.md](TERMS.md)
