import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation/types";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  fetchEvents,
  setFilterCategory,
  setFilterFaculty,
  setFilterDate,
  setFilterStatus,
  setFilterSemester,
  selectFilteredEvents,
} from "../../features/events/eventsSlice";
import {
  fetchNotifications,
  selectUnreadCount,
} from "../../features/notifications/notificationsSlice";
import SearchBar from "../../components/events/SearchBar";
import SemesterPicker from "../../components/events/SemesterPicker";
import { isEventPast } from "../../services/api";
import CategoryChip from "../../components/events/CategoryChip";
import FeaturedEventCard from "../../components/events/FeaturedEventCard";
import EventCard from "../../components/events/EventCard";
<<<<<<< HEAD
import LeftNavbarButton from "../../components/navigation/LeftNavbarButton";
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
import { Colors, Spacing, Typography } from "../../theme";
=======
>>>>>>> 8d9ed42 (Update Event)

import { Colors, Typography } from "../../theme";
=======
=======
import AppBottomTab, { AppTabKey } from "../../components/navigation/AppBottomTab";
>>>>>>> 3fca7b4 (feat: integrate bottom tab navigation and enhance QR scanner functionality)
import { Colors, Typography } from "../../theme";
import { useAppTheme } from "../../theme/ThemeContext";
>>>>>>> 6a72187 (Ver1_NguyenNhiTam)
=======
import AppBottomTab, {
  AppTabKey,
} from "../../components/navigation/AppBottomTab";
import { Colors, Typography } from "../../theme";
import { useAppTheme } from "../../theme/ThemeContext";
import type { Event } from "../../types/event";
>>>>>>> d397c6d (update home and event card)

type NavigationProp = NativeStackNavigationProp<MainStackParamList, "Home">;

const CATEGORIES = [
  "Tất cả",
  "Học thuật",
  "Kỹ năng",
  "Thể thao",
  "Việc làm",
  "Tình nguyện",
];

