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
<<<<<<< HEAD
<<<<<<< HEAD

import {
  useNavigation,
  useRoute,
  RouteProp,
} from "@react-navigation/native";

=======
=======
import * as Linking from "expo-linking";
>>>>>>> afdea7c (update event filter search and deep link)
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
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
<<<<<<< HEAD

>>>>>>> 8d9ed42 (Update Event)
import { registerForEvent } from "../../features/check-in/registrationsSlice";
<<<<<<< HEAD
=======
import {
  fetchMyRegistrations,
  registerForEvent,
} from "../../features/check-in/registrationsSlice";
>>>>>>> 2fec513 (feat: enhance event registration handling and UI components for better user experience)
import { Colors } from "../../theme";
<<<<<<< HEAD
import {
  isEventPast,
  toggleHideEvent,
  deleteEvent,
} from "../../services/api";
=======
import { isEventPast, toggleHideEvent, deleteEvent } from "../../services/api";
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
import { useAppTheme } from "../../theme/ThemeContext";
=======
import { summarizeEvent } from "../../services/api";
import AILoading from "../../components/ai/AILoading";
import AIError from "../../components/ai/AIError";
import type { AISummary as AISummaryType } from "../../types/event";
<<<<<<< HEAD
>>>>>>> 5723ff0 (AI event)
=======
import { findDbEvent, getDefaultDbUser } from "../../data/dbService";
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)

type EventDetailNavProp =
  NativeStackNavigationProp<
    MainStackParamList,
    "EventDetail"
  >;

type EventDetailRouteProp =
  RouteProp<MainStackParamList, "EventDetail">;

const DEFAULT_BANNER =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800";

<<<<<<< HEAD
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
=======
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
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
}

export default function EventDetailScreen() {
<<<<<<< HEAD
  const navigation =
    useNavigation<EventDetailNavProp>();
=======
  const navigation = useNavigation<EventDetailNavProp>();
  const { theme, isDark } = useAppTheme();
<<<<<<< HEAD
>>>>>>> 6a72187 (Ver1_NguyenNhiTam)

  const route =
    useRoute<EventDetailRouteProp>();

=======
  const route = useRoute<EventDetailRouteProp>();
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
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
  } = useAppSelector(
    (state) => state.events
  );

<<<<<<< HEAD
<<<<<<< HEAD
  const user = useAppSelector(
    (state) => state.auth.user
  );
=======
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
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)

  const {
    myRegistrations,
    actionLoading,
  } = useAppSelector(
    (state) => state.registrations
  );

  // 2. Kiểm tra trạng thái đã đăng ký (hỗ trợ cả id và _id)
  const existingReg = myRegistrations.find(
    (registration) =>
<<<<<<< HEAD
      registration.eventId === eventId &&
      registration.status !== "cancelled"
=======
      (registration.eventId === eventId ||
        registration.eventId === event?._id ||
        registration.eventId === (event as any)?.id) &&
      registration.status !== "cancelled",
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
  );
=======
  // Kiểm tra đã đăng ký chưa
  const existingReg = myRegistrations.find((registration) => {
    const registrationEventId =
      typeof registration.eventId === "object" && registration.eventId !== null
        ? (registration.eventId as { _id?: string; id?: string })._id ??
          (registration.eventId as { id?: string }).id
        : registration.eventId;
    return registrationEventId === eventId && registration.status !== "cancelled";
  });
>>>>>>> 2fec513 (feat: enhance event registration handling and UI components for better user experience)

  const isRegistered = !!existingReg;
  const isPast = isEventPast(event);
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [userDistance, setUserDistance] = useState<number | null>(null);
  const [bannerError, setBannerError] = useState(false);

  // 3. Tính khoảng cách GPS với xử lý an toàn lỗi Promise
  useEffect(() => {
    if (event?.coordinates?.latitude && event?.coordinates?.longitude) {
<<<<<<< HEAD
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
=======
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
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
    }
  }, [event?.coordinates?.latitude, event?.coordinates?.longitude]);

<<<<<<< HEAD
  // Lấy chi tiết sự kiện
