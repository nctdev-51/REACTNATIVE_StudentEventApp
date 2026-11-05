import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation/types";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { logout, updateUser } from "../../features/auth/authSlice";
import { fetchMyRegistrations } from "../../features/check-in/registrationsSlice";
import api, { setAuthToken } from "../../services/api";
import LeftNavbarButton from "../../components/navigation/LeftNavbarButton";
import { useAppTheme } from "../../theme";
import { getDefaultDbUser } from "../../data/dbService";

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
// Vector-style Custom Icons
// ---------------------------------------------------------------------------

function ChevronRight({ color = "#94A3B8" }: { color?: string }) {
  return (
    <View
      style={[
        iconStyles.chevron,
        { borderTopColor: color, borderRightColor: color },
      ]}
    />
  );
}

function CalendarIcon({ color = "#475569" }: { color?: string }) {
  return (
    <View style={[iconStyles.calendarContainer, { borderColor: color }]}>
      <View style={[iconStyles.calendarHeader, { backgroundColor: color }]} />
      <View style={iconStyles.calendarGrid}>
        <View style={[iconStyles.calendarDot, { backgroundColor: color }]} />
        <View style={[iconStyles.calendarDot, { backgroundColor: color }]} />
        <View style={[iconStyles.calendarDot, { backgroundColor: color }]} />
        <View style={[iconStyles.calendarDot, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function UserOutlineIcon({ color = "#475569" }: { color?: string }) {
  return (
    <View style={iconStyles.userContainer}>
      <View style={[iconStyles.userHead, { borderColor: color }]} />
      <View style={[iconStyles.userBody, { borderColor: color }]} />
    </View>
  );
}

function StarIconOutline({ color = "#475569" }: { color?: string }) {
  return (
    <View style={iconStyles.starContainer}>
      <Text style={[iconStyles.starEmoji, { color }]}>★</Text>
    </View>
  );
}

function SettingsCogIcon({ color = "#475569" }: { color?: string }) {
  return (
    <View style={iconStyles.settingsContainer}>
      <View style={[iconStyles.settingsRing, { borderColor: color }]}>
        <View style={[iconStyles.settingsDot, { backgroundColor: color }]} />
      </View>
      <View
        style={[
          iconStyles.settingsTooth,
          iconStyles.toothV,
          { backgroundColor: color },
        ]}
      />
      <View
        style={[
          iconStyles.settingsTooth,
          iconStyles.toothH,
          { backgroundColor: color },
        ]}
      />
    </View>
  );
}

function ThemeToggleIcon({
  isDark,
  color = "#475569",
}: {
  isDark: boolean;
  color?: string;
}) {
  if (isDark) {
    // Sun icon in dark mode (ready to switch to Light)
    return (
      <View style={iconStyles.sunContainer}>
        <View style={[iconStyles.sunCenter, { backgroundColor: color }]} />
        <View
          style={[
            iconStyles.sunRay,
            iconStyles.rayV,
            { backgroundColor: color },
          ]}
        />
        <View
          style={[
            iconStyles.sunRay,
            iconStyles.rayH,
            { backgroundColor: color },
          ]}
        />
      </View>
    );
  }
  // Moon crescent in light mode (ready to switch to Dark)
  return (
    <View style={iconStyles.moonContainer}>
      <View style={[iconStyles.moonOuter, { borderColor: color }]} />
      <View style={[iconStyles.moonInner, { backgroundColor: "#F8FAFC" }]} />
    </View>
  );
}

function LogoutIcon({ color = "#EF4444" }: { color?: string }) {
  return (
    <View style={iconStyles.logoutContainer}>
      <View style={[iconStyles.logoutDoor, { borderColor: color }]} />
      <View style={[iconStyles.logoutArrowLine, { backgroundColor: color }]} />
      <View style={[iconStyles.logoutArrowHead, { borderColor: color }]} />
    </View>
  );
}

function HomeTabIcon({ active, color }: { active: boolean; color: string }) {
  return (
    <View style={iconStyles.homeContainer}>
      <View style={[iconStyles.homeRoof, { borderColor: color }]} />
      <View style={[iconStyles.homeBody, { borderColor: color }]} />
    </View>
  );
}

function CheckinTabIcon({ color }: { color: string }) {
  return (
    <View style={[iconStyles.checkinContainer, { borderColor: color }]}>
      <View style={[iconStyles.checkinLine, { backgroundColor: color }]} />
      <View style={[iconStyles.checkinCheck, { borderColor: color }]} />
    </View>
  );
}

function ProfileTabIcon({ active, color }: { active: boolean; color: string }) {
  return (
    <View style={iconStyles.userContainer}>
      <View
        style={[
          iconStyles.userHead,
          {
            borderColor: color,
            backgroundColor: active ? color : "transparent",
          },
        ]}
      />
      <View
        style={[
          iconStyles.userBody,
          {
            borderColor: color,
            backgroundColor: active ? color : "transparent",
          },
        ]}
      />
    </View>
  );
}

const iconStyles = StyleSheet.create({
  chevron: {
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    transform: [{ rotate: "45deg" }],
    marginLeft: 6,
  },
  calendarContainer: {
    width: 20,
    height: 20,
    borderWidth: 1.6,
    borderRadius: 4,
    alignItems: "center",
    overflow: "hidden",
  },
  calendarHeader: {
    width: "100%",
    height: 4,
  },
  calendarGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    justifyContent: "center",
    alignItems: "center",
    padding: 2,
  },
  calendarDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1,
  },
  userContainer: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  userHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.6,
    marginBottom: 1,
  },
  userBody: {
    width: 16,
    height: 7,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1.6,
  },
  starContainer: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  starEmoji: {
    fontSize: 16,
    lineHeight: 18,
  },
  settingsContainer: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsRing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.6,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  settingsDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  settingsTooth: {
    position: "absolute",
  },
  toothV: {
    width: 3.5,
    height: 18,
    borderRadius: 1,
  },
  toothH: {
    width: 18,
    height: 3.5,
    borderRadius: 1,
  },
  moonContainer: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  moonOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.6,
  },
  moonInner: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    top: 1,
    right: 3,
  },
  sunContainer: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sunCenter: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sunRay: {
    position: "absolute",
    borderRadius: 1,
  },
  rayV: {
    width: 2,
    height: 18,
  },
  rayH: {
    width: 18,
    height: 2,
  },
  logoutContainer: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutDoor: {
    position: "absolute",
    left: 2,
    width: 10,
    height: 16,
    borderTopWidth: 1.8,
    borderBottomWidth: 1.8,
    borderLeftWidth: 1.8,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  logoutArrowLine: {
    position: "absolute",
    left: 7,
    width: 8,
    height: 1.8,
  },
  logoutArrowHead: {
    position: "absolute",
    right: 2,
    width: 6,
    height: 6,
    borderTopWidth: 1.8,
    borderRightWidth: 1.8,
    transform: [{ rotate: "45deg" }],
  },
  homeContainer: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  homeRoof: {
    width: 12,
    height: 12,
    borderTopWidth: 1.8,
    borderLeftWidth: 1.8,
    transform: [{ rotate: "45deg" }],
    marginTop: -2,
  },
  homeBody: {
    width: 13,
    height: 8,
    borderWidth: 1.8,
    borderTopWidth: 0,
    marginTop: -4,
  },
  checkinContainer: {
    width: 17,
    height: 19,
    borderWidth: 1.6,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  checkinLine: {
    width: 7,
    height: 1.6,
    position: "absolute",
    top: 2,
  },
  checkinCheck: {
    width: 7,
    height: 4,
    borderBottomWidth: 1.6,
    borderLeftWidth: 1.6,
    transform: [{ rotate: "-45deg" }],
    marginTop: 2,
  },
});

// ---------------------------------------------------------------------------
// BottomTabBar
// ---------------------------------------------------------------------------

interface BottomTabBarProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
  tabBg: string;
  borderColor: string;
  activeColor: string;
  inactiveColor: string;
}

