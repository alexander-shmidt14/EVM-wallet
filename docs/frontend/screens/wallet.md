---
tags: [frontend, screens]
related_files:
  - apps/desktop/src/frontend/screens/WalletScreen.tsx
last_updated: 2026-03-02
---

# WalletScreen

**Раздел:** [[frontend/screens/_index|Экраны]] · **Маршрут:** `/wallet`

---

## Назначение

Главный экран кошелька — центр управления. Показывает балансы, список активов, seed phrase, базовые операции.

## UI секции

### 1. Шапка
- Имя кошелька (`activeWalletName`)
- Адрес (сокращённый `0x1234...abcdef`) + кнопка копирования
- Общий баланс в USD (`totalBalanceUsd`)

### 2. Действия
- **Отправить** → навигация в `/send`
- **Получить** → навигация в `/receive`
- **Обновить** → `loadBalance()`

### 3. Активы (Assets)
- **ETH:** [[frontend/components#Иконки|EthIcon]] + баланс ETH + USD
- **MMA Coin:** [[frontend/components#Иконки|MmaIcon]] + баланс MMA + USD
- Кнопка "Add Token" (placeholder)

### 4. Seed Phrase
- Скрыт по умолчанию
- Кнопка "Показать" → отображение 12 слов
- Кнопка "Скопировать" → буфер обмена + feedback

### 5. Управление
- Кнопка "Wallet Management" → навигация в `/wallet-select`
- Кнопка "Удалить кошелёк" → подтверждение → `deleteWallet(id)` → `/wallet-select`

## Автообновление

```typescript
useEffect(() => {
  loadBalance()
  loadSeedPhrase()
  const interval = setInterval(loadBalance, 30000)  // каждые 30 сек
  return () => clearInterval(interval)
}, [])
```

## Используемые IPC

| Канал | Действие |
|-------|---------|
| `wallet:getEthBalance` | Загрузка ETH баланса |
| `wallet:getErc20Balance` | Загрузка MMA баланса |
| `wallet:getSeedPhrase` | Загрузка seed phrase |
| `wallets:delete` | Удаление кошелька |

## Store actions

- `loadBalance()` — ETH + MMA + USD расчёт
- `loadSeedPhrase()` — загрузка seed
- `deleteWallet(id)` — удаление

## Навигация

- **Откуда:** [[frontend/screens/wallet-select|WalletSelect]], [[frontend/screens/create-wallet|CreateWallet]], [[frontend/screens/import-wallet|ImportWallet]]
- **Куда:** [[frontend/screens/send|Send]], [[frontend/screens/receive|Receive]], [[frontend/screens/wallet-select|WalletSelect]]

---

## См. также

- [[frontend/components|Компоненты]] — EthIcon, MmaIcon
- [[frontend/store|Zustand Store]] — `loadBalance()` логика
- [[backend/ipc-reference|Справочник IPC]] — `wallet:*` каналы
