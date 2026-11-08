import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../navigation/types';
import { getEvents, deleteEvent, toggleHideEvent } from '../../services/api';
import { Event } from '../../types';
import AdminLocationModal from '../../components/events/AdminLocationModal';
import { openInGoogleMaps } from '../../utils/permissionHandler';
import { Colors } from '../../theme';
import { useAppTheme } from '../../theme/ThemeContext';

type AdminEventsNavProp = NativeStackNavigationProp<AdminStackParamList, 'AdminEvents'>;

export default function AdminEventsScreen() {
  const { theme, isDark } = useAppTheme();
  const navigation = useNavigation<AdminEventsNavProp>();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Quản lý modal sửa GPS
  const [selectedEventForGPS, setSelectedEventForGPS] = useState<Event | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tải danh sách sự kiện.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = (event: Event) => {
    Alert.alert('Xoá sự kiện', `Bạn có chắc muốn xoá sự kiện "${event.title}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          await deleteEvent(event._id || (event as any).id);
          fetchEvents();
        },
      },
    ]);
  };

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.location.toLowerCase().includes(search.toLowerCase())
  );

  const renderEventItem = ({ item }: { item: Event }) => {
    const hasGPS = !!(item.coordinates?.latitude && item.coordinates?.longitude);

    return (
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: isDark ? 'rgba(37,99,235,0.2)' : '#EFF6FF' }]}>
            <Text style={[styles.categoryBadgeText, { color: theme.primary }]}>{item.category || 'Sự kiện'}</Text>
          </View>
          <View style={[styles.gpsBadge, hasGPS ? styles.gpsBadgeActive : styles.gpsBadgeMissing]}>
            <Text style={[styles.gpsBadgeText, hasGPS ? styles.gpsBadgeTextActive : styles.gpsBadgeTextMissing]}>
              {hasGPS ? '🔒 XÁC THỰC VỊ TRÍ TỰ ĐỘNG' : 'ℹ️ ĐIỂM DANH TỰ DO'}
            </Text>
          </View>
        </View>

        {item.isHidden && (
          <View style={styles.hiddenNoticeBadge}>
            <Text style={styles.hiddenNoticeText}>👁️ ĐÃ ẨN — Sinh viên không nhìn thấy sự kiện này</Text>
          </View>
        )}

        {/* Title */}
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{item.title}</Text>
        <Text style={[styles.facultyText, { color: theme.textSecondary }]}>Đơn vị: {item.faculty || 'Toàn trường'}</Text>

        {/* Location Info */}
        <View style={[styles.locationBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
          <Text style={[styles.locationLabel, { color: theme.textTertiary }]}>📍 Địa điểm:</Text>
          <Text style={[styles.locationValue, { color: theme.textPrimary }]}>{item.location}</Text>
          {hasGPS ? (
            <View style={[styles.coordsRow, { borderTopColor: theme.borderSubtle }]}>
              <Text style={styles.coordsText}>
                🔒 Phạm vi: Bán kính {item.coordinates?.radiusMeters || 300}m quanh địa điểm
              </Text>
              <TouchableOpacity
                onPress={() => openInGoogleMaps(item.coordinates!.latitude, item.coordinates!.longitude, item.location)}
                style={styles.mapLinkBtn}
              >
                <Text style={styles.mapLinkText}>🗺️ Mở Map</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.noCoordsText}>Sự kiện chưa giới hạn vị trí điểm danh</Text>
          )}
        </View>

        {/* Quota & Attendees Capacity Box */}
        <View style={[styles.quotaBox, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : '#F1F5F9', borderColor: theme.border }]}>
          <View style={styles.quotaRow}>
            <Text style={[styles.quotaLabel, { color: theme.textSecondary }]}>
              👥 Quota: <Text style={{ fontWeight: '700', color: theme.primary }}>{item.maxSlots || 100} chỗ</Text> (Waitlist: {item.waitlistSlots || 20})
            </Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('AdminCheckInReports', {
                  eventId: item._id || (item as any).id,
                })
              }
              style={[styles.manageAttendeesBtn, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.manageAttendeesBtnText}>Quản lý SV & Quota</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Buttons Row */}
        <View style={styles.actionsRow}>
          {/* Cài đặt GPS */}
          <TouchableOpacity
            style={[styles.gpsEditBtn, { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#EEF2FF', borderColor: isDark ? '#818CF8' : '#C7D2FE' }]}
            onPress={() => setSelectedEventForGPS(item)}
            activeOpacity={0.8}
          >
            <Text style={[styles.gpsEditBtnText, { color: isDark ? '#A5B4FC' : '#4338CA' }]}>📍 Đổi địa điểm</Text>
          </TouchableOpacity>

          {/* Trình chiếu mã QR */}
          <TouchableOpacity
            style={[styles.qrBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
            onPress={() =>
              navigation.navigate('AdminQRDisplay', {
                eventId: item._id || (item as any).id,
                eventTitle: item.title,
              })
            }
            activeOpacity={0.8}
          >
            <Text style={[styles.qrBtnText, { color: theme.textPrimary }]}>📷 QR</Text>
          </TouchableOpacity>

          {/* Xem điểm danh */}
          <TouchableOpacity
            style={[styles.reportBtn, { backgroundColor: isDark ? 'rgba(168,85,247,0.15)' : '#FAF5FF', borderColor: isDark ? '#C084FC' : '#E9D5FF' }]}
            onPress={() =>
              navigation.navigate('AdminCheckInReports', {
                eventId: item._id || (item as any).id,
              })
            }
            activeOpacity={0.8}
          >
            <Text style={[styles.reportBtnText, { color: isDark ? '#C084FC' : '#7E22CE' }]}>📊 Báo cáo</Text>
          </TouchableOpacity>

          {/* Ẩn / Hiện sự kiện */}
          <TouchableOpacity
            style={[styles.hideBtn, item.isHidden ? styles.unhideBtn : null]}
            onPress={async () => {
              await toggleHideEvent(item._id || (item as any).id, !!item.isHidden);
              fetchEvents();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.hideBtnText}>
              {item.isHidden ? '👁️ Hiện' : '👁️ Ẩn'}
            </Text>
          </TouchableOpacity>

          {/* Xoá */}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={theme.statusBarStyle} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.topTitleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.screenHeading, { color: theme.textPrimary }]}>📍 Quản Lý Sự Kiện & Địa Điểm</Text>
            <Text style={[styles.screenSubheading, { color: theme.textSecondary }]}>
              Cấu hình toạ độ GPS, Quota và hiển thị mã QR
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('AdminCreateEvent')}
            activeOpacity={0.85}
          >
            <Text style={styles.createBtnText}>➕ Tạo mới</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: theme.inputBackground, marginTop: 10 }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Tìm theo tên sự kiện hoặc địa điểm..."
            placeholderTextColor={theme.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Đang tải danh sách sự kiện...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item, index) => `${item._id || (item as any).id || 'evt'}-${index}`}
          renderItem={renderEventItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Không tìm thấy sự kiện nào.</Text>
            </View>
          }
        />
      )}

      {/* Modal Cài đặt GPS */}
      {selectedEventForGPS && (
        <AdminLocationModal
          visible={!!selectedEventForGPS}
          event={selectedEventForGPS}
          onClose={() => setSelectedEventForGPS(null)}
          onSuccess={(_newLoc, _newCoords) => {
            setSelectedEventForGPS(null);
            fetchEvents();
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  topTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenHeading: {
    fontSize: 17,
    fontWeight: '800',
  },
  screenSubheading: {
    fontSize: 11.5,
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: { fontSize: 16, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },
  clearIcon: { fontSize: 14, color: '#94A3B8', padding: 4 },
  createBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  list: { padding: 16, gap: 14 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: { color: '#2563EB', fontSize: 11, fontWeight: '700' },
  gpsBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  gpsBadgeActive: { backgroundColor: '#DCFCE7' },
  gpsBadgeMissing: { backgroundColor: '#FEF3C7' },
  gpsBadgeText: { fontSize: 10, fontWeight: '800' },
  gpsBadgeTextActive: { color: '#166534' },
  gpsBadgeTextMissing: { color: '#92400E' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  facultyText: { fontSize: 12, color: '#64748B', marginBottom: 10 },
  locationBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  locationLabel: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  locationValue: { fontSize: 13, color: '#1E293B', fontWeight: '600', marginTop: 2 },
  coordsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  coordsText: { fontSize: 11, color: '#059669', fontWeight: '600' },
  mapLinkBtn: { backgroundColor: '#E0E7FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  mapLinkText: { fontSize: 11, color: '#4338CA', fontWeight: '700' },
  noCoordsText: { fontSize: 11, color: '#D97706', marginTop: 4, fontStyle: 'italic' },
  actionsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  gpsEditBtn: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  gpsEditBtnText: { color: '#4338CA', fontSize: 12, fontWeight: '700' },
  qrBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  qrBtnText: { color: '#0F172A', fontSize: 12, fontWeight: '700' },
  reportBtn: {
    backgroundColor: '#FAF5FF',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  reportBtnText: { color: '#7E22CE', fontSize: 12, fontWeight: '700' },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteBtnText: { fontSize: 13 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { color: '#64748B', fontSize: 13 },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { color: '#94A3B8', fontSize: 14 },
  hiddenNoticeBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  hiddenNoticeText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
  },
  hideBtn: {
    backgroundColor: '#FFFBEB',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  unhideBtn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  hideBtnText: {
    color: '#B45309',
    fontSize: 11.5,
    fontWeight: '700',
  },
  quotaBox: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  quotaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quotaLabel: {
    fontSize: 12.5,
  },
  manageAttendeesBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  manageAttendeesBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
});
