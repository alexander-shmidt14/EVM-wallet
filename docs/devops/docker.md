---
tags: [devops]
related_files:
  - Dockerfile
  - docker-compose.yml
last_updated: 2026-03-02
---

# Docker

**Раздел:** [[devops/_index|DevOps]] · **Главная:** [[_index]]

---

## Dockerfile

Multi-stage build на базе `node:20-bookworm-slim`.

```
Stage 1: base        — pnpm install, зависимости
Stage 2: dev         — dev-зависимости, hot reload
Stage 3: test        — запуск тестов
Stage 4: build       — production build
```

## docker-compose.yml

4 сервиса:

| Сервис | Описание | Команда |
|--------|----------|---------|
| `dev` | Dev-окружение с hot reload | `pnpm desktop:dev` |
| `test` | Запуск тестов | `pnpm test` |
| `typecheck` | TypeScript проверка | `pnpm typecheck` |
| `build` | Production build | `pnpm desktop:build` |

### Использование

```bash
# Dev-окружение
docker compose up dev

# Тесты
docker compose run --rm test

# Typecheck
docker compose run --rm typecheck

# Production build
docker compose run --rm build
```

### Volumes

- Исходный код монтируется в контейнер
- `node_modules` — named volume (не перезаписывается хостом)
- `.env` — опциональный, подключается через `env_file` (если есть)

---

## См. также

- [[guides/getting-started|Быстрый старт]] — локальная разработка с Docker
- [[devops/ci-pipeline|CI Pipeline]] — CI использует свой runner, не Docker
