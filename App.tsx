import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { TamaguiProvider } from "tamagui";
import { Provider } from "react-redux";
import { store } from "./src/store";

export default function App() {
  return (
    <Provider store={store}>
      <View style={styles.container}>
        <Text style={styles.title}>Project Base Nhóm 03</Text>
        <Text>...</Text>
        <StatusBar style="auto" />
      </View>
    </Provider>
  );
}
