---
tags: [backend, transactions]
related_files:
  - packages/wallet-core/src/index.ts
  - apps/desktop/src/backend/main.ts
  - apps/desktop/src/frontend/screens/WalletScreen.tsx
  - apps/desktop/src/frontend/store/wallet.ts
last_updated: 2026-03-03
---

# История транзакций

**Раздел:** [[backend/_index|Backend]] · **Главная:** [[_index]]

---

## Обзор

Компонент **WalletScreen** отображает историю транзакций: как исходящие (локальные), так и **входящие** (из блокчейна). Входящие транзакции загружаются через **Etherscan API** (`txlist` для ETH и `tokentx` для ERC-20).

---

## Архитектура

### Источники транзакций

| Источник | Тип | Как получается | Условие |
|---------|-----|----------------|---------|
| **Локальные** | `out` (исходящие) | `getLocalTransactions()` | Всегда доступны (хранятся в localStorage) |
| **Входящие** | `in` | `getIncomingTransactions()` (Etherscan API) | Требует `ETHERSCAN_API_KEY` |

### Поток данных

```
WalletScreen (React)
    ↓
useWalletStore.loadTransactions()
    ↓
window.electronAPI.getTransactionHistory(address)
    ↓
main.ts: ipcMain.handle('wallet:getTransactionHistory')
    ↓
WalletCore.getTransactionHistory(address)
    ├─ getLocalTransactions(address)      // Исходящие
    └─ getIncomingTransactions(address)   // Входящие из Etherscan
    ↓
merge + deduplicate + sort by timestamp desc
    ↓
TransactionInfo[] → WalletScreen → TransactionItem
```

---

## Критически важное: `direction` поле

### Проблема

Без явно установленного поля `direction` входящие транзакции **отображаются неправильно**:

```tsx
// TransactionItem.tsx линия 21-23
const isOutgoing =
  tx.direction === 'out' ||
  tx.from.toLowerCase() === currentAddress.toLowerCase()
```

Если `direction` не установлена, компонент использует fallback-логику через `from`, что приводит к неправильному отображению входящих транзакций как исходящих.

### Решение

В методе `WalletCore.getIncomingTransactions()` **при маппинге результатов Etherscan API обязательно устанавливается `direction: 'in'`**:

```typescript
// packages/wallet-core/src/index.ts линия 581-591
return data.result
  .filter((tx: any) => tx.to?.toLowerCase() === address.toLowerCase())
  .map((tx: any): TransactionInfo => ({
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: formatEther(tx.value),
    type: 'eth',
    timestamp: parseInt(tx.timeStamp) * 1000,
    status: tx.txreceipt_status === '1' ? 'confirmed' : 'failed',
    blockNumber: parseInt(tx.blockNumber),
    direction: 'in'  // ← КРИТИЧНО!
  }))
```

---

## IPC Каналы

### `wallet:getTransactionHistory` (основной)

**Получает объединённую историю транзакций:**

```ts
interface Params {
  address: string     // Адрес кошелька
  limit?: number      // Макс кол-во (default 50)
}

interface Response {
  TransactionInfo[]   // Отсортировано по timestamp DESC
}
```

**Что он делает:**

1. ✅ Получает локальные (исходящие) транзакции из хранилища
2. ✅ Получает входящие транзакции из Etherscan API (если доступно)
3. ✅ Объединяет и дедупликирует по `hash`
4. ✅ Сортирует по timestamp DESC (новые первыми)
5. ✅ Возвращает до `limit` записей