=======
  // 4. Đồng bộ dữ liệu mới nhất từ backend trong nền
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
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
<<<<<<< HEAD
        "Đã đăng ký",
        "Bạn đã đăng ký sự kiện này rồi."
=======
        existingReg?.status === "checked_in" ? "Đã check-in" : "Đã đăng ký",
        existingReg?.status === "checked_in"
          ? "Bạn đã check-in sự kiện này, không thể đăng ký lại."
          : "Bạn đã đăng ký sự kiện này rồi.",
>>>>>>> 2fec513 (feat: enhance event registration handling and UI components for better user experience)
      );
      return;
    }

    const result = await dispatch(
      registerForEvent({
        eventId,
        userId: currentUserId,
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
<<<<<<< HEAD
        (result.payload as string) ??
          "Đăng ký thất bại"
=======
        (result.payload as string) ?? "Đăng ký thất bại",
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
      );
    }
  };

<<<<<<< HEAD
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
=======
  const handleSummarize = async () => {
    if (!eventId || aiLoading) return;

    try {
      setAiLoading(true);
      setAiError(null);

      const result = await summarizeEvent(eventId);
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

<<<<<<< HEAD
>>>>>>> 5723ff0 (AI event)
  if (loadingDetail) {
    return (
<<<<<<< HEAD
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

        <Text style={styles.loadingText}>
          Đang tải sự kiện...
        </Text>
=======
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.statusBarStyle} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Đang tải sự kiện...</Text>
>>>>>>> 6a72187 (Ver1_NguyenNhiTam)
      </View>
=======
  // Chia sẻ Deep Link sự kiện
<<<<<<< HEAD
  const handleShare = async () => {
    if (!event) return;
    const targetId = event._id || (event as any).id || eventId;
    const link = `studentevent://events/${targetId}`;

    await Share.share({
      message: `${event.title}\n${link}`,
    });
  };

  // Trạng thái đang tải (chỉ khi không có cả dữ liệu cache)
  if (loadingDetail && !event) {
=======
const handleShare = async () => {
  if (!event) return;

  const link = Linking.createURL(
    `/events/${event._id}`
  );

  await Share.share({
    message: `${event.title}\n${link}`,
  });
};
  // Loading
  if (loadingDetail) {
>>>>>>> afdea7c (update event filter search and deep link)
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
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
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
<<<<<<< HEAD
        <View style={styles.emptyState}>
<<<<<<< HEAD
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

=======
          <Text style={styles.icon}>📅</Text>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {error ?? "Chưa có thông tin sự kiện"}
          </Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>Vui lòng thử lại sau.</Text>
>>>>>>> 6a72187 (Ver1_NguyenNhiTam)
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
=======
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
          onPress={() => navigation.goBack()}
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
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
    );
  }

  const bannerUri =
    !bannerError && event.images?.[0] ? event.images[0] : DEFAULT_BANNER;

  return (
    <ScrollView
<<<<<<< HEAD
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
=======
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle={theme.statusBarStyle} />
<<<<<<< HEAD
>>>>>>> 6a72187 (Ver1_NguyenNhiTam)
      {/* Ảnh sự kiện */}
      <Image
        source={{ uri: event.images[0] }}
        style={styles.bannerImage}
      />

      <View style={styles.body}>
        {/* Chủ đề + điểm */}
        <View style={styles.topRow}>
<<<<<<< HEAD
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {event.category}
            </Text>
=======
          <View style={[
            styles.categoryBadge,
            { backgroundColor: isDark ? "rgba(37,99,235,0.2)" : "#DBEAFE" }
          ]}>
            <Text style={[styles.categoryText, { color: theme.primary }]}>{event.category}</Text>
>>>>>>> 6a72187 (Ver1_NguyenNhiTam)
          </View>

          <View style={[
            styles.pointBadge,
            { backgroundColor: isDark ? "rgba(16,185,129,0.2)" : "#DCFCE7" }
          ]}>
            <Text style={[styles.pointText, { color: isDark ? "#34D399" : "#16A34A" }]}>
              +{event.trainingPoints} điểm rèn luyện
            </Text>
          </View>
        </View>

        {/* Tiêu đề */}
<<<<<<< HEAD
        <Text style={styles.eventTitle}>
          {event.title}
        </Text>

        <Text style={styles.facultyText}>
          Đơn vị: {event.faculty}
        </Text>
=======
        <Text style={[styles.eventTitle, { color: theme.textPrimary }]}>{event.title}</Text>
        <Text style={[styles.facultyText, { color: theme.textSecondary }]}>Đơn vị: {event.faculty}</Text>
>>>>>>> 6a72187 (Ver1_NguyenNhiTam)

        {/* Thông tin */}
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.infoRow}>
<<<<<<< HEAD
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
=======
            <Text style={styles.infoIcon}>🗓️</Text>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textTertiary }]}>Thời gian bắt đầu</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                {formatDate(event.time.start)}
