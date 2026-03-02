import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWalletStore } from '../store/wallet'

const CreateWalletScreen: React.FC = () => {
  const navigate = useNavigate()
  const { createNewWallet, isLoading } = useWalletStore()
  const [walletName, setWalletName] = useState('')
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = useCallback(async () => {
    const name = walletName.trim() || `Wallet ${Date.now().toString().slice(-4)}`
    try {
      setError(null)
      const phrase = await createNewWallet(name)
      setSeedPhrase(phrase)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create wallet')
    }
  }, [createNewWallet, walletName])

  const handleCopy = useCallback(async () => {
    if (!seedPhrase) return
    try {
      await navigator.clipboard.writeText(seedPhrase)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = seedPhrase
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }, [seedPhrase])

  const handleContinue = useCallback(() => {
    navigate('/wallet')
  }, [navigate])

  // Step 1: Name + Generate
  if (!seedPhrase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-2xl text-white">🔑</span>
            </div>
            <h1 className="text-3xl font-bold text-[#f2f2f2] mb-3">Create Wallet</h1>
            <p className="text-gray-400">
              We will generate a 12-word seed phrase — the master key to your wallet.
            </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 mb-6 text-center">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="card">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Wallet Name</label>
              <input
                type="text"
                className="w-full input"
                placeholder="My Wallet"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
              />
            </div>

            <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-4 mb-6">
              <p className="text-amber-400 text-sm font-medium">
                ⚠️ The seed phrase is the ONLY way to recover your wallet. Write it down and keep it in a safe place.
              </p>
            </div>

            <button
              className="button button-primary w-full py-4 text-base"
              onClick={handleGenerate}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="loading-spinner"></span>
                  Generating...
                </span>
              ) : (
                '🆕 Generate Seed Phrase'
              )}
            </button>

            <button
              className="button button-secondary w-full mt-3"
              onClick={() => navigate('/wallet-select')}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: Show & Backup
  const words = seedPhrase.split(' ')

  return (
    <div className="min-h-screen bg-dark-900 p-4 overflow-y-auto">
      <div className="max-w-lg mx-auto py-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#f2f2f2] mb-2">Your Seed Phrase</h1>
          <p className="text-gray-400 text-sm">
            Write down these 12 words in order. Keep them safe.
          </p>
        </div>

        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 mb-6">
          <p className="text-red-400 text-sm font-medium text-center">
            🚫 Never share your seed phrase. Anyone with these words can steal your funds.
          </p>
        </div>

        {!isRevealed ? (
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">🔒</div>
            <p className="text-gray-400 mb-6">Seed phrase is hidden for security</p>
            <button
              className="button button-primary"
              onClick={() => setIsRevealed(true)}
            >
              👁️ Reveal Seed Phrase
            </button>
          </div>
        ) : (
          <>
            <div className="card mb-6">
              <div className="grid grid-cols-3 gap-3">
                {words.map((word, i) => (
                  <div key={i} className="flex items-center bg-dark-800 rounded-lg px-3 py-2 border border-dark-600">
                    <span className="text-xs text-gray-500 font-mono mr-2 min-w-[18px]">{i + 1}</span>
                    <span className="text-sm font-medium text-gray-200">{word}</span>
                  </div>
                ))}
              </div>

              <button
                className="button button-secondary w-full mt-4"
                onClick={handleCopy}
              >
                {copied ? '✅ Copied!' : '📋 Copy'}
              </button>
            </div>

            <div className="card">
              <label className="flex items-start gap-3 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-dark-600 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-300">
                  I have saved the seed phrase and understand that losing it means losing access to my wallet forever.
                </span>
              </label>

              <button
                className="button button-primary w-full py-4"
                onClick={handleContinue}
                disabled={!confirmed}
              >
                ✅ Go to Wallet
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CreateWalletScreen
