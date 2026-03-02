import 'react-native-get-random-values'
import React, { useState, useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'react-native'

import { OnboardingScreen } from './screens/OnboardingScreen'
import { CreateWalletScreen } from './screens/CreateWalletScreen'
import { ImportWalletScreen } from './screens/ImportWalletScreen'
import { WalletScreen } from './screens/WalletScreen'
import { ReceiveScreen } from './screens/ReceiveScreen'
import { useWalletStore } from './store/wallet'
import { colors } from '@wallet/ui-tokens'

type RootStackParamList = {
  Onboarding: undefined
  CreateWallet: undefined
  ImportWallet: undefined
  Wallet: undefined
  Receive: undefined
  Send: undefined
  Tokens: undefined
}

const Stack = createStackNavigator<RootStackParamList>()

const App: React.FC = () => {
  const { hasWallet, isInitialized, initialize } = useWalletStore()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const initApp = async () => {
      await initialize()
      setIsReady(true)
    }
    initApp()
  }, [])

  if (!isReady || !isInitialized) {
    return null // Или загрузочный экран
  }

  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={colors.light.background} 
      />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={hasWallet ? 'Wallet' : 'Onboarding'}
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.light.background,
            },
            headerTintColor: colors.light.text,
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
        >
          <Stack.Screen 
            name="Onboarding" 
            options={{ headerShown: false }}
          >
            {({ navigation }) => (
              <OnboardingScreen
                onCreateWallet={() => navigation.navigate('CreateWallet')}
                onImportWallet={() => navigation.navigate('ImportWallet')}
              />
            )}
          </Stack.Screen>
          
          <Stack.Screen 
            name="CreateWallet" 
            options={{ 
              title: 'Create Wallet',
              headerBackTitle: 'Back'
            }}
          >
            {({ navigation }) => (
              <CreateWalletScreen
                onComplete={() => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Wallet' }],
                  })
                }}
              />
            )}
          </Stack.Screen>

          <Stack.Screen 
            name="ImportWallet" 
            options={{ 
              title: 'Import Wallet',
              headerBackTitle: 'Back'
            }}
          >
            {({ navigation }) => (
              <ImportWalletScreen
                onComplete={() => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Wallet' }],
                  })
                }}
              />
            )}
          </Stack.Screen>

          <Stack.Screen 
            name="Wallet" 
            options={{ 
              title: 'Wallet',
              headerLeft: () => null,
              gestureEnabled: false
            }}
          >
            {({ navigation }) => (
              <WalletScreen
                onReceive={() => navigation.navigate('Receive')}
                onSend={() => {
                  // TODO: Implement send screen
                  console.log('Navigate to Send')
                }}
                onTokens={() => {
                  // TODO: Implement tokens screen
                  console.log('Navigate to Tokens')
                }}
              />
            )}
          </Stack.Screen>

          <Stack.Screen 
            name="Receive" 
            options={{ 
              title: 'Receive',
              headerBackTitle: 'Wallet'
            }}
            component={ReceiveScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}

export default App
