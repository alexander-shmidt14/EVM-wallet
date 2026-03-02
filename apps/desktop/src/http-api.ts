/**
 * http-api.ts
 *
 * Shared HTTP API request handler.
 * Contains the same business logic as the Electron IPC handlers in main.ts,
 * but exposed as a plain async function so it can be used both by the
 * embedded HTTP server inside Electron (main.ts) and by the standalone
 * dev API server (api-server.ts).
 */

import { createHash } from 'crypto'
import { WalletCore } from '@wallet/wallet-core'
import type { SecureStore } from '@wallet/wallet-core'

const PASSWORD_KEY = 'app_password_hash'
const WALLETS_KEY = 'wallets_v1'
const ACTIVE_WALLET_KEY = 'active_wallet_id'

export async function handleApiRequest(
  pathname: string,
  body: Record<string, any>,
  store: SecureStore,
  walletCore: WalletCore | null
): Promise<unknown> {
  switch (pathname) {
    // ── Auth ────────────────────────────────────────────
    case '/api/auth/hasPassword':
      return (await store.get(PASSWORD_KEY)) !== null

    case '/api/auth/setPassword': {
      const hash = createHash('sha256').update(body.password as string).digest('hex')
      await store.set(PASSWORD_KEY, hash)
      return null
    }

    case '/api/auth/checkPassword': {
      const storedHash = await store.get(PASSWORD_KEY)
      if (!storedHash) return false
      const hash = createHash('sha256').update(body.password as string).digest('hex')
      return hash === storedHash
    }

    // ── Multi-wallet ────────────────────────────────────
    case '/api/wallets/list': {
      const stored = await store.get(WALLETS_KEY)
      if (!stored) return []
      const wallets: any[] = JSON.parse(stored)
      return wallets.map(w => ({ id: w.id, name: w.name, address: w.address, createdAt: w.createdAt }))
    }

    case '/api/wallets/create': {
      if (!walletCore) throw new Error('Wallet core not initialized')
      await store.remove('seed_v1')
      const phrase = await walletCore.ensureSeed(true)
      const address = await walletCore.address(0)
      const stored = await store.get(WALLETS_KEY)
      const wallets: any[] = stored ? JSON.parse(stored) : []
      const newWallet = {
        id: Date.now().toString(),
        name: body.name as string,
        seedPhrase: phrase,
        address,
        createdAt: Date.now(),
      }
      wallets.push(newWallet)
      await store.set(WALLETS_KEY, JSON.stringify(wallets))
      await store.set(ACTIVE_WALLET_KEY, newWallet.id)
      return { id: newWallet.id, name: newWallet.name, address, seedPhrase: phrase }
    }

    case '/api/wallets/import': {
      if (!walletCore) throw new Error('Wallet core not initialized')
      await walletCore.importSeed(body.seedPhrase as string)
      const address = await walletCore.address(0)
      const stored = await store.get(WALLETS_KEY)
      const wallets: any[] = stored ? JSON.parse(stored) : []
      const existing = wallets.find((w: any) => w.address.toLowerCase() === address.toLowerCase())
      if (existing) {
        existing.seedPhrase = body.seedPhrase
        await store.set(WALLETS_KEY, JSON.stringify(wallets))
        await store.set(ACTIVE_WALLET_KEY, existing.id)
        return { id: existing.id, name: existing.name, address: existing.address }
      }
      const newWallet = {
        id: Date.now().toString(),
        name: body.name as string,
        seedPhrase: body.seedPhrase as string,
        address,
        createdAt: Date.now(),
      }
      wallets.push(newWallet)
      await store.set(WALLETS_KEY, JSON.stringify(wallets))
      await store.set(ACTIVE_WALLET_KEY, newWallet.id)
      return { id: newWallet.id, name: newWallet.name, address }
    }

    case '/api/wallets/select': {
      if (!walletCore) throw new Error('Wallet core not initialized')
      const stored = await store.get(WALLETS_KEY)
      if (!stored) throw new Error('No wallets found')
      const wallets: any[] = JSON.parse(stored)
      const wallet = wallets.find((w: any) => w.id === body.walletId)
      if (!wallet) throw new Error('Wallet not found')
      await walletCore.importSeed(wallet.seedPhrase)
      await store.set(ACTIVE_WALLET_KEY, body.walletId as string)
      return { id: wallet.id, name: wallet.name, address: wallet.address }
    }

    case '/api/wallets/delete': {
      const stored = await store.get(WALLETS_KEY)
      if (!stored) return null
      let wallets: any[] = JSON.parse(stored)
      wallets = wallets.filter((w: any) => w.id !== body.walletId)
      await store.set(WALLETS_KEY, JSON.stringify(wallets))
      const activeId = await store.get(ACTIVE_WALLET_KEY)
      if (activeId === body.walletId) {
        await store.remove(ACTIVE_WALLET_KEY)
        await store.remove('seed_v1')
      }
      return null
    }

    case '/api/wallets/active':
      return store.get(ACTIVE_WALLET_KEY)

    // ── Wallet operations ───────────────────────────────
    case '/api/wallet/hasWallet':
      return walletCore ? walletCore.hasWallet() : false

    case '/api/wallet/address':
      if (!walletCore) throw new Error('Wallet core not initialized')
      return walletCore.address(body.index ?? 0)

    case '/api/wallet/ethBalance':
      if (!walletCore) throw new Error('Wallet core not initialized')
      return walletCore.ethBalance(body.address as string)

    case '/api/wallet/sendEth':
      if (!walletCore) throw new Error('Wallet core not initialized')
      return walletCore.sendEth(body.accountIndex, body.to, body.amount)

    case '/api/wallet/erc20Meta':
      if (!walletCore) throw new Error('Wallet core not initialized')
      return walletCore.erc20Meta(body.tokenAddress as string)

    case '/api/wallet/erc20Balance':
      if (!walletCore) throw new Error('Wallet core not initialized')
      return walletCore.erc20Balance(body.tokenAddress as string, body.holderAddress as string)

    case '/api/wallet/sendErc20':
      if (!walletCore) throw new Error('Wallet core not initialized')
      return walletCore.erc20Transfer(body.accountIndex, body.tokenAddress, body.to, body.amount)

    case '/api/wallet/estimateEthGas':
      if (!walletCore) throw new Error('Wallet core not initialized')
      return walletCore.estimateEthGas(body.to, body.amount)

    case '/api/wallet/estimateErc20Gas':
      if (!walletCore) throw new Error('Wallet core not initialized')
      return walletCore.estimateErc20Gas(body.tokenAddress, body.to, body.amount)

    case '/api/wallet/localTransactions':
      if (!walletCore) throw new Error('Wallet core not initialized')
      return walletCore.getLocalTransactions()

    case '/api/wallet/incomingTransactions':
      if (!walletCore) throw new Error('Wallet core not initialized')
      return walletCore.getIncomingTransactions(body.address as string, body.limit ?? 50)

    case '/api/wallet/seedPhrase':
      if (!walletCore) throw new Error('Wallet core not initialized')
      return walletCore.ensureSeed(false)

    case '/api/wallet/reset':
      if (!walletCore) throw new Error('Wallet core not initialized')
      return walletCore.resetWallet()

    default:
      throw new Error(`Unknown API path: ${pathname}`)
  }
}

