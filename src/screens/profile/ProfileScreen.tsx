import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';

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
  displayName: 'Nguyễn Văn A',
  studentId: '23123456',
  faculty: 'Khoa Công nghệ thông tin',
  avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&q=80',
  stats: {
    eventsAttended: 12,
    pointsAccumulated: 120,
    reviews: 5,
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
    <TouchableOpacity
      style={[menuStyles.row, isLast && menuStyles.rowLast]}
      onPress={onPress}
      activeOpacity={0.65}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
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

// ---------------------------------------------------------------------------
// ActivityStats Item
// ---------------------------------------------------------------------------

interface ActivityStatItemProps {
  value: number;
  label: string;
}

function ActivityStatItem({ value, label }: ActivityStatItemProps) {
  return (
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

// ---------------------------------------------------------------------------
// ProfileScreen
// ---------------------------------------------------------------------------

export default function ProfileScreen({
  profile = DEFAULT_PROFILE,
  initialTheme = 'Sáng',
  initialTab = 'profile',
}: ProfileScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [currentTheme, setCurrentTheme] = useState<'Sáng' | 'Tối'>(initialTheme);
  const [imageError, setImageError] = useState<boolean>(false);

  // Toggle theme locally for responsive UI feedback
  const handleToggleTheme = () => {
    setCurrentTheme((prev) => (prev === 'Sáng' ? 'Tối' : 'Sáng'));
  };

  // Wire up bottom tab navigation
  const handleTabPress = (tab: TabKey) => {
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

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top row with options button ─────────────────────────────────── */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.optionsButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Tùy chọn khác"
          >
            <Text style={styles.optionsDots}>•••</Text>
          </TouchableOpacity>
        </View>

        {/* ── Avatar ──────────────────────────────────────────────────────── */}
        <View style={styles.avatarWrapper}>
          {profile.avatarUrl && !imageError ? (
            <Image
              source={{ uri: profile.avatarUrl }}
              style={styles.avatarImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
              accessible
              accessibilityLabel={`Ảnh đại diện của ${profile.displayName}`}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackInitial}>
                {profile.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* ── Student info ─────────────────────────────────────────────────── */}
        <Text style={styles.displayName}>{profile.displayName}</Text>
        <Text style={styles.studentId}>MSSV: {profile.studentId}</Text>
        <Text style={styles.faculty}>{profile.faculty}</Text>

        {/* ── Activity stats card ─────────────────────────────────────────── */}
        <View style={styles.statsCard}>
          <ActivityStatItem
            value={profile.stats.eventsAttended}
            label="Sự kiện tham gia"
          />
          <ActivityStatItem
            value={profile.stats.pointsAccumulated}
            label="Điểm tích lũy"
          />
          <ActivityStatItem
            value={profile.stats.reviews}
            label="Đánh giá"
          />
        </View>

        {/* ── Menu list ───────────────────────────────────────────────────── */}
        <View style={styles.menuCard}>
          <MenuItem
            icon={<CalendarIcon color="#334155" />}
            label="Lịch sử tham gia"
            onPress={() => navigation.navigate('MySchedule')}
          />
          <MenuItem
            icon={<UserOutlineIcon color="#334155" />}
            label="Thông tin cá nhân"
            onPress={() => Alert.alert('Thông tin cá nhân', 'Tính năng đang được phát triển.')}
          />
          <MenuItem
            icon={<SettingsCogIcon color="#334155" />}
            label="Cài đặt"
            onPress={() => Alert.alert('Cài đặt', 'Tính năng đang được phát triển.')}
          />
          <MenuItem
            icon={<MoonCrescentIcon color="#334155" />}
            label="Đổi theme"
            badge={currentTheme}
            onPress={handleToggleTheme}
          />
          <MenuItem
            icon={<LogoutIcon color={DANGER_COLOR} />}
            label="Đăng xuất"
            isLast
            onPress={() =>
              Alert.alert(
                'Đăng xuất',
                'Bạn có chắc muốn đăng xuất khỏi tài khoản không?',
                [
                  { text: 'Hủy', style: 'cancel' },
                  { text: 'Đăng xuất', style: 'destructive', onPress: () => navigation.navigate('Home') },
                ]
              )
            }
          />
        </View>
      </ScrollView>

      {/* ── Bottom navigation bar ───────────────────────────────────────── */}
      <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  scroll: {
    paddingBottom: 24,
  },

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
  avatarImage: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#E2E8F0',
    borderWidth: 2,
    borderColor: BACKGROUND,
  },
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
});
