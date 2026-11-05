import React from "react";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { TamaguiProvider } from "tamagui";
import { SafeAreaProvider } from "react-native-safe-area-context";
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
const linking = {
  prefixes: ["studentevent://"],
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
