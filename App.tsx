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
import { DrawerProvider } from './src/context/DrawerContext';
import LeftNavbarDrawer from './src/components/navigation/LeftNavbarDrawer';
import { navigationRef } from './src/navigation/navigationRef';

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
<<<<<<< HEAD
          <DrawerProvider>
            <NavigationContainer ref={navigationRef}>
              <StatusBar style="auto" />
              <RootNavigator />
              <LeftNavbarDrawer />
            </NavigationContainer>
          </DrawerProvider>
=======
          <NavigationContainer linking={linking}>
            <StatusBar style="auto" />
            <RootNavigator />
          </NavigationContainer>
>>>>>>> 8d9ed42 (Update Event)
        </SafeAreaProvider>
      </TamaguiProvider>
    </Provider>
  );
}