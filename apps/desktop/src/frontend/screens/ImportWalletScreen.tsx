import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWalletStore } from '../store/wallet'

export const ImportWalletScreen: React.FC = () => {
  const navigate = useNavigate()
  const [walletName, setWalletName] = useState('')
  const [seedPhrase, setSeedPhrase] = useState('')
  const [words, setWords] = useState<string[]>(Array(12).fill(''))
  const { importNewWallet, isLoading, error } = useWalletStore()

  const handleWordChange = useCallback((index: number, word: string) => {
    const newWords = [...words]
    newWords[index] = word.toLowerCase().trim()
    setWords(newWords)
    setSeedPhrase(newWords.join(' ').trim())
  }, [words])

  const handlePastePhrase = useCallback((text: string) => {
    const phraseWords = text.toLowerCase().trim().split(/\s+/).slice(0, 12)
    const newWords = Array(12).fill('')
    phraseWords.forEach((word, index) => {
      if (index < 12) newWords[index] = word
    })
    setWords(newWords)
    setSeedPhrase(phraseWords.join(' '))
  }, [])

  const handleImport = useCallback(async () => {
    const cleanPhrase = seedPhrase.trim()
    const wordCount = cleanPhrase.split(/\s+/).length
    
    if (wordCount !== 12) {
      alert('Please enter exactly 12 words.')
      return
    }

    const name = walletName.trim() || `Wallet ${Date.now().toString().slice(-4)}`

    try {
      await importNewWallet(name, cleanPhrase)
      navigate('/wallet')
    } catch (error) {
      console.error('Import error:', error)
    }
  }, [seedPhrase, walletName, importNewWallet, navigate])

  if (error) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-md">
        <div className="text-center text-red-400">
          <p>Error: {error}</p>
          <button 
            className="button button-secondary mt-4"
            onClick={() => navigate('/wallet-select')}
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  const isValidLength = seedPhrase.trim().split(/\s+/).length === 12

  return (
    <div className="container mx-auto px-6 py-8 max-w-2xl max-h-screen overflow-y-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-[#f2f2f2] mb-2">
          Import Wallet
        </h1>
        <p className="text-gray-400">
          Enter your 12-word seed phrase to restore your wallet
        </p>
      </div>

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

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Seed Phrase
        </label>
        <textarea
          className="w-full input min-h-[100px] resize-none"
          placeholder="Enter your 12-word seed phrase..."
          value={seedPhrase}
          onChange={(e) => handlePastePhrase(e.target.value)}
          rows={4}
        />
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-500 text-center mb-3">
          Or enter words one by one:
        </p>
        <div className="grid grid-cols-3 gap-2">
          {words.map((word, index) => (
            <div key={index} className="flex items-center border border-dark-600 rounded-lg p-2">
              <span className="text-xs text-gray-500 mr-2 min-w-[20px]">
                {index + 1}
              </span>
              <input
                type="text"
                className="flex-1 text-sm border-none outline-none bg-transparent"
                value={word}
                onChange={(e) => handleWordChange(index, e.target.value)}
                placeholder={`Word ${index + 1}`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mb-6">
        <span className={`text-sm font-medium ${isValidLength ? 'text-green-400' : 'text-gray-500'}`}>
          {seedPhrase.trim().split(/\s+/).length}/12 words
        </span>
      </div>

      <div className="space-y-3">
        <button
          className={`w-full button ${isValidLength ? 'button-primary' : 'button button-secondary opacity-50 cursor-not-allowed'}`}
          onClick={handleImport}
          disabled={!isValidLength || isLoading}
        >
          {isLoading ? 'Importing...' : 'Import Wallet'}
        </button>

        <button
          className="w-full button button-secondary"
          onClick={() => navigate('/wallet-select')}
        >
          Back
        </button>
      </div>
    </div>
  )
}
