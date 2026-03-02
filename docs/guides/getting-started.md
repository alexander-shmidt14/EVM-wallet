---
tags: [guides]
last_updated: 2026-03-02
---

# Быстрый старт

**Раздел:** [[guides/_index|Гайды]] · **Главная:** [[_index]]

---

## Требования

| Инструмент | Версия | Установка |
|-----------|--------|-----------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org/) |
| pnpm | 9+ | `corepack enable && corepack prepare pnpm@9.6.0 --activate` |
| Git | 2.40+ | [git-scm.com](https://git-scm.com/) |
| Docker | (опц.) | [docker.com](https://docker.com/) |

## Установка

```bash
# Клонирование
git clone https://github.com/alexander-shmidt14/EVM-wallet.git
cd EVM-wallet

# Установка зависимостей
pnpm install

# Сборка shared-пакетов (обязательно при первом запуске!)
pnpm -F @wallet/wallet-core build
pnpm -F @wallet/ui-tokens build
```

## Запуск в dev-режиме

```bash
# Desktop (Electron + Vite hot reload)
pnpm -F @app/desktop dev
```

Это запускает параллельно:
1. `esbuild` — сборка main process
2. `vite` — dev server для renderer (http://localhost:5173)
3. `electron .` — запуск Electron (ждёт vite)

## Production build

```bash
# Сборка main + renderer
pnpm -F @app/desktop build:main
pnpm -F @app/desktop build:renderer

# Упаковка в .exe (directory mode, без подписи)
cd apps/desktop
npx electron-builder --dir --config electron-builder-nosign.json

# Или NSIS installer
npx electron-builder --win nsis --config electron-builder-nosign.json
```

## Docker

```bash
# Dev
docker compose up dev

# Тесты
docker compose run --rm test

# Typecheck
docker compose run --rm typecheck
```

## Проверки

```bash
# TypeScript
pnpm -F @app/desktop typecheck

# Тесты
pnpm -F @app/desktop test

# Полный CI-подобный прогон
pnpm -F @wallet/wallet-core build
pnpm -F @wallet/ui-tokens build
pnpm -F @app/desktop typecheck
pnpm -F @app/desktop test
pnpm -F @app/desktop build:main
pnpm -F @app/desktop build:renderer
```

## Первая сборка — чеклист

- [ ] `pnpm install` — без ошибок
- [ ] `pnpm -F @wallet/wallet-core build` — `dist/index.js` создан
- [ ] `pnpm -F @wallet/ui-tokens build` — `dist/index.js` создан
- [ ] `pnpm -F @app/desktop build:renderer` — собрался без ошибок
- [ ] `pnpm -F @app/desktop build:main` — `dist/main.js` создан

---

## См. также

- [[guides/env-variables|Переменные окружения]] — настройка `.env`
- [[architecture/monorepo|Монорепо]] — структура и build order
- [[devops/docker|Docker]] — контейнеризованная разработка
