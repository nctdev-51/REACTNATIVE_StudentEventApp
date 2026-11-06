import React from "react";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { TamaguiProvider } from "tamagui";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";

import { store } from "./src/store";
import tamaguiConfig from "./tamagui.config";
import RootNavigator from "./src/navigation/RootNavigator";
import { DrawerProvider } from "./src/context/DrawerContext";
import LeftNavbarDrawer from "./src/components/navigation/LeftNavbarDrawer";
import { navigationRef } from "./src/navigation/navigationRef";
import { ThemeProvider, useAppTheme } from "./src/theme";

/* Cấu hình Deep Link cho sự kiện (Thảo Nguyên) */
import * as Linking from "expo-linking";

const linking = {
  prefixes: [
    Linking.createURL("/"),
    "studentevent://",
  ],
  config: {
    screens: {
      EventDetail: "events/:eventId",
    },
  },
};

function AppContent() {
  const { isDark, theme } = useAppTheme();

  const navigationTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: theme.background,
          card: theme.surface,
          text: theme.textPrimary,
          border: theme.border,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: theme.background,
          card: theme.surface,
          text: theme.textPrimary,
          border: theme.border,
        },
      };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider
        config={tamaguiConfig as any}
        defaultTheme={isDark ? "dark" : "light"}
      >
        <SafeAreaProvider>
          <DrawerProvider>
            <NavigationContainer
              ref={navigationRef}
              linking={linking}
              theme={navigationTheme}
            >
              <StatusBar style={isDark ? "light" : "dark"} />
              <RootNavigator />
              <LeftNavbarDrawer />
            </NavigationContainer>
          </DrawerProvider>
        </SafeAreaProvider>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </Provider>
  );
}
