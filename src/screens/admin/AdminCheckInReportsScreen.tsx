import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import type { AdminStackParamList } from '../../navigation/types';
import { getAllRegistrations, getEvents, getUsers, adminManualCheckIn } from '../../services/api';
import { Registration, Event, User } from '../../types';
import { getDistanceMeters, formatDistance } from '../../utils/locationUtils';
import { openInGoogleMaps } from '../../utils/permissionHandler';
import { Colors } from '../../theme';
import { useAppTheme } from '../../theme/ThemeContext';

type RouteType = RouteProp<AdminStackParamList, 'AdminCheckInReports'>;
type FilterType = 'all' | 'valid' | 'violation' | 'manual';

export default function AdminCheckInReportsScreen() {
  const { theme, isDark } = useAppTheme();
  const route = useRoute<RouteType>();
  const initialEventId = route.params?.eventId;

  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialEventId || null);

  // Bộ lọc & Tìm kiếm nghiệp vụ nâng cao
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Modal điểm danh bù thủ công (Manual Attendance by MSSV)
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualMssv, setManualMssv] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [manualEventId, setManualEventId] = useState<string>('');
  const [submittingManual, setSubmittingManual] = useState(false);

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
      if (!manualEventId && evts.length > 0) {
        setManualEventId(evts[0]._id || (evts[0] as any).id);
      }
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
  const checkedInList = useMemo(() => {
    return registrations.filter((r) => r.status === 'checked_in');
  }, [registrations]);

  // Bộ lọc kết hợp: Sự kiện + Từ khoá tìm kiếm + Phân loại GPS
  const filteredList = useMemo(() => {
    return checkedInList.filter((item) => {
      // 1. Lọc theo sự kiện
      if (selectedEventId && item.eventId !== selectedEventId) return false;

      const event = events.find((e) => e._id === item.eventId || (e as any).id === item.eventId);
      const student = users.find((u) => u._id === item.userId || (u as any).id === item.userId);

      // 2. Tìm kiếm MSSV hoặc Họ tên
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const nameMatch = student?.fullName?.toLowerCase().includes(query);
        const mssvMatch = student?.studentId?.toLowerCase().includes(query);
        const emailMatch = student?.email?.toLowerCase().includes(query);
        if (!nameMatch && !mssvMatch && !emailMatch) return false;
      }

      // 3. Phân loại trạng thái
      let isSafe = true;
      let hasGPS = !!(item.checkInLocation && event?.coordinates);
      if (hasGPS) {
        const dist = getDistanceMeters(
          item.checkInLocation!.latitude,
          item.checkInLocation!.longitude,
          event!.coordinates!.latitude,
          event!.coordinates!.longitude
        );
        isSafe = dist <= 500;
      }

      const isManual = item.checkInMethod === 'admin_manual';

      if (filterType === 'valid') return isSafe && !isManual;
      if (filterType === 'violation') return !isSafe && !isManual;
      if (filterType === 'manual') return isManual;
      return true;
    });
  }, [checkedInList, selectedEventId, searchQuery, filterType, events, users]);

  // Tính toán KPI
  const stats = useMemo(() => {
    const total = filteredList.length;
    let validGpsCount = 0;
    let manualCount = 0;
    let totalPoints = 0;

    filteredList.forEach((r) => {
      const event = events.find((e) => e._id === r.eventId || (e as any).id === r.eventId);
      totalPoints += event?.trainingPoints || 5;

      if (r.checkInMethod === 'admin_manual') {
        manualCount++;
      } else if (r.checkInLocation && event?.coordinates) {
        const dist = getDistanceMeters(
          r.checkInLocation.latitude,
          r.checkInLocation.longitude,
          event.coordinates.latitude,
          event.coordinates.longitude
        );
        if (dist <= 500) validGpsCount++;
      }
    });

    const validGpsRate = total > 0 ? Math.round((validGpsCount / total) * 100) : 100;
    return { total, validGpsRate, manualCount, totalPoints };
  }, [filteredList, events]);

  // Xử lý điểm danh bù thủ công
  const handleManualCheckInSubmit = async () => {
    if (!manualMssv.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập MSSV hoặc Email của sinh viên cần điểm danh bù.');
      return;
    }
    const targetEventId = selectedEventId || manualEventId;
    if (!targetEventId) {
      Alert.alert('Chưa chọn sự kiện', 'Vui lòng chọn sự kiện áp dụng điểm danh bù.');
      return;
    }

    setSubmittingManual(true);
    try {
      const res = await adminManualCheckIn({
        eventId: targetEventId,
        studentIdOrEmail: manualMssv.trim(),
        note: manualNote.trim() || 'Admin xác nhận tham dự thủ công tại hội trường',
      });

      if (res.success) {
        Alert.alert('Thành công! 🎉', res.message);
        setManualMssv('');
        setManualNote('');
        setManualModalVisible(false);
        loadData();
      } else {
        Alert.alert('Lỗi', res.message);
      }
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể điểm danh bù.');
    } finally {
      setSubmittingManual(false);
    }
  };

  const renderItem = ({ item }: { item: Registration }) => {
    const event = events.find((e) => e._id === item.eventId || (e as any).id === item.eventId);
    const student = users.find((u) => u._id === item.userId || (u as any).id === item.userId);

    const isManual = item.checkInMethod === 'admin_manual';
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
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.studentTitleRow}>
            <Text style={[styles.studentName, { color: theme.textPrimary }]}>{student?.fullName || 'Sinh viên'}</Text>
            {isManual && (
              <View style={[styles.manualTag, { backgroundColor: isDark ? 'rgba(124,58,237,0.2)' : '#EDE9FE' }]}>
                <Text style={[styles.manualTagText, { color: isDark ? '#A78BFA' : '#6D28D9' }]}>✍️ ĐIỂM DANH BÙ</Text>
              </View>
            )}
          </View>

          <View style={[styles.statusBadge, isManual ? styles.badgeManual : isSafe ? styles.badgeSuccess : styles.badgeDanger]}>
            <Text style={[styles.statusBadgeText, isManual ? styles.textManual : isSafe ? styles.textSuccess : styles.textDanger]}>
              {isManual
                ? 'ĐÃ DUYỆT (ADMIN)'
                : distance != null
                ? isSafe
                  ? `✅ HỢP LỆ (${formatDistance(distance)})`
                  : `🚨 VI PHẠM GPS (${formatDistance(distance)})`
                : '✅ ĐÃ CHECK-IN'}
            </Text>
          </View>
        </View>

        <Text style={[styles.studentSub, { color: theme.textSecondary }]}>
          Mã SV: <Text style={{ fontWeight: '700', color: theme.textPrimary }}>{student?.studentId || 'SV-N/A'}</Text> • Khoa: {student?.faculty || 'Toàn trường'}
        </Text>

        <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />

        {/* Thông tin sự kiện */}
        <Text style={[styles.eventTitle, { color: theme.textPrimary }]}>🎯 Sự kiện: {event?.title || 'Sự kiện IUH'}</Text>
        <Text style={[styles.timeText, { color: theme.textTertiary }]}>
          🕒 Thời gian: {item.checkInTime ? new Date(item.checkInTime).toLocaleString('vi-VN') : 'Không rõ'}
        </Text>

        {item.note && (
          <Text style={[styles.noteText, { color: isDark ? '#818CF8' : '#4F46E5' }]}>
            📝 Ghi chú: <Text style={{ fontStyle: 'italic' }}>{item.note}</Text>
          </Text>
        )}

        {/* Vị trí check-in */}
        {item.checkInLocation?.latitude != null && item.checkInLocation?.longitude != null && (
          <View style={[styles.locationBox, { backgroundColor: theme.surfaceSecondary }]}>
            <Text style={styles.locCoords}>
              📍 GPS: {item.checkInLocation.latitude.toFixed(5)}, {item.checkInLocation.longitude.toFixed(5)}
            </Text>
            <TouchableOpacity
              onPress={() =>
                openInGoogleMaps(
                  item.checkInLocation!.latitude,
                  item.checkInLocation!.longitude,
                  `Vị trí điểm danh của ${student?.fullName || 'sinh viên'}`
                )
              }
              style={[styles.mapBtn, { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#EEF2FF' }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.mapBtnText, { color: isDark ? '#A5B4FC' : '#4338CA' }]}>🗺️ Mở Maps</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={theme.statusBarStyle} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>📊 Quản Lý Điểm Danh & Anti-Fake</Text>
            <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
              Hệ thống giám sát trắc địa GPS & Hỗ trợ điểm danh bù cho sinh viên
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.manualBtn, { backgroundColor: theme.primary }]}
            onPress={() => setManualModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.manualBtnText}>➕ Điểm danh bù</Text>
          </TouchableOpacity>
        </View>

        {/* Metrics KPI Bar */}
        <View style={[styles.metricsBar, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricNum, { color: theme.textPrimary }]}>{stats.total}</Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Đã check-in</Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricNum, { color: '#059669' }]}>{stats.validGpsRate}%</Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>GPS Hợp lệ</Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricNum, { color: isDark ? '#A78BFA' : '#7C3AED' }]}>+{stats.totalPoints}</Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Tổng ĐRL cấp</Text>
          </View>
        </View>

        {/* Search Input */}
        <View style={[styles.searchBox, { backgroundColor: theme.inputBackground }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Tìm theo MSSV, Họ tên hoặc Email sinh viên..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Status Filter Chips */}
        <View style={styles.filterChipRow}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: filterType === 'all' ? theme.primary : theme.surfaceSecondary },
            ]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterChipText, { color: filterType === 'all' ? '#FFFFFF' : theme.textSecondary }]}>
              Tất cả ({checkedInList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: filterType === 'valid' ? '#059669' : theme.surfaceSecondary },
            ]}
            onPress={() => setFilterType('valid')}
          >
            <Text style={[styles.filterChipText, { color: filterType === 'valid' ? '#FFFFFF' : theme.textSecondary }]}>
              ✅ Hợp lệ GPS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: filterType === 'violation' ? '#DC2626' : theme.surfaceSecondary },
            ]}
            onPress={() => setFilterType('violation')}
          >
            <Text style={[styles.filterChipText, { color: filterType === 'violation' ? '#FFFFFF' : theme.textSecondary }]}>
              🚨 Vi phạm GPS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: filterType === 'manual' ? (isDark ? '#7C3AED' : '#6D28D9') : theme.surfaceSecondary },
            ]}
            onPress={() => setFilterType('manual')}
          >
            <Text style={[styles.filterChipText, { color: filterType === 'manual' ? '#FFFFFF' : theme.textSecondary }]}>
              ✍️ Điểm danh bù
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Đang tải báo cáo điểm danh...</Text>
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
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Không có dữ liệu phù hợp</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Thử xoá bộ lọc hoặc tìm kiếm với từ khoá khác.</Text>
            </View>
          }
        />
      )}

      {/* Modal Điểm danh bù thủ công */}
      <Modal
        visible={manualModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setManualModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>✍️ Điểm Danh Bù Cho Sinh Viên</Text>
              <TouchableOpacity onPress={() => setManualModalVisible(false)}>
                <Text style={styles.modalCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDesc, { color: theme.textSecondary }]}>
              Sử dụng khi sinh viên gặp sự cố thiết bị (hết pin, hỏng camera) và đã xác nhận có mặt thực tế tại hội trường.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Mã số sinh viên (MSSV) hoặc Email *</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder="VD: SV01, 23644661 hoặc sv01@iuh.edu.vn"
                  placeholderTextColor={theme.textTertiary}
                  value={manualMssv}
                  onChangeText={setManualMssv}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Lý do / Ghi chú của Ban Tổ Chức</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      height: 70,
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder="VD: Thiết bị hết pin, đã xuất trình thẻ sinh viên tại bàn lễ tân..."
                  placeholderTextColor={theme.textTertiary}
                  value={manualNote}
                  onChangeText={setManualNote}
                  multiline
                />
              </View>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }, submittingManual && { opacity: 0.7 }]}
                onPress={handleManualCheckInSubmit}
                disabled={submittingManual}
                activeOpacity={0.85}
              >
                {submittingManual ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Xác Nhận Điểm Danh Ngay</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    gap: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 12, color: '#64748B', lineHeight: 16, marginTop: 2 },
  manualBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  manualBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  metricsBar: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricNum: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  metricLabel: { fontSize: 11, color: '#64748B', marginTop: 2 },
  metricDivider: { width: 1, height: 24, backgroundColor: '#CBD5E1' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },
  clearIcon: { fontSize: 14, color: '#94A3B8', padding: 4 },
  filterChipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  filterChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterChipActive: { backgroundColor: '#2563EB' },
  filterChipActiveSuccess: { backgroundColor: '#059669' },
  filterChipActiveDanger: { backgroundColor: '#DC2626' },
  filterChipActiveManual: { backgroundColor: '#7C3AED' },
  filterChipText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  filterChipTextActive: { color: '#FFFFFF' },
  filterChipTextActiveSuccess: { color: '#FFFFFF' },
  filterChipTextActiveDanger: { color: '#FFFFFF' },
  filterChipTextActiveManual: { color: '#FFFFFF' },
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
  studentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  studentName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  manualTag: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  manualTagText: { fontSize: 9, fontWeight: '800', color: '#6D28D9' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeSuccess: { backgroundColor: '#DCFCE7' },
  badgeDanger: { backgroundColor: '#FEE2E2' },
  badgeManual: { backgroundColor: '#EDE9FE' },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  textSuccess: { color: '#166534' },
  textDanger: { color: '#991B1B' },
  textManual: { color: '#6D28D9' },
  studentSub: { fontSize: 12, color: '#64748B', marginBottom: 6 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 6 },
  eventTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  timeText: { fontSize: 11, color: '#64748B' },
  noteText: { fontSize: 11, color: '#4F46E5', marginTop: 4 },
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
  mapBtn: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  mapBtnText: { fontSize: 11, color: '#4338CA', fontWeight: '700' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { color: '#64748B', fontSize: 13 },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  emptyText: { color: '#94A3B8', fontSize: 13, marginTop: 4, textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  modalCloseBtn: { fontSize: 18, color: '#94A3B8', padding: 4 },
  modalDesc: { fontSize: 12, color: '#64748B', lineHeight: 17, marginBottom: 16 },
  fieldGroup: { marginBottom: 14, gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#334155' },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  modalSubmitBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  modalSubmitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
