import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { OnboardingScreen } from '../renderer/screens/OnboardingScreen'

// Mock the wallet store
jest.mock('../renderer/store/wallet', () => ({
  useWalletStore: () => ({
    initialize: jest.fn(),
    isInitialized: true,
    hasWallet: false,
    isLoading: false,
    error: null,
  }),
}))

const renderWithRouter = (component: React.ReactNode) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  )
}

describe('OnboardingScreen', () => {
  it('renders onboarding screen correctly', () => {
    renderWithRouter(<OnboardingScreen />)
    
    expect(screen.getByText('Smart Wallet')).toBeInTheDocument()
    expect(screen.getByText('Your secure, non-custodial Ethereum wallet')).toBeInTheDocument()
    expect(screen.getByText('Create New Wallet')).toBeInTheDocument()
    expect(screen.getByText('Import Existing Wallet')).toBeInTheDocument()
  })

  it('shows create wallet button', () => {
    renderWithRouter(<OnboardingScreen />)
    
    const createButton = screen.getByText('Create New Wallet')
    expect(createButton).toBeInTheDocument()
    expect(createButton.closest('button')).not.toBeDisabled()
  })

  it('shows import wallet button', () => {
    renderWithRouter(<OnboardingScreen />)
    
    const importButton = screen.getByText('Import Existing Wallet')
    expect(importButton).toBeInTheDocument()
    expect(importButton.closest('button')).not.toBeDisabled()
  })
})
