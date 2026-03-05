---
tags: [backend, transactions]
related_files:
  - packages/wallet-core/src/index.ts
  - apps/desktop/src/backend/main.ts
  - apps/desktop/src/backend/preload.ts
  - apps/desktop/src/frontend/screens/WalletScreen.tsx
  - apps/desktop/src/frontend/store/wallet.ts
last_updated: 2026-03-05
---

# История транзакций

**Раздел:** [[backend/_index|Backend]] · **Главная:** [[_index]]

---

## Обзор

Компонент **WalletScreen** отображает историю транзакций: как исходящие (локальные), так и **входящие** (из блокчейна). Входящие транзакции загружаются через **Etherscan API V2** (`txlist` для ETH и `tokentx` для ERC-20).

> ⚠️ **Важно:** С 2025-08-15 Etherscan отключил V1 API. Проект мигрирован на **V2** (`api.etherscan.io/v2/api` + `chainid=1`).

---

## Архитектура

### Источники транзакций

| Источник | Тип | Как получается | Условие |
|---------|-----|----------------|---------|
| **Локальные** | `out` (исходящие) | `getLocalTransactions()` | Всегда доступны (хранятся в secure store) |
| **Входящие** | `in` | `getIncomingTransactions()` (Etherscan V2 API) | Требует `ETHERSCAN_API_KEY` |

### Поток данных

```
WalletScreen (React)
    ↓
useWalletStore.loadTransactions()
    ↓
window.electronAPI.getDiagnostics()      // DevTools: ключ, RPC, whitelist
window.electronAPI.testEtherscan(addr)   // DevTools: single API test call
window.electronAPI.getTransactionHistory(address)
    ↓
main.ts: ipcMain.handle('wallet:getTransactionHistory')
    ↓
WalletCore.getTransactionHistory(address)
    ├─ getLocalTransactions(address)      // Исходящие (secure store)
    └─ getIncomingTransactions(address)   // Входящие из Etherscan V2
    ↓
merge + deduplicate (txDedupKey) + sort by timestamp desc
    ↓
TransactionInfo[] → WalletScreen → TransactionItem
```

### Ключевые технические решения (v1.1.6+)

| Решение | Зачем |
|---------|-------|
| `import fetch from 'cross-fetch'` (явный) | Polyfill side-effect `import 'cross-fetch/polyfill'` не работает надёжно в esbuild Node.js бандле |
| `URLSearchParams` для URL | Правильное кодирование параметров вместо конкатенации строк |
| `etherscanApiKey.trim()` | Удаляет `\r\n` или пробелы (частая проблема на Windows) |
| `Promise.allSettled` | Одна ошибка (ETH или ERC-20) не убивает оба запроса |
| `WalletLogger` (injectable) | Логи видны в `electron-log` (main.log), а не только в console |
| **Etherscan V2 API** | V1 (`api.etherscan.io/api`) deprecated с 2025-08-15, возвращает `NOTOK` |

---

## Etherscan V2 API Migration

### V1 → V2 Изменения

| Аспект | V1 (deprecated) | V2 (текущий) |
|--------|-----------------|--------------|
| Base URL | `https://api.etherscan.io/api` | `https://api.etherscan.io/v2/api` |
| Chain ID | Не нужен | `chainid=1` (обязателен) |
| API Key | Только для Ethereum | Универсальный для всех 60+ сетей |
| Ответ при V1 | — | `{"status":"0","message":"NOTOK","result":"You are using a deprecated V1 endpoint..."}` |

### Пример URL (V2)

```
https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=0x...&startblock=0&endblock=99999999&page=1&offset=50&sort=desc&apikey=YOUR_KEY
```

### Ссылка

