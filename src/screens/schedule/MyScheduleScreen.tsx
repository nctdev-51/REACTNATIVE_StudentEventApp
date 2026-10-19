import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchMyRegistrations } from '../../features/check-in/registrationsSlice';
import { fetchEvents } from '../../features/events/eventsSlice';

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

const DEFAULT_EVENTS: RegisteredEvent[] = [];

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
  events: propEvents,
  initialFilter = 'upcoming',
  initialTab = 'schedule',
  onEventPress,
  onFilterPress,
}: MyScheduleScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const dispatch = useAppDispatch();

  const currentUser = useAppSelector((state) => state.auth.user);
  const { myRegistrations, loading: regLoading } = useAppSelector((state) => state.registrations);
  const { list: eventsList, loading: eventsLoading } = useAppSelector((state) => state.events);

  const [activeFilter, setActiveFilter] = useState<ScheduleTabFilter>(initialFilter);
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (currentUser?._id) {
      await dispatch(fetchMyRegistrations(currentUser._id));
    }
    await dispatch(fetchEvents());
  }, [dispatch, currentUser?._id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Convert real registrations + events into RegisteredEvent format
  const backendEvents: RegisteredEvent[] = useMemo(() => {
    if (!myRegistrations || myRegistrations.length === 0) return [];

    return myRegistrations
      .filter((r) => r.status !== 'cancelled')
      .map((r) => {
        const rawEventId = typeof r.eventId === 'object' && r.eventId !== null ? (r.eventId as any)._id : r.eventId;
        const populatedEvent = typeof r.eventId === 'object' && r.eventId !== null ? (r.eventId as any) : null;
        const matchedEvent = populatedEvent || eventsList.find((e) => e._id === rawEventId);

        let dateStr = 'Sắp diễn ra';
        let timeStr = '08:00';
        let daysLeft: number | undefined = undefined;
        let isPast = r.status === 'checked_in';

        if (matchedEvent?.time?.start) {
          const startDate = new Date(matchedEvent.time.start);
          const now = new Date();
          const diffDays = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          daysLeft = diffDays > 0 ? diffDays : 0;

          const day = String(startDate.getDate()).padStart(2, '0');
          const month = String(startDate.getMonth() + 1).padStart(2, '0');
          const year = startDate.getFullYear();
          const hours = String(startDate.getHours()).padStart(2, '0');
          const minutes = String(startDate.getMinutes()).padStart(2, '0');

          dateStr = `${day}/${month}/${year}`;
          timeStr = `${hours}:${minutes}`;

          if (matchedEvent.time.end && new Date(matchedEvent.time.end) < now) {
            isPast = true;
          }
        }

        const fallbackImage =
          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80';

        return {
          id: matchedEvent?._id || rawEventId,
          title: matchedEvent?.title || 'Sự kiện đã đăng ký',
          date: dateStr,
          time: timeStr,
          location: matchedEvent?.location || 'Trường ĐH Công nghiệp TP.HCM',
          imageUrl: matchedEvent?.images?.[0] || fallbackImage,
          daysLeft: isPast ? undefined : daysLeft,
          status: isPast ? 'past' : 'upcoming',
        };
      });
  }, [myRegistrations, eventsList]);

  // Use props if explicitly passed and not empty, otherwise use real backend events
  const allEvents = propEvents && propEvents.length > 0 ? propEvents : backendEvents;
  const filteredEvents = allEvents.filter((e) => e.status === activeFilter);

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
      Alert.alert('Bộ lọc', 'Lọc sự kiện theo thời gian hoặc khoa viện.');
    }
  };

  const isLoading = (regLoading || eventsLoading) && allEvents.length === 0;

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[ACCENT_COLOR]}
            tintColor={ACCENT_COLOR}
          />
        }
      >
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={ACCENT_COLOR} />
            <Text style={{ marginTop: 12, color: TEXT_SECONDARY, fontSize: 14 }}>
              Đang tải lịch sự kiện...
            </Text>
          </View>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((item) => (
            <EventCard key={item.id} event={item} onPress={handleEventPress} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {activeFilter === 'upcoming'
                ? 'Bạn chưa có sự kiện nào sắp diễn ra'
                : 'Bạn chưa tham gia sự kiện nào'}
            </Text>
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
