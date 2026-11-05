import React, { useCallback, useState } from 'react';
import { Linking, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Notifications from '../../services/localNotifications';
import { Text } from 'tamagui';
import { Button, Card, Input, Modal } from '../../components/common';
import { useAppSelector } from '../../hooks/redux';
import type { MainStackParamList } from '../../navigation/types';
import { getEventReminders, requestReminderPermission } from '../../services/eventReminders';

export default function NotificationReminderScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const userId = useAppSelector(state => state.auth.user?._id);
  const [items, setItems] = useState<Notifications.NotificationRequest[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try { setItems(userId ? await getEventReminders(userId) : []); }
    catch { setMessage('Không thể tải nhắc nhở. Vui lòng thử lại.'); }
  }, [userId]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  const enable = async () => {
    setBusy(true);
    try {
      setMessage(await requestReminderPermission()
        ? 'Đã bật quyền. Sự kiện đăng ký thành công sẽ được nhắc trước 30 phút.'
        : 'Chưa có quyền thông báo. Hãy bật quyền trong cài đặt thiết bị.');
    } catch { setMessage('Không thể kiểm tra quyền thông báo.'); }
    finally { setBusy(false); }
  };
  const cancel = async () => {
    if (!cancelId) return;
    setBusy(true);
    try {
      await Notifications.cancelScheduledNotificationAsync(cancelId);
      setCancelId(null);
      await refresh();
    } catch { setMessage('Không thể hủy nhắc nhở. Vui lòng thử lại.'); }
    finally { setBusy(false); }
  };
  const testNotification = async () => {
    if (Platform.OS === 'web' || busy) return;
    setBusy(true);
    try {
      if (!await requestReminderPermission()) {
        setMessage('Chưa có quyền thông báo. Hãy bật quyền trong cài đặt thiết bị.');
        return;
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Thông báo thử nghiệm',
          body: 'Thông báo thử nghiệm sau 3 giây đã đến!',
          sound: 'default',
          data: { type: 'test' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 3,
          repeats: false,
          channelId: 'event-reminders',
        },
      });
      setMessage('Đã đặt thông báo thử nghiệm sau 3 giây.');
    } catch {
      setMessage('Không thể đặt thông báo thử nghiệm. Vui lòng thử lại.');
    } finally { setBusy(false); }
  };
  return <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <Text>Thông báo được tự động đặt trước giờ bắt đầu 30 phút khi đăng ký thành công.</Text>
      {Platform.OS === 'web' ? <Text>Vui lòng dùng ứng dụng Android hoặc iOS để nhận nhắc nhở.</Text> : <>
        <Button loading={busy} onPress={enable}>Bật quyền thông báo</Button>
        <Button variant="secondary" onPress={() => { void Linking.openSettings().catch(() => setMessage('Không thể mở cài đặt thiết bị.')); }}>Mở cài đặt thiết bị</Button>
      </>}
      <Button variant="secondary" loading={busy} disabled={Platform.OS === 'web'} onPress={testNotification}>
        Test thông báo sau 3 giây
      </Button>
      {!!message && <Text accessibilityLiveRegion="polite">{message}</Text>}
      <Input label="Tìm nhắc nhở" placeholder="Tên sự kiện" value={search} onChangeText={setSearch} />
      <Button variant="secondary" onPress={refresh}>Làm mới</Button>
      {items.length === 0 && <Card><Text>Chưa có nhắc nhở nào được lên lịch.</Text></Card>}
      {items.filter(item => item.content.title?.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map(item => <Card key={item.identifier} gap={12}>
        <Text fontWeight="700">{item.content.title}</Text>
        <Text>{item.content.body}</Text>
        <Text>Nhắc lúc: {new Date(Number(item.content.data?.reminderAt)).toLocaleString('vi-VN')}</Text>
        <Button variant="secondary" onPress={() => navigation.navigate('EventDetail', { eventId: String(item.content.data?.eventId) })}>Xem sự kiện</Button>
        <Button variant="danger" onPress={() => setCancelId(item.identifier)}>Hủy nhắc nhở</Button>
      </Card>)}
    </ScrollView>
    <Modal open={!!cancelId} onClose={() => setCancelId(null)} title="Hủy nhắc nhở?">
      <Text>Đăng ký tham gia sự kiện vẫn được giữ nguyên.</Text>
      <Button variant="danger" loading={busy} onPress={cancel}>Xác nhận hủy nhắc nhở</Button>
    </Modal>
  </SafeAreaView>;
}