- [Etherscan V2 Migration Guide](https://docs.etherscan.io/v2-migration)

---

## Критически важное: `direction` поле

### Проблема

Без явно установленного поля `direction` входящие транзакции **отображаются неправильно**:

```tsx
// TransactionItem.tsx
const isOutgoing =
  tx.direction === 'out' ||
  tx.from.toLowerCase() === currentAddress.toLowerCase()
```

Если `direction` не установлена, компонент использует fallback-логику через `from`, что приводит к неправильному отображению входящих транзакций как исходящих.

### Решение

В методе `WalletCore.getIncomingTransactions()` **при маппинге результатов Etherscan API обязательно устанавливается `direction: 'in'`** для обоих типов (ETH и ERC-20).

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
2. ✅ Получает входящие транзакции из Etherscan V2 API (если доступно)
3. ✅ Объединяет и дедупликирует по `txDedupKey` (hash + tokenAddress + logIndex)
4. ✅ Сортирует по timestamp DESC (новые первыми)
5. ✅ Логирует через `this.log` (electron-log в desktop)
6. ✅ Возвращает до `limit` записей

```typescript
async getTransactionHistory(address: string, limit = 50): Promise<TransactionInfo[]> {
  // 1. Получаем локальные (исходящие) транзакции
  const local = await this.getLocalTransactions(address)
  const localWithDir = local.map(tx => ({ ...tx, direction: (tx.direction || 'out') as 'in' | 'out' }))

  // 2. Получаем входящие через Etherscan V2:
  //    - ETH: action=txlist
  //    - ERC-20: action=tokentx (через whitelist)
  const incoming = await this.getIncomingTransactions(address, limit)
  const incomingWithDir = incoming.map(tx => ({ ...tx, direction: 'in' as const }))

  this.log.info('[WalletCore:getHistory] local:', localWithDir.length, '| incoming:', incomingWithDir.length)

  // 3. Merge + deduplicate by stable key (hash + token/log details for ERC-20)
  const seen = new Set<string>()
  const merged: TransactionInfo[] = []
  for (const tx of [...localWithDir, ...incomingWithDir]) {
    const key = this.txDedupKey(tx)
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(tx)
    }
  }

  // 4. Sort by timestamp descending (newest first)
  merged.sort((a, b) => b.timestamp - a.timestamp)
  return merged.slice(0, limit)
}
```

### `wallet:getIncomingTransactions`

**Получает входящие транзакции из Etherscan V2:**

```ts
interface Params {
  address: string     // Адрес кошелька
  limit?: number      // Макс кол-во (default 50)
}

interface Response {
  TransactionInfo[]   // С direction: 'in'
}
```

**Реализация:**

- ⚠️ **`ETHERSCAN_API_KEY` обязателен** — без него возвращает `[]`
- Ключ обрезается через `.trim()` при инициализации (защита от `\r\n`)
- Фильтрует только транзакции где `to === address`
- Поддерживает **ETH + ERC-20 incoming**:
  - ETH через `action=txlist`
  - ERC-20 через `action=tokentx`
- ERC-20 ограничены whitelist (`INCOMING_ERC20_WHITELIST`), по умолчанию — MMA token
- URL строится через `URLSearchParams` (защита от encoding-ошибок)
- Запросы ETH и ERC-20 идут **параллельно** через `Promise.allSettled`
- Каждый шаг логируется через `this.log` (injectable logger)

```typescript
async getIncomingTransactions(address: string, limit = 50): Promise<TransactionInfo[]> {
  if (!this.etherscanApiKey) {
    this.log.warn('[WalletCore:getIncoming] ETHERSCAN_API_KEY is not set; incoming transactions disabled')
    return []
  }

  const commonParams = {
    chainid: '1',           // ← Etherscan V2: обязательный параметр
    module: 'account',
    address,
    startblock: '0',
    endblock: '99999999',
    page: '1',
    offset: String(limit),
    sort: 'desc',
    apikey: this.etherscanApiKey,  // ← trimmed в конструкторе
  }

  const ethUrl = 'https://api.etherscan.io/v2/api?' + new URLSearchParams({ ...commonParams, action: 'txlist' })
  const erc20Url = 'https://api.etherscan.io/v2/api?' + new URLSearchParams({ ...commonParams, action: 'tokentx' })

  // Promise.allSettled — одна ошибка не убивает оба запроса
  const [ethResult, erc20Result] = await Promise.allSettled([
    fetch(ethUrl).then(r => r.json()),
    fetch(erc20Url).then(r => r.json()),
  ])

  // Маппинг ETH incoming (direction: 'in')
  // Маппинг ERC-20 incoming (по whitelist, direction: 'in', logIndex для дедупликации)
  // Объединяем: [...incomingEth, ...incomingErc20]
}
```

### `wallet:getDiagnostics` (диагностика)

**Возвращает конфигурацию для отладки в DevTools:**

```ts
interface Response {
  etherscanKeyPresent: boolean
  etherscanKeyLength: number
  etherscanKeyTrimmedLength: number
  rpcUrl: string               // Замаскирован: /v*/***
  whitelistCount: number
  whitelistAddresses: string[] // Первые 10 символов каждого
  logPath: string              // Путь к main.log
}
```

### `wallet:testEtherscan` (тест API)

**Выполняет один тестовый запрос к Etherscan V2 API:**

```ts
interface Params {
  address: string    // Адрес для проверки
}

interface Response {
  ok: boolean               // status === '1'
  status: string            // '0' или '1'
  message: string           // 'OK' или 'NOTOK'
  resultType: string        // 'array' или 'string'
  resultCount: number       // Количество транзакций
  firstResult: object|null  // {hash, from, to} первой tx
  rawResult?: string        // Сообщение об ошибке (если resultType === string)
  error?: string            // Catch ошибка
}
```

### `wallet:getLocalTransactions`

**Получает локальные транзакции (только исходящие):**

```ts
// Хранятся в: transactions_v1_{address}
// Используется для транзакций которые мы отправили
```

---

## Диагностика в DevTools

При каждом вызове `loadTransactions()` в Zustand store автоматически:

1. **`[Diagnostics]`** — логирует `keyPresent`, `keyLen`, `trimmedLen`, `rpc`, `wl`, `addrs`, `log`
2. **`[Etherscan Test]`** — выполняет тестовый запрос к V2 API и логирует полный ответ
3. **`[Store:loadTransactions]`** — `N total | M in | K out`
4. Если `0 in` → `Zero incoming -- see [Diagnostics] above`

### Чтение диагностики

Открыть DevTools (Ctrl+Shift+I) → Console. Пример успешного ответа:

```
[Etherscan Test] { "ok": true, "status": "1", "message": "OK", "resultType": "array", "resultCount": 3, ... }
[Store:loadTransactions] 5 total | 2 in | 3 out
```

Пример ошибки:

```
[Etherscan Test] { "ok": false, "rawResult": "Invalid API Key" }
[Store:loadTransactions] 3 total | 0 in | 3 out
[Store:loadTransactions] Zero incoming -- see [Diagnostics] above
```

---

## Переменные окружения

| Переменная | Обязательна | По умолчанию | Описание |
|-----------|-------------|---------|----------|
| `ETHERSCAN_API_KEY` | ❌ Нет | `undefined` | API ключ Etherscan (единый для V2, все сети) |
| `INCOMING_ERC20_WHITELIST` | ❌ Нет | MMA token | CSV адресов контрактов |

### Где взять ключ

1. Перейти на https://etherscan.io/apis
2. Создать аккаунт и создать новый API ключ (V2 — один ключ на все сети)
3. Добавить в `.env` (локальная разработка) или в GitHub Actions Secrets (для CI installer):

```env
ETHERSCAN_API_KEY=YOUR_API_KEY_HERE
INCOMING_ERC20_WHITELIST=0xcA82d24A97b33F2d5826575f77fdc8Bdb82FC580
```

> ⚠️ Если ключ не установлен, **входящие транзакции не будут отображаться**, но приложение будет работать нормально (покажет только исходящие).

---

## Логирование

### Два уровня логов

| Лог | Где видно | Что содержит |
|-----|-----------|-------------|
| **main.log** | `%APPDATA%/@app/desktop/logs/main.log` | `[WalletCore:getIncoming]`, `[testEtherscan]`, URLs, response shapes |
| **DevTools Console** | Ctrl+Shift+I → Console | `[Diagnostics]`, `[Etherscan Test]`, `[Store:loadTransactions]` |

### Injectable Logger (`WalletLogger`)

```typescript
export interface WalletLogger {
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}
```

Desktop передаёт `electron-log`, mobile использует `console` (default).

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
  type: 'eth' | 'erc20'   // Тип транзакции
  tokenAddress?: string    // Для ERC-20
  tokenSymbol?: string     // 'MMA', 'USDC', и т.д.
  tokenDecimals?: number   // Кол-во decimals токена
  timestamp: number        // Unix timestamp * 1000
  status: 'pending' | 'confirmed' | 'failed'
  blockNumber?: number     // Номер блока
  direction?: 'in' | 'out' // ← КРИТИЧЕСКИ: должна быть установлена!
  confirmations?: number   // Кол-во подтверждений
  logIndex?: number        // Для ERC-20 дедупликации (из Etherscan)
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

### ❌ `NOTOK: You are using a deprecated V1 endpoint`

**Причина:** Используется старый URL `api.etherscan.io/api` (V1).

**Решение:** Обновить URL на `api.etherscan.io/v2/api` и добавить `chainid=1`.

### ❌ Входящие транзакции не появляются (0 in)

**Шаг 1:** Открыть DevTools и проверить `[Etherscan Test]`

| Вывод | Проблема | Решение |
|-------|----------|---------|
| `ok: true, resultCount: 0` | Нет входящих транзакций | Нормально для нового кошелька |
| `ok: false, rawResult: "Invalid API Key"` | Ключ неверный | Пересоздать на etherscan.io |
| `ok: false, rawResult: "...deprecated V1..."` | Старый код | Обновить до V2 API |
| `error: "ETHERSCAN_API_KEY is empty"` | Ключ не вшит в билд | Добавить secret в GitHub Actions |
| `error: "fetch is not a function"` | cross-fetch не работает | Проверить import |

**Шаг 2:** Проверить `main.log`:
```
%APPDATA%/@app/desktop/logs/main.log
```

### ❌ Входящие транзакции показываются как исходящие

**Причина:** В `getIncomingTransactions` не установлено `direction: 'in'`

```typescript
// ✅ Правильно — устанавливать direction: 'in' для всех маппингов
direction: 'in'  // ETH incoming
direction: 'in'  // ERC-20 incoming
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
  
  // ... fetch from Etherscan V2 ...
  
  this._txCache.set(address, { data: results, time: Date.now() })
  return results
}
```

---

## См. также

- [[backend/ipc-reference|Справочник IPC]] — полный список всех каналов (включая `wallet:getDiagnostics`, `wallet:testEtherscan`)
- [[frontend/screens/wallet|WalletScreen]] — как используются транзакции в UI
- [[frontend/store|Zustand Store]] — как загружаются транзакции + диагностика
- [[packages/wallet-core|wallet-core]] — бизнес-логика WalletCore, WalletLogger
- [[guides/env-variables|Переменные окружения]] — где задать ETHERSCAN_API_KEY
