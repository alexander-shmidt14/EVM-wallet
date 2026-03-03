import { JsonRpcProvider, HDNodeWallet, Contract, formatEther, parseUnits, getAddress, TransactionReceipt, TransactionRequest } from 'ethers'
import type { SecureStore } from './secure-store'
import erc20Abi from './erc20.abi.json'
import 'cross-fetch/polyfill'

// Re-export types
export type { SecureStore } from './secure-store'

// Re-export meta utilities and MMA token constants
export {
  MMA_TOKEN_ADDRESS,
  MMA_TOKEN_SYMBOL,
  MMA_TOKEN_NAME,
  MMA_TOKEN_DECIMALS,
  MMA_PRICE_USD,
  MMA_TOKEN,
  getMmaPrice,
  formatTokenAmount,
  parseTokenAmount,
  coingeckoUsdByContract,
  getEthPrice,
  trustWalletIcon,
  coingeckoIcon,
} from './meta'
export type { TokenMetadata } from './meta'

const SEED_KEY = 'seed_v1'
const TRANSACTIONS_KEY = 'transactions_v1'

export interface TokenBalance {
  raw: string
  decimals: number
  formatted: string
}

export interface EthBalance {
  wei: string
  eth: string
  formatted: string
}

export interface TokenInfo {
  symbol: string
  name: string
  decimals: number
  address: string
}

export interface TransactionInfo {
  hash: string
  from: string
  to: string
  value: string
  type: 'eth' | 'erc20'
  tokenAddress?: string
  tokenSymbol?: string
  tokenDecimals?: number
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
  blockNumber?: number
}

export interface TransactionStatus {
  hash: string
  status: 'pending' | 'confirmed' | 'failed'
  confirmations: number
  blockNumber?: number
}

export class WalletCore {
  private _provider: JsonRpcProvider | null = null

  constructor(
    private rpcUrl: string, 
    private store: SecureStore,
    private etherscanApiKey?: string
  ) {}

  private provider(): JsonRpcProvider {
    if (!this._provider) {
      this._provider = new JsonRpcProvider(this.rpcUrl)
    }
    return this._provider
  }

  /**
   * Создаёт новую seed фразу или возвращает существующую
   */
  async ensureSeed(createIfMissing = false): Promise<string> {
    const stored = await this.store.get(SEED_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        return parsed.phrase as string
      } catch (error) {
        throw new Error('CORRUPTED_SEED')
      }
    }
    
    if (!createIfMissing) {
      throw new Error('NO_SEED')
    }
    
    const wallet = HDNodeWallet.createRandom()
    const seedData = { phrase: wallet.mnemonic!.phrase }
    await this.store.set(SEED_KEY, JSON.stringify(seedData))
    
