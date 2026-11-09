import Constants from "expo-constants";
import { Platform } from "react-native";
import { apiClient } from "./api";

/**
 * Registers this physical device with the shared API. Remote notifications are
 * deliberately unavailable on web and may be unavailable in Expo Go; those
 * environments continue to use the existing local reminders.
 */
export async function registerRemotePushDevice(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  try {
    // Keep the Expo Notifications barrel out of the startup dependency graph.
    // Expo Go cannot provide production remote-push credentials on Android.
    const Notifications = require("expo-notifications");
    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted && permission.canAskAgain) {
      permission = await Notifications.requestPermissionsAsync();
    }
    if (!permission.granted) return false;

    const projectId =
      Constants.easConfig?.projectId ??
      Constants.expoConfig?.extra?.eas?.projectId ??
      process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
    if (!projectId) {
      console.warn("[Push] Missing EAS project ID; remote push registration skipped.");
      return false;
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await apiClient.post("/users/me/push-tokens", { token, platform: Platform.OS });
    return true;
  } catch (error) {
    // Network failures are expected on first launch/offline devices. The next
    // authenticated app start retries registration without blocking the user.
    console.warn("[Push] Could not register this device:", error);
    return false;
  }
}
