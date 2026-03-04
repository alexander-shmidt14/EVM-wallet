import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { createHash } from 'crypto'
import { WalletCore } from '@wallet/wallet-core'
import { secureStore } from './secure-store'
import { initAutoUpdater } from './auto-updater'

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null
let walletCore: WalletCore | null = null

const isDevelopment = process.env.NODE_ENV === 'development'

// Storage keys for multi-wallet & auth
const PASSWORD_KEY = 'app_password_hash'
const WALLETS_KEY = 'wallets_v1'
const ACTIVE_WALLET_KEY = 'active_wallet_id'

// Initialize wallet core
const initWalletCore = () => {
  const rpcUrl = process.env.ALCHEMY_RPC_MAINNET || process.env.INFURA_RPC_MAINNET || 'https://ethereum.publicnode.com'
  const etherscanApiKey = process.env.ETHERSCAN_API_KEY
  const incomingTokenWhitelist = (process.env.INCOMING_ERC20_WHITELIST || '')
    .split(',')
    .map((address) => address.trim())
    .filter(Boolean)

  // ── DEBUG: incoming-transactions diagnostics ──
  console.log('[InitWalletCore] RPC URL:', rpcUrl ? rpcUrl.replace(/\/v[23]\/.*/, '/v*/***') : '(empty, using publicnode)')
  console.log('[InitWalletCore] ETHERSCAN_API_KEY present:', !!etherscanApiKey, '| length:', (etherscanApiKey || '').length)
  console.log('[InitWalletCore] ETHERSCAN_API_KEY raw repr:', JSON.stringify(etherscanApiKey))
  console.log('[InitWalletCore] INCOMING_ERC20_WHITELIST:', incomingTokenWhitelist.length > 0 ? incomingTokenWhitelist : '(empty → default MMA)')
  // ── END DEBUG ──

  walletCore = new WalletCore(
    rpcUrl,
    secureStore,
    etherscanApiKey,
    incomingTokenWhitelist.length > 0 ? incomingTokenWhitelist : undefined
  )
}

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 500,
    icon: join(__dirname, '..', 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
    title: 'EVM Wallet',
    titleBarStyle: 'default',
    show: false
  })

  // Load the app
  mainWindow.loadFile(join(__dirname, 'renderer/index.html'))

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// App event listeners
app.whenReady().then(() => {
  initWalletCore()
  createWindow()

  // Initialize auto-updater in production
  if (!isDevelopment && mainWindow) {
    initAutoUpdater(mainWindow)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// ─── Auth IPC handlers ──────────────────────────
ipcMain.handle('auth:hasPassword', async () => {
  const hash = await secureStore.get(PASSWORD_KEY)
  return hash !== null
})

ipcMain.handle('auth:setPassword', async (_, password: string) => {
  const hash = createHash('sha256').update(password).digest('hex')
  await secureStore.set(PASSWORD_KEY, hash)
})

ipcMain.handle('auth:checkPassword', async (_, password: string) => {
  const storedHash = await secureStore.get(PASSWORD_KEY)
  if (!storedHash) return false
  const hash = createHash('sha256').update(password).digest('hex')
  return hash === storedHash
})

// ─── Multi-wallet IPC handlers ──────────────────
ipcMain.handle('wallets:list', async () => {
  const stored = await secureStore.get(WALLETS_KEY)
  if (!stored) return []
  const wallets: any[] = JSON.parse(stored)
  return wallets.map(w => ({ id: w.id, name: w.name, address: w.address, createdAt: w.createdAt }))
})

ipcMain.handle('wallets:create', async (_, name: string) => {
  if (!walletCore) throw new Error('Wallet core not initialized')
  // Clear current seed so ensureSeed generates a fresh one
  await secureStore.remove('seed_v1')
  const phrase = await walletCore.ensureSeed(true)
  const address = await walletCore.address(0)
  const stored = await secureStore.get(WALLETS_KEY)
  const wallets: any[] = stored ? JSON.parse(stored) : []
  const newWallet = { id: Date.now().toString(), name, seedPhrase: phrase, address, createdAt: Date.now() }
  wallets.push(newWallet)
  await secureStore.set(WALLETS_KEY, JSON.stringify(wallets))
  await secureStore.set(ACTIVE_WALLET_KEY, newWallet.id)
  return { id: newWallet.id, name, address, seedPhrase: phrase }
})

ipcMain.handle('wallets:import', async (_, name: string, seedPhrase: string) => {
  if (!walletCore) throw new Error('Wallet core not initialized')
  await walletCore.importSeed(seedPhrase)
  const address = await walletCore.address(0)
  const stored = await secureStore.get(WALLETS_KEY)
  const wallets: any[] = stored ? JSON.parse(stored) : []
  const existing = wallets.find((w: any) => w.address.toLowerCase() === address.toLowerCase())
  if (existing) {
    existing.seedPhrase = seedPhrase
    await secureStore.set(WALLETS_KEY, JSON.stringify(wallets))
    await secureStore.set(ACTIVE_WALLET_KEY, existing.id)
    return { id: existing.id, name: existing.name, address: existing.address }
  }
  const newWallet = { id: Date.now().toString(), name, seedPhrase, address, createdAt: Date.now() }
  wallets.push(newWallet)
  await secureStore.set(WALLETS_KEY, JSON.stringify(wallets))
  await secureStore.set(ACTIVE_WALLET_KEY, newWallet.id)
  return { id: newWallet.id, name, address }
})

ipcMain.handle('wallets:select', async (_, walletId: string) => {
  if (!walletCore) throw new Error('Wallet core not initialized')
  const stored = await secureStore.get(WALLETS_KEY)
  if (!stored) throw new Error('No wallets found')
  const wallets: any[] = JSON.parse(stored)
  const wallet = wallets.find((w: any) => w.id === walletId)
  if (!wallet) throw new Error('Wallet not found')
  await walletCore.importSeed(wallet.seedPhrase)
  await secureStore.set(ACTIVE_WALLET_KEY, walletId)
  return { id: wallet.id, name: wallet.name, address: wallet.address }
})

ipcMain.handle('wallets:delete', async (_, walletId: string) => {
  const stored = await secureStore.get(WALLETS_KEY)
  if (!stored) return
  let wallets: any[] = JSON.parse(stored)
  wallets = wallets.filter((w: any) => w.id !== walletId)
  await secureStore.set(WALLETS_KEY, JSON.stringify(wallets))
  const activeId = await secureStore.get(ACTIVE_WALLET_KEY)
  if (activeId === walletId) {
    await secureStore.remove(ACTIVE_WALLET_KEY)
    await secureStore.remove('seed_v1')
  }
})

ipcMain.handle('wallets:getActiveId', async () => {
  return await secureStore.get(ACTIVE_WALLET_KEY)
})

// IPC handlers for wallet operations
ipcMain.handle('wallet:hasWallet', async () => {
  return walletCore?.hasWallet() || false
})

ipcMain.handle('wallet:createWallet', async () => {
  if (!walletCore) throw new Error('Wallet core not initialized')
  return walletCore.ensureSeed(true)
})

ipcMain.handle('wallet:importWallet', async (_, seedPhrase: string) => {
  if (!walletCore) throw new Error('Wallet core not initialized')
  await walletCore.importSeed(seedPhrase)
})

ipcMain.handle('wallet:getAddress', async (_, index: number = 0) => {
  if (!walletCore) throw new Error('Wallet core not initialized')
  return walletCore.address(index)
})

ipcMain.handle('wallet:getEthBalance', async (_, address: string) => {
  if (!walletCore) throw new Error('Wallet core not initialized')
  return walletCore.ethBalance(address)
})

ipcMain.handle('wallet:sendEth', async (_, accountIndex: number, to: string, amount: string) => {
  if (!walletCore) throw new Error('Wallet core not initialized')
  return walletCore.sendEth(accountIndex, to, amount)
})

ipcMain.handle('wallet:getErc20Meta', async (_, tokenAddress: string) => {
  if (!walletCore) throw new Error('Wallet core not initialized')
  return walletCore.erc20Meta(tokenAddress)
})

ipcMain.handle('wallet:getErc20Balance', async (_, tokenAddress: string, holderAddress: string) => {
  if (!walletCore) throw new Error('Wallet core not initialized')
  return walletCore.erc20Balance(tokenAddress, holderAddress)
})

ipcMain.handle('wallet:sendErc20', async (_, accountIndex: number, tokenAddress: string, to: string, amount: string) => {
  if (!walletCore) throw new Error('Wallet core not initialized')
  return walletCore.erc20Transfer(accountIndex, tokenAddress, to, amount)
})

ipcMain.handle('wallet:estimateEthGas', async (_, to: string, amount: string) => {
  if (!walletCore) throw new Error('Wallet core not initialized')
  return walletCore.estimateEthGas(to, amount)
})

ipcMain.handle('wallet:estimateErc20Gas', async (_, tokenAddress: string, to: string, amount: string) => {
  if (!walletCore) throw new Error('Wallet core not initialized')
  return walletCore.estimateErc20Gas(tokenAddress, to, amount)
})

ipcMain.handle('wallet:getLocalTransactions', async (_, address?: string) => {
  if (!walletCore) throw new Error('Wallet core not initialized')
  return walletCore.getLocalTransactions(address)
})

ipcMain.handle('wallet:getIncomingTransactions', async (_, address: string, limit: number = 50) => {
  if (!walletCore) throw new Error('Wallet core not initialized')
  console.log('[IPC:getIncomingTransactions] address:', address, '| limit:', limit)
  const result = await walletCore.getIncomingTransactions(address, limit)
  console.log('[IPC:getIncomingTransactions] result:', result.length, 'incoming txs')
  return result
})

ipcMain.handle('wallet:getTransactionHistory', async (_, address: string, limit: number = 50) => {
  if (!walletCore) throw new Error('Wallet core not initialized')
  console.log('[IPC:getTransactionHistory] address:', address, '| limit:', limit)
  const result = await walletCore.getTransactionHistory(address, limit)
  const inCount = result.filter((tx: any) => tx.direction === 'in').length
  const outCount = result.filter((tx: any) => tx.direction === 'out').length
  console.log('[IPC:getTransactionHistory] result:', result.length, 'total |', inCount, 'in |', outCount, 'out')
  if (result.length > 0) {
    console.log('[IPC:getTransactionHistory] first tx sample:', JSON.stringify(result[0], null, 2))
  }
  return result
})

ipcMain.handle('wallet:getTransactionStatus', async (_, txHash: string) => {
  if (!walletCore) throw new Error('Wallet core not initialized')
  return walletCore.getTransactionStatus(txHash)
})

ipcMain.handle('wallet:getSeedPhrase', async () => {
  if (!walletCore) throw new Error('Wallet core not initialized')
  return walletCore.ensureSeed(false)
})

ipcMain.handle('wallet:resetWallet', async () => {
  if (!walletCore) throw new Error('Wallet core not initialized')
  return walletCore.resetWallet()
})
