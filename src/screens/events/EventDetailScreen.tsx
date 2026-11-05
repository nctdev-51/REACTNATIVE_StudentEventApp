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
  Share,
} from "react-native";

import {
  useNavigation,
  useRoute,
  RouteProp,
} from "@react-navigation/native";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { MainStackParamList } from "../../navigation/types";
import AISummary from "../../components/ai/AISummary";
<<<<<<< HEAD
import AdminLocationModal from "../../components/events/AdminLocationModal";
import { getDistanceMeters, formatDistance } from "../../utils/locationUtils";
import { getCurrentPosition, openInGoogleMaps } from "../../utils/permissionHandler";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { fetchEventById, clearSelectedEvent } from "../../features/events/eventsSlice";
=======

import {
  useAppDispatch,
  useAppSelector,
} from "../../hooks/redux";

import {
  fetchEventById,
  clearSelectedEvent,
} from "../../features/events/eventsSlice";

>>>>>>> 8d9ed42 (Update Event)
import { registerForEvent } from "../../features/check-in/registrationsSlice";
import { Colors } from "../../theme";

type EventDetailNavProp =
  NativeStackNavigationProp<
    MainStackParamList,
    "EventDetail"
  >;

type EventDetailRouteProp =
  RouteProp<MainStackParamList, "EventDetail">;

function formatDate(dateString: string) {
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const year = date.getFullYear();

  const hours = String(
    date.getHours()
  ).padStart(2, "0");

  const minutes = String(
    date.getMinutes()
  ).padStart(2, "0");

  return `${hours}:${minutes} - ${day}/${month}/${year}`;
}

