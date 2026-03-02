/**
 * walletApi.ts
 *
 * Front-end API abstraction layer.
 *
 * This module is the single point of contact between the React renderer and
 * the back-end (Electron main process or standalone API server).
 *
 * • When running inside Electron the preload script injects `window.electronAPI`
 *   and every call is routed through Electron's IPC bridge.
 *
 * • When running as a plain website (npm run dev:web) `window.electronAPI` is
 *   not present, so every call falls back to an HTTP POST request to the local
 *   API server (default: http://127.0.0.1:3001).
 *   Start the API server with `npm run start:api` before launching the browser.
 *
 * The back-end URL can be overridden at build time via the VITE_API_URL env var.
 */

// ---------------------------------------------------------------------------
// Type declarations
// ---------------------------------------------------------------------------

interface ElectronAPI {
  hasPassword: () => Promise<boolean>
  setPassword: (password: string) => Promise<void>
  checkPassword: (password: string) => Promise<boolean>
  listWallets: () => Promise<Array<{ id: string; name: string; address: string; createdAt: number }>>
  createNewWallet: (name: string) => Promise<{ id: string; name: string; address: string; seedPhrase: string }>
  importNewWallet: (name: string, seedPhrase: string) => Promise<{ id: string; name: string; address: string }>
  selectWallet: (walletId: string) => Promise<{ id: string; name: string; address: string }>
  deleteWallet: (walletId: string) => Promise<void>
  getActiveWalletId: () => Promise<string | null>
  hasWallet: () => Promise<boolean>
  getAddress: (index?: number) => Promise<string>
  getEthBalance: (address: string) => Promise<any>
  sendEth: (accountIndex: number, to: string, amount: string) => Promise<any>
  getErc20Meta: (tokenAddress: string) => Promise<any>
  getErc20Balance: (tokenAddress: string, holderAddress: string) => Promise<any>
  sendErc20: (accountIndex: number, tokenAddress: string, to: string, amount: string) => Promise<any>
  estimateEthGas: (to: string, amount: string) => Promise<any>
  estimateErc20Gas: (tokenAddress: string, to: string, amount: string) => Promise<any>
  getLocalTransactions: () => Promise<any[]>
  getIncomingTransactions: (address: string, limit?: number) => Promise<any[]>
  getSeedPhrase: () => Promise<string>
  resetWallet: () => Promise<void>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
  interface ImportMeta {
    env?: Record<string, string | undefined>
  }
}

// ---------------------------------------------------------------------------
// Transport detection
// ---------------------------------------------------------------------------

/** Returns true when the code runs inside an Electron renderer. */
const isElectron = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.electronAPI !== 'undefined'

/** Shortcut to the Electron IPC bridge injected by preload.ts. */
const electron = (): ElectronAPI => window.electronAPI as ElectronAPI

// ---------------------------------------------------------------------------
// HTTP transport (used when running as a web app)
// ---------------------------------------------------------------------------

const API_BASE: string =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
  'http://127.0.0.1:3001'

async function httpPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? null),
  })
  if (!res.ok) {
    let msg = res.statusText
    try {
      const json = await res.json()
      if (json?.error) msg = json.error
    } catch {
      // ignore
    }
    throw new Error(msg)
  }
  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Unified wallet API
// ---------------------------------------------------------------------------

