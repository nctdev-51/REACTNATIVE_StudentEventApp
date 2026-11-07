<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from 'react';
=======
import React, { useState, useEffect, useCallback } from "react";
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
import {
  Image,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
  Modal,
  KeyboardAvoidingView,
<<<<<<< HEAD
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout, updateUser } from '../../features/auth/authSlice';
import { fetchMyRegistrations } from '../../features/check-in/registrationsSlice';
import api from '../../services/api';
import LeftNavbarButton from '../../components/navigation/LeftNavbarButton';
=======
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
<<<<<<< HEAD
import { getDefaultDbUser } from "../../data/dbService";
<<<<<<< HEAD
>>>>>>> e79c48e (abc)
=======
import {
  getDefaultDbUser,
  getUserStatsFromDb,
  loadFeedbacksFromStorage,
  findDbEvent,
} from "../../data/dbService";
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
=======
import { Ionicons } from "@expo/vector-icons";
>>>>>>> 42418ae (feat: enhance event registration handling and UI components for better user experience)

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
  stats: ActivityStats;
}

export type TabKey = 'home' | 'schedule' | 'checkin' | 'profile';

export interface ProfileScreenProps {
  profile?: UserProfile;
  initialTheme?: 'Sáng' | 'Tối';
  initialTab?: TabKey;
}

// ---------------------------------------------------------------------------
<<<<<<< HEAD
// Constants
// ---------------------------------------------------------------------------

const ACCENT_COLOR = '#2563EB';
const BACKGROUND = '#FFFFFF';
const SCREEN_BG = '#F8FAFC'; // Clean off-white background
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const BORDER_COLOR = '#F1F5F9';
const DANGER_COLOR = '#EF4444';

const DEFAULT_PROFILE: UserProfile = {
  displayName: 'Sinh viên IUH',
  studentId: 'Chưa cập nhật',
  faculty: 'Trường Đại học Công nghiệp TP.HCM',
  avatarUrl: undefined,
  stats: {
    eventsAttended: 0,
    pointsAccumulated: 0,
    reviews: 0,
  },
};

// ---------------------------------------------------------------------------
// Vector-style Custom Icons (Using pure React Native Views)
// ---------------------------------------------------------------------------

/** Chevron arrow (right pointing) */
function ChevronRight() {
  return <View style={iconStyles.chevron} />;
}

/** Calendar Icon (outline with binder loops) */
function CalendarIcon({ color = '#475569' }: { color?: string }) {
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

/** User Profile Outline Icon */
function UserOutlineIcon({ color = '#475569' }: { color?: string }) {
  return (
    <View style={iconStyles.userContainer}>
      <View style={[iconStyles.userHead, { borderColor: color }]} />
      <View style={[iconStyles.userBody, { borderColor: color }]} />
    </View>
  );
}

/** Settings Cog Icon */
function SettingsCogIcon({ color = '#475569' }: { color?: string }) {
  return (
    <View style={iconStyles.settingsContainer}>
      <View style={[iconStyles.settingsRing, { borderColor: color }]}>
        <View style={[iconStyles.settingsDot, { backgroundColor: color }]} />
      </View>
      <View style={[iconStyles.settingsTooth, iconStyles.toothV, { backgroundColor: color }]} />
      <View style={[iconStyles.settingsTooth, iconStyles.toothH, { backgroundColor: color }]} />
    </View>
  );
}

/** Moon Crescent Icon */
function MoonCrescentIcon({ color = '#475569' }: { color?: string }) {
  return (
    <View style={iconStyles.moonContainer}>
      <View style={[iconStyles.moonOuter, { borderColor: color }]} />
      <View style={iconStyles.moonInner} />
    </View>
  );
}

/** Logout Door & Arrow Icon */
function LogoutIcon({ color = DANGER_COLOR }: { color?: string }) {
  return (
    <View style={iconStyles.logoutContainer}>
      <View style={[iconStyles.logoutDoor, { borderColor: color }]} />
      <View style={[iconStyles.logoutArrowLine, { backgroundColor: color }]} />
      <View style={[iconStyles.logoutArrowHead, { borderColor: color }]} />
    </View>
  );
}

/** Home Tab Icon */
function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? ACCENT_COLOR : '#94A3B8';
  return (
    <View style={iconStyles.homeContainer}>
      <View style={[iconStyles.homeRoof, { borderColor: color }]} />
      <View style={[iconStyles.homeBody, { borderColor: color }]} />
    </View>
  );
}

