import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { CheckInStackParamList } from './CheckInStack';

export type MainStackParamList = {
  Home: undefined;
  CheckIn: NavigatorScreenParams<CheckInStackParamList> | undefined;
  EventDetail: { eventId?: string; title?: string } | undefined;
  Profile: undefined;
  MySchedule: undefined;
  Notification: undefined;
  Feedback: undefined;
};

export type HomeScreenProps = NativeStackScreenProps<MainStackParamList, 'Home'>;
export type EventDetailScreenProps = NativeStackScreenProps<MainStackParamList, 'EventDetail'>;
export type ProfileScreenProps = NativeStackScreenProps<MainStackParamList, 'Profile'>;
export type MyScheduleScreenProps = NativeStackScreenProps<MainStackParamList, 'MySchedule'>;
export type NotificationScreenProps = NativeStackScreenProps<MainStackParamList, 'Notification'>;
export type FeedbackScreenProps = NativeStackScreenProps<MainStackParamList, 'Feedback'>;
