import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDrawer } from '../../context/DrawerContext';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout, updateUser } from '../../features/auth/authSlice';
import { selectUnreadCount } from '../../features/notifications/notificationsSlice';
import { navigate } from '../../navigation/navigationRef';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 320);

interface MenuItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  badge?: number | string;
  badgeColor?: string;
  highlight?: boolean;
  onPress: () => void;
}

const DrawerMenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  badge,
  badgeColor = '#EF4444',
  highlight = false,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.menuItem, highlight && styles.menuItemHighlight]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconBox, highlight && styles.menuIconBoxHighlight]}>
        <Text style={styles.menuIcon}>{icon}</Text>
      </View>
      <View style={styles.menuTextBox}>
        <Text style={[styles.menuTitle, highlight && styles.menuTitleHighlight]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.menuSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {badge !== undefined && badge !== null && (
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
};

export default function LeftNavbarDrawer() {
  const { isOpen, closeDrawer } = useDrawer();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  const user = useAppSelector((s) => s.auth.user);
  const unreadCount = useAppSelector(selectUnreadCount);

  // Animated value điều khiển trượt từ lề trái
  const animProgress = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
      Animated.timing(animProgress, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animProgress, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setModalVisible(false);
      });
    }
  }, [isOpen, animProgress]);

  const handleClose = () => {
    closeDrawer();
  };

  const handleNavigate = (screenName: string, params?: any) => {
    closeDrawer();
    // Đợi hiệu ứng trượt kết thúc nhẹ nhàng rồi điều hướng
    setTimeout(() => {
      navigate(screenName, params);
    }, 220);
  };

  const handleToggleRole = () => {
    const nextRole = user?.role === 'admin' ? 'student' : 'admin';
    const roleLabel = nextRole === 'admin' ? 'Quản trị viên' : 'Sinh viên';

    Alert.alert(
      'Chuyển đổi vai trò Demo',
      `Bạn có muốn chuyển đổi sang giao diện: ${roleLabel}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Chuyển đổi ngay',
          style: 'default',
          onPress: () => {
            dispatch(updateUser({ role: nextRole }));
            closeDrawer();
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          closeDrawer();
          dispatch(logout());
        },
      },
    ]);
  };

  if (!modalVisible) return null;

  const translateX = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_WIDTH, 0],
  });

  const backdropOpacity = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const isAdmin = user?.role === 'admin';
  const userName = user?.fullName || (isAdmin ? 'Ban Quản Trị' : 'Sinh viên IUH');
  const userRoleText = isAdmin ? '🛡️ BAN QUẢN TRỊ ADMIN' : '🎓 SINH VIÊN CHÍNH QUY';
  const userPoint = user?.point ?? 85;

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Lớp nền mờ tối có thể bấm để đóng */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            activeOpacity={1}
          />
        </Animated.View>

        {/* Thanh Navbar / Drawer bên trái trượt ra */}
        <Animated.View
          style={[
            styles.drawerContent,
            {
              width: DRAWER_WIDTH,
              transform: [{ translateX }],
            },
          ]}
        >
          {/* Header Thông tin Người dùng & Trường IUH */}
          <View style={[styles.header, { paddingTop: Math.max(insets.top, 24) + 12 }]}>
            <View style={styles.schoolBadgeRow}>
              <View style={styles.schoolTag}>
                <Text style={styles.schoolIcon}>🏛️</Text>
                <Text style={styles.schoolName}>ĐH CÔNG NGHIỆP TP.HCM</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Profile Avatar & Tên */}
            <View style={styles.profileBox}>
              <View style={styles.avatarWrapper}>
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>
                      {userName ? userName.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
                <View style={styles.onlineDot} />
              </View>

              <View style={styles.profileTextWrapper}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {userName}
                </Text>
                <View
                  style={[
                    styles.roleBadge,
                    isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeStudent,
                  ]}
                >
                  <Text
                    style={[
                      styles.roleBadgeText,
                      isAdmin ? styles.roleBadgeTextAdmin : styles.roleBadgeTextStudent,
                    ]}
                  >
                    {userRoleText}
                  </Text>
                </View>
                <Text style={styles.profileSub} numberOfLines={1}>
                  MSSV: {user?.studentId || (isAdmin ? 'QTV-01' : '21008921')}
                </Text>
                <Text style={styles.facultySub} numberOfLines={1}>
                  {user?.faculty || 'Khoa Công Nghệ Thông Tin'}
                </Text>
              </View>
            </View>

            {/* Mini KPI Card: Điểm rèn luyện hoặc Chế độ Quản trị */}
            <View style={isAdmin ? styles.kpiCardAdmin : styles.kpiCardStudent}>
              {isAdmin ? (
                <View style={styles.kpiRow}>
                  <Text style={styles.kpiIcon}>🛡️</Text>
                  <View style={styles.kpiTextGroup}>
                    <Text style={styles.kpiTitleAdmin}>Hệ thống Anti-Fake GPS</Text>
                    <Text style={styles.kpiSubtitleAdmin}>Radar Geofence: Đang hoạt động</Text>
                  </View>
                  <View style={styles.kpiActiveDot} />
                </View>
              ) : (
                <View style={styles.kpiRow}>
                  <Text style={styles.kpiIcon}>⭐</Text>
                  <View style={styles.kpiTextGroup}>
                    <Text style={styles.kpiTitleStudent}>Điểm rèn luyện: {userPoint} / 100 ĐRL</Text>
                    <Text style={styles.kpiSubtitleStudent}>Xếp loại: Xuất sắc • Đạt chuẩn học bổng</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Danh mục Menu Điều Hướng */}
          <ScrollView
            style={styles.menuScroll}
            contentContainerStyle={[
              styles.menuScrollContent,
              { paddingBottom: Math.max(insets.bottom, 20) + 16 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Nhóm Sinh viên & Sự kiện */}
            <View style={styles.menuSection}>
              <Text style={styles.sectionHeader}>TIỆN ÍCH SINH VIÊN</Text>

              <DrawerMenuItem
                icon="🏠"
                title="Trang chủ Sự kiện"
                subtitle="Xem danh sách & tìm kiếm sự kiện"
                onPress={() => handleNavigate(isAdmin ? 'StudentPreview' : 'Home')}
              />

              <DrawerMenuItem
                icon="📷"
                title="Quét QR Check-in"
                subtitle="Điểm danh xác thực tại hội trường"
                highlight
                badge="HOT"
                badgeColor="#2563EB"
                onPress={() => handleNavigate('CheckIn')}
              />

              <DrawerMenuItem
                icon="📅"
                title="Lịch trình & Vé của tôi"
                subtitle="Xem vé QR cá nhân & giờ diễn ra"
                onPress={() => handleNavigate('MySchedule')}
              />

              <DrawerMenuItem
                icon="🔔"
                title="Thông báo & Lời nhắc"
                subtitle="Nhắc nhở sự kiện sắp bắt đầu"
                badge={unreadCount > 0 ? unreadCount : undefined}
                badgeColor="#EF4444"
                onPress={() => handleNavigate('Notification')}
              />

              <DrawerMenuItem
                icon="👤"
                title="Hồ sơ & Sổ tay ĐRL"
                subtitle="Xem điểm rèn luyện & lịch sử"
                onPress={() => handleNavigate('Profile')}
              />

              <DrawerMenuItem
                icon="💬"
                title="Góp ý & Phản hồi"
                subtitle="Đánh giá chất lượng sau sự kiện"
                onPress={() => handleNavigate('Feedback')}
              />
            </View>

            {/* Nhóm Quản trị Viên */}
            <View style={styles.menuSection}>
              <Text style={styles.sectionHeader}>CỔNG QUẢN TRỊ VIÊN (ADMIN)</Text>

              {isAdmin ? (
                <>
                  <DrawerMenuItem
                    icon="📊"
                    title="Dashboard Quản trị"
                    subtitle="KPI điểm danh & tổng quan sự kiện"
                    onPress={() => handleNavigate('AdminDashboard')}
                  />

                  <DrawerMenuItem
                    icon="📍"
                    title="Quản lý Địa điểm Tổ chức"
                    subtitle="Chọn hội trường & phạm vi điểm danh"
                    onPress={() => handleNavigate('AdminEvents')}
                  />

                  <DrawerMenuItem
                    icon="➕"
                    title="Tạo Sự kiện Mới"
                    subtitle="Đăng bài & cấu hình check-in"
                    onPress={() => handleNavigate('AdminCreateEvent')}
                  />

                  <DrawerMenuItem
                    icon="📋"
                    title="Báo cáo Điểm danh"
                    subtitle="Duyệt Anti-fake & điểm danh bù"
                    onPress={() => handleNavigate('AdminCheckInReports')}
                  />

                  <DrawerMenuItem
                    icon="📺"
                    title="Trình chiếu QR Code"
                    subtitle="Mở mã QR toàn màn hình hội trường"
                    onPress={() =>
                      handleNavigate('AdminQRDisplay', {
                        eventId: 'evt-001',
                        eventTitle: 'Sự kiện Hội trường IUH',
                      })
                    }
                  />
                </>
              ) : (
                <View style={styles.adminLockedBox}>
                  <Text style={styles.adminLockedText}>
                    🔒 Đang đăng nhập tài khoản Sinh viên. Bạn có thể bấm nút chuyển đổi bên dưới để trải nghiệm phân hệ Quản trị.
                  </Text>
                </View>
              )}
            </View>

            {/* Nhóm Tiện ích Hệ Thống & Chuyển đổi vai trò */}
            <View style={styles.menuSection}>
              <Text style={styles.sectionHeader}>HỆ THỐNG & ĐIỀU KHIỂN</Text>

              {/* Nút Demo Chuyển đổi vai trò */}
              <TouchableOpacity
                style={styles.roleSwitchBtn}
                onPress={handleToggleRole}
                activeOpacity={0.8}
              >
                <Text style={styles.roleSwitchIcon}>🔄</Text>
                <View style={styles.roleSwitchTextBox}>
                  <Text style={styles.roleSwitchTitle}>
                    {isAdmin ? 'Chuyển sang Sinh viên' : 'Chuyển sang Quản trị viên'}
                  </Text>
                  <Text style={styles.roleSwitchSubtitle}>
                    Chuyển đổi giao diện tức thì (Dành cho Demo)
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Nút Đăng xuất */}
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutIcon}>🚪</Text>
                <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
              </TouchableOpacity>
            </View>

            {/* Footer bản quyền */}
            <View style={styles.footer}>
              <Text style={styles.footerApp}>EventMate IUH • Version 1.2.0</Text>
              <Text style={styles.footerCopy}>© 2026 Trường ĐH Công Nghiệp TP.HCM</Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0F172A',
  },
  drawerContent: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    ...Shadow.lg,
    elevation: 20,
    zIndex: 9999,
  },
  header: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomRightRadius: 20,
  },
  schoolBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  schoolTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  schoolIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  schoolName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E0E7FF',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  profileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#1E3A8A',
  },
  profileTextWrapper: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  roleBadgeStudent: {
    backgroundColor: '#059669',
  },
  roleBadgeAdmin: {
    backgroundColor: '#DC2626',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  roleBadgeTextStudent: {
    color: '#ECFDF5',
  },
  roleBadgeTextAdmin: {
    color: '#FEF2F2',
  },
  profileSub: {
    fontSize: 11,
    color: '#BFDBFE',
    fontWeight: '500',
  },
  facultySub: {
    fontSize: 11,
    color: '#93C5FD',
  },
  kpiCardStudent: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  kpiCardAdmin: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kpiIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  kpiTextGroup: {
    flex: 1,
  },
  kpiTitleStudent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FEF08A',
  },
  kpiSubtitleStudent: {
    fontSize: 10,
    color: '#E0E7FF',
    marginTop: 1,
  },
  kpiTitleAdmin: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F87171',
  },
  kpiSubtitleAdmin: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  kpiActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  menuScroll: {
    flex: 1,
  },
  menuScrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  menuSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
  },
  menuItemHighlight: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  menuIconBoxHighlight: {
    backgroundColor: '#DBEAFE',
  },
  menuIcon: {
    fontSize: 16,
  },
  menuTextBox: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  menuTitleHighlight: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  menuSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chevron: {
    fontSize: 18,
    color: '#CBD5E1',
    fontWeight: '300',
    marginLeft: 2,
  },
  adminLockedBox: {
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  adminLockedText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  roleSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  roleSwitchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  roleSwitchTextBox: {
    flex: 1,
  },
  roleSwitchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  roleSwitchSubtitle: {
    fontSize: 10.5,
    color: '#15803D',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 11,
  },
  logoutIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 8,
  },
  footerApp: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  footerCopy: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
});
