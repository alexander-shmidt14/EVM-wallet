import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWalletStore } from '../store/wallet'
import { QRCodeCanvas } from '../components/QRCode'

const ReceiveScreen: React.FC = () => {
  const navigate = useNavigate()
  const { currentAddress } = useWalletStore()
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    if (!currentAddress) return
    try {
      await navigator.clipboard.writeText(currentAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = currentAddress
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }, [currentAddress])

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

  return (
    <div className="min-h-screen bg-dark-900 p-4">
      <div className="max-w-md mx-auto py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#f2f2f2] mb-2">Receive Crypto</h1>
          <p className="text-gray-400 text-sm">
            Share your address or QR code to receive ETH and ERC-20 tokens
          </p>
        </div>

        <div className="card text-center mb-6">
          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-xl shadow-inner">
              <QRCodeCanvas value={currentAddress} size={220} errorCorrectionLevel="H" />
            </div>
          </div>

          {/* Address */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Your Ethereum Address</p>
            <div className="bg-dark-800 rounded-lg p-3 border border-dark-600 break-all">
              <p className="font-mono text-sm text-gray-200 select-all">
                {currentAddress}
              </p>
            </div>
          </div>

          {/* Copy Button */}
          <button
            className="button button-primary w-full"
            onClick={handleCopy}
          >
            {copied ? '✅ Address Copied!' : '📋 Copy Address'}
          </button>
        </div>

        <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-4 mb-6">
          <p className="text-amber-400 text-sm text-center">
            ⚠️ Only send Ethereum (ETH) and ERC-20 tokens to this address. 
            Sending other assets may result in permanent loss.
          </p>
        </div>

        <button
          className="button button-secondary w-full"
          onClick={() => navigate('/wallet')}
        >
          ← Back to Wallet
        </button>
      </div>
    </div>
  )
}

export { ReceiveScreen }
export default ReceiveScreen
