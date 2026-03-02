import React from 'react'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  fullScreen?: boolean
  className?: string
}

export const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  message, 
  fullScreen = false,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const spinner = (
    <div className={`loading-spinner ${sizeClasses[size]} ${className}`} />
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-dark-900 bg-opacity-95 z-50">
        <div className="text-center">
          {spinner}
          {message && (
            <p className="text-gray-400 mt-4">{message}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="text-center">
        {spinner}
        {message && (
          <p className="text-gray-400 mt-2 text-sm">{message}</p>
        )}
      </div>
    </div>
  )
}

export const LoadingButton: React.FC<{
  loading: boolean
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}> = ({ loading, children, className = '', onClick, disabled, type = 'button' }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${className} ${loading ? 'cursor-not-allowed opacity-75' : ''}`}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <Loading size="sm" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  )
}
