---
tags: [frontend]
related_files:
  - apps/desktop/src/frontend/store/wallet.ts
last_updated: 2026-03-02
---

# Zustand Store

**Раздел:** [[frontend/_index|Frontend]] · **Главная:** [[_index]]

---

## Файл

`apps/desktop/src/frontend/store/wallet.ts` (375 строк)

## Обзор

Единственный store приложения, создан через `zustand/create`. Управляет аутентификацией, мульти-кошельком, балансами и seed phrase.

---

## State

### Аутентификация

| Поле | Тип | Описание |
|------|-----|----------|
| `hasPassword` | `boolean` | Установлен ли пароль |
| `isAuthenticated` | `boolean` | Прошёл ли пользователь логин |

### Мульти-кошелёк

| Поле | Тип | Описание |
|------|-----|----------|
| `walletList` | `SavedWallet[]` | Список `{id, name, address, createdAt}` |
| `activeWalletId` | `string \| null` | ID текущего кошелька |
| `activeWalletName` | `string \| null` | Имя текущего кошелька |

### Текущий кошелёк

| Поле | Тип | Описание |
|------|-----|----------|
| `isInitialized` | `boolean` | App полностью инициализировано |
| `hasWallet` | `boolean` | Есть ли seed в хранилище |
| `currentAddress` | `string \| null` | Ethereum адрес (0x...) |
| `seedPhrase` | `string \| null` | 12 слов (загружается по требованию) |
| `ethBalance` | `string \| null` | ETH баланс (formatted) |
| `mmaBalance` | `string \| null` | MMA баланс (formatted) |
| `mmaBalanceUsd` | `string \| null` | MMA в USD |
| `ethBalanceUsd` | `string \| null` | ETH в USD |
| `totalBalanceUsd` | `string \| null` | Общий баланс в USD |
| `isLoading` | `boolean` | Индикатор загрузки |
| `error` | `string \| null` | Последняя ошибка |

### История транзакций

| Поле | Тип | Описание |
|------|-----|----------|
| `transactions` | `TransactionInfo[]` | Объединённый список транзакций (входящие + исходящие) |
| `isLoadingTransactions` | `boolean` | Индикатор загрузки истории |

---

## Actions

### Auth

| Action | IPC вызовы | Описание |
|--------|-----------|----------|
| `checkAuth()` | `auth:hasPassword` | Проверка наличия пароля при запуске |
| `setPassword(pw)` | `auth:setPassword` | Установка пароля + `isAuthenticated = true` |
| `login(pw)` | `auth:checkPassword` | Верификация пароля. Возвращает `boolean` |
| `logout()` | — | Сброс `isAuthenticated` и данных кошелька |

### Мульти-кошелёк

| Action | IPC вызовы | Описание |
|--------|-----------|----------|
| `loadWalletList()` | `wallets:list`, `wallets:getActiveId` | Загрузка списка + активного ID |
| `createNewWallet(name)` | `wallets:create` | Создание + auto `loadWalletList` + `loadBalance` |
| `importNewWallet(name, seed)` | `wallets:import` | Импорт + auto `loadWalletList` + `loadBalance` |
| `selectWallet(id)` | `wallets:select` | Переключение + auto `loadBalance` |
| `deleteWallet(id)` | `wallets:delete` | Удаление + сброс state если активный |

### Кошелёк

| Action | IPC вызовы | Описание |
|--------|-----------|----------|
| `initialize()` | `auth:hasPassword`, `wallet:hasWallet`, `wallet:getAddress`, `wallets:getActiveId`, `wallets:list` | Полная инициализация при запуске |
| `loadBalance()` | `wallet:getEthBalance`, `wallet:getErc20Balance` + CoinGecko fetch | Загрузка ETH + MMA балансов + USD. Авто-обновление каждые 30 сек |
| `loadSeedPhrase()` | `wallet:getSeedPhrase` | Загрузка seed phrase по требованию |
| `loadTransactions()` | `wallet:getTransactionHistory` | Загрузка объединённой истории (per-wallet, limit 50) |
| `reset()` | `wallet:resetWallet` | Полный сброс кошелька |

---

## Ценообразование

| Актив | Источник цены |
|-------|--------------|
| ETH | CoinGecko API (`/simple/price?ids=ethereum&vs_currencies=usd`) |
| MMA | Захардкожена: `$55` (константа `MMA_PRICE_USD`) |

## MMA Token

```typescript
const MMA_TOKEN_ADDRESS = '0xcA82d24A97b33F2d5826575f77fdc8Bdb82FC580'
const MMA_PRICE_USD = 55
```

---

## См. также

- [[backend/ipc-reference|Справочник IPC]] — все каналы, которые вызывает store
- [[frontend/app-flow|Маршрутизация]] — `initialize()` при запуске
- [[frontend/screens/_index|Экраны]] — какие экраны используют какие actions
- [[packages/wallet-core|wallet-core API]] — реализация на стороне main
