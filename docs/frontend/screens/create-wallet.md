---
tags: [frontend, screens]
related_files:
  - apps/desktop/src/frontend/screens/CreateWalletScreen.tsx
last_updated: 2026-03-02
---

# CreateWalletScreen

**Раздел:** [[frontend/screens/_index|Экраны]] · **Маршрут:** `/create-wallet`

---

## Назначение

Создание нового HD-кошелька. Генерирует BIP-39 seed phrase и отображает его для сохранения пользователем.

## UI

1. **Шаг 1:** Ввод имени кошелька → кнопка "Создать"
2. **Шаг 2:** Отображение seed phrase (12 слов), кнопка "Показать" / "Скопировать"
3. **Шаг 3:** Подтверждение сохранения seed → "Продолжить"

## Поведение

1. Пользователь вводит имя (обязательное поле)
2. `store.createNewWallet(name)` → IPC `wallets:create`
3. Возвращается `{ id, name, address, seedPhrase }`
4. Показ seed phrase с предупреждением о безопасности
5. Копирование seed в буфер обмена
6. Навигация → `/wallet`

## Используемые IPC

| Канал | Действие |
|-------|---------|
| `wallets:create` | Генерация HD wallet, сохранение, возврат seed phrase |

## Навигация

- **Откуда:** [[frontend/screens/wallet-select|WalletSelect]]
- **Куда:** [[frontend/screens/wallet|Wallet]]

---

## См. также

- [[frontend/screens/import-wallet|ImportWallet]] — альтернатива: импорт существующего
- [[architecture/security|Безопасность]] — как хранится seed phrase
- [[packages/wallet-core|wallet-core]] — `ensureSeed(true)`
