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
  StatusBar,
} from "react-native";

import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { MainStackParamList } from "../../navigation/types";
import AISummary from "../../components/ai/AISummary";
import AdminLocationModal from "../../components/events/AdminLocationModal";
import { getDistanceMeters, formatDistance } from "../../utils/locationUtils";
import {
  getCurrentPosition,
  openInGoogleMaps,
} from "../../utils/permissionHandler";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  fetchEventById,
  clearSelectedEvent,
} from "../../features/events/eventsSlice";
import { registerForEvent } from "../../features/check-in/registrationsSlice";
import { Colors } from "../../theme";
import { isEventPast, toggleHideEvent, deleteEvent } from "../../services/api";
import { useAppTheme } from "../../theme/ThemeContext";
import { summarizeEvent } from "../../services/api";
import AILoading from "../../components/ai/AILoading";
import AIError from "../../components/ai/AIError";
import type { AISummary as AISummaryType } from "../../types/event";

type EventDetailNavProp = NativeStackNavigationProp<
  MainStackParamList,
  "EventDetail"
>;

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
  const { theme, isDark } = useAppTheme();

  const route = useRoute<EventDetailRouteProp>();

  const dispatch = useAppDispatch();

  // AI Summary states
  const [aiSummary, setAiSummary] = useState<AISummaryType | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const eventId = route.params?.eventId;

  const {
    selectedEvent: event,
    loadingDetail,
    error,
  } = useAppSelector((state) => state.events);

  const user = useAppSelector((state) => state.auth.user);

  const { myRegistrations, actionLoading } = useAppSelector(
    (state) => state.registrations,
  );

  // Kiểm tra đã đăng ký chưa
  const existingReg = myRegistrations.find(
    (registration) =>
      registration.eventId === eventId && registration.status !== "cancelled",
  );

  const isRegistered = !!existingReg;
  const isPast = isEventPast(event);
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
            event.coordinates!.longitude,
          );
          setUserDistance(d);
        }
      });
    }
  }, [event]);

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

    if (isPast) {
      Alert.alert(
        "Hết hạn đăng ký",
        "Sự kiện này đã kết thúc thời gian tổ chức. Bạn không thể đăng ký nữa.",
      );
      return;
    }

    if (isRegistered) {
      Alert.alert("Đã đăng ký", "Bạn đã đăng ký sự kiện này rồi.");
      return;
    }

    const result = await dispatch(
      registerForEvent({
        eventId,
        userId: user._id,
        participantRole: "attendee",
        status: "registered",
      }),
    );

    if (registerForEvent.fulfilled.match(result)) {
      navigation.navigate("RegistrationSuccess", {
        eventId,
        eventTitle: event?.title,
      });
    } else {
      Alert.alert("Thất bại", (result.payload as string) ?? "Đăng ký thất bại");
    }
  };

  const handleSummarize = async () => {
    if (!eventId || aiLoading) return;

    try {
      setAiLoading(true);
      setAiError(null);

      const result = await summarizeEvent(eventId);

      setAiSummary(result);
    } catch (error: any) {
      console.error("AI Summary Error:", error);
      setAiSummary(null);
      const message = error.response?.data?.message;
      setAiError(
        message || "Không thể tạo tóm tắt sự kiện. Vui lòng thử lại sau.",
      );
    } finally {
      setAiLoading(false);
    }
  };

  // Chia sẻ Deep Link sự kiện
  const handleShare = async () => {
    if (!event) return;

    const link = `studentevent://events/${event._id}`;

    await Share.share({
      message: `${event.title}\n${link}`,
    });
  };

  // Loading
  if (loadingDetail) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <StatusBar barStyle={theme.statusBarStyle} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Đang tải sự kiện...
        </Text>
      </View>
    );
  }

  // Error
  if (error || !event) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.statusBarStyle} />
        <View style={styles.emptyState}>
          <Text style={styles.icon}>📅</Text>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {error ?? "Chưa có thông tin sự kiện"}
          </Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
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
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle={theme.statusBarStyle} />
      {/* Ảnh sự kiện */}
      <Image source={{ uri: event.images[0] }} style={styles.bannerImage} />

      <View style={styles.body}>
        {/* Chủ đề + điểm */}
        <View style={styles.topRow}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: isDark ? "rgba(37,99,235,0.2)" : "#DBEAFE" },
            ]}
          >
            <Text style={[styles.categoryText, { color: theme.primary }]}>
              {event.category}
            </Text>
          </View>

          <View
            style={[
              styles.pointBadge,
              { backgroundColor: isDark ? "rgba(16,185,129,0.2)" : "#DCFCE7" },
            ]}
          >
            <Text
              style={[
                styles.pointText,
                { color: isDark ? "#34D399" : "#16A34A" },
              ]}
            >
              +{event.trainingPoints} điểm rèn luyện
            </Text>
          </View>
        </View>

        {/* Tiêu đề */}
        <Text style={[styles.eventTitle, { color: theme.textPrimary }]}>
          {event.title}
        </Text>
        <Text style={[styles.facultyText, { color: theme.textSecondary }]}>
          Đơn vị: {event.faculty}
        </Text>

        {/* Thông tin */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🗓️</Text>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textTertiary }]}>
                Thời gian bắt đầu
              </Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                {formatDate(event.time.start)}
              </Text>
            </View>
          </View>

          <View
            style={[styles.divider, { backgroundColor: theme.borderSubtle }]}
          />

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <View style={styles.infoContent}>
              <View style={styles.locationHeaderRow}>
                <Text style={[styles.infoLabel, { color: theme.textTertiary }]}>
                  Địa điểm tổ chức
                </Text>
                {user?.role === "admin" ? (
                  <TouchableOpacity
                    style={[
                      styles.adminEditBtn,
                      {
                        backgroundColor: isDark
                          ? "rgba(99,102,241,0.2)"
                          : "#EEF2FF",
                        borderColor: isDark ? "#818CF8" : "#C7D2FE",
                      },
                    ]}
                    onPress={() => setAdminModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.adminEditBtnText,
                        { color: isDark ? "#A5B4FC" : "#4338CA" },
                      ]}
                    >
                      📍 Đổi địa điểm (Admin)
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.mapLinkBtn,
                      {
                        backgroundColor: isDark
                          ? "rgba(99,102,241,0.2)"
                          : "#EEF2FF",
                        borderColor: isDark ? "#818CF8" : "#C7D2FE",
                      },
                    ]}
                    onPress={() => {
                      if (event.coordinates) {
                        openInGoogleMaps(
                          event.coordinates.latitude,
                          event.coordinates.longitude,
                          event.location,
                        );
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.mapLinkBtnText,
                        { color: isDark ? "#A5B4FC" : "#4338CA" },
                      ]}
                    >
                      🗺️ Chỉ đường Map
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                {event.location}
              </Text>
              {event.coordinates ? (
                <View style={styles.distanceBadgeRow}>
                  <Text
                    style={[
                      styles.coordsValue,
                      { color: isDark ? "#34D399" : "#059669" },
                    ]}
                  >
                    🔒 Phạm vi: Bán kính {event.coordinates.radiusMeters || 300}
                    m quanh địa điểm
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
                <Text
                  style={[
                    styles.coordsWarning,
                    { color: isDark ? "#FCD34D" : "#D97706" },
                  ]}
                >
                  ℹ️ Điểm danh tự do (Không giới hạn vị trí)
                </Text>
              )}
            </View>
          </View>

          <View
            style={[styles.divider, { backgroundColor: theme.borderSubtle }]}
          />

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🏢</Text>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textTertiary }]}>
                Ban tổ chức
              </Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                {event.organizer}
              </Text>
            </View>
          </View>
        </View>

        {/* AI */}
        <View style={styles.aiSection}>
          {/* Nút gọi AI */}
          <TouchableOpacity
            style={[styles.aiButton, aiLoading && styles.disabledButton]}
            onPress={handleSummarize}
            disabled={aiLoading}
            activeOpacity={0.85}
          >
            {aiLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.aiButtonText}>
                ✨ {aiSummary ? "Tóm tắt lại bằng AI" : "Tóm tắt bằng AI"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Đang xử lý */}
          {aiLoading && <AILoading />}

          {/* Có lỗi */}
          {!aiLoading && aiError && (
            <AIError message={aiError} onRetry={handleSummarize} />
          )}

          {/* Thành công */}
          {!aiLoading && aiSummary && <AISummary summary={aiSummary} />}
        </View>

        {/* Mô tả */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>
            Mô tả sự kiện
          </Text>
          <Text
            style={[styles.descriptionText, { color: theme.textSecondary }]}
          >
            {event.description}
          </Text>
        </View>

        {/* Banner thông báo khi sự kiện đã qua */}
        {isPast && (
          <View
            style={[
              styles.pastBannerBox,
              {
                backgroundColor: isDark ? "rgba(239,68,68,0.15)" : "#FEF2F2",
                borderColor: isDark ? "#F87171" : "#FECACA",
              },
            ]}
          >
            <Text style={styles.pastBannerIcon}>⏰</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.pastBannerTitle,
                  { color: isDark ? "#FCA5A5" : "#991B1B" },
                ]}
              >
                Sự kiện đã kết thúc
              </Text>
              <Text
                style={[
                  styles.pastBannerDesc,
                  { color: isDark ? "#FCD5D5" : "#7F1D1D" },
                ]}
              >
                Sự kiện này đã kết thúc thời gian tổ chức. Bạn chỉ có thể xem
                lại thông tin lưu trữ và không thể đăng ký hoặc điểm danh được
                nữa.
              </Text>
            </View>
          </View>
        )}

        {/* Các nút */}
        <View style={styles.actionButtons}>
          {/* Chia sẻ sự kiện */}
          <TouchableOpacity
            style={[
              styles.shareButton,
              { backgroundColor: isDark ? "rgba(37,99,235,0.15)" : "#EFF6FF" },
            ]}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <Text style={[styles.shareButtonText, { color: theme.primary }]}>
              🔗 Chia sẻ sự kiện
            </Text>
          </TouchableOpacity>

          {/* Đăng ký */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              isPast && styles.disabledPastBtn,
              !isPast && isRegistered && styles.registeredButton,
              (actionLoading || isPast) && styles.disabledButton,
            ]}
            onPress={handleRegister}
            disabled={actionLoading || isRegistered || isPast}
            activeOpacity={0.85}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={[
                  styles.primaryButtonText,
                  isPast && styles.disabledPastBtnText,
                ]}
              >
                {isPast
                  ? "🛑 Đã hết hạn đăng ký"
                  : isRegistered
                    ? "✅ Đã đăng ký"
                    : "📋 Đăng ký tham gia"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Check-in */}
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
              isPast && styles.disabledPastSecondaryBtn,
            ]}
            onPress={() => {
              if (isPast) {
                Alert.alert(
                  "Hết hạn điểm danh",
                  "Sự kiện này đã kết thúc thời gian diễn ra. Cổng điểm danh đã đóng.",
                );
                return;
              }
              navigation.navigate("CheckIn");
            }}
            disabled={isPast}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                { color: theme.textSecondary },
                isPast && styles.disabledPastSecondaryBtnText,
              ]}
            >
              {isPast
                ? "🔒 Cổng điểm danh đã đóng"
                : "📷 Quét QR Điểm Danh Ngay"}
            </Text>
          </TouchableOpacity>

          {/* Feedback */}
          {existingReg?.status === "checked_in" && (
            <TouchableOpacity
              style={[
                styles.feedbackButton,
                {
                  backgroundColor: theme.surfaceSecondary,
                  borderColor: theme.border,
                },
              ]}
              onPress={() =>
                navigation.navigate("Feedback", {
                  eventId: event._id,
                  eventTitle: event.title,
                })
              }
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.feedbackButtonText,
                  { color: theme.textSecondary },
                ]}
              >
                ✍️ Gửi phản hồi sự kiện
              </Text>
            </TouchableOpacity>
          )}

          {/* Panel Quản trị Admin: Ẩn/Hiện và Xóa sự kiện */}
          {user?.role === "admin" && (
            <View
              style={[
                styles.adminPanel,
                {
                  backgroundColor: isDark ? theme.surfaceSecondary : "#F8FAFC",
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={[styles.adminPanelTitle, { color: theme.textSecondary }]}
              >
                ⚙️ Quản trị sự kiện (Dành cho Admin)
              </Text>
              <View style={styles.adminPanelRow}>
                <TouchableOpacity
                  style={[
                    styles.adminToggleBtn,
                    event.isHidden
                      ? styles.adminUnhideBtn
                      : styles.adminHideBtn,
                  ]}
                  onPress={async () => {
                    const newHidden = await toggleHideEvent(
                      event._id,
                      !!event.isHidden,
                    );
                    if (eventId) dispatch(fetchEventById(eventId));
                    Alert.alert(
                      "Thành công",
                      newHidden
                        ? "Đã ẩn sự kiện khỏi danh sách sinh viên."
                        : "Đã mở lại sự kiện hiển thị cho sinh viên.",
                    );
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.adminToggleBtnText}>
                    {event.isHidden
                      ? "👁️ Hiển thị lại cho sinh viên"
                      : "👁️ Ẩn khỏi sinh viên"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.adminDeleteBtn}
                  onPress={() => {
                    Alert.alert(
                      "Xóa sự kiện",
                      `Bạn có chắc chắn muốn xóa vĩnh viễn sự kiện "${event.title}"?`,
                      [
                        { text: "Hủy", style: "cancel" },
                        {
                          text: "Xóa vĩnh viễn",
                          style: "destructive",
                          onPress: async () => {
                            await deleteEvent(event._id);
                            Alert.alert(
                              "Đã xóa",
                              "Sự kiện đã được xóa thành công.",
                            );
                            navigation.goBack();
                          },
                        },
                      ],
                    );
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.adminDeleteBtnText}>🗑️ Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
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

  // Past Event Banner & Disabled State
  pastBannerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  pastBannerIcon: {
    fontSize: 26,
  },
  pastBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#991B1B",
    marginBottom: 2,
  },
  pastBannerDesc: {
    fontSize: 12,
    color: "#7F1D1D",
    lineHeight: 18,
  },
  disabledPastBtn: {
    backgroundColor: "#94A3B8",
    opacity: 0.85,
  },
  disabledPastBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  disabledPastSecondaryBtn: {
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
    opacity: 0.6,
  },
  disabledPastSecondaryBtnText: {
    color: "#94A3B8",
    fontStyle: "italic",
  },

  // Admin Control Panel
  adminPanel: {
    marginTop: 20,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
  },
  adminPanelTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 10,
    textAlign: "center",
  },
  adminPanelRow: {
    flexDirection: "row",
    gap: 10,
  },
  adminToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  adminHideBtn: {
    backgroundColor: "#F59E0B",
  },
  adminUnhideBtn: {
    backgroundColor: "#10B981",
  },
  adminToggleBtnText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
  },
  adminDeleteBtn: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  adminDeleteBtnText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
  },
  aiButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  aiButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
