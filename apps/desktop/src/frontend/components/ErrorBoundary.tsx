import React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">
      <div className="card max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <FiAlertTriangle className="text-red-500 text-6xl" />
        </div>
        
        <h1 className="text-2xl font-bold text-[#f2f2f2] mb-2">
          Oops! Something went wrong
        </h1>
        
        <p className="text-gray-400 mb-4">
          The application encountered an unexpected error. Please try restarting the app.
        </p>
        
        <details className="mb-6">
          <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-300 mb-2">
            Technical Details
          </summary>
          <pre className="text-xs text-left text-red-400 bg-red-900/20 border-red-700/30 p-3 rounded border overflow-auto max-h-32">
            {error.message}
            {error.stack && '\n\n' + error.stack}
          </pre>
        </details>
        
        <div className="space-y-3">
          <button
            onClick={resetErrorBoundary}
            className="button button-primary w-full flex items-center justify-center gap-2"
          >
            <FiRefreshCw size={16} />
            Try Again
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="button button-secondary w-full"
          >
            Reload App
          </button>
        </div>
      </div>
    </div>
  )
}

interface AppErrorBoundaryProps {
  children: React.ReactNode
}

export const AppErrorBoundary: React.FC<AppErrorBoundaryProps> = ({ children }) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Application Error:', error, errorInfo)
        // Here you could send error to logging service
      }}
      onReset={() => {
        // Clear any cached state that might be causing the error
        window.location.reload()
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
