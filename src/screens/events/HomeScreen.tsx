import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation/types";
import { eventsData } from "../../data/eventsData";

import SearchBar from "../../components/events/SearchBar";
import CategoryChip from "../../components/events/CategoryChip";
import FeaturedEventCard from "../../components/events/FeaturedEventCard";
import EventCard from "../../components/events/EventCard";

interface HomeScreenProps {
  userName?: string;
}

type NavigationProp = NativeStackNavigationProp<MainStackParamList, "Home">;

const CATEGORIES = [
  "Tất cả",
  "Học thuật",
  "Kỹ năng",
  "Thể thao",
  "Việc làm",
  "Tình nguyện",
];

export default function HomeScreen({ userName = "Nguyễn Văn A" }: HomeScreenProps) {
  const navigation = useNavigation<NavigationProp>();
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");

  const filteredEvents =
    selectedCategory === "Tất cả"
      ? eventsData
      : eventsData.filter((e) => e.category === selectedCategory);

  const featuredEvent = eventsData[0];
  const upcomingEvents = filteredEvents.slice(1);

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
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
          style={styles.quickNavBtn}
          onPress={() => navigation.navigate("Notification")}
          activeOpacity={0.8}
        >
          <Text style={styles.quickNavIcon}>🔔</Text>
          <Text style={styles.quickNavText}>Thông báo</Text>
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

      {/* Danh mục chủ đề */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            activeOpacity={0.7}
          >
            <CategoryChip label={cat} selected={selectedCategory === cat} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sự kiện nổi bật */}
      {featuredEvent && (
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
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sự kiện sắp tới</Text>
        <Text style={styles.eventCountText}>{upcomingEvents.length} sự kiện</Text>
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
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>🗓️</Text>
          <Text style={styles.emptyTitle}>Chưa có sự kiện trong mục này</Text>
          <Text style={styles.emptyDescription}>
            Vui lòng chọn danh mục khác để xem thêm sự kiện.
          </Text>
        </View>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
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
    color: "#2563eb",
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
    color: "#2563EB",
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
    color: "#2563eb",
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
    lineHeight: 18,
  },
});