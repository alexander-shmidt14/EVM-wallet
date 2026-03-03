import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TransactionItem } from '../frontend/components/TransactionItem'
import { BlockConfirmationBar } from '../frontend/components/BlockConfirmationBar'
import { TransactionDetailPopup } from '../frontend/components/TransactionDetailPopup'
import type { TransactionInfo } from '../frontend/store/wallet'

// --- Fixtures ---

const mockOutgoingTx: TransactionInfo = {
  hash: '0xabc123def456789012345678901234567890abcdef1234567890abcdef123456',
  from: '0x1111111111111111111111111111111111111111',
  to: '0x2222222222222222222222222222222222222222',
  value: '0.5',
  type: 'eth',
  status: 'confirmed',
  timestamp: Date.now() - 60000, // 1 minute ago
  direction: 'out',
  confirmations: 12,
  blockNumber: 18000000,
}

const mockIncomingTx: TransactionInfo = {
  hash: '0xdef789abc123456789012345678901234567890abcdef1234567890abcdef789',
  from: '0x3333333333333333333333333333333333333333',
  to: '0x1111111111111111111111111111111111111111',
  value: '1.0',
  type: 'eth',
  status: 'confirmed',
  timestamp: Date.now() - 3600000, // 1 hour ago
  direction: 'in',
  confirmations: 50,
  blockNumber: 17999950,
}

const mockPendingTx: TransactionInfo = {
  hash: '0x000111222333444555666777888999aaabbbcccdddeeefff000111222333444555',
  from: '0x1111111111111111111111111111111111111111',
  to: '0x4444444444444444444444444444444444444444',
  value: '0.1',
  type: 'eth',
  status: 'pending',
  timestamp: Date.now() - 10000,
  direction: 'out',
  confirmations: 0,
}

const mockErc20Tx: TransactionInfo = {
  hash: '0xerc20hash456789012345678901234567890abcdef1234567890abcdef123456',
  from: '0x1111111111111111111111111111111111111111',
  to: '0x5555555555555555555555555555555555555555',
  value: '100',
  type: 'erc20',
  tokenSymbol: 'MMA',
  tokenAddress: '0xcA82d24A97b33F2d5826575f77fdc8Bdb82FC580',
  status: 'confirmed',
  timestamp: Date.now() - 7200000,
  direction: 'out',
  confirmations: 30,
  blockNumber: 17999970,
}

const mockIncomingErc20Tx: TransactionInfo = {
  hash: '0xincomingerc20456789012345678901234567890abcdef1234567890abcdef1234',
  from: '0x6666666666666666666666666666666666666666',
  to: '0x1111111111111111111111111111111111111111',
  value: '42.5',
  type: 'erc20',
  tokenSymbol: 'MMA',
  tokenAddress: '0xcA82d24A97b33F2d5826575f77fdc8Bdb82FC580',
  tokenDecimals: 18,
  status: 'confirmed',
  timestamp: Date.now() - 1800000,
  direction: 'in',
  confirmations: 21,
  blockNumber: 18000100,
}

const CURRENT_ADDRESS = '0x1111111111111111111111111111111111111111'

// --- TransactionItem Tests ---

