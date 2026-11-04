import React, { useEffect, useState, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation/types";

import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { fetchEvents, setFilterCategory, selectFilteredEvents } from "../../features/events/eventsSlice";
import { fetchNotifications } from "../../features/notifications/notificationsSlice";
import { selectUnreadCount } from "../../features/notifications/notificationsSlice";

import SearchBar from "../../components/events/SearchBar";
import CategoryChip from "../../components/events/CategoryChip";
import FeaturedEventCard from "../../components/events/FeaturedEventCard";
import EventCard from "../../components/events/EventCard";
import { Colors, Spacing, Typography } from "../../theme";

type NavigationProp = NativeStackNavigationProp<MainStackParamList, "Home">;

const CATEGORIES = [
  "Tất cả",
  "Học thuật",
  "Kỹ năng",
  "Thể thao",
  "Việc làm",
  "Tình nguyện",
];

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  const { loading, error, filter } = useAppSelector((s) => s.events);
  const filteredEvents = useAppSelector(selectFilteredEvents);
  const user = useAppSelector((s) => s.auth.user);
  const unreadCount = useAppSelector(selectUnreadCount);

  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    await dispatch(fetchEvents());
    if (user?._id) {
      await dispatch(fetchNotifications(user._id));
    }
  }, [dispatch, user?._id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCategorySelect = (cat: string) => {
    dispatch(setFilterCategory(cat === "Tất cả" ? null : cat));
  };

  const selectedCategory = filter.category ?? "Tất cả";
  const featuredEvent = filteredEvents[0] ?? null;
  const upcomingEvents = filteredEvents.slice(1);
  const userName = user?.fullName ?? "Sinh viên";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>Xin chào,</Text>
            <Text style={styles.userName}>{userName} 👋</Text>
          </View>

          <TouchableOpacity
            style={styles.avatar}
            onPress={() => navigation.navigate("Profile")}
            activeOpacity={0.8}
          >
            <Text style={styles.avatarText}>
              {userName ? userName.charAt(0).toUpperCase() : "👤"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Action Navigation Bar */}
        <View style={styles.quickNavContainer}>
          <TouchableOpacity
            style={[styles.quickNavBtn, styles.checkInHighlightBtn]}
            onPress={() => navigation.navigate("CheckIn")}
            activeOpacity={0.8}
          >
            <Text style={styles.quickNavIcon}>📷</Text>
            <Text style={styles.quickNavTextHighlight}>Quét QR Check-in</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickNavBtn}
            onPress={() => navigation.navigate("MySchedule")}
            activeOpacity={0.8}
          >
            <Text style={styles.quickNavIcon}>📅</Text>
            <Text style={styles.quickNavText}>Lịch của tôi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickNavBtn, unreadCount > 0 && styles.notifHighlightBtn]}
            onPress={() => navigation.navigate("Notification")}
            activeOpacity={0.8}
          >
            <Text style={styles.quickNavIcon}>🔔</Text>
            <Text style={styles.quickNavText}>
              Thông báo{unreadCount > 0 ? ` (${unreadCount})` : ""}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickNavBtn}
            onPress={() => navigation.navigate("Profile")}
            activeOpacity={0.8}
          >
            <Text style={styles.quickNavIcon}>👤</Text>
            <Text style={styles.quickNavText}>Hồ sơ</Text>
          </TouchableOpacity>
        </View>

        {/* Tìm kiếm */}
        <SearchBar />

        {/* Danh mục */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => handleCategorySelect(cat)}
              activeOpacity={0.7}
            >
              <CategoryChip label={cat} selected={selectedCategory === cat} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Loading */}
        {loading && !refreshing && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.loadingText}>Đang tải sự kiện...</Text>
          </View>
        )}

        {/* Error */}
        {!!error && !loading && (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Không thể tải sự kiện</Text>
            <Text style={styles.errorDesc}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
              <Text style={styles.retryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sự kiện nổi bật */}
        {!loading && featuredEvent && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sự kiện nổi bật</Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("EventDetail", {
                    eventId: featuredEvent._id,
                    title: featuredEvent.title,
                  })
                }
              >
                <Text style={styles.viewAll}>Chi tiết ›</Text>
              </TouchableOpacity>
            </View>

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
          </>
        )}

        {/* Sự kiện sắp tới */}
        {!loading && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sự kiện sắp tới</Text>
              <Text style={styles.eventCountText}>
                {upcomingEvents.length} sự kiện
              </Text>
            </View>

            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((evt) => (
                <TouchableOpacity
                  key={evt._id}
                  activeOpacity={0.9}
                  onPress={() =>
                    navigation.navigate("EventDetail", {
                      eventId: evt._id,
                      title: evt.title,
                    })
                  }
                >
                  <EventCard event={evt} />
                </TouchableOpacity>
              ))
            ) : (
              !error && (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyIcon}>🗓️</Text>
                  <Text style={styles.emptyTitle}>
                    Chưa có sự kiện trong mục này
                  </Text>
                  <Text style={styles.emptyDescription}>
                    Vui lòng chọn danh mục khác để xem thêm sự kiện.
                  </Text>
                </View>
              )
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  hello: { fontSize: 16, color: "#374151", marginBottom: 2 },
  userName: { fontSize: 24, fontWeight: "700", color: "#111827" },
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
  avatarText: { fontSize: 18, fontWeight: "700", color: Colors.primary },

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
  quickNavIcon: { fontSize: 20, marginBottom: 4 },
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

  categoryContainer: { marginTop: 14, marginBottom: 20 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  eventCountText: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  viewAll: { fontSize: 14, color: Colors.primary, fontWeight: "600" },

  // Loading
  loadingBox: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: Typography.base,
    color: Colors.gray500,
  },

  // Error
  errorBox: {
    backgroundColor: Colors.errorLight,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  errorIcon: { fontSize: 32, marginBottom: 10 },
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
  retryText: { color: "#fff", fontWeight: "600" },

  // Empty
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
  emptyIcon: { fontSize: 32, marginBottom: 10 },
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
    lineHeight: 18,
  },
});