import '@testing-library/jest-dom'

// Mock Electron APIs
const mockElectronAPI = {
  hasWallet: jest.fn().mockResolvedValue(false),
  createWallet: jest.fn().mockResolvedValue('test seed phrase with twelve words here now done'),
  importWallet: jest.fn().mockResolvedValue(undefined),
  getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
  getEthBalance: jest.fn().mockResolvedValue({ eth: '1.0', wei: '1000000000000000000', formatted: '1.00 ETH' }),
  sendEth: jest.fn().mockResolvedValue({ hash: '0xtest' }),
  getErc20Meta: jest.fn().mockResolvedValue({ symbol: 'USDC', name: 'USD Coin', decimals: 6 }),
  getErc20Balance: jest.fn().mockResolvedValue({ raw: '1000000', decimals: 6, formatted: '1.00 USDC' }),
  sendErc20: jest.fn().mockResolvedValue({ hash: '0xtest' }),
  estimateEthGas: jest.fn().mockResolvedValue({ gasPrice: '20000000000', gasLimit: '21000' }),
  estimateErc20Gas: jest.fn().mockResolvedValue({ gasPrice: '20000000000', gasLimit: '65000' }),
  getLocalTransactions: jest.fn().mockResolvedValue([]),
  getIncomingTransactions: jest.fn().mockResolvedValue([]),
  getTransactionHistory: jest.fn().mockResolvedValue([]),
  getTransactionStatus: jest.fn().mockResolvedValue({
    confirmations: 12,
    currentBlock: 18000012,
    txBlock: 18000000,
    status: 'confirmed',
  }),
  resetWallet: jest.fn().mockResolvedValue(undefined),
}

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
})

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
  },
  writable: true,
})

// Suppress console errors in tests
console.error = jest.fn()
console.warn = jest.fn()
