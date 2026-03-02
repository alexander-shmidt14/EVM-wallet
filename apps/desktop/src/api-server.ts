/**
 * api-server.ts
 *
 * Standalone development API server — runs without Electron.
 *
 * Start it with:
 *   node dist/api-server.js
 * or via the npm script:
 *   npm run start:api
 *
 * It exposes exactly the same HTTP routes as the embedded server inside
 * the Electron main process (main.ts), so the renderer running in a plain
 * browser (npm run dev:web) can connect to a real back-end without needing
 * Electron at all.
 *
 * Data is stored in ~/.evm-wallet-dev/store.json (plain JSON, dev only).
 */

import { WalletCore } from '@wallet/wallet-core'
import { startHttpApiServer } from './http-api'
import { nodeSecureStore } from './node-secure-store'

const RPC_URL =
  process.env.ALCHEMY_RPC_MAINNET ||
  process.env.INFURA_RPC_MAINNET ||
  'https://ethereum.publicnode.com'

const etherscanApiKey = process.env.ETHERSCAN_API_KEY

const walletCore = new WalletCore(RPC_URL, nodeSecureStore, etherscanApiKey)

const port = parseInt(process.env.WALLET_API_PORT ?? '3001', 10)

startHttpApiServer(nodeSecureStore, () => walletCore, port)

console.log('[Dev API Server] Using store at ~/.evm-wallet-dev/store.json')
console.log('[Dev API Server] RPC URL:', RPC_URL)
