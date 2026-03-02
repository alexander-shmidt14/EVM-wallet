---
tags: [architecture]
related_files:
  - apps/desktop/src/frontend/store/wallet.ts
  - apps/desktop/src/backend/main.ts
  - apps/desktop/src/backend/preload.ts
  - packages/wallet-core/src/index.ts
last_updated: 2026-03-02
---

# Поток данных

**Раздел:** [[architecture/_index|Архитектура]] · **Главная:** [[_index]]

---

## Обзор

Данные в EVM Wallet проходят через 4 слоя. Renderer (React) **никогда** не имеет прямого доступа к Node.js или файловой системе — всё проходит через IPC.

## Основной поток

```mermaid
sequenceDiagram
    participant UI as React UI
    participant Store as Zustand Store
    participant IPC as electronAPI (Preload)
    participant Main as Electron Main
    participant Core as WalletCore
    participant Chain as Ethereum

    UI->>Store: вызов action (напр. loadBalance)
    Store->>IPC: window.electronAPI.getEthBalance(address)
    IPC->>Main: ipcRenderer.invoke('wallet:getEthBalance', address)
    Main->>Core: walletCore.ethBalance(address)
    Core->>Chain: provider.getBalance(address(
    Chain-->>Core: BigInt (wei)
    Core-->>Main: { wei, eth, formatted }
    Main-->>IPC: result
    IPC-->>Store: result
    Store->>Store: set({ ethBalance: result.formatted })
    Store-->>UI: React re-render
```

## Поток отправки ETH

```mermaid
sequenceDiagram
    participant UI as SendScreen
    participant Store as Zustand
    participant IPC as electronAPI
    participant Main as main.ts
    participant Core as WalletCore
    participant Chain as Ethereum

    UI->>IPC: estimateEthGas(to, amount)
    IPC->>Main: wallet:estimateEthGas
    Main->>Core: estimateEthGas()
    Core->>Chain: provider.getFeeData() + estimateGas()
    Chain-->>UI: газ + комиссия

    UI->>IPC: sendEth(0, to, amount)
    IPC->>Main: wallet:sendEth
    Main->>Core: sendEth(0, to, amount)
    Core->>Core: derive signer (BIP-44)
    Core->>Chain: signer.sendTransaction(tx)
    Core->>Core: saveTransaction (pending)
    Chain-->>Core: receipt (confirmed/failed)
    Core->>Core: updateTransactionStatus
    Core-->>UI: receipt
```

## Поток аутентификации

```mermaid
flowchart TD
    A[App запуск] --> B{hasPassword?}
    B -- нет --> C[SetPasswordScreen]
    C --> D[auth:setPassword → SHA-256 → secureStore]
    D --> E[WalletSelectScreen]
    B -- да --> F[LoginScreen]
    F --> G{auth:checkPassword}
    G -- верно --> E
    G -- неверно --> F
    E --> H{wallets:list}
    H -- пусто --> I[CreateWallet / ImportWallet]
    H -- есть --> J[wallets:select → WalletScreen]
```

## Поток мульти-кошелька

1. **Создание:** `wallets:create(name)` → `WalletCore.ensureSeed(true)` → генерация BIP-39 → сохранение в `wallets_v1` → `address(0)`
2. **Импорт:** `wallets:import(name, seed)` → `WalletCore.importSeed(seed)` → проверка дубликатов по адресу → сохранение
3. **Переключение:** `wallets:select(id)` → чтение seed из `wallets_v1` → `importSeed` → смена `active_wallet_id`
4. **Удаление:** `wallets:delete(id)` → удаление из JSON → если активный — очистка seed из памяти

## Хранение данных

```
UserData/
└── secure-store.json          # Зашифрованный JSON (Electron safeStorage)
    ├── app_password_hash      # SHA-256 хеш пароля
    ├── wallets_v1             # JSON: [{id, name, seedPhrase, address, createdAt}]
    ├── active_wallet_id       # ID текущего кошелька
    ├── seed_v1                # JSON: {phrase} — текущий seed в памяти WalletCore
    └── transactions_v1        # JSON: [{hash, from, to, value, ...}]
```

> ⚠️ `seedPhrase` хранится **зашифрованным** через `safeStorage` (OS Keychain). Подробнее: [[architecture/security|Безопасность]]

---

## См. также

- [[backend/ipc-reference|Справочник IPC]] — полный список каналов
- [[frontend/store|Zustand Store]] — state и actions
- [[architecture/security|Безопасность]] — модель шифрования
- [[packages/wallet-core|wallet-core]] — API класса WalletCore
