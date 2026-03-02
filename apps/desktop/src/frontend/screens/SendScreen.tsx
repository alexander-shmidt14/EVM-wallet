import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWalletStore } from '../store/wallet'

type SendTab = 'eth' | 'erc20'

const MMA_TOKEN_ADDRESS = '0xC0bB99E7B5A1fe73A1c9B7F7E2376e70c6F7881F'

export const SendScreen: React.FC = () => {
  const navigate = useNavigate()
  const { currentAddress, ethBalance, loadBalance, loadTransactions } = useWalletStore()

  const [tab, setTab] = useState<SendTab>('eth')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [tokenAddress, setTokenAddress] = useState(MMA_TOKEN_ADDRESS)
  const [isSending, setIsSending] = useState(false)
  const [isEstimating, setIsEstimating] = useState(false)
  const [gasEstimate, setGasEstimate] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'confirmed' | 'failed'>('idle')

  const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr)
  const isValidAmount = (val: string) => {
    const n = parseFloat(val)
    return !isNaN(n) && n > 0
  }

  const canEstimate = isValidAddress(recipient) && isValidAmount(amount)
  const canSend = canEstimate && gasEstimate !== null

  const estimateGas = useCallback(async () => {
    if (!canEstimate) return
    setError(null)
    setIsEstimating(true)
    setGasEstimate(null)
    try {
      let result: any
      if (tab === 'eth') {
        result = await window.electronAPI.estimateEthGas(recipient, amount)
      } else {
        result = await window.electronAPI.estimateErc20Gas(tokenAddress, recipient, amount)
      }
      setGasEstimate(result.totalCostEth)
    } catch (e: any) {
      const msg = e?.message || 'Gas estimation failed'
      if (msg.includes('insufficient funds')) {
        setError('Insufficient ETH balance for this transaction')
      } else {
        setError(`Gas estimation error: ${msg}`)
      }
    } finally {
      setIsEstimating(false)
    }
  }, [canEstimate, tab, recipient, amount, tokenAddress])

  const handleSend = useCallback(async () => {
    if (!canSend) return
    setError(null)
    setIsSending(true)
    setTxStatus('pending')
    setTxHash(null)
    try {
      let receipt: any
      if (tab === 'eth') {
        receipt = await window.electronAPI.sendEth(0, recipient, amount)
      } else {
        receipt = await window.electronAPI.sendErc20(0, tokenAddress, recipient, amount)
      }
      if (receipt && receipt.hash) {
        setTxHash(receipt.hash)
      }
      setTxStatus('confirmed')
      loadBalance()
      loadTransactions()
    } catch (e: any) {
      setTxStatus('failed')
      const msg = e?.message || 'Transaction failed'
      if (msg.includes('insufficient funds')) {
        setError('Insufficient funds for this transaction (including gas)')
      } else if (msg.includes('nonce')) {
        setError('Transaction nonce conflict. Please try again.')
      } else {
        setError(msg)
      }
    } finally {
      setIsSending(false)
    }
  }, [canSend, tab, recipient, amount, tokenAddress, loadBalance, loadTransactions])

  const resetForm = useCallback(() => {
    setRecipient('')
    setAmount('')
    setGasEstimate(null)
    setTxHash(null)
    setError(null)
    setTxStatus('idle')
  }, [])

  if (!currentAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">
        <div className="card max-w-md w-full text-center">
          <p className="text-red-400 mb-4">No wallet found</p>
          <button onClick={() => navigate('/onboarding')} className="button button-primary w-full">
            Go to Onboarding
          </button>
        </div>
      </div>
    )
  }

  // Success screen
  if (txStatus === 'confirmed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">
        <div className="max-w-md w-full">
          <div className="card text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-[#f2f2f2] mb-2">Transaction Sent!</h2>
            <p className="text-gray-400 mb-4">
              Your {tab === 'eth' ? 'ETH' : 'token'} transfer has been confirmed on the blockchain.
            </p>

            {txHash && (
              <div className="bg-dark-800 rounded-lg p-3 mb-4 border border-dark-600">
                <p className="text-xs text-gray-500 mb-1">Transaction Hash</p>
                <p className="font-mono text-xs text-gray-300 break-all select-all">{txHash}</p>
                <a
                  href={`https://etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-500 hover:text-primary-400 mt-1 inline-block"
                  onClick={(e) => {
                    e.preventDefault()
                    navigator.clipboard.writeText(`https://etherscan.io/tx/${txHash}`)
                  }}
                >
                  📋 Copy Etherscan Link
                </a>
              </div>
            )}

            <div className="space-y-3">
              <button className="button button-primary w-full" onClick={() => navigate('/wallet')}>
                Back to Wallet
              </button>
              <button className="button button-secondary w-full" onClick={resetForm}>
                Send Another
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900 p-4 overflow-y-auto">
      <div className="max-w-lg mx-auto py-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#f2f2f2] mb-2">Send Crypto</h1>
          <p className="text-gray-400 text-sm">
            Send ETH or ERC-20 tokens to any Ethereum address
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-dark-700 rounded-lg border border-dark-600 mb-6 overflow-hidden">
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'eth'
                ? 'bg-primary-600 text-white'
                : 'text-gray-400 hover:bg-dark-600'
            }`}
            onClick={() => { setTab('eth'); setGasEstimate(null); setError(null) }}
          >
            ETH
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'erc20'
                ? 'bg-primary-600 text-white'
                : 'text-gray-400 hover:bg-dark-600'
            }`}
            onClick={() => { setTab('erc20'); setGasEstimate(null); setError(null) }}
          >
            ERC-20 Token
          </button>
        </div>

        <div className="card mb-6">
          {/* From */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">From</label>
            <div className="bg-dark-800 rounded-lg p-3 border border-dark-600">
              <p className="font-mono text-xs text-gray-400 truncate">{currentAddress}</p>
              {ethBalance && (
                <p className="text-xs text-gray-500 mt-1">Balance: {ethBalance} ETH</p>
              )}
            </div>
          </div>

          {/* Token Address for ERC-20 */}
          {tab === 'erc20' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Token Contract Address</label>
              <input
                type="text"
                className="input text-sm"
                placeholder="0x..."
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value.trim())}
              />
            </div>
          )}

          {/* Recipient */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">Recipient Address</label>
            <input
              type="text"
              className="input text-sm"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => { setRecipient(e.target.value.trim()); setGasEstimate(null) }}
            />
            {recipient && !isValidAddress(recipient) && (
              <p className="text-red-400 text-xs mt-1">Invalid Ethereum address</p>
            )}
          </div>

          {/* Amount */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Amount ({tab === 'eth' ? 'ETH' : 'Tokens'})
            </label>
            <input
              type="text"
              className="input text-sm"
              placeholder="0.0"
              value={amount}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, '')
                setAmount(val)
                setGasEstimate(null)
              }}
            />
            {amount && !isValidAmount(amount) && (
              <p className="text-red-400 text-xs mt-1">Enter a valid positive amount</p>
            )}
          </div>

          {/* Gas Estimate */}
          {gasEstimate && (
            <div className="bg-primary-600/10 border border-primary-600/30 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-300">
                ⛽ Estimated gas fee: <strong>{parseFloat(gasEstimate).toFixed(8)} ETH</strong>
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {!gasEstimate && (
              <button
                className="button button-secondary w-full"
                onClick={estimateGas}
                disabled={!canEstimate || isEstimating}
              >
                {isEstimating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="loading-spinner"></span>
                    Estimating Gas...
                  </span>
                ) : (
                  '⛽ Estimate Gas Fee'
                )}
              </button>
            )}

            <button
              className="button button-primary w-full py-4"
              onClick={handleSend}
              disabled={!canSend || isSending}
            >
              {isSending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="loading-spinner"></span>
                  Sending Transaction...
                </span>
              ) : txStatus === 'failed' ? (
                '🔄 Retry Send'
              ) : (
                `📤 Send ${tab === 'eth' ? 'ETH' : 'Tokens'}`
              )}
            </button>
          </div>
        </div>

        <button
          className="button button-secondary w-full"
          onClick={() => navigate('/wallet')}
          disabled={isSending}
        >
          ← Back to Wallet
        </button>
      </div>
    </div>
  )
}

export default SendScreen
