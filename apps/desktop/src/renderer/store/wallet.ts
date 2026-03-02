import { create } from 'zustand'
import { walletApi } from '../api/walletApi'

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
      const hasPassword = await walletApi.hasPassword()
      set({ hasPassword, isInitialized: true })
    } catch (error) {
      set({ hasPassword: false, isInitialized: true })
    }
  },

  setPassword: async (password: string) => {
    await walletApi.setPassword(password)
    set({ hasPassword: true, isAuthenticated: true })
  },

  login: async (password: string) => {
    const valid = await walletApi.checkPassword(password)
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
      const wallets = await walletApi.listWallets()
      const activeId = await walletApi.getActiveWalletId()
      set({ walletList: wallets, activeWalletId: activeId })
    } catch (error) {
      console.error('Failed to load wallet list:', error)
    }
  },

  createNewWallet: async (name: string) => {
    try {
      set({ isLoading: true, error: null })
      const result = await walletApi.createNewWallet(name)

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
      const result = await walletApi.importNewWallet(name, seedPhrase)

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
      const result = await walletApi.selectWallet(walletId)

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
      await walletApi.deleteWallet(walletId)
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

      const hasPassword = await walletApi.hasPassword()
      set({ hasPassword })

      const hasWallet = await walletApi.hasWallet()

      if (hasWallet) {
        const address = await walletApi.getAddress(0)
        const activeId = await walletApi.getActiveWalletId()
        const wallets = await walletApi.listWallets()
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
        const wallets = await walletApi.listWallets()
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

      const balance = await walletApi.getEthBalance(currentAddress)
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
        const mmaBalance = await walletApi.getErc20Balance(MMA_TOKEN_ADDRESS, currentAddress)
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
      const phrase = await walletApi.getSeedPhrase()
      set({ seedPhrase: phrase })
    } catch (e) {
      console.error('Failed to load seed phrase:', e)
    }
  },

  reset: async () => {
    try {
      await walletApi.resetWallet()
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
