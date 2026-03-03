import React from 'react'
import type { TransactionInfo } from '../store/wallet'

interface TransactionItemProps {
  tx: TransactionInfo
  currentAddress: string
  onClick: (tx: TransactionInfo) => void
}

/**
 * Строка транзакции в списке:
 * [↑/↓ icon] [type + address] [amount + status]
 */
export const TransactionItem: React.FC<TransactionItemProps> = ({
  tx,
  currentAddress,
  onClick,
}) => {
  const isOutgoing =
    tx.direction === 'out' ||
    tx.from.toLowerCase() === currentAddress.toLowerCase()
  const peerAddress = isOutgoing ? tx.to : tx.from

  const formatAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  const timeAgo = (ts: number): string => {
    const diff = Date.now() - ts
    const secs = Math.floor(diff / 1000)
    if (secs < 60) return `${secs}s ago`
    const mins = Math.floor(secs / 60)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 30) return `${days}d ago`
    return new Date(ts).toLocaleDateString()
  }

  const statusBadge = () => {
    switch (tx.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-900/40 text-yellow-400 border border-yellow-700/30">
            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1 animate-pulse" />
            Pending
          </span>
        )
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-900/40 text-emerald-400 border border-emerald-700/30">
            ✓ Confirmed
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-900/40 text-red-400 border border-red-700/30">
            ✕ Failed
          </span>
        )
    }
  }

  const tokenLabel =
    tx.type === 'erc20' && tx.tokenSymbol ? tx.tokenSymbol : 'ETH'

  return (
    <button
      onClick={() => onClick(tx)}
      className="w-full flex items-center justify-between p-3 bg-dark-800 rounded-lg border border-dark-600 hover:border-primary-600/40 hover:bg-dark-700 transition-all duration-200 cursor-pointer group"
    >
      {/* Left: direction icon + info */}
      <div className="flex items-center min-w-0">
        {/* Direction icon */}
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
            isOutgoing
              ? 'bg-red-900/30 text-red-400 border border-red-700/30'
              : 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/30'
          }`}
        >
          {isOutgoing ? '↑' : '↓'}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#f2f2f2]">
              {isOutgoing ? 'Sent' : 'Received'} {tokenLabel}
            </span>
            {statusBadge()}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {isOutgoing ? 'To' : 'From'}: {formatAddr(peerAddress)}
          </p>
        </div>
      </div>

      {/* Right: amount + time */}
      <div className="flex-shrink-0 text-right ml-3">
        <p
          className={`text-sm font-medium ${
            isOutgoing ? 'text-red-400' : 'text-emerald-400'
          }`}
        >
          {isOutgoing ? '-' : '+'}{tx.value} {tokenLabel}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{timeAgo(tx.timestamp)}</p>
      </div>

      {/* Hover arrow */}
      <div className="flex-shrink-0 ml-2 text-gray-600 group-hover:text-primary-400 transition-colors">
        ›
      </div>
    </button>
  )
}
