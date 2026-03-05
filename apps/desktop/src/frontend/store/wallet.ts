import { create } from 'zustand'
import type { TransactionInfo, TransactionStatus } from '@wallet/wallet-core'

// Re-export types from wallet-core for use in components
export type { TransactionInfo, TransactionStatus } from '@wallet/wallet-core'

interface ElectronAPI {
  // Auth
  hasPassword: () => Promise<boolean>
  setPassword: (password: string) => Promise<void>
  checkPassword: (password: string) => Promise<boolean>

  // Multi-wallet
  listWallets: () => Promise<Array<{ id: string; name: string; address: string; createdAt: number }>>
  createNewWallet: (name: string) => Promise<{ id: string; name: string; address: string; seedPhrase: string }>
  importNewWallet: (name: string, seedPhrase: string) => Promise<{ id: string; name: string; address: string }>
  selectWallet: (walletId: string) => Promise<{ id: string; name: string; address: string }>
  deleteWallet: (walletId: string) => Promise<void>
  getActiveWalletId: () => Promise<string | null>

  // Wallet operations
  hasWallet: () => Promise<boolean>
  createWallet: () => Promise<string>
  importWallet: (seedPhrase: string) => Promise<void>
  getAddress: (index?: number) => Promise<string>
  getEthBalance: (address: string) => Promise<any>
  sendEth: (accountIndex: number, to: string, amount: string) => Promise<any>
  getErc20Meta: (tokenAddress: string) => Promise<any>
  getErc20Balance: (tokenAddress: string, holderAddress: string) => Promise<any>
  sendErc20: (accountIndex: number, tokenAddress: string, to: string, amount: string) => Promise<any>
  estimateEthGas: (to: string, amount: string) => Promise<any>
  estimateErc20Gas: (tokenAddress: string, to: string, amount: string) => Promise<any>
  getLocalTransactions: (address?: string) => Promise<any[]>
  getIncomingTransactions: (address: string, limit?: number) => Promise<any[]>
  getTransactionHistory: (address: string, limit?: number) => Promise<TransactionInfo[]>
  getTransactionStatus: (txHash: string) => Promise<TransactionStatus>
  getSeedPhrase: () => Promise<string>
  resetWallet: () => Promise<void>
  getDiagnostics: () => Promise<{
    etherscanKeyPresent: boolean
    etherscanKeyLength: number
    rpcUrl: string
    whitelistCount: number
    whitelistAddresses: string[]
    logPath: string
  }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

const MMA_TOKEN_ADDRESS = '0xcA82d24A97b33F2d5826575f77fdc8Bdb82FC580'
const MMA_PRICE_USD = 55

// Cache ETH price to avoid CoinGecko 429 rate-limit errors (free tier: ~10-30 req/min)
let _cachedEthPrice: number = 0
let _ethPriceFetchedAt: number = 0
const ETH_PRICE_CACHE_MS = 60_000 // 60 seconds

interface SavedWallet {
  id: string
  name: string
  address: string
  createdAt: number
}

interface WalletState {
  // Auth
  hasPassword: boolean
  isAuthenticated: boolean

  // Multi-wallet
  walletList: SavedWallet[]
  activeWalletId: string | null
  activeWalletName: string | null

  // Current wallet
  isInitialized: boolean
  hasWallet: boolean
  currentAddress: string | null
  seedPhrase: string | null
  ethBalance: string | null
  mmaBalance: string | null
  mmaBalanceUsd: string | null
  ethBalanceUsd: string | null
  totalBalanceUsd: string | null
  isLoading: boolean
  error: string | null

  // Transactions
  transactions: TransactionInfo[]
  isLoadingTransactions: boolean

  // Auth actions
  checkAuth: () => Promise<void>
  setPassword: (password: string) => Promise<void>
  login: (password: string) => Promise<boolean>
  logout: () => void

  // Multi-wallet actions
  loadWalletList: () => Promise<void>
  createNewWallet: (name: string) => Promise<string>
  importNewWallet: (name: string, seedPhrase: string) => Promise<void>
  selectWallet: (walletId: string) => Promise<void>
  deleteWallet: (walletId: string) => Promise<void>

