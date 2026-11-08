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
import { logout, updateUser } from "../../features/auth/authSlice";
import { fetchMyRegistrations } from "../../features/check-in/registrationsSlice";
import api, { setAuthToken } from "../../services/api";
import LeftNavbarButton from "../../components/navigation/LeftNavbarButton";
import { useAppTheme } from "../../theme";
import {
  getDefaultDbUser,
  getUserStatsFromDb,
  findDbEvent,
} from "../../data/dbService";

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

  const currentUser = useAppSelector((state) => state.auth.user);
  const myRegistrations = useAppSelector(
    (state) => state.registrations.myRegistrations,
  );
  const eventsList = useAppSelector((state) => state.events.list);

  const defaultStudent = getDefaultDbUser();
  const [imageError, setImageError] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const targetUserId = currentUser?._id || defaultStudent?._id;

  // Đếm chính xác số lượng sự kiện người dùng đã đánh giá từ Backend
  const [personalReviewsCount, setPersonalReviewsCount] = useState<number>(
    () => {
      return getUserStatsFromDb(targetUserId).reviews;
    },
  );

  const loadPersonalReviews = useCallback(async () => {
    try {
      const queryId =
        targetUserId || currentUser?.studentId || defaultStudent?._id;
      const apiFeedbacks = queryId
        ? await api.getFeedbacksByUser(queryId)
        : await api.getAllFeedbacks();

      if (Array.isArray(apiFeedbacks)) {
        const targetStudentId =
          currentUser?.studentId || defaultStudent?.studentId;
        const userFeedbacks = apiFeedbacks.filter((f: any) => {
          const uId =
            typeof f.userId === "object" && f.userId !== null
              ? f.userId._id || f.userId.id
              : f.userId;
          const uStudentId =
            typeof f.userId === "object" && f.userId !== null
              ? f.userId.studentId
              : null;
          return (
            !queryId ||
            uId === queryId ||
            (targetUserId && uId === targetUserId) ||
            (targetStudentId && uStudentId === targetStudentId) ||
            (defaultStudent?._id && uId === defaultStudent._id)
          );
        });

        const reviewedEventIds = new Set(
          userFeedbacks
            .map((f: any) =>
              typeof f.eventId === "object" && f.eventId !== null
                ? f.eventId._id || f.eventId.id
                : f.eventId,
            )
            .filter(Boolean),
        );

        const count =
          reviewedEventIds.size > 0
            ? reviewedEventIds.size
            : userFeedbacks.length;
        setPersonalReviewsCount(count);
      }
    } catch {
      const stats = getUserStatsFromDb(targetUserId);
      setPersonalReviewsCount(stats.reviews);
    }
  }, [
    targetUserId,
    currentUser?.studentId,
    defaultStudent?._id,
    defaultStudent?.studentId,
  ]);

  useEffect(() => {
    if (targetUserId) {
      dispatch(fetchMyRegistrations(targetUserId));
    }
    loadPersonalReviews();
  }, [dispatch, targetUserId, loadPersonalReviews]);

  useFocusEffect(
    useCallback(() => {
      loadPersonalReviews();
    }, [loadPersonalReviews]),
  );

  // Compute real user details and stats from Redux
  const displayName =
    currentUser?.fullName ||
    profile?.displayName ||
    defaultStudent?.fullName ||
    "Sinh viên";
  const studentId =
    currentUser?.studentId ||
    profile?.studentId ||
    defaultStudent?.studentId ||
    "20000001";
  const faculty =
    currentUser?.faculty ||
    profile?.faculty ||
    defaultStudent?.faculty ||
    "Khoa Công nghệ thông tin";
  const avatarUrl =
    currentUser?.avatarUrl || profile?.avatarUrl || defaultStudent?.avatarUrl;
  const email =
    currentUser?.email ||
    profile?.email ||
    defaultStudent?.email ||
    "student@iuh.edu.vn";
  const phone =
    currentUser?.phone || profile?.phone || defaultStudent?.phone || "";

  const attendedRegistrations = myRegistrations.filter(
    (r) => r.status === "checked_in" || (r.status as string) === "completed",
  );
  const registeredAttended = attendedRegistrations.length;
  const eventsAttendedCount =
    myRegistrations.length > 0
      ? registeredAttended
      : getUserStatsFromDb(targetUserId).eventsAttended;

  // Điểm tích luỹ bằng tổng điểm rèn luyện các sự kiện đã tham gia
  const calculatedPointsFromEvents = attendedRegistrations.reduce((sum, r) => {
    const eventObj: any = r.eventId;
    let pts = 0;
    if (typeof eventObj === "object" && eventObj !== null) {
      pts = Number(eventObj.trainingPoints) || 0;
    } else if (typeof eventObj === "string") {
      const found =
        eventsList.find((e: any) => (e._id || e.id) === eventObj) ||
        findDbEvent(eventObj);
      pts = Number(found?.trainingPoints) || 0;
    }
    return sum + pts;
  }, 0);

  const pointsAccumulated =
    calculatedPointsFromEvents > 0
      ? calculatedPointsFromEvents
      : (currentUser?.point ??
        defaultStudent?.point ??
        getUserStatsFromDb(targetUserId).pointsAccumulated);

  // Lưu thông tin cá nhân
  const handleSaveProfile = async (data: {
    fullName: string;
    phone: string;
    faculty: string;
  }) => {
    await api.updateProfile(data);
    dispatch(updateUser(data));
    Alert.alert("Thành công", "Thông tin cá nhân đã được lưu thành công.");
  };

  // Thực hiện đăng xuất tài khoản
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

        {/* Student Info */}
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

        {/* Activity Stats Card */}
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

        {/* Menu list */}
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
