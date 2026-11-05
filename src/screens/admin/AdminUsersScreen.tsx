import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../navigation/types';
import LeftNavbarButton from '../../components/navigation/LeftNavbarButton';
import {
  getUsers,
  adminUpdateUser,
  adminCreateUser,
  adminDeleteUser,
} from '../../services/api';
import { User, CreateUserPayload } from '../../types';
import { Colors, Shadow, Spacing, Typography, BorderRadius } from '../../theme';
import { useAppTheme } from '../../theme/ThemeContext';

type AdminUsersNavProp = NativeStackNavigationProp<AdminStackParamList, 'AdminUsers'>;

const FILTER_ROLES = ['Tất cả', 'Sinh viên', 'Admin', 'Đang hoạt động', 'Bị tạm khoá'];

const FACULTIES = [
  'Khoa Công nghệ thông tin',
  'Khoa Quản trị kinh doanh',
  'Khoa Kinh tế',
  'Khoa Điện - Điện tử',
  'Khoa Cơ khí',
  'Khoa Ngoại ngữ',
  'Phòng Công tác sinh viên',
];

export default function AdminUsersScreen() {
  const { theme, isDark } = useAppTheme();
  const navigation = useNavigation<AdminUsersNavProp>();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tất cả');

  // Modal Điều chỉnh Điểm Rèn Luyện
  const [selectedUserForPoint, setSelectedUserForPoint] = useState<User | null>(null);
  const [pointDelta, setPointDelta] = useState<string>('5');
  const [pointReason, setPointReason] = useState<string>('Tham gia tích cực sự kiện trường');
  const [updatingPoint, setUpdatingPoint] = useState(false);

  // Modal Thêm Thành Viên Mới
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [newFaculty, setNewFaculty] = useState(FACULTIES[0]);
  const [newRole, setNewRole] = useState<'student' | 'admin'>('student');
  const [newInitialPoint, setNewInitialPoint] = useState('80');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e) {
      console.warn('Lỗi tải danh sách người dùng:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Lọc và tìm kiếm danh sách người dùng
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Tìm kiếm theo tên, MSSV, email
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        u.fullName?.toLowerCase().includes(query) ||
        u.studentId?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // Lọc theo tabs
      if (activeFilter === 'Sinh viên') return u.role === 'student';
      if (activeFilter === 'Admin') return u.role === 'admin';
      if (activeFilter === 'Đang hoạt động') return u.status !== 'inactive';
      if (activeFilter === 'Bị tạm khoá') return u.status === 'inactive';

      return true;
    });
  }, [users, searchQuery, activeFilter]);

  // Thống kê nhanh
  const totalCount = users.length;
  const studentCount = users.filter((u) => u.role === 'student').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const activeCount = users.filter((u) => u.status !== 'inactive').length;

  // Xử lý Thay đổi Điểm Rèn Luyện (ĐRL)
  const handleOpenPointModal = (u: User) => {
    setSelectedUserForPoint(u);
    setPointDelta('5');
    setPointReason('Cộng điểm phong trào Đoàn - Hội');
  };

  const handleConfirmUpdatePoint = async (isDeduct: boolean = false) => {
    if (!selectedUserForPoint) return;
    const delta = parseInt(pointDelta, 10);
    if (isNaN(delta) || delta <= 0) {
      Alert.alert('Không hợp lệ', 'Vui lòng nhập số điểm hợp lệ lớn hơn 0.');
      return;
    }

    const currentPt = selectedUserForPoint.point ?? 0;
    const finalDelta = isDeduct ? -delta : delta;
    const newPoint = Math.max(0, Math.min(100, currentPt + finalDelta));

    setUpdatingPoint(true);
    try {
      const updated = await adminUpdateUser(selectedUserForPoint._id, {
        point: newPoint,
      });

      setUsers((prev) =>
        prev.map((u) => (u._id === selectedUserForPoint._id ? { ...u, point: newPoint } : u))
      );

      Alert.alert(
        'Cập nhật thành công',
        `${isDeduct ? 'Trừ' : 'Cộng'} ${delta} ĐRL cho sinh viên ${selectedUserForPoint.fullName}.\nĐiểm mới: ${newPoint}/100 ĐRL.`
      );
      setSelectedUserForPoint(null);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể cập nhật điểm rèn luyện.');
    } finally {
      setUpdatingPoint(false);
    }
  };

  // Xử lý Đổi vai trò Sinh viên <-> Admin
  const handleToggleRole = (u: User) => {
    const nextRole: 'student' | 'admin' = u.role === 'admin' ? 'student' : 'admin';
    const roleLabel = nextRole === 'admin' ? 'QUẢN TRỊ VIÊN' : 'SINH VIÊN';

    Alert.alert(
      'Phân quyền tài khoản',
      `Bạn có chắc chắn muốn chuyển tài khoản ${u.fullName} (${u.studentId}) sang vai trò: ${roleLabel}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận chuyển',
          onPress: async () => {
            try {
              await adminUpdateUser(u._id, { role: nextRole });
              setUsers((prev) =>
                prev.map((item) => (item._id === u._id ? { ...item, role: nextRole } : item))
              );
              Alert.alert('Thành công', `Đã chuyển tài khoản sang quyền ${roleLabel}.`);
            } catch (err: any) {
              Alert.alert('Lỗi', 'Không thể thay đổi quyền.');
            }
          },
        },
      ]
    );
  };

  // Xử lý Khoá / Mở khoá tài khoản
  const handleToggleStatus = (u: User) => {
    const isCurrentlyInactive = u.status === 'inactive';
    const nextStatus: 'active' | 'inactive' = isCurrentlyInactive ? 'active' : 'inactive';
    const actionLabel = isCurrentlyInactive ? 'MỞ KHOÁ' : 'TẠM KHOÁ';

    Alert.alert(
      `${actionLabel} tài khoản`,
      `Bạn có muốn ${actionLabel.toLowerCase()} tài khoản của ${u.fullName} không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Thực hiện',
          style: isCurrentlyInactive ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await adminUpdateUser(u._id, { status: nextStatus, isActive: nextStatus === 'active' });
              setUsers((prev) =>
                prev.map((item) =>
                  item._id === u._id ? { ...item, status: nextStatus, isActive: nextStatus === 'active' } : item
                )
              );
              Alert.alert('Thành công', `Tài khoản đã được ${actionLabel.toLowerCase()}.`);
            } catch (err: any) {
              Alert.alert('Lỗi', 'Không thể đổi trạng thái tài khoản.');
            }
          },
        },
      ]
    );
  };

  // Xoá tài khoản
  const handleDeleteUser = (u: User) => {
    Alert.alert(
      'Xoá tài khoản',
      `Hành động này sẽ xoá hoàn toàn tài khoản ${u.fullName} khỏi hệ thống. Bạn có chắc không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xoá vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminDeleteUser(u._id);
              setUsers((prev) => prev.filter((item) => item._id !== u._id));
              Alert.alert('Đã xoá', 'Tài khoản đã được xoá thành công.');
            } catch (err: any) {
              Alert.alert('Lỗi', 'Không thể xoá tài khoản.');
            }
          },
        },
      ]
    );
  };

  // Thêm thành viên mới
  const handleCreateUser = async () => {
    if (!newFullName.trim() || !newStudentId.trim() || !newEmail.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập Họ tên, MSSV và Email.');
      return;
    }

    setCreatingUser(true);
    try {
      const payload: CreateUserPayload = {
        fullName: newFullName.trim(),
        studentId: newStudentId.trim().toUpperCase(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        faculty: newFaculty,
        role: newRole,
        point: parseInt(newInitialPoint, 10) || 80,
      };

      const created = await adminCreateUser(payload);
      setUsers((prev) => [created, ...prev]);

      Alert.alert(
        'Tạo thành công',
        `Đã tạo tài khoản cho ${created.fullName} (${created.studentId}).`
      );
      setCreateModalVisible(false);

      // Reset form
      setNewFullName('');
      setNewStudentId('');
      setNewEmail('');
      setNewInitialPoint('80');
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể tạo tài khoản mới.');
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={theme.statusBarStyle} />
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeftGroup}>
          <LeftNavbarButton tintColor={theme.textPrimary} />
          <View style={styles.headerTitleBox}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Quản Lý Người Dùng & ĐRL</Text>
            <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Hệ thống danh sách sinh viên & cán bộ IUH</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={() => setCreateModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnIcon}>➕</Text>
          <Text style={styles.addBtnText}>Thêm</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── KPI Stats Grid ──────────────────────────────────────────────────── */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderLeftColor: '#3B82F6' }]}>
            <Text style={styles.kpiIcon}>👥</Text>
            <View>
              <Text style={[styles.kpiValue, { color: theme.textPrimary }]}>{loading ? '...' : totalCount}</Text>
              <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>Tổng tài khoản</Text>
            </View>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderLeftColor: '#10B981' }]}>
            <Text style={styles.kpiIcon}>🎓</Text>
            <View>
              <Text style={[styles.kpiValue, { color: theme.textPrimary }]}>{loading ? '...' : studentCount}</Text>
              <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>Sinh viên</Text>
            </View>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderLeftColor: '#EF4444' }]}>
            <Text style={styles.kpiIcon}>🛡️</Text>
            <View>
              <Text style={[styles.kpiValue, { color: theme.textPrimary }]}>{loading ? '...' : adminCount}</Text>
              <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>Quản trị viên</Text>
            </View>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderLeftColor: '#F59E0B' }]}>
            <Text style={styles.kpiIcon}>🟢</Text>
            <View>
              <Text style={[styles.kpiValue, { color: theme.textPrimary }]}>{loading ? '...' : activeCount}</Text>
              <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>Hoạt động</Text>
            </View>
          </View>
        </View>

        {/* ── Search Bar ──────────────────────────────────────────────────────── */}
        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Tìm theo Họ tên, MSSV hoặc Email..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Filter Chips ────────────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTER_ROLES.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? theme.primary : theme.surface,
                    borderColor: isActive ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isActive ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Section Title & Count ───────────────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Danh sách ({filteredUsers.length} người)
          </Text>
          <TouchableOpacity onPress={loadData} activeOpacity={0.7}>
            <Text style={[styles.reloadText, { color: theme.primary }]}>🔄 Làm mới</Text>
          </TouchableOpacity>
        </View>

        {/* ── Users List ──────────────────────────────────────────────────────── */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Đang tải danh sách người dùng...</Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Không tìm thấy tài khoản nào</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc hiện tại.
            </Text>
          </View>
        ) : (
          filteredUsers.map((u) => {
            const isAdmin = u.role === 'admin';
            const isInactive = u.status === 'inactive';
            const point = u.point ?? 0;
            const rankText =
              point >= 90
                ? 'Xuất sắc'
                : point >= 80
                ? 'Tốt'
                : point >= 65
                ? 'Khá'
                : 'Trung bình';

            return (
              <View
                key={u._id}
                style={[
                  styles.userCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  isInactive && styles.userCardInactive,
                ]}
              >
                {/* User Top Row */}
                <View style={styles.userMainRow}>
                  <Image
                    source={{
                      uri:
                        u.avatarUrl ||
                        `https://i.pravatar.cc/300?u=${u.studentId || u._id}`,
                    }}
                    style={styles.userAvatar}
                  />

                  <View style={styles.userMeta}>
                    <View style={styles.userNameRow}>
                      <Text style={[styles.userName, { color: theme.textPrimary }]} numberOfLines={1}>
                        {u.fullName || 'Người dùng'}
                      </Text>
                      <View
                        style={[
                          styles.badgeRole,
                          isAdmin ? styles.badgeAdmin : styles.badgeStudent,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeRoleText,
                            isAdmin ? styles.badgeTextAdmin : styles.badgeTextStudent,
                          ]}
                        >
                          {isAdmin ? 'ADMIN' : 'SINH VIÊN'}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.userMSSV, { color: theme.textSecondary }]}>
                      MSSV: {u.studentId || 'Chưa cập nhật'} • {u.email}
                    </Text>
                    <Text style={[styles.userFaculty, { color: theme.textTertiary }]} numberOfLines={1}>
                      {u.faculty || 'Khoa Công nghệ thông tin'}
                    </Text>
                  </View>
                </View>

                {/* Score & Status Bar */}
                <View style={[styles.scoreBar, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                  <View style={styles.pointGroup}>
                    <Text style={styles.pointIcon}>⭐</Text>
                    <Text style={[styles.pointValue, { color: theme.textPrimary }]}>{point} ĐRL</Text>
                    <Text style={styles.pointRank}>({rankText})</Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      isInactive ? styles.statusPillInactive : styles.statusPillActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        isInactive ? styles.statusDotInactive : styles.statusDotActive,
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusPillText,
                        isInactive ? styles.statusTextInactive : styles.statusTextActive,
                      ]}
                    >
                      {isInactive ? 'Bị tạm khoá' : 'Đang hoạt động'}
                    </Text>
                  </View>
                </View>

                {/* Quick Action Buttons */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtnPoint, { backgroundColor: isDark ? 'rgba(37,99,235,0.2)' : '#EFF6FF', borderColor: isDark ? '#3B82F6' : '#BFDBFE' }]}
                    onPress={() => handleOpenPointModal(u)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.actionBtnTextPoint, { color: theme.primary }]}>⭐ Sửa ĐRL</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtnRole, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                    onPress={() => handleToggleRole(u)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.actionBtnTextRole, { color: theme.textPrimary }]}>
                      {isAdmin ? '⬇️ Xuống SV' : '⬆️ Lên Admin'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionBtnStatus,
                      isInactive && styles.actionBtnStatusUnlock,
                    ]}
                    onPress={() => handleToggleStatus(u)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.actionBtnTextStatus,
                        isInactive && styles.actionBtnTextUnlock,
                      ]}
                    >
                      {isInactive ? '🔓 Mở' : '🔒 Khoá'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtnDelete, { backgroundColor: theme.surfaceSecondary }]}
                    onPress={() => handleDeleteUser(u)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnTextDelete}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Modal 1: Điều chỉnh Điểm Rèn Luyện (ĐRL) ────────────────────────── */}
      <Modal
        visible={!!selectedUserForPoint}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedUserForPoint(null)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.modalCard, { backgroundColor: theme.surface }]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⭐ Điều Chỉnh Điểm Rèn Luyện</Text>
              <TouchableOpacity onPress={() => setSelectedUserForPoint(null)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedUserForPoint && (
              <View style={styles.pointModalBody}>
                <Text style={[styles.pointModalUserName, { color: theme.textPrimary }]}>
                  Sinh viên: {selectedUserForPoint.fullName} ({selectedUserForPoint.studentId})
                </Text>
                <Text style={[styles.pointModalCurrent, { color: theme.textSecondary }]}>
                  Điểm hiện tại: <Text style={styles.pointHighlight}>{selectedUserForPoint.point ?? 0} ĐRL</Text> / 100
                </Text>

                <Text style={[styles.modalInputLabel, { color: theme.textSecondary }]}>Số điểm điều chỉnh:</Text>
                <View style={styles.pointQuickChipsRow}>
                  {['5', '10', '15', '20'].map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.pointQuickChip,
                        {
                          backgroundColor: pointDelta === val ? theme.primary : theme.surfaceSecondary,
                          borderColor: pointDelta === val ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={() => setPointDelta(val)}
                    >
                      <Text
                        style={[
                          styles.pointQuickChipText,
                          { color: pointDelta === val ? '#FFFFFF' : theme.textSecondary },
                        ]}
                      >
                        ±{val}đ
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={[
                    styles.pointInput,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.textPrimary,
                    },
                  ]}
                  keyboardType="numeric"
                  value={pointDelta}
                  onChangeText={setPointDelta}
                  placeholder="Nhập số điểm cần cộng hoặc trừ..."
                  placeholderTextColor={theme.textTertiary}
                />

                <Text style={[styles.modalInputLabel, { color: theme.textSecondary }]}>Lý do điều chỉnh (Minh chứng):</Text>
                <TextInput
                  style={[
                    styles.reasonInput,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.textPrimary,
                    },
                  ]}
                  value={pointReason}
                  onChangeText={setPointReason}
                  placeholder="Ví dụ: Tham gia hoạt động tình nguyện hè..."
                  placeholderTextColor={theme.textTertiary}
                />

                <View style={styles.pointModalButtonsRow}>
                  <TouchableOpacity
                    style={[styles.pointSubmitBtn, styles.pointDeductBtn]}
                    onPress={() => handleConfirmUpdatePoint(true)}
                    disabled={updatingPoint}
                  >
                    <Text style={styles.pointSubmitText}>➖ Trừ Điểm</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.pointSubmitBtn, styles.pointAddBtn]}
                    onPress={() => handleConfirmUpdatePoint(false)}
                    disabled={updatingPoint}
                  >
                    {updatingPoint ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.pointSubmitText}>➕ Cộng Điểm</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Modal 2: Thêm Người Dùng / Sinh Viên Mới ─────────────────────────── */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.modalCard, { backgroundColor: theme.surface, maxHeight: '90%' }]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>👤 Thêm Tài Khoản Mới</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 16 }}>
              <Text style={[styles.modalInputLabel, { color: theme.textSecondary }]}>Họ và tên *</Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="Ví dụ: Nguyễn Văn Bảo"
                placeholderTextColor={theme.textTertiary}
                value={newFullName}
                onChangeText={setNewFullName}
              />

              <Text style={[styles.modalInputLabel, { color: theme.textSecondary }]}>Mã số sinh viên (MSSV) / Mã QTV *</Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="Ví dụ: 21008921 hoặc AD02"
                placeholderTextColor={theme.textTertiary}
                value={newStudentId}
                onChangeText={setNewStudentId}
                autoCapitalize="characters"
              />

              <Text style={[styles.modalInputLabel, { color: theme.textSecondary }]}>Email tài khoản *</Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="Ví dụ: sv.bao@iuh.edu.vn"
                placeholderTextColor={theme.textTertiary}
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={[styles.modalInputLabel, { color: theme.textSecondary }]}>Mật khẩu khởi tạo</Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="Mặc định: 123456"
                placeholderTextColor={theme.textTertiary}
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <Text style={[styles.modalInputLabel, { color: theme.textSecondary }]}>Vai trò hệ thống</Text>
              <View style={styles.rolePickerRow}>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    {
                      backgroundColor: newRole === 'student' ? (isDark ? 'rgba(37,99,235,0.2)' : '#EFF6FF') : theme.surfaceSecondary,
                      borderColor: newRole === 'student' ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setNewRole('student')}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      { color: newRole === 'student' ? theme.primary : theme.textSecondary },
                    ]}
                  >
                    🎓 Sinh viên
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    {
                      backgroundColor: newRole === 'admin' ? (isDark ? 'rgba(239,68,68,0.2)' : '#FEF2F2') : theme.surfaceSecondary,
                      borderColor: newRole === 'admin' ? theme.danger : theme.border,
                    },
                  ]}
                  onPress={() => setNewRole('admin')}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      { color: newRole === 'admin' ? theme.danger : theme.textSecondary },
                    ]}
                  >
                    🛡️ Quản trị viên
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalInputLabel, { color: theme.textSecondary }]}>Khoa / Phòng ban</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 12 }}
              >
                {FACULTIES.map((fac) => (
                  <TouchableOpacity
                    key={fac}
                    style={[
                      styles.facultyChip,
                      {
                        backgroundColor: newFaculty === fac ? theme.primary : theme.surfaceSecondary,
                        borderColor: newFaculty === fac ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setNewFaculty(fac)}
                  >
                    <Text
                      style={[
                        styles.facultyChipText,
                        { color: newFaculty === fac ? '#FFFFFF' : theme.textSecondary },
                      ]}
                    >
                      {fac}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.modalInputLabel, { color: theme.textSecondary }]}>Điểm Rèn Luyện khởi tạo (0 - 100)</Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.textPrimary,
                  },
                ]}
                keyboardType="numeric"
                value={newInitialPoint}
                onChangeText={setNewInitialPoint}
                placeholder="Mặc định: 80"
                placeholderTextColor={theme.textTertiary}
              />

              <TouchableOpacity
                style={[styles.btnCreateSubmit, { backgroundColor: theme.primary }]}
                onPress={handleCreateUser}
                disabled={creatingUser}
              >
                {creatingUser ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnCreateSubmitText}>Khởi Tạo Tài Khoản</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
    ...Shadow.sm,
  },
  addBtnIcon: {
    fontSize: 12,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...Shadow.sm,
  },
  kpiIcon: {
    fontSize: 22,
  },
  kpiValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
  },
  clearSearchIcon: {
    fontSize: 14,
    color: '#94A3B8',
    padding: 4,
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterContainer: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  reloadText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadow.sm,
  },
  userCardInactive: {
    opacity: 0.65,
    backgroundColor: '#F8FAFC',
  },
  userMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  userMeta: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  userName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 6,
  },
  badgeRole: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeStudent: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  badgeAdmin: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  badgeRoleText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  badgeTextStudent: {
    color: '#2563EB',
  },
  badgeTextAdmin: {
    color: '#DC2626',
  },
  userMSSV: {
    fontSize: 11.5,
    color: '#64748B',
  },
  userFaculty: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  scoreBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  pointGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointIcon: {
    fontSize: 14,
  },
  pointValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  pointRank: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },
  statusPillActive: {
    backgroundColor: '#DCFCE7',
  },
  statusPillInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotActive: {
    backgroundColor: '#16A34A',
  },
  statusDotInactive: {
    backgroundColor: '#DC2626',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#166534',
  },
  statusTextInactive: {
    color: '#991B1B',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnPoint: {
    flex: 1.2,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnTextPoint: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  actionBtnRole: {
    flex: 1.1,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnTextRole: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  actionBtnStatus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
  },
  actionBtnStatusUnlock: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  actionBtnTextStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  actionBtnTextUnlock: {
    color: '#16A34A',
  },
  actionBtnDelete: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  actionBtnTextDelete: {
    fontSize: 13,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  pointModalBody: {
    padding: 16,
  },
  pointModalUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  pointModalCurrent: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 14,
  },
  pointHighlight: {
    color: '#2563EB',
    fontWeight: '800',
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 6,
  },
  pointQuickChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  pointQuickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pointQuickChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  pointQuickChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  pointQuickChipTextActive: {
    color: '#FFFFFF',
  },
  pointInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 10,
  },
  reasonInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 16,
  },
  pointModalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pointSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointDeductBtn: {
    backgroundColor: '#EF4444',
  },
  pointAddBtn: {
    backgroundColor: '#10B981',
  },
  pointSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Create Modal
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 10,
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleOptionActiveStudent: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  roleOptionActiveAdmin: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  roleOptionText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  roleOptionTextActive: {
    fontWeight: '700',
    color: '#0F172A',
  },
  facultyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 6,
  },
  facultyChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  facultyChipText: {
    fontSize: 11.5,
    color: '#475569',
  },
  facultyChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  btnCreateSubmit: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    ...Shadow.sm,
  },
  btnCreateSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