/** Check-in Ticket Tab Icon */
function CheckinTabIcon({ active }: { active: boolean }) {
  const color = active ? ACCENT_COLOR : '#94A3B8';
  return (
    <View style={[iconStyles.checkinContainer, { borderColor: color }]}>
      <View style={[iconStyles.checkinLine, { backgroundColor: color }]} />
      <View style={[iconStyles.checkinCheck, { borderColor: color }]} />
    </View>
  );
}

/** Profile Tab Icon */
function ProfileTabIcon({ active }: { active: boolean }) {
  const color = active ? ACCENT_COLOR : '#94A3B8';
  return (
    <View style={iconStyles.userContainer}>
      <View
        style={[
          iconStyles.userHead,
          { borderColor: color, backgroundColor: active ? color : 'transparent' },
        ]}
      />
      <View
        style={[
          iconStyles.userBody,
          { borderColor: color, backgroundColor: active ? color : 'transparent' },
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
    borderColor: '#94A3B8',
    transform: [{ rotate: '45deg' }],
    marginLeft: 6,
  },
  // Calendar
  calendarContainer: {
    width: 20,
    height: 20,
    borderWidth: 1.6,
    borderRadius: 4,
    alignItems: 'center',
    overflow: 'hidden',
  },
  calendarHeader: {
    width: '100%',
    height: 4,
  },
  calendarGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  calendarDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1,
  },
  // User
  userContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  // Settings
  settingsContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsRing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.6,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  settingsDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  settingsTooth: {
    position: 'absolute',
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
  // Moon
  moonContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moonOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.6,
  },
  moonInner: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: BACKGROUND,
    top: 1,
    right: 3,
  },
  // Logout
  logoutContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutDoor: {
    position: 'absolute',
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
    position: 'absolute',
    left: 7,
    width: 8,
    height: 1.8,
  },
  logoutArrowHead: {
    position: 'absolute',
    right: 2,
    width: 6,
    height: 6,
    borderTopWidth: 1.8,
    borderRightWidth: 1.8,
    transform: [{ rotate: '45deg' }],
  },
  // Home
  homeContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeRoof: {
    width: 12,
    height: 12,
    borderTopWidth: 1.8,
    borderLeftWidth: 1.8,
    transform: [{ rotate: '45deg' }],
    marginTop: -2,
  },
  homeBody: {
    width: 13,
    height: 8,
    borderWidth: 1.8,
    borderTopWidth: 0,
    marginTop: -4,
  },
  // Check-in
  checkinContainer: {
    width: 17,
    height: 19,
    borderWidth: 1.6,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinLine: {
    width: 7,
    height: 1.6,
    position: 'absolute',
    top: 2,
  },
  checkinCheck: {
    width: 7,
    height: 4,
    borderBottomWidth: 1.6,
    borderLeftWidth: 1.6,
    transform: [{ rotate: '-45deg' }],
    marginTop: 2,
  },
});

// ---------------------------------------------------------------------------
// BottomTabBar
// ---------------------------------------------------------------------------