>>>>>>> 6a72187 (Ver1_NguyenNhiTam)
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />

          <View style={styles.infoRow}>
<<<<<<< HEAD
            <Text style={styles.infoIcon}>
              📍
            </Text>

=======
            <Text style={styles.infoIcon}>📍</Text>
>>>>>>> 6a72187 (Ver1_NguyenNhiTam)
            <View style={styles.infoContent}>
<<<<<<< HEAD
              <View style={styles.locationHeaderRow}>
<<<<<<< HEAD
                <Text style={styles.infoLabel}>Địa điểm tổ chức</Text>
                {user?.role === 'admin' ? (
=======
                <Text style={[styles.infoLabel, { color: theme.textTertiary }]}>Địa điểm tổ chức</Text>
                {user?.role === "admin" ? (
>>>>>>> 6a72187 (Ver1_NguyenNhiTam)
                  <TouchableOpacity
                    style={[styles.adminEditBtn, { backgroundColor: isDark ? "rgba(99,102,241,0.2)" : "#EEF2FF", borderColor: isDark ? "#818CF8" : "#C7D2FE" }]}
=======

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
          marginBottom={12}
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
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
                    onPress={() => setAdminModalVisible(true)}
                    pressStyle={{ opacity: 0.7 }}
                  >
<<<<<<< HEAD
<<<<<<< HEAD
                    <Text style={styles.adminEditBtnText}>📍 Đổi địa điểm (Admin)</Text>
=======
                    <Text style={[styles.adminEditBtnText, { color: isDark ? "#A5B4FC" : "#4338CA" }]}>
                      📍 Đổi địa điểm (Admin)
                    </Text>
>>>>>>> 6a72187 (Ver1_NguyenNhiTam)
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.mapLinkBtn, { backgroundColor: isDark ? "rgba(99,102,241,0.2)" : "#EEF2FF", borderColor: isDark ? "#818CF8" : "#C7D2FE" }]}
=======
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
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
                    onPress={() => {
                      if (event.coordinates) {
                        openInGoogleMaps(event.coordinates.latitude, event.coordinates.longitude, event.location);
                      }
                    }}
                    pressStyle={{ opacity: 0.7 }}
                  >
<<<<<<< HEAD
                    <Text style={[styles.mapLinkBtnText, { color: isDark ? "#A5B4FC" : "#4338CA" }]}>🗺️ Chỉ đường Map</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{event.location}</Text>
              {event.coordinates ? (
                <View style={styles.distanceBadgeRow}>
<<<<<<< HEAD
                  <Text style={styles.coordsValue}>
=======
                  <Text style={[styles.coordsValue, { color: isDark ? "#34D399" : "#059669" }]}>
>>>>>>> 6a72187 (Ver1_NguyenNhiTam)
                    🔒 Phạm vi: Bán kính {event.coordinates.radiusMeters || 300}m quanh địa điểm
                  </Text>
=======
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
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
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
<<<<<<< HEAD
                <Text style={[styles.coordsWarning, { color: isDark ? "#FCD34D" : "#D97706" }]}>
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

          <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />

          <View style={styles.infoRow}>
<<<<<<< HEAD
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
=======
            <Text style={styles.infoIcon}>🏢</Text>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textTertiary }]}>Ban tổ chức</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{event.organizer}</Text>
>>>>>>> 6a72187 (Ver1_NguyenNhiTam)
            </View>
          </View>
        </View>

<<<<<<< HEAD
        {/* AI */}
        {event.aiSummary && (
          <View style={styles.aiSection}>
            <AISummary
              summary={event.aiSummary}
            />
          </View>
        )}
=======
        {/* AI Summary */}
        <View style={styles.aiSection}>
          {/* Nút gọi AI */}
          <TouchableOpacity
            style={[styles.aiButton, aiLoading && styles.disabledButton]}
            onPress={handleSummarize}
=======
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
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
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
<<<<<<< HEAD
        </View>
>>>>>>> 5723ff0 (AI event)

        {/* Mô tả */}
<<<<<<< HEAD
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>
            Mô tả sự kiện
          </Text>

          <Text style={styles.descriptionText}>
            {event.description}
          </Text>
=======
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>Mô tả sự kiện</Text>
          <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>{event.description}</Text>
>>>>>>> 6a72187 (Ver1_NguyenNhiTam)
        </View>
=======
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
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)

        {/* Banner thông báo sự kiện đã kết thúc */}
        {isPast && (
<<<<<<< HEAD
          <View style={[
            styles.pastBannerBox,
            { backgroundColor: isDark ? "rgba(239,68,68,0.15)" : "#FEF2F2", borderColor: isDark ? "#F87171" : "#FECACA" }
          ]}>
            <Text style={styles.pastBannerIcon}>⏰</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pastBannerTitle, { color: isDark ? "#FCA5A5" : "#991B1B" }]}>Sự kiện đã kết thúc</Text>
              <Text style={[styles.pastBannerDesc, { color: isDark ? "#FCD5D5" : "#7F1D1D" }]}>
                Sự kiện này đã kết thúc thời gian tổ chức. Bạn chỉ có thể xem lại thông tin lưu trữ và không thể đăng ký hoặc điểm danh được nữa.
              </Text>
            </View>
          </View>
        )}

        {/* Các nút */}
        <View style={styles.actionButtons}>
          {/* Chia sẻ sự kiện */}
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: isDark ? "rgba(37,99,235,0.15)" : "#EFF6FF" }]}
=======
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

        {/* Các nút hành động chính */}
        <YStack gap={12}>
          {/* Nút Chia Sẻ */}
          <Button
            height={46}
            borderRadius={12}
            backgroundColor={isDark ? "rgba(37,99,235,0.15)" : "#EFF6FF"}
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
            onPress={handleShare}
            pressStyle={{ opacity: 0.85 }}
          >
