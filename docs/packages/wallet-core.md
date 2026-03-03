---
tags: [packages, api]
related_files:
  - packages/wallet-core/src/index.ts
  - packages/wallet-core/src/meta.ts
  - packages/wallet-core/src/types.ts
  - packages/wallet-core/src/secure-store.ts
  - packages/wallet-core/src/erc20.abi.json
  - packages/wallet-core/package.json
last_updated: 2026-03-02
---

# wallet-core

**Раздел:** [[packages/_index|Пакеты]] · **Главная:** [[_index]]

---

## Обзор

`@wallet/wallet-core` — основной пакет бизнес-логики. Содержит:
- HD-кошелёк (BIP-39 / BIP-44)
- ETH операции (баланс, отправка, газ)
- ERC-20 операции (баланс, метаданные, отправка)
- Журнал транзакций
- MMA токен метаданные и ценообразование

**Build:** `tsup` → `dist/index.js` + `dist/index.d.ts`
**Зависимости:** `ethers ^6.8`, `cross-fetch`

---

## Класс `WalletCore`

### Конструктор

```typescript
new WalletCore(
  rpcUrl: string,            // JSON-RPC URL (Alchemy, Infura, PublicNode)
  store: SecureStore,         // Реализация хранилища (Electron / RN)
  etherscanApiKey?: string    // Для входящих транзакций
)
```

### Методы

#### Seed / Кошелёк

| Метод | Параметры | Возврат | Описание |
|-------|-----------|---------|----------|
| `ensureSeed(createIfMissing?)` | `boolean` (default: `false`) | `Promise<string>` | Возвращает seed или создаёт новый. Бросает `NO_SEED` / `CORRUPTED_SEED` |
| `importSeed(phrase)` | `string` | `Promise<void>` | Валидирует + сохраняет seed. Бросает `INVALID_SEED` |
| `hasWallet()` | — | `Promise<boolean>` | Проверяет наличие `seed_v1` в store |
| `address(index?)` | `number` (default: `0`) | `Promise<string>` | BIP-44 derive: `m/44'/60'/0'/0/{index}` |
| `resetWallet()` | — | `Promise<void>` | Удаляет seed + журнал транзакций |

#### ETH

| Метод | Параметры | Возврат | Описание |
|-------|-----------|---------|----------|
| `ethBalance(address)` | `string` | `Promise<EthBalance>` | `{wei, eth, formatted}` |
| `sendEth(idx, to, amount)` | `number, string, string` | `Promise<TransactionReceipt>` | EIP-1559, сохраняет tx в журнал |
| `estimateEthGas(to, amount)` | `string, string` | `Promise<GasEstimate>` | Gas limit + fee data |

#### ERC-20

| Метод | Параметры | Возврат | Описание |
|-------|-----------|---------|----------|
| `token(address)` | `string` | `Contract` | Инстанс ERC-20 контракта |
| `erc20Meta(address)` | `string` | `Promise<TokenInfo>` | `{symbol, name, decimals, address}` |
| `erc20Balance(token, holder)` | `string, string` | `Promise<TokenBalance>` | `{raw, decimals, formatted}` |
| `erc20Transfer(idx, token, to, amount)` | `number, string, string, string` | `Promise<TransactionReceipt>` | EIP-1559 transfer |
| `estimateErc20Gas(token, to, amount)` | `string, string, string` | `Promise<GasEstimate>` | Gas estimation |

#### Транзакции

| Метод | Параметры | Возврат | Описание |
|-------|-----------|---------|----------|
| `getLocalTransactions(address?)` | `string?` | `Promise<TransactionInfo[]>` | Локальный журнал. Per-wallet если указан address, иначе legacy `transactions_v1` |
| `getIncomingTransactions(addr, limit?)` | `string, number` | `Promise<TransactionInfo[]>` | Etherscan API (входящие) |
| `getTransactionHistory(address, limit?)` | `string, number` | `Promise<TransactionInfo[]>` | Объединённая история: local + incoming, дедупликация по hash, sorted by timestamp desc |
| `getTransactionStatus(txHash)` | `string` | `Promise<TransactionStatus>` | Реальные данные из блокчейна: receipt + blockNumber → confirmations |

---

## Типы

```typescript
interface EthBalance {
  wei: string
  eth: string
  formatted: string       // parseFloat(eth).toFixed(6)
}

interface TokenBalance {
  raw: string             // BigInt как строка
  decimals: number
  formatted: string
}

interface TokenInfo {
  symbol: string
  name: string
  decimals: number
  address: string
}

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

interface SecureStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}
```

---

## MMA Token (`meta.ts`)

### Константы

| Константа | Значение |
|-----------|---------|
| `MMA_TOKEN_ADDRESS` | `0xcA82d24A97b33F2d5826575f77fdc8Bdb82FC580` |
| `MMA_TOKEN_SYMBOL` | `MMA` |
| `MMA_TOKEN_NAME` | `MMA Token` |
| `MMA_TOKEN_DECIMALS` | `18` |
| `MMA_PRICE_USD` | `55` (захардкожена) |

### Утилиты

| Функция | Описание |
|---------|----------|
| `getMmaPrice()` | Возвращает `55` (фикс.) |
| `getEthPrice()` | CoinGecko API → ETH/USD |
| `coingeckoUsdByContract(addr)` | CoinGecko API → цена токена по адресу |
| `formatTokenAmount(raw, decimals, maxDecimals?)` | BigInt → человекочитаемый формат |
| `parseTokenAmount(human, decimals)` | Человекочитаемый → BigInt строка |
| `trustWalletIcon(token)` | URL иконки из TrustWallet assets |
| `coingeckoIcon(coingeckoId)` | URL иконки из CoinGecko |

---

## Хранение в secure store

| Ключ | Формат | Описание |
|------|--------|----------|
| `seed_v1` | `{"phrase": "word1 word2 ..."}` | BIP-39 мнемоника |
| `transactions_v1` | `TransactionInfo[]` JSON | Журнал транзакций (legacy, глобальный) |
| `transactions_v1_{address}` | `TransactionInfo[]` JSON | Журнал транзакций per-wallet (новый формат) |

---

## См. также

- [[backend/ipc-reference|Справочник IPC]] — как main.ts вызывает WalletCore
- [[backend/secure-store|Secure Store]] — реализация SecureStore для Electron
- [[architecture/data-flow|Поток данных]] — WalletCore в контексте приложения
- [[architecture/security|Безопасность]] — как хранится seed
