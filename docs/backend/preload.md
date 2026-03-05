---
tags: [backend]
related_files:
  - apps/desktop/src/backend/preload.ts
last_updated: 2026-03-05
---

# Preload

**Раздел:** [[backend/_index|Backend]] · **Главная:** [[_index]]

---

## Файл

`apps/desktop/src/backend/preload.ts` (~76 строк)

## Назначение

Preload-скрипт — мост между Main и Renderer процессами. Использует `contextBridge.exposeInMainWorld` для безопасного экспорта API.

## Маппинг electronAPI → IPC

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  // Auth
  hasPassword:      () => ipcRenderer.invoke('auth:hasPassword'),
  setPassword:      (pw) => ipcRenderer.invoke('auth:setPassword', pw),
  checkPassword:    (pw) => ipcRenderer.invoke('auth:checkPassword', pw),

  // Multi-wallet
  listWallets:      () => ipcRenderer.invoke('wallets:list'),
  createNewWallet:  (name) => ipcRenderer.invoke('wallets:create', name),
  importNewWallet:  (name, seed) => ipcRenderer.invoke('wallets:import', name, seed),
  selectWallet:     (id) => ipcRenderer.invoke('wallets:select', id),
  deleteWallet:     (id) => ipcRenderer.invoke('wallets:delete', id),
  getActiveWalletId:() => ipcRenderer.invoke('wallets:getActiveId'),

  // Wallet operations
  hasWallet:        () => ipcRenderer.invoke('wallet:hasWallet'),
  createWallet:     () => ipcRenderer.invoke('wallet:createWallet'),
  importWallet:     (seed) => ipcRenderer.invoke('wallet:importWallet', seed),
  getAddress:       (idx) => ipcRenderer.invoke('wallet:getAddress', idx),
  getEthBalance:    (addr) => ipcRenderer.invoke('wallet:getEthBalance', addr),
  sendEth:          (idx, to, amt) => ipcRenderer.invoke('wallet:sendEth', idx, to, amt),

  // ERC-20
  getErc20Meta:     (token) => ipcRenderer.invoke('wallet:getErc20Meta', token),
  getErc20Balance:  (token, holder) => ipcRenderer.invoke('wallet:getErc20Balance', token, holder),
  sendErc20:        (idx, token, to, amt) => ipcRenderer.invoke('wallet:sendErc20', idx, token, to, amt),

  // Gas
  estimateEthGas:   (to, amt) => ipcRenderer.invoke('wallet:estimateEthGas', to, amt),
  estimateErc20Gas: (token, to, amt) => ipcRenderer.invoke('wallet:estimateErc20Gas', token, to, amt),

  // Transactions
  getLocalTransactions:    () => ipcRenderer.invoke('wallet:getLocalTransactions'),
  getIncomingTransactions: (addr, limit) => ipcRenderer.invoke('wallet:getIncomingTransactions', addr, limit),
  getTransactionHistory:   (addr, limit) => ipcRenderer.invoke('wallet:getTransactionHistory', addr, limit),
  getTransactionStatus:    (txHash) => ipcRenderer.invoke('wallet:getTransactionStatus', txHash),

  // Seed / Reset
  getSeedPhrase:    () => ipcRenderer.invoke('wallet:getSeedPhrase'),
  resetWallet:      () => ipcRenderer.invoke('wallet:resetWallet'),

  // Updates
  onUpdateProgress: (cb) => ipcRenderer.on('update-progress', (_, p) => cb(p)),

  // Diagnostics (v1.1.6+)
  getDiagnostics:   () => ipcRenderer.invoke('wallet:getDiagnostics'),
  testEtherscan:    (addr) => ipcRenderer.invoke('wallet:testEtherscan', addr),
})
```

## Типизация

```typescript
export type ElectronAPI = typeof electronAPI
```

Renderer использует `window.electronAPI` — тип объявлен глобально в `store/wallet.ts`.

## Безопасность

- `contextBridge` создаёт **копию** объекта, а не ссылку
- Renderer не получает доступа к `ipcRenderer` напрямую
- Каждый метод — обёртка над одним конкретным IPC каналом
- Невозможно вызвать произвольный канал из renderer

---

## См. также

- [[backend/ipc-reference|Справочник IPC]] — полный список каналов
- [[backend/electron-main|Electron Main]] — где каналы обрабатываются
- [[architecture/security|Безопасность]] — принцип contextIsolation
- [[frontend/store|Zustand Store]] — кто вызывает electronAPI из renderer
