import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout, switchTestAccount } from '../../features/auth/authSlice';
import { getEvents, getAllRegistrations, getUsers } from '../../services/api';
import { Event, Registration, User } from '../../types';
import LeftNavbarButton from '../../components/navigation/LeftNavbarButton';
import AdminDashboardCharts from '../../components/admin/AdminDashboardCharts';
import { useAppTheme } from '../../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

type AdminDashboardNavProp = NativeStackNavigationProp<AdminStackParamList, 'AdminDashboard'>;

export default function AdminDashboardScreen() {
  const { theme, isDark } = useAppTheme();
  const navigation = useNavigation<AdminDashboardNavProp>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const loadData = useCallback(async (opts?: { silent?: boolean; refresh?: boolean }) => {
    if (opts?.refresh) {
      setRefreshing(true);
    } else if (!opts?.silent) {
      setLoading(true);
    }
    try {
      const [evts, regs, usrs] = await Promise.all([
        getEvents(),
        getAllRegistrations(),
        getUsers().catch(() => [] as User[]),
      ]);
      setEvents(evts);
      setRegistrations(regs);
      setUsers(usrs);
    } catch (e) {
      console.warn('Lỗi load dashboard:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      void loadData({ silent: true });
    }, [loadData])
  );

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi quyền Quản trị viên?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  const switchToStudent = async () => {
    const result = await dispatch(switchTestAccount('student'));
    if (switchTestAccount.rejected.match(result)) {
      Alert.alert('Không thể chuyển tài khoản', result.payload as string);
    }
  };

  // Tính toán số liệu thống kê
  const totalEvents = events.length;
  const eventsWithGPS = events.filter((e) => e.coordinates?.latitude && e.coordinates?.longitude).length;
  const totalRegistrations = registrations.filter((r) => r.status !== 'cancelled').length;
  const checkedInCount = registrations.filter(
    (r) => r.status === 'checked_in' || r.status === 'completed'
  ).length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={theme.statusBarStyle} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadData({ refresh: true })}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Header Admin với Hamburger Menu Button */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
          <View style={styles.adminHeaderLeft}>
            <LeftNavbarButton tintColor={theme.textPrimary} style={styles.adminMenuBtn} />
            <View style={styles.adminInfo}>
              <Image
                source={{ uri: user?.avatarUrl || 'https://i.pravatar.cc/300?img=5' }}
                style={styles.avatar}
              />
              <View style={styles.adminText}>
                <View style={styles.roleBadgeRow}>
                  <Text style={[styles.adminName, { color: theme.textPrimary }]} numberOfLines={1}>
                    {user?.fullName || 'Ban Quản Trị'}
                  </Text>
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>ADMIN</Text>
                  </View>
                </View>
                <Text style={[styles.adminSub, { color: theme.textSecondary }]} numberOfLines={1}>
                  {user?.email} • {user?.studentId || 'AD01'}
                </Text>
                <Text style={[styles.adminFaculty, { color: theme.textTertiary }]} numberOfLines={1}>
                  {user?.faculty || 'Phòng Công tác sinh viên'}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.logoutBtn,
              { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2' },
            ]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={21} color={theme.danger} />
            <Text style={[styles.logoutText, { color: theme.danger }]}>Thoát</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.refreshBtn, { backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#FFFBEB', borderColor: '#FCD34D', marginBottom: 14 }]}
          onPress={() => void switchToStudent()}
          activeOpacity={0.8}
        >
          <View style={styles.iconTitle}>
            <Ionicons name="school-outline" size={18} color="#B45309" />
            <Text style={[styles.refreshBtnText, { color: '#B45309' }]}>Chuyển nhanh sang Sinh viên (demo)</Text>
          </View>
        </TouchableOpacity>

        {/* Title banner */}
        <View style={[styles.banner, { backgroundColor: isDark ? theme.surfaceSecondary : '#1E293B' }]}>
          <View style={[styles.iconTitle, { marginBottom: 6 }]}>
            <Ionicons name="shield-checkmark-outline" size={23} color="#FFFFFF" />
            <Text style={[styles.bannerTitle, { flex: 1, marginBottom: 0 }]}>Trung Tâm Quản Trị Sự Kiện</Text>
          </View>
          <Text style={styles.bannerDesc}>
            Quản lý địa điểm tổ chức, phân quyền sinh viên và giám sát điểm danh tự động theo khuôn viên trường.
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.surface, borderLeftColor: '#3B82F6', borderColor: theme.border, borderWidth: 1 }]}>
            <Ionicons style={styles.statIcon} name="calendar-outline" size={26} color="#3B82F6" />
            <View style={styles.statTextWrap}>
              <Text style={[styles.statNumber, { color: theme.textPrimary }]} numberOfLines={1}>
                {loading ? '...' : totalEvents}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]} numberOfLines={2}>
                Tổng sự kiện
              </Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.surface, borderLeftColor: '#10B981', borderColor: theme.border, borderWidth: 1 }]}>
            <Ionicons style={styles.statIcon} name="location-outline" size={26} color="#10B981" />
            <View style={styles.statTextWrap}>
              <Text style={[styles.statNumber, { color: theme.textPrimary }]} numberOfLines={1}>
                {loading ? '...' : `${eventsWithGPS}/${totalEvents}`}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]} numberOfLines={2}>
                Đã xác thực GPS
              </Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.surface, borderLeftColor: '#8B5CF6', borderColor: theme.border, borderWidth: 1 }]}>
            <Ionicons style={styles.statIcon} name="people-outline" size={26} color="#8B5CF6" />
            <View style={styles.statTextWrap}>
              <Text style={[styles.statNumber, { color: theme.textPrimary }]} numberOfLines={1}>
                {loading ? '...' : totalRegistrations}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]} numberOfLines={2}>
                Lượt đăng ký
              </Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.surface, borderLeftColor: '#F59E0B', borderColor: theme.border, borderWidth: 1 }]}>
            <Ionicons style={styles.statIcon} name="checkmark-circle-outline" size={26} color="#F59E0B" />
            <View style={styles.statTextWrap}>
              <Text style={[styles.statNumber, { color: theme.textPrimary }]} numberOfLines={1}>
                {loading ? '...' : checkedInCount}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]} numberOfLines={2}>
                Đã Check-in QR
              </Text>
            </View>
          </View>
        </View>

        {/* Interactive Dashboard Analytics Charts */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Biểu Đồ Phân Tích & Điều Hành
        </Text>
        <AdminDashboardCharts
          events={events}
          registrations={registrations}
          users={users}
          loading={loading}
          onSelectEventReport={(eventId) =>
            navigation.navigate('AdminCheckInReports', { eventId })
          }
          onSelectEventQr={(eventId, eventTitle) =>
            navigation.navigate('AdminQRDisplay', { eventId, eventTitle })
          }
        />

        {/* Section Actions */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Chức Năng Quản Lý Chính</Text>

        <View style={styles.actionCardsList}>
          {/* Quản lý người dùng & ĐRL */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => navigation.navigate('AdminUsers')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconBox, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#F0FDF4' }]}>
              <Ionicons name="people-outline" size={27} color="#10B981" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionCardTitle, { color: theme.textPrimary }]}>Quản Lý Người Dùng & Điểm Rèn Luyện</Text>
              <Text style={[styles.actionCardDesc, { color: theme.textSecondary }]}>
                Danh sách sinh viên, cấp/trừ ĐRL, phân quyền Admin và quản lý trạng thái tài khoản.
              </Text>
            </View>
            <Text style={[styles.arrowIcon, { color: theme.textTertiary }]}>›</Text>
          </TouchableOpacity>

          {/* 1. Quản lý sự kiện & vị trí GPS */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => navigation.navigate('AdminEvents')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconBox, { backgroundColor: isDark ? 'rgba(37,99,235,0.15)' : '#EFF6FF' }]}>
              <Ionicons name="location-outline" size={27} color="#2563EB" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionCardTitle, { color: theme.textPrimary }]}>Cài Đặt Địa Điểm Tổ Chức Sự Kiện</Text>
              <Text style={[styles.actionCardDesc, { color: theme.textSecondary }]}>
                Chọn hội trường (A, E4, Nhà thi đấu...), thiết lập khuôn viên và bán kính điểm danh cho sinh viên.
              </Text>
            </View>
            <Text style={[styles.arrowIcon, { color: theme.textTertiary }]}>›</Text>
          </TouchableOpacity>

          {/* 2. Thêm sự kiện mới */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => navigation.navigate('AdminCreateEvent')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconBox, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5' }]}>
              <Ionicons name="add-circle-outline" size={27} color="#10B981" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionCardTitle, { color: theme.textPrimary }]}>Tạo Sự Kiện Mới</Text>
              <Text style={[styles.actionCardDesc, { color: theme.textSecondary }]}>
                Nhập thông tin sự kiện, chọn địa điểm tổ chức và phát hành mã QR điểm danh.
              </Text>
            </View>
            <Text style={[styles.arrowIcon, { color: theme.textTertiary }]}>›</Text>
          </TouchableOpacity>

          {/* 3. Báo cáo điểm danh & Anti-Fake */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => navigation.navigate('AdminCheckInReports')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconBox, { backgroundColor: isDark ? 'rgba(139,92,246,0.15)' : '#F5F3FF' }]}>
              <Ionicons name="bar-chart-outline" size={27} color="#8B5CF6" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionCardTitle, { color: theme.textPrimary }]}>Báo Cáo Điểm Danh & Anti-Fake</Text>
              <Text style={[styles.actionCardDesc, { color: theme.textSecondary }]}>
                Xem danh sách sinh viên check-in, toạ độ GPS lúc quét và phát hiện vi phạm bán kính 500m.
              </Text>
            </View>
            <Text style={[styles.arrowIcon, { color: theme.textTertiary }]}>›</Text>
          </TouchableOpacity>

          {/* 4. Xem giao diện sinh viên */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() =>
              navigation.navigate('StudentPreview', {
                screen: 'MainTabs',
                params: { screen: 'Home' },
              } as any)
            }
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconBox, { backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#FFFBEB' }]}>
              <Ionicons name="school-outline" size={27} color="#F59E0B" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionCardTitle, { color: theme.textPrimary }]}>Xem Giao Diện Sinh Viên</Text>
              <Text style={[styles.actionCardDesc, { color: theme.textSecondary }]}>
                Trải nghiệm ứng dụng với vai trò sinh viên: xem chi tiết, quét QR điểm danh thực tế.
              </Text>
            </View>
            <Text style={[styles.arrowIcon, { color: theme.textTertiary }]}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.refreshBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
          onPress={() => void loadData()}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.textSecondary} />
          ) : (
            <View style={styles.iconTitle}><Ionicons name="refresh-outline" size={19} color={theme.textPrimary} /><Text style={[styles.refreshBtnText, { color: theme.textPrimary }]}>Làm mới dữ liệu hệ thống</Text></View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 16, paddingBottom: 40 },
  iconTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 12,
  },
  adminHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, gap: 10 },
  adminMenuBtn: { marginRight: 2 },
  adminInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E2E8F0' },
  adminText: { flex: 1, minWidth: 0 },
  roleBadgeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  adminName: { fontSize: 16, fontWeight: '700', color: '#0F172A', flexShrink: 1 },
  adminBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adminBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  adminSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  adminFaculty: { fontSize: 11, color: '#94A3B8' },
  logoutBtn: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    flexShrink: 0,
    marginLeft: 8,
  },
  logoutIcon: { fontSize: 18 },
  logoutText: { fontSize: 11, color: '#DC2626', fontWeight: '700', marginTop: 2 },
  banner: {
    backgroundColor: '#1E293B',
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
  },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  bannerDesc: { fontSize: 13, color: '#94A3B8', lineHeight: 19 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  statCard: {
    flexBasis: '46%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  statTextWrap: { flex: 1, minWidth: 0 },
  statIcon: { fontSize: 24 },
  statNumber: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    marginTop: 4,
  },
  actionCardsList: { gap: 12, marginBottom: 20 },
  actionCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardIcon: { fontSize: 22 },
  actionContent: { flex: 1 },
  actionCardTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  actionCardDesc: { fontSize: 12, color: '#64748B', lineHeight: 17 },
  arrowIcon: { fontSize: 20, color: '#94A3B8', fontWeight: 'bold' },
  refreshBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  refreshBtnText: { color: '#475569', fontSize: 13, fontWeight: '600' },
});
