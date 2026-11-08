import React, { useState, useEffect, useCallback } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { MainStackParamList } from "../../navigation/types";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { logout, updateUser, switchTestAccount } from "../../features/auth/authSlice";
import { fetchMyRegistrations } from "../../features/check-in/registrationsSlice";
import api, { setAuthToken } from "../../services/api";
import LeftNavbarButton from "../../components/navigation/LeftNavbarButton";
import { useAppTheme } from "../../theme";

import ActivityStatItem from "../../components/profile/ActivityStatItem";
import MenuItem from "../../components/profile/MenuItem";
import EditProfileModal from "../../components/profile/EditProfileModal";
import LogoutConfirmModal from "../../components/profile/LogoutConfirmModal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActivityStats {
  eventsAttended: number;
  pointsAccumulated: number;
  reviews: number;
}

export interface UserProfile {
  displayName: string;
  studentId: string;
  faculty: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  stats?: ActivityStats;
}

export interface ProfileScreenProps {
  profile?: UserProfile;
}

// ---------------------------------------------------------------------------
// ProfileScreen Component
// ---------------------------------------------------------------------------

export default function ProfileScreen({ profile }: ProfileScreenProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const dispatch = useAppDispatch();
  const { theme, isDark, mode, toggleTheme } = useAppTheme();

  // 1. LẤY THÔNG TIN NGƯỜI DÙNG TỪ REDUX (DỮ LIỆU ĐỒNG BỘ TỪ MONGODB KHI LOGIN)
  const currentUser = useAppSelector((state) => state.auth.user);
  const currentUserId = currentUser?._id;

  // 2. LẤY DANH SÁCH ĐĂNG KÝ VÀ SỰ KIỆN TỪ REDUX
  const myRegistrations = useAppSelector(
    (state) => state.registrations.myRegistrations,
  );
  const eventsList = useAppSelector((state) => state.events.list);

  const [imageError, setImageError] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // 3. ĐẾM SỐ LƯỢNG ĐÁNH GIÁ CỦA USER TRỰC TIẾP TỪ BACKEND MONGODB
  const [personalReviewsCount, setPersonalReviewsCount] = useState<number>(0);

  const loadPersonalReviews = useCallback(async () => {
    if (!currentUserId) return;
    try {
      // Gọi API lấy các đánh giá của chính sinh viên này từ MongoDB
      const userFeedbacks = await api.getFeedbacksByUser(currentUserId);
      if (Array.isArray(userFeedbacks)) {
        // Đếm số lượng sự kiện duy nhất mà sinh viên đã đánh giá
        const reviewedEventIds = new Set(
          userFeedbacks
            .map((f: any) => {
              const e = f.eventId;
              return typeof e === "object" && e !== null ? e._id || e.id : e;
            })
            .filter(Boolean),
        );
        setPersonalReviewsCount(
          reviewedEventIds.size > 0 ? reviewedEventIds.size : userFeedbacks.length,
        );
      }
    } catch (err) {
      console.warn("[ProfileScreen] Không thể tải số lượt đánh giá:", err);
    }
  }, [currentUserId]);

  // Đồng bộ lại danh sách đăng ký và số lượt đánh giá khi vào màn hình
  useEffect(() => {
    if (currentUserId) {
      dispatch(fetchMyRegistrations(currentUserId));
    }
    loadPersonalReviews();
  }, [dispatch, currentUserId, loadPersonalReviews]);

  useFocusEffect(
    useCallback(() => {
      loadPersonalReviews();
    }, [loadPersonalReviews]),
  );

  // 4. THÔNG TIN CÁ NHÂN LẤY TRỰC TIẾP TỪ MONGODB (state.auth.user)
  const displayName =
    currentUser?.fullName || profile?.displayName || "Sinh viên IUH";
  const studentId =
    currentUser?.studentId || profile?.studentId || "20000001";
  const faculty =
    currentUser?.faculty || profile?.faculty || "Khoa Công nghệ thông tin";
  const avatarUrl =
    currentUser?.avatarUrl || profile?.avatarUrl;
  const email =
    currentUser?.email || profile?.email || "student@iuh.edu.vn";
  const phone =
    currentUser?.phone || profile?.phone || "";

  // 5. TÍNH TOÁN CÁC CHỈ SỐ HOẠT ĐỘNG THỰC TẾ
  // - Chỉ số 1: Số sự kiện đã tham gia (chỉ những đăng ký có trạng thái checked_in mới được tính là đã tham gia thành công)
  const attendedRegistrations = myRegistrations.filter(
    (r) => r.status === "checked_in",  );
  const eventsAttendedCount = attendedRegistrations.length;

  // - Chỉ số 2: Điểm rèn luyện tích lũy từ các sự kiện đã tham gia hoặc điểm lưu trên MongoDB
  const calculatedPointsFromEvents = attendedRegistrations.reduce((sum, r) => {
    const eventObj: any = r.eventId;
    let pts = 0;
    if (typeof eventObj === "object" && eventObj !== null) {
      pts = Number(eventObj.trainingPoints) || 0;
    } else if (typeof eventObj === "string") {
      const found = eventsList.find((e: any) => (e._id || e.id) === eventObj);
      pts = Number(found?.trainingPoints) || 0;
    }
    return sum + pts;
  }, 0);

  const pointsAccumulated =
    calculatedPointsFromEvents > 0
      ? calculatedPointsFromEvents
      : (currentUser?.point ?? 0);

  // 6. CẬP NHẬT THÔNG TIN CÁ NHÂN LÊN MONGODB QUA API
  const handleSaveProfile = async (data: {
    fullName: string;
    phone: string;
    faculty: string;
  }) => {
    await api.updateProfile(data);
    dispatch(updateUser(data));
    Alert.alert("Thành công", "Thông tin cá nhân đã được lưu thành công.");
  };

  // 7. THỰC HIỆN ĐĂNG XUẤT TÀI KHOẢN
  const confirmLogout = async () => {
    setLogoutModalVisible(false);
    try {
      setAuthToken(null);
    } catch {
      // ignore
    }
    dispatch(logout());
    try {
      await api.logout();
    } catch {
      // Bỏ qua lỗi kết nối khi đăng xuất
    }
  };

  const switchToAdmin = async () => {
    const result = await dispatch(switchTestAccount("admin"));
    if (switchTestAccount.rejected.match(result)) {
      Alert.alert("Không thể chuyển tài khoản", result.payload as string);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <StatusBar barStyle={theme.statusBarStyle} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <LeftNavbarButton />
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Hồ sơ cá nhân
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.moreButton,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => {
              Alert.alert(
                "Thông tin tài khoản",
                `Người dùng hiện tại: ${displayName}\nMSSV: ${studentId}\nKhoa: ${faculty}\nĐiểm rèn luyện: ${pointsAccumulated} đ\nChế độ màu: ${mode}`,
              );
            }}
            accessibilityRole="button"
            accessibilityLabel="Tùy chọn khác"
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={18}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {avatarUrl && !imageError ? (
            <Image
              source={{ uri: avatarUrl }}
              style={[styles.avatarImage, { borderColor: theme.surface }]}
              resizeMode="cover"
              onError={() => setImageError(true)}
              accessible
              accessibilityLabel={`Ảnh đại diện của ${displayName}`}
            />
          ) : (
            <View
              style={[
                styles.avatarFallback,
                {
                  backgroundColor: theme.primary,
                  borderColor: theme.surface,
                },
              ]}
            >
              <Text style={styles.avatarFallbackText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Thông tin sinh viên */}
        <Text style={[styles.nameText, { color: theme.textPrimary }]}>
          {displayName}
        </Text>
        <Text style={[styles.subText, { color: theme.textSecondary }]}>
          MSSV: {studentId}
        </Text>
        <Text
          style={[
            styles.subText,
            styles.facultyText,
            { color: theme.textSecondary },
          ]}
        >
          {faculty}
        </Text>

        {/* 3 Thẻ thống kê hoạt động */}
        <View
          style={[
            styles.statsCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.statsRow}>
            <ActivityStatItem
              value={eventsAttendedCount}
              label="Sự kiện đã tham gia"
              accentColor={theme.primary}
              labelColor={theme.textSecondary}
            />
            <ActivityStatItem
              value={pointsAccumulated}
              label="Điểm tích lũy"
              accentColor={theme.primary}
              labelColor={theme.textSecondary}
            />
            <ActivityStatItem
              value={personalReviewsCount}
              label="Đã đánh giá"
              accentColor={theme.primary}
              labelColor={theme.textSecondary}
            />
          </View>
        </View>

        {/* Menu điều hướng */}
        <View
          style={[
            styles.menuCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <MenuItem
            icon={
              <Ionicons
                name="calendar-outline"
                size={20}
                color={theme.textSecondary}
              />
            }
            label="Lịch sử tham gia"
            textColor={theme.textPrimary}
            bgColor={theme.surface}
            borderSubtle={theme.borderSubtle}
            chevronColor={theme.textTertiary}
            onPress={() => navigation.navigate("MySchedule")}
          />

          <MenuItem
            icon={
              <Ionicons
                name="person-outline"
                size={20}
                color={theme.textSecondary}
              />
            }
            label="Thông tin cá nhân"
            textColor={theme.textPrimary}
            bgColor={theme.surface}
            borderSubtle={theme.borderSubtle}
            chevronColor={theme.textTertiary}
            onPress={() => setEditModalVisible(true)}
          />

          <MenuItem
            icon={
              <Ionicons
                name="star-outline"
                size={20}
                color={theme.textSecondary}
              />
            }
            label="Góp ý & Đánh giá sự kiện"
            textColor={theme.textPrimary}
            bgColor={theme.surface}
            borderSubtle={theme.borderSubtle}
            chevronColor={theme.textTertiary}
            onPress={() => navigation.navigate("Feedback")}
          />

          <MenuItem
            icon={
              <Ionicons
                name="settings-outline"
                size={20}
                color={theme.textSecondary}
              />
            }
            label="Cài đặt ứng dụng"
            textColor={theme.textPrimary}
            bgColor={theme.surface}
            borderSubtle={theme.borderSubtle}
            chevronColor={theme.textTertiary}
            onPress={() =>
              Alert.alert(
                "Cài đặt",
                "Ứng dụng Quản lý Sự kiện Sinh viên IUH v1.0.0",
              )
            }
          />

          <MenuItem
            icon={
              <Ionicons
                name={isDark ? "sunny-outline" : "moon-outline"}
                size={20}
                color={theme.primary}
              />
            }
            label="Đổi theme (Sáng / Tối)"
            badge={mode}
            badgeBg={theme.badgeBackground}
            textColor={theme.textPrimary}
            bgColor={theme.surface}
            borderSubtle={theme.borderSubtle}
            chevronColor={theme.textTertiary}
            isLast={true}
            onPress={toggleTheme}
          />

          <MenuItem
            icon={<Ionicons name="shield-checkmark-outline" size={20} color="#7E22CE" />}
            label="Chuyển nhanh sang Admin (demo)"
            textColor={theme.textPrimary}
            bgColor={theme.surface}
            borderSubtle={theme.borderSubtle}
            chevronColor={theme.textTertiary}
            isLast={true}
            onPress={() => void switchToAdmin()}
          />
        </View>

        {/* Nút Đăng xuất */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            {
              backgroundColor: isDark ? "#261214" : "#FEF2F2",
              borderColor: isDark ? "#7F1D1D" : "#FECACA",
            },
          ]}
          activeOpacity={0.75}
          onPress={() => setLogoutModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Đăng xuất khỏi tài khoản"
        >
          <View style={styles.logoutContent}>
            <Ionicons name="log-out-outline" size={20} color={theme.danger} />
            <Text style={[styles.logoutText, { color: theme.danger }]}>
              Đăng xuất tài khoản
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Chỉnh Sửa Thông Tin Cá Nhân */}
      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        studentId={studentId}
        email={email}
        initialFullName={displayName}
        initialPhone={phone || "0912345678"}
        initialFaculty={faculty}
        pointsAccumulated={pointsAccumulated}
        onSave={handleSaveProfile}
      />

      {/* Modal Xác nhận Đăng xuất */}
      <LogoutConfirmModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        onConfirm={confirmLogout}
        displayName={displayName}
        theme={theme}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 12 : 8,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarContainer: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E2E8F0",
    borderWidth: 3,
  },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
  },
  avatarFallbackText: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  nameText: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  subText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 2,
  },
  facultyText: {
    marginBottom: 20,
  },
  statsCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  menuCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