<<<<<<< HEAD
<<<<<<< HEAD
            <Text style={styles.shareButtonText}>
              🔗 Chia sẻ sự kiện
            </Text>
=======
            <Text style={[styles.shareButtonText, { color: theme.primary }]}>🔗 Chia sẻ sự kiện</Text>
>>>>>>> 6a72187 (Ver1_NguyenNhiTam)
          </TouchableOpacity>

          {/* Đăng ký */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
<<<<<<< HEAD
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
=======
              isPast && styles.disabledPastBtn,
              !isPast && isRegistered && styles.registeredButton,
              (actionLoading || isPast) && styles.disabledButton,
            ]}
            onPress={handleRegister}
            disabled={actionLoading || isRegistered || isPast}
>>>>>>> 6a72187 (Ver1_NguyenNhiTam)
            activeOpacity={0.85}
=======
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
                : isRegistered
                ? "#10B981"
                : theme.primary
            }
            opacity={actionLoading || isPast ? 0.75 : 1}
            disabled={actionLoading || isRegistered || isPast}
            onPress={handleRegister}
            pressStyle={{ opacity: 0.85 }}
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
          >
            {actionLoading ? (
              <Spinner color="#FFFFFF" />
            ) : (
<<<<<<< HEAD
              <Text
<<<<<<< HEAD
                style={
                  styles.primaryButtonText
                }
              >
                {isRegistered
                  ? "✅ Đã đăng ký"
                  : "📋 Đăng ký tham gia"}
=======
                style={[
                  styles.primaryButtonText,
                  isPast && styles.disabledPastBtnText,
                ]}
              >
                {isPast
                  ? "🛑 Đã hết hạn đăng ký"
<<<<<<< HEAD
                  : isRegistered
                    ? "✅ Đã đăng ký"
                    : "📋 Đăng ký tham gia"}
>>>>>>> 6a72187 (Ver1_NguyenNhiTam)
=======
                  : existingReg?.status === "checked_in"
                    ? "Đã check-in"
                    : isRegistered
                      ? "Đã đăng ký"
                      : "Đăng ký tham gia"}
>>>>>>> 2fec513 (feat: enhance event registration handling and UI components for better user experience)
              </Text>
=======
              <XStack alignItems="center" gap={8}>
                <Ionicons
                  name={
                    isPast
                      ? "close-circle-outline"
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
                    : isRegistered
                    ? "Đã đăng ký tham gia"
                    : "Đăng ký tham gia"}
                </TamaguiText>
              </XStack>
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
            )}
          </Button>

