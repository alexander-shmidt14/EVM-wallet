---
tags: [moc, root]
last_updated: 2026-03-02
---

# EVM Wallet — Документация

> Non-custodial Ethereum кошелёк: desktop (Windows) + mobile (Android).
> Obsidian vault — точка входа во всю документацию проекта.

---

## Навигация по разделам

| Раздел | Описание |
|--------|----------|
| [[architecture/_index\|Архитектура]] | Высокоуровневая схема, поток данных, безопасность, монорепо |
| [[backend/_index\|Backend]] | Electron main process, IPC-хендлеры, secure store, preload |
| [[frontend/_index\|Frontend]] | React UI: маршрутизация, store, компоненты, экраны |
| [[packages/_index\|Пакеты]] | wallet-core (HD-кошелёк, ETH/ERC-20) и ui-tokens (дизайн) |
| [[devops/_index\|DevOps]] | CI/CD пайплайны, Docker, Git-стратегия, релизы |
| [[guides/_index\|Гайды]] | Быстрый старт, переменные окружения, contributing |
| [[changelog/_index\|Changelog]] | История изменений проекта |

---

## Быстрые ссылки

### Ключевые страницы
- [[architecture/data-flow|Поток данных]] — как данные проходят от UI до блокчейна
- [[backend/ipc-reference|Справочник IPC]] — все 20+ каналов между renderer и main
- [[frontend/store|Zustand Store]] — центральное хранилище состояния
- [[packages/wallet-core|wallet-core API]] — класс `WalletCore`, все методы
- [[devops/ci-pipeline|CI Pipeline]] — CI Gate, что проверяется при PR
- [[devops/windows-build|Windows Build]] — как собирается .exe

### Экраны приложения
- [[frontend/screens/_index|Все экраны]] → [[frontend/screens/login|Login]] → [[frontend/screens/wallet-select|Выбор кошелька]] → [[frontend/screens/wallet|Кошелёк]] → [[frontend/screens/send|Отправка]] / [[frontend/screens/receive|Получение]]

---

## Стек технологий

| Компонент | Технологии |
|-----------|-----------|
| Монорепо | pnpm 9.6.0 workspaces |
| Desktop | Electron 25, React 18, Vite 4, Tailwind 3, Zustand 4 |
| Mobile | React Native 0.74 (Android, не активен) |
| Блокчейн | ethers v6, BIP-39/BIP-44, ERC-20 |
| CI/CD | GitHub Actions, Docker |
| Безопасность | Electron safeStorage (OS Keychain), contextIsolation |

---

## Как поддерживать документацию

При каждом значимом коммите:

1. Проверь поле `related_files` в frontmatter — если файл изменился, обнови соответствующую страницу
2. Новый экран → создай по шаблону `templates/screen-template`, добавь в [[frontend/screens/_index]]
3. Новый IPC-хендлер → добавь строку в [[backend/ipc-reference]], обнови связанный экран
4. Любое изменение → добавь запись в [[changelog/_index]]

> Шаблоны: `templates/` — готовые заготовки для экранов, IPC-хендлеров и changelog.
