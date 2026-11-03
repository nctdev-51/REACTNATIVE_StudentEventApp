import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import type { AdminStackParamList } from '../../navigation/types';
import { getAllRegistrations, getEvents, getUsers } from '../../services/api';
import { Registration, Event, User } from '../../types';
import { getDistanceMeters, formatDistance } from '../../utils/locationUtils';
import { openInGoogleMaps } from '../../utils/permissionHandler';
import { Colors } from '../../theme';

type RouteType = RouteProp<AdminStackParamList, 'AdminCheckInReports'>;

export default function AdminCheckInReportsScreen() {
  const route = useRoute<RouteType>();
  const initialEventId = route.params?.eventId;

  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialEventId || null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [regs, evts, usrs] = await Promise.all([
        getAllRegistrations(),
        getEvents(),
        getUsers(),
      ]);
      setRegistrations(regs);
      setEvents(evts);
      setUsers(usrs);
    } catch (e) {
      console.warn('Lỗi tải báo cáo:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Lọc các bản ghi đã check-in
  const checkedInList = registrations.filter((r) => r.status === 'checked_in');
  const filteredList = selectedEventId
    ? checkedInList.filter((r) => r.eventId === selectedEventId)
    : checkedInList;

  const totalCheckedIn = filteredList.length;

  const renderItem = ({ item }: { item: Registration }) => {
    const event = events.find((e) => e._id === item.eventId || (e as any).id === item.eventId);
    const student = users.find((u) => u._id === item.userId || (u as any).id === item.userId);

    // Tính cự ly GPS giữa sinh viên và sự kiện
    let distance: number | null = null;
    let isSafe = true;

    if (item.checkInLocation && event?.coordinates) {
      distance = getDistanceMeters(
        item.checkInLocation.latitude,
        item.checkInLocation.longitude,
        event.coordinates.latitude,
        event.coordinates.longitude
      );
      isSafe = distance <= 500;
    }

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <Text style={styles.studentName}>{student?.fullName || 'Sinh viên'}</Text>
          <View style={[styles.statusBadge, isSafe ? styles.badgeSuccess : styles.badgeDanger]}>
            <Text style={[styles.statusBadgeText, isSafe ? styles.textSuccess : styles.textDanger]}>
              {distance != null
                ? isSafe
                  ? `✅ HỢP LỆ (${formatDistance(distance)})`
                  : `🚨 VI PHẠM GPS (${formatDistance(distance)})`
                : '✅ ĐÃ CHECK-IN'}
            </Text>
          </View>
        </View>

        <Text style={styles.studentSub}>
          Mã SV: {student?.studentId || 'SV-N/A'} • Khoa: {student?.faculty || 'Toàn trường'}
        </Text>

        <View style={styles.divider} />

        {/* Thông tin sự kiện */}
        <Text style={styles.eventTitle}>🎯 Sự kiện: {event?.title || 'Sự kiện IUH'}</Text>
        <Text style={styles.timeText}>
          🕒 Giờ quét QR: {item.checkInTime ? new Date(item.checkInTime).toLocaleString('vi-VN') : 'Không rõ'}
        </Text>

        {/* Vị trí check-in */}
        {item.checkInLocation && (
          <View style={styles.locationBox}>
            <Text style={styles.locCoords}>
              📍 Vị trí quét: {item.checkInLocation.latitude.toFixed(5)}, {item.checkInLocation.longitude.toFixed(5)}
            </Text>
            <TouchableOpacity
              onPress={() =>
                openInGoogleMaps(
                  item.checkInLocation!.latitude,
                  item.checkInLocation!.longitude,
                  `Vị trí điểm danh của ${student?.fullName || 'sinh viên'}`
                )
              }
              style={styles.mapBtn}
            >
              <Text style={styles.mapBtnText}>🗺️ Mở Map đối soát</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Báo Cáo Điểm Danh Anti-Fake</Text>
        <Text style={styles.headerSub}>
          Hệ thống đối soát toạ độ GPS Google Maps thực tế khi sinh viên quét QR (Bán kính an toàn tối đa 500m).
        </Text>

        {/* Selector sự kiện */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, selectedEventId === null && styles.filterChipActive]}
            onPress={() => setSelectedEventId(null)}
          >
            <Text style={[styles.filterChipText, selectedEventId === null && styles.filterChipTextActive]}>
              Tất cả ({checkedInList.length})
            </Text>
          </TouchableOpacity>

          {events.slice(0, 3).map((e) => {
            const count = checkedInList.filter((r) => r.eventId === (e._id || (e as any).id)).length;
            const active = selectedEventId === (e._id || (e as any).id);
            return (
              <TouchableOpacity
                key={e._id || (e as any).id}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setSelectedEventId(e._id || (e as any).id)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]} numberOfLines={1}>
                  {e.title.slice(0, 16)}... ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải báo cáo điểm danh...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>Chưa có lượt check-in nào được ghi nhận.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  headerSub: { fontSize: 12, color: '#64748B', lineHeight: 17, marginBottom: 12 },
  filterRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  filterChipActive: { backgroundColor: '#2563EB' },
  filterChipText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  filterChipTextActive: { color: '#FFFFFF' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  studentName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeSuccess: { backgroundColor: '#DCFCE7' },
  badgeDanger: { backgroundColor: '#FEE2E2' },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  textSuccess: { color: '#166534' },
  textDanger: { color: '#991B1B' },
  studentSub: { fontSize: 12, color: '#64748B', marginBottom: 8 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 8 },
  eventTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  timeText: { fontSize: 12, color: '#64748B' },
  locationBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  locCoords: { fontSize: 11, color: '#059669', fontWeight: '600' },
  mapBtn: { backgroundColor: '#E0E7FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  mapBtnText: { fontSize: 11, color: '#4338CA', fontWeight: '700' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { color: '#64748B', fontSize: 13 },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { color: '#94A3B8', fontSize: 14 },
});
