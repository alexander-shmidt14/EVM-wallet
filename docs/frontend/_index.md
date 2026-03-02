---
tags: [moc, frontend]
last_updated: 2026-03-02
---

# Frontend

> React UI для десктопного приложения EVM Wallet.

**Родитель:** [[_index|Главная]]

---

## Страницы раздела

| Страница | Описание |
|----------|----------|
| [[frontend/app-flow\|Маршрутизация]] | Роуты, auth guard, навигация между экранами |
| [[frontend/store\|Zustand Store]] | Центральное хранилище: state, actions, IPC вызовы |
| [[frontend/components\|Компоненты]] | Переиспользуемые: ErrorBoundary, Loading, QRCode, Toast, иконки |
| [[frontend/screens/_index\|Экраны]] | Все 9 экранов приложения |

---

## Технологии

| Технология | Версия | Назначение |
|-----------|--------|-----------|
| React | 18.2 | UI-библиотека |
| React Router | 6.8 (HashRouter) | Клиентская маршрутизация |
| Zustand | 4.4 | State management |
| Tailwind CSS | 3.3 | Утилитарные стили |
| Vite | 4.3 | Dev server + bundler |

## Структура файлов

```
src/frontend/
├── App.tsx              # Router, auth guard
├── main.tsx             # React root render
├── index.html           # Vite entry point
├── index.css            # Tailwind base + custom
├── vite-env.d.ts        # PNG/SVG module declarations
├── assets/
│   └── icon_app.png     # Иконка приложения для UI
├── components/
│   ├── ErrorBoundary.tsx
│   ├── Loading.tsx
│   ├── QRCode.tsx
│   ├── Toast.tsx
│   └── icons/
│       ├── EthIcon.tsx
│       └── MmaIcon.tsx
├── screens/             # → [[frontend/screens/_index]]
│   ├── SetPasswordScreen.tsx
│   ├── LoginScreen.tsx
│   ├── WalletSelectScreen.tsx
│   ├── CreateWalletScreen.tsx
│   ├── ImportWalletScreen.tsx
│   ├── WalletScreen.tsx
│   ├── SendScreen.tsx
│   ├── ReceiveScreen.tsx
│   └── OnboardingScreen.tsx  ← legacy, не подключён к router
└── store/
    └── wallet.ts        # → [[frontend/store]]
```

---

## Связанные разделы

- [[backend/ipc-reference|Справочник IPC]] — какие каналы доступны через electronAPI
- [[backend/preload|Preload]] — как electronAPI попадает в renderer
- [[packages/ui-tokens|ui-tokens]] — дизайн-токены для стилей
