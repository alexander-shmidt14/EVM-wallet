import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Clipboard
} from 'react-native'
import { colors, spacing, typography } from '@wallet/ui-tokens'
import { useWalletStore } from '../store/wallet'

interface CreateWalletScreenProps {
  onComplete: () => void
}

export const CreateWalletScreen: React.FC<CreateWalletScreenProps> = ({ onComplete }) => {
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const { createWallet, isLoading, error } = useWalletStore()

  const handleCreateWallet = useCallback(async () => {
    try {
      const phrase = await createWallet()
      setSeedPhrase(phrase)
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create wallet'
      )
    }
  }, [createWallet])

  const handleCopyPhrase = useCallback(async () => {
    if (seedPhrase) {
      await Clipboard.setString(seedPhrase)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [seedPhrase])

  const handleRevealPhrase = useCallback(() => {
    Alert.alert(
      'Security Warning',
      'Make sure no one is watching your screen. Your seed phrase is the key to your wallet.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'I Understand', onPress: () => setIsRevealed(true) }
      ]
    )
  }, [])

  const handleContinue = useCallback(() => {
    Alert.alert(
      'Backup Confirmation',
      'Have you safely backed up your seed phrase? You will need it to recover your wallet.',
      [
        { text: 'Not Yet', style: 'cancel' },
        { text: 'Yes, I have backed it up', onPress: onComplete }
      ]
    )
  }, [onComplete])

  if (error) {
    Alert.alert('Error', error)
  }

  if (!seedPhrase) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Create New Wallet</Text>
          <Text style={styles.subtitle}>
            We'll generate a secure 12-word seed phrase for you
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleCreateWallet}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.light.background} />
          ) : (
            <Text style={styles.primaryButtonText}>Generate Seed Phrase</Text>
          )}
        </TouchableOpacity>
      </View>
    )
  }

  const words = seedPhrase.split(' ')

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Seed Phrase</Text>
        <Text style={styles.subtitle}>
          Write down these 12 words in order. Keep them safe and secret.
        </Text>
      </View>

      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          ⚠️ Never share your seed phrase with anyone. Anyone with your seed phrase can access your wallet.
        </Text>
      </View>

      {!isRevealed ? (
        <View style={styles.hiddenContainer}>
          <Text style={styles.hiddenText}>Tap to reveal your seed phrase</Text>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleRevealPhrase}
          >
            <Text style={styles.primaryButtonText}>Reveal Seed Phrase</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.seedContainer}>
            {words.map((word, index) => (
              <View key={index} style={styles.seedWord}>
                <Text style={styles.seedWordNumber}>{index + 1}</Text>
                <Text style={styles.seedWordText}>{word}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleCopyPhrase}
            >
              <Text style={styles.secondaryButtonText}>
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleContinue}
            >
              <Text style={styles.primaryButtonText}>I've Backed It Up</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  contentContainer: {
    padding: spacing[6],
    paddingBottom: spacing[10],
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
  warningBox: {
    backgroundColor: colors.light.warningLight,
    padding: spacing[4],
    borderRadius: 8,
    marginBottom: spacing[6],
  },
  warningText: {
    color: colors.light.warning,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  hiddenContainer: {
    alignItems: 'center',
    padding: spacing[8],
  },
  hiddenText: {
    fontSize: typography.fontSize.base,
    color: colors.light.textSecondary,
    marginBottom: spacing[6],
    textAlign: 'center',
  },
  seedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[8],
  },
  seedWord: {
    width: '30%',
    backgroundColor: colors.light.surface,
    padding: spacing[3],
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  seedWordNumber: {
    fontSize: typography.fontSize.xs,
    color: colors.light.textMuted,
    fontWeight: typography.fontWeight.medium,
    minWidth: 16,
  },
  seedWordText: {
    fontSize: typography.fontSize.sm,
    color: colors.light.text,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
    marginLeft: spacing[2],
  },
  actions: {
    gap: spacing[3],
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
})
