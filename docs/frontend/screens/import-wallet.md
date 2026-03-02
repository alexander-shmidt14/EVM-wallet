---
tags: [frontend, screens]
related_files:
  - apps/desktop/src/frontend/screens/ImportWalletScreen.tsx
last_updated: 2026-03-02
---

# ImportWalletScreen

**Раздел:** [[frontend/screens/_index|Экраны]] · **Маршрут:** `/import-wallet`

---

## Назначение

Импорт существующего кошелька по 12-word BIP-39 seed phrase.

## UI

- Поле имени кошелька
- 12 полей для слов seed phrase (ввод по одному)
- Кнопка "Вставить из буфера" — автозаполнение всех 12 полей
- Кнопка "Импортировать"
- Валидация: все 12 слов заполнены

## Поведение

1. Пользователь вводит имя и 12 слов
2. `store.importNewWallet(name, seedPhrase)` → IPC `wallets:import`
3. Backend проверяет: если адрес уже существует → обновляет seed, возвращает существующий wallet
4. Если новый → создаёт запись
5. Навигация → `/wallet`

## Обработка дубликатов

Backend (main.ts) проверяет `wallets.find(w => w.address === derivedAddress)`:
- Найден → обновляет seed phrase, возвращает существующий `{id, name, address}`
- Не найден → создаёт новую запись

## Используемые IPC

| Канал | Действие |
|-------|---------|
| `wallets:import` | Валидация seed, проверка дубликатов, сохранение |

## Навигация

- **Откуда:** [[frontend/screens/wallet-select|WalletSelect]]
- **Куда:** [[frontend/screens/wallet|Wallet]]

---

## См. также

- [[frontend/screens/create-wallet|CreateWallet]] — альтернатива: создание нового
- [[packages/wallet-core|wallet-core]] — `importSeed(phrase)` — валидация через `HDNodeWallet.fromPhrase`