interface BottomTabBarProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  const tabs: { key: TabKey; label: string; renderIcon: (active: boolean) => React.ReactNode }[] = [
    {
      key: 'home',
      label: 'Trang chủ',
      renderIcon: (active) => <HomeTabIcon active={active} />,
    },
    {
      key: 'schedule',
      label: 'Lịch của tôi',
      renderIcon: (active) => <CalendarIcon color={active ? ACCENT_COLOR : '#94A3B8'} />,
    },
    {
      key: 'checkin',
      label: 'Check-in',
      renderIcon: (active) => <CheckinTabIcon active={active} />,
    },
    {
      key: 'profile',
      label: 'Cá nhân',
      renderIcon: (active) => <ProfileTabIcon active={active} />,
    },
  ];

  return (
    <View style={tabStyles.container}>
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
            <Text style={[tabStyles.label, isActive && tabStyles.labelActive]}>
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
    flexDirection: 'row',
    backgroundColor: BACKGROUND,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '400',
  },
  labelActive: {
    color: ACCENT_COLOR,
    fontWeight: '600',
  },
});

// ---------------------------------------------------------------------------
// MenuItem Component
=======
// MenuItem Component (Tamagui based)
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
// ---------------------------------------------------------------------------

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  isLast?: boolean;
  onPress?: () => void;
}

function MenuItem({ icon, label, badge, isLast = false, onPress }: MenuItemProps) {
  return (
<<<<<<< HEAD
    <TouchableOpacity
      style={[menuStyles.row, isLast && menuStyles.rowLast]}
=======
    <XStack
      alignItems="center"
      paddingVertical={14}
      paddingHorizontal={16}
      backgroundColor={bgColor}
      borderBottomWidth={isLast ? 0 : 1}
      borderBottomColor={borderSubtle}
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
      onPress={onPress}
      pressStyle={{ opacity: 0.7 }}
      cursor="pointer"
      accessibilityRole="button"
      accessibilityLabel={label}
    >
<<<<<<< HEAD
      <View style={menuStyles.iconBox}>{icon}</View>
      <Text style={menuStyles.label}>{label}</Text>
      <View style={menuStyles.rightBox}>
        {badge ? <Text style={menuStyles.badgeText}>{badge}</Text> : null}
        <ChevronRight />
      </View>
    </TouchableOpacity>
  );
}

const menuStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: BACKGROUND,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  iconBox: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: TEXT_PRIMARY,
    fontWeight: '500',
  },
  rightBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 4,
  },
});

=======
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

>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
// ---------------------------------------------------------------------------
// ActivityStats Item (Tamagui based)
// ---------------------------------------------------------------------------

interface ActivityStatItemProps {
  value: number;
  label: string;
}

function ActivityStatItem({ value, label }: ActivityStatItemProps) {
  return (
<<<<<<< HEAD
    <View style={statStyles.item}>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: ACCENT_COLOR,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 15,
  },
});

=======
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

>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
// ---------------------------------------------------------------------------
// ProfileScreen
// ---------------------------------------------------------------------------

export default function ProfileScreen({
  profile = DEFAULT_PROFILE,
  initialTheme = 'Sáng',
  initialTab = 'profile',
}: ProfileScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const dispatch = useAppDispatch();

  const currentUser = useAppSelector((state) => state.auth.user);
<<<<<<< HEAD
  const myRegistrations = useAppSelector((state) => state.registrations.myRegistrations);
=======
  const myRegistrations = useAppSelector(
    (state) => state.registrations.myRegistrations,
  );
  const eventsList = useAppSelector((state) => state.events.list);
>>>>>>> e99db1b (feat: cap nhat font trang ca nhan & feedback, sua hien thi QR admin va tinh dong diem ren luyen tich luy)

  const defaultStudent = getDefaultDbUser();
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [currentTheme, setCurrentTheme] = useState<'Sáng' | 'Tối'>(initialTheme);
  const [imageError, setImageError] = useState<boolean>(false);

  // Edit Profile Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
<<<<<<< HEAD
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editFaculty, setEditFaculty] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (currentUser?._id) {
      dispatch(fetchMyRegistrations(currentUser._id));
    }
  }, [dispatch, currentUser?._id]);
