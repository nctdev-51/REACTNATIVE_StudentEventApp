import React, { useState } from "react";
import {
  Platform,
  SafeAreaView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { store } from "./src/store";
import FeedbackScreen from "./src/screens/events/FeedbackScreen";
import ProfileScreen from "./src/screens/profile/ProfileScreen";

export default function App() {
  const [activeTab, setActiveTab] = useState<"feedback" | "profile">("feedback");

  return (
    <ProfileScreen />
  //  <FeedbackScreen/>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topSafeArea: {
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? (RNStatusBar.currentHeight ?? 0) + 4 : 0,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  switchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentButtonActive: {
    backgroundColor: "#2563EB",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  segmentTextActive: {
    color: "#FFFFFF",
  },
  screenArea: {
    flex: 1,
  },
});
