import React, { useEffect, useState, useMemo } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
  Share,
  StatusBar,
} from "react-native";
import * as Linking from "expo-linking";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import {
  YStack,
  XStack,
  Card,
  Button,
  Heading,
  Paragraph,
  Text as TamaguiText,
  Spinner,
} from "tamagui";

import { MainStackParamList } from "../../navigation/types";
import { navigate } from "../../navigation/navigationRef";
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
import {
  fetchMyRegistrations,
  registerForEvent,
} from "../../features/check-in/registrationsSlice";
import { Colors } from "../../theme";
import {
  isEventPast,
  toggleHideEvent,
  deleteEvent,
  summarizeEvent,
  getGoogleCalendarAddUrl,
  getCalendarIcsUrl,
} from "../../services/api";
import { useAppTheme } from "../../theme/ThemeContext";
import AILoading from "../../components/ai/AILoading";
import AIError from "../../components/ai/AIError";
import type { AISummary as AISummaryType } from "../../types/event";
import { findDbEvent, getDefaultDbUser } from "../../data/dbService";

type EventDetailNavProp = NativeStackNavigationProp<
  MainStackParamList,
  "EventDetail"
>;

type EventDetailRouteProp = RouteProp<MainStackParamList, "EventDetail">;

const DEFAULT_BANNER =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800";

