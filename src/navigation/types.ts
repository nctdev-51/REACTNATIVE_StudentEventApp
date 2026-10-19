import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { CheckInStackParamList } from './CheckInStack';

// ─── Auth Stack ───────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// ─── Main Stack ───────────────────────────────────────────────────────────────

export type MainStackParamList = {
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

// ─── Root ─────────────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

// ─── Typed Screen Props ───────────────────────────────────────────────────────

// Auth
export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

// Main
export type HomeScreenProps = NativeStackScreenProps<MainStackParamList, 'Home'>;
export type EventDetailScreenProps = NativeStackScreenProps<MainStackParamList, 'EventDetail'>;
export type ProfileScreenProps = NativeStackScreenProps<MainStackParamList, 'Profile'>;
export type MyScheduleScreenProps = NativeStackScreenProps<MainStackParamList, 'MySchedule'>;
export type NotificationScreenProps = NativeStackScreenProps<MainStackParamList, 'Notification'>;
export type FeedbackScreenProps = NativeStackScreenProps<MainStackParamList, 'Feedback'>;
export type FilterScreenProps = NativeStackScreenProps<MainStackParamList, 'Filter'>;
export type RegistrationSuccessScreenProps = NativeStackScreenProps<MainStackParamList, 'RegistrationSuccess'>;
