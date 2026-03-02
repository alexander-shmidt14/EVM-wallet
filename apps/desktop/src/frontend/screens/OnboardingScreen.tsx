import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWalletStore } from '../store/wallet'
import { Loading } from '../components/Loading'

export const OnboardingScreen: React.FC = () => {
  const navigate = useNavigate()
  const { initialize, isInitialized, hasWallet, isLoading, error } = useWalletStore()

  useEffect(() => {
    initialize()
  }, [])

  useEffect(() => {
    if (isInitialized && hasWallet) {
      navigate('/wallet')
    }
  }, [isInitialized, hasWallet, navigate])

  if (!isInitialized) {
    return <Loading fullScreen message="Initializing..." />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-[#f2f2f2] mb-2">
            Initialization Error
          </h2>
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="button button-primary w-full"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8 fade-in">
          <div className="w-20 h-20 mx-auto mb-6 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-600/20">
            <span className="text-3xl text-white font-bold">EVM</span>
          </div>
          
          <h1 className="text-4xl font-bold text-[#f2f2f2] mb-4">
            EVM Wallet
          </h1>
          
          <p className="text-lg text-gray-400 mb-2">
            Your secure, non-custodial Ethereum wallet
          </p>
          
          <p className="text-sm text-gray-500">
            Store, send, and receive ETH & ERC-20 tokens safely
          </p>
        </div>

        <div className="card fade-in">
          <div className="space-y-4 mb-6">
            <button
              className="button button-primary w-full py-4 text-base"
              onClick={() => navigate('/create-wallet')}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loading size="sm" />
                  <span>Loading...</span>
                </div>
              ) : (
                <>
                  <span className="mr-2">🆕</span>
                  Create New Wallet
                </>
              )}
            </button>

            <button
              className="button button-secondary w-full py-4 text-base"
              onClick={() => navigate('/import-wallet')}
              disabled={isLoading}
            >
              <span className="mr-2">📥</span>
              Import Existing Wallet
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500 leading-relaxed">
              By continuing, you agree to our{' '}
              <a href="#" className="text-primary-500 hover:text-primary-400">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary-500 hover:text-primary-400">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            🔐 Your keys, your crypto. Always.
          </p>
        </div>
      </div>
    </div>
  )
}
