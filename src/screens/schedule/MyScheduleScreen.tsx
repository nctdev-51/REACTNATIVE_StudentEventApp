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

export type ScheduleTabFilter = 'upcoming' | 'past';

export interface RegisteredEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  imageUrl: string;
  daysLeft?: number;
  status: ScheduleTabFilter;
}

export type TabKey = 'home' | 'schedule' | 'checkin' | 'profile';

export interface MyScheduleScreenProps {
  events?: RegisteredEvent[];
  initialFilter?: ScheduleTabFilter;
  initialTab?: TabKey;
  onEventPress?: (event: RegisteredEvent) => void;
  onFilterPress?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT_COLOR = '#2563EB';
const BACKGROUND = '#FFFFFF';
const SCREEN_BG = '#F8FAFC';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const BORDER_COLOR = '#F1F5F9';
const BADGE_BG = '#FEF3C7';
const BADGE_TEXT = '#D97706';

const DEFAULT_EVENTS: RegisteredEvent[] = [
  {
    id: '1',
    title: 'Workshop React Native',
    date: '20/09/2026',
    time: '08:00',
    location: 'Hội trường A',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&q=80',
    daysLeft: 2,
    status: 'upcoming',
  },
  {
    id: '2',
    title: 'Ngày hội việc làm sinh viên',
    date: '22/09/2026',
    time: '08:30',
    location: 'Sân trường',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80',
    daysLeft: 4,
    status: 'upcoming',
  },
  {
    id: '3',
    title: 'Seminar kỹ năng thuyết trình',
    date: '25/09/2026',
    time: '13:30',
    location: 'Phòng B201',
    imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&q=80',
    daysLeft: 7,
    status: 'upcoming',
  },
];

// ---------------------------------------------------------------------------
// Vector-style Custom Icons (Using pure React Native Views)
// ---------------------------------------------------------------------------

/** Filter / Sliders Icon */
function FilterIcon({ color = '#1E293B' }: { color?: string }) {
  return (
    <View style={iconStyles.filterContainer}>
      <View style={[iconStyles.filterLine, { backgroundColor: color, top: 4 }]} />
      <View style={[iconStyles.filterDot, { borderColor: color, top: 1.5, left: 3 }]} />

      <View style={[iconStyles.filterLine, { backgroundColor: color, top: 11 }]} />
      <View style={[iconStyles.filterDot, { borderColor: color, top: 8.5, right: 3 }]} />

      <View style={[iconStyles.filterLine, { backgroundColor: color, top: 18 }]} />
      <View style={[iconStyles.filterDot, { borderColor: color, top: 15.5, left: 5 }]} />
    </View>
  );
}

/** Clock / Time Outline Icon */
function ClockIcon({ color = TEXT_SECONDARY }: { color?: string }) {
  return (
    <View style={[iconStyles.clockCircle, { borderColor: color }]}>
      <View style={[iconStyles.clockHourHand, { backgroundColor: color }]} />
      <View style={[iconStyles.clockMinuteHand, { backgroundColor: color }]} />
    </View>
  );
}

/** Location Pin Icon */
function LocationPinIcon({ color = TEXT_SECONDARY }: { color?: string }) {
  return (
    <View style={iconStyles.locationContainer}>
      <View style={[iconStyles.pinHead, { borderColor: color }]} />
      <View style={[iconStyles.pinPoint, { borderTopColor: color }]} />
    </View>
  );
}

/** Calendar Icon for Bottom Navigation */
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
  // Filter
  filterContainer: {
    width: 22,
    height: 22,
    position: 'relative',
    justifyContent: 'center',
  },
  filterLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1.8,
    borderRadius: 1,
  },
  filterDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1.8,
    backgroundColor: BACKGROUND,
  },
  // Clock
  clockCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockHourHand: {
    position: 'absolute',
    width: 1.4,
    height: 4,
    top: 2.5,
    left: 5,
    borderRadius: 1,
  },
  clockMinuteHand: {
    position: 'absolute',
    height: 1.4,
    width: 4,
    top: 5,
    left: 5,
    borderRadius: 1,
  },
  // Location Pin
  locationContainer: {
    width: 14,
    height: 14,
    alignItems: 'center',
  },
  pinHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.4,
  },
  pinPoint: {
    width: 0,
    height: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
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
// BottomTabBar Component
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
// EventCard Component
// ---------------------------------------------------------------------------

interface EventCardProps {
  event: RegisteredEvent;
  onPress?: (event: RegisteredEvent) => void;
}

function EventCard({ event, onPress }: EventCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      style={cardStyles.card}
      onPress={() => onPress?.(event)}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={event.title}
    >
      {/* Event Image */}
      {!imageError ? (
        <Image
          source={{ uri: event.imageUrl }}
          style={cardStyles.image}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={[cardStyles.image, cardStyles.imageFallback]}>
          <Text style={cardStyles.fallbackText}>Event</Text>
        </View>
      )}

      {/* Info Column */}
      <View style={cardStyles.infoContainer}>
        <Text style={cardStyles.title} numberOfLines={1}>
          {event.title}
        </Text>

        {/* Date & Time */}
        <View style={cardStyles.metaRow}>
          <ClockIcon />
          <Text style={cardStyles.metaText}>
            {event.date} • {event.time}
          </Text>
        </View>

        {/* Location */}
        <View style={cardStyles.metaRow}>
          <LocationPinIcon />
          <Text style={cardStyles.metaText} numberOfLines={1}>
            {event.location}
          </Text>
        </View>

        {/* Days Left Badge */}
        {event.daysLeft !== undefined && (
          <View style={cardStyles.badge}>
            <Text style={cardStyles.badgeText}>Còn {event.daysLeft} ngày</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: BACKGROUND,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 12,
    marginBottom: 14,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  image: {
    width: 88,
    height: 88,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  imageFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#CBD5E1',
  },
  fallbackText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: BADGE_BG,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: BADGE_TEXT,
  },
});

// ---------------------------------------------------------------------------
// MyScheduleScreen (Giao diện 9)
// ---------------------------------------------------------------------------

export default function MyScheduleScreen({
  events = DEFAULT_EVENTS,
  initialFilter = 'upcoming',
  initialTab = 'schedule',
  onEventPress,
  onFilterPress,
}: MyScheduleScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [activeFilter, setActiveFilter] = useState<ScheduleTabFilter>(initialFilter);
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const filteredEvents = events.filter((e) => e.status === activeFilter);

  // Wire up bottom tab navigation
  const handleTabPress = (tab: TabKey) => {
    setActiveTab(tab);
    switch (tab) {
      case 'home':
        navigation.navigate('Home');
        break;
      case 'schedule':
        break; // already here
      case 'checkin':
        navigation.navigate('CheckIn');
        break;
      case 'profile':
        navigation.navigate('Profile');
        break;
    }
  };

  // Handle event card press: navigate to EventDetail
  const handleEventPress = (event: RegisteredEvent) => {
    if (onEventPress) {
      onEventPress(event);
    } else {
      navigation.navigate('EventDetail', { eventId: event.id, title: event.title });
    }
  };

  // Handle filter press
  const handleFilterPress = () => {
    if (onFilterPress) {
      onFilterPress();
    } else {
      Alert.alert('Bộ lọc', 'Tính năng bộ lọc đang được phát triển.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch của tôi</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={handleFilterPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Bộ lọc"
        >
          <FilterIcon />
        </TouchableOpacity>
      </View>

      {/* ── Segmented Control / Filter Tabs ─────────────────────────────── */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabFilter, activeFilter === 'upcoming' && styles.tabFilterActive]}
          onPress={() => setActiveFilter('upcoming')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabFilterText,
              activeFilter === 'upcoming' && styles.tabFilterTextActive,
            ]}
          >
            Sắp diễn ra
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabFilter, activeFilter === 'past' && styles.tabFilterActive]}
          onPress={() => setActiveFilter('past')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabFilterText,
              activeFilter === 'past' && styles.tabFilterTextActive,
            ]}
          >
            Đã tham gia
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Event List ─────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollList}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredEvents.length > 0 ? (
          filteredEvents.map((item) => (
            <EventCard key={item.id} event={item} onPress={handleEventPress} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Chưa có sự kiện nào trong danh sách</Text>
          </View>
        )}
      </ScrollView>

      {/* ── Bottom Navigation Bar ───────────────────────────────────────── */}
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
    backgroundColor: BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 12,
    backgroundColor: BACKGROUND,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  filterButton: {
    padding: 6,
  },

  // Filter Tabs
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    backgroundColor: BACKGROUND,
  },
  tabFilter: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabFilterActive: {
    borderBottomColor: ACCENT_COLOR,
  },
  tabFilterText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  tabFilterTextActive: {
    color: ACCENT_COLOR,
    fontWeight: '600',
  },

  // List Scroll
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: SCREEN_BG,
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
});
