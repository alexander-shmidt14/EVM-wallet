import React, { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWalletStore } from '../store/wallet'

export const WalletScreen: React.FC = () => {
  const navigate = useNavigate()
  const { 
    currentAddress, 
    ethBalance, 
    mmaBalance,
    mmaBalanceUsd,
    ethBalanceUsd,
    totalBalanceUsd,
    seedPhrase,
    activeWalletName,
    activeWalletId,
    loadBalance,
    loadSeedPhrase,
    deleteWallet,
    isLoading 
  } = useWalletStore()

  const [seedVisible, setSeedVisible] = useState(false)
  const [seedCopied, setSeedCopied] = useState(false)
  const [addressCopied, setAddressCopied] = useState(false)

  useEffect(() => {
    loadBalance()
    loadSeedPhrase()
    const interval = setInterval(loadBalance, 30000)
    return () => clearInterval(interval)
  }, [loadBalance, loadSeedPhrase])

  const onRefresh = useCallback(() => {
    loadBalance()
  }, [loadBalance])

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`
  }

  const copyAddress = useCallback(async () => {
    if (currentAddress) {
      try { await navigator.clipboard.writeText(currentAddress) } catch {}
      setAddressCopied(true)
      setTimeout(() => setAddressCopied(false), 2000)
    }
  }, [currentAddress])

  const copySeed = useCallback(async () => {
    if (seedPhrase) {
      try { await navigator.clipboard.writeText(seedPhrase) } catch {
        const ta = document.createElement('textarea')
        ta.value = seedPhrase
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setSeedCopied(true)
      setTimeout(() => setSeedCopied(false), 2500)
    }
  }, [seedPhrase])

  const handleResetWallet = useCallback(async () => {
    if (activeWalletId && confirm('Delete this wallet? Make sure you have saved the seed phrase!')) {
      await deleteWallet(activeWalletId)
      navigate('/wallet-select')
    }
  }, [deleteWallet, activeWalletId, navigate])

  if (!currentAddress) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-900">
        <div className="text-center text-red-400">
          <p>No wallet found</p>
          <button 
            className="button button-secondary mt-4"
            onClick={() => navigate('/wallet-select')}
          >
            Select Wallet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-[#f2f2f2] mb-3">{activeWalletName || 'My Wallet'}</h1>
        <button 
          onClick={copyAddress}
          className="bg-dark-700 hover:bg-dark-600 px-4 py-2 rounded-lg border border-dark-600 transition-colors cursor-pointer"
        >
          <span className="text-sm font-mono text-gray-300">
            {addressCopied ? '✅ Copied!' : formatAddress(currentAddress)}
          </span>
        </button>
      </div>

      {/* Seed Phrase Section */}
      <div className="card mb-6 border-amber-700/30 bg-amber-900/10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-300">🔑 Seed Phrase</p>
          <div className="flex gap-2">
            <button
              onClick={() => setSeedVisible(!seedVisible)}
              className="text-xs px-3 py-1 rounded-md bg-dark-700 border border-dark-600 hover:bg-dark-600 transition-colors text-gray-300"
            >
              {seedVisible ? '🙈 Hide' : '👁️ Show'}
            </button>
            {seedVisible && seedPhrase && (
              <button
                onClick={copySeed}
                className="text-xs px-3 py-1 rounded-md bg-primary-600 hover:bg-primary-700 text-white transition-colors"
              >
                {seedCopied ? '✅ Copied!' : '📋 Copy'}
              </button>
            )}
          </div>
        </div>
        {seedVisible && seedPhrase ? (
          <div className="bg-dark-800 rounded-lg p-3 border border-dark-600">
            <div className="grid grid-cols-4 gap-2">
              {seedPhrase.split(' ').map((word, i) => (
                <div key={i} className="flex items-center bg-dark-700 rounded px-2 py-1.5 border border-dark-600">
                  <span className="text-[10px] text-gray-500 font-mono mr-1.5 min-w-[14px]">{i + 1}</span>
                  <span className="text-xs font-medium text-gray-200">{word}</span>
                </div>
              ))}
            </div>
          </div>
        ) : !seedVisible ? (
          <p className="text-xs text-gray-500">Click "Show" to reveal your seed phrase</p>
        ) : (
          <p className="text-xs text-gray-500">Loading seed phrase...</p>
        )}
      </div>

      {/* Balance Card */}
      <div className="card text-center mb-8 bg-dark-800 border-dark-600">
        <p className="text-sm text-gray-400 mb-2">Total Balance</p>

        <p className="text-4xl font-bold text-[#f2f2f2]">≈ {'$'}{totalBalanceUsd || '0.00'} USD</p>

        <div className="flex items-center justify-center mb-2">
          {ethBalance ? (
            <span className="text-gray-500">{ethBalance} ETH</span>
          ) : isLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          ) : (
            <span className="text-4xl font-bold text-[#f2f2f2]">0 ETH</span>
          )}
        </div>
        
        
        <button 
          onClick={onRefresh}
          className="mt-4 text-sm text-primary-500 hover:text-primary-400 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 mb-8">
        <button
          className="flex-1 button bg-green-700 hover:bg-green-800 text-white"
          onClick={() => navigate('/receive')}
        >
          Receive
        </button>

        <button
          className="flex-1 button button-primary"
          onClick={() => navigate('/send')}
        >
          Send
        </button>
      </div>

      {/* Assets Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#f2f2f2]">Assets</h2>
          <button 
            className="text-primary-500 hover:text-primary-400 text-sm font-medium transition-colors"
            onClick={() => {
              alert('Add token functionality coming soon!')
            }}
          >
            Add Token
          </button>
        </div>

        {/* ETH Asset */}
        <div className="card flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-dark-500 rounded-full flex items-center justify-center mr-4">
              <span className="text-white font-bold text-sm">ETH</span>
            </div>
            <div>
              <p className="font-medium text-[#f2f2f2]">Ethereum</p>
              <p className="text-sm text-gray-500">ETH</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium text-[#f2f2f2]">
              {ethBalance || '0'} ETH
            </p>
            <p className="text-sm text-gray-500">${ethBalanceUsd || '0.00'}</p>
          </div>
        </div>

        {/* MMA Token Asset */}
        <div className="card flex items-center justify-between mt-2">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center mr-4">
              <span className="text-white font-bold text-xs">MMA</span>
            </div>
            <div>
              {/* MMA Token */}
              <p className="font-medium text-[#f2f2f2]">MMA Coin</p>
              <p className="text-sm text-gray-500">MMA</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium text-[#f2f2f2]">
              {mmaBalance || '0'} MMA
            </p>
            <p className="text-sm text-gray-500">${mmaBalanceUsd || '0.00'}</p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#f2f2f2]">Recent Transactions</h2>
        </div>
        
        <div className="text-center py-12">
          <p className="text-gray-500">
            No recent transactions.
          </p>
        </div>
      </div>

      {/* Wallet Management */}
      <div className="mt-8 pt-6 border-t border-dark-600">
        <div className="flex gap-3">
          <button
            className="flex-1 button bg-dark-700 text-primary-400 border border-primary-600/30 hover:bg-dark-600 transition-colors"
            onClick={() => navigate('/wallet-select')}
          >
            🔄 Switch Wallet
          </button>
          <button
            className="flex-1 button text-red-400 border border-red-700/30 hover:bg-red-900/20 transition-colors"
            onClick={handleResetWallet}
          >
          🗑️ Delete Wallet
        </button>
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          Switch wallet or delete current one. Make sure the seed phrase is saved!
        </p>
      </div>
    </div>
  )
}
