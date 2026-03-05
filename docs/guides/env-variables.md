---
tags: [guides]
related_files:
  - apps/desktop/src/backend/main.ts
  - apps/desktop/esbuild.main.mjs
last_updated: 2026-03-05
---

# Переменные окружения

**Раздел:** [[guides/_index|Гайды]] · **Главная:** [[_index]]

---

## Обзор

Проект использует минимальный набор переменных окружения. Все они **опциональны** — есть fallback-значения.

## Переменные

| Переменная | Обязательна | Fallback | Описание |
|-----------|-------------|---------|----------|
| `ALCHEMY_RPC_MAINNET` | Нет | `https://ethereum.publicnode.com` | JSON-RPC URL для Ethereum Mainnet (Alchemy) |
| `INFURA_RPC_MAINNET` | Нет | PublicNode | JSON-RPC URL (Infura) — backup |
| `ETHERSCAN_API_KEY` | Нет | — | API ключ Etherscan V2 (единый для всех 60+ сетей) — для входящих транзакций |
| `INCOMING_ERC20_WHITELIST` | Нет | MMA token | CSV whitelist адресов контрактов для входящих ERC-20 |
| `NODE_ENV` | Нет | `development` | Build mode. CI использует `production` |

## Приоритет RPC

```
ALCHEMY_RPC_MAINNET → INFURA_RPC_MAINNET → https://ethereum.publicnode.com
```

## `.env` файл

Создайте `.env` в корне проекта (опционально):

```env
# RPC провайдер (рекомендуется Alchemy для production)
ALCHEMY_RPC_MAINNET=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# Backup RPC
INFURA_RPC_MAINNET=https://mainnet.infura.io/v3/YOUR_KEY

# Etherscan API (для истории входящих транзакций)
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY

# Whitelist входящих ERC-20 (CSV контрактов)
INCOMING_ERC20_WHITELIST=0xcA82d24A97b33F2d5826575f77fdc8Bdb82FC580
```

> ⚠️ `.env` файл **не коммитится** в git (добавлен в `.gitignore`).

## Где используются

| Переменная | Файл | Строка |
|-----------|------|--------|
| `ALCHEMY_RPC_MAINNET` | `src/backend/main.ts` | `initWalletCore()` |
| `INFURA_RPC_MAINNET` | `src/backend/main.ts` | `initWalletCore()` |
| `ETHERSCAN_API_KEY` | `src/backend/main.ts` | `initWalletCore()` |
| `INCOMING_ERC20_WHITELIST` | `src/backend/main.ts` | `initWalletCore()` |
| `NODE_ENV` | `esbuild.main.mjs` | Build mode |

## Важно для Windows CI installer (.exe)

`.env.example` — это только шаблон и **не участвует** в runtime скачанного `.exe`.

Для сборок из GitHub Actions секреты должны быть заданы в репозитории:
- `Settings → Secrets and variables → Actions → Secrets`:
  - `ALCHEMY_RPC_MAINNET` (опционально)
  - `INFURA_RPC_MAINNET` (опционально)
  - `ETHERSCAN_API_KEY` (нужен для входящих)
- `Settings → Secrets and variables → Actions → Variables`:
  - `INCOMING_ERC20_WHITELIST` (CSV контрактов)

Именно эти значения вшиваются в desktop main bundle на шаге `build:main`.

## Без API ключей

Всё работает и без ключей:
- RPC: PublicNode (бесплатный, без ключа, rate-limited)
- **Etherscan:** входящие транзакции не загружаются, видны только исходящие (см. [[backend/transaction-history|История транзакций]])

> ℹ️ С 2025-08-15 Etherscan отключил V1 API. Проект использует **V2** (`api.etherscan.io/v2/api` + `chainid=1`). Один Etherscan API key работает для всех сетей.
- Цена ETH: CoinGecko API (без ключа)

---

## См. также

- [[backend/transaction-history|История транзакций]] — как работают входящие/исходящие
- [[backend/electron-main|Electron Main]] — где переменные считываются
- [[guides/getting-started|Быстрый старт]] — настройка проекта
