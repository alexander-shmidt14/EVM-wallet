---
tags: [architecture]
related_files:
  - apps/desktop/src/backend/main.ts
  - apps/desktop/src/frontend/App.tsx
  - packages/wallet-core/src/index.ts
  - packages/ui-tokens/src/index.ts
  - pnpm-workspace.yaml
last_updated: 2026-03-02
---

# Обзор архитектуры

**Раздел:** [[architecture/_index|Архитектура]] · **Главная:** [[_index]]

---

## Структура монорепо

```
evm-wallet/
├── packages/
│   ├── wallet-core/          # Shared: HD wallet, ETH/ERC-20, tx history
│   └── ui-tokens/            # Design tokens (colors, spacing, typography)
├── apps/
│   ├── desktop/              # Electron + React + Vite + Tailwind
│   │   ├── src/backend/      # main.ts, preload.ts, secure-store.ts
│   │   └── src/frontend/     # React UI: screens, store, components
│   └── mobile/               # React Native (Android) — не активен
├── .github/workflows/        # CI/CD пайплайны
├── Dockerfile                # Multi-stage контейнер
├── docker-compose.yml        # 4 сервиса (dev, test, typecheck, build)
└── docs/                     # ← ВЫ ЗДЕСЬ (Obsidian vault)
```

## Слоёная архитектура

```
┌─────────────────────────────────────────┐
│              Frontend (Renderer)         │
│  React 18 + Vite 4 + Tailwind 3        │
│  Zustand store → IPC invoke             │
├─────────────────────────────────────────┤
│             Preload (Bridge)             │
│  contextBridge.exposeInMainWorld        │
│  window.electronAPI → ipcRenderer       │
├─────────────────────────────────────────┤
│              Backend (Main)              │
│  Electron 25 main process              │
│  ipcMain.handle → WalletCore           │
├─────────────────────────────────────────┤
│           wallet-core (Package)          │
│  ethers v6, BIP-39/BIP-44              │
│  ETH/ERC-20 операции, tx history       │
├─────────────────────────────────────────┤
│            Ethereum Mainnet              │
│  JSON-RPC (Alchemy / Public Node)       │
│  Etherscan API (для входящих tx)        │
└─────────────────────────────────────────┘
```

## Ключевые принципы

1. **Non-custodial** — приватные ключи никогда не покидают устройство пользователя
2. **contextIsolation** — renderer не имеет доступа к Node.js, только через `electronAPI`
3. **Shared packages** — `wallet-core` и `ui-tokens` могут использоваться и в desktop, и в mobile
4. **Монорепо** — единый `pnpm-lock.yaml`, атомарные обновления зависимостей

---

## См. также

- [[architecture/data-flow|Поток данных]] — детальная схема взаимодействия слоёв
- [[architecture/security|Безопасность]] — как защищены ключи
- [[architecture/monorepo|Монорепо]] — pnpm workspace и зависимости