export const walletApi = {
  // ── Auth ─────────────────────────────────────────────────────────────────
  hasPassword: (): Promise<boolean> =>
    isElectron()
      ? electron().hasPassword()
      : httpPost<boolean>('/api/auth/hasPassword'),

  setPassword: (password: string): Promise<void> =>
    isElectron()
      ? electron().setPassword(password)
      : httpPost<void>('/api/auth/setPassword', { password }),

  checkPassword: (password: string): Promise<boolean> =>
    isElectron()
      ? electron().checkPassword(password)
      : httpPost<boolean>('/api/auth/checkPassword', { password }),

  // ── Multi-wallet ──────────────────────────────────────────────────────────
  listWallets: (): Promise<Array<{ id: string; name: string; address: string; createdAt: number }>> =>
    isElectron()
      ? electron().listWallets()
      : httpPost('/api/wallets/list'),

  createNewWallet: (name: string): Promise<{ id: string; name: string; address: string; seedPhrase: string }> =>
    isElectron()
      ? electron().createNewWallet(name)
      : httpPost('/api/wallets/create', { name }),

  importNewWallet: (name: string, seedPhrase: string): Promise<{ id: string; name: string; address: string }> =>
    isElectron()
      ? electron().importNewWallet(name, seedPhrase)
      : httpPost('/api/wallets/import', { name, seedPhrase }),

  selectWallet: (walletId: string): Promise<{ id: string; name: string; address: string }> =>
    isElectron()
      ? electron().selectWallet(walletId)
      : httpPost('/api/wallets/select', { walletId }),

  deleteWallet: (walletId: string): Promise<void> =>
    isElectron()
      ? electron().deleteWallet(walletId)
      : httpPost<void>('/api/wallets/delete', { walletId }),

  getActiveWalletId: (): Promise<string | null> =>
    isElectron()
      ? electron().getActiveWalletId()
      : httpPost('/api/wallets/active'),

  // ── Wallet operations ────────────────────────────────────────────────────
  hasWallet: (): Promise<boolean> =>
    isElectron()
      ? electron().hasWallet()
      : httpPost<boolean>('/api/wallet/hasWallet'),

  getAddress: (index?: number): Promise<string> =>
    isElectron()
      ? electron().getAddress(index)
      : httpPost<string>('/api/wallet/address', { index }),

  getEthBalance: (address: string): Promise<any> =>
    isElectron()
      ? electron().getEthBalance(address)
      : httpPost('/api/wallet/ethBalance', { address }),

  sendEth: (accountIndex: number, to: string, amount: string): Promise<any> =>
    isElectron()
      ? electron().sendEth(accountIndex, to, amount)
      : httpPost('/api/wallet/sendEth', { accountIndex, to, amount }),

  getErc20Meta: (tokenAddress: string): Promise<any> =>
    isElectron()
      ? electron().getErc20Meta(tokenAddress)
      : httpPost('/api/wallet/erc20Meta', { tokenAddress }),

  getErc20Balance: (tokenAddress: string, holderAddress: string): Promise<any> =>
    isElectron()
      ? electron().getErc20Balance(tokenAddress, holderAddress)
      : httpPost('/api/wallet/erc20Balance', { tokenAddress, holderAddress }),

  sendErc20: (accountIndex: number, tokenAddress: string, to: string, amount: string): Promise<any> =>
    isElectron()
      ? electron().sendErc20(accountIndex, tokenAddress, to, amount)
      : httpPost('/api/wallet/sendErc20', { accountIndex, tokenAddress, to, amount }),

  estimateEthGas: (to: string, amount: string): Promise<any> =>
    isElectron()
      ? electron().estimateEthGas(to, amount)
      : httpPost('/api/wallet/estimateEthGas', { to, amount }),

  estimateErc20Gas: (tokenAddress: string, to: string, amount: string): Promise<any> =>
    isElectron()
      ? electron().estimateErc20Gas(tokenAddress, to, amount)
      : httpPost('/api/wallet/estimateErc20Gas', { tokenAddress, to, amount }),

  getLocalTransactions: (): Promise<any[]> =>
    isElectron()
      ? electron().getLocalTransactions()
      : httpPost('/api/wallet/localTransactions'),

  getIncomingTransactions: (address: string, limit?: number): Promise<any[]> =>
    isElectron()
      ? electron().getIncomingTransactions(address, limit)
      : httpPost('/api/wallet/incomingTransactions', { address, limit }),

  getSeedPhrase: (): Promise<string> =>
    isElectron()
      ? electron().getSeedPhrase()
      : httpPost<string>('/api/wallet/seedPhrase'),

  resetWallet: (): Promise<void> =>
    isElectron()
      ? electron().resetWallet()
      : httpPost<void>('/api/wallet/reset', {}),
}
