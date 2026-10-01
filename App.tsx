import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { TamaguiProvider } from "tamagui";
import { Provider } from "react-redux";
import { store } from "./src/store";
import RegistrationSuccessScreen from "./src/screens/events/RegistrationSuccessScreen";
import MyScheduleScreen from "./src/screens/schedule/MyScheduleScreen";
import NotificationReminderScreen from "./src/screens/notifications/NotificationReminderScreen";

export default function App() {
  return (
    // <Provider store={store}>
    //   <View style={styles.container}>
    //     <Text style={styles.title}>Project Base Nhóm 03</Text>
    //     <Text>...</Text>
    //     <StatusBar style="auto" />
    //   </View>
    // </Provider>

    
    <View style={{ flex: 1 }}>
      {/* <MyScheduleScreen /> */}
      {/* <RegistrationSuccessScreen /> */}
      <NotificationReminderScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
});
