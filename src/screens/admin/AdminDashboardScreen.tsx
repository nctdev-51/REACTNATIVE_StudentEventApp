import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../features/auth/authSlice';
import { getEvents, getAllRegistrations } from '../../services/api';
import { Event, Registration } from '../../types';
import { Colors } from '../../theme';

type AdminDashboardNavProp = NativeStackNavigationProp<AdminStackParamList, 'AdminDashboard'>;

export default function AdminDashboardScreen() {
  const navigation = useNavigation<AdminDashboardNavProp>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [evts, regs] = await Promise.all([
        getEvents(),
        getAllRegistrations(),
      ]);
      setEvents(evts);
      setRegistrations(regs);
    } catch (e) {
      console.warn('Lỗi load dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  // Tính toán số liệu thống kê
  const totalEvents = events.length;
  const eventsWithGPS = events.filter((e) => e.coordinates?.latitude && e.coordinates?.longitude).length;
  const totalRegistrations = registrations.length;
  const checkedInCount = registrations.filter((r) => r.status === 'checked_in').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header Admin */}
        <View style={styles.header}>
          <View style={styles.adminInfo}>
            <Image
              source={{ uri: user?.avatarUrl || 'https://i.pravatar.cc/300?img=5' }}
              style={styles.avatar}
            />
            <View style={styles.adminText}>
              <View style={styles.roleBadgeRow}>
                <Text style={styles.adminName}>{user?.fullName || 'Ban Quản Trị'}</Text>
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>ADMIN</Text>
                </View>
              </View>
              <Text style={styles.adminSub}>{user?.email} • {user?.studentId || 'AD01'}</Text>
              <Text style={styles.adminFaculty}>{user?.faculty || 'Phòng Công tác sinh viên'}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Thoát</Text>
          </TouchableOpacity>
        </View>

        {/* Title banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>🛡️ Trung Tâm Quản Trị Sự Kiện</Text>
          <Text style={styles.bannerDesc}>
            Quản lý toạ độ GPS Anti-Fake, khởi tạo sự kiện và giám sát điểm danh sinh viên trong bán kính 500m.
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: '#3B82F6' }]}>
            <Text style={styles.statIcon}>📅</Text>
            <View>
              <Text style={styles.statNumber}>{loading ? '...' : totalEvents}</Text>
              <Text style={styles.statLabel}>Tổng sự kiện</Text>
            </View>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
            <Text style={styles.statIcon}>📍</Text>
            <View>
              <Text style={styles.statNumber}>
                {loading ? '...' : `${eventsWithGPS}/${totalEvents}`}
              </Text>
              <Text style={styles.statLabel}>Đã cài GPS Anti-Fake</Text>
            </View>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#8B5CF6' }]}>
            <Text style={styles.statIcon}>👥</Text>
            <View>
              <Text style={styles.statNumber}>{loading ? '...' : totalRegistrations}</Text>
              <Text style={styles.statLabel}>Lượt đăng ký</Text>
            </View>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
            <Text style={styles.statIcon}>🎯</Text>
            <View>
              <Text style={styles.statNumber}>{loading ? '...' : checkedInCount}</Text>
              <Text style={styles.statLabel}>Đã Check-in QR</Text>
            </View>
          </View>
        </View>

        {/* Section Actions */}
        <Text style={styles.sectionTitle}>Chức Năng Quản Lý Chính</Text>

        <View style={styles.actionCardsList}>
          {/* 1. Quản lý sự kiện & vị trí GPS */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AdminEvents')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Text style={styles.actionCardIcon}>📍</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionCardTitle}>Cài Đặt Vị Trí & Toạ Độ GPS</Text>
              <Text style={styles.actionCardDesc}>
                Tìm kiếm địa chỉ bằng text (Forward Geocoding), đối soát Google Maps và gán toạ độ sự kiện.
              </Text>
            </View>
            <Text style={styles.arrowIcon}>chevron-right ›</Text>
          </TouchableOpacity>

          {/* 2. Thêm sự kiện mới */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AdminCreateEvent')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Text style={styles.actionCardIcon}>➕</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionCardTitle}>Tạo Sự Kiện Mới</Text>
              <Text style={styles.actionCardDesc}>
                Nhập thông tin sự kiện, tự động tìm toạ độ địa điểm và phát hành mã QR điểm danh.
              </Text>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>

          {/* 3. Báo cáo điểm danh & Anti-Fake */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AdminCheckInReports')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#F5F3FF' }]}>
              <Text style={styles.actionCardIcon}>📊</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionCardTitle}>Báo Cáo Điểm Danh & Anti-Fake</Text>
              <Text style={styles.actionCardDesc}>
                Xem danh sách sinh viên check-in, toạ độ GPS lúc quét và phát hiện vi phạm bán kính 500m.
              </Text>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>

          {/* 4. Xem giao diện sinh viên */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('StudentPreview', { screen: 'Home' } as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FFFBEB' }]}>
              <Text style={styles.actionCardIcon}>👨‍🎓</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionCardTitle}>Xem Giao Diện Sinh Viên</Text>
              <Text style={styles.actionCardDesc}>
                Trải nghiệm ứng dụng với vai trò sinh viên: xem chi tiết, quét QR điểm danh thực tế.
              </Text>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={loadData} activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator size="small" color="#4B5563" />
          ) : (
            <Text style={styles.refreshBtnText}>🔄 Làm mới dữ liệu hệ thống</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 16, paddingBottom: 40 },
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
    marginBottom: 16,
  },
  adminInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E2E8F0' },
  adminText: { flex: 1 },
  roleBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adminName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
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
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
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