=======
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
<<<<<<< HEAD
<<<<<<< HEAD
  }, [dispatch, currentUser?._id, defaultStudent?._id]);
>>>>>>> e79c48e (abc)
=======
  }, [targetUserId, defaultStudent?._id]);
=======
  }, [targetUserId, currentUser?.studentId, defaultStudent?._id, defaultStudent?.studentId]);
>>>>>>> e99db1b (feat: cap nhat font trang ca nhan & feedback, sua hien thi QR admin va tinh dong diem ren luyen tich luy)

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
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)

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

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
  const eventsAttendedCount = myRegistrations.filter((r) => r.status === 'checked_in').length;
  const pointsAccumulated = currentUser?.point ?? 0;
  const reviewsCount = eventsAttendedCount; // Estimated or equal to attended events

  const handleOpenEditProfile = () => {
    setEditFullName(currentUser?.fullName || '');
    setEditPhone(currentUser?.phone || '0912345678');
    setEditFaculty(currentUser?.faculty || 'Khoa Công nghệ thông tin');
=======
  const eventsAttendedCount = myRegistrations.filter(
    (r) => r.status === "checked_in",
=======
  const registeredAttended = myRegistrations.filter(
    (r) => r.status === "checked_in" || (r.status as string) === "completed",
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
  ).length;
=======
  const attendedRegistrations = myRegistrations.filter(
    (r) => r.status === "checked_in" || (r.status as string) === "completed",
  );
  const registeredAttended = attendedRegistrations.length;
>>>>>>> e99db1b (feat: cap nhat font trang ca nhan & feedback, sua hien thi QR admin va tinh dong diem ren luyen tich luy)
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
>>>>>>> e79c48e (abc)
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editFullName.trim()) {
      Alert.alert('Lỗi', 'Họ tên không được để trống.');
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
        })
      );
      Alert.alert('Thành công', 'Thông tin cá nhân đã được lưu thành công.');
      setEditModalVisible(false);
    } catch (err: any) {
<<<<<<< HEAD
      // Fallback update in Redux store
      dispatch(
        updateUser({
          fullName: editFullName.trim(),
          phone: editPhone.trim(),
          faculty: editFaculty.trim(),
        })
      );
      Alert.alert('Thành công', 'Đã cập nhật hồ sơ cá nhân.');
      setEditModalVisible(false);
=======
      Alert.alert(
        "Không thể lưu hồ sơ",
        err?.response?.data?.message ??
          err?.message ??
          "Kiểm tra kết nối mạng và thử lại.",
      );
>>>>>>> 92595a1 (feat(auth): implement session hydration and async storage for authentication)
    } finally {
      setSavingProfile(false);
    }
  };

<<<<<<< HEAD
  // Toggle theme locally for responsive UI feedback
  const handleToggleTheme = () => {
<<<<<<< HEAD
    setCurrentTheme((prev) => (prev === 'Sáng' ? 'Tối' : 'Sáng'));
=======
    toggleTheme();
>>>>>>> e79c48e (abc)
  };

<<<<<<< HEAD
  // Wire up bottom tab navigation
  const handleTabPress = (tab: TabKey) => {
=======
=======
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
  // Xử lý chuyển tab dưới cùng
  const handleTabPress = (tab: AppTabKey) => {
>>>>>>> 3fca7b4 (feat: integrate bottom tab navigation and enhance QR scanner functionality)
    setActiveTab(tab);
    switch (tab) {
      case 'home':
        navigation.navigate('Home');
        break;
      case 'schedule':
        navigation.navigate('MySchedule');
        break;
      case 'checkin':
        navigation.navigate('CheckIn');
        break;
      case 'profile':
        // Already on profile, do nothing
        break;
    }
  };

  // Logout handler
  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất khỏi tài khoản không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.logout();
            } catch (err) {
              // Ignore logout network error
            }
            dispatch(logout());
          },
        },
      ]
    );
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
<<<<<<< HEAD
        {/* ── Top row với nút Left Navbar (☰) & Tùy chọn ──────────────────── */}
        <View style={styles.topRow}>
          <LeftNavbarButton />
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.optionsButton}
            activeOpacity={0.7}
