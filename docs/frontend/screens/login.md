---
tags: [frontend, screens]
related_files:
  - apps/desktop/src/frontend/screens/LoginScreen.tsx
last_updated: 2026-03-02
---

# LoginScreen

**Раздел:** [[frontend/screens/_index|Экраны]] · **Маршрут:** `/login`

---

## Назначение

Экран входа — показывается при повторных запусках приложения, когда пароль уже установлен.

## UI

- Иконка приложения (`icon_app.png`) — import через Vite asset
- Заголовок "EVM Wallet"
- Поле пароля
- Кнопка "Войти"
- Сообщение об ошибке при неверном пароле

## Поведение

1. Ввод пароля
2. `store.login(password)` → IPC `auth:checkPassword`
3. Если верно → навигация в `/wallet-select`
4. Если неверно → показ ошибки "Неверный пароль"

## Используемые IPC

| Канал | Действие |
|-------|---------|
| `auth:checkPassword` | SHA-256(input) === stored hash |

## Store actions

- `login(pw): boolean` — `isAuthenticated = true` при успехе

## Навигация

- **Откуда:** `/` (redirect если пароль есть, но не залогинен)
- **Куда:** `/wallet-select`

---

## См. также

- [[frontend/screens/set-password|SetPassword]] — первый запуск
- [[frontend/screens/wallet-select|WalletSelect]] — следующий экран
- [[architecture/security|Безопасность]] — хранение пароля
