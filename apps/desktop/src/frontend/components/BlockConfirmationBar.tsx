import React from 'react'

interface BlockConfirmationBarProps {
  confirmations: number
  status: 'pending' | 'confirmed' | 'failed'
  maxBlocks?: number
}

/**
 * Анимированная шкала подтверждения блоков:
 * [Sender] → [Block 1] → ... → [Block 12] → [Receiver]
 *
 * - Заполненные блоки = зелёные (confirmed)
 * - Текущий блок = пульсирующий жёлтый
 * - Пустые = серые
 * - Failed = красная метка
 */
export const BlockConfirmationBar: React.FC<BlockConfirmationBarProps> = ({
  confirmations,
  status,
  maxBlocks = 12,
}) => {
  const filled = Math.min(confirmations, maxBlocks)
  const isFailed = status === 'failed'
  const isFullyConfirmed = filled >= maxBlocks
  const isPending = status === 'pending' && confirmations === 0

  return (
    <div className="w-full">
      {/* Labels */}
      <div className="flex justify-between text-xs text-gray-400 mb-2">
        <span>Sender</span>
        <span>
          {isFailed
            ? 'Failed'
            : isFullyConfirmed
            ? 'Finalized'
            : `${confirmations} / ${maxBlocks} blocks`}
        </span>
        <span>Receiver</span>
      </div>

      {/* Bar */}
      <div className="flex items-center gap-0.5">
        {/* Sender icon */}
        <div
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            isFailed
              ? 'bg-red-900/50 border border-red-500 text-red-400'
              : 'bg-primary-600/30 border border-primary-600 text-primary-400'
          }`}
        >
          ↑
        </div>

        {/* Connecting line */}
        <div className="w-1.5 h-0.5 bg-dark-600 flex-shrink-0" />

        {/* Blocks */}
        <div className="flex-1 flex items-center gap-0.5">
          {Array.from({ length: maxBlocks }).map((_, i) => {
            const isFilledBlock = i < filled
            const isCurrentBlock =
              !isFailed && !isFullyConfirmed && i === filled
            const isEmpty = !isFilledBlock && !isCurrentBlock

            return (
              <div key={i} className="flex items-center flex-1 min-w-0">
                <div
                  className={`
                    w-full h-3 rounded-sm transition-all duration-500 ease-out
                    ${
                      isFailed && i === 0
                        ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'
                        : isFilledBlock
                        ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.3)]'
                        : isCurrentBlock
                        ? 'bg-yellow-500 animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                        : isEmpty
                        ? 'bg-dark-600'
                        : ''
                    }
                  `}
                />
              </div>
            )
          })}
        </div>

        {/* Connecting line */}
        <div className="w-1.5 h-0.5 bg-dark-600 flex-shrink-0" />

        {/* Receiver icon */}
        <div
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
            isFailed
              ? 'bg-red-900/50 border border-red-700 text-red-500'
              : isFullyConfirmed
              ? 'bg-emerald-900/50 border border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
              : 'bg-dark-700 border border-dark-600 text-gray-500'
          }`}
        >
          ↓
        </div>
      </div>

      {/* Status text */}
      <div className="text-center mt-2">
        {isPending && (
          <span className="text-xs text-yellow-400 animate-pulse">
            Waiting for block inclusion...
          </span>
        )}
        {!isPending && !isFailed && !isFullyConfirmed && confirmations > 0 && (
          <span className="text-xs text-emerald-400">
            Confirming — {confirmations} block{confirmations > 1 ? 's' : ''} passed
          </span>
        )}
        {isFullyConfirmed && (
          <span className="text-xs text-emerald-400 font-medium">
            ✓ Transaction finalized
          </span>
        )}
        {isFailed && (
          <span className="text-xs text-red-400 font-medium">
            ✕ Transaction failed
          </span>
        )}
      </div>
    </div>
  )
}
