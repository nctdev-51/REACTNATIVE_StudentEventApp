import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { TamaguiProvider } from 'tamagui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { store } from './src/store';
import tamaguiConfig from './tamagui.config';
import MainStack from './src/navigation/MainStack';

export default function App() {
  return (
    <Provider store={store}>
      <TamaguiProvider config={tamaguiConfig as any} defaultTheme="light">
        <SafeAreaProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <MainStack />
          </NavigationContainer>
        </SafeAreaProvider>
      </TamaguiProvider>
    </Provider>
  );
}
