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
import {
  getAllRegistrations,
  getEvents,
  getUsers,
  adminManualCheckIn,
  updateEventQuota,
  addEventAttendee,
  removeEventAttendee,
  adminQuickCheckIn,
} from '../../services/api';
import { Registration, Event, User } from '../../types';
import { getDistanceMeters, formatDistance } from '../../utils/locationUtils';
import { openInGoogleMaps } from '../../utils/permissionHandler';
import { useAppTheme } from '../../theme/ThemeContext';

type RouteType = RouteProp<AdminStackParamList, 'AdminCheckInReports'>;
type FilterType = 'all' | 'checked_in' | 'registered' | 'waitlist' | 'violation';

export default function AdminCheckInReportsScreen() {
  const { theme, isDark } = useAppTheme();
  const route = useRoute<RouteType>();
  const initialEventId = route.params?.eventId;

  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialEventId || null);

  // Bộ lọc & Tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Modal điểm danh bù thủ công (Manual Attendance by MSSV)
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualMssv, setManualMssv] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [submittingManual, setSubmittingManual] = useState(false);

  // Modal cấu hình Quota & Waitlist
  const [quotaModalVisible, setQuotaModalVisible] = useState(false);
  const [quotaMaxSlots, setQuotaMaxSlots] = useState('100');
  const [quotaWaitlistSlots, setQuotaWaitlistSlots] = useState('20');
  const [submittingQuota, setSubmittingQuota] = useState(false);

  // Modal thêm sinh viên mới vào sự kiện
  const [addAttendeeModalVisible, setAddAttendeeModalVisible] = useState(false);
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);

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

      if (!selectedEventId && evts.length > 0) {
        setSelectedEventId(evts[0]._id || (evts[0] as any).id);
      }
    } catch (e) {
      console.warn('Lỗi tải dữ liệu người tham gia:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sự kiện đang được chọn
  const activeEvent = useMemo(() => {
    if (!selectedEventId) return events[0] || null;
    return events.find((e) => e._id === selectedEventId || (e as any).id === selectedEventId) || events[0] || null;
  }, [events, selectedEventId]);

  // Cập nhật giá trị Quota khi activeEvent thay đổi
  useEffect(() => {
    if (activeEvent) {
      setQuotaMaxSlots(String(activeEvent.maxSlots || 100));
      setQuotaWaitlistSlots(String(activeEvent.waitlistSlots || 20));
    }
  }, [activeEvent]);

  // Danh sách đăng ký thuộc sự kiện đang chọn (loại trừ đã hủy khỏi danh sách đếm)
  const currentEventRegistrations = useMemo(() => {
    if (!activeEvent) return [];
    const eventId = activeEvent._id || (activeEvent as any).id;
    return registrations.filter((r) => r.eventId === eventId);
  }, [registrations, activeEvent]);

  // Thống kê số lượng theo trạng thái
  const quotaStats = useMemo(() => {
    const totalActive = currentEventRegistrations.filter((r) => r.status !== 'cancelled');
    const checkedInCount = totalActive.filter((r) => r.status === 'checked_in').length;
    const officialCount = totalActive.filter((r) => r.status === 'registered' || r.status === 'checked_in').length;
    const waitlistCount = totalActive.filter((r) => r.status === 'waitlist').length;
    const maxSlots = activeEvent?.maxSlots || 100;
    const waitlistSlots = activeEvent?.waitlistSlots || 20;

    return {
      officialCount,
      maxSlots,
      waitlistCount,
      waitlistSlots,
      checkedInCount,
      remainingSlots: Math.max(0, maxSlots - officialCount),
      isFull: officialCount >= maxSlots,
    };
  }, [currentEventRegistrations, activeEvent]);

  // Bộ lọc kết hợp hiển thị
  const filteredList = useMemo(() => {
    return currentEventRegistrations.filter((item) => {
      // 1. Tìm kiếm MSSV hoặc Họ tên hoặc Email
      const student = users.find((u) => u._id === item.userId || (u as any).id === item.userId);
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const nameMatch = student?.fullName?.toLowerCase().includes(query);
        const mssvMatch = student?.studentId?.toLowerCase().includes(query);
        const emailMatch = student?.email?.toLowerCase().includes(query);
        if (!nameMatch && !mssvMatch && !emailMatch) return false;
      }

      // 2. Lọc theo trạng thái
      if (filterType === 'checked_in') return item.status === 'checked_in';
      if (filterType === 'registered') return item.status === 'registered';
      if (filterType === 'waitlist') return item.status === 'waitlist';

      if (filterType === 'violation') {
        if (item.status !== 'checked_in') return false;
        if (item.checkInMethod === 'admin_manual') return false;
        if (item.checkInLocation && activeEvent?.coordinates) {
          const dist = getDistanceMeters(
            item.checkInLocation.latitude,
            item.checkInLocation.longitude,
            activeEvent.coordinates.latitude,
            activeEvent.coordinates.longitude
          );
          return dist > 500;
        }
        return false;
      }

      // Mặc định 'all'
      return item.status !== 'cancelled';
    });
  }, [currentEventRegistrations, searchQuery, filterType, users, activeEvent]);

  // ─── Thao tác Quản lý ────────────────────────────────────────────────────────

  // 1. Cập nhật Quota
  const handleSaveQuota = async () => {
    if (!activeEvent) return;
    const max = parseInt(quotaMaxSlots, 10);
    const waitlist = parseInt(quotaWaitlistSlots, 10);

    if (isNaN(max) || max < 1) {
      Alert.alert('Giá trị không hợp lệ', 'Tổng số lượng chỗ chính thức phải lớn hơn hoặc bằng 1.');
      return;
    }

    setSubmittingQuota(true);
    try {
      const eventId = activeEvent._id || (activeEvent as any).id;
      const res = await updateEventQuota(eventId, max, isNaN(waitlist) ? 20 : waitlist);
      Alert.alert('Thành công! 🎉', res.message);
      setQuotaModalVisible(false);
      await loadData();
    } catch (e: any) {
      Alert.alert('Lỗi cập nhật', e?.message || 'Không thể cập nhật Quota sự kiện.');
    } finally {
      setSubmittingQuota(false);
    }
  };

  // 2. Thêm Sinh viên tham gia
  const handleAddStudent = async () => {
    if (!activeEvent) return;
    if (!newStudentId.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập MSSV hoặc Email của sinh viên cần thêm.');
      return;
    }

    setSubmittingAdd(true);
    try {
      const eventId = activeEvent._id || (activeEvent as any).id;
      const res = await addEventAttendee(eventId, newStudentId.trim(), newStudentName.trim() || undefined);
      Alert.alert('Thành công! 🎉', res.message);
      setNewStudentId('');
      setNewStudentName('');
      setAddAttendeeModalVisible(false);
      await loadData();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || e?.message || 'Không thể thêm sinh viên vào sự kiện.');
    } finally {
      setSubmittingAdd(false);
    }
  };

  // 3. Xoá / Hủy người tham gia (Tự động đôn Waitlist)
  const handleRemoveStudent = (item: Registration, studentName: string) => {
    Alert.alert(
      'Xác nhận xoá người tham gia',
      `Bạn có chắc chắn muốn xoá sinh viên "${studentName}" khỏi sự kiện này?\n\nNếu có sinh viên trong Danh sách chờ (Waitlist), hệ thống sẽ tự động đôn người chờ đầu tiên lên chính thức!`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xoá ngay',
          style: 'destructive',
          onPress: async () => {
            try {
              const regId = item._id || (item as any).id;
              const res = await removeEventAttendee(regId);
              Alert.alert('Đã cập nhật! 🎯', res.message);
              await loadData();
            } catch (e: any) {
              Alert.alert('Lỗi', e?.message || 'Không thể xoá sinh viên.');
            }
          },
        },
      ]
    );
  };

  // 4. 1-Tap Điểm danh nhanh cho sinh viên đã có trong danh sách
  const handleQuickCheckInAction = async (item: Registration, studentName: string) => {
    try {
      const regId = item._id || (item as any).id;
      const res = await adminQuickCheckIn(regId);
      Alert.alert('Đã điểm danh! ✅', res.message);
      await loadData();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể điểm danh nhanh.');
    }
  };

  // 5. Điểm danh bù thủ công theo MSSV
  const handleManualCheckInSubmit = async () => {
    if (!manualMssv.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập MSSV hoặc Email của sinh viên cần điểm danh bù.');
      return;
    }
    if (!activeEvent) return;

    setSubmittingManual(true);
    try {
      const eventId = activeEvent._id || (activeEvent as any).id;
      const res = await adminManualCheckIn({
        eventId,
        studentIdOrEmail: manualMssv.trim(),
        note: manualNote.trim() || 'Admin xác nhận tham dự thủ công tại hội trường',
      });

      if (res.success) {
        Alert.alert('Thành công! 🎉', res.message);
        setManualMssv('');
        setManualNote('');
        setManualModalVisible(false);
        await loadData();
      } else {
        Alert.alert('Lỗi', res.message);
      }
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể điểm danh bù.');
    } finally {
      setSubmittingManual(false);
    }
  };

  // ─── Render Card Mỗi Sinh Viên ───────────────────────────────────────────────
  const renderItem = ({ item }: { item: Registration }) => {
    const student = users.find((u) => u._id === item.userId || (u as any).id === item.userId);
    const isManual = item.checkInMethod === 'admin_manual';
    const isCheckedIn = item.status === 'checked_in';
    const isWaitlist = item.status === 'waitlist';

    let distance: number | null = null;
    let isSafe = true;

    if (isCheckedIn && item.checkInLocation && activeEvent?.coordinates) {
      distance = getDistanceMeters(
        item.checkInLocation.latitude,
        item.checkInLocation.longitude,
        activeEvent.coordinates.latitude,
        activeEvent.coordinates.longitude
      );
      isSafe = distance <= 500;
    }

    const displayName = student?.fullName || `Sinh viên (${student?.studentId || item.userId})`;
    const displayMssv = student?.studentId || 'SV-N/A';

    return (
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {/* Top Info */}
        <View style={styles.cardHeader}>
          <View style={styles.studentTitleRow}>
            <Text style={[styles.studentName, { color: theme.textPrimary }]}>{displayName}</Text>
            {isManual && (
              <View style={[styles.manualTag, { backgroundColor: isDark ? 'rgba(124,58,237,0.2)' : '#EDE9FE' }]}>
                <Text style={[styles.manualTagText, { color: isDark ? '#A78BFA' : '#6D28D9' }]}>✍️ BÙ</Text>
              </View>
            )}
          </View>

          {/* Badge trạng thái */}
          <View
            style={[
              styles.statusBadge,
              isCheckedIn
                ? isManual
                  ? styles.badgeManual
                  : isSafe
                  ? styles.badgeSuccess
                  : styles.badgeDanger
                : isWaitlist
                ? styles.badgeWaitlist
                : styles.badgeOfficial,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isCheckedIn
                  ? isManual
                    ? styles.textManual
                    : isSafe
                    ? styles.textSuccess
                    : styles.textDanger
                  : isWaitlist
                  ? styles.textWaitlist
                  : styles.textOfficial,
              ]}
            >
              {isCheckedIn
                ? isManual
                  ? 'ĐÃ DUYỆT BÙ'
                  : distance != null
                  ? isSafe
                    ? `✅ ĐÃ CHECK-IN (${formatDistance(distance)})`
                    : `🚨 VI PHẠM GPS (${formatDistance(distance)})`
                  : '✅ ĐÃ CHECK-IN'
                : isWaitlist
                ? `⏳ WAITLIST #${item.waitlistPosition || 1}`
                : '🔵 ĐÃ ĐĂNG KÝ'}
            </Text>
          </View>
        </View>

        <Text style={[styles.studentSub, { color: theme.textSecondary }]}>
          MSSV: <Text style={{ fontWeight: '700', color: theme.textPrimary }}>{displayMssv}</Text>
          {student?.faculty ? ` • ${student.faculty}` : ''}
        </Text>

        <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />

        {/* Thời gian */}
        <View style={styles.infoRow}>
          <Text style={[styles.timeText, { color: theme.textTertiary }]}>
            📅 Đăng ký: {item.registeredAt || item.createdAt ? new Date(item.registeredAt || item.createdAt!).toLocaleDateString('vi-VN') : 'Mặc định'}
          </Text>
          {isCheckedIn && item.checkInTime && (
            <Text style={[styles.timeText, { color: isDark ? '#34D399' : '#059669', fontWeight: '600' }]}>
              ⏰ Check-in: {new Date(item.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>

        {/* GPS Check-in Info */}
        {isCheckedIn && item.checkInLocation?.latitude != null && (
          <View style={[styles.locationBox, { backgroundColor: theme.surfaceSecondary }]}>
            <Text style={styles.locCoords}>
              📍 GPS: {item.checkInLocation.latitude.toFixed(4)}, {item.checkInLocation.longitude.toFixed(4)}
            </Text>
            <TouchableOpacity
              onPress={() =>
                openInGoogleMaps(
                  item.checkInLocation!.latitude,
                  item.checkInLocation!.longitude,
                  `Vị trí điểm danh của ${displayName}`
                )
              }
              style={[styles.mapBtn, { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#EEF2FF' }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.mapBtnText, { color: isDark ? '#A5B4FC' : '#4338CA' }]}>🗺️ Mở Maps</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons: 1-Tap Quick Check-in & Remove Attendee */}
        <View style={styles.cardActionRow}>
          {!isCheckedIn && !isWaitlist && (
            <TouchableOpacity
              style={[styles.quickCheckInBtn, { backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : '#ECFDF5', borderColor: '#10B981' }]}
              onPress={() => handleQuickCheckInAction(item, displayName)}
              activeOpacity={0.8}
            >
              <Text style={styles.quickCheckInText}>⚡ Điểm danh ngay</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.removeBtn, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2', borderColor: '#EF4444' }]}
            onPress={() => handleRemoveStudent(item, displayName)}
            activeOpacity={0.8}
          >
            <Text style={styles.removeBtnText}>🗑️ Xoá / Hủy chỗ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={theme.statusBarStyle} />

      {/* Header chính */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>👥 Quản Lý Người Tham Gia & Quota</Text>
            <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
              Kiểm soát số lượng sinh viên, danh sách chờ và thực hiện điểm danh
            </Text>
          </View>
        </View>

        {/* Horizontal Event Picker */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventPickerScroll}>
          {events.map((ev) => {
            const evId = ev._id || (ev as any).id;
            const isSelected = selectedEventId === evId;
            return (
              <TouchableOpacity
                key={evId}
                style={[
                  styles.eventChip,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surfaceSecondary,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setSelectedEventId(evId)}
              >
                <Text
                  style={[
                    styles.eventChipText,
                    { color: isSelected ? '#FFFFFF' : theme.textSecondary, fontWeight: isSelected ? '700' : '500' },
                  ]}
                  numberOfLines={1}
                >
                  {ev.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Banner Quota & Attendees KPI */}
        {activeEvent && (
          <View style={[styles.quotaSummaryCard, { backgroundColor: isDark ? 'rgba(30,41,59,0.7)' : '#F8FAFC', borderColor: theme.border }]}>
            <View style={styles.quotaHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.activeEventTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                  {activeEvent.title}
                </Text>
                <Text style={[styles.quotaStatusText, { color: theme.textSecondary }]}>
                  Đã đăng ký: <Text style={{ fontWeight: '700', color: theme.primary }}>{quotaStats.officialCount} / {quotaStats.maxSlots}</Text> chỗ chính thức
                  {quotaStats.waitlistCount > 0 ? ` • Chờ: ${quotaStats.waitlistCount}/${quotaStats.waitlistSlots}` : ''}
                </Text>
              </View>

              <View style={styles.quotaActionButtons}>
                <TouchableOpacity
                  style={[styles.quotaEditBtn, { backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : '#EFF6FF', borderColor: theme.primary }]}
                  onPress={() => setQuotaModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.quotaEditBtnText, { color: theme.primary }]}>⚙️ Đổi Quota</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.addStudentBtn, { backgroundColor: theme.primary }]}
                  onPress={() => setAddAttendeeModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addStudentBtnText}>➕ Thêm SV</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick action buttons row */}
            <View style={styles.secondaryActionRow}>
              <TouchableOpacity
                style={[styles.smallActionBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                onPress={() => setManualModalVisible(true)}
              >
                <Text style={[styles.smallActionBtnText, { color: theme.textSecondary }]}>✍️ Điểm danh bù thủ công</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Search Input */}
        <View style={[styles.searchBox, { backgroundColor: theme.inputBackground, marginTop: 10 }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Tìm theo MSSV, Họ tên hoặc Email..."
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

        {/* Filter Chips */}
        <View style={styles.filterChipRow}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: filterType === 'all' ? theme.primary : theme.surfaceSecondary },
            ]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterChipText, { color: filterType === 'all' ? '#FFFFFF' : theme.textSecondary }]}>
              Tất cả ({currentEventRegistrations.filter((r) => r.status !== 'cancelled').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: filterType === 'checked_in' ? '#059669' : theme.surfaceSecondary },
            ]}
            onPress={() => setFilterType('checked_in')}
          >
            <Text style={[styles.filterChipText, { color: filterType === 'checked_in' ? '#FFFFFF' : theme.textSecondary }]}>
              ✅ Đã check-in ({quotaStats.checkedInCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: filterType === 'registered' ? '#2563EB' : theme.surfaceSecondary },
            ]}
            onPress={() => setFilterType('registered')}
          >
            <Text style={[styles.filterChipText, { color: filterType === 'registered' ? '#FFFFFF' : theme.textSecondary }]}>
              🔵 Chờ đến ({Math.max(0, quotaStats.officialCount - quotaStats.checkedInCount)})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: filterType === 'waitlist' ? '#D97706' : theme.surfaceSecondary },
            ]}
            onPress={() => setFilterType('waitlist')}
          >
            <Text style={[styles.filterChipText, { color: filterType === 'waitlist' ? '#FFFFFF' : theme.textSecondary }]}>
              ⏳ Chờ vé ({quotaStats.waitlistCount})
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
        </View>
      </View>

      {/* Danh sách người tham gia */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Đang tải danh sách người tham gia...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item._id || (item as any).id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Chưa có người tham gia phù hợp</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Dùng nút "➕ Thêm SV" ở trên để đưa sinh viên vào sự kiện hoặc thử xóa bộ lọc tìm kiếm.
              </Text>
            </View>
          }
        />
      )}

      {/* ─── Modal 1: Cấu hình Quota & Waitlist ──────────────────────────────── */}
      <Modal
        visible={quotaModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setQuotaModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>⚙️ Cấu Hình Số Lượng Sinh Viên (Quota)</Text>
              <TouchableOpacity onPress={() => setQuotaModalVisible(false)}>
                <Text style={styles.modalCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDesc, { color: theme.textSecondary }]}>
              Điều chỉnh số lượng chỗ chính thức và danh sách chờ cho sự kiện "{activeEvent?.title}". Nếu bạn tăng Quota, hệ thống sẽ tự động đôn các bạn đang ở Danh sách chờ lên chính thức!
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Số lượng chính thức tối đa (Chỗ Quota) *</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder="VD: 100"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="numeric"
                  value={quotaMaxSlots}
                  onChangeText={setQuotaMaxSlots}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Số lượng danh sách chờ (Waitlist) *</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder="VD: 20"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="numeric"
                  value={quotaWaitlistSlots}
                  onChangeText={setQuotaWaitlistSlots}
                />
              </View>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]}
                onPress={handleSaveQuota}
                disabled={submittingQuota}
                activeOpacity={0.8}
              >
                {submittingQuota ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>💾 Lưu Cấu Hình Quota</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── Modal 2: Thêm Sinh viên tham gia đơn lẻ ────────────────────────── */}
      <Modal
        visible={addAttendeeModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddAttendeeModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>➕ Thêm Sinh Viên Vào Sự Kiện</Text>
              <TouchableOpacity onPress={() => setAddAttendeeModalVisible(false)}>
                <Text style={styles.modalCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDesc, { color: theme.textSecondary }]}>
              Nhập mã số sinh viên hoặc email của sinh viên để thêm vào danh sách tham gia sự kiện.
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
                  placeholder="VD: 23644661 hoặc sv23644661@iuh.edu.vn"
                  placeholderTextColor={theme.textTertiary}
                  value={newStudentId}
                  onChangeText={setNewStudentId}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Họ và tên sinh viên (tùy chọn)</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder="VD: Nguyễn Văn A"
                  placeholderTextColor={theme.textTertiary}
                  value={newStudentName}
                  onChangeText={setNewStudentName}
                />
              </View>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]}
                onPress={handleAddStudent}
                disabled={submittingAdd}
                activeOpacity={0.8}
              >
                {submittingAdd ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>✅ Thêm Sinh Viên</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── Modal 3: Điểm danh bù thủ công (Manual) ────────────────────────── */}
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
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder="VD: Xác nhận sinh viên có mặt tại bàn BTC"
                  placeholderTextColor={theme.textTertiary}
                  value={manualNote}
                  onChangeText={setManualNote}
                />
              </View>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: '#7C3AED' }]}
                onPress={handleManualCheckInSubmit}
                disabled={submittingManual}
                activeOpacity={0.8}
              >
                {submittingManual ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>✅ Xác Nhận Điểm Danh Bù</Text>
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
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerSub: { fontSize: 11.5, marginTop: 2 },
  eventPickerScroll: {
    paddingVertical: 6,
  },
  eventChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  eventChipText: {
    fontSize: 12,
  },
  quotaSummaryCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  quotaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeEventTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  quotaStatusText: {
    fontSize: 12,
  },
  quotaActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quotaEditBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
  },
  quotaEditBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  addStudentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addStudentBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  secondaryActionRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  smallActionBtn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  smallActionBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 38,
  },
  searchIcon: { fontSize: 13, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 12.5 },
  clearIcon: { fontSize: 14, color: '#94A3B8', padding: 4 },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  filterChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    marginRight: 6,
    marginBottom: 4,
  },
  filterChipText: { fontSize: 11, fontWeight: '600' },
  list: { padding: 14 },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  studentTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  studentName: { fontSize: 14.5, fontWeight: '700' },
  manualTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  manualTagText: { fontSize: 9, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeSuccess: { backgroundColor: '#DCFCE7' },
  badgeDanger: { backgroundColor: '#FEE2E2' },
  badgeManual: { backgroundColor: '#EDE9FE' },
  badgeOfficial: { backgroundColor: '#DBEAFE' },
  badgeWaitlist: { backgroundColor: '#FEF3C7' },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  textSuccess: { color: '#166534' },
  textDanger: { color: '#991B1B' },
  textManual: { color: '#6D28D9' },
  textOfficial: { color: '#1E40AF' },
  textWaitlist: { color: '#B45309' },
  studentSub: { fontSize: 12, marginBottom: 6 },
  divider: { height: 1, marginVertical: 6 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: { fontSize: 11 },
  locationBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  locCoords: { fontSize: 11, color: '#059669', fontWeight: '600' },
  mapBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  mapBtnText: { fontSize: 11, fontWeight: '700' },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  quickCheckInBtn: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 8,
  },
  quickCheckInText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  removeBtn: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  removeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 13, marginTop: 8 },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  emptyText: { fontSize: 12.5, textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: { fontSize: 16.5, fontWeight: '800' },
  modalCloseBtn: { fontSize: 18, color: '#94A3B8', padding: 4 },
  modalDesc: { fontSize: 12, lineHeight: 17, marginBottom: 16 },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  modalSubmitBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  modalSubmitBtnText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '700' },
});
