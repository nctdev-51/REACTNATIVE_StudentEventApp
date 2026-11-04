import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../navigation/types";
import AISummary from "../../components/ai/AISummary";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { fetchEventById, clearSelectedEvent } from "../../features/events/eventsSlice";
import { registerForEvent } from "../../features/check-in/registrationsSlice";
import { Colors } from "../../theme";

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
  const dispatch = useAppDispatch();

  const eventId = route.params?.eventId;
  const { selectedEvent: event, loadingDetail, error } = useAppSelector((s) => s.events);
  const user = useAppSelector((s) => s.auth.user);
  const { myRegistrations, actionLoading } = useAppSelector((s) => s.registrations);

  // Kiểm tra user đã đăng ký sự kiện này chưa
  const existingReg = myRegistrations.find(
    (r) => r.eventId === eventId && r.status !== 'cancelled'
  );
  const isRegistered = !!existingReg;

  useEffect(() => {
    if (eventId) {
      dispatch(fetchEventById(eventId));
    }
    return () => {
      dispatch(clearSelectedEvent());
    };
  }, [eventId, dispatch]);

  const handleRegister = async () => {
    if (!user || !eventId) return;
    if (isRegistered) {
      Alert.alert('Đã đăng ký', 'Bạn đã đăng ký sự kiện này rồi.');
      return;
    }
    const result = await dispatch(
      registerForEvent({
        eventId,
        userId: user._id,
        participantRole: 'attendee',
        status: 'registered',
      })
    );
    if (registerForEvent.fulfilled.match(result)) {
      navigation.navigate('RegistrationSuccess', {
        eventId,
        eventTitle: event?.title,
      });
    } else {
      Alert.alert('Thất bại', (result.payload as string) ?? 'Đăng ký thất bại');
    }
  };

  if (loadingDetail) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải sự kiện...</Text>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.icon}>📅</Text>
          <Text style={styles.title}>
            {error ?? "Chưa có thông tin sự kiện"}
          </Text>
          <Text style={styles.description}>
            Vui lòng thử lại sau.
          </Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>← Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Ảnh bìa */}
      <Image source={{ uri: event.images[0] }} style={styles.bannerImage} />

      <View style={styles.body}>
        {/* Category & Điểm rèn luyện */}
        <View style={styles.topRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.category}</Text>
          </View>
          {event.trainingPoints != null && (
            <View style={styles.pointBadge}>
              <Text style={styles.pointText}>
                +{event.trainingPoints} điểm rèn luyện
              </Text>
            </View>
          )}
        </View>

        {/* Tiêu đề */}
        <Text style={styles.eventTitle}>{event.title}</Text>
        {event.faculty && (
          <Text style={styles.facultyText}>Đơn vị: {event.faculty}</Text>
        )}

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

          {event.organizer && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🏢</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Ban tổ chức</Text>
                  <Text style={styles.infoValue}>{event.organizer}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* AI Summary */}
        {event.aiSummary && (
          <View style={styles.aiSection}>
            <AISummary summary={event.aiSummary} />
          </View>
        )}

        {/* Mô tả */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Mô tả sự kiện</Text>
          <Text style={styles.descriptionText}>{event.description}</Text>
        </View>

        {/* Nút hành động */}
        <View style={styles.actionButtons}>
          {/* Đăng ký */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              isRegistered && styles.registeredButton,
              actionLoading && styles.disabledButton,
            ]}
            onPress={handleRegister}
            disabled={actionLoading || isRegistered}
            activeOpacity={0.85}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isRegistered ? "✅ Đã đăng ký" : "📋 Đăng ký tham gia"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Check-in QR */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("CheckIn")}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>
              📷 Quét QR Điểm Danh Ngay
            </Text>
          </TouchableOpacity>

          {/* Feedback (chỉ hiện khi đã check-in) */}
          {existingReg?.status === 'checked_in' && (
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={() =>
                navigation.navigate("Feedback", {
                  eventId: event._id,
                  eventTitle: event.title,
                })
              }
              activeOpacity={0.85}
            >
              <Text style={styles.feedbackButtonText}>
                ✍️ Gửi phản hồi sự kiện
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    gap: 12,
  },
  loadingText: { color: Colors.gray500, fontSize: 14 },
  bannerImage: {
    width: "100%",
    height: 220,
    backgroundColor: "#E2E8F0",
  },
  body: { padding: 16, paddingBottom: 40 },

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
  categoryText: { color: Colors.primary, fontSize: 13, fontWeight: "600" },
  pointBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pointText: { color: "#16A34A", fontSize: 13, fontWeight: "700" },

  eventTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 28,
    marginBottom: 6,
  },
  facultyText: { fontSize: 14, color: "#64748B", marginBottom: 16 },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  infoRow: { flexDirection: "row", alignItems: "flex-start" },
  infoIcon: { fontSize: 20, marginRight: 12, marginTop: 2 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: "#94A3B8", marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  aiSection: { marginBottom: 16 },
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

  actionButtons: { gap: 12 },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  registeredButton: {
    backgroundColor: Colors.success,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  secondaryButtonText: { color: "#475569", fontSize: 14, fontWeight: "600" },
  feedbackButton: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  feedbackButtonText: { color: Colors.gray600, fontSize: 14, fontWeight: "600" },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  icon: { fontSize: 50, marginBottom: 16 },
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
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: { color: "#fff", fontWeight: "600" },
});