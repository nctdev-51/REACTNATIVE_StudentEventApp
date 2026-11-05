import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AdminStackParamList } from './types';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminEventsScreen from '../screens/admin/AdminEventsScreen';
import AdminCreateEventScreen from '../screens/admin/AdminCreateEventScreen';
import AdminCheckInReportsScreen from '../screens/admin/AdminCheckInReportsScreen';
import AdminQRDisplayScreen from '../screens/admin/AdminQRDisplayScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import MainStack from './MainStack';
import { useAppTheme } from '../theme/ThemeContext';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminStack() {
  const { theme } = useAppTheme();

  return (
    <Stack.Navigator
      initialRouteName="AdminDashboard"
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
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AdminUsers"
        component={AdminUsersScreen}
        options={{
          title: 'Quản Lý Người Dùng & Điểm Rèn Luyện',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AdminEvents"
        component={AdminEventsScreen}
        options={{
          title: 'Quản Lý Địa Điểm Tổ Chức Sự Kiện',
        }}
      />
      <Stack.Screen
        name="AdminCreateEvent"
        component={AdminCreateEventScreen}
        options={{
          title: 'Thêm Sự Kiện Mới',
        }}
      />
      <Stack.Screen
        name="AdminCheckInReports"
        component={AdminCheckInReportsScreen}
        options={{
          title: 'Báo Cáo Điểm Danh Anti-Fake',
        }}
      />
      <Stack.Screen
        name="AdminQRDisplay"
        component={AdminQRDisplayScreen}
        options={{
          title: 'Trình Chiếu Mã QR Điểm Danh',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="StudentPreview"
        component={MainStack}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
