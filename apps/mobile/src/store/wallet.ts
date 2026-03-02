import { create } from 'zustand'
import { walletCore } from '../core'
import { MMA_TOKEN_ADDRESS, MMA_PRICE_USD } from '@wallet/wallet-core'

interface WalletState {
  isInitialized: boolean
  hasWallet: boolean
  currentAddress: string | null
  ethBalance: string | null
  mmaBalance: string | null
  mmaBalanceUsd: string | null
  isLoading: boolean
  error: string | null
  
  // Actions
  initialize: () => Promise<void>
  createWallet: () => Promise<string>
  importWallet: (phrase: string) => Promise<void>
  loadBalance: () => Promise<void>
  reset: () => Promise<void>
}

export const useWalletStore = create<WalletState>((set, get) => ({
  isInitialized: false,
  hasWallet: false,
  currentAddress: null,
  ethBalance: null,
  mmaBalance: null,
  mmaBalanceUsd: null,
  isLoading: false,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null })
      
      const hasWallet = await walletCore.hasWallet()
      
      if (hasWallet) {
        const address = await walletCore.address(0)
        set({ 
          hasWallet: true, 
          currentAddress: address,
          isInitialized: true,
          isLoading: false 
        })
        
        // Загружаем баланс в фоне
        get().loadBalance()
      } else {
        set({ 
          hasWallet: false, 
          isInitialized: true,
          isLoading: false 
        })
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
        isInitialized: true
      })
    }
  },

  createWallet: async () => {
    try {
      set({ isLoading: true, error: null })
      
      const phrase = await walletCore.ensureSeed(true)
      const address = await walletCore.address(0)
      
      set({ 
        hasWallet: true,
        currentAddress: address,
        isLoading: false 
      })
      
      get().loadBalance()
      
      return phrase
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create wallet',
        isLoading: false 
      })
      throw error
    }
  },

  importWallet: async (phrase: string) => {
    try {
      set({ isLoading: true, error: null })
      
      await walletCore.importSeed(phrase)
      const address = await walletCore.address(0)
      
      set({ 
        hasWallet: true,
        currentAddress: address,
        isLoading: false 
      })
      
      get().loadBalance()
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to import wallet',
        isLoading: false 
      })
      throw error
    }
  },

  loadBalance: async () => {
    try {
      const { currentAddress } = get()
      if (!currentAddress) return
      
      // Load ETH balance
      const balance = await walletCore.ethBalance(currentAddress)
      set({ ethBalance: balance.formatted })

      // Load MMA token balance
      try {
        const mmaBalance = await walletCore.erc20Balance(MMA_TOKEN_ADDRESS, currentAddress)
        const mmaFormatted = parseFloat(mmaBalance.formatted).toFixed(4)
        const mmaUsd = (parseFloat(mmaBalance.formatted) * MMA_PRICE_USD).toFixed(2)
        set({
          mmaBalance: mmaFormatted,
          mmaBalanceUsd: mmaUsd
        })
      } catch (e) {
        console.error('Failed to load MMA balance:', e)
        set({ mmaBalance: '0', mmaBalanceUsd: '0.00' })
      }
    } catch (error) {
      console.error('Failed to load balance:', error)
    }
  },

  reset: async () => {
    try {
      await walletCore.resetWallet()
      set({ 
        hasWallet: false,
        currentAddress: null,
        ethBalance: null,
        mmaBalance: null,
        mmaBalanceUsd: null,
        error: null
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to reset wallet'
      })
      throw error
    }
  }
}))