/**
 * Creates and starts an HTTP server that forwards requests to handleApiRequest.
 * Binds on 127.0.0.1 only (localhost) for security.
 */
export function startHttpApiServer(
  store: SecureStore,
  getWalletCore: () => WalletCore | null,
  port = parseInt(process.env.WALLET_API_PORT ?? '3001', 10)
): import('http').Server {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const http = require('http') as typeof import('http')

  const server = http.createServer(
    (req: import('http').IncomingMessage, res: import('http').ServerResponse) => {
      // CORS — allow the Vite dev server origin
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
      res.setHeader('Vary', 'Origin')
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

      if (req.method === 'OPTIONS') {
        res.writeHead(204)
        res.end()
        return
      }

      if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Method Not Allowed' }))
        return
      }

      let body = ''
      req.on('data', (chunk: Buffer) => { body += chunk.toString() })
      req.on('end', async () => {
        try {
          const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`)
          const params: Record<string, any> = body ? JSON.parse(body) : {}
          const result = await handleApiRequest(url.pathname, params, store, getWalletCore())
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(result))
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: err.message ?? 'Internal Server Error' }))
        }
      })
    }
  )

  server.listen(port, '127.0.0.1', () => {
    console.log(`[API Server] Listening on http://127.0.0.1:${port}`)
  })

  return server
}
