import React, { useCallback, useEffect, useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, YStack } from 'tamagui';
import { Button, Card } from '../../components/common';
import { useAppSelector } from '../../hooks/redux';
import type { MainStackParamList } from '../../navigation/types';
import api from '../../services/api';
import { reminderMessages, scheduleEventReminder } from '../../services/eventReminders';

export interface RegistrationSuccessScreenProps {
  eventTitle?: string;
  onViewSchedule?: () => void;
  onGoHome?: () => void;
}
export default function RegistrationSuccessScreen(props: RegistrationSuccessScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, 'RegistrationSuccess'>>();
  const userId = useAppSelector(state => state.auth.user?._id);
  const eventId = route.params?.eventId;
  const title = route.params?.eventTitle ?? props.eventTitle ?? 'Sự kiện';
  const [message, setMessage] = useState('Đang lập lịch nhắc nhở…');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(false);
  const schedule = useCallback(async () => {
    if (!eventId || !userId) {
      setMessage('Thiếu thông tin để lập lịch nhắc nhở.');
      return;
    }
    setBusy(true);
    setRetry(false);
    try {
      const event = await api.getEventById(eventId);
      const result = await scheduleEventReminder(event, userId);
      setMessage(reminderMessages[result]);
      setRetry(result === 'denied');
    } catch {
      setMessage('Đăng ký đã thành công, nhưng chưa thể đặt nhắc nhở. Vui lòng thử lại.');
      setRetry(true);
    } finally { setBusy(false); }
  }, [eventId, userId]);
  useEffect(() => { void schedule(); }, [schedule]);
  return <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
    <YStack flex={1} padding={24} gap={16} justifyContent="center">
      <Text fontSize={64} color="#22C55E" textAlign="center">✓</Text>
      <Text fontSize={24} fontWeight="700" textAlign="center">Đăng ký thành công!</Text>
      <Text textAlign="center">Bạn đã đăng ký tham gia {title}.</Text>
      <Card gap={12}>
        <Text accessibilityLiveRegion="polite">{message}</Text>
        {retry && <Button variant="secondary" loading={busy} onPress={schedule}>Thử đặt nhắc nhở lại</Button>}
      </Card>
      <Button onPress={props.onViewSchedule ?? (() => navigation.navigate('MySchedule'))}>Xem trong lịch của tôi</Button>
      <Button variant="secondary" onPress={props.onGoHome ?? (() => navigation.navigate('Home'))}>Quay về trang chủ</Button>
    </YStack>
  </SafeAreaView>;
}
