import { create } from 'zustand'

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
  getLocalTransactions: () => Promise<any[]>
  getIncomingTransactions: (address: string, limit?: number) => Promise<any[]>
  getSeedPhrase: () => Promise<string>
  resetWallet: () => Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

const MMA_TOKEN_ADDRESS = '0xcA82d24A97b33F2d5826575f77fdc8Bdb82FC580'
const MMA_PRICE_USD = 55

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

      // Fetch ETH price
      let ethPrice = 0
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
        const data = await res.json()
        ethPrice = data?.ethereum?.usd ?? 0
      } catch { ethPrice = 0 }

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
