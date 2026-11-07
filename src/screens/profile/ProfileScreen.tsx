import React, { useState, useEffect, useCallback } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  YStack,
  XStack,
  Card,
  Button,
  Input as TamaguiInput,
  Spinner,
} from "tamagui";
import {
  AppText as TamaguiText,
  AppHeading as Heading,
  AppParagraph as Paragraph,
} from "../../components/common/AppTypography";

import type { MainStackParamList } from "../../navigation/types";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { logout, updateUser } from "../../features/auth/authSlice";
import { fetchMyRegistrations } from "../../features/check-in/registrationsSlice";
import api, { setAuthToken } from "../../services/api";
import LeftNavbarButton from "../../components/navigation/LeftNavbarButton";
import AppBottomTab, { AppTabKey } from "../../components/navigation/AppBottomTab";
import { useAppTheme } from "../../theme";
import {
  getDefaultDbUser,
  getUserStatsFromDb,
  loadFeedbacksFromStorage,
  findDbEvent,
} from "../../data/dbService";

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

export type TabKey = "home" | "schedule" | "checkin" | "profile";

export interface ProfileScreenProps {
  profile?: UserProfile;
  initialTab?: TabKey;
}

// ---------------------------------------------------------------------------
// MenuItem Component (Tamagui based)
// ---------------------------------------------------------------------------

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  isLast?: boolean;
  onPress?: () => void;
  textColor?: string;
  bgColor?: string;
  borderSubtle?: string;
  badgeBg?: string;
  chevronColor?: string;
}

