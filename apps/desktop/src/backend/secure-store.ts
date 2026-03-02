import { safeStorage } from 'electron'
import { join } from 'path'
import { app } from 'electron'
import * as fs from 'fs'

interface SecureStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}

// Store encrypted data in app's userData directory
function getStorePath(): string {
  return join(app.getPath('userData'), 'secure-store.json')
}

function readStore(): Record<string, string> {
  try {
    const filePath = getStorePath()
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(raw)
    }
  } catch (error) {
    console.error('Failed to read secure store:', error)
  }
  return {}
}

function writeStore(data: Record<string, string>): void {
  const filePath = getStorePath()
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export const secureStore: SecureStore = {
  async get(key: string): Promise<string | null> {
    try {
      const store = readStore()
      const encrypted = store[key]
      if (!encrypted) return null
      if (safeStorage.isEncryptionAvailable()) {
        const buffer = Buffer.from(encrypted, 'base64')
        return safeStorage.decryptString(buffer)
      }
      // Fallback: stored as plain text (shouldn't happen on modern OS)
      return encrypted
    } catch (error) {
      console.error('SecureStore get error:', error)
      return null
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      const store = readStore()
      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(value)
        store[key] = encrypted.toString('base64')
      } else {
        // Fallback: store as-is (less secure)
        store[key] = value
      }
      writeStore(store)
    } catch (error) {
      console.error('SecureStore set error:', error)
      throw error
    }
  },

  async remove(key: string): Promise<void> {
    try {
      const store = readStore()
      delete store[key]
      writeStore(store)
    } catch (error) {
      console.error('SecureStore remove error:', error)
      throw error
    }
  }
}