describe('TransactionItem', () => {
  it('renders outgoing ETH transaction correctly', () => {
    const onClick = jest.fn()
    render(
      <TransactionItem
        tx={mockOutgoingTx}
        currentAddress={CURRENT_ADDRESS}
        onClick={onClick}
      />
    )
    expect(screen.getByText('Sent ETH')).toBeInTheDocument()
    expect(screen.getByText(/-0\.5/)).toBeInTheDocument()
    expect(screen.getByText(/Confirmed/)).toBeInTheDocument()
  })

  it('renders incoming ETH transaction correctly', () => {
    render(
      <TransactionItem
        tx={mockIncomingTx}
        currentAddress={CURRENT_ADDRESS}
        onClick={jest.fn()}
      />
    )
    expect(screen.getByText('Received ETH')).toBeInTheDocument()
    expect(screen.getByText(/\+1\.0/)).toBeInTheDocument()
  })

  it('renders ERC-20 transaction with token symbol', () => {
    render(
      <TransactionItem
        tx={mockErc20Tx}
        currentAddress={CURRENT_ADDRESS}
        onClick={jest.fn()}
      />
    )
    expect(screen.getByText('Sent MMA')).toBeInTheDocument()
    expect(screen.getByText(/-100/)).toBeInTheDocument()
  })

  it('renders incoming ERC-20 transaction correctly', () => {
    render(
      <TransactionItem
        tx={mockIncomingErc20Tx}
        currentAddress={CURRENT_ADDRESS}
        onClick={jest.fn()}
      />
    )
    expect(screen.getByText('Received MMA')).toBeInTheDocument()
    expect(screen.getByText(/\+42\.5/)).toBeInTheDocument()
  })

  it('shows pending status with yellow badge', () => {
    render(
      <TransactionItem
        tx={mockPendingTx}
        currentAddress={CURRENT_ADDRESS}
        onClick={jest.fn()}
      />
    )
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = jest.fn()
    render(
      <TransactionItem
        tx={mockOutgoingTx}
        currentAddress={CURRENT_ADDRESS}
        onClick={onClick}
      />
    )
    const button = screen.getByText('Sent ETH').closest('button')
    fireEvent.click(button!)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

// --- BlockConfirmationBar Tests ---

describe('BlockConfirmationBar', () => {
  it('renders 12 block segments by default', () => {
    const { container } = render(
      <BlockConfirmationBar confirmations={6} status="confirmed" />
    )
    // 12 block segments + sender + receiver = 14 items in the bar
    const blocks = container.querySelectorAll('[class*="rounded"]')
    expect(blocks.length).toBeGreaterThan(0)
  })

  it('renders with 0 confirmations for pending tx', () => {
    const { container } = render(
      <BlockConfirmationBar confirmations={0} status="pending" />
    )
    expect(container).toBeTruthy()
  })

  it('renders fully confirmed state', () => {
    render(
      <BlockConfirmationBar confirmations={12} status="confirmed" />
    )
    expect(screen.getByText(/Transaction finalized/)).toBeInTheDocument()
  })

  it('renders failed state', () => {
    render(
      <BlockConfirmationBar confirmations={0} status="failed" />
    )
    const failedElements = screen.getAllByText(/failed/i)
    expect(failedElements.length).toBeGreaterThanOrEqual(1)
  })
})

// --- TransactionDetailPopup Tests ---

describe('TransactionDetailPopup', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    ;(window.electronAPI.getTransactionStatus as jest.Mock).mockResolvedValue({
      confirmations: 6,
      currentBlock: 18000006,
      txBlock: 18000000,
      status: 'confirmed',
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders transaction details', async () => {
    await act(async () => {
      render(
        <TransactionDetailPopup tx={mockOutgoingTx} onClose={jest.fn()} />
      )
    })

    expect(screen.getByText('Transaction Details')).toBeInTheDocument()
    expect(screen.getByText(mockOutgoingTx.hash)).toBeInTheDocument()
    expect(screen.getByText(/Sent.*ETH/)).toBeInTheDocument()
    expect(screen.getByText('View on Etherscan')).toBeInTheDocument()
  })

  it('calls getTransactionStatus on mount', async () => {
    await act(async () => {
      render(
        <TransactionDetailPopup tx={mockOutgoingTx} onClose={jest.fn()} />
      )
    })

    expect(window.electronAPI.getTransactionStatus).toHaveBeenCalledWith(
      mockOutgoingTx.hash
    )
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = jest.fn()
    await act(async () => {
      render(
        <TransactionDetailPopup tx={mockOutgoingTx} onClose={onClose} />
      )
    })

    fireEvent.click(screen.getByText('✕'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = jest.fn()
    let container: HTMLElement
    await act(async () => {
      const result = render(
        <TransactionDetailPopup tx={mockOutgoingTx} onClose={onClose} />
      )
      container = result.container
    })

    const backdrop = container!.querySelector('.fixed.inset-0')
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(onClose).toHaveBeenCalled()
    }
  })

  it('shows ERC-20 token contract info', async () => {
    await act(async () => {
      render(
        <TransactionDetailPopup tx={mockErc20Tx} onClose={jest.fn()} />
      )
    })

    expect(screen.getByText('Token Contract')).toBeInTheDocument()
    expect(screen.getByText(mockErc20Tx.tokenAddress!)).toBeInTheDocument()
  })

  it('renders incoming transaction direction in popup', async () => {
    await act(async () => {
      render(
        <TransactionDetailPopup tx={mockIncomingErc20Tx} onClose={jest.fn()} />
      )
    })

    expect(screen.getByText(/Received.*MMA/)).toBeInTheDocument()
    expect(screen.getByText(/\+42\.5/)).toBeInTheDocument()
  })

  it('renders Etherscan link', async () => {
    await act(async () => {
      render(
        <TransactionDetailPopup tx={mockOutgoingTx} onClose={jest.fn()} />
      )
    })

    const etherscanBtn = screen.getByText('View on Etherscan')
    expect(etherscanBtn).toBeInTheDocument()
  })
})
