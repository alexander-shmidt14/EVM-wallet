import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share
} from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { colors, spacing, typography } from '@wallet/ui-tokens'
import { useWalletStore } from '../store/wallet'

export const ReceiveScreen: React.FC = () => {
  const { currentAddress } = useWalletStore()
  const [copied, setCopied] = useState(false)

  const handleCopyAddress = async () => {
    if (currentAddress) {
      // В production нужно использовать Clipboard из react-native-clipboard/clipboard
      // Clipboard.setString(currentAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShareAddress = async () => {
    if (currentAddress) {
      try {
        await Share.share({
          message: `My Ethereum address: ${currentAddress}`,
          title: 'My Wallet Address'
        })
      } catch (error) {
        console.error('Share error:', error)
      }
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`
  }

  if (!currentAddress) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No wallet address available</Text>
      </View>
    )
  }

  const qrValue = `ethereum:${currentAddress}`

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Receive ETH & Tokens</Text>
        <Text style={styles.subtitle}>
          Send only Ethereum (ETH) and ERC-20 tokens to this address
        </Text>
      </View>

      <View style={styles.qrContainer}>
        <View style={styles.qrWrapper}>
          <QRCode
            value={qrValue}
            size={200}
            backgroundColor={colors.light.background}
            color={colors.light.text}
          />
        </View>
      </View>

      <View style={styles.addressContainer}>
        <Text style={styles.addressLabel}>Your Address</Text>
        <View style={styles.addressBox}>
          <Text style={styles.addressText}>{currentAddress}</Text>
        </View>
        <Text style={styles.addressShort}>
          {formatAddress(currentAddress)}
        </Text>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.copyButton]}
          onPress={handleCopyAddress}
        >
          <Text style={styles.actionButtonText}>
            {copied ? 'Copied!' : 'Copy Address'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={handleShareAddress}
        >
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.warningContainer}>
        <Text style={styles.warningText}>
          ⚠️ Only send ETH and ERC-20 tokens to this address. 
          Sending other cryptocurrencies may result in permanent loss.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
    padding: spacing[6],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.light.text,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * 1.5,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  qrWrapper: {
    padding: spacing[4],
    backgroundColor: colors.light.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.light.border,
    shadowColor: colors.light.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressContainer: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  addressLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.light.textSecondary,
    marginBottom: spacing[2],
  },
  addressBox: {
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: 8,
    padding: spacing[3],
    marginBottom: spacing[2],
    maxWidth: '100%',
  },
  addressText: {
    fontSize: typography.fontSize.sm,
    color: colors.light.text,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  addressShort: {
    fontSize: typography.fontSize.base,
    color: colors.light.text,
    fontWeight: typography.fontWeight.medium,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[8],
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  copyButton: {
    backgroundColor: colors.light.primary,
  },
  shareButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.light.primary,
  },
  actionButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  warningContainer: {
    backgroundColor: colors.light.warningLight,
    padding: spacing[4],
    borderRadius: 8,
    marginTop: 'auto',
  },
  warningText: {
    fontSize: typography.fontSize.sm,
    color: colors.light.warning,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * 1.4,
  },
  errorText: {
    fontSize: typography.fontSize.base,
    color: colors.light.error,
    textAlign: 'center',
    marginTop: spacing[10],
  },
})
