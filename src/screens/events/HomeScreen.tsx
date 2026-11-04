import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

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
  selectFilteredEvents,
} from "../../features/events/eventsSlice";

import {
  fetchNotifications,
  selectUnreadCount,
} from "../../features/notifications/notificationsSlice";

import SearchBar from "../../components/events/SearchBar";
import CategoryChip from "../../components/events/CategoryChip";
import FeaturedEventCard from "../../components/events/FeaturedEventCard";
import EventCard from "../../components/events/EventCard";

import { Colors, Typography } from "../../theme";

type NavigationProp =
  NativeStackNavigationProp<MainStackParamList, "Home">;

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

  const { loading, error, filter } = useAppSelector(
    (state) => state.events
  );

  const filteredEvents = useAppSelector(selectFilteredEvents);

  const user = useAppSelector(
    (state) => state.auth.user
  );

  const unreadCount = useAppSelector(selectUnreadCount);

  const [refreshing, setRefreshing] = useState(false);

  // Số sự kiện đang hiển thị
  const [visibleCount, setVisibleCount] =
    useState(PAGE_SIZE);

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
    dispatch(
      setFilterCategory(
        category === "Tất cả" ? null : category
      )
    );
  };

  const selectedCategory =
    filter.category ?? "Tất cả";

  // Event đầu tiên làm nổi bật
  const featuredEvent =
    filteredEvents[0] ?? null;

  // Các event còn lại
  const upcomingEvents =
    filteredEvents.slice(1);

  // Lazy load
  const visibleEvents = useMemo(() => {
    return upcomingEvents.slice(0, visibleCount);
  }, [upcomingEvents, visibleCount]);

  const loadMore = useCallback(() => {
    if (visibleCount < upcomingEvents.length) {
      setVisibleCount((current) =>
        Math.min(
          current + PAGE_SIZE,
          upcomingEvents.length
        )
      );
    }
  }, [visibleCount, upcomingEvents.length]);

  // Khi search/filter thì quay về 3 event đầu
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [
    filter.category,
    filter.faculty,
    filter.date,
    filter.status,
    filter.searchQuery,
  ]);

  const userName =
    user?.fullName ?? "Sinh viên";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.background}
      />

      <FlatList
        style={styles.container}
        data={visibleEvents}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}

        // Mỗi Event
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              navigation.navigate("EventDetail", {
                eventId: item._id,
                title: item.title,
              })
            }
          >
            <EventCard event={item} />
          </TouchableOpacity>
        )}

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
        ListEmptyComponent={
          !loading &&
          !error &&
          !featuredEvent ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>
                🗓️
              </Text>

              <Text style={styles.emptyTitle}>
                Không tìm thấy sự kiện
              </Text>

              <Text
                style={styles.emptyDescription}
              >
                Hãy thử tìm kiếm hoặc chọn bộ lọc
                khác.
              </Text>
            </View>
          ) : null
        }

        ListFooterComponent={
          visibleCount <
          upcomingEvents.length ? (
            <Text style={styles.loadMoreText}>
              Cuộn xuống để xem thêm
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

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

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#bfdbfe",
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
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  checkInHighlightBtn: {
    backgroundColor: "#EFF6FF",
    borderColor: "#93C5FD",
  },

  notifHighlightBtn: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FCD34D",
  },

  quickNavIcon: {
    fontSize: 20,
    marginBottom: 4,
  },

  quickNavText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
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
    color: "#111827",
  },

  eventCountText: {
    fontSize: 13,
    color: "#6b7280",
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
    color: Colors.gray500,
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
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },

  emptyIcon: {
    fontSize: 32,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },

  emptyDescription: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
  },

  loadMoreText: {
    textAlign: "center",
    color: "#6b7280",
    paddingVertical: 16,
  },
});