import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import type { MainStackParamList, MainTabParamList } from "./types";
import HomeScreen from "../screens/events/HomeScreen";
import EventDetailScreen from "../screens/events/EventDetailScreen";
import CheckInStack from "./CheckInStack";
import ProfileScreen from "../screens/profile/ProfileScreen";
import MyScheduleScreen from "../screens/schedule/MyScheduleScreen";
import NotificationReminderScreen from "../screens/notifications/NotificationReminderScreen";
import FeedbackScreen from "../screens/events/FeedbackScreen";
import FilterScreen from "../screens/events/FilterScreen";
import RegistrationSuccessScreen from "../screens/events/RegistrationSuccessScreen";
import { useAppTheme } from "../theme/ThemeContext";
import { useEventReminders } from "../hooks/useEventReminders";
import AppBottomTab, { AppTabKey } from "../components/navigation/AppBottomTab";

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

/**
 * Custom Tab Bar kết nối trực tiếp với AppBottomTab của hệ thống,
 * đảm bảo giao diện đồng bộ, chuẩn theme và an toàn với Safe Area.
 */
function MainBottomTabBar({ state, navigation }: BottomTabBarProps) {
  const currentRoute = state.routes[state.index]?.name;
  const activeTab: AppTabKey =
    currentRoute === "Home"
      ? "home"
      : currentRoute === "MySchedule"
        ? "schedule"
        : currentRoute === "CheckIn"
          ? "checkin"
          : "profile";

  const handleTabPress = (tabKey: AppTabKey) => {
    const targetRoute =
      tabKey === "home"
        ? "Home"
        : tabKey === "schedule"
          ? "MySchedule"
          : tabKey === "checkin"
            ? "CheckIn"
            : "Profile";

    navigation.navigate(targetRoute);
  };

  return <AppBottomTab activeTab={activeTab} onTabPress={handleTabPress} />;
}

/**
 * MainTabs: Bộ điều hướng Bottom Tabs chính dành cho Sinh viên
 * Gồm 4 tabs: Trang chủ (Home), Lịch của tôi (MySchedule), Check-in QR (CheckIn), Cá nhân (Profile)
 */
export function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <MainBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Trang chủ",
        }}
      />
      <Tab.Screen
        name="MySchedule"
        component={MyScheduleScreen}
        options={{
          title: "Lịch của tôi",
        }}
      />
      <Tab.Screen
        name="CheckIn"
        component={CheckInStack}
        options={{
          title: "Check-in",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Cá nhân",
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * MainStack: Stack Navigator cho luồng sinh viên
 * - Root screen là MainTabs (Bottom Tabs)
 * - Các màn hình con/chi tiết (EventDetail, Feedback, Filter...) được đẩy lên trên Stack và che thanh tab bar chuẩn mobile.
 */
export default function MainStack() {
  useEventReminders();
  const { theme } = useAppTheme();

  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      {/* Tab Navigator chính cho sinh viên */}
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{
          headerShown: false,
        }}
      />

      {/* Luồng Check-in QR Điểm danh trực tiếp */}
      <Stack.Screen
        name="CheckIn"
        component={CheckInStack}
        options={{
          headerShown: false,
          animation: "slide_from_bottom",
        }}
      />

      {/* Chi tiết sự kiện */}
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{
          headerShown: true,
          title: "Chi tiết sự kiện",
          headerBackTitle: "Quay lại",
          headerStyle: {
            backgroundColor: theme.surface,
          },
          headerTintColor: theme.textPrimary,
          headerTitleStyle: {
            color: theme.textPrimary,
            fontWeight: "700",
          },
        }}
      />

      {/* Thông báo nhắc nhở */}
      <Stack.Screen
        name="Notification"
        component={NotificationReminderScreen}
        options={{
          headerShown: true,
          title: "Nhắc nhở sự kiện",
          headerBackTitle: "Quay lại",
        }}
      />

      {/* Đánh giá / Feedback */}
      <Stack.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={{
          headerShown: false,
        }}
      />

      {/* Bộ lọc sự kiện */}
      <Stack.Screen
        name="Filter"
        component={FilterScreen}
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />

      {/* Đăng ký thành công */}
      <Stack.Screen
        name="RegistrationSuccess"
        component={RegistrationSuccessScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}