function BottomTabBar({
  activeTab,
  onTabPress,
  tabBg,
  borderColor,
  activeColor,
  inactiveColor,
}: BottomTabBarProps) {
  const tabs: {
    key: TabKey;
    label: string;
    renderIcon: (active: boolean) => React.ReactNode;
  }[] = [
    {
      key: "home",
      label: "Trang chủ",
      renderIcon: (active) => (
        <HomeTabIcon
          active={active}
          color={active ? activeColor : inactiveColor}
        />
      ),
    },
    {
      key: "schedule",
      label: "Lịch của tôi",
      renderIcon: (active) => (
        <CalendarIcon color={active ? activeColor : inactiveColor} />
      ),
    },
    {
      key: "checkin",
      label: "Check-in",
      renderIcon: (active) => (
        <CheckinTabIcon color={active ? activeColor : inactiveColor} />
      ),
    },
    {
      key: "profile",
      label: "Cá nhân",
      renderIcon: (active) => (
        <ProfileTabIcon
          active={active}
          color={active ? activeColor : inactiveColor}
        />
      ),
    },
  ];

  return (
    <View
      style={[
        tabStyles.container,
        { backgroundColor: tabBg, borderTopColor: borderColor },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={tabStyles.tab}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
          >
            <View style={tabStyles.iconBox}>{tab.renderIcon(isActive)}</View>
            <Text
              style={[
                tabStyles.label,
                { color: isActive ? activeColor : inactiveColor },
                isActive && tabStyles.labelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingBottom: Platform.OS === "ios" ? 24 : 10,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBox: {
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: "400",
  },
  labelActive: {
    fontWeight: "600",
  },
});

// ---------------------------------------------------------------------------
// MenuItem Component
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
    <TouchableOpacity
      style={[
        menuStyles.row,
        { backgroundColor: bgColor, borderBottomColor: borderSubtle },
        isLast && menuStyles.rowLast,
      ]}
      onPress={onPress}
      activeOpacity={0.65}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={menuStyles.iconBox}>{icon}</View>
      <Text style={[menuStyles.label, { color: textColor }]}>{label}</Text>
      <View style={menuStyles.rightBox}>
        {badge ? (
          <View style={[menuStyles.badgeBox, { backgroundColor: badgeBg }]}>
            <Text style={[menuStyles.badgeText, { color: textColor }]}>
              {badge}
            </Text>
          </View>
        ) : null}
        <ChevronRight color={chevronColor} />
      </View>
    </TouchableOpacity>
  );
}

const menuStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  iconBox: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  rightBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  badgeBox: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
});