export default function EventDetailScreen() {
  const navigation =
    useNavigation<EventDetailNavProp>();

  const route =
    useRoute<EventDetailRouteProp>();

  const dispatch = useAppDispatch();

  const eventId = route.params?.eventId;

  const {
    selectedEvent: event,
    loadingDetail,
    error,
  } = useAppSelector(
    (state) => state.events
  );

  const user = useAppSelector(
    (state) => state.auth.user
  );

  const {
    myRegistrations,
    actionLoading,
  } = useAppSelector(
    (state) => state.registrations
  );

  // Kiểm tra đã đăng ký chưa
  const existingReg = myRegistrations.find(
    (registration) =>
      registration.eventId === eventId &&
      registration.status !== "cancelled"
  );

  const isRegistered = !!existingReg;
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [userDistance, setUserDistance] = useState<number | null>(null);

  useEffect(() => {
    if (event?.coordinates?.latitude && event?.coordinates?.longitude) {
      getCurrentPosition(5000).then((loc) => {
        if (loc) {
          const d = getDistanceMeters(
            loc.coords.latitude,
            loc.coords.longitude,
            event.coordinates!.latitude,
            event.coordinates!.longitude
          );
          setUserDistance(d);
        }
      });
    }
  }, [event]);

  // Lấy chi tiết sự kiện
  useEffect(() => {
    if (eventId) {
      dispatch(fetchEventById(eventId));
    }

    return () => {
      dispatch(clearSelectedEvent());
    };
  }, [eventId, dispatch]);

  // Đăng ký sự kiện
  const handleRegister = async () => {
    if (!user || !eventId) return;

    if (isRegistered) {
      Alert.alert(
        "Đã đăng ký",
        "Bạn đã đăng ký sự kiện này rồi."
      );
      return;
    }

    const result = await dispatch(
      registerForEvent({
        eventId,
        userId: user._id,
        participantRole: "attendee",
        status: "registered",
      })
    );

    if (
      registerForEvent.fulfilled.match(result)
    ) {
      navigation.navigate(
        "RegistrationSuccess",
        {
          eventId,
          eventTitle: event?.title,
        }
      );
    } else {
      Alert.alert(
        "Thất bại",
        (result.payload as string) ??
          "Đăng ký thất bại"
      );
    }
  };

  // Chia sẻ Deep Link sự kiện
  const handleShare = async () => {
    if (!event) return;

    const link =
      `studentevent://events/${event._id}`;

    await Share.share({
      message: `${event.title}\n${link}`,
    });
  };

  // Loading
  if (loadingDetail) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

        <Text style={styles.loadingText}>
          Đang tải sự kiện...
        </Text>
      </View>
    );
  }

  // Error
  if (error || !event) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.icon}>
            📅
          </Text>

          <Text style={styles.title}>
            {error ??
              "Chưa có thông tin sự kiện"}
          </Text>

          <Text style={styles.description}>
            Vui lòng thử lại sau.
          </Text>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() =>
              navigation.goBack()
            }
          >
            <Text style={styles.backBtnText}>
              ← Quay lại
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Ảnh sự kiện */}
      <Image
        source={{ uri: event.images[0] }}
        style={styles.bannerImage}
      />

      <View style={styles.body}>
        {/* Chủ đề + điểm */}
        <View style={styles.topRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {event.category}
            </Text>
          </View>

          <View style={styles.pointBadge}>
            <Text style={styles.pointText}>
              +{event.trainingPoints} điểm rèn luyện
            </Text>
          </View>
        </View>

        {/* Tiêu đề */}
        <Text style={styles.eventTitle}>
          {event.title}
        </Text>

        <Text style={styles.facultyText}>
          Đơn vị: {event.faculty}
        </Text>

        {/* Thông tin */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>
              🗓️
            </Text>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                Thời gian bắt đầu
              </Text>

              <Text style={styles.infoValue}>
                {formatDate(
                  event.time.start
                )}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>
              📍
            </Text>

            <View style={styles.infoContent}>
<<<<<<< HEAD
              <View style={styles.locationHeaderRow}>
                <Text style={styles.infoLabel}>Địa điểm tổ chức</Text>
                {user?.role === 'admin' ? (
                  <TouchableOpacity
                    style={styles.adminEditBtn}
                    onPress={() => setAdminModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.adminEditBtnText}>📍 Đổi địa điểm (Admin)</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.mapLinkBtn}
                    onPress={() => {
                      if (event.coordinates) {
                        openInGoogleMaps(event.coordinates.latitude, event.coordinates.longitude, event.location);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.mapLinkBtnText}>🗺️ Chỉ đường Map</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.infoValue}>{event.location}</Text>
              {event.coordinates ? (
                <View style={styles.distanceBadgeRow}>
                  <Text style={styles.coordsValue}>
                    🔒 Phạm vi: Bán kính {event.coordinates.radiusMeters || 300}m quanh địa điểm
                  </Text>
                  {userDistance !== null && (
                    <Text
                      style={[
                        styles.distanceStatusText,
                        userDistance <= (event.coordinates.radiusMeters || 500)
                          ? styles.textSuccess
                          : styles.textWarning,
                      ]}
                    >
                      {userDistance <= (event.coordinates.radiusMeters || 500)
                        ? `🟢 Cách bạn ${formatDistance(userDistance)} (Đủ điều kiện Check-in)`
                        : `📍 Cách bạn ${formatDistance(userDistance)} (Chưa vào khu vực tổ chức)`}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.coordsWarning}>
                  ℹ️ Điểm danh tự do (Không giới hạn vị trí)
                </Text>
              )}
=======
              <Text style={styles.infoLabel}>
                Địa điểm tổ chức
              </Text>

              <Text style={styles.infoValue}>
                {event.location}
              </Text>
>>>>>>> 8d9ed42 (Update Event)
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>
              🏢
            </Text>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                Ban tổ chức
              </Text>

              <Text style={styles.infoValue}>
                {event.organizer}
              </Text>
            </View>
          </View>
        </View>

        {/* AI */}
        {event.aiSummary && (
          <View style={styles.aiSection}>
            <AISummary
              summary={event.aiSummary}
            />
          </View>
        )}

        {/* Mô tả */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>
            Mô tả sự kiện
          </Text>

          <Text style={styles.descriptionText}>
            {event.description}
          </Text>
        </View>

        {/* Các nút */}
        <View style={styles.actionButtons}>
          {/* Chia sẻ sự kiện */}
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <Text style={styles.shareButtonText}>
              🔗 Chia sẻ sự kiện
            </Text>
          </TouchableOpacity>

          {/* Đăng ký */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              isRegistered &&
                styles.registeredButton,
              actionLoading &&
                styles.disabledButton,
            ]}
            onPress={handleRegister}
            disabled={
              actionLoading ||
              isRegistered
            }
            activeOpacity={0.85}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                {isRegistered
                  ? "✅ Đã đăng ký"
                  : "📋 Đăng ký tham gia"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Check-in */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() =>
              navigation.navigate("CheckIn")
            }
            activeOpacity={0.85}
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              📷 Quét QR Điểm Danh Ngay
            </Text>
          </TouchableOpacity>

          {/* Feedback */}
          {existingReg?.status ===
            "checked_in" && (
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={() =>
                navigation.navigate(
                  "Feedback",
                  {
                    eventId: event._id,
                    eventTitle:
                      event.title,
                  }
                )
              }
              activeOpacity={0.85}
            >
              <Text
                style={
                  styles.feedbackButtonText
                }
              >
                ✍️ Gửi phản hồi sự kiện
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <AdminLocationModal
        visible={adminModalVisible}
        onClose={() => setAdminModalVisible(false)}
        event={event}
        onSuccess={(_newLoc, _newCoords) => {
          if (eventId) {
            dispatch(fetchEventById(eventId));
          }
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    gap: 12,
  },

  loadingText: {
    color: Colors.gray500,
    fontSize: 14,
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
    color: Colors.primary,
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

  // Nút chia sẻ Deep Link
  shareButton: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },

  shareButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },

  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  registeredButton: {
    backgroundColor: Colors.success,
  },

  disabledButton: {
    opacity: 0.7,
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

  feedbackButton: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },

  feedbackButtonText: {
    color: Colors.gray600,
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
    marginBottom: 20,
  },

  backBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
<<<<<<< HEAD
  backBtnText: { color: "#fff", fontWeight: "600" },
  locationHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  adminEditBtn: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  adminEditBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4338CA",
  },
  coordsValue: {
    fontSize: 12,
    color: "#059669",
    marginTop: 4,
    fontWeight: "500",
  },
  coordsWarning: {
    fontSize: 12,
    color: "#D97706",
    marginTop: 4,
    fontStyle: "italic",
  },
  mapLinkBtn: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  mapLinkBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4338CA",
  },
  distanceBadgeRow: {
    marginTop: 4,
    gap: 2,
  },
  distanceStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  textSuccess: {
    color: "#059669",
  },
  textWarning: {
    color: "#D97706",
  },
=======

  backBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
>>>>>>> 8d9ed42 (Update Event)
});