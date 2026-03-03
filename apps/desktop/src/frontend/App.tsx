import React, { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppErrorBoundary } from './components/ErrorBoundary'
// import { AppToastContainer } from './components/Toast'
import { Loading } from './components/Loading'
import { SetPasswordScreen } from './screens/SetPasswordScreen'
import { LoginScreen } from './screens/LoginScreen'
import { WalletSelectScreen } from './screens/WalletSelectScreen'
import CreateWalletScreen from './screens/CreateWalletScreen'
import { ImportWalletScreen } from './screens/ImportWalletScreen'
import { WalletScreen } from './screens/WalletScreen'
import { ReceiveScreen } from './screens/ReceiveScreen'
import { SendScreen } from './screens/SendScreen'
import { useWalletStore } from './store/wallet'

const AppContent: React.FC = () => {
  const { isInitialized, hasPassword, isAuthenticated, initialize } = useWalletStore()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const initApp = async () => {
      try {
        await initialize()
        setIsReady(true)
      } catch (error) {
        console.error('Failed to initialize app:', error)
        setIsReady(true)
      }
    }
    initApp()
  }, [initialize])

  if (!isReady || !isInitialized) {
    return (
      <Loading 
        fullScreen 
        message="Initializing EVM Wallet..." 
        size="lg"
      />
    )
  }

  const getDefaultRoute = () => {
    if (!hasPassword) return '/set-password'
    if (!isAuthenticated) return '/login'
    return '/wallet-select'
  }

  return (
    <Router>
      <div className="min-h-screen bg-dark-900">
        <Routes>
          <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
          <Route path="/set-password" element={<SetPasswordScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/wallet-select" element={<WalletSelectScreen />} />
          <Route path="/create-wallet" element={<CreateWalletScreen />} />
          <Route path="/import-wallet" element={<ImportWalletScreen />} />
          <Route path="/wallet" element={<WalletScreen />} />
          <Route path="/receive" element={<ReceiveScreen />} />
          <Route path="/send" element={<SendScreen />} />
        </Routes>
        {/* <AppToastContainer /> */}
        <span style={{ fontSize: '10px', opacity: 0.5, position: 'fixed', bottom: '4px', right: '8px' }}>
          v1.1.1
        </span>
      </div>
    </Router>
  )
}

const App: React.FC = () => {
  return (
    <AppErrorBoundary>
      <AppContent />
    </AppErrorBoundary>
  )
}

export default App
