---
tags: [guides]
last_updated: 2026-03-02
---

# Contributing

**Раздел:** [[guides/_index|Гайды]] · **Главная:** [[_index]]

---

## Процесс работы

### 1. Ветка

```bash
git checkout dev
git pull
git checkout -b fix/my-change    # или feature/my-feature
```

Naming: `fix/*`, `feature/*`, `docs/*`, `chore/*`

### 2. Коммиты

Используем **Conventional Commits**:

```
feat: add send ERC-20 screen
fix: correct gas estimation overflow
docs: update IPC reference for wallets:create
chore: bump ethers to 6.9
refactor: extract WalletCard component
```

### 3. PR

```bash
git push -u origin fix/my-change
```

Затем создать PR в `dev` через GitHub. [[devops/ci-pipeline|CI]] запустится автоматически.

### 4. Review

- CI Gate должен быть ✅
- Минимум 1 approve (если работаем в команде)
- Squash merge рекомендуется

### 5. После merge

- [[devops/windows-build|Windows Build]] создаст .exe автоматически
- Удалить feature-ветку

---

## Стиль кода

### TypeScript

- Strict mode (`tsconfig.json`)
- Явные типы для public API, `any` минимально
- Async/await вместо .then()
- Exactly one export per screen (`export const ScreenName`)

### React

- Functional components + hooks
- `useCallback` для event handlers
- `useEffect` с dependency array
- Zustand store для shared state (не prop drilling)

### Tailwind CSS

- Утилитарные классы в JSX
- Кастомные цвета через `tailwind.config.js`
- `clsx()` для условных классов

### Naming

| Тип | Конвенция | Пример |
|-----|-----------|--------|
| Компоненты | PascalCase | `WalletScreen`, `EthIcon` |
| Файлы компонентов | PascalCase.tsx | `WalletScreen.tsx` |
| Hooks | camelCase, use* | `useWalletStore` |
| IPC каналы | `domain:action` | `wallet:getEthBalance` |
| Константы | UPPER_SNAKE | `MMA_TOKEN_ADDRESS` |
| Переменные/функции | camelCase | `loadBalance`, `ethPrice` |

---

## Обновление документации

При значимых изменениях обновляй доки:

| Изменение | Что обновить |
|-----------|-------------|
| Новый экран | `templates/screen-template` → `screens/`, добавить в `screens/_index` |
| Новый IPC-хендлер | Добавить строку в [[backend/ipc-reference]] |
| Изменение store | Обновить [[frontend/store]] |
| Новый пакет/зависимость | Обновить [[architecture/monorepo]] |
| Любое изменение | Добавить запись в [[changelog/_index]] |

---

## См. также

- [[devops/branching|Git-стратегия]] — модель ветвления
- [[devops/ci-pipeline|CI Pipeline]] — что проверяет CI
- [[guides/getting-started|Быстрый старт]] — настройка окружения