<<<<<<< HEAD
          {/* Check-in */}
          <TouchableOpacity
<<<<<<< HEAD
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
=======
            style={[
              styles.secondaryButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
              isPast && styles.disabledPastSecondaryBtn,
            ]}
=======
          {/* Nút Quét QR Điểm Danh */}
          <Button
            height={48}
            borderRadius={12}
            borderWidth={1}
            backgroundColor={theme.surface}
            borderColor={theme.border}
            opacity={isPast ? 0.6 : 1}
            disabled={isPast}
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
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
            pressStyle={{ opacity: 0.85 }}
          >
<<<<<<< HEAD
            <Text
              style={[
                styles.secondaryButtonText,
                { color: theme.textSecondary },
                isPast && styles.disabledPastSecondaryBtnText,
              ]}
            >
              {isPast ? "🔒 Cổng điểm danh đã đóng" : "📷 Quét QR Điểm Danh Ngay"}
>>>>>>> 6a72187 (Ver1_NguyenNhiTam)
            </Text>
          </TouchableOpacity>

          {/* Feedback */}
          {existingReg?.status ===
            "checked_in" && (
            <TouchableOpacity
              style={[styles.feedbackButton, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
              onPress={() =>
                navigation.navigate(
                  "Feedback",
                  {
                    eventId: event._id,
                    eventTitle:
                      event.title,
                  }
                )
=======
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
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
              }
              pressStyle={{ opacity: 0.85 }}
            >
<<<<<<< HEAD
<<<<<<< HEAD
              <Text
                style={
                  styles.feedbackButtonText
                }
              >
=======
              <Text style={[styles.feedbackButtonText, { color: theme.textSecondary }]}>
>>>>>>> 6a72187 (Ver1_NguyenNhiTam)
                ✍️ Gửi phản hồi sự kiện
              </Text>
            </TouchableOpacity>
          )}

          {/* Panel Quản trị Admin: Ẩn/Hiện và Xóa sự kiện */}
          {user?.role === "admin" && (
            <View style={[styles.adminPanel, { backgroundColor: isDark ? theme.surfaceSecondary : "#F8FAFC", borderColor: theme.border }]}>
              <Text style={[styles.adminPanelTitle, { color: theme.textSecondary }]}>
                ⚙️ Quản trị sự kiện (Dành cho Admin)
              </Text>
              <View style={styles.adminPanelRow}>
                <TouchableOpacity
                  style={[
                    styles.adminToggleBtn,
                    event.isHidden ? styles.adminUnhideBtn : styles.adminHideBtn,
                  ]}
=======
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
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
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
<<<<<<< HEAD
                            await deleteEvent(event._id);
=======
                            await deleteEvent(targetId);
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
                            Alert.alert("Đã xóa", "Sự kiện đã được xóa thành công.");
                            navigation.goBack();
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
<<<<<<< HEAD

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
<<<<<<< HEAD
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
<<<<<<< HEAD
=======

  backBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
>>>>>>> 8d9ed42 (Update Event)
});
=======

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
});
>>>>>>> 6a72187 (Ver1_NguyenNhiTam)
=======
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
=======
>>>>>>> b60e34b (chỉnh tại tab và stack, sửa lại trang cá nhân và trang đánh giá)
});
>>>>>>> 5723ff0 (AI event)
