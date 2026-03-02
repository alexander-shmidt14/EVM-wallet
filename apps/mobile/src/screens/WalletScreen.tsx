import React, { useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator
} from 'react-native'
import { colors, spacing, typography } from '@wallet/ui-tokens'
import { useWalletStore } from '../store/wallet'

interface WalletScreenProps {
  onReceive: () => void
  onSend: () => void
  onTokens: () => void
}

export const WalletScreen: React.FC<WalletScreenProps> = ({ 
  onReceive, 
  onSend, 
  onTokens 
}) => {
  const { 
    currentAddress, 
    ethBalance, 
    mmaBalance,
    mmaBalanceUsd,
    loadBalance, 
    isLoading 
  } = useWalletStore()

  useEffect(() => {
    loadBalance()
  }, [])

  const onRefresh = useCallback(() => {
    loadBalance()
  }, [loadBalance])

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (!currentAddress) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No wallet found</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={onRefresh}
          colors={[colors.light.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Wallet</Text>
        <TouchableOpacity style={styles.addressContainer}>
          <Text style={styles.addressText}>
            {formatAddress(currentAddress)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <View style={styles.balanceRow}>
          {ethBalance ? (
            <Text style={styles.balanceAmount}>{ethBalance} ETH</Text>
          ) : (
            <ActivityIndicator color={colors.light.primary} />
          )}
        </View>
        <Text style={styles.balanceUsd}>≈ $0.00 USD</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.receiveButton]}
          onPress={onReceive}
        >
          <Text style={styles.actionButtonText}>Receive</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.sendButton]}
          onPress={onSend}
        >
          <Text style={styles.actionButtonText}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* Assets Section */}
      <View style={styles.assetsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Assets</Text>
          <TouchableOpacity onPress={onTokens}>
            <Text style={styles.sectionAction}>Add Token</Text>
          </TouchableOpacity>
        </View>

        {/* ETH Asset */}
        <View style={styles.assetItem}>
          <View style={styles.assetIcon}>
            <Text style={styles.assetIconText}>ETH</Text>
          </View>
          <View style={styles.assetInfo}>
            <Text style={styles.assetName}>Ethereum</Text>
            <Text style={styles.assetSymbol}>ETH</Text>
          </View>
          <View style={styles.assetBalance}>
            <Text style={styles.assetAmount}>
              {ethBalance || '0'} ETH
            </Text>
            <Text style={styles.assetAmountUsd}>$0.00</Text>
          </View>
        </View>

        {/* MMA Token Asset */}
        <View style={styles.assetItem}>
          <View style={[styles.assetIcon, { backgroundColor: '#F59E0B' }]}>
            <Text style={styles.assetIconText}>MMA</Text>
          </View>
          <View style={styles.assetInfo}>
            <Text style={styles.assetName}>MMA Token</Text>
            <Text style={styles.assetSymbol}>MMA</Text>
          </View>
          <View style={styles.assetBalance}>
            <Text style={styles.assetAmount}>
              {mmaBalance || '0'} MMA
            </Text>
            <Text style={styles.assetAmountUsd}>
              ${mmaBalanceUsd || '0.00'}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  contentContainer: {
    paddingBottom: spacing[10],
  },
  header: {
    padding: spacing[6],
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.light.text,
    marginBottom: spacing[3],
  },
  addressContainer: {
    backgroundColor: colors.light.surface,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  addressText: {
    fontSize: typography.fontSize.sm,
    color: colors.light.textSecondary,
    fontFamily: 'monospace',
  },
  balanceCard: {
    margin: spacing[6],
    marginTop: 0,
    padding: spacing[6],
    backgroundColor: colors.light.surface,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  balanceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.light.textSecondary,
    marginBottom: spacing[2],
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  balanceAmount: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.light.text,
  },
  balanceUsd: {
    fontSize: typography.fontSize.base,
    color: colors.light.textMuted,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing[6],
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  receiveButton: {
    backgroundColor: colors.light.success,
  },
  sendButton: {
    backgroundColor: colors.light.primary,
  },
  actionButtonText: {
    color: colors.light.background,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  assetsContainer: {
    paddingHorizontal: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.light.text,
  },
  sectionAction: {
    fontSize: typography.fontSize.sm,
    color: colors.light.primary,
    fontWeight: typography.fontWeight.medium,
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    backgroundColor: colors.light.surface,
    borderRadius: 12,
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  assetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  assetIconText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.light.background,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.light.text,
  },
  assetSymbol: {
    fontSize: typography.fontSize.sm,
    color: colors.light.textSecondary,
  },
  assetBalance: {
    alignItems: 'flex-end',
  },
  assetAmount: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.light.text,
  },
  assetAmountUsd: {
    fontSize: typography.fontSize.sm,
    color: colors.light.textMuted,
  },
  emptyState: {
    padding: spacing[6],
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: colors.light.textMuted,
    textAlign: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.base,
    color: colors.light.error,
    textAlign: 'center',
    marginTop: spacing[10],
  },
})