const PAGE_SIZE = 3;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useAppTheme();

  const {
    loading,
    error,
    filter,
    list: allEvents,
  } = useAppSelector((state) => state.events);
  const filteredEvents = useAppSelector(selectFilteredEvents);
  const user = useAppSelector((state) => state.auth.user);
  const unreadCount = useAppSelector(selectUnreadCount);

  const [refreshing, setRefreshing] = useState(false);
  // Số sự kiện đang hiển thị (phân trang lazy loading)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Load dữ liệu
  const loadData = useCallback(async () => {
    await dispatch(fetchEvents());
    if (user?._id) {
      await dispatch(fetchNotifications(user._id));
    }
  }, [dispatch, user?._id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setVisibleCount(PAGE_SIZE);
    setRefreshing(false);
  };

  // Chọn category
  const handleCategorySelect = (category: string) => {
    // Xóa các bộ lọc nâng cao cũ
    dispatch(setFilterFaculty(null));
    dispatch(setFilterDate(null));
    dispatch(setFilterStatus(null));

    // Chỉ giữ category vừa chọn
    dispatch(setFilterCategory(category === "Tất cả" ? null : category));
  };

  const selectedCategory = filter.category ?? "Tất cả";

  // Phân loại sự kiện theo thời gian thực tế
  const { featuredEvent, ongoingEvents, upcomingEvents } = useMemo(() => {
    const now = new Date();

    // Thời điểm bắt đầu ngày mai theo giờ địa phương
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );

    // Chỉ lấy sự kiện được phép hiển thị
    const availableEvents = filteredEvents.filter(
      (event) =>
        !event.isHidden &&
        !["draft", "pending_approval", "cancelled"].includes(event.status),
    );

    const ongoing: Event[] = [];
    const upcoming: Event[] = [];

    availableEvents.forEach((event) => {
      const startTime = new Date(event.time.start);
      const endTime = new Date(event.time.end);

      // Bỏ qua sự kiện có thời gian không hợp lệ
      if (
        !Number.isFinite(startTime.getTime()) ||
        !Number.isFinite(endTime.getTime())
      ) {
        return;
      }

      // Sự kiện đang diễn ra
      if (startTime <= now && endTime >= now) {
        ongoing.push(event);
      }
      // Sự kiện bắt đầu từ ngày mai trở đi
      else if (startTime >= tomorrow) {
        upcoming.push(event);
      }
    });

    // Sắp xếp sự kiện đang diễn ra theo thời gian kết thúc gần nhất
    ongoing.sort(
      (a, b) => new Date(a.time.end).getTime() - new Date(b.time.end).getTime(),
    );

    // Sắp xếp sự kiện sắp tới theo thời gian bắt đầu gần nhất
    upcoming.sort(
      (a, b) =>
        new Date(a.time.start).getTime() - new Date(b.time.start).getTime(),
    );

    // Chọn sự kiện có nhiều sinh viên đăng ký nhất
    const featuredCandidates = [...ongoing, ...upcoming];

    featuredCandidates.sort((a, b) => {
      const countA = a.registeredCount ?? 0;
      const countB = b.registeredCount ?? 0;

      if (countA !== countB) {
        return countB - countA;
      }

      // Nếu số đăng ký bằng nhau, ưu tiên sự kiện gần nhất
      return (
        new Date(a.time.start).getTime() - new Date(b.time.start).getTime()
      );
    });

    return {
      featuredEvent: featuredCandidates[0] ?? null,
      ongoingEvents: ongoing,
      upcomingEvents: upcoming,
    };
  }, [filteredEvents]);

  // Lazy load
  const visibleEvents = useMemo(
    () => upcomingEvents.slice(0, visibleCount),
    [upcomingEvents, visibleCount],
  );

  const loadMore = useCallback(() => {
    if (visibleCount < upcomingEvents.length) {
      setVisibleCount((current) =>
        Math.min(current + PAGE_SIZE, upcomingEvents.length),
      );
    }
  }, [visibleCount, upcomingEvents.length]);

  // Khi search/filter thì quay về số event đầu tiên
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [
    filter.category,
    filter.faculty,
    filter.date,
    filter.status,
    filter.searchQuery,
    filter.semesterId,
  ]);

  const userName = user?.fullName ?? "Sinh viên";

  const handleTabPress = useCallback(
    (tab: AppTabKey) => {
      if (tab === "schedule") navigation.navigate("MySchedule");
      if (tab === "checkin") navigation.navigate("CheckIn");
      if (tab === "profile") navigation.navigate("Profile");
    },
    [navigation],
  );

  // Header Component của danh sách
  const renderListHeader = () => (
    <>
      {/* Header với Left Navbar Menu (☰) và Avatar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LeftNavbarButton
            hasNotification={unreadCount > 0}
            style={styles.navMenuBtn}
          />
          <View style={styles.greetingBox}>
            <Text style={[styles.hello, { color: theme.textSecondary }]}>
              Xin chào,
            </Text>
            <Text
              style={[styles.userName, { color: theme.textPrimary }]}
              numberOfLines={1}
            >
              {userName} 👋
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.avatar,
            {
              backgroundColor: isDark ? "#1E293B" : "#dbeafe",
              borderColor: isDark ? "#3B82F6" : "#bfdbfe",
            },
          ]}
          onPress={() => navigation.navigate("Profile")}
          activeOpacity={0.8}
          accessibilityLabel="Mở hồ sơ cá nhân"
        >
          {userName ? (
            <Text style={styles.avatarText}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          ) : (
            <Ionicons name="person-outline" size={22} color={theme.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Action Navigation Bar */}
      <View style={styles.quickNavContainer}>
        <TouchableOpacity
          style={[
            styles.quickNavBtn,
            {
              backgroundColor: isDark ? "rgba(37,99,235,0.18)" : "#EFF6FF",
              borderColor: isDark ? "#3B82F6" : "#93C5FD",
            },
          ]}
          onPress={() => navigation.navigate("CheckIn")}
          activeOpacity={0.8}
        >
          <Ionicons name="qr-code-outline" size={21} color={theme.primary} />
          <Text style={styles.quickNavTextHighlight}>Quét QR Check-in</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickNavBtn,
            {
              backgroundColor: theme.surfaceSecondary,
              borderColor: theme.border,
            },
          ]}
          onPress={() => navigation.navigate("MySchedule")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="calendar-outline"
            size={21}
            color={theme.textSecondary}
          />
          <Text style={[styles.quickNavText, { color: theme.textSecondary }]}>
            Lịch của tôi
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickNavBtn,
            unreadCount > 0
              ? {
                  backgroundColor: isDark ? "rgba(245,158,11,0.18)" : "#FEF3C7",
                  borderColor: isDark ? "#F59E0B" : "#FCD34D",
                }
              : {
                  backgroundColor: theme.surfaceSecondary,
                  borderColor: theme.border,
                },
          ]}
          onPress={() => navigation.navigate("Notification")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="notifications-outline"
            size={21}
            color={unreadCount > 0 ? "#D97706" : theme.textSecondary}
          />
          <Text style={[styles.quickNavText, { color: theme.textSecondary }]}>
            Thông báo{unreadCount > 0 ? ` (${unreadCount})` : ""}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickNavBtn,
            {
              backgroundColor: theme.surfaceSecondary,
              borderColor: theme.border,
            },
          ]}
          onPress={() => navigation.navigate("Profile")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="person-outline"
            size={21}
            color={theme.textSecondary}
          />
          <Text style={[styles.quickNavText, { color: theme.textSecondary }]}>
            Hồ sơ
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chọn học kỳ — hoạt động hiển thị theo học kỳ đã chọn */}
      <SemesterPicker
        value={filter.semesterId}
        onChange={(semesterId) => dispatch(setFilterSemester(semesterId))}
        events={allEvents}
        style={styles.semesterPicker}
      />

      {/* Tìm kiếm */}
      <SearchBar />
      {/* Bộ lọc nâng cao */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => navigation.navigate("Filter")}
        activeOpacity={0.8}
      >
        <View style={styles.filterButtonContent}>
          <Ionicons name="options-outline" size={17} color={theme.primary} />
          <Text style={styles.filterButtonText}>Bộ lọc nâng cao</Text>
        </View>
      </TouchableOpacity>
      {/* Danh mục */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => handleCategorySelect(category)}
            activeOpacity={0.7}
          >
            <CategoryChip
              label={category}
              selected={selectedCategory === category}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Loading */}
      {loading && !refreshing && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={theme.primary} size="large" />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Đang tải sự kiện...
          </Text>
        </View>
      )}

      {/* Error */}
      {!!error && !loading && (
        <View style={styles.errorBox}>
          <Ionicons
            name="warning-outline"
            size={32}
            color={Colors.error}
            style={styles.errorIcon}
          />
          <Text style={styles.errorTitle}>Không thể tải sự kiện</Text>
          <Text style={styles.errorDesc}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SỰ KIỆN NỔI BẬT */}
      {featuredEvent && (
        <View>
          <Text style={styles.sectionTitle}>Sự kiện nổi bật</Text>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              navigation.navigate("EventDetail", {
                eventId: featuredEvent._id,
                title: featuredEvent.title,
              })
            }
          >
            <FeaturedEventCard event={featuredEvent} />
          </TouchableOpacity>
        </View>
      )}

      {/* SỰ KIỆN ĐANG DIỄN RA */}
      {ongoingEvents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sự kiện đang diễn ra</Text>

          {ongoingEvents.map((event) => (
            <TouchableOpacity
              key={event._id}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate("EventDetail", {
                  eventId: event._id,
                  title: event.title,
                })
              }
            >
              <EventCard event={event} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* TIÊU ĐỀ SỰ KIỆN SẮP TỚI */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sự kiện sắp tới</Text>
      </View>
    </>
  );

  return (
<<<<<<< HEAD
<<<<<<< HEAD
    <SafeAreaView style={styles.safeArea}>
<<<<<<< HEAD
      <StatusBar barStyle="dark-content" />
<<<<<<< HEAD
      <ScrollView
=======
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.background}
      />

      <FlatList
>>>>>>> 8d9ed42 (Update Event)
=======
      <FlatList
>>>>>>> e79c48e (abc)
        style={styles.container}
=======
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
=======
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
>>>>>>> d397c6d (update home and event card)
      <StatusBar barStyle={theme.statusBarStyle} />
      <FlatList
        style={[styles.container, { backgroundColor: theme.background }]}
>>>>>>> 6a72187 (Ver1_NguyenNhiTam)
        data={visibleEvents}
        keyExtractor={(item, index) =>
          `${item._id || item.id || "evt"}-${index}`
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: 16 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
<<<<<<< HEAD
<<<<<<< HEAD
      >
        {/* Header với Left Navbar Menu (☰) */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LeftNavbarButton hasNotification={unreadCount > 0} style={styles.navMenuBtn} />
            <View style={styles.greetingBox}>
              <Text style={styles.hello}>Xin chào,</Text>
              <Text style={styles.userName} numberOfLines={1}>{userName} 👋</Text>
            </View>
          </View>
=======
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
>>>>>>> 8d9ed42 (Update Event)

        // Mỗi Event
        renderItem={({ item }) => (
          <TouchableOpacity
<<<<<<< HEAD
            style={styles.avatar}
            onPress={() => navigation.navigate("Profile")}
            activeOpacity={0.8}
            accessibilityLabel="Mở hồ sơ cá nhân"
=======
=======
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => (
          <TouchableOpacity
>>>>>>> e79c48e (abc)
            activeOpacity={0.9}
            onPress={() =>
              navigation.navigate("EventDetail", {
                eventId: item._id,
                title: item.title,
              })
            }
<<<<<<< HEAD
>>>>>>> 8d9ed42 (Update Event)
=======
>>>>>>> e79c48e (abc)
          >
            <EventCard event={item} />
          </TouchableOpacity>
        )}
<<<<<<< HEAD
<<<<<<< HEAD

        // Phần nằm trên danh sách
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.hello}>
                  Xin chào,
                </Text>

                <Text style={styles.userName}>
                  {userName} 👋
                </Text>
              </View>

              <TouchableOpacity
                style={styles.avatar}
                onPress={() =>
                  navigation.navigate("Profile")
                }
              >
                <Text style={styles.avatarText}>
                  {userName
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick navigation */}
            <View style={styles.quickNavContainer}>
              <TouchableOpacity
                style={[
                  styles.quickNavBtn,
                  styles.checkInHighlightBtn,
                ]}
                onPress={() =>
                  navigation.navigate("CheckIn")
                }
              >
                <Text style={styles.quickNavIcon}>
                  📷
                </Text>

                <Text
                  style={styles.quickNavTextHighlight}
                >
                  Quét QR Check-in
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickNavBtn}
                onPress={() =>
                  navigation.navigate("MySchedule")
                }
              >
                <Text style={styles.quickNavIcon}>
                  📅
                </Text>

                <Text style={styles.quickNavText}>
                  Lịch của tôi
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickNavBtn,
                  unreadCount > 0 &&
                    styles.notifHighlightBtn,
                ]}
                onPress={() =>
                  navigation.navigate("Notification")
                }
              >
                <Text style={styles.quickNavIcon}>
                  🔔
                </Text>

                <Text style={styles.quickNavText}>
                  Thông báo
                  {unreadCount > 0
                    ? ` (${unreadCount})`
                    : ""}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickNavBtn}
                onPress={() =>
                  navigation.navigate("Profile")
                }
              >
                <Text style={styles.quickNavIcon}>
                  👤
                </Text>

                <Text style={styles.quickNavText}>
                  Hồ sơ
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search */}
            <SearchBar />

            {/* Category */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              style={styles.categoryContainer}
            >
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() =>
                    handleCategorySelect(category)
                  }
                >
                  <CategoryChip
                    label={category}
                    selected={
                      selectedCategory === category
                    }
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Loading */}
            {loading && !refreshing && (
              <View style={styles.loadingBox}>
                <ActivityIndicator
                  color={Colors.primary}
                  size="large"
                />

                <Text style={styles.loadingText}>
                  Đang tải sự kiện...
                </Text>
              </View>
            )}

            {/* Error */}
            {!!error && !loading && (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>
                  ⚠️
                </Text>

                <Text style={styles.errorTitle}>
                  Không thể tải sự kiện
                </Text>

                <Text style={styles.errorDesc}>
                  {error}
                </Text>

                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={loadData}
                >
                  <Text style={styles.retryText}>
                    Thử lại
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Featured Event */}
            {!loading && featuredEvent && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Sự kiện nổi bật
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate(
                        "EventDetail",
                        {
                          eventId:
                            featuredEvent._id,
                          title:
                            featuredEvent.title,
                        }
                      )
                    }
                  >
                    <Text style={styles.viewAll}>
                      Chi tiết ›
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() =>
                    navigation.navigate(
                      "EventDetail",
                      {
                        eventId:
                          featuredEvent._id,
                        title:
                          featuredEvent.title,
                      }
                    )
                  }
                >
                  <FeaturedEventCard
                    event={featuredEvent}
                  />
                </TouchableOpacity>
              </>
            )}

            {/* Tiêu đề danh sách */}
            {!loading && filteredEvents.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Sự kiện sắp tới
                </Text>

                <Text style={styles.eventCountText}>
                  {upcomingEvents.length} sự kiện
                </Text>
              </View>
            )}
          </>
        }

        // Không có kết quả
