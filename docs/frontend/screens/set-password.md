---
tags: [frontend, screens]
related_files:
  - apps/desktop/src/frontend/screens/SetPasswordScreen.tsx
last_updated: 2026-03-02
---

# SetPasswordScreen

**Раздел:** [[frontend/screens/_index|Экраны]] · **Маршрут:** `/set-password`

---

## Назначение

Первый экран при первом запуске приложения (когда пароль ещё не установлен). Пользователь создаёт пароль для защиты доступа к кошелькам.

## Поведение

1. Два поля: «Пароль» и «Подтверждение пароля»
2. Валидация: минимум 4 символа, пароли совпадают
3. При отправке: `store.setPassword(password)` → IPC `auth:setPassword`
4. Навигация → [[frontend/screens/wallet-select|WalletSelect]]

## Используемые IPC

| Канал | Действие |
|-------|---------|
| `auth:setPassword` | Сохраняет SHA-256 хеш пароля |

## Store actions

- `setPassword(pw)` — устанавливает `hasPassword = true`, `isAuthenticated = true`

## Навигация

- **Откуда:** `/` (redirect если нет пароля)
- **Куда:** `/wallet-select`

---

## См. также

- [[frontend/screens/login|Login]] — альтернативный вход (если пароль уже есть)
- [[frontend/app-flow|Маршрутизация]] — auth guard логика
