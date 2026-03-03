import { contextBridge, ipcRenderer } from 'electron'

// Define the electron API that will be available to the renderer process
const electronAPI = {
  // Wallet operations
  hasWallet: () => ipcRenderer.invoke('wallet:hasWallet'),
  createWallet: () => ipcRenderer.invoke('wallet:createWallet'),
  importWallet: (seedPhrase: string) => ipcRenderer.invoke('wallet:importWallet', seedPhrase),
  getAddress: (index?: number) => ipcRenderer.invoke('wallet:getAddress', index),
  getEthBalance: (address: string) => ipcRenderer.invoke('wallet:getEthBalance', address),
  sendEth: (accountIndex: number, to: string, amount: string) => 
    ipcRenderer.invoke('wallet:sendEth', accountIndex, to, amount),
  
  // ERC-20 operations
  getErc20Meta: (tokenAddress: string) => ipcRenderer.invoke('wallet:getErc20Meta', tokenAddress),
  getErc20Balance: (tokenAddress: string, holderAddress: string) => 
    ipcRenderer.invoke('wallet:getErc20Balance', tokenAddress, holderAddress),
  sendErc20: (accountIndex: number, tokenAddress: string, to: string, amount: string) => 
    ipcRenderer.invoke('wallet:sendErc20', accountIndex, tokenAddress, to, amount),
  
  // Gas estimation
  estimateEthGas: (to: string, amount: string) => 
    ipcRenderer.invoke('wallet:estimateEthGas', to, amount),
  estimateErc20Gas: (tokenAddress: string, to: string, amount: string) => 
    ipcRenderer.invoke('wallet:estimateErc20Gas', tokenAddress, to, amount),
  
  // Transactions
  getLocalTransactions: () => ipcRenderer.invoke('wallet:getLocalTransactions'),
  getIncomingTransactions: (address: string, limit?: number) => 
    ipcRenderer.invoke('wallet:getIncomingTransactions', address, limit),
  getTransactionStatus: (hash: string) => 
    ipcRenderer.invoke('wallet:getTransactionStatus', hash),
  
  // Seed phrase
  getSeedPhrase: () => ipcRenderer.invoke('wallet:getSeedPhrase'),
  
  // Utility
  resetWallet: () => ipcRenderer.invoke('wallet:resetWallet'),

  // Auth
  hasPassword: () => ipcRenderer.invoke('auth:hasPassword'),
  setPassword: (password: string) => ipcRenderer.invoke('auth:setPassword', password),
  checkPassword: (password: string) => ipcRenderer.invoke('auth:checkPassword', password),

  // Multi-wallet
  listWallets: () => ipcRenderer.invoke('wallets:list'),
  createNewWallet: (name: string) => ipcRenderer.invoke('wallets:create', name),
  importNewWallet: (name: string, seedPhrase: string) => ipcRenderer.invoke('wallets:import', name, seedPhrase),
  selectWallet: (walletId: string) => ipcRenderer.invoke('wallets:select', walletId),
  deleteWallet: (walletId: string) => ipcRenderer.invoke('wallets:delete', walletId),
  getActiveWalletId: () => ipcRenderer.invoke('wallets:getActiveId'),

  // Updates
  onUpdateProgress: (callback: (progress: { percent: number }) => void) => {
    ipcRenderer.on('update-progress', (_, progress) => callback(progress))
    // Return unsubscribe function
    return () => ipcRenderer.removeAllListeners('update-progress')
  }
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Type definition for the exposed API
export type ElectronAPI = typeof electronAPI
