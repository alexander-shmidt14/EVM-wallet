---
tags: [guides]
related_files:
  - apps/desktop/src/backend/main.ts
last_updated: 2026-03-02
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
| `ETHERSCAN_API_KEY` | Нет | — | API ключ Etherscan для входящих транзакций |
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
```

> ⚠️ `.env` файл **не коммитится** в git (добавлен в `.gitignore`).

## Где используются

| Переменная | Файл | Строка |
|-----------|------|--------|
| `ALCHEMY_RPC_MAINNET` | `src/backend/main.ts` | `initWalletCore()` |
| `INFURA_RPC_MAINNET` | `src/backend/main.ts` | `initWalletCore()` |
| `ETHERSCAN_API_KEY` | `src/backend/main.ts` | `initWalletCore()` |
| `NODE_ENV` | `esbuild.main.mjs` | Build mode |

## Без API ключей

Всё работает и без ключей:
- RPC: PublicNode (бесплатный, без ключа, rate-limited)
- Etherscan: входящие транзакции не загружаются (исходящие — по журналу)
- Цена ETH: CoinGecko API (без ключа)

---

## См. также

- [[backend/electron-main|Electron Main]] — где переменные считываются
- [[guides/getting-started|Быстрый старт]] — настройка проекта
