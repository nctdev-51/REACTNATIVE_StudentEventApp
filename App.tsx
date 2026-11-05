import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { TamaguiProvider } from 'tamagui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { store } from './src/store';
import tamaguiConfig from './tamagui.config';
import RootNavigator from './src/navigation/RootNavigator';
import { DrawerProvider } from './src/context/DrawerContext';
import LeftNavbarDrawer from './src/components/navigation/LeftNavbarDrawer';
import { navigationRef } from './src/navigation/navigationRef';

export default function App() {
  return (
    <Provider store={store}>
      <TamaguiProvider config={tamaguiConfig as any} defaultTheme="light">
        <SafeAreaProvider>
          <DrawerProvider>
            <NavigationContainer ref={navigationRef}>
              <StatusBar style="auto" />
              <RootNavigator />
              <LeftNavbarDrawer />
            </NavigationContainer>
          </DrawerProvider>
        </SafeAreaProvider>
      </TamaguiProvider>
    </Provider>
  );
}