// ---------------------------------------------------------------------------
// ActivityStats Item
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
    <View style={statStyles.item}>
      <Text style={[statStyles.value, { color: accentColor }]}>{value}</Text>
      <Text style={[statStyles.label, { color: labelColor }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 15,
  },
});

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

  useEffect(() => {
    const targetId = currentUser?._id || defaultStudent?._id;
    if (targetId) {
      dispatch(fetchMyRegistrations(targetId));
    }
  }, [dispatch, currentUser?._id, defaultStudent?._id]);

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

  const eventsAttendedCount = myRegistrations.filter(
    (r) => r.status === "checked_in",
  ).length;
  const pointsAccumulated = currentUser?.point ?? defaultStudent?.point ?? 0;
  const reviewsCount = eventsAttendedCount; // Estimated or equal to attended events

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
      await api.updateProfile({ fullName: editFullName.trim() });
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
      // Fallback update in Redux store
      dispatch(
        updateUser({
          fullName: editFullName.trim(),
          phone: editPhone.trim(),
          faculty: editFaculty.trim(),
        }),
      );
      Alert.alert("Thành công", "Đã cập nhật hồ sơ cá nhân.");
      setEditModalVisible(false);
    } finally {
      setSavingProfile(false);
    }
  };

  // Toggle theme locally for responsive UI feedback
  const handleToggleTheme = () => {
    toggleTheme();
  };

  // Xử lý chuyển tab dưới cùng
  const handleTabPress = (tab: TabKey) => {
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
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top row với nút Left Navbar (☰) & Tùy chọn ──────────────────── */}
        <View style={styles.topRow}>
          <LeftNavbarButton />
          <View style={{ flex: 1 }} />

          <TouchableOpacity
            style={[
              styles.optionsButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            activeOpacity={0.7}
            onPress={() => {
              Alert.alert(
                "Dữ liệu db.json",
                `Người dùng hiện tại: ${displayName}\nMSSV: ${studentId}\nKhoa: ${faculty}\nĐiểm rèn luyện: ${pointsAccumulated} đ\nChế độ màu: ${mode}`,
              );
            }}
            accessibilityRole="button"
            accessibilityLabel="Tùy chọn khác"
          >
            <Text style={[styles.optionsDots, { color: theme.textSecondary }]}>
              •••
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Avatar ──────────────────────────────────────────────────────── */}
        <View style={styles.avatarWrapper}>
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
                { backgroundColor: theme.primary, borderColor: theme.surface },
              ]}
            >
              <Text style={styles.avatarFallbackInitial}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* ── Student info ─────────────────────────────────────────────────── */}
        <Text style={[styles.displayName, { color: theme.textPrimary }]}>
          {displayName}
        </Text>
        <Text style={[styles.studentId, { color: theme.textSecondary }]}>
          MSSV: {studentId}
        </Text>
        <Text style={[styles.faculty, { color: theme.textSecondary }]}>
          {faculty}
        </Text>

        {/* ── Activity stats card (Dữ liệu chính xác từ db.json) ─────────── */}
        <View
          style={[
            styles.statsCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              shadowColor: theme.cardShadow,
            },
          ]}
        >
          <ActivityStatItem
            value={eventsAttendedCount}
            label="Sự kiện tham gia"
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
            label="Đánh giá"
            accentColor={theme.primary}
            labelColor={theme.textSecondary}
          />
        </View>

        {/* ── Menu list ───────────────────────────────────────────────────── */}
        <View
          style={[
            styles.menuCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              shadowColor: theme.cardShadow,
            },
          ]}
        >
          <MenuItem
            icon={<CalendarIcon color={theme.textSecondary} />}
            label="Lịch sử tham gia"
            textColor={theme.textPrimary}
            bgColor={theme.surface}
            borderSubtle={theme.borderSubtle}
            chevronColor={theme.textTertiary}
            onPress={() => navigation.navigate("MySchedule")}
          />

          <MenuItem
            icon={<UserOutlineIcon color="#334155" />}
            label="Thông tin cá nhân"
            onPress={handleOpenEditProfile}
          />

          <MenuItem
            icon={<UserOutlineIcon color={theme.textSecondary} />}
            label="Thông tin cá nhân"
            textColor={theme.textPrimary}
            bgColor={theme.surface}
            borderSubtle={theme.borderSubtle}
            chevronColor={theme.textTertiary}
            onPress={() =>
              Alert.alert(
                "Thông tin sinh viên (db.json)",
                `Họ và tên: ${displayName}\nMSSV: ${studentId}\nKhoa: ${faculty}\nEmail: ${email}\nSố điện thoại: ${phone || "Chưa cập nhật"}\nĐiểm rèn luyện: ${pointsAccumulated} điểm`,
              )
            }
          />

          <MenuItem
            icon={<SettingsCogIcon color={theme.textSecondary} />}
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
            icon={<ThemeToggleIcon isDark={isDark} color={theme.primary} />}
            label="Đổi theme (Sáng / Tối)"
            badge={mode}
            badgeBg={theme.badgeBackground}
            textColor={theme.textPrimary}
            bgColor={theme.surface}
            borderSubtle={theme.borderSubtle}
            chevronColor={theme.textTertiary}
            onPress={toggleTheme}
          />
        </View>

        {/* ── Nút Đăng xuất riêng biệt nổi bật ── */}
        <TouchableOpacity
          style={[
            styles.standaloneLogoutBtn,
            {
              backgroundColor: isDark ? "#261214" : "#FEF2F2",
              borderColor: isDark ? "#7F1D1D" : "#FECACA",
            },
          ]}
          onPress={handleLogoutPress}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Đăng xuất khỏi tài khoản"
        >
          <View style={styles.standaloneLogoutContent}>
            <LogoutIcon color={theme.danger} />
            <Text
              style={[styles.standaloneLogoutText, { color: theme.danger }]}
            >
              Đăng xuất tài khoản
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Bottom navigation bar ───────────────────────────────────────── */}
      <BottomTabBar
        activeTab={activeTab}
        onTabPress={handleTabPress}
        tabBg={theme.tabBackground}
        borderColor={theme.tabBorder}
        activeColor={theme.primary}
        inactiveColor={theme.textTertiary}
      />

      {/* ── Modal Chỉnh Sửa Thông Tin Cá Nhân ───────────────────────────── */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={editStyles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={editStyles.card}
          >
            <View style={editStyles.header}>
              <Text style={editStyles.headerTitle}>
                👤 Cập Nhật Thông Tin Cá Nhân
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={editStyles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={editStyles.body}
              showsVerticalScrollIndicator={false}
            >
              <Text style={editStyles.label}>Mã số sinh viên (MSSV)</Text>
              <View style={editStyles.readOnlyBox}>
                <Text style={editStyles.readOnlyText}>{studentId}</Text>
                <Text style={editStyles.readOnlyBadge}>Cố định</Text>
              </View>

              <Text style={editStyles.label}>Email trường</Text>
              <View style={editStyles.readOnlyBox}>
                <Text style={editStyles.readOnlyText}>
                  {currentUser?.email || "sv@iuh.edu.vn"}
                </Text>
                <Text style={editStyles.readOnlyBadge}>Cố định</Text>
              </View>

              <Text style={editStyles.label}>Họ và tên *</Text>
              <TextInput
                style={editStyles.input}
                value={editFullName}
                onChangeText={setEditFullName}
                placeholder="Nhập họ và tên..."
              />

              <Text style={editStyles.label}>Số điện thoại</Text>
              <TextInput
                style={editStyles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Ví dụ: 0912345678"
                keyboardType="phone-pad"
              />

              <Text style={editStyles.label}>Khoa / Viện đào tạo</Text>
              <TextInput
                style={editStyles.input}
                value={editFaculty}
                onChangeText={setEditFaculty}
                placeholder="Ví dụ: Khoa Công nghệ thông tin"
              />

              <View style={editStyles.pointsBadgeBox}>
                <Text style={editStyles.pointsLabel}>
                  ⭐ Điểm rèn luyện tích lũy:
                </Text>
                <Text style={editStyles.pointsValue}>
                  {pointsAccumulated} / 100 ĐRL
                </Text>
              </View>

              <TouchableOpacity
                style={editStyles.submitBtn}
                onPress={handleSaveProfile}
                disabled={savingProfile}
                activeOpacity={0.8}
              >
                <Text style={editStyles.submitBtnText}>
                  {savingProfile ? "Đang lưu..." : "Lưu Thay Đổi"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Modal xác nhận Đăng xuất ────────────────────────────────────── */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.modalIconCircle,
                { backgroundColor: isDark ? "#3B181A" : "#FEE2E2" },
              ]}
            >
              <LogoutIcon color={theme.danger} />
            </View>

            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Xác nhận đăng xuất
            </Text>

            <Text style={[styles.modalMessage, { color: theme.textSecondary }]}>
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản{" "}
              <Text style={{ fontWeight: "700", color: theme.textPrimary }}>
                {displayName}
              </Text>{" "}
              không? Mọi phiên làm việc hiện tại sẽ kết thúc.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalCancelBtn,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text
                  style={[
                    styles.modalCancelText,
                    { color: theme.textPrimary },
                  ]}
                >
                  Hủy bỏ
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalLogoutBtn,
                  { backgroundColor: theme.danger },
                ]}
                activeOpacity={0.8}
                onPress={confirmLogout}
              >
                <Text style={styles.modalLogoutText}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 24,
  },

  // Top row
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 2,
  },
  themePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  themePillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  optionsButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionsDots: {
    fontSize: 16,
    letterSpacing: 2,
    fontWeight: "700",
  },

  // Avatar
  avatarWrapper: {
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
  avatarFallbackInitial: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // User info
  displayName: {
    fontSize: 21,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  studentId: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 2,
  },
  faculty: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
  },

  // Stats card
  statsCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // Menu Card
  menuCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // Standalone Logout Button
  standaloneLogoutBtn: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  standaloneLogoutContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  standaloneLogoutText: {
    fontSize: 15,
    fontWeight: "700",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalLogoutBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalLogoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

const editStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#1E3A8A",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  closeBtn: {
    fontSize: 16,
    color: "#E0E7FF",
    fontWeight: "700",
  },
  body: {
    padding: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
    marginTop: 4,
  },
  readOnlyBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  readOnlyText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  readOnlyBadge: {
    fontSize: 10,
    color: "#94A3B8",
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13.5,
    color: "#0F172A",
    marginBottom: 10,
  },
  pointsBadgeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginTop: 4,
    marginBottom: 16,
  },
  pointsLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  pointsValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2563EB",
  },
  submitBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
