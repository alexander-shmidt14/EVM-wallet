import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWalletStore } from '../store/wallet'

export const SetPasswordScreen: React.FC = () => {
  const navigate = useNavigate()
  const { setPassword } = useWalletStore()
  const [password, setPasswordValue] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(async () => {
    setError(null)

    if (password.length < 4) {
      setError('Password must be at least 4 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setIsSubmitting(true)
      await setPassword(password)
      navigate('/wallet-select')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to set password')
    } finally {
      setIsSubmitting(false)
    }
  }, [password, confirmPassword, setPassword, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-3xl text-white">🔐</span>
          </div>
          <h1 className="text-3xl font-bold text-[#f2f2f2] mb-3">Set Password</h1>
          <p className="text-gray-400">Create a password to protect your wallet</p>
        </div>

        <div className="card">
          {error && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              className="w-full input"
              placeholder="Enter password (min. 4 characters)"
              value={password}
              onChange={(e) => setPasswordValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
            <input
              type="password"
              className="w-full input"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <button
            className="button button-primary w-full py-3"
            onClick={handleSubmit}
            disabled={isSubmitting || password.length < 4}
          >
            {isSubmitting ? 'Saving...' : '✅ Set Password'}
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Password is stored locally and protects access to the app.
          </p>
        </div>
      </div>
    </div>
  )
}
