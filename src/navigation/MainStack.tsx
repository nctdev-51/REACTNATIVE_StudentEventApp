import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from './types';
import HomeScreen from '../screens/events/HomeScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import CheckInStack from './CheckInStack';
import ProfileScreen from '../screens/profile/ProfileScreen';
import MyScheduleScreen from '../screens/schedule/MyScheduleScreen';
import NotificationReminderScreen from '../screens/notifications/NotificationReminderScreen';
import FeedbackScreen from '../screens/events/FeedbackScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainStack() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Màn hình Trang chủ */}
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />

      {/* Luồng Check-in QR (Nested Stack gồm QRScanner, CheckInSuccess, CheckInFailed) */}
      <Stack.Screen
        name="CheckIn"
        component={CheckInStack}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />

      {/* Chi tiết sự kiện */}
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{
          headerShown: true,
          title: 'Chi tiết sự kiện',
          headerBackTitle: 'Quay lại',
        }}
      />

      {/* Hồ sơ cá nhân */}
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
      />

      {/* Lịch của tôi */}
      <Stack.Screen
        name="MySchedule"
        component={MyScheduleScreen}
        options={{
          headerShown: false,
        }}
      />

      {/* Thông báo nhắc nhở */}
      <Stack.Screen
        name="Notification"
        component={NotificationReminderScreen}
        options={{
          headerShown: false,
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
    </Stack.Navigator>
  );
}
