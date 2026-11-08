import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import type { AdminStackParamList, AdminTabParamList } from './types';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminEventsScreen from '../screens/admin/AdminEventsScreen';
import AdminCreateEventScreen from '../screens/admin/AdminCreateEventScreen';
import AdminCheckInReportsScreen from '../screens/admin/AdminCheckInReportsScreen';
import AdminQRDisplayScreen from '../screens/admin/AdminQRDisplayScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import MainStack from './MainStack';
import AdminBottomTab, { AdminTabKey } from '../components/navigation/AdminBottomTab';
import { useAppTheme } from '../theme/ThemeContext';

const Tab = createBottomTabNavigator<AdminTabParamList>();
const Stack = createNativeStackNavigator<AdminStackParamList>();

/**
 * Custom Tab Bar kết nối trực tiếp với AdminBottomTab,
 * hỗ trợ Dark/Light Theme và Safe Area.
 */
function AdminTabBarComponent({ state, navigation }: BottomTabBarProps) {
  const currentRoute = state.routes[state.index]?.name;
  const activeTab: AdminTabKey =
    currentRoute === 'AdminEvents'
      ? 'events'
      : currentRoute === 'AdminCheckInReports'
      ? 'reports'
      : currentRoute === 'AdminUsers'
      ? 'users'
      : 'dashboard';

  const handleTabPress = (tabKey: AdminTabKey) => {
    const targetRoute =
      tabKey === 'events'
        ? 'AdminEvents'
        : tabKey === 'reports'
        ? 'AdminCheckInReports'
        : tabKey === 'users'
        ? 'AdminUsers'
        : 'AdminDashboard';

    navigation.navigate(targetRoute);
  };

  return <AdminBottomTab activeTab={activeTab} onTabPress={handleTabPress} />;
}

/**
 * AdminTabs: Bộ điều hướng Bottom Tabs chính dành riêng cho Ban Quản Trị / Cán bộ Đoàn-Hội
 * Gồm 4 tabs tiện lợi (1-chạm chuyển trang):
 * 1. Tổng quan (AdminDashboard)
 * 2. Quản lý Sự kiện & Quota (AdminEvents)
 * 3. Người tham gia & Điểm danh (AdminCheckInReports)
 * 4. Sinh viên & Điểm rèn luyện (AdminUsers)
 */
export function AdminTabs() {
  return (
    <Tab.Navigator
      initialRouteName="AdminDashboard"
      tabBar={(props) => <AdminTabBarComponent {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: 'Tổng quan' }}
      />
      <Tab.Screen
        name="AdminEvents"
        component={AdminEventsScreen}
        options={{ title: 'Sự kiện & Quota' }}
      />
      <Tab.Screen
        name="AdminCheckInReports"
        component={AdminCheckInReportsScreen}
        options={{ title: 'Người tham gia' }}
      />
      <Tab.Screen
        name="AdminUsers"
        component={AdminUsersScreen}
        options={{ title: 'Sinh viên & ĐRL' }}
      />
    </Tab.Navigator>
  );
}

/**
 * AdminStack: Stack Navigator cho phân hệ Quản trị viên
 * - Root screen là AdminTabs (4 Bottom Tabs luôn sẵn sàng)
 * - Các màn hình chức năng chuyên sâu (Tạo sự kiện, Chiếu QR, Xem trước giao diện sinh viên)
 *   được đẩy lên Stack với Header có nút Back rõ ràng.
 */
export default function AdminStack() {
  const { theme } = useAppTheme();

  return (
    <Stack.Navigator
      initialRouteName="AdminTabs"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.surface,
        },
        headerTintColor: theme.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 16,
          color: theme.textPrimary,
        },
        headerShadowVisible: false,
        animation: 'slide_from_right',
      }}
    >
      {/* 4 Bottom Tabs chính */}
      <Stack.Screen
        name="AdminTabs"
        component={AdminTabs}
        options={{ headerShown: false }}
      />

      {/* Tạo sự kiện mới */}
      <Stack.Screen
        name="AdminCreateEvent"
        component={AdminCreateEventScreen}
        options={{
          title: 'Thêm Sự Kiện Mới',
          headerShown: true,
          headerBackTitle: 'Quay lại',
        }}
      />

      {/* Trình chiếu mã QR Anti-Fake */}
      <Stack.Screen
        name="AdminQRDisplay"
        component={AdminQRDisplayScreen}
        options={{
          title: 'Trình Chiếu Mã QR Điểm Danh',
          headerShown: false,
        }}
      />

      {/* Chế độ xem trước giao diện sinh viên */}
      <Stack.Screen
        name="StudentPreview"
        component={MainStack}
        options={{
          headerShown: false,
        }}
      />

      {/* Direct aliases for backward-compatible stack navigation */}
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminEvents"
        component={AdminEventsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminCheckInReports"
        component={AdminCheckInReportsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminUsers"
        component={AdminUsersScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
