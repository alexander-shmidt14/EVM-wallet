---
tags: [backend, api]
related_files:
  - apps/desktop/src/backend/main.ts
  - apps/desktop/src/backend/preload.ts
last_updated: 2026-03-02
---

# Справочник IPC-каналов

**Раздел:** [[backend/_index|Backend]] · **Главная:** [[_index]]

---

## Обзор

Всё взаимодействие между Renderer (React) и Main (Electron) проходит через `ipcMain.handle` / `ipcRenderer.invoke`. Ниже — полный справочник всех каналов.

---

## Аутентификация (`auth:*`)

| Канал | Параметры | Возврат | Описание | Экран |
|-------|-----------|---------|----------|-------|
| `auth:hasPassword` | — | `boolean` | Проверяет наличие сохранённого хеша пароля | [[frontend/screens/login\|Login]], [[frontend/app-flow\|App Flow]] |
| `auth:setPassword` | `password: string` | `void` | SHA-256 хеширует и сохраняет пароль | [[frontend/screens/set-password\|SetPassword]] |
| `auth:checkPassword` | `password: string` | `boolean` | Сравнивает SHA-256(input) с сохранённым хешем | [[frontend/screens/login\|Login]] |

## Мульти-кошелёк (`wallets:*`)

| Канал | Параметры | Возврат | Описание | Экран |
|-------|-----------|---------|----------|-------|
| `wallets:list` | — | `Array<{id, name, address, createdAt}>` | Список всех кошельков (без seed phrases!) | [[frontend/screens/wallet-select\|WalletSelect]] |
| `wallets:create` | `name: string` | `{id, name, address, seedPhrase}` | Генерирует новый HD-кошелёк | [[frontend/screens/create-wallet\|CreateWallet]] |
| `wallets:import` | `name: string, seedPhrase: string` | `{id, name, address}` | Импортирует seed phrase, проверяет дубликаты | [[frontend/screens/import-wallet\|ImportWallet]] |
| `wallets:select` | `walletId: string` | `{id, name, address}` | Переключается на указанный кошелёк | [[frontend/screens/wallet-select\|WalletSelect]] |
| `wallets:delete` | `walletId: string` | `void` | Удаляет кошелёк; очищает seed если активный | [[frontend/screens/wallet\|Wallet]], [[frontend/screens/wallet-select\|WalletSelect]] |
| `wallets:getActiveId` | — | `string \| null` | Возвращает ID текущего активного кошелька | [[frontend/store\|Store]] |

## Операции с кошельком (`wallet:*`)

### Базовые

| Канал | Параметры | Возврат | Описание |
|-------|-----------|---------|----------|
| `wallet:hasWallet` | — | `boolean` | Проверяет наличие seed в хранилище |
| `wallet:createWallet` | — | `string` | Создаёт seed (legacy, одиночный) |
| `wallet:importWallet` | `seedPhrase: string` | `void` | Импорт seed (legacy, одиночный) |
| `wallet:getAddress` | `index?: number` | `string` | Derive BIP-44 адрес по индексу |
| `wallet:getSeedPhrase` | — | `string` | Возвращает текущий seed phrase |
| `wallet:resetWallet` | — | `void` | Полный сброс: seed + история транзакций |

### ETH

| Канал | Параметры | Возврат | Описание | Экран |
|-------|-----------|---------|----------|-------|
| `wallet:getEthBalance` | `address: string` | `{wei, eth, formatted}` | Баланс ETH | [[frontend/screens/wallet\|Wallet]] |
| `wallet:sendEth` | `accountIndex, to, amount` | `TransactionReceipt` | Отправка ETH (EIP-1559) | [[frontend/screens/send\|Send]] |
| `wallet:estimateEthGas` | `to, amount` | `{gasLimit, maxFeePerGas, ...}` | Оценка газа для ETH | [[frontend/screens/send\|Send]] |

### ERC-20

| Канал | Параметры | Возврат | Описание | Экран |
|-------|-----------|---------|----------|-------|
| `wallet:getErc20Meta` | `tokenAddress: string` | `{symbol, name, decimals, address}` | Метаданные токена | [[frontend/screens/send\|Send]] |
| `wallet:getErc20Balance` | `tokenAddress, holderAddress` | `{raw, decimals, formatted}` | Баланс ERC-20 токена | [[frontend/screens/wallet\|Wallet]] |
| `wallet:sendErc20` | `accountIndex, tokenAddress, to, amount` | `TransactionReceipt` | Отправка ERC-20 | [[frontend/screens/send\|Send]] |
| `wallet:estimateErc20Gas` | `tokenAddress, to, amount` | `{gasLimit, maxFeePerGas, ...}` | Оценка газа для ERC-20 | [[frontend/screens/send\|Send]] |

### Транзакции

| Канал | Параметры | Возврат | Описание |
|-------|-----------|---------|----------|
| `wallet:getLocalTransactions` | `address?: string` | `TransactionInfo[]` | Локальный журнал отправленных tx (per-wallet если указан address) |
| `wallet:getIncomingTransactions` | `address, limit?` | `TransactionInfo[]` | Входящие tx через Etherscan API |
| `wallet:getTransactionHistory` | `address: string, limit?: number` | `TransactionInfo[]` | Объединённая история: local (исходящие) + Etherscan (входящие), дедупликация по hash, сортировка по timestamp desc |
| `wallet:getTransactionStatus` | `txHash: string` | `TransactionStatus` | Реальный статус из блокчейна: confirmations, текущий/tx блок, статус |

---

## Типы данных

```typescript
interface TransactionInfo {
  hash: string
  from: string
  to: string
  value: string
  type: 'eth' | 'erc20'
  tokenAddress?: string
  tokenSymbol?: string
  tokenDecimals?: number
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
  blockNumber?: number
  direction?: 'in' | 'out'       // Направление транзакции
  confirmations?: number          // Количество подтверждений
}

interface TransactionStatus {
  confirmations: number    // Количество блоков после tx
  currentBlock: number     // Текущий номер блока
  txBlock: number          // Блок транзакции
  status: 'pending' | 'confirmed' | 'failed'
}
```

---

## См. также

- [[backend/preload|Preload]] — маппинг каналов на electronAPI
- [[frontend/store|Zustand Store]] — какие actions вызывают какие каналы
- [[packages/wallet-core|wallet-core]] — реализация на стороне WalletCore
- [[architecture/data-flow|Поток данных]] — визуализация IPC потока
