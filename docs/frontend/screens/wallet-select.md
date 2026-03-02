---
tags: [frontend, screens]
related_files:
  - apps/desktop/src/frontend/screens/WalletSelectScreen.tsx
last_updated: 2026-03-02
---

# WalletSelectScreen

**Раздел:** [[frontend/screens/_index|Экраны]] · **Маршрут:** `/wallet-select`

---

## Назначение

Хаб мульти-кошелька. Показывает список всех сохранённых кошельков, позволяет создать новый, импортировать, переключиться или удалить.

## UI

- Список кошельков (имя, адрес, дата создания)
- Активный кошелёк выделен визуально
- Кнопки: "Создать кошелёк", "Импортировать кошелёк"
- Кнопка удаления (с подтверждением) для каждого кошелька
- Кнопка "Выйти" (logout)

## Поведение

1. При монтировании: `store.loadWalletList()`
2. Клик на кошелёк: `store.selectWallet(id)` → навигация в `/wallet`
3. Удаление: `store.deleteWallet(id)` → обновление списка
4. Создание: навигация в `/create-wallet`
5. Импорт: навигация в `/import-wallet`
6. Logout: `store.logout()` → навигация в `/login`

## Используемые IPC

| Канал | Действие |
|-------|---------|
| `wallets:list` | Получение списка кошельков |
| `wallets:getActiveId` | ID активного кошелька |
| `wallets:select` | Переключение на кошелёк |
| `wallets:delete` | Удаление кошелька |

## Навигация

- **Откуда:** [[frontend/screens/login|Login]], [[frontend/screens/set-password|SetPassword]], [[frontend/screens/wallet|Wallet]] (кнопка "Manage")
- **Куда:** [[frontend/screens/create-wallet|CreateWallet]], [[frontend/screens/import-wallet|ImportWallet]], [[frontend/screens/wallet|Wallet]]

---

## См. также

- [[frontend/store|Zustand Store]] — actions мульти-кошелька
- [[backend/ipc-reference|Справочник IPC]] — `wallets:*` каналы