  // Wallet actions
  initialize: () => Promise<void>
  loadBalance: () => Promise<void>
  loadSeedPhrase: () => Promise<void>
  loadTransactions: () => Promise<void>
  reset: () => Promise<void>
}

export const useWalletStore = create<WalletState>((set, get) => ({
  // Initial state
  hasPassword: false,
  isAuthenticated: false,
  walletList: [],
  activeWalletId: null,
  activeWalletName: null,
  isInitialized: false,
  hasWallet: false,
  currentAddress: null,
  seedPhrase: null,
  ethBalance: null,
  mmaBalance: null,
  mmaBalanceUsd: null,
  ethBalanceUsd: null,
  totalBalanceUsd: null,
  isLoading: false,
  error: null,
  transactions: [],
  isLoadingTransactions: false,

  // ─── Auth actions ──────────────────────────
  checkAuth: async () => {
    try {
      const hasPassword = await window.electronAPI.hasPassword()
      set({ hasPassword, isInitialized: true })
    } catch (error) {
      set({ hasPassword: false, isInitialized: true })
    }
  },

  setPassword: async (password: string) => {
    await window.electronAPI.setPassword(password)
    set({ hasPassword: true, isAuthenticated: true })
  },

  login: async (password: string) => {
    const valid = await window.electronAPI.checkPassword(password)
    if (valid) {
      set({ isAuthenticated: true })
    }
    return valid
  },

  logout: () => {
    set({
      isAuthenticated: false,
      hasWallet: false,
      currentAddress: null,
      seedPhrase: null,
      ethBalance: null,
      mmaBalance: null,
      mmaBalanceUsd: null,
    })
  },

  // ─── Multi-wallet actions ──────────────────
  loadWalletList: async () => {
    try {
      const wallets = await window.electronAPI.listWallets()
      const activeId = await window.electronAPI.getActiveWalletId()
      set({ walletList: wallets, activeWalletId: activeId })
    } catch (error) {
      console.error('Failed to load wallet list:', error)
    }
  },

  createNewWallet: async (name: string) => {
    try {
      set({ isLoading: true, error: null })
      const result = await window.electronAPI.createNewWallet(name)

      set({
        hasWallet: true,
        currentAddress: result.address,
        activeWalletId: result.id,
        activeWalletName: result.name,
        isLoading: false,
      })

      get().loadWalletList()
      get().loadBalance()

      return result.seedPhrase
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create wallet',
        isLoading: false,
      })
      throw error
    }
  },

  importNewWallet: async (name: string, seedPhrase: string) => {
    try {
      set({ isLoading: true, error: null })
      const result = await window.electronAPI.importNewWallet(name, seedPhrase)

      set({
        hasWallet: true,
        currentAddress: result.address,
        activeWalletId: result.id,
        activeWalletName: result.name,
        isLoading: false,
      })

      get().loadWalletList()
      get().loadBalance()
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to import wallet',
        isLoading: false,
      })
      throw error
    }
  },

  selectWallet: async (walletId: string) => {
    try {
      set({ isLoading: true, error: null })
      const result = await window.electronAPI.selectWallet(walletId)

      set({
        hasWallet: true,
        currentAddress: result.address,
        activeWalletId: result.id,
        activeWalletName: result.name,
        seedPhrase: null,
        ethBalance: null,
        mmaBalance: null,
        mmaBalanceUsd: null,
        transactions: [],
        isLoading: false,
      })

      get().loadBalance()
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to select wallet',
        isLoading: false,
      })
      throw error
    }
  },

  deleteWallet: async (walletId: string) => {
    try {
      await window.electronAPI.deleteWallet(walletId)
      const { activeWalletId } = get()

      if (activeWalletId === walletId) {
        set({
          hasWallet: false,
          currentAddress: null,
          activeWalletId: null,
          activeWalletName: null,
          seedPhrase: null,
          ethBalance: null,
          mmaBalance: null,
          mmaBalanceUsd: null,
        })
      }

      get().loadWalletList()
    } catch (error) {
      console.error('Failed to delete wallet:', error)
    }
  },

  // ─── Wallet actions ────────────────────────
  initialize: async () => {
    try {
      set({ isLoading: true, error: null })

      const hasPassword = await window.electronAPI.hasPassword()
      set({ hasPassword })

      const hasWallet = await window.electronAPI.hasWallet()

      if (hasWallet) {
        const address = await window.electronAPI.getAddress(0)
        const activeId = await window.electronAPI.getActiveWalletId()
        const wallets = await window.electronAPI.listWallets()
        const activeWallet = wallets.find((w: any) => w.id === activeId)

        set({
          hasWallet: true,
          currentAddress: address,
          activeWalletId: activeId,
          activeWalletName: activeWallet?.name || 'Wallet',
          walletList: wallets,
          isInitialized: true,
          isLoading: false,
        })

        get().loadBalance()
      } else {
        const wallets = await window.electronAPI.listWallets()
        set({
          hasWallet: false,
          walletList: wallets,
          isInitialized: true,
          isLoading: false,
        })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
        isInitialized: true,
      })
    }
  },

  loadBalance: async () => {
    try {
      const { currentAddress } = get()
      if (!currentAddress) return

      const balance = await window.electronAPI.getEthBalance(currentAddress)
      set({ ethBalance: balance.formatted })

      // Fetch ETH price (with 60s cache to avoid CoinGecko 429)
      let ethPrice = _cachedEthPrice
      if (Date.now() - _ethPriceFetchedAt > ETH_PRICE_CACHE_MS) {
        try {
          const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
          if (res.ok) {
            const data = await res.json()
            ethPrice = data?.ethereum?.usd ?? _cachedEthPrice
            _cachedEthPrice = ethPrice
            _ethPriceFetchedAt = Date.now()
          }
        } catch { /* keep cached value */ }
      }

      const ethUsd = (parseFloat(balance.formatted) * ethPrice).toFixed(2)
      set({ ethBalanceUsd: ethUsd })

      let mmaUsdNum = 0
      try {
        const mmaBalance = await window.electronAPI.getErc20Balance(MMA_TOKEN_ADDRESS, currentAddress)
        const mmaFormatted = parseFloat(mmaBalance.formatted).toFixed(4)
        const mmaUsd = (parseFloat(mmaBalance.formatted) * MMA_PRICE_USD).toFixed(2)
        mmaUsdNum = parseFloat(mmaUsd)
        set({
          mmaBalance: mmaFormatted,
          mmaBalanceUsd: mmaUsd,
        })
      } catch (e) {
        console.error('Failed to load MMA balance:', e)
        set({ mmaBalance: '0', mmaBalanceUsd: '0.00' })
      }

      const totalUsd = (parseFloat(ethUsd) + mmaUsdNum).toFixed(2)
      set({ totalBalanceUsd: totalUsd })
    } catch (error) {
      console.error('Failed to load balance:', error)
    }
  },

  loadSeedPhrase: async () => {
    try {
      const phrase = await window.electronAPI.getSeedPhrase()
      set({ seedPhrase: phrase })
    } catch (e) {
      console.error('Failed to load seed phrase:', e)
    }
  },

  loadTransactions: async () => {
    try {
      const { currentAddress } = get()
      if (!currentAddress) return

      set({ isLoadingTransactions: true })

      // Diagnostics: fetch main-process config and log to DevTools
      try {
        const diag = await window.electronAPI.getDiagnostics()
        console.log(
          '[Diagnostics]',
          'keyPresent:', diag.etherscanKeyPresent,
          '| keyLen:', diag.etherscanKeyLength,
          '| rpc:', diag.rpcUrl,
          '| wl:', diag.whitelistCount,
          '| addrs:', diag.whitelistAddresses,
          '| log:', diag.logPath,
        )
        if (!diag.etherscanKeyPresent) {
          console.error('[Diagnostics] ETHERSCAN_API_KEY is EMPTY — incoming txs will not work')
        }
      } catch (diagErr) {
        console.warn('[Diagnostics] fetch failed:', diagErr)
      }

      const transactions = await window.electronAPI.getTransactionHistory(currentAddress, 50)
      const inCount = transactions.filter((tx: any) => tx.direction === 'in').length
      const outCount = transactions.filter((tx: any) => tx.direction === 'out').length
      console.log('[Store:loadTransactions]', transactions.length, 'total |', inCount, 'in |', outCount, 'out')
      if (inCount === 0 && transactions.length > 0) {
        console.warn('[Store:loadTransactions] Zero incoming -- see [Diagnostics] above')
      }
      set({ transactions, isLoadingTransactions: false })
    } catch (error) {
      console.error('[Store:loadTransactions] ERROR:', error)
      set({ isLoadingTransactions: false })
    }
  },

  reset: async () => {
    try {
      await window.electronAPI.resetWallet()
      set({
        hasWallet: false,
        currentAddress: null,
        seedPhrase: null,
        ethBalance: null,
        mmaBalance: null,
        mmaBalanceUsd: null,
        error: null,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to reset wallet',
      })
      throw error
    }
  },
}))