    return wallet.mnemonic!.phrase
  }

  /**
   * Импорт существующей seed фразы
   */
  async importSeed(phrase: string): Promise<void> {
    try {
      // Проверяем валидность фразы
      HDNodeWallet.fromPhrase(phrase)
      const seedData = { phrase }
      await this.store.set(SEED_KEY, JSON.stringify(seedData))
    } catch (error) {
      throw new Error('INVALID_SEED')
    }
  }

  /**
   * Проверяет наличие сохранённого кошелька
   */
  async hasWallet(): Promise<boolean> {
    const stored = await this.store.get(SEED_KEY)
    return stored !== null
  }

  /**
   * Получает адрес по индексу (BIP-44: m/44'/60'/0'/0/index)
   */
  async address(index = 0): Promise<string> {
    const phrase = await this.ensureSeed(false)
    const wallet = HDNodeWallet.fromPhrase(phrase, undefined, `m/44'/60'/0'/0/${index}`)
    return wallet.address
  }

  /**
   * Получает баланс ETH для адреса
   */
  async ethBalance(address: string): Promise<EthBalance> {
    const wei = await this.provider().getBalance(address)
    const eth = formatEther(wei)
    
    return {
      wei: wei.toString(),
      eth,
      formatted: parseFloat(eth).toFixed(6)
    }
  }

  /**
   * Отправляет ETH
   */
  async sendEth(accountIndex: number, to: string, amountEth: string): Promise<TransactionReceipt | null> {
    try {
      // Валидация адреса получателя
      const validTo = getAddress(to)
      
      const phrase = await this.ensureSeed(false)
      const signer = HDNodeWallet.fromPhrase(phrase, undefined, `m/44'/60'/0'/0/${accountIndex}`).connect(this.provider())
      
      const feeData = await this.provider().getFeeData()
      
      const tx: TransactionRequest = {
        to: validTo,
        value: parseUnits(amountEth, 18),
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      }

      const sentTx = await signer.sendTransaction(tx)
      
      // Сохраняем транзакцию в локальный журнал
      await this.saveTransaction({
        hash: sentTx.hash,
        from: signer.address,
        to: validTo,
        value: amountEth,
        type: 'eth',
        timestamp: Date.now(),
        status: 'pending'
      })

      const receipt = await sentTx.wait()
      
      // Обновляем статус в журнале
      if (receipt) {
        await this.updateTransactionStatus(sentTx.hash, receipt.status === 1 ? 'confirmed' : 'failed', receipt.blockNumber)
      }

      return receipt
    } catch (error) {
      console.error('Send ETH error:', error)
      throw error
    }
  }

  /**
   * Создаёт инстанс контракта ERC-20
   */
  token(address: string): Contract {
    return new Contract(address, erc20Abi, this.provider())
  }

  /**
   * Получает метаданные ERC-20 токена
   */
  async erc20Meta(address: string): Promise<TokenInfo> {
    try {
      const validAddress = getAddress(address)
      const tokenContract = this.token(validAddress)
      
      const [symbol, name, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.name(),
        tokenContract.decimals()
      ])

      return {
        symbol,
        name,
        decimals: Number(decimals),
        address: validAddress
      }
    } catch (error) {
      console.error('ERC20 meta error:', error)
      throw new Error('INVALID_TOKEN_CONTRACT')
    }
  }

  /**
   * Получает баланс ERC-20 токена
   * fallbackDecimals используется если decimals() revert-ится (напр. MMA)
   */
  async erc20Balance(tokenAddress: string, holderAddress: string, fallbackDecimals: number = 18): Promise<TokenBalance> {
    try {
      const validTokenAddress = getAddress(tokenAddress)
      const validHolderAddress = getAddress(holderAddress)
      
      const tokenContract = this.token(validTokenAddress)

      let decimalCount = fallbackDecimals
      let balance = 0n

      // Try parallel first; if decimals() reverts, fall back to balanceOf alone
      try {
        const [dec, bal] = await Promise.all([
          tokenContract.decimals(),
          tokenContract.balanceOf(validHolderAddress)
        ])
        decimalCount = Number(dec)
        balance = bal
      } catch {
        // decimals() may revert on some contracts — try balanceOf alone
        try {
          balance = await tokenContract.balanceOf(validHolderAddress)
        } catch (e2) {
          console.error('balanceOf also failed:', e2)
        }
      }

      return {
        raw: balance.toString(),
        decimals: decimalCount,
        formatted: formatEther(balance.toString() + '0'.repeat(18 - decimalCount))
      }
    } catch (error) {
      console.error('ERC20 balance error:', error)
      return {
        raw: '0',
        decimals: fallbackDecimals,
        formatted: '0'
      }
    }
  }

  /**
   * Отправляет ERC-20 токены
   */
  async erc20Transfer(
    accountIndex: number, 
    tokenAddress: string, 
    to: string, 
    amountHuman: string
  ): Promise<TransactionReceipt | null> {
    try {
      const validTokenAddress = getAddress(tokenAddress)
      const validTo = getAddress(to)
      
      const phrase = await this.ensureSeed(false)
      const signer = HDNodeWallet.fromPhrase(phrase, undefined, `m/44'/60'/0'/0/${accountIndex}`).connect(this.provider())
      
      const meta = await this.erc20Meta(validTokenAddress)
      const tokenContract = new Contract(validTokenAddress, erc20Abi, signer)
      
      const feeData = await this.provider().getFeeData()
      
      const tx = await tokenContract.transfer(
        validTo, 
        parseUnits(amountHuman, meta.decimals),
        {
          maxFeePerGas: feeData.maxFeePerGas,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        }
      )

      // Сохраняем транзакцию в локальный журнал
      await this.saveTransaction({
        hash: tx.hash,
        from: signer.address,
        to: validTo,
        value: amountHuman,
        type: 'erc20',
        tokenAddress: validTokenAddress,
        tokenSymbol: meta.symbol,
        tokenDecimals: meta.decimals,
        timestamp: Date.now(),
        status: 'pending'
      })

      const receipt = await tx.wait()
      
      // Обновляем статус в журнале
      if (receipt) {
        await this.updateTransactionStatus(tx.hash, receipt.status === 1 ? 'confirmed' : 'failed', receipt.blockNumber)
      }

      return receipt
    } catch (error) {
      console.error('ERC20 transfer error:', error)
      throw error
    }
  }

  /**
   * Оценивает газ для ETH транзакции
   */
  async estimateEthGas(to: string, amountEth: string): Promise<{ gasLimit: string; maxFee: string; maxPriorityFee: string; totalCostEth: string }> {
    try {
      const validTo = getAddress(to)
      const feeData = await this.provider().getFeeData()
      
      const gasLimit = await this.provider().estimateGas({
        to: validTo,
        value: parseUnits(amountEth, 18)
      })

      const maxFee = feeData.maxFeePerGas || feeData.gasPrice || parseUnits('20', 'gwei')
      const maxPriorityFee = feeData.maxPriorityFeePerGas || parseUnits('2', 'gwei')
      
      const totalGasCost = gasLimit * maxFee
      const totalCostEth = formatEther(totalGasCost)

      return {
        gasLimit: gasLimit.toString(),
        maxFee: maxFee.toString(),
        maxPriorityFee: maxPriorityFee.toString(),
        totalCostEth
      }
    } catch (error) {
      console.error('Gas estimation error:', error)
      throw error
    }
  }

  /**
   * Оценивает газ для ERC-20 транзакции
   */
  async estimateErc20Gas(tokenAddress: string, to: string, amountHuman: string): Promise<{ gasLimit: string; maxFee: string; maxPriorityFee: string; totalCostEth: string }> {
    try {
      const validTokenAddress = getAddress(tokenAddress)
      const validTo = getAddress(to)
      
      const meta = await this.erc20Meta(validTokenAddress)
      const tokenContract = this.token(validTokenAddress)
      const feeData = await this.provider().getFeeData()
      
      const gasLimit = await tokenContract.transfer.estimateGas(
        validTo,
        parseUnits(amountHuman, meta.decimals)
      )

      const maxFee = feeData.maxFeePerGas || feeData.gasPrice || parseUnits('20', 'gwei')
      const maxPriorityFee = feeData.maxPriorityFeePerGas || parseUnits('2', 'gwei')
      
      const totalGasCost = gasLimit * maxFee
      const totalCostEth = formatEther(totalGasCost)

      return {
        gasLimit: gasLimit.toString(),
        maxFee: maxFee.toString(),
        maxPriorityFee: maxPriorityFee.toString(),
        totalCostEth
      }
    } catch (error) {
      console.error('ERC20 gas estimation error:', error)
      throw error
    }
  }

  /**
   * Сохраняет транзакцию в локальный журнал
   */
  private async saveTransaction(tx: TransactionInfo): Promise<void> {
    try {
      const stored = await this.store.get(TRANSACTIONS_KEY)
      const transactions: TransactionInfo[] = stored ? JSON.parse(stored) : []
      
      transactions.unshift(tx) // Новые транзакции в начало
      
      // Ограничиваем до 1000 транзакций
      if (transactions.length > 1000) {
        transactions.splice(1000)
      }
      
      await this.store.set(TRANSACTIONS_KEY, JSON.stringify(transactions))
    } catch (error) {
      console.error('Save transaction error:', error)
    }
  }

  /**
   * Обновляет статус транзакции
   */
  private async updateTransactionStatus(hash: string, status: 'confirmed' | 'failed', blockNumber?: number): Promise<void> {
    try {
      const stored = await this.store.get(TRANSACTIONS_KEY)
      if (!stored) return

      const transactions: TransactionInfo[] = JSON.parse(stored)
      const txIndex = transactions.findIndex(tx => tx.hash === hash)
      
      if (txIndex !== -1) {
        transactions[txIndex].status = status
        if (blockNumber) {
          transactions[txIndex].blockNumber = blockNumber
        }
        await this.store.set(TRANSACTIONS_KEY, JSON.stringify(transactions))
      }
    } catch (error) {
      console.error('Update transaction status error:', error)
    }
  }

  /**
   * Получает локальные транзакции
   */
  async getLocalTransactions(): Promise<TransactionInfo[]> {
    try {
      const stored = await this.store.get(TRANSACTIONS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Get local transactions error:', error)
      return []
    }
  }

  /**
   * Получает входящие транзакции через Etherscan API (если ключ предоставлен)
   */
  async getIncomingTransactions(address: string, limit = 50): Promise<TransactionInfo[]> {
    if (!this.etherscanApiKey) {
      return []
    }

    try {
      const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=${this.etherscanApiKey}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.status !== '1' || !Array.isArray(data.result)) {
        return []
      }

      return data.result
        .filter((tx: any) => tx.to?.toLowerCase() === address.toLowerCase())
        .map((tx: any): TransactionInfo => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: formatEther(tx.value),
          type: 'eth',
          timestamp: parseInt(tx.timeStamp) * 1000,
          status: tx.txreceipt_status === '1' ? 'confirmed' : 'failed',
          blockNumber: parseInt(tx.blockNumber)
        }))
    } catch (error) {
      console.error('Get incoming transactions error:', error)
      return []
    }
  }

  /**
   * Получает статус транзакции из сети
   */
  async getTransactionStatus(hash: string): Promise<TransactionStatus> {
    try {
      const receipt = await this.provider().getTransactionReceipt(hash)
      
      if (!receipt) {
        // Транзакция еще не подтверждена
        return {
          hash,
          status: 'pending',
          confirmations: 0
        }
      }

      const currentBlock = await this.provider().getBlockNumber()
      const confirmations = currentBlock - receipt.blockNumber + 1

      return {
        hash,
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        confirmations,
        blockNumber: receipt.blockNumber
      }
    } catch (error) {
      console.error('Get transaction status error:', error)
      throw error
    }
  }

  /**
   * Очищает данные кошелька (сброс)
   */
  async resetWallet(): Promise<void> {
    await this.store.remove(SEED_KEY)
    await this.store.remove(TRANSACTIONS_KEY)
  }
}