```typescript
async getTransactionHistory(address: string, limit = 50): Promise<TransactionInfo[]> {
  // 1. Получаем локальные (исходящие) транзакции
  const local = await this.getLocalTransactions(address)
  const localWithDir = local.map(tx => ({ ...tx, direction: (tx.direction || 'out') as 'in' | 'out' }))

  // 2. Получаем входящие через Etherscan:
  //    - ETH: action=txlist
  //    - ERC-20: action=tokentx (через whitelist)
  const incoming = await this.getIncomingTransactions(address, limit)
  const incomingWithDir = incoming.map(tx => ({ ...tx, direction: 'in' as const }))

  // 3. Merge + deduplicate by stable key (hash + token/log details for ERC-20)
  const seen = new Set<string>()
  const merged: TransactionInfo[] = []

  for (const tx of [...localWithDir, ...incomingWithDir]) {
    if (!seen.has(tx.hash)) {
      seen.add(tx.hash)
      merged.push(tx)
    }
  }

  // 4. Sort by timestamp descending (newest first)
  merged.sort((a, b) => b.timestamp - a.timestamp)

  return merged.slice(0, limit)
}
```

### `wallet:getIncomingTransactions`

**Получает входящие транзакции из Etherscan:**

```ts
interface Params {
  address: string     // Адрес кошелька
  limit?: number      // Макс кол-во (default 50)
}

interface Response {
  TransactionInfo[]   // С direction: 'in'
}
```

**Требования:**

- ⚠️ **`ETHERSCAN_API_KEY` обязателен** — без него возвращает `[]`
- Фильтрует только транзакции где `to === address`
- Поддерживает **ETH + ERC-20 incoming**:
  - ETH через `action=txlist`
  - ERC-20 через `action=tokentx`
- ERC-20 ограничены whitelist (`INCOMING_ERC20_WHITELIST`), по умолчанию — MMA token

```typescript
async getIncomingTransactions(address: string, limit = 50): Promise<TransactionInfo[]> {
  if (!this.etherscanApiKey) {
    return []  // ← Если ключа нет, входящие транзакции недоступны
  }

  const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=${this.etherscanApiKey}`
  
  const response = await fetch(url)
  const data = await response.json()
  
  if (data.status !== '1' || !Array.isArray(data.result)) {
    return []
  }

  return data.result
    .filter((tx: any) => tx.to?.toLowerCase() === address.toLowerCase())  // Входящие
    .map((tx: any): TransactionInfo => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: formatEther(tx.value),
      type: 'eth',
      timestamp: parseInt(tx.timeStamp) * 1000,
      status: tx.txreceipt_status === '1' ? 'confirmed' : 'failed',
      blockNumber: parseInt(tx.blockNumber),
      direction: 'in'  // ← Явно устанавливаем входящее направление!
    }))
}
```

### `wallet:getLocalTransactions`

**Получает локальные транзакции (только исходящие):**

```ts
// Хранятся в: transactions_v1_{address}
// Используется для транзакций которые мы отправили
```

---

## Переменные окружения

| Переменная | Обязательна | По умолчанию | Описание |
|-----------|-------------|---------|----------|
| `ETHERSCAN_API_KEY` | ❌ Нет | `undefined` | API ключ Etherscan для входящих транзакций |

### Где взять ключ

1. Перейти на https://etherscan.io/apis
2. Создать аккаунт и создать новый API ключ
3. Добавить в `.env` (локальная разработка) или в GitHub Actions Secrets (для CI installer):

```env
ETHERSCAN_API_KEY=YOUR_API_KEY_HERE
INCOMING_ERC20_WHITELIST=0xcA82d24A97b33F2d5826575f77fdc8Bdb82FC580
```

> ⚠️ Если ключ не установлен, **входящие транзакции не будут отображаться**, но приложение будет работать нормально (покажет только исходящие).

---

## Тестирование

### Unit тесты

Файл: `apps/desktop/src/__tests__/TransactionHistory.test.tsx`

**Что тестируется:**

```tsx
// Входящая транзакция
const mockIncomingTx: TransactionInfo = {
  hash: '0xdef789...',
  from: '0x3333...',
  to: '0x1111...',      // текущий адрес
  value: '1.0',
  direction: 'in',      // ← Явно входящая
  status: 'confirmed',
  // ...
}

