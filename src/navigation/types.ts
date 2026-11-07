import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CheckInStackParamList } from './CheckInStack';

// ─── Auth Stack ───────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// ─── Main Tabs (Sinh viên) ────────────────────────────────────────────────────

export type MainTabParamList = {
  Home: undefined;
  MySchedule: undefined;
  CheckIn: NavigatorScreenParams<CheckInStackParamList> | undefined;
  Profile: undefined;
};

// ─── Main Stack (Sinh viên) ───────────────────────────────────────────────────

export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Home: undefined;
  CheckIn: NavigatorScreenParams<CheckInStackParamList> | undefined;
  EventDetail: { eventId?: string; title?: string } | undefined;
  Profile: undefined;
  MySchedule: undefined;
  Notification: undefined;
  Feedback: { eventId?: string; eventTitle?: string } | undefined;
  Filter: undefined;
  RegistrationSuccess: { eventId?: string; eventTitle?: string } | undefined;
};

// ─── Admin Stack (Quản trị viên) ──────────────────────────────────────────────

export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminEvents: undefined;
  AdminCreateEvent: undefined;
  AdminCheckInReports: { eventId?: string } | undefined;
  AdminQRDisplay: { eventId: string; eventTitle: string };
  AdminUsers: undefined;
  StudentPreview: NavigatorScreenParams<MainStackParamList> | undefined;
};

// ─── Root ─────────────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
  Admin: NavigatorScreenParams<AdminStackParamList>;
};

// ─── Typed Screen Props ───────────────────────────────────────────────────────

// Auth
export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

// Main Tabs (Sinh viên)
export type MainTabHomeScreenProps = BottomTabScreenProps<MainTabParamList, 'Home'>;
export type MainTabScheduleScreenProps = BottomTabScreenProps<MainTabParamList, 'MySchedule'>;
export type MainTabCheckInScreenProps = BottomTabScreenProps<MainTabParamList, 'CheckIn'>;
export type MainTabProfileScreenProps = BottomTabScreenProps<MainTabParamList, 'Profile'>;

// Main (Sinh viên)
export type HomeScreenProps = NativeStackScreenProps<MainStackParamList, 'Home'>;
export type EventDetailScreenProps = NativeStackScreenProps<MainStackParamList, 'EventDetail'>;
export type ProfileScreenProps = NativeStackScreenProps<MainStackParamList, 'Profile'>;
export type MyScheduleScreenProps = NativeStackScreenProps<MainStackParamList, 'MySchedule'>;
export type NotificationScreenProps = NativeStackScreenProps<MainStackParamList, 'Notification'>;
export type FeedbackScreenProps = NativeStackScreenProps<MainStackParamList, 'Feedback'>;
export type FilterScreenProps = NativeStackScreenProps<MainStackParamList, 'Filter'>;
export type RegistrationSuccessScreenProps = NativeStackScreenProps<MainStackParamList, 'RegistrationSuccess'>;

// Admin (Quản trị viên)
export type AdminDashboardScreenProps = NativeStackScreenProps<AdminStackParamList, 'AdminDashboard'>;
export type AdminEventsScreenProps = NativeStackScreenProps<AdminStackParamList, 'AdminEvents'>;
export type AdminCreateEventScreenProps = NativeStackScreenProps<AdminStackParamList, 'AdminCreateEvent'>;
export type AdminCheckInReportsScreenProps = NativeStackScreenProps<AdminStackParamList, 'AdminCheckInReports'>;
export type AdminQRDisplayScreenProps = NativeStackScreenProps<AdminStackParamList, 'AdminQRDisplay'>;
export type AdminUsersScreenProps = NativeStackScreenProps<AdminStackParamList, 'AdminUsers'>;
