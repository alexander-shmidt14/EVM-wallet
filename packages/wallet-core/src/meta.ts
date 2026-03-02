import 'cross-fetch/polyfill'

export const trustWalletIcon = (token: string): string =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${token}/logo.png`

export const coingeckoIcon = (coingeckoId: string): string =>
  `https://assets.coingecko.com/coins/images/${coingeckoId}/large/icon.png`

export async function coingeckoUsdByContract(addr: string): Promise<number | null> {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${addr}&vs_currencies=usd`
    const response = await fetch(url)
    
    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const tokenAddr = addr.toLowerCase()
    
    if (data[tokenAddr] && typeof data[tokenAddr].usd === 'number') {
      return data[tokenAddr].usd
    }
    
    return null
  } catch (error) {
    console.error('Failed to fetch price from CoinGecko:', error)
    return null
  }
}

export async function getEthPrice(): Promise<number | null> {
  try {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
    const response = await fetch(url)
    
    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    if (data.ethereum && typeof data.ethereum.usd === 'number') {
      return data.ethereum.usd
    }
    
    return null
  } catch (error) {
    console.error('Failed to fetch ETH price:', error)
    return null
  }
}

export interface TokenMetadata {
  symbol: string
  name: string
  decimals: number
  address: string
  iconUrl?: string
  priceUsd?: number
}

export function formatTokenAmount(rawAmount: string, decimals: number, maxDecimals = 6): string {
  const divisor = BigInt(10 ** decimals)
  const amount = BigInt(rawAmount)
  
  if (amount === 0n) {
    return '0'
  }
  
  const integerPart = amount / divisor
  const fractionalPart = amount % divisor
  
  if (fractionalPart === 0n) {
    return integerPart.toString()
  }
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
  const trimmed = fractionalStr.replace(/0+$/, '')
  
  if (trimmed.length > maxDecimals) {
    return `${integerPart}.${trimmed.slice(0, maxDecimals)}`
  }
  
  return `${integerPart}.${trimmed}`
}

export function parseTokenAmount(humanAmount: string, decimals: number): string {
  const [integerPart = '0', fractionalPart = ''] = humanAmount.split('.')
  
  const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals)
  const fullAmount = integerPart + paddedFractional
  
  return BigInt(fullAmount).toString()
}

// ── MMA Token ────────────────────────────────────────────
export const MMA_TOKEN_ADDRESS = '0xcA82d24A97b33F2d5826575f77fdc8Bdb82FC580'
export const MMA_TOKEN_SYMBOL = 'MMA'
export const MMA_TOKEN_NAME = 'MMA Token'
export const MMA_TOKEN_DECIMALS = 18
export const MMA_PRICE_USD = 55

export const MMA_TOKEN: TokenMetadata = {
  symbol: MMA_TOKEN_SYMBOL,
  name: MMA_TOKEN_NAME,
  decimals: MMA_TOKEN_DECIMALS,
  address: MMA_TOKEN_ADDRESS,
  priceUsd: MMA_PRICE_USD,
}

/**
 * Returns the fixed MMA price in USD ($55).
 */
export function getMmaPrice(): number {
  return MMA_PRICE_USD
}
