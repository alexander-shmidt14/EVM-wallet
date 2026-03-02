---
tags: [backend, security]
related_files:
  - apps/desktop/src/backend/secure-store.ts
last_updated: 2026-03-02
---

# Secure Store

**Раздел:** [[backend/_index|Backend]] · **Главная:** [[_index]]

---

## Файл

`apps/desktop/src/backend/secure-store.ts` (~80 строк)

## Назначение

Зашифрованное key-value хранилище на основе файловой системы. Использует **Electron safeStorage** для шифрования значений через ОС-уровень (Windows DPAPI, macOS Keychain, Linux Secret Service).

## Интерфейс

```typescript
interface SecureStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}
```

> Этот же интерфейс реализован и в `packages/wallet-core/src/secure-store.ts` для абстракции. Desktop приложение подставляет Electron-реализацию, mobile может использовать `react-native-keychain`.

## Как работает

### Запись (`set`)

```
value (string)
  → safeStorage.encryptString(value)
  → Buffer
  → buffer.toString('base64')
  → запись в JSON файл: { key: base64string }
```

### Чтение (`get`)

```
JSON файл: { key: base64string }
  → Buffer.from(base64string, 'base64')
  → safeStorage.decryptString(buffer)
  → value (string)
```

### Удаление (`remove`)

```
delete store[key]
  → перезапись JSON файла
```

## Расположение файла

```
Windows: %APPDATA%/EVM Wallet/secure-store.json
macOS:   ~/Library/Application Support/EVM Wallet/secure-store.json
Linux:   ~/.config/EVM Wallet/secure-store.json
```

Путь: `app.getPath('userData') + '/secure-store.json'`

## Хранимые ключи

| Ключ | Содержимое | Кто пишет |
|------|-----------|-----------|
| `app_password_hash` | SHA-256 хеш пароля | `auth:setPassword` |
| `wallets_v1` | JSON массив кошельков (с seed phrases) | `wallets:create`, `wallets:import` |
| `active_wallet_id` | Строка ID | `wallets:select`, `wallets:create` |
| `seed_v1` | JSON `{phrase: "..."}` — текущий seed | `WalletCore.ensureSeed`, `importSeed` |
| `transactions_v1` | JSON массив TransactionInfo | `WalletCore.saveTransaction` |

## Fallback

Если `safeStorage.isEncryptionAvailable()` возвращает `false` (редкий случай на старых ОС):
- Значения сохраняются **без шифрования** (plain text в JSON)
- Логируется предупреждение

---

## См. также

- [[architecture/security|Безопасность]] — общая модель защиты
- [[backend/electron-main|Electron Main]] — где secureStore инжектируется в WalletCore
- [[packages/wallet-core|wallet-core]] — как WalletCore использует SecureStore
