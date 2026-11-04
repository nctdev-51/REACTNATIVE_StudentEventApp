import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { TamaguiProvider } from 'tamagui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import * as Linking from 'expo-linking';

import { store } from './src/store';
import tamaguiConfig from './tamagui.config';
import RootNavigator from './src/navigation/RootNavigator';

/* Cấu hình Deep Link cho sự kiện */
const linking = {
  prefixes: ['studentevent://'],

  config: {
    screens: {
      EventDetail: 'events/:eventId',
    },
  },
};

export default function App() {
  return (
    <Provider store={store}>
      <TamaguiProvider
        config={tamaguiConfig as any}
        defaultTheme="light"
      >
        <SafeAreaProvider>
          <NavigationContainer linking={linking}>
            <StatusBar style="auto" />
            <RootNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </TamaguiProvider>
    </Provider>
  );
}