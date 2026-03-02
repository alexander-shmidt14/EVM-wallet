import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native'
import { colors, spacing, typography } from '@wallet/ui-tokens'
import { useWalletStore } from '../store/wallet'

export const OnboardingScreen: React.FC<{ 
  onCreateWallet: () => void
  onImportWallet: () => void 
}> = ({ onCreateWallet, onImportWallet }) => {
  const { initialize, isInitialized, hasWallet, isLoading, error } = useWalletStore()

  useEffect(() => {
    initialize()
  }, [])

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.light.primary} />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    )
  }

  if (hasWallet) {
    return null // Wallet exists, navigation will handle this
  }

  if (error) {
    Alert.alert('Error', error)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Smart Wallet</Text>
        <Text style={styles.subtitle}>
          Your secure, non-custodial Ethereum wallet
        </Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={onCreateWallet}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.light.background} />
          ) : (
            <Text style={styles.primaryButtonText}>Create New Wallet</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onImportWallet}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>Import Existing Wallet</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[12],
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.light.text,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.lg * 1.5,
  },
  content: {
    gap: spacing[4],
    marginBottom: spacing[8],
  },
  button: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.light.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.light.border,
  },
  primaryButtonText: {
    color: colors.light.background,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  secondaryButtonText: {
    color: colors.light.text,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.light.textMuted,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: spacing[4],
    fontSize: typography.fontSize.base,
    color: colors.light.textSecondary,
    textAlign: 'center',
  },
})
