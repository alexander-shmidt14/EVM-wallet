---
tags: [architecture, security]
related_files:
  - apps/desktop/src/backend/secure-store.ts
  - apps/desktop/src/backend/main.ts
  - apps/desktop/src/backend/preload.ts
last_updated: 2026-03-02
---

# Безопасность

**Раздел:** [[architecture/_index|Архитектура]] · **Главная:** [[_index]]

---

## Модель безопасности

EVM Wallet — **non-custodial** кошелёк. Приватные ключи и seed phrases **никогда не покидают устройство** пользователя.

### 1. Шифрование хранилища

| Механизм | Описание |
|----------|----------|
| **Electron safeStorage** | OS-level шифрование: Windows DPAPI, macOS Keychain, Linux Secret Service |
| **Файл** | `%APPDATA%/EVM Wallet/secure-store.json` |
| **Формат** | JSON с Base64-закодированными зашифрованными значениями |
| **Fallback** | Если `safeStorage.isEncryptionAvailable() === false` → plain text (legacy OS) |

```
secureStore.set("seed_v1", jsonString)
  → safeStorage.encryptString(jsonString)
  → Buffer → Base64 string
  → запись в secure-store.json
```

### 2. Изоляция процессов

| Настройка | Значение | Почему |
|-----------|----------|--------|
| `nodeIntegration` | `false` | Renderer не может использовать `require()` |
| `contextIsolation` | `true` | `preload.ts` работает в отдельном контексте |
| `contextBridge` | `electronAPI` | Единственный мост — набор явно экспортированных функций |

Renderer видит **только** `window.electronAPI` с ограниченным набором методов. Прямого доступа к файловой системе, `child_process`, `crypto` нет.

### 3. Аутентификация

- Пароль приложения хешируется через **SHA-256** и сохраняется в secure store
- При логине: `SHA-256(input) === stored_hash`
- Пароль в plaintext **не хранится** нигде
- Нет ограничения на попытки ввода (TODO: rate limiting)

### 4. Seed Phrases

- Генерация: `HDNodeWallet.createRandom()` (ethers v6, BIP-39)
- Деривация адресов: `m/44'/60'/0'/0/{index}` (BIP-44)
- Seed хранится в `wallets_v1` (зашифрован через safeStorage)
- Текущий активный seed также в `seed_v1` для быстрого доступа WalletCore
- При удалении кошелька seed удаляется из JSON

### 5. Транзакции

- Подпись: `signer.sendTransaction()` — приватный ключ **никогда** не передаётся наружу
- EIP-1559: используются `maxFeePerGas` + `maxPriorityFeePerGas`
- Gas estimation перед отправкой
- Локальный журнал транзакций (не критичное хранилище)

### 6. Сетевые обращения

| Сервис | Назначение | Данные |
|--------|-----------|--------|
| Alchemy / PublicNode | JSON-RPC | Только public адреса, без ключей |
| Etherscan | Входящие транзакции | Public адрес |
| CoinGecko | Цены ETH/токенов | Нет PII |

> Никакие API не получают приватные ключи, seed phrases или пароль.

---

## Известные ограничения

- [ ] Нет rate limiting на ввод пароля
- [ ] Нет автоблокировки по таймауту
- [ ] safeStorage fallback на plain text в старых ОС
- [ ] Нет CSP header (Content Security Policy) для renderer

---

## См. также

- [[backend/secure-store|Secure Store]] — реализация шифрованного хранилища
- [[architecture/data-flow|Поток данных]] — как данные проходят через слои
- [[backend/electron-main|Electron Main]] — настройки BrowserWindow
