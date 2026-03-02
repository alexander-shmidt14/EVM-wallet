---
tags: [frontend, screens]
related_files:
  - apps/desktop/src/frontend/screens/SendScreen.tsx
last_updated: 2026-03-02
---

# SendScreen

**Раздел:** [[frontend/screens/_index|Экраны]] · **Маршрут:** `/send`

---

## Назначение

Отправка ETH или ERC-20 токенов на любой Ethereum-адрес. Табовый интерфейс: ETH / ERC-20.

## UI

### Вкладка ETH
- Поле "Адрес получателя" (0x...)
- Поле "Сумма ETH"
- Кнопка "Оценить газ" → отображение gas details
- Кнопка "Отправить" → подтверждение → tx

### Вкладка ERC-20
- Поле "Адрес контракта токена" (предзаполнено MMA)
- Поле "Адрес получателя"
- Поле "Сумма"
- Кнопка "Оценить газ"
- Кнопка "Отправить"

### Статус транзакции
- pending → confirmed / failed
- Отображение tx hash

## Поведение

1. Валидация адреса получателя (0x, длина 42)
2. Gas estimation → показ `maxFeePerGas`, `gasLimit`, примерная стоимость
3. Отправка → pending state → ожидание receipt
4. Обновление статуса (confirmed / failed)
5. Навигация обратно в [[frontend/screens/wallet|Wallet]]

## Используемые IPC

| Канал | Действие |
|-------|---------|
| `wallet:estimateEthGas` | Оценка газа для ETH |
| `wallet:sendEth` | Отправка ETH (EIP-1559) |
| `wallet:getErc20Meta` | Метаданные токена (symbol, decimals) |
| `wallet:estimateErc20Gas` | Оценка газа для ERC-20 |
| `wallet:sendErc20` | Отправка ERC-20 |

## Навигация

- **Откуда:** [[frontend/screens/wallet|Wallet]]
- **Куда:** [[frontend/screens/wallet|Wallet]]

---

## См. также

- [[packages/wallet-core|wallet-core]] — `sendEth()`, `erc20Transfer()`
- [[backend/ipc-reference|Справочник IPC]] — `wallet:sendEth`, `wallet:sendErc20`
- [[architecture/data-flow|Поток данных]] — схема отправки транзакции
