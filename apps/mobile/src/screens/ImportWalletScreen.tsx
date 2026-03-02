import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native'
import { colors, spacing, typography } from '@wallet/ui-tokens'
import { useWalletStore } from '../store/wallet'

interface ImportWalletScreenProps {
  onComplete: () => void
}

export const ImportWalletScreen: React.FC<ImportWalletScreenProps> = ({ onComplete }) => {
  const [seedPhrase, setSeedPhrase] = useState('')
  const [words, setWords] = useState<string[]>(Array(12).fill(''))
  const { importWallet, isLoading, error } = useWalletStore()

  const handleWordChange = useCallback((index: number, word: string) => {
    const newWords = [...words]
    newWords[index] = word.toLowerCase().trim()
    setWords(newWords)
    setSeedPhrase(newWords.join(' ').trim())
  }, [words])

  const handlePastePhrase = useCallback((text: string) => {
    const phraseWords = text.toLowerCase().trim().split(/\s+/).slice(0, 12)
    const newWords = Array(12).fill('')
    phraseWords.forEach((word, index) => {
      if (index < 12) newWords[index] = word
    })
    setWords(newWords)
    setSeedPhrase(phraseWords.join(' '))
  }, [])

  const handleImport = useCallback(async () => {
    const cleanPhrase = seedPhrase.trim()
    const wordCount = cleanPhrase.split(/\s+/).length
    
    if (wordCount !== 12) {
      Alert.alert('Invalid Seed Phrase', 'Please enter exactly 12 words.')
      return
    }

    try {
      await importWallet(cleanPhrase)
      onComplete()
    } catch (error) {
      Alert.alert(
        'Import Failed',
        error instanceof Error ? error.message : 'Invalid seed phrase'
      )
    }
  }, [seedPhrase, importWallet, onComplete])

  if (error) {
    Alert.alert('Error', error)
  }

  const isValidLength = seedPhrase.trim().split(/\s+/).length === 12

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Import Wallet</Text>
        <Text style={styles.subtitle}>
          Enter your 12-word seed phrase to restore your wallet
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Seed Phrase</Text>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={4}
          placeholder="Enter your 12-word seed phrase..."
          value={seedPhrase}
          onChangeText={(text) => handlePastePhrase(text)}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={false}
        />
      </View>

      <View style={styles.wordsGrid}>
        <Text style={styles.gridLabel}>Or enter words individually:</Text>
        <View style={styles.grid}>
          {words.map((word, index) => (
            <View key={index} style={styles.wordInputContainer}>
              <Text style={styles.wordNumber}>{index + 1}</Text>
              <TextInput
                style={styles.wordInput}
                value={word}
                onChangeText={(text) => handleWordChange(index, text)}
                placeholder={`Word ${index + 1}`}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.statusContainer}>
        <Text style={[
          styles.statusText,
          isValidLength ? styles.validText : styles.invalidText
        ]}>
          {seedPhrase.trim().split(/\s+/).length}/12 words
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          styles.primaryButton,
          !isValidLength && styles.disabledButton
        ]}
        onPress={handleImport}
        disabled={!isValidLength || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.light.background} />
        ) : (
          <Text style={[
            styles.primaryButtonText,
            !isValidLength && styles.disabledButtonText
          ]}>
            Import Wallet
          </Text>
        )}
      </TouchableOpacity>
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
  inputContainer: {
    marginBottom: spacing[6],
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.light.text,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing[2],
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: 8,
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.light.text,
    backgroundColor: colors.light.surface,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  wordsGrid: {
    marginBottom: spacing[6],
  },
  gridLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.light.textSecondary,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  wordInputContainer: {
    width: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: 8,
    padding: spacing[2],
  },
  wordNumber: {
    fontSize: typography.fontSize.xs,
    color: colors.light.textMuted,
    fontWeight: typography.fontWeight.medium,
    minWidth: 16,
  },
  wordInput: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.light.text,
    marginLeft: spacing[2],
    padding: 0,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  validText: {
    color: colors.light.success,
  },
  invalidText: {
    color: colors.light.textMuted,
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
  disabledButton: {
    backgroundColor: colors.light.border,
  },
  primaryButtonText: {
    color: colors.light.background,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  disabledButtonText: {
    color: colors.light.textMuted,
  },
})
