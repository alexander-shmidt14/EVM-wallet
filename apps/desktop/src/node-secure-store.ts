/**
 * node-secure-store.ts
 *
 * A simple file-based SecureStore implementation that works outside of Electron.
 * Intended for the standalone development API server (api-server.ts).
 *
 * Data is stored in plain JSON under ~/.evm-wallet-dev/store.json.
 * This is NOT suitable for production use — it is only meant for local development.
 */

import { join } from 'path'
import { homedir } from 'os'
import * as fs from 'fs'
import type { SecureStore } from '@wallet/wallet-core'

const STORE_DIR = join(homedir(), '.evm-wallet-dev')
const STORE_FILE = join(STORE_DIR, 'store.json')

function ensureDir(): void {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true })
  }
}

function readAll(): Record<string, string> {
  try {
    ensureDir()
    if (fs.existsSync(STORE_FILE)) {
      return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8'))
    }
  } catch {
    // ignore parse errors — treat as empty
  }
  return {}
}

function writeAll(data: Record<string, string>): void {
  ensureDir()
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

export const nodeSecureStore: SecureStore = {
  async get(key: string): Promise<string | null> {
    return readAll()[key] ?? null
  },

  async set(key: string, value: string): Promise<void> {
    const data = readAll()
    data[key] = value
    writeAll(data)
  },

  async remove(key: string): Promise<void> {
    const data = readAll()
    delete data[key]
    writeAll(data)
  },
}