function formatDate(dateString?: string) {
  if (!dateString) return "Sắp diễn ra";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Sắp diễn ra";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  } catch {
    return "Sắp diễn ra";
  }
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
    selectedEvent,
    list: eventsList,
    loadingDetail,
    error,
  } = useAppSelector((state) => state.events);

  // 1. Tận dụng dữ liệu sự kiện có sẵn từ Redux list hoặc db.json (Instant Cache)
  const cachedEvent = useMemo(() => {
    if (!eventId) return null;
    return (
      eventsList.find(
        (e) => e._id === eventId || (e as any).id === eventId,
      ) || findDbEvent(eventId)
    );
  }, [eventId, eventsList]);

  // Ưu tiên: Dữ liệu chi tiết từ backend > Dữ liệu cache
  const event = selectedEvent || cachedEvent;

  const user = useAppSelector((state) => state.auth.user);
  const defaultStudent = getDefaultDbUser();
  const currentUser = user || defaultStudent;
  const currentUserId = currentUser?._id || (currentUser as any)?.id;

  const { myRegistrations, actionLoading } = useAppSelector(
    (state) => state.registrations,
  );

  // 2. Kiểm tra trạng thái đã đăng ký (hỗ trợ cả id, _id và object eventId)
  const existingReg = myRegistrations.find((registration) => {
    const regEventId =
      typeof registration.eventId === "object" && registration.eventId !== null
        ? (registration.eventId as { _id?: string; id?: string })._id ??
          (registration.eventId as { id?: string }).id
        : registration.eventId;
    const currentId = eventId || event?._id || (event as any)?.id;
    return (
      (regEventId === currentId ||
        regEventId === eventId ||
        regEventId === event?._id ||
        regEventId === (event as any)?.id) &&
      registration.status !== "cancelled"
    );
  });

  const isRegistered = !!existingReg;
  const isPast = isEventPast(event);
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [userDistance, setUserDistance] = useState<number | null>(null);
  const [bannerError, setBannerError] = useState(false);

  // 3. Tính khoảng cách GPS với xử lý an toàn lỗi Promise
  useEffect(() => {
    if (event?.coordinates?.latitude && event?.coordinates?.longitude) {
      getCurrentPosition(5000)
        .then((loc) => {
          if (loc && event?.coordinates) {
            const d = getDistanceMeters(
              loc.coords.latitude,
              loc.coords.longitude,
              event.coordinates.latitude,
              event.coordinates.longitude,
            );
            setUserDistance(d);
          }
        })
        .catch(() => {
          setUserDistance(null);
        });
    }
  }, [event?.coordinates?.latitude, event?.coordinates?.longitude]);

  // 4. Đồng bộ dữ liệu mới nhất từ backend trong nền
  useEffect(() => {
    if (eventId) {
      dispatch(fetchEventById(eventId));
    }

    // A QR check-in can create/update a registration while this screen is not
    // mounted. Refresh the source of truth before deciding whether to enable
    // registration again.
    if (user?._id) {
      void dispatch(fetchMyRegistrations(user._id));
    }

    return () => {
      dispatch(clearSelectedEvent());
    };
  }, [eventId, dispatch, user?._id]);

  // Đăng ký sự kiện
  const handleRegister = async () => {
    if (!currentUserId || !eventId) return;

    if (isPast) {
      Alert.alert(
        "Hết hạn đăng ký",
        "Sự kiện này đã kết thúc thời gian tổ chức. Bạn không thể đăng ký nữa.",
      );
      return;
    }

    if (isRegistered) {
      Alert.alert(
        existingReg?.status === "checked_in" ? "Đã check-in" : "Đã đăng ký",
        existingReg?.status === "checked_in"
          ? "Bạn đã check-in sự kiện này, không thể đăng ký lại."
          : "Bạn đã đăng ký sự kiện này rồi.",
      );
      return;
    }

    const result = await dispatch(
      registerForEvent({
        eventId,
        userId: currentUserId,
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
      Alert.alert(
        "Thất bại",
        (result.payload as string) ?? "Đăng ký thất bại",
      );
    }
  };

  const handleSummarize = async () => {
    if (!eventId || aiLoading) return;

    try {
      setAiLoading(true);
      setAiError(null);

      const result = await summarizeEvent(eventId, event || undefined);
      setAiSummary(result);
    } catch (err: any) {
      setAiSummary(null);
      const message = err?.response?.data?.message;
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
    const targetId = event._id || (event as any).id || eventId;
    const link = Linking.createURL(`/events/${targetId}`);

    await Share.share({
      message: `${event.title}\n${link}`,
    });
  };

  // Thêm vào Google Calendar
  const handleAddToGoogleCalendar = () => {
    if (!event) return;
    const url = getGoogleCalendarAddUrl(event as any);
    Linking.openURL(url).catch(() => {
      Alert.alert("Lỗi", "Không thể mở ứng dụng Lịch.");
    });
  };

  // Tải file iCalendar (.ics)
  const handleDownloadIcs = () => {
    if (!event) return;
    const targetId = event._id || (event as any).id || eventId;
    const url = getCalendarIcsUrl(targetId);
    Linking.openURL(url).catch(() => {
      Alert.alert("Lỗi", "Không thể tải file iCalendar.");
    });
  };

  // Mở bản đồ chỉ đường
  const handleOpenDirections = () => {
    if (!event) return;
    if (event.coordinates?.latitude && event.coordinates?.longitude) {
      openInGoogleMaps(
        event.coordinates.latitude,
        event.coordinates.longitude,
        event.location || event.title
      );
    } else {
      const query = encodeURIComponent(event.location || "Trường Đại học Công nghiệp TP.HCM");
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    }
  };

  // Mở Livestream
  const handleOpenLivestream = () => {
    if (event?.livestreamUrl) {
      Linking.openURL(event.livestreamUrl).catch(() => {
        Alert.alert("Lỗi", "Không thể mở liên kết livestream.");
      });
    }
  };

  // Trạng thái đang tải (chỉ khi không có cả dữ liệu cache)
  if (loadingDetail && !event) {
    return (
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        backgroundColor={theme.background}
        gap={12}
      >
        <StatusBar barStyle={theme.statusBarStyle} />
        <Spinner size="large" color={theme.primary} />
        <Paragraph size="$3" color={theme.textSecondary}>
          Đang tải thông tin sự kiện...
        </Paragraph>
      </YStack>
    );
  }

  // Trạng thái lỗi không tìm thấy sự kiện
  if (!event) {
    return (
      <YStack
        flex={1}
        backgroundColor={theme.background}
        justifyContent="center"
        alignItems="center"
        paddingHorizontal={30}
      >
        <StatusBar barStyle={theme.statusBarStyle} />
        <YStack
          width={70}
          height={70}
          borderRadius={35}
          backgroundColor={theme.primaryLight}
          alignItems="center"
          justifyContent="center"
          marginBottom={16}
        >
          <Ionicons name="calendar-outline" size={36} color={theme.primary} />
        </YStack>
        <Heading
          size="$6"
          fontWeight="700"
          textAlign="center"
          marginBottom={8}
          color={theme.textPrimary}
        >
          {error ?? "Chưa có thông tin sự kiện"}
        </Heading>
        <Paragraph
          size="$3"
          textAlign="center"
          color={theme.textSecondary}
          marginBottom={20}
        >
          Không tìm thấy sự kiện tương ứng hoặc đã bị gỡ bỏ.
        </Paragraph>
        <Button
          backgroundColor={theme.primary}
          borderRadius={10}
          height={44}
          paddingHorizontal={24}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigate("Home"))}
          pressStyle={{ opacity: 0.8 }}
        >
          <XStack alignItems="center" gap={6}>
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
            <TamaguiText fontWeight="600" color="#FFFFFF">
              Quay lại danh sách
            </TamaguiText>
          </XStack>
        </Button>
      </YStack>
    );
  }

  const bannerUri =
    !bannerError && event.images?.[0] ? event.images[0] : DEFAULT_BANNER;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle={theme.statusBarStyle} />

      {/* Ảnh sự kiện */}
      <Image
        source={{ uri: bannerUri }}
        style={styles.bannerImage}
        resizeMode="cover"
        onError={() => setBannerError(true)}
      />

      <YStack padding={16} paddingBottom={40}>
        {/* Chủ đề + Điểm rèn luyện */}
        <XStack
          justifyContent="space-between"
          alignItems="center"
          marginBottom={8}
        >
          <XStack
            backgroundColor={isDark ? "rgba(37,99,235,0.2)" : "#DBEAFE"}
            paddingHorizontal={10}
            paddingVertical={4}
            borderRadius={8}
          >
            <TamaguiText
              fontSize={13}
              fontWeight="600"
              color={theme.primary}
            >
              {event.category || "Học thuật"}
            </TamaguiText>
          </XStack>

          <XStack
            backgroundColor={isDark ? "rgba(16,185,129,0.2)" : "#DCFCE7"}
            paddingHorizontal={10}
            paddingVertical={4}
            borderRadius={8}
          >
            <TamaguiText
              fontSize={13}
              fontWeight="700"
              color={isDark ? "#34D399" : "#16A34A"}
            >
              +{event.trainingPoints ?? 5} điểm rèn luyện
            </TamaguiText>
          </XStack>
        </XStack>

        {/* State Machine Status & Quota */}
        <XStack justifyContent="space-between" alignItems="center" marginBottom={12} flexWrap="wrap" gap={8}>
          <XStack
            backgroundColor={
              event.status === "ongoing"
                ? "rgba(16,185,129,0.15)"
                : event.status === "registration_closed"
                ? "rgba(239,68,68,0.15)"
                : event.status === "completed"
                ? "rgba(100,116,139,0.15)"
                : "rgba(37,99,235,0.15)"
            }
            paddingHorizontal={10}
            paddingVertical={4}
            borderRadius={8}
            alignItems="center"
            gap={6}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  event.status === "ongoing"
                    ? "#10B981"
                    : event.status === "registration_closed"
                    ? "#EF4444"
                    : event.status === "completed"
                    ? "#64748B"
                    : "#2563EB",
              }}
            />
            <TamaguiText
              fontSize={12}
              fontWeight="700"
              color={
                event.status === "ongoing"
                  ? "#10B981"
                  : event.status === "registration_closed"
                  ? "#EF4444"
                  : event.status === "completed"
                  ? "#64748B"
                  : "#2563EB"
              }
            >
              {event.status === "ongoing"
                ? "Đang diễn ra (Check-in active)"
                : event.status === "registration_closed"
                ? "Đã đóng đăng ký"
                : event.status === "completed"
                ? "Sự kiện đã hoàn tất"
                : event.status === "pending_approval"
                ? "Chờ duyệt"
                : "Đang mở đăng ký"}
            </TamaguiText>
          </XStack>

          <XStack alignItems="center" gap={4}>
            <Ionicons name="ticket-outline" size={14} color={theme.textTertiary} />
            <TamaguiText fontSize={12} fontWeight="600" color={theme.textSecondary}>
              Quota: {event.maxSlots ?? 100} chỗ (Waitlist: {event.waitlistSlots ?? 20})
            </TamaguiText>
          </XStack>
        </XStack>

        {/* Tiêu đề & Đơn vị tổ chức */}
        <Heading
          size="$7"
          fontWeight="800"
          lineHeight={28}
          marginBottom={6}
          color={theme.textPrimary}
        >
          {event.title}
        </Heading>
        <Paragraph
          size="$3"
          color={theme.textSecondary}
          marginBottom={16}
        >
          Đơn vị: {event.faculty || "Toàn trường"}
        </Paragraph>

        {/* Thẻ thông tin chi tiết (Tamagui Card) */}
        <Card
          backgroundColor={theme.surface}
          borderColor={theme.border}
          borderWidth={1}
          borderRadius={14}
          padding={16}
          marginBottom={16}
          elevation={1}
        >
          {/* Thời gian */}
          <XStack alignItems="flex-start">
            <XStack width={28} alignItems="center" justifyContent="center" marginRight={10} marginTop={2}>
              <Ionicons name="calendar-outline" size={20} color={theme.primary} />
            </XStack>
            <YStack flex={1}>
              <Paragraph size="$2" color={theme.textTertiary} marginBottom={2}>
                Thời gian bắt đầu
              </Paragraph>
              <TamaguiText fontSize={14} fontWeight="600" color={theme.textPrimary}>
                {formatDate(event.time?.start)}
              </TamaguiText>
            </YStack>
          </XStack>

          <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />

          {/* Địa điểm */}
          <XStack alignItems="flex-start">
            <XStack width={28} alignItems="center" justifyContent="center" marginRight={10} marginTop={2}>
              <Ionicons name="location-outline" size={20} color={theme.primary} />
            </XStack>
            <YStack flex={1}>
              <XStack justifyContent="space-between" alignItems="center" marginBottom={4}>
                <Paragraph size="$2" color={theme.textTertiary}>
                  Địa điểm tổ chức
                </Paragraph>
                {currentUser?.role === "admin" ? (
                  <Button
                    size="$2"
                    borderRadius={6}
                    borderWidth={1}
                    height={28}
                    paddingHorizontal={8}
                    backgroundColor={isDark ? "rgba(99,102,241,0.2)" : "#EEF2FF"}
                    borderColor={isDark ? "#818CF8" : "#C7D2FE"}
                    onPress={() => setAdminModalVisible(true)}
                    pressStyle={{ opacity: 0.7 }}
                  >
                    <XStack alignItems="center" gap={4}>
                      <Ionicons name="create-outline" size={13} color={isDark ? "#A5B4FC" : "#4338CA"} />
                      <TamaguiText fontSize={11} fontWeight="700" color={isDark ? "#A5B4FC" : "#4338CA"}>
                        Đổi vị trí (Admin)
                      </TamaguiText>
                    </XStack>
                  </Button>
                ) : (
                  <Button
                    size="$2"
                    borderRadius={6}
                    borderWidth={1}
                    height={28}
                    paddingHorizontal={8}
                    backgroundColor={isDark ? "rgba(99,102,241,0.2)" : "#EEF2FF"}
                    borderColor={isDark ? "#818CF8" : "#C7D2FE"}
                    onPress={() => {
                      if (event.coordinates) {
                        openInGoogleMaps(
                          event.coordinates.latitude,
                          event.coordinates.longitude,
                          event.location,
                        );
                      }
                    }}
                    pressStyle={{ opacity: 0.7 }}
                  >
                    <XStack alignItems="center" gap={4}>
                      <Ionicons name="navigate-outline" size={13} color={isDark ? "#A5B4FC" : "#4338CA"} />
                      <TamaguiText fontSize={11} fontWeight="700" color={isDark ? "#A5B4FC" : "#4338CA"}>
                        Chỉ đường Map
                      </TamaguiText>
                    </XStack>
                  </Button>
                )}
              </XStack>

              <TamaguiText fontSize={14} fontWeight="600" color={theme.textPrimary}>
                {event.location}
              </TamaguiText>

              {event.coordinates ? (
                <YStack marginTop={4} gap={2}>
                  <TamaguiText
                    fontSize={12}
                    fontWeight="500"
                    color={isDark ? "#34D399" : "#059669"}
                  >
                    Bán kính hợp lệ: {event.coordinates.radiusMeters || 300}m quanh địa điểm
                  </TamaguiText>
                  {userDistance !== null && (
                    <TamaguiText
                      fontSize={12}
                      fontWeight="600"
                      color={
                        userDistance <= (event.coordinates.radiusMeters || 500)
                          ? "#059669"
                          : "#D97706"
                      }
                    >
                      {userDistance <= (event.coordinates.radiusMeters || 500)
                        ? `Cách bạn ${formatDistance(userDistance)} (Đủ điều kiện Check-in)`
                        : `Cách bạn ${formatDistance(userDistance)} (Chưa vào khu vực tổ chức)`}
                    </TamaguiText>
                  )}
                </YStack>
              ) : (
                <TamaguiText
                  fontSize={12}
                  fontStyle="italic"
                  marginTop={4}
                  color={isDark ? "#FCD34D" : "#D97706"}
                >
                  Điểm danh tự do (Không giới hạn vị trí)
                </TamaguiText>
              )}
            </YStack>
          </XStack>

          <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />

          {/* Ban tổ chức */}
          <XStack alignItems="flex-start">
            <XStack width={28} alignItems="center" justifyContent="center" marginRight={10} marginTop={2}>
              <Ionicons name="business-outline" size={20} color={theme.primary} />
            </XStack>
            <YStack flex={1}>
              <Paragraph size="$2" color={theme.textTertiary} marginBottom={2}>
                Ban tổ chức
              </Paragraph>
              <TamaguiText fontSize={14} fontWeight="600" color={theme.textPrimary}>
                {event.organizer || "Đoàn Thanh niên IUH"}
              </TamaguiText>
            </YStack>
          </XStack>
        </Card>

        {/* Khối AI Tóm Tắt */}
        <YStack marginBottom={16}>
          <Button
            height={48}
            borderRadius={12}
            backgroundColor="#7C3AED"
            alignItems="center"
            justifyContent="center"
            marginBottom={12}
            disabled={aiLoading}
            onPress={handleSummarize}
            pressStyle={{ opacity: 0.85 }}
          >
            {aiLoading ? (
              <Spinner color="#FFFFFF" />
            ) : (
              <XStack alignItems="center" gap={8}>
                <Ionicons name="sparkles" size={17} color="#FFFFFF" />
                <TamaguiText fontSize={15} fontWeight="700" color="#FFFFFF">
                  {aiSummary ? "Tóm tắt lại bằng AI" : "Tóm tắt sự kiện bằng AI"}
                </TamaguiText>
              </XStack>
            )}
          </Button>

          {aiLoading && <AILoading />}
          {!aiLoading && aiError && (
            <AIError message={aiError} onRetry={handleSummarize} />
          )}
          {!aiLoading && aiSummary && <AISummary summary={aiSummary} />}
        </YStack>

        {/* Khối Mô Tả */}
        <Card
          backgroundColor={theme.surface}
          borderColor={theme.border}
          borderWidth={1}
          borderRadius={14}
          padding={16}
          marginBottom={20}
          elevation={1}
        >
          <Heading
            size="$5"
            fontWeight="700"
            color={theme.textPrimary}
            marginBottom={8}
          >
            Mô tả sự kiện
          </Heading>
          <Paragraph
            size="$3"
            lineHeight={22}
            color={theme.textSecondary}
          >
            {event.description || "Không có mô tả chi tiết cho sự kiện này."}
          </Paragraph>
        </Card>

        {/* Banner thông báo sự kiện đã kết thúc */}
        {isPast && (
          <XStack
            alignItems="center"
            backgroundColor={isDark ? "rgba(239,68,68,0.15)" : "#FEF2F2"}
            borderColor={isDark ? "#F87171" : "#FECACA"}
            borderWidth={1}
            borderRadius={14}
            padding={14}
            marginBottom={16}
            gap={12}
          >
            <Ionicons name="time-outline" size={26} color="#DC2626" />
            <YStack flex={1}>
              <TamaguiText
                fontSize={14}
                fontWeight="700"
                marginBottom={2}
                color={isDark ? "#FCA5A5" : "#991B1B"}
              >
                Sự kiện đã kết thúc
              </TamaguiText>
              <Paragraph
                size="$2"
                lineHeight={18}
                color={isDark ? "#FCD5D5" : "#7F1D1D"}
              >
                Sự kiện này đã kết thúc thời gian tổ chức. Bạn chỉ có thể xem lại thông tin lưu trữ và không thể đăng ký hoặc điểm danh được nữa.
              </Paragraph>
            </YStack>
          </XStack>
        )}

        {/* Banner thông báo sinh viên đang ở trong Danh sách chờ (Waitlist) */}
        {existingReg?.status === "waitlist" && (
          <XStack
            alignItems="center"
            backgroundColor={isDark ? "rgba(245,158,11,0.15)" : "#FEF3C7"}
            borderColor={isDark ? "#F59E0B" : "#FDE68A"}
            borderWidth={1}
            borderRadius={14}
            padding={14}
            marginBottom={16}
            gap={12}
          >
            <Ionicons name="hourglass-outline" size={26} color="#D97706" />
            <YStack flex={1}>
              <TamaguiText
                fontSize={14}
                fontWeight="700"
                marginBottom={2}
                color={isDark ? "#FCD34D" : "#92400E"}
              >
                Bạn đang trong Danh sách chờ (Waitlist #{existingReg.waitlistPosition ?? 1})
              </TamaguiText>
              <Paragraph
                size="$2"
                lineHeight={18}
                color={isDark ? "#FDE68A" : "#B45309"}
              >
                Khi có sinh viên khác hủy vé trước hạn, hệ thống sẽ tự động chuyển bạn lên danh sách chính thức và gửi thông báo đẩy.
              </Paragraph>
            </YStack>
          </XStack>
        )}

        {/* Khối tiện ích sinh viên (Calendar, Maps, Livestream) */}
        <Card
          backgroundColor={theme.surface}
          borderColor={theme.border}
          borderWidth={1}
          borderRadius={14}
          padding={14}
          marginBottom={16}
        >
          <TamaguiText fontSize={13} fontWeight="700" color={theme.textPrimary} marginBottom={10}>
            TIỆN ÍCH SINH VIÊN
          </TamaguiText>

          <XStack gap={8} flexWrap="wrap" marginBottom={8}>
            <Button
              flex={1}
              height={38}
              borderRadius={10}
              backgroundColor={isDark ? "rgba(37,99,235,0.15)" : "#EFF6FF"}
              onPress={handleAddToGoogleCalendar}
            >
              <XStack alignItems="center" gap={6}>
                <Ionicons name="logo-google" size={15} color="#2563EB" />
                <TamaguiText fontSize={12} fontWeight="600" color="#2563EB">
                  Google Calendar
                </TamaguiText>
              </XStack>
            </Button>

            <Button
              flex={1}
              height={38}
              borderRadius={10}
              backgroundColor={isDark ? "rgba(100,116,139,0.15)" : "#F1F5F9"}
              onPress={handleDownloadIcs}
            >
              <XStack alignItems="center" gap={6}>
                <Ionicons name="download-outline" size={15} color={theme.textPrimary} />
                <TamaguiText fontSize={12} fontWeight="600" color={theme.textPrimary}>
                  Tải file .ICS
                </TamaguiText>
              </XStack>
            </Button>

            <Button
              flex={1}
              height={38}
              borderRadius={10}
              backgroundColor={isDark ? "rgba(16,185,129,0.15)" : "#ECFDF5"}
              onPress={handleOpenDirections}
            >
              <XStack alignItems="center" gap={6}>
                <Ionicons name="navigate-outline" size={15} color="#059669" />
                <TamaguiText fontSize={12} fontWeight="600" color="#059669">
                  Chỉ đường
                </TamaguiText>
              </XStack>
            </Button>
          </XStack>

          {/* Livestream nếu có */}
          {event.livestreamUrl && (
            <Button
              height={40}
              borderRadius={10}
              backgroundColor="#EF4444"
              marginTop={6}
              onPress={handleOpenLivestream}
            >
              <XStack alignItems="center" gap={6}>
                <Ionicons name="videocam" size={16} color="#FFFFFF" />
                <TamaguiText fontSize={13} fontWeight="700" color="#FFFFFF">
                  Xem Livestream Trực Tuyến
                </TamaguiText>
              </XStack>
            </Button>
          )}

          {/* Tài liệu đính kèm */}
          {event.attachments && event.attachments.length > 0 && (
            <YStack marginTop={10} paddingTop={8} borderTopWidth={1} borderTopColor={theme.borderSubtle}>
              <TamaguiText fontSize={12} fontWeight="600" color={theme.textSecondary} marginBottom={6}>
                Tài liệu đính kèm:
              </TamaguiText>
              {event.attachments.map((att: any, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => Linking.openURL(att.url)}
                  style={{ flexDirection: "row", alignItems: "center", paddingVertical: 4 }}
                >
                  <Ionicons name="document-attach" size={16} color="#2563EB" style={{ marginRight: 6 }} />
                  <TamaguiText fontSize={13} color="#2563EB" textDecorationLine="underline">
                    {att.name}
                  </TamaguiText>
                </TouchableOpacity>
              ))}
            </YStack>
          )}
        </Card>

        {/* Các nút hành động chính */}
        <YStack gap={12}>
          {/* Nút Chia Sẻ */}
          <Button
            height={46}
            borderRadius={12}
            backgroundColor={isDark ? "rgba(37,99,235,0.15)" : "#EFF6FF"}
            onPress={handleShare}
            pressStyle={{ opacity: 0.85 }}
          >
            <XStack alignItems="center" gap={8}>
              <Ionicons name="share-social-outline" size={18} color={theme.primary} />
              <TamaguiText fontSize={14} fontWeight="600" color={theme.primary}>
                Chia sẻ sự kiện
              </TamaguiText>
            </XStack>
          </Button>

          {/* Nút Đăng Ký Tham Gia */}
          <Button
            height={50}
            borderRadius={12}
            backgroundColor={
              isPast
                ? "#94A3B8"
                : existingReg?.status === "waitlist"
                ? "#F59E0B"
                : isRegistered
                ? "#10B981"
                : theme.primary
            }
            opacity={actionLoading || isPast ? 0.75 : 1}
            disabled={actionLoading || isRegistered || (existingReg as any)?.status === "waitlist" || isPast}
            onPress={handleRegister}
            pressStyle={{ opacity: 0.85 }}
          >
            {actionLoading ? (
              <Spinner color="#FFFFFF" />
            ) : (
              <XStack alignItems="center" gap={8}>
                <Ionicons
                  name={
                    isPast
                      ? "close-circle-outline"
                      : existingReg?.status === "checked_in"
                      ? "checkmark-done-circle"
                      : existingReg?.status === "waitlist"
                      ? "hourglass-outline"
                      : isRegistered
                      ? "checkmark-circle"
                      : "clipboard-outline"
                  }
                  size={19}
                  color="#FFFFFF"
                />
                <TamaguiText fontSize={15} fontWeight="700" color="#FFFFFF">
                  {isPast
                    ? "Đã hết hạn đăng ký"
                    : existingReg?.status === "checked_in"
                    ? "Đã check-in"
                    : existingReg?.status === "waitlist"
                    ? "Đang ở danh sách chờ"
                    : isRegistered
                    ? "Đã đăng ký"
                    : "Đăng ký tham gia"}
                </TamaguiText>
              </XStack>
            )}
          </Button>

          {/* Nút Quét QR Điểm Danh */}
          <Button
            height={48}
            borderRadius={12}
            borderWidth={1}
            backgroundColor={theme.surface}
            borderColor={theme.border}
            opacity={isPast ? 0.6 : 1}
            disabled={isPast}
            onPress={() => {
              if (isPast) {
                Alert.alert(
                  "Hết hạn điểm danh",
                  "Sự kiện này đã kết thúc thời gian diễn ra. Cổng điểm danh đã đóng.",
                );
                return;
              }
              const targetEventId = event._id || (event as any).id || eventId;
              try {
                navigation.navigate("CheckIn", {
                  screen: "QRScanner",
                  params: {
                    eventId: targetEventId,
                  },
                } as any);
              } catch {
                navigate("CheckIn", {
                  screen: "QRScanner",
                  params: {
                    eventId: targetEventId,
                  },
                });
              }
            }}
            pressStyle={{ opacity: 0.85 }}
          >
            <XStack alignItems="center" gap={8}>
              <Ionicons
                name={isPast ? "lock-closed-outline" : "qr-code-outline"}
                size={18}
                color={isPast ? "#94A3B8" : theme.textPrimary}
              />
              <TamaguiText
                fontSize={14}
                fontWeight="600"
                color={isPast ? "#94A3B8" : theme.textPrimary}
              >
                {isPast ? "Cổng điểm danh đã đóng" : "Quét QR Điểm Danh Ngay"}
              </TamaguiText>
            </XStack>
          </Button>

          {/* Nút Gửi Phản Hồi (Sau khi đã điểm danh) */}
          {existingReg?.status === "checked_in" && (
            <Button
              height={46}
              borderRadius={12}
              borderWidth={1}
              backgroundColor={theme.surfaceSecondary}
              borderColor={theme.border}
              onPress={() =>
                navigation.navigate("Feedback", {
                  eventId: event._id || (event as any).id || eventId,
                  eventTitle: event.title,
                })
              }
              pressStyle={{ opacity: 0.85 }}
            >
              <XStack alignItems="center" gap={8}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={18}
                  color={theme.primary}
                />
                <TamaguiText fontSize={14} fontWeight="600" color={theme.textPrimary}>
                  Gửi phản hồi sự kiện
                </TamaguiText>
              </XStack>
            </Button>
          )}

          {/* Bảng điều khiển quản trị Admin */}
          {currentUser?.role === "admin" && (
            <Card
              marginTop={12}
              backgroundColor={isDark ? theme.surfaceSecondary : "#F8FAFC"}
              borderColor={theme.border}
              borderWidth={1}
              borderRadius={14}
              padding={14}
            >
              <XStack alignItems="center" justifyContent="center" gap={6} marginBottom={10}>
                <Ionicons name="settings-outline" size={16} color={theme.textSecondary} />
                <TamaguiText fontSize={13} fontWeight="700" color={theme.textSecondary}>
                  Quản trị sự kiện (Dành cho Admin)
                </TamaguiText>
              </XStack>

              <XStack gap={10}>
                <Button
                  flex={1}
                  height={40}
                  borderRadius={10}
                  backgroundColor={event.isHidden ? "#10B981" : "#F59E0B"}
                  onPress={async () => {
                    const targetId = event._id || (event as any).id || eventId;
                    if (!targetId) return;
                    const newHidden = await toggleHideEvent(
                      targetId,
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
                  pressStyle={{ opacity: 0.8 }}
                >
                  <XStack alignItems="center" gap={6}>
                    <Ionicons
                      name={event.isHidden ? "eye-outline" : "eye-off-outline"}
                      size={16}
                      color="#FFFFFF"
                    />
                    <TamaguiText fontSize={12.5} fontWeight="700" color="#FFFFFF">
                      {event.isHidden ? "Hiển thị lại" : "Ẩn sự kiện"}
                    </TamaguiText>
                  </XStack>
                </Button>

                <Button
                  height={40}
                  paddingHorizontal={16}
                  borderRadius={10}
                  backgroundColor="#EF4444"
                  onPress={() => {
                    const targetId = event._id || (event as any).id || eventId;
                    if (!targetId) return;
                    Alert.alert(
                      "Xóa sự kiện",
                      `Bạn có chắc chắn muốn xóa vĩnh viễn sự kiện "${event.title}"?`,
                      [
                        { text: "Hủy", style: "cancel" },
                        {
                          text: "Xóa vĩnh viễn",
                          style: "destructive",
                          onPress: async () => {
                            await deleteEvent(targetId);
                            Alert.alert("Đã xóa", "Sự kiện đã được xóa thành công.");
                            if (navigation.canGoBack()) {
                              navigation.goBack();
                            } else {
                              navigate("Home");
                            }
                          },
                        },
                      ],
                    );
                  }}
                  pressStyle={{ opacity: 0.8 }}
                >
                  <XStack alignItems="center" gap={6}>
                    <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                    <TamaguiText fontSize={12.5} fontWeight="700" color="#FFFFFF">
                      Xóa
                    </TamaguiText>
                  </XStack>
                </Button>
              </XStack>
            </Card>
          )}
        </YStack>
      </YStack>

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
  },
  bannerImage: {
    width: "100%",
    height: 220,
    backgroundColor: "#E2E8F0",
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
});