<<<<<<< HEAD
=======
=======
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
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
            onPress={() => {
              Alert.alert(
                "Thông tin tài khoản",
                `Người dùng hiện tại: ${displayName}\nMSSV: ${studentId}\nKhoa: ${faculty}\nĐiểm rèn luyện: ${pointsAccumulated} đ\nChế độ màu: ${mode}`,
              );
            }}
>>>>>>> c4f94b6 (Refactor check-in screens to enhance UI and UX with theme support)
            accessibilityRole="button"
            accessibilityLabel="Tùy chọn khác"
          >
<<<<<<< HEAD
            <Text style={styles.optionsDots}>•••</Text>
          </TouchableOpacity>
        </View>
=======
            <Ionicons
              name="ellipsis-horizontal"
              size={18}
              color={theme.textSecondary}
            />
          </Button>
        </XStack>
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)

        {/* ── Avatar ──────────────────────────────────────────────────────── */}
        <YStack alignItems="center" marginTop={8} marginBottom={12}>
          {avatarUrl && !imageError ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
              accessible
              accessibilityLabel={`Ảnh đại diện của ${displayName}`}
            />
          ) : (
<<<<<<< HEAD
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackInitial}>
=======
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
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
                {displayName.charAt(0).toUpperCase()}
              </TamaguiText>
            </YStack>
          )}
        </YStack>

        {/* ── Student info ─────────────────────────────────────────────────── */}
<<<<<<< HEAD
        <Text style={styles.displayName}>{displayName}</Text>
        <Text style={styles.studentId}>MSSV: {studentId}</Text>
        <Text style={styles.faculty}>{faculty}</Text>

        {/* ── Activity stats card ─────────────────────────────────────────── */}
        <View style={styles.statsCard}>
          <ActivityStatItem
            value={eventsAttendedCount}
            label="Sự kiện tham gia"
          />
          <ActivityStatItem
            value={pointsAccumulated}
            label="Điểm tích lũy"
          />
          <ActivityStatItem
            value={reviewsCount}
            label="Đánh giá"
          />
        </View>

        {/* ── Menu list ───────────────────────────────────────────────────── */}
        <View style={styles.menuCard}>
          <MenuItem
            icon={<CalendarIcon color="#334155" />}
=======
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
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
            label="Lịch sử tham gia"
            onPress={() => navigation.navigate('MySchedule')}
          />
          <MenuItem
<<<<<<< HEAD
            icon={<UserOutlineIcon color="#334155" />}
            label="Thông tin cá nhân"
            onPress={handleOpenEditProfile}
          />
          <MenuItem
<<<<<<< HEAD
            icon={<SettingsCogIcon color="#334155" />}
            label="Cài đặt"
            onPress={() => Alert.alert('Cài đặt', 'Cài đặt ứng dụng')}
=======
            icon={<UserOutlineIcon color={theme.textSecondary} />}
=======
            icon={
              <Ionicons
                name="person-outline"
                size={20}
                color={theme.textSecondary}
              />
            }
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
            label="Thông tin cá nhân"
            textColor={theme.textPrimary}
            bgColor={theme.surface}
            borderSubtle={theme.borderSubtle}
            chevronColor={theme.textTertiary}
<<<<<<< HEAD
            onPress={() =>
              Alert.alert(
                "Thông tin sinh viên",
                `Họ và tên: ${displayName}\nMSSV: ${studentId}\nKhoa: ${faculty}\nEmail: ${email}\nSố điện thoại: ${phone || "Chưa cập nhật"}\nĐiểm rèn luyện: ${pointsAccumulated} điểm`,
              )
            }
