import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { TamaguiProvider } from "tamagui";
import { Provider } from "react-redux";
import { store } from "./src/store";
import CheckInStack from "./src/navigation/CheckInStack";

export default function App() {
  return (
    <Provider store={store}>
      <TamaguiProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <CheckInStack />
          </NavigationContainer>
        </SafeAreaProvider>
      </TamaguiProvider>
      <StatusBar style="auto" />
    </Provider>
  );
}