=======
        ListHeaderComponent={renderListHeader}
>>>>>>> e79c48e (abc)
=======
        ListHeaderComponent={renderListHeader()}
>>>>>>> afdea7c (update event filter search and deep link)
        ListEmptyComponent={
          !loading && !error && !featuredEvent ? (
            <View
              style={[
                styles.emptyBox,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons
                name="calendar-clear-outline"
                size={32}
                color={theme.textTertiary}
                style={styles.emptyIcon}
              />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                Không tìm thấy sự kiện
              </Text>
              <Text
                style={[
                  styles.emptyDescription,
                  { color: theme.textSecondary },
                ]}
              >
                Học kỳ này chưa có hoạt động phù hợp. Hãy thử chọn học kỳ khác
                hoặc đổi bộ lọc.
              </Text>
            </View>
          ) : undefined
        }
        ListFooterComponent={
          visibleCount < upcomingEvents.length ? (
            <Text style={[styles.loadMoreText, { color: theme.textSecondary }]}>
              Cuộn xuống để xem thêm
            </Text>
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  semesterPicker: {
    marginBottom: 16,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    backgroundColor: "#FFFFFF",
  },
  filterButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
<<<<<<< HEAD
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
    gap: 12,
  },
  navMenuBtn: {
    marginRight: 2,
  },
  greetingBox: {
    flex: 1,
  },
<<<<<<< HEAD
  hello: { fontSize: 13, color: "#64748B", marginBottom: 2 },
  userName: { fontSize: 20, fontWeight: "700", color: "#111827" },
=======

  hello: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 2,
  },

  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },

>>>>>>> 8d9ed42 (Update Event)
=======
  hello: { fontSize: 13, marginBottom: 2 },
  userName: { fontSize: 20, fontWeight: "700" },
>>>>>>> 6a72187 (Ver1_NguyenNhiTam)
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
  },
  quickNavContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  quickNavBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  quickNavIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickNavText: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  quickNavTextHighlight: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
    textAlign: "center",
  },
  categoryContainer: {
    marginTop: 14,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  eventCountText: {
    fontSize: 13,
    fontWeight: "500",
  },
  viewAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: Typography.base,
  },
  errorBox: {
    backgroundColor: Colors.errorLight,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.error,
    marginBottom: 6,
  },
  errorDesc: {
    fontSize: 13,
    color: Colors.gray600,
    textAlign: "center",
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyBox: {
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 13,
    textAlign: "center",
  },
  loadMoreText: {
    textAlign: "center",
    paddingVertical: 16,
  },
  section: {
    marginBottom: 16,
  },
});
