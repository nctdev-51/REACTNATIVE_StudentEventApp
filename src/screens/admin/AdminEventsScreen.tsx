import React, { useCallback, useEffect, useState } from 'react';
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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../navigation/types';
import { getEvents, deleteEvent, toggleHideEvent } from '../../services/api';
import { Event } from '../../types';
import AdminLocationModal from '../../components/events/AdminLocationModal';
import { openInGoogleMaps } from '../../utils/permissionHandler';
import { useAppTheme } from '../../theme/ThemeContext';

type AdminEventsNavProp = NativeStackNavigationProp<AdminStackParamList, 'AdminEvents'>;

export default function AdminEventsScreen() {
  const { theme, isDark } = useAppTheme();
  const navigation = useNavigation<AdminEventsNavProp>();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  // Quản lý modal sửa GPS
  const [selectedEventForGPS, setSelectedEventForGPS] = useState<Event | null>(null);

  const fetchEvents = useCallback(async (opts?: { silent?: boolean; refresh?: boolean }) => {
    if (opts?.refresh) {
      setRefreshing(true);
    } else if (!opts?.silent) {
      setLoading(true);
    }
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (e) {
      if (!opts?.silent) {
        Alert.alert('Lỗi', 'Không thể tải danh sách sự kiện.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  useFocusEffect(
    useCallback(() => {
      void fetchEvents({ silent: true });
    }, [fetchEvents])
  );

  const handleDelete = (event: Event) => {
    Alert.alert('Xoá sự kiện', `Bạn có chắc muốn xoá sự kiện "${event.title}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEvent(event._id || (event as any).id);
            fetchEvents();
          } catch (err: any) {
            Alert.alert(
              'Lỗi xóa sự kiện',
              err?.response?.data?.message || err?.message || 'Không thể xóa sự kiện.'
            );
          }
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
          <View
            style={[
              styles.gpsBadge,
              hasGPS
                ? { backgroundColor: isDark ? 'rgba(22,163,74,0.2)' : '#DCFCE7' }
                : { backgroundColor: isDark ? 'rgba(217,119,6,0.2)' : '#FEF3C7' },
            ]}
          >
            <Text
              style={[
                styles.gpsBadgeText,
                {
                  color: hasGPS
                    ? isDark
                      ? '#4ADE80'
                      : '#166534'
                    : isDark
                    ? '#FBBF24'
                    : '#92400E',
                },
              ]}
              numberOfLines={1}
            >
              {hasGPS ? '🔒 XÁC THỰC VỊ TRÍ TỰ ĐỘNG' : 'ℹ️ ĐIỂM DANH TỰ DO'}
            </Text>
          </View>
        </View>

        {item.isHidden && (
          <View
            style={[
              styles.hiddenNoticeBadge,
              {
                backgroundColor: isDark ? 'rgba(245,158,11,0.16)' : '#FEF3C7',
                borderColor: isDark ? '#D97706' : '#FDE68A',
              },
            ]}
          >
            <Text style={[styles.hiddenNoticeText, { color: isDark ? '#FBBF24' : '#B45309' }]}>
              👁️ ĐÃ ẨN — Sinh viên không nhìn thấy sự kiện này
            </Text>
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
              <Text style={[styles.coordsText, { color: isDark ? '#34D399' : '#059669' }]}>
                🔒 Phạm vi: Bán kính {item.coordinates?.radiusMeters || 300}m quanh địa điểm
              </Text>
              <TouchableOpacity
                onPress={() => openInGoogleMaps(item.coordinates!.latitude, item.coordinates!.longitude, item.location)}
                style={[styles.mapLinkBtn, { backgroundColor: isDark ? 'rgba(99,102,241,0.22)' : '#E0E7FF' }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.mapLinkText, { color: isDark ? '#A5B4FC' : '#4338CA' }]}>🗺️ Mở Map</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.noCoordsText, { color: isDark ? '#FBBF24' : '#D97706' }]}>
              Sự kiện chưa giới hạn vị trí điểm danh
            </Text>
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
              activeOpacity={0.85}
            >
              <Text style={styles.manageAttendeesBtnText}>Quản lý SV & Quota</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Responsive 2-row action toolbar */}
        <View style={styles.actionsStack}>
          {/* Hàng 1: Hành động chính */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.gpsEditBtn,
                {
                  backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#EEF2FF',
                  borderColor: isDark ? '#818CF8' : '#C7D2FE',
                },
              ]}
              onPress={() => setSelectedEventForGPS(item)}
              activeOpacity={0.8}
            >
              <Text style={[styles.gpsEditBtnText, { color: isDark ? '#A5B4FC' : '#4338CA' }]} numberOfLines={1}>
                📍 Đổi địa điểm
              </Text>
            </TouchableOpacity>

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
              <Text style={[styles.qrBtnText, { color: theme.textPrimary }]} numberOfLines={1}>
                📷 Chiếu QR
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hàng 2: Báo cáo, Ẩn/Hiện & Xoá */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.reportBtn,
                {
                  backgroundColor: isDark ? 'rgba(168,85,247,0.16)' : '#FAF5FF',
                  borderColor: isDark ? '#C084FC' : '#E9D5FF',
                },
              ]}
              onPress={() =>
                navigation.navigate('AdminCheckInReports', {
                  eventId: item._id || (item as any).id,
                })
              }
              activeOpacity={0.8}
            >
              <Text style={[styles.reportBtnText, { color: isDark ? '#D8B4FE' : '#7E22CE' }]} numberOfLines={1}>
                📊 Báo cáo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.hideBtn,
                item.isHidden
                  ? {
                      backgroundColor: isDark ? 'rgba(16,185,129,0.16)' : '#ECFDF5',
                      borderColor: isDark ? '#34D399' : '#A7F3D0',
                    }
                  : {
                      backgroundColor: isDark ? 'rgba(245,158,11,0.16)' : '#FFFBEB',
                      borderColor: isDark ? '#F59E0B' : '#FDE68A',
                    },
              ]}
              onPress={async () => {
                try {
                  await toggleHideEvent(item._id || (item as any).id, !!item.isHidden);
                  void fetchEvents({ silent: true });
                } catch (err: any) {
                  Alert.alert(
                    'Lỗi cập nhật',
                    err?.response?.data?.message || err?.message || 'Không thể cập nhật trạng thái ẩn/hiện.'
                  );
                }
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.hideBtnText,
                  { color: item.isHidden ? (isDark ? '#34D399' : '#047857') : isDark ? '#FBBF24' : '#B45309' },
                ]}
                numberOfLines={1}
              >
                {item.isHidden ? '👁️ Hiện lại' : '👁️ Ẩn sự kiện'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deleteBtn,
                {
                  backgroundColor: isDark ? 'rgba(239,68,68,0.16)' : '#FEF2F2',
                  borderColor: isDark ? '#F87171' : '#FECACA',
                },
              ]}
              onPress={() => handleDelete(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteBtnText}>🗑️</Text>
            </TouchableOpacity>
          </View>
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
          <View style={styles.headerTitleWrap}>
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void fetchEvents({ refresh: true })}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
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
            void fetchEvents({ silent: true });
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
    flexWrap: 'wrap',
    gap: 10,
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 180,
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
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  createBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 28, gap: 14 },
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
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: { color: '#2563EB', fontSize: 11, fontWeight: '700' },
  gpsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 1,
    maxWidth: '100%',
  },
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
    marginBottom: 10,
  },
  locationLabel: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  locationValue: { fontSize: 13, color: '#1E293B', fontWeight: '600', marginTop: 2 },
  coordsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  coordsText: {
    flex: 1,
    flexShrink: 1,
    minWidth: 155,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#059669',
    fontWeight: '600',
  },
  mapLinkBtn: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    flexShrink: 0,
  },
  mapLinkText: { fontSize: 11, color: '#4338CA', fontWeight: '700' },
  noCoordsText: { fontSize: 11.5, color: '#D97706', marginTop: 6, fontStyle: 'italic' },
  actionsStack: { gap: 8, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  gpsEditBtn: {
    flex: 1,
    minHeight: 40,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  gpsEditBtnText: { color: '#4338CA', fontSize: 12.5, fontWeight: '700' },
  qrBtn: {
    minWidth: 108,
    minHeight: 40,
    backgroundColor: '#F1F5F9',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  qrBtnText: { color: '#0F172A', fontSize: 12.5, fontWeight: '700' },
  reportBtn: {
    flex: 1,
    minHeight: 38,
    backgroundColor: '#FAF5FF',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  reportBtnText: { color: '#7E22CE', fontSize: 12, fontWeight: '700' },
  deleteBtn: {
    width: 44,
    minHeight: 38,
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteBtnText: { fontSize: 14 },
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
    flex: 1,
    minHeight: 38,
    backgroundColor: '#FFFBEB',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  unhideBtn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  hideBtnText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '700',
  },
  quotaBox: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  quotaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  quotaLabel: {
    flex: 1,
    flexShrink: 1,
    minWidth: 150,
    fontSize: 12.5,
    lineHeight: 18,
  },
  manageAttendeesBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    flexShrink: 0,
  },
  manageAttendeesBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
});