function MenuItem({
  icon,
  label,
  badge,
  isLast = false,
  onPress,
  textColor = "#0F172A",
  bgColor = "#FFFFFF",
  borderSubtle = "#F1F5F9",
  badgeBg = "#EFF6FF",
  chevronColor = "#94A3B8",
}: MenuItemProps) {
  return (
    <XStack
      alignItems="center"
      paddingVertical={14}
      paddingHorizontal={16}
      backgroundColor={bgColor}
      borderBottomWidth={isLast ? 0 : 1}
      borderBottomColor={borderSubtle}
      onPress={onPress}
      pressStyle={{ opacity: 0.7 }}
      cursor="pointer"
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <XStack width={28} alignItems="center" justifyContent="center" marginRight={12}>
        {icon}
      </XStack>
      <TamaguiText flex={1} fontSize={15} fontWeight="500" color={textColor}>
        {label}
      </TamaguiText>
      <XStack alignItems="center" gap={4}>
        {badge ? (
          <XStack
            paddingHorizontal={8}
            paddingVertical={2}
            borderRadius={8}
            backgroundColor={badgeBg}
            marginRight={4}
          >
            <TamaguiText fontSize={13} fontWeight="600" color={textColor}>
              {badge}
            </TamaguiText>
          </XStack>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={chevronColor} />
      </XStack>
    </XStack>
  );
}

// ---------------------------------------------------------------------------
// ActivityStats Item (Tamagui based)
// ---------------------------------------------------------------------------

interface ActivityStatItemProps {
  value: number;
  label: string;
  accentColor: string;
  labelColor: string;
}

function ActivityStatItem({
  value,
  label,
  accentColor,
  labelColor,
}: ActivityStatItemProps) {
  return (
    <YStack flex={1} alignItems="center" paddingVertical={4}>
      <Heading size="$7" fontWeight="700" color={accentColor} marginBottom={4}>
        {value}
      </Heading>
      <Paragraph size="$2" textAlign="center" color={labelColor} lineHeight={15}>
        {label}
      </Paragraph>
    </YStack>
  );
}

// ---------------------------------------------------------------------------
// ProfileScreen
// ---------------------------------------------------------------------------

export default function ProfileScreen({
  profile,
  initialTab = "profile",
}: ProfileScreenProps) {
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
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [imageError, setImageError] = useState<boolean>(false);

  // Edit Profile Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editFaculty, setEditFaculty] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const targetUserId = currentUser?._id || defaultStudent?._id;

  // Đếm chính xác số lượng sự kiện người dùng đã đánh giá từ Backend
  const [personalReviewsCount, setPersonalReviewsCount] = useState<number>(() => {
    return getUserStatsFromDb(targetUserId).reviews;
  });

  const loadPersonalReviews = useCallback(async () => {
    try {
      // 1. Lấy trực tiếp từ Backend MongoDB qua API
      const queryId = targetUserId || currentUser?.studentId || defaultStudent?._id;
      const apiFeedbacks = queryId
        ? await api.getFeedbacksByUser(queryId)
        : await api.getAllFeedbacks();

      if (Array.isArray(apiFeedbacks)) {
        const targetStudentId = currentUser?.studentId || defaultStudent?.studentId;
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

        // Đếm số sự kiện phân biệt (distinct eventId) sinh viên đã gửi đánh giá
        const reviewedEventIds = new Set(
          userFeedbacks
            .map((f: any) =>
              typeof f.eventId === "object" && f.eventId !== null
                ? f.eventId._id || f.eventId.id
                : f.eventId,
            )
            .filter(Boolean),
        );

        const count = reviewedEventIds.size > 0 ? reviewedEventIds.size : userFeedbacks.length;
        setPersonalReviewsCount(count);
        return;
      }

      // 2. Fallback sang local storage nếu offline
      const allFeedbacks = await loadFeedbacksFromStorage();
      const userFeedbacks = allFeedbacks.filter((f) => {
        const fUser: any = f.userId;
        const uId =
          typeof fUser === "object" && fUser !== null
            ? fUser._id || fUser.id
            : fUser;
        return (
          uId === targetUserId ||
          (defaultStudent?._id && uId === defaultStudent._id)
        );
      });
      const reviewedEventIds = new Set(
        userFeedbacks.map((f) => f.eventId).filter(Boolean),
      );
      setPersonalReviewsCount(reviewedEventIds.size > 0 ? reviewedEventIds.size : userFeedbacks.length);
    } catch {
      const stats = getUserStatsFromDb(targetUserId);
      setPersonalReviewsCount(stats.reviews);
    }
  }, [targetUserId, currentUser?.studentId, defaultStudent?._id, defaultStudent?.studentId]);

  useEffect(() => {
    if (targetUserId) {
      dispatch(fetchMyRegistrations(targetUserId));
    }
    loadPersonalReviews();
  }, [dispatch, targetUserId, loadPersonalReviews]);

  useFocusEffect(
    useCallback(() => {
      setActiveTab("profile");
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
  const reviewsCount = personalReviewsCount;

  const handleOpenEditProfile = () => {
    setEditFullName(currentUser?.fullName || displayName);
    setEditPhone(currentUser?.phone || phone || "0912345678");
    setEditFaculty(currentUser?.faculty || faculty || "Khoa Công nghệ thông tin");
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editFullName.trim()) {
      Alert.alert("Lỗi", "Họ tên không được để trống.");
      return;
    }
    setSavingProfile(true);
    try {
      await api.updateProfile({
        fullName: editFullName.trim(),
        phone: editPhone.trim(),
        faculty: editFaculty.trim(),
      });
      dispatch(
        updateUser({
          fullName: editFullName.trim(),
          phone: editPhone.trim(),
          faculty: editFaculty.trim(),
        }),
      );
      Alert.alert("Thành công", "Thông tin cá nhân đã được lưu thành công.");
      setEditModalVisible(false);
    } catch (err: any) {
      Alert.alert(
        "Không thể lưu hồ sơ",
        err?.response?.data?.message ??
          err?.message ??
          "Kiểm tra kết nối mạng và thử lại.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // Xử lý chuyển tab dưới cùng
  const handleTabPress = (tab: AppTabKey) => {
    setActiveTab(tab);
    switch (tab) {
      case "home":
        navigation.navigate("Home");
        break;
      case "schedule":
        navigation.navigate("MySchedule");
        break;
      case "checkin":
        navigation.navigate("CheckIn");
        break;
      case "profile":
        break;
    }
  };

  // Mở modal xác nhận đăng xuất
  const handleLogoutPress = () => {
    setLogoutModalVisible(true);
  };

  // Thực hiện đăng xuất tài khoản
  const confirmLogout = async () => {
    setLogoutModalVisible(false);

    // 1. Thu hồi / xoá token axios interceptor
    try {
      setAuthToken(null);
    } catch (e) {
      // ignore
    }

    // 2. Cập nhật Redux: RootNavigator sẽ tự động nhận diện isAuthenticated = false
    // và lập tức chuyển về AuthStack (LoginScreen)
    dispatch(logout());

    // 3. Thông báo máy chủ backend ngầm
    try {
      await api.logout();
    } catch (err) {
      // Bỏ qua lỗi kết nối máy chủ khi đăng xuất
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
        {/* ── Top row với nút Left Navbar (☰), Tiêu đề & Tùy chọn ──────────── */}
        <XStack
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal={20}
          paddingTop={Platform.OS === "android" ? 12 : 8}
          paddingBottom={8}
        >
          <XStack alignItems="center" gap={10}>
            <LeftNavbarButton />
            <Heading size="$6" fontWeight="700" color={theme.textPrimary}>
              Hồ sơ cá nhân
            </Heading>
          </XStack>

          <Button
            size="$3"
            circular
            padding={0}
            width={36}
            height={36}
            backgroundColor={theme.surface}
            borderColor={theme.border}
            borderWidth={1}
            pressStyle={{ opacity: 0.7 }}
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
          </Button>
        </XStack>

        {/* ── Avatar ──────────────────────────────────────────────────────── */}
        <YStack alignItems="center" marginTop={8} marginBottom={12}>
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
            <YStack
              width={90}
              height={90}
              borderRadius={45}
              justifyContent="center"
              alignItems="center"
              borderWidth={3}
              backgroundColor={theme.primary}
              borderColor={theme.surface}
            >
              <TamaguiText fontSize={36} fontWeight="700" color="#FFFFFF">
                {displayName.charAt(0).toUpperCase()}
              </TamaguiText>
            </YStack>
          )}
        </YStack>

        {/* ── Student info ─────────────────────────────────────────────────── */}
        <Heading
          size="$6"
          fontWeight="700"
          textAlign="center"
          color={theme.textPrimary}
          marginBottom={4}
        >
          {displayName}
        </Heading>
        <Paragraph
          size="$3"
          textAlign="center"
          color={theme.textSecondary}
          marginBottom={2}
        >
          MSSV: {studentId}
        </Paragraph>
        <Paragraph
          size="$3"
          textAlign="center"
          color={theme.textSecondary}
          marginBottom={20}
        >
          {faculty}
        </Paragraph>

        {/* ── Activity stats card (Tamagui Card) ─────────── */}
        <Card
          marginHorizontal={20}
          borderRadius={16}
          borderWidth={1}
          borderColor={theme.border}
          backgroundColor={theme.surface}
          paddingVertical={14}
          paddingHorizontal={12}
          marginBottom={20}
          elevation={2}
        >
          <XStack justifyContent="space-around" alignItems="center">
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
              value={reviewsCount}
              label="Đã đánh giá"
              accentColor={theme.primary}
              labelColor={theme.textSecondary}
            />
          </XStack>
        </Card>

        {/* ── Menu list (Tamagui Card) ────────────────────────────────────── */}
        <Card
          marginHorizontal={20}
          borderRadius={16}
          borderWidth={1}
          borderColor={theme.border}
          backgroundColor={theme.surface}
          overflow="hidden"
          elevation={2}
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
            onPress={handleOpenEditProfile}
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

          {/* Nút Đổi Theme sáng/tối ấn được */}
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
        </Card>

        {/* ── Nút Đăng xuất riêng biệt nổi bật (Tamagui Button) ── */}
        <Button
          marginHorizontal={20}
          marginTop={14}
          borderRadius={14}
          borderWidth={1}
          height={52}
          backgroundColor={isDark ? "#261214" : "#FEF2F2"}
          borderColor={isDark ? "#7F1D1D" : "#FECACA"}
          onPress={handleLogoutPress}
          pressStyle={{ opacity: 0.75 }}
          accessibilityRole="button"
          accessibilityLabel="Đăng xuất khỏi tài khoản"
        >
          <XStack alignItems="center" gap={8}>
            <Ionicons name="log-out-outline" size={20} color={theme.danger} />
            <TamaguiText fontSize={15} fontWeight="700" color={theme.danger}>
              Đăng xuất tài khoản
            </TamaguiText>
          </XStack>
        </Button>
      </ScrollView>


      {/* ── Modal Chỉnh Sửa Thông Tin Cá Nhân (Tamagui Card + Input + Button) ── */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <YStack
          flex={1}
          backgroundColor="rgba(15, 23, 42, 0.65)"
          justifyContent="center"
          alignItems="center"
          padding={16}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={editStyles.keyboardWrap}
          >
            <Card
              width="100%"
              maxWidth={420}
              backgroundColor="#FFFFFF"
              borderRadius={16}
              overflow="hidden"
              maxHeight="85%"
            >
              <XStack
                alignItems="center"
                justifyContent="space-between"
                paddingHorizontal={16}
                paddingVertical={14}
                backgroundColor="#1E3A8A"
              >
                <XStack alignItems="center" gap={8}>
                  <Ionicons
                    name="person-circle-outline"
                    size={20}
                    color="#FFFFFF"
                  />
                  <TamaguiText fontSize={15} fontWeight="800" color="#FFFFFF">
                    Cập Nhật Thông Tin Cá Nhân
                  </TamaguiText>
                </XStack>
                <Button
                  size="$2"
                  circular
                  padding={0}
                  backgroundColor="transparent"
                  onPress={() => setEditModalVisible(false)}
                  pressStyle={{ opacity: 0.7 }}
                  accessibilityRole="button"
                  accessibilityLabel="Đóng modal"
                >
                  <Ionicons name="close" size={22} color="#E0E7FF" />
                </Button>
              </XStack>

              <ScrollView
                style={editStyles.body}
                showsVerticalScrollIndicator={false}
              >
                <Paragraph size="$2" fontWeight="700" color="#334155" marginBottom={6} marginTop={4}>
                  Mã số sinh viên (MSSV)
                </Paragraph>
                <XStack
                  alignItems="center"
                  justifyContent="space-between"
                  backgroundColor="#F1F5F9"
                  borderRadius={10}
                  paddingHorizontal={12}
                  height={42}
                  borderWidth={1}
                  borderColor="#E2E8F0"
                  marginBottom={10}
                >
                  <TamaguiText fontSize={13} color="#64748B" fontWeight="600">
                    {studentId}
                  </TamaguiText>
                  <XStack
                    backgroundColor="#E2E8F0"
                    paddingHorizontal={6}
                    paddingVertical={2}
                    borderRadius={4}
                  >
                    <TamaguiText fontSize={10} color="#94A3B8" fontWeight="700">
                      Cố định
                    </TamaguiText>
                  </XStack>
                </XStack>

                <Paragraph size="$2" fontWeight="700" color="#334155" marginBottom={6} marginTop={4}>
                  Email trường
                </Paragraph>
                <XStack
                  alignItems="center"
                  justifyContent="space-between"
                  backgroundColor="#F1F5F9"
                  borderRadius={10}
                  paddingHorizontal={12}
                  height={42}
                  borderWidth={1}
                  borderColor="#E2E8F0"
                  marginBottom={10}
                >
                  <TamaguiText fontSize={13} color="#64748B" fontWeight="600">
                    {currentUser?.email || "sv@iuh.edu.vn"}
                  </TamaguiText>
                  <XStack
                    backgroundColor="#E2E8F0"
                    paddingHorizontal={6}
                    paddingVertical={2}
                    borderRadius={4}
                  >
                    <TamaguiText fontSize={10} color="#94A3B8" fontWeight="700">
                      Cố định
                    </TamaguiText>
                  </XStack>
                </XStack>

                <Paragraph size="$2" fontWeight="700" color="#334155" marginBottom={6} marginTop={4}>
                  Họ và tên *
                </Paragraph>
                <TamaguiInput
                  backgroundColor="#F8FAFC"
                  borderWidth={1}
                  borderColor="#CBD5E1"
                  borderRadius={10}
                  paddingHorizontal={12}
                  height={42}
                  fontSize={13.5}
                  color="#0F172A"
                  marginBottom={10}
                  value={editFullName}
                  onChangeText={setEditFullName}
                  placeholder="Nhập họ và tên..."
                />

                <Paragraph size="$2" fontWeight="700" color="#334155" marginBottom={6} marginTop={4}>
                  Số điện thoại
                </Paragraph>
                <TamaguiInput
                  backgroundColor="#F8FAFC"
                  borderWidth={1}
                  borderColor="#CBD5E1"
                  borderRadius={10}
                  paddingHorizontal={12}
                  height={42}
                  fontSize={13.5}
                  color="#0F172A"
                  marginBottom={10}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Ví dụ: 0912345678"
                  keyboardType="phone-pad"
                />

                <Paragraph size="$2" fontWeight="700" color="#334155" marginBottom={6} marginTop={4}>
                  Khoa / Viện đào tạo
                </Paragraph>
                <TamaguiInput
                  backgroundColor="#F8FAFC"
                  borderWidth={1}
                  borderColor="#CBD5E1"
                  borderRadius={10}
                  paddingHorizontal={12}
                  height={42}
                  fontSize={13.5}
                  color="#0F172A"
                  marginBottom={10}
                  value={editFaculty}
                  onChangeText={setEditFaculty}
                  placeholder="Ví dụ: Khoa Công nghệ thông tin"
                />

                <XStack
                  alignItems="center"
                  justifyContent="space-between"
                  backgroundColor="#EFF6FF"
                  borderRadius={10}
                  padding={12}
                  borderWidth={1}
                  borderColor="#BFDBFE"
                  marginTop={4}
                  marginBottom={16}
                >
                  <XStack alignItems="center" gap={6}>
                    <Ionicons name="star" size={15} color="#1D4ED8" />
                    <TamaguiText fontSize={12} fontWeight="700" color="#1D4ED8">
                      Điểm rèn luyện tích lũy:
                    </TamaguiText>
                  </XStack>
                  <TamaguiText fontSize={14} fontWeight="800" color="#2563EB">
                    {pointsAccumulated} / 100 ĐRL
                  </TamaguiText>
                </XStack>

                <Button
                  backgroundColor="#2563EB"
                  height={46}
                  borderRadius={12}
                  alignItems="center"
                  justifyContent="center"
                  marginBottom={16}
                  disabled={savingProfile}
                  onPress={handleSaveProfile}
                  pressStyle={{ opacity: 0.8 }}
                >
                  {savingProfile ? (
                    <Spinner color="#FFFFFF" />
                  ) : (
                    <TamaguiText fontSize={14} fontWeight="700" color="#FFFFFF">
                      Lưu Thay Đổi
                    </TamaguiText>
                  )}
                </Button>
              </ScrollView>
            </Card>
          </KeyboardAvoidingView>
        </YStack>
      </Modal>

      {/* ── Modal xác nhận Đăng xuất (Tamagui Card + Button) ─────────────── */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <YStack
          flex={1}
          backgroundColor="rgba(0, 0, 0, 0.65)"
          justifyContent="center"
          alignItems="center"
          paddingHorizontal={28}
        >
          <Card
            width="100%"
            maxWidth={360}
            borderRadius={20}
            borderWidth={1}
            borderColor={theme.border}
            backgroundColor={theme.surface}
            padding={24}
            alignItems="center"
            elevation={6}
          >
            <YStack
              width={56}
              height={56}
              borderRadius={28}
              justifyContent="center"
              alignItems="center"
              marginBottom={16}
              backgroundColor={isDark ? "#3B181A" : "#FEE2E2"}
            >
              <Ionicons name="log-out-outline" size={28} color={theme.danger} />
            </YStack>

            <Heading
              size="$5"
              fontWeight="700"
              textAlign="center"
              marginBottom={8}
              color={theme.textPrimary}
            >
              Xác nhận đăng xuất
            </Heading>

            <Paragraph
              size="$3"
              lineHeight={21}
              textAlign="center"
              marginBottom={24}
              color={theme.textSecondary}
            >
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản{" "}
              <TamaguiText fontWeight="700" color={theme.textPrimary}>
                {displayName}
              </TamaguiText>{" "}
              không? Mọi phiên làm việc hiện tại sẽ kết thúc.
            </Paragraph>

            <XStack gap={12} width="100%">
              <Button
                flex={1}
                height={46}
                borderRadius={12}
                borderWidth={1}
                borderColor={theme.border}
                backgroundColor={theme.background}
                pressStyle={{ opacity: 0.8 }}
                onPress={() => setLogoutModalVisible(false)}
              >
                <TamaguiText fontSize={14} fontWeight="600" color={theme.textPrimary}>
                  Hủy bỏ
                </TamaguiText>
              </Button>

              <Button
                flex={1}
                height={46}
                borderRadius={12}
                backgroundColor={theme.danger}
                pressStyle={{ opacity: 0.8 }}
                onPress={confirmLogout}
              >
                <TamaguiText fontSize={14} fontWeight="700" color="#FFFFFF">
                  Đăng xuất
                </TamaguiText>
              </Button>
            </XStack>
          </Card>
        </YStack>
      </Modal>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Native Styles (Image & Scroll layout)
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 24,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E2E8F0",
    borderWidth: 3,
  },
});

const editStyles = StyleSheet.create({
  keyboardWrap: {
    width: "100%",
    alignItems: "center",
  },
  body: {
    padding: 16,
  },
});
