import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import QRScannerScreen from '../screens/checkin/QRScannerScreen';
import CheckInSuccessScreen from '../screens/checkin/CheckInSuccessScreen';
import CheckInFailedScreen from '../screens/checkin/CheckInFailedScreen';

/**
 * Định nghĩa danh sách các màn hình và tham số (params) cho luồng Check-in QR
 */
export type CheckInStackParamList = {
  QRScanner: undefined;
  CheckInSuccess: {
    eventId?: string;
    studentName?: string;
    studentId?: string;
    checkInTime?: string;
    data?: string;
  } | undefined;
  CheckInFailed: {
    reason?: string;
    data?: string;
  } | undefined;
};

// Định nghĩa types props cho từng màn hình
export type QRScannerScreenProps = NativeStackScreenProps<CheckInStackParamList, 'QRScanner'>;
export type CheckInSuccessScreenProps = NativeStackScreenProps<CheckInStackParamList, 'CheckInSuccess'>;
export type CheckInFailedScreenProps = NativeStackScreenProps<CheckInStackParamList, 'CheckInFailed'>;

const Stack = createNativeStackNavigator<CheckInStackParamList>();

export default function CheckInStack() {
  return (
    <Stack.Navigator
      initialRouteName="QRScanner"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="QRScanner"
        component={QRScannerScreen}
      />
      <Stack.Screen
        name="CheckInSuccess"
        component={CheckInSuccessScreen}
        options={{
          gestureEnabled: false, // Ngăn vuốt back để tránh quét trùng
        }}
      />
      <Stack.Screen
        name="CheckInFailed"
        component={CheckInFailedScreen}
        options={{
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

