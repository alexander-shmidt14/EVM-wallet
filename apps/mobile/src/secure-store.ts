import EncryptedStorage from 'react-native-encrypted-storage'

// Define SecureStore interface locally
interface SecureStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}

export const secureStore: SecureStore = {
  async get(key: string): Promise<string | null> {
    try {
      return await EncryptedStorage.getItem(key)
    } catch (error) {
      console.error('SecureStore get error:', error)
      return null
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      await EncryptedStorage.setItem(key, value)
    } catch (error) {
      console.error('SecureStore set error:', error)
      throw error
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await EncryptedStorage.removeItem(key)
    } catch (error) {
      console.error('SecureStore remove error:', error)
      throw error
    }
  }
}
