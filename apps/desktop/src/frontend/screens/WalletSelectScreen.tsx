import React, { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWalletStore } from '../store/wallet'

export const WalletSelectScreen: React.FC = () => {
  const navigate = useNavigate()
  const { walletList, loadWalletList, selectWallet, deleteWallet, isLoading, logout } = useWalletStore()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadWalletList()
  }, [loadWalletList])

  const handleSelect = useCallback(async (walletId: string) => {
    try {
      await selectWallet(walletId)
      navigate('/wallet')
    } catch (error) {
      console.error('Failed to select wallet:', error)
    }
  }, [selectWallet, navigate])

  const handleDelete = useCallback(async (e: React.MouseEvent, walletId: string) => {
    e.stopPropagation()
    if (!confirm('Delete this wallet? Make sure you have the seed phrase saved.')) return

    setDeletingId(walletId)
    try {
      await deleteWallet(walletId)
    } finally {
      setDeletingId(null)
    }
  }, [deleteWallet])

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`
  }

  const handleLogout = useCallback(() => {
    logout()
    navigate('/login')
  }, [logout, navigate])

  return (
    <div className="min-h-screen bg-dark-900 p-4">
      <div className="max-w-lg mx-auto pt-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#f2f2f2]">Wallets</h1>
            <p className="text-gray-400 mt-1">Select or create a wallet</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-300 px-3 py-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            🔒 Lock
          </button>
        </div>

        {/* Saved wallets */}
        {walletList.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Saved Wallets
            </h2>
            <div className="space-y-2">
              {walletList.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => handleSelect(wallet.id)}
                  disabled={isLoading}
                  className="w-full card flex items-center justify-between hover:border-primary-600/50 hover:shadow-lg transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm">💎</span>
                    </div>
                    <div>
                      <p className="font-medium text-[#f2f2f2]">{wallet.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{formatAddress(wallet.address)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(e, wallet.id)}
                      disabled={deletingId === wallet.id}
                      className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                      title="Delete wallet"
                    >
                      🗑️
                    </button>
                    <span className="text-gray-500">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            className="w-full card flex items-center p-5 hover:border-green-600/50 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => navigate('/create-wallet')}
          >
            <div className="w-12 h-12 bg-green-900/30 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl">🆕</span>
            </div>
            <div>
              <p className="font-semibold text-[#f2f2f2]">Create New Wallet</p>
              <p className="text-sm text-gray-500">Generate a new seed phrase</p>
            </div>
          </button>

          <button
            className="w-full card flex items-center p-5 hover:border-purple-600/50 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => navigate('/import-wallet')}
          >
            <div className="w-12 h-12 bg-purple-900/30 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl">📥</span>
            </div>
            <div>
              <p className="font-semibold text-[#f2f2f2]">Import Wallet</p>
              <p className="text-sm text-gray-500">Enter an existing seed phrase</p>
            </div>
          </button>
        </div>

        {walletList.length === 0 && (
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">No saved wallets. Create or import one to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}
