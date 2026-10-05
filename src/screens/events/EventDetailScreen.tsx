import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../navigation/types";
import { eventsData } from "../../data/eventsData";
import AISummary from "../../components/ai/AISummary";

type EventDetailNavProp = NativeStackNavigationProp<MainStackParamList, "EventDetail">;
type EventDetailRouteProp = RouteProp<MainStackParamList, "EventDetail">;

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes} - ${day}/${month}/${year}`;
}

export default function EventDetailScreen() {
  const navigation = useNavigation<EventDetailNavProp>();
  const route = useRoute<EventDetailRouteProp>();

  const eventId = route.params?.eventId;
  const event = eventsData.find((e) => e._id === eventId) || eventsData[0];

  if (!event) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.icon}>📅</Text>
          <Text style={styles.title}>Chưa có thông tin sự kiện</Text>
          <Text style={styles.description}>
            Vui lòng chọn một sự kiện để xem thông tin chi tiết.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Ảnh bìa sự kiện */}
      <Image source={{ uri: event.images[0] }} style={styles.bannerImage} />

      <View style={styles.body}>
        {/* Category & Điểm rèn luyện */}
        <View style={styles.topRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.category}</Text>
          </View>
          <View style={styles.pointBadge}>
            <Text style={styles.pointText}>+{event.trainingPoints} điểm rèn luyện</Text>
          </View>
        </View>

        {/* Tiêu đề sự kiện */}
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.facultyText}>Đơn vị: {event.faculty}</Text>

        {/* Thông tin thời gian & địa điểm */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🗓️</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Thời gian bắt đầu</Text>
              <Text style={styles.infoValue}>{formatDate(event.time.start)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Địa điểm tổ chức</Text>
              <Text style={styles.infoValue}>{event.location}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🏢</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Ban tổ chức</Text>
              <Text style={styles.infoValue}>{event.organizer}</Text>
            </View>
          </View>
        </View>

        {/* AI Summary nếu có */}
        {event.aiSummary && (
          <View style={styles.aiSection}>
            <AISummary summary={event.aiSummary} />
          </View>
        )}

        {/* Mô tả chi tiết */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Mô tả sự kiện</Text>
          <Text style={styles.descriptionText}>{event.description}</Text>
        </View>

        {/* Nút hành động */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("CheckIn")}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>📷 Quét QR Điểm Danh Ngay</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("Feedback")}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>✍️ Gửi phản hồi sự kiện</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  bannerImage: {
    width: "100%",
    height: 220,
    backgroundColor: "#E2E8F0",
  },
  body: {
    padding: 16,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "600",
  },
  pointBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pointText: {
    color: "#16A34A",
    fontSize: 13,
    fontWeight: "700",
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 28,
    marginBottom: 6,
  },
  facultyText: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  aiSection: {
    marginBottom: 16,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 22,
  },
  actionButtons: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  secondaryButtonText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  icon: {
    fontSize: 50,
    marginBottom: 16,
  },
  title: {
    fontSize: 21,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 21,
  },
});