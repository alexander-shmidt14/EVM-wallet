import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWalletStore } from '../store/wallet'
import iconApp from '../assets/icon_app.png'

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useWalletStore()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = useCallback(async () => {
    setError(null)

    if (!password) {
      setError('Please enter your password')
      return
    }

    try {
      setIsSubmitting(true)
      const valid = await login(password)
      if (valid) {
        navigate('/wallet-select')
      } else {
        setError('Incorrect password')
        setPassword('')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login error')
    } finally {
      setIsSubmitting(false)
    }
  }, [password, login, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img
            src={iconApp}
            alt="EVM Wallet"
            className="w-20 h-20 mx-auto mb-6 rounded-2xl object-cover"
          />
          <h1 className="text-3xl font-bold text-[#f2f2f2] mb-3">EVM Wallet</h1>
          <p className="text-gray-400">Enter your password to continue</p>
        </div>

        <div className="card">
          {error && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              className="w-full input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              autoFocus
            />
          </div>

          <button
            className="button button-primary w-full py-3"
            onClick={handleLogin}
            disabled={isSubmitting || !password}
          >
            {isSubmitting ? 'Verifying...' : '🔓 Log In'}
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">🔐 Your keys, your crypto.</p>
        </div>
      </div>
    </div>
  )
}
