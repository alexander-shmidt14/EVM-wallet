import 'react-native-get-random-values'
import { WalletCore } from '@wallet/wallet-core'
import { secureStore } from './secure-store'

// Получаем RPC URL из .env файла (в production будет использоваться значение из сборки)
const RPC_URL = process.env.ALCHEMY_RPC_MAINNET || process.env.INFURA_RPC_MAINNET || 'https://eth-mainnet.g.alchemy.com/v2/demo'
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

export const walletCore = new WalletCore(RPC_URL, secureStore, ETHERSCAN_API_KEY)
