import React, { useEffect, useState, useCallback, useRef } from 'react'
import type { TransactionInfo, TransactionStatus } from '../store/wallet'
import { BlockConfirmationBar } from './BlockConfirmationBar'

interface TransactionDetailPopupProps {
  tx: TransactionInfo
  onClose: () => void
}

/**
 * Popup с деталями транзакции:
 * - Полный hash, from, to, value, type, timestamp, status, blockNumber
 * - Анимация блоков (BlockConfirmationBar) с реальным polling
 * - Кнопка "View on Etherscan"
 */
export const TransactionDetailPopup: React.FC<TransactionDetailPopupProps> = ({
  tx,
  onClose,
}) => {
  const [txStatus, setTxStatus] = useState<TransactionStatus | null>(null)
  const [isPolling, setIsPolling] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const status = await window.electronAPI.getTransactionStatus(tx.hash)
      setTxStatus(status)

      // Stop polling once fully confirmed (12+ blocks) or failed
      if (status.confirmations >= 12 || status.status === 'failed') {
        setIsPolling(false)
      }
    } catch (error) {
      console.error('Failed to fetch tx status:', error)
    }
  }, [tx.hash])

  useEffect(() => {
    // Initial fetch
    fetchStatus()

    // Poll every 5 seconds
    intervalRef.current = setInterval(() => {
      if (isPolling) {
        fetchStatus()
      }
    }, 5000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchStatus, isPolling])

  // Stop interval when polling stops
  useEffect(() => {
    if (!isPolling && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [isPolling])

  const formatAddr = (addr: string) =>
    `${addr.slice(0, 10)}...${addr.slice(-8)}`

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const isOutgoing =
    tx.direction === 'out' || tx.from.toLowerCase() !== tx.to.toLowerCase()
  const tokenLabel =
    tx.type === 'erc20' && tx.tokenSymbol ? tx.tokenSymbol : 'ETH'

  const currentStatus = txStatus?.status || tx.status
  const confirmations = txStatus?.confirmations || tx.confirmations || 0

  const openEtherscan = () => {
    // Opens in system browser via Electron shell or as a link
    window.open(`https://etherscan.io/tx/${tx.hash}`, '_blank')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Popup */}
      <div className="relative bg-dark-900 border border-dark-600 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-600">
          <h3 className="text-lg font-semibold text-[#f2f2f2]">
            Transaction Details
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark-700 hover:bg-dark-600 text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Status + Type header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                  isOutgoing
                    ? 'bg-red-900/30 text-red-400 border border-red-700/30'
                    : 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/30'
                }`}
              >
                {isOutgoing ? '↑' : '↓'}
              </div>
              <div>
                <p className="text-base font-semibold text-[#f2f2f2]">
                  {isOutgoing ? 'Sent' : 'Received'} {tokenLabel}
                </p>
                <p className="text-xs text-gray-500">{formatDate(tx.timestamp)}</p>
              </div>
            </div>

            <div className="text-right">
              <p
                className={`text-xl font-bold ${
                  isOutgoing ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {isOutgoing ? '-' : '+'}{tx.value}
              </p>
              <p className="text-xs text-gray-500">{tokenLabel}</p>
            </div>
          </div>

          {/* Block Confirmation Animation */}
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-600">
            <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">
              Block Confirmations
            </p>
            <BlockConfirmationBar
              confirmations={confirmations}
              status={currentStatus}
              maxBlocks={12}
            />
          </div>

          {/* Details grid */}
          <div className="space-y-2.5">
            {/* Hash */}
            <div className="bg-dark-800 rounded-lg p-3 border border-dark-600">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                Transaction Hash
              </p>
              <p className="font-mono text-xs text-gray-300 break-all select-all">
                {tx.hash}
              </p>
            </div>

            {/* From + To */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-dark-800 rounded-lg p-3 border border-dark-600">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                  From
                </p>
                <p
                  className="font-mono text-xs text-gray-300 select-all truncate"
                  title={tx.from}
                >
                  {formatAddr(tx.from)}
                </p>
              </div>
              <div className="bg-dark-800 rounded-lg p-3 border border-dark-600">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                  To
                </p>
                <p
                  className="font-mono text-xs text-gray-300 select-all truncate"
                  title={tx.to}
                >
                  {formatAddr(tx.to)}
                </p>
              </div>
            </div>

            {/* Block + Status */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-dark-800 rounded-lg p-3 border border-dark-600">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                  Block
                </p>
                <p className="text-xs text-gray-300 font-mono">
                  {txStatus?.txBlock || tx.blockNumber || 'Pending...'}
                </p>
              </div>
              <div className="bg-dark-800 rounded-lg p-3 border border-dark-600">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                  Status
                </p>
                <p
                  className={`text-xs font-medium ${
                    currentStatus === 'confirmed'
                      ? 'text-emerald-400'
                      : currentStatus === 'failed'
                      ? 'text-red-400'
                      : 'text-yellow-400'
                  }`}
                >
                  {currentStatus === 'confirmed'
                    ? `✓ Confirmed (${confirmations} blocks)`
                    : currentStatus === 'failed'
                    ? '✕ Failed'
                    : '● Pending'}
                </p>
              </div>
            </div>

            {/* Token info for ERC-20 */}
            {tx.type === 'erc20' && tx.tokenAddress && (
              <div className="bg-dark-800 rounded-lg p-3 border border-dark-600">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                  Token Contract
                </p>
                <p className="font-mono text-xs text-gray-300 break-all select-all">
                  {tx.tokenAddress}
                </p>
              </div>
            )}
          </div>

          {/* Etherscan button */}
          <button
            onClick={openEtherscan}
            className="w-full button bg-dark-700 border border-dark-600 hover:border-primary-600/40 hover:bg-dark-600 text-primary-400 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>🔗</span>
            <span>View on Etherscan</span>
          </button>
        </div>
      </div>
    </div>
  )
}