// Проверяем отображение
it('renders incoming ETH transaction correctly', () => {
  render(
    <TransactionItem
      tx={mockIncomingTx}
      currentAddress={CURRENT_ADDRESS}
      onClick={jest.fn()}
    />
  )
  expect(screen.getByText('Received ETH')).toBeInTheDocument()
  expect(screen.getByText(/\+1\.0/)).toBeInTheDocument()
})
```

### CI проверка

В GitHub Actions (`ci.yml`):

```yaml
- name: Run Transaction History tests explicitly
  run: pnpm -F @app/desktop test -- TransactionHistory.test.tsx --ci --verbose
```

---

## Типы данных

```typescript
interface TransactionInfo {
  hash: string             // 0x... tx hash
  from: string             // Отправитель
  to: string               // Получатель
  value: string            // Сумма в ETH/токенах
  type: 'eth' | 'erc20'    // Тип (пока только ETH для Etherscan)
  tokenAddress?: string    // Для ERC-20
  tokenSymbol?: string     // 'MMA', 'USDC', и т.д.
  tokenDecimals?: number   // Кол-во decimals токена
  timestamp: number        // Unix timestamp * 1000
  status: 'pending' | 'confirmed' | 'failed'
  blockNumber?: number     // Номер блока
  direction?: 'in' | 'out' // ← КРИТИЧЕСКИ: должна быть установлена!
  confirmations?: number   // Кол-во подтверждений
}

interface TransactionStatus {
  confirmations: number    // Блоков после tx
  currentBlock: number     // Текущий блок
  txBlock: number | null   // Блок где произошла tx
  status: 'pending' | 'confirmed' | 'failed'
}
```

---

## Частые ошибки

### ❌ Входящие транзакции не появляются

**Причина 1:** `ETHERSCAN_API_KEY` не передан в runtime приложения

```bash
# Локально (dev):
echo $ETHERSCAN_API_KEY

# Для Windows CI installer:
# проверьте, что secret ETHERSCAN_API_KEY задан в GitHub Actions,
# т.к. .env.example не подхватывается установленным .exe
```

**Причина 2:** API ключ неверный

```bash
# Проверить на Etherscan:
curl 'https://api.etherscan.io/api?module=account&action=txlist&address=0x...&apikey=YOUR_KEY'
# Должно вернуться: {"status": "1", "result": [...]}
```

### ❌ Входящие транзакции показываются как исходящие

**Причина:** В `getIncomingTransactions` не установлено `direction: 'in'`

```typescript
// ❌ Неправильно
return incoming.map(tx => ({
  ...tx,
  // direction не установлена!
}))

// ✅ Правильно
return incoming.map(tx => ({
  ...tx,
  direction: 'in'  // Явно устанавливаем!
}))
```

---

## Оптимизация

### Кэширование Etherscan результатов

Текущая реализация запрашивает Etherscan каждый раз при загрузке. Для оптимизации можно:

```typescript
// Добавить кэш на уровне WalletCore
private _txCache: Map<string, { data: TransactionInfo[], time: number }> = new Map()
private readonly TX_CACHE_TTL = 30000 // 30 сек

async getIncomingTransactions(address: string, limit = 50): Promise<TransactionInfo[]> {
  const cached = this._txCache.get(address)
  if (cached && Date.now() - cached.time < this.TX_CACHE_TTL) {
    return cached.data
  }
  
  // ... fetch from Etherscan ...
  
  this._txCache.set(address, { data: results, time: Date.now() })
  return results
}
```

---

## См. также

- [[backend/ipc-reference|Справочник IPC]] — полный список всех каналов
- [[frontend/screens/wallet|WalletScreen]] — как используются транзакции в UI
- [[frontend/store|Zustand Store]] — как загружаются транзакции в хранилище
- [[packages/wallet-core|wallet-core]] — бизнес-логика WalletCore
- [[guides/env-variables|Переменные окружения]] — где задать ETHERSCAN_API_KEY