>>>>>>> c4f94b6 (Refactor check-in screens to enhance UI and UX with theme support)
=======
            onPress={handleOpenEditProfile}
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
          />
          <MenuItem
<<<<<<< HEAD
            icon={<MoonCrescentIcon color="#334155" />}
            label="Đổi theme"
            badge={currentTheme}
            onPress={handleToggleTheme}
=======
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
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
          />
          <MenuItem
<<<<<<< HEAD
            icon={<LogoutIcon color={DANGER_COLOR} />}
            label="Đăng xuất"
            isLast
            onPress={handleLogout}
          />
        </View>
=======
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
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
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
<<<<<<< HEAD
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={editStyles.card}
          >
            <View style={editStyles.header}>
<<<<<<< HEAD
              <Text style={editStyles.headerTitle}>👤 Cập Nhật Thông Tin Cá Nhân</Text>
=======
              <View style={editStyles.iconTitle}><Ionicons name="person-outline" size={22} color="#0F172A" /><Text style={editStyles.headerTitle}>Cập Nhật Thông Tin Cá Nhân</Text></View>
>>>>>>> 42418ae (feat: enhance event registration handling and UI components for better user experience)
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView style={editStyles.body} showsVerticalScrollIndicator={false}>
              <Text style={editStyles.label}>Mã số sinh viên (MSSV)</Text>
              <View style={editStyles.readOnlyBox}>
                <Text style={editStyles.readOnlyText}>{studentId}</Text>
                <Text style={editStyles.readOnlyBadge}>Cố định</Text>
              </View>

              <Text style={editStyles.label}>Email trường</Text>
              <View style={editStyles.readOnlyBox}>
                <Text style={editStyles.readOnlyText}>{currentUser?.email || 'sv@iuh.edu.vn'}</Text>
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
                <Text style={editStyles.pointsLabel}>⭐ Điểm rèn luyện tích lũy:</Text>
                <Text style={editStyles.pointsValue}>{pointsAccumulated} / 100 ĐRL</Text>
              </View>

              <TouchableOpacity
                style={editStyles.submitBtn}
                onPress={handleSaveProfile}
                disabled={savingProfile}
                activeOpacity={0.8}
              >
                <Text style={editStyles.submitBtnText}>
                  {savingProfile ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
=======
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
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
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
    backgroundColor: SCREEN_BG,
  },
  scroll: {
    paddingBottom: 24,
  },
<<<<<<< HEAD

  // Top row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 2,
  },
  optionsButton: {
    padding: 6,
  },
  optionsDots: {
    fontSize: 18,
    color: '#64748B',
    letterSpacing: 2,
    fontWeight: '700',
  },

  // Avatar
  avatarWrapper: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
=======
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
  avatarImage: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#E2E8F0',
    borderWidth: 2,
    borderColor: BACKGROUND,
  },
<<<<<<< HEAD
  avatarFallback: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: ACCENT_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BACKGROUND,
  },
  avatarFallbackInitial: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // User info
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 4,
  },
  studentId: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 2,
  },
  faculty: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 20,
  },

  // Stats card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: BACKGROUND,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },

  // Menu Card
  menuCard: {
    backgroundColor: BACKGROUND,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1.5,
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1E3A8A',
  },
  iconTitle: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    fontSize: 16,
    color: '#E0E7FF',
    fontWeight: '700',
=======
});

const editStyles = StyleSheet.create({
  keyboardWrap: {
    width: "100%",
    alignItems: "center",
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
  },
  body: {
    padding: 16,
  },
<<<<<<< HEAD
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 4,
  },
  readOnlyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  readOnlyText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  readOnlyBadge: {
    fontSize: 10,
    color: '#94A3B8',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13.5,
    color: '#0F172A',
    marginBottom: 10,
  },
  pointsBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 4,
    marginBottom: 16,
  },
  pointsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  pointsValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
=======
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
});
