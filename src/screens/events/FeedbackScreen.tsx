import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  ScrollView,
  Image,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
  Keyboard,
  TouchableOpacity,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  YStack,
  XStack,
  Card,
  Button,
  Heading,
  Paragraph,
  Text as TamaguiText,
  TextArea,
  Spinner,
} from "tamagui";

import type { MainStackParamList } from "../../navigation/types";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { submitFeedback } from "../../features/events/feedbacksSlice";
import { useAppTheme } from "../../theme";
import api from "../../services/api";
import {
  findDbEvent,
  findDbUser,
  getDefaultDbUser,
  getOnlyAttendedEventsFromDb,
  getEnrichedFeedbacksFromDb,
  loadFeedbacksFromStorage,
  saveFeedbacksToStorage,
  mergeFeedbacksIntoDb,
  enrichFeedback,
  addFeedbackToDb,
  EnrichedFeedback,
} from "../../data/dbService";

type FeedbackNavProp = NativeStackNavigationProp<MainStackParamList>;
type FeedbackRouteProp = RouteProp<MainStackParamList, "Feedback">;

type FilterTab = "all" | "reviewed" | "not_reviewed";

// ---------------------------------------------------------------------------
// StarRating Component (Tamagui & Ionicons based)
// ---------------------------------------------------------------------------

interface StarRatingProps {
  value: number;
  onChange: (v: number) => void;
  size?: number;
  starActive: string;
  starInactive: string;
  readonly?: boolean;
}

function StarRating({
  value,
  onChange,
  size = 36,
  starActive,
  starInactive,
  readonly = false,
}: StarRatingProps) {
  const ratingLabels: Record<number, string> = {
    1: "1/5 - Cần cải thiện",
    2: "2/5 - Tạm được",
    3: "3/5 - Bình thường",
    4: "4/5 - Tốt, hài lòng",
    5: "5/5 - Rất xuất sắc & bổ ích",
  };

  return (
    <YStack alignItems="center" marginBottom={14}>
      <XStack
        justifyContent="center"
        alignItems="center"
        gap={8}
        accessibilityRole="adjustable"
        accessibilityLabel={`Đánh giá ${value} sao trên 5`}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= value;
          return (
            <TouchableOpacity
              key={star}
              onPress={() => !readonly && onChange(star)}
              activeOpacity={readonly ? 1 : 0.7}
              disabled={readonly}
              accessibilityRole="button"
              accessibilityLabel={`${star} sao`}
              style={starStyles.touchable}
            >
              <Ionicons
                name={isFilled ? "star" : "star-outline"}
                size={size}
                color={isFilled ? starActive : starInactive}
              />
            </TouchableOpacity>
          );
        })}
      </XStack>
      <Paragraph size="$3" fontWeight="600" marginTop={4} color={starActive}>
        {ratingLabels[value] || `${value}/5 sao`}
      </Paragraph>
    </YStack>
  );
}

const starStyles = StyleSheet.create({
  touchable: { paddingHorizontal: 4, paddingVertical: 4 },
});

// ---------------------------------------------------------------------------
// FeedbackScreen
// ---------------------------------------------------------------------------

export default function FeedbackScreen() {
  const navigation = useNavigation<FeedbackNavProp>();
  const route = useRoute<FeedbackRouteProp>();
  const dispatch = useAppDispatch();
  const { theme, isDark, toggleTheme } = useAppTheme();

  const authUser = useAppSelector((s) => s.auth.user);
  const defaultStudent = getDefaultDbUser();
  const currentUser = authUser?._id ? authUser : findDbUser(defaultStudent._id);
  const currentUserId = currentUser?._id || (currentUser as any)?.id || defaultStudent._id;

  // Danh sách sự kiện đã tham dự (khởi tạo từ dbService và cập nhật trực tiếp từ Backend_v2)
  const [attendedEvents, setAttendedEvents] = useState<any[]>(() => {
    return getOnlyAttendedEventsFromDb(currentUserId);
  });

  // Bộ lọc: 'all' (Tất cả), 'reviewed' (Đã đánh giá), 'not_reviewed' (Chưa đánh giá)
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  // Phân trang: Hiển thị 5 sự kiện gần nhất, kéo xuống hoặc bấm để tải thêm +5
  const [visibleLimit, setVisibleLimit] = useState<number>(5);

  // Sự kiện đang được mở rộng chi tiết để xem/đánh giá
  const [expandedEventId, setExpandedEventId] = useState<string | null>(
    route.params?.eventId || (attendedEvents[0]?.id || attendedEvents[0]?._id || null),
  );

  // Lưu trạng thái đánh giá nháp cho từng sự kiện riêng biệt
  const [draftRatings, setDraftRatings] = useState<Record<string, number>>({});
  const [draftComments, setDraftComments] = useState<Record<string, string>>({});
  const [submittingEventId, setSubmittingEventId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Danh sách toàn bộ đánh giá (được lưu bền vững trong AsyncStorage & backend API)
  const [feedbacks, setFeedbacks] = useState<EnrichedFeedback[]>(() => {
    return getEnrichedFeedbacksFromDb();
  });

  // Tải dữ liệu bền vững từ AsyncStorage và đồng bộ trực tiếp từ Backend_v2
  const loadPersistedData = useCallback(async () => {
    // 1. Đồng bộ đăng ký và sự kiện tham dự từ Backend_v2
    try {
      const [regList, allEvents] = await Promise.all([
        api.getRegistrationsByUser(currentUserId),
        api.getEvents(),
      ]);

      if (Array.isArray(regList) && regList.length > 0) {
        const eventsMap = new Map<string, any>();
        for (const r of regList) {
          // Chỉ hiển thị các sự kiện sinh viên ĐÃ THAM GIA (đã check-in hoặc hoàn thành)
          if (r.status !== "checked_in" && (r.status as string) !== "completed") {
            continue;
          }
          const eventObj: any = (r as any).eventId;
          if (typeof eventObj === "object" && eventObj !== null) {
            const eId = eventObj._id || eventObj.id;
            if (eId) eventsMap.set(eId, eventObj);
          } else if (typeof eventObj === "string") {
            const found = Array.isArray(allEvents)
              ? allEvents.find((e: any) => (e._id || e.id) === eventObj)
              : null;
            if (found) {
              eventsMap.set(eventObj, found);
            } else {
              const dbEvt = findDbEvent(eventObj);
              if (dbEvt) eventsMap.set(eventObj, dbEvt);
            }
          }
        }

        const userEvents = Array.from(eventsMap.values());
        if (userEvents.length > 0) {
          const sorted = [...userEvents].sort((a, b) => {
            const timeA = new Date(a.time?.start || a.createdAt || 0).getTime();
            const timeB = new Date(b.time?.start || b.createdAt || 0).getTime();
            return timeB - timeA;
          });
          setAttendedEvents(sorted);
        }
      }
    } catch {
      setAttendedEvents(getOnlyAttendedEventsFromDb(currentUserId));
    }

    // 2. Đồng bộ feedbacks từ AsyncStorage và Backend_v2
    try {
      const stored = await loadFeedbacksFromStorage();
      if (stored && stored.length > 0) {
        setFeedbacks(stored);
      }
    } catch (err) {
      console.warn("[FeedbackScreen] Load AsyncStorage error:", err);
    }

    try {
      const apiFeedbacks = await api.getAllFeedbacks();
      if (Array.isArray(apiFeedbacks) && apiFeedbacks.length > 0) {
        const merged = mergeFeedbacksIntoDb(apiFeedbacks);
        setFeedbacks(merged);
      }
    } catch {
      // Offline fallback an toàn
    }
  }, [currentUserId]);

  useEffect(() => {
    loadPersistedData();
  }, [loadPersistedData]);

  // Khi mở từ route params (ví dụ từ EventDetailScreen), tự động mở chi tiết sự kiện đó
  useEffect(() => {
    if (route.params?.eventId) {
      setExpandedEventId(route.params.eventId);
      const idx = attendedEvents.findIndex(
        (e) => (e.id || e._id) === route.params?.eventId,
      );
      if (idx >= 0 && idx >= visibleLimit) {
        setVisibleLimit(Math.ceil((idx + 1) / 5) * 5);
      }
    }
  }, [route.params?.eventId, attendedEvents, visibleLimit]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPersistedData();
    setRefreshing(false);
  };

  // Helper tìm đánh giá của CHÍNH BẢN THÂN cho sự kiện
  const getMyReview = useCallback(
    (eventId: string) => {
      return feedbacks.find((f) => {
        const fEvt: any = f.eventId;
        const fUser: any = f.userId;
        const fEvtId =
          typeof fEvt === "object" && fEvt !== null
            ? fEvt._id || fEvt.id
            : fEvt;
        const fUserId =
          typeof fUser === "object" && fUser !== null
            ? fUser._id || fUser.id
            : fUser;
        const matchEvt = fEvtId === eventId;
        const matchUser =
          fUserId === currentUserId ||
          fUserId === defaultStudent._id ||
          (authUser?._id && fUserId === authUser._id);
        return matchEvt && matchUser;
      });
    },
    [feedbacks, currentUserId, defaultStudent._id, authUser?._id],
  );

  // Đếm số lượng cho 3 ô tab
  const { allCount, reviewedCount, notReviewedCount } = useMemo(() => {
    let rev = 0;
    let notRev = 0;
    for (const evt of attendedEvents) {
      const id = evt.id || evt._id;
      if (getMyReview(id)) {
        rev++;
      } else {
        notRev++;
      }
    }
    return {
      allCount: attendedEvents.length,
      reviewedCount: rev,
      notReviewedCount: notRev,
    };
  }, [attendedEvents, getMyReview]);

  // Lọc danh sách theo tab được chọn
  const filteredEvents = useMemo(() => {
    return attendedEvents.filter((evt) => {
      const id = evt.id || evt._id;
      const isReviewed = !!getMyReview(id);
      if (filterTab === "reviewed") return isReviewed;
      if (filterTab === "not_reviewed") return !isReviewed;
      return true;
    });
  }, [attendedEvents, filterTab, getMyReview]);

  // Phân trang 5 sự kiện gần nhất
  const displayedEvents = useMemo(() => {
    return filteredEvents.slice(0, visibleLimit);
  }, [filteredEvents, visibleLimit]);

  const hasMore = visibleLimit < filteredEvents.length;

  // Tự động load thêm 10 sự kiện khi kéo tới cuối trang
  const handleLoadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleLimit((prev) => Math.min(prev + 10, filteredEvents.length));
      setIsLoadingMore(false);
    }, 250);
  }, [hasMore, isLoadingMore, filteredEvents.length]);

  // Bắt sự kiện kéo thanh cuộn tới cuối trang
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    // Chạm tới vùng gần cuối (cách đáy 60px)
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 60;

    if (isCloseToBottom && hasMore && !isLoadingMore) {
      handleLoadMore();
    }
  };

  const handleTabChange = (tab: FilterTab) => {
    setFilterTab(tab);
    setVisibleLimit(5);
  };

  // Format ngày hiển thị
  const formatEventDate = (timeObj?: { start?: string; end?: string }) => {
    if (!timeObj?.start) return "Sắp diễn ra";
    try {
      const d = new Date(timeObj.start);
      return `Ngày ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} • ${d.getHours()}:${d.getMinutes() < 10 ? "0" : ""}${d.getMinutes()}`;
    } catch {
      return "Sắp diễn ra";
    }
  };

  const formatReviewDate = (dateStr?: string) => {
    if (!dateStr) return "Gần đây";
    try {
      const d = new Date(dateStr);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} lúc ${d.getHours()}:${d.getMinutes() < 10 ? "0" : ""}${d.getMinutes()}`;
    } catch {
      return "Gần đây";
    }
  };

  // Xử lý gửi đánh giá cho 1 sự kiện (mỗi sự kiện chỉ đánh giá 1 lần)
  const handleSubmitReview = async (evt: any) => {
    const eventId = evt.id || evt._id;
    if (submittingEventId) return;

    // Kiểm tra xem đã đánh giá chưa
    const existing = getMyReview(eventId);
    if (existing) {
      Alert.alert(
        "Thông báo",
        "Bạn đã gửi đánh giá cho sự kiện này rồi. Mỗi sự kiện chỉ được phép đánh giá 1 lần.",
      );
      return;
    }

    Keyboard.dismiss();

    const ratingVal = draftRatings[eventId] || 5;
    const commentVal = (draftComments[eventId] || "").trim();

    const finalComment =
      commentVal ||
      (ratingVal >= 4
        ? "Sự kiện rất bổ ích, diễn giả nhiệt tình và ban tổ chức chu đáo!"
        : "Đã tham gia và đóng góp ý kiến nâng cao chất lượng sự kiện.");

    const payload = {
      eventId,
      userId: currentUserId,
      rating: ratingVal,
      comment: finalComment,
    };

    setSubmittingEventId(eventId);

    try {
      // 1. Lưu ngay vào dbService in-memory và AsyncStorage
      const newEnriched = addFeedbackToDb(payload);
      setFeedbacks((prev) => {
        const key = newEnriched.id || newEnriched._id;
        const filtered = prev.filter((f) => (f.id || f._id) !== key);
        return [newEnriched, ...filtered];
      });

      // 2. Gửi API lên server lưu vào server/db.json & sync src/data/db.json
      try {
        const serverRes = await Promise.race([
          api.createFeedback(payload),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 3000),
          ),
        ]);

        if (serverRes && (serverRes.id || serverRes._id)) {
          const enrichedServer = enrichFeedback(serverRes);
          setFeedbacks((prev) => {
            const sKey = serverRes.id || serverRes._id;
            const tempKey = newEnriched.id || newEnriched._id;
            const filtered = prev.filter(
              (f) => (f.id || f._id) !== tempKey && (f.id || f._id) !== sKey,
            );
            return [enrichedServer, ...filtered];
          });
          mergeFeedbacksIntoDb([serverRes]);
        }
      } catch (apiErr) {
        console.log("[FeedbackScreen] API fallback to local storage:", apiErr);
      }

      // Xoá draft comment
      setDraftComments((prev) => ({ ...prev, [eventId]: "" }));

      // 3. Thông báo và GIỮ NGUYÊN NGƯỜI DÙNG Ở LẠI TRANG
      if (Platform.OS === "web") {
        alert(
          `Đánh giá thành công!\nCảm ơn bạn đã đóng góp ý kiến cho sự kiện "${evt.title}". Đánh giá của bạn đã được ghi nhận.`,
        );
      } else {
        Alert.alert(
          "Đánh giá thành công!",
          `Cảm ơn bạn đã đóng góp ý kiến cho sự kiện "${evt.title}" với ${ratingVal} sao! Đánh giá đã được lưu vào hệ thống.`,
          [{ text: "Đóng", style: "default" }],
        );
      }
    } finally {
      setSubmittingEventId(null);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={["top", "bottom"]}
    >
      <StatusBar barStyle={theme.statusBarStyle} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* ── Top Header Bar ── */}
        <XStack
          alignItems="center"
          justifyContent="space-between"
          marginBottom={14}
          paddingTop={Platform.OS === "android" ? 10 : 6}
        >
          <Button
            size="$3"
            borderRadius={20}
            borderWidth={1}
            backgroundColor={theme.surface}
            borderColor={theme.border}
            paddingHorizontal={12}
            height={36}
            onPress={() =>
              navigation.canGoBack()
                ? navigation.goBack()
                : navigation.navigate("Home")
            }
            pressStyle={{ opacity: 0.7 }}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <XStack alignItems="center" gap={4}>
              <Ionicons name="chevron-back" size={20} color={theme.primary} />
              <TamaguiText fontSize={14} fontWeight="600" color={theme.primary}>
                Quay lại
              </TamaguiText>
            </XStack>
          </Button>

          {/* Nút bấm đổi theme Sáng/Tối giữ nguyên trạng thái khi reload */}
          <Button
            size="$3"
            borderRadius={20}
            borderWidth={1}
            backgroundColor={theme.surface}
            borderColor={theme.border}
            paddingHorizontal={12}
            height={36}
            onPress={toggleTheme}
            pressStyle={{ opacity: 0.7 }}
            accessibilityRole="button"
            accessibilityLabel={`Chuyển chế độ ${isDark ? "Sáng" : "Tối"}`}
          >
            <XStack alignItems="center" gap={6}>
              <Ionicons
                name={isDark ? "sunny" : "moon"}
                size={17}
                color={isDark ? "#FBBF24" : theme.primary}
              />
              <TamaguiText fontSize={13} fontWeight="600" color={theme.textPrimary}>
                {isDark ? "Chế độ Tối" : "Chế độ Sáng"}
              </TamaguiText>
            </XStack>
          </Button>
        </XStack>

        {/* ── Tiêu đề trang ── */}
        <Heading size="$7" fontWeight="800" color={theme.textPrimary} marginBottom={4}>
          Góp ý & Đánh giá sự kiện
        </Heading>
        <Paragraph size="$3" color={theme.textSecondary} marginBottom={16}>
          Danh sách sự kiện bạn đã tham dự. Mỗi sự kiện chỉ được phép đánh giá 1 lần.
        </Paragraph>

        {/* ── 3 Ô Click Bộ Lọc (Tất cả, Đã đánh giá, Chưa đánh giá) ── */}
        <XStack gap={8} marginBottom={18}>
          {/* Tab 1: Tất cả */}
          <Button
            flex={1}
            height={42}
            borderRadius={12}
            borderWidth={1}
            paddingHorizontal={8}
            backgroundColor={filterTab === "all" ? theme.primary : theme.surface}
            borderColor={filterTab === "all" ? theme.primary : theme.border}
            onPress={() => handleTabChange("all")}
            pressStyle={{ opacity: 0.75 }}
            accessibilityRole="tab"
            accessibilityState={{ selected: filterTab === "all" }}
          >
            <XStack alignItems="center" justifyContent="center" gap={5}>
              <Ionicons
                name="apps-outline"
                size={16}
                color={filterTab === "all" ? "#FFFFFF" : theme.textSecondary}
              />
              <TamaguiText
                fontSize={13}
                fontWeight="700"
                color={filterTab === "all" ? "#FFFFFF" : theme.textPrimary}
              >
                Tất cả ({allCount})
              </TamaguiText>
            </XStack>
          </Button>

          {/* Tab 2: Đã đánh giá */}
          <Button
            flex={1}
            height={42}
            borderRadius={12}
            borderWidth={1}
            paddingHorizontal={6}
            backgroundColor={filterTab === "reviewed" ? theme.primary : theme.surface}
            borderColor={filterTab === "reviewed" ? theme.primary : theme.border}
            onPress={() => handleTabChange("reviewed")}
            pressStyle={{ opacity: 0.75 }}
            accessibilityRole="tab"
            accessibilityState={{ selected: filterTab === "reviewed" }}
          >
            <XStack alignItems="center" justifyContent="center" gap={4}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={filterTab === "reviewed" ? "#FFFFFF" : theme.success}
              />
              <TamaguiText
                fontSize={12}
                fontWeight="700"
                color={filterTab === "reviewed" ? "#FFFFFF" : theme.textPrimary}
              >
                Đã đánh giá ({reviewedCount})
              </TamaguiText>
            </XStack>
          </Button>

          {/* Tab 3: Chưa đánh giá */}
          <Button
            flex={1}
            height={42}
            borderRadius={12}
            borderWidth={1}
            paddingHorizontal={6}
            backgroundColor={filterTab === "not_reviewed" ? theme.primary : theme.surface}
            borderColor={filterTab === "not_reviewed" ? theme.primary : theme.border}
            onPress={() => handleTabChange("not_reviewed")}
            pressStyle={{ opacity: 0.75 }}
            accessibilityRole="tab"
            accessibilityState={{ selected: filterTab === "not_reviewed" }}
          >
            <XStack alignItems="center" justifyContent="center" gap={4}>
              <Ionicons
                name="time-outline"
                size={16}
                color={filterTab === "not_reviewed" ? "#FFFFFF" : "#F59E0B"}
              />
              <TamaguiText
                fontSize={12}
                fontWeight="700"
                color={filterTab === "not_reviewed" ? "#FFFFFF" : theme.textPrimary}
              >
                Chưa đánh giá ({notReviewedCount})
              </TamaguiText>
            </XStack>
          </Button>
        </XStack>

        {/* ── Thông tin số lượng hiển thị ── */}
        <XStack alignItems="center" justifyContent="space-between" marginBottom={12}>
          <Paragraph size="$2" fontWeight="600" color={theme.textTertiary}>
            Hiển thị {displayedEvents.length} / {filteredEvents.length} sự kiện gần nhất
          </Paragraph>
          {filterTab !== "all" && (
            <TouchableOpacity onPress={() => handleTabChange("all")}>
              <TamaguiText fontSize={12} fontWeight="600" color={theme.primary}>
                Xem tất cả
              </TamaguiText>
            </TouchableOpacity>
          )}
        </XStack>

        {/* ── Trường hợp danh sách rỗng ── */}
        {displayedEvents.length === 0 && (
          <Card
            borderRadius={16}
            borderWidth={1}
            borderColor={theme.border}
            backgroundColor={theme.surface}
            padding={32}
            alignItems="center"
            justifyContent="center"
            marginVertical={24}
          >
            <Ionicons
              name={filterTab === "reviewed" ? "checkmark-done-circle-outline" : "file-tray-outline"}
              size={54}
              color={theme.primary}
            />
            <Heading size="$4" fontWeight="700" color={theme.textPrimary} marginTop={12} textAlign="center">
              {filterTab === "reviewed"
                ? "Chưa có sự kiện nào đã đánh giá"
                : filterTab === "not_reviewed"
                ? "Bạn đã hoàn thành đánh giá cho tất cả sự kiện!"
                : "Không tìm thấy sự kiện đã tham dự"}
            </Heading>
            <Paragraph size="$2" color={theme.textSecondary} textAlign="center" marginTop={4}>
              {filterTab === "not_reviewed"
                ? "Cảm ơn bạn đã đóng góp ý kiến quý báu cho nhà trường."
                : "Hãy tham gia các sự kiện để trải nghiệm và gửi đánh giá nhé."}
            </Paragraph>
          </Card>
        )}

        {/* ── Danh sách các sự kiện đã tham dự ── */}
        {displayedEvents.map((evt) => {
          const eventId = evt.id || evt._id;
          const myReview = getMyReview(eventId);
          const isReviewed = !!myReview;
          const isExpanded = expandedEventId === eventId;
          const bannerUri = evt.images?.[0];
          const draftRating = draftRatings[eventId] || 5;
          const draftComment = draftComments[eventId] || "";
          const isSubmitting = submittingEventId === eventId;

          return (
            <Card
              key={eventId}
              borderRadius={16}
              borderWidth={1}
              borderColor={isExpanded ? theme.primary : theme.border}
              backgroundColor={theme.surface}
              padding={16}
              marginBottom={16}
              elevation={isExpanded ? 3 : 1}
            >
              {/* Header của thẻ sự kiện (Bấm vào để mở rộng / thu gọn chi tiết) */}
              <TouchableOpacity
                onPress={() => setExpandedEventId(isExpanded ? null : eventId)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`${evt.title}, ${isReviewed ? "Đã đánh giá" : "Chưa đánh giá"}`}
              >
                <XStack alignItems="center">
                  {bannerUri ? (
                    <Image
                      source={{ uri: bannerUri }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <YStack
                      width={70}
                      height={70}
                      borderRadius={12}
                      justifyContent="center"
                      alignItems="center"
                      backgroundColor={theme.primaryLight}
                    >
                      <Ionicons name="school-outline" size={32} color={theme.primary} />
                    </YStack>
                  )}

                  <YStack flex={1} marginLeft={12}>
                    <XStack alignItems="center" justifyContent="space-between" marginBottom={4}>
                      <XStack gap={6} alignItems="center">
                        <XStack
                          paddingHorizontal={8}
                          paddingVertical={2}
                          borderRadius={6}
                          backgroundColor={theme.primaryLight}
                        >
                          <TamaguiText fontSize={10} fontWeight="700" color={theme.primary}>
                            {evt.category || "Học thuật"}
                          </TamaguiText>
                        </XStack>
                        {evt.trainingPoints ? (
                          <TamaguiText fontSize={11} fontWeight="700" color={theme.success}>
                            +{evt.trainingPoints} ĐRL
                          </TamaguiText>
                        ) : null}
                      </XStack>

                      {/* Huy hiệu trạng thái đánh giá */}
                      {isReviewed ? (
                        <XStack
                          alignItems="center"
                          gap={4}
                          paddingHorizontal={8}
                          paddingVertical={3}
                          borderRadius={12}
                          backgroundColor={isDark ? "#064E3B" : "#ECFDF5"}
                        >
                          <Ionicons name="checkmark-circle" size={13} color={theme.success} />
                          <TamaguiText fontSize={11} fontWeight="700" color={theme.success}>
                            {myReview.rating}★ Đã đánh giá
                          </TamaguiText>
                        </XStack>
                      ) : (
                        <XStack
                          alignItems="center"
                          gap={4}
                          paddingHorizontal={8}
                          paddingVertical={3}
                          borderRadius={12}
                          backgroundColor={isDark ? "#78350F" : "#FEF3C7"}
                        >
                          <Ionicons name="time" size={13} color="#D97706" />
                          <TamaguiText fontSize={11} fontWeight="700" color="#D97706">
                            Chưa đánh giá
                          </TamaguiText>
                        </XStack>
                      )}
                    </XStack>

                    <Heading
                      size="$4"
                      fontWeight="700"
                      color={theme.textPrimary}
                      numberOfLines={2}
                      marginBottom={4}
                    >
                      {evt.title}
                    </Heading>

                    <XStack alignItems="center" gap={5}>
                      <Ionicons name="calendar-outline" size={12} color={theme.textSecondary} />
                      <TamaguiText fontSize={11} color={theme.textSecondary} numberOfLines={1}>
                        {formatEventDate(evt.time)}
                      </TamaguiText>
                    </XStack>
                  </YStack>

                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={theme.textTertiary}
                    style={{ marginLeft: 6 }}
                  />
                </XStack>
              </TouchableOpacity>

              {/* ── Phần Mở Rộng: Chi tiết sự kiện & Đánh giá ── */}
              {isExpanded && (
                <YStack marginTop={14} paddingTop={14} borderTopWidth={1} borderTopColor={theme.border}>
                  {/* Banner lớn sự kiện */}
                  {bannerUri ? (
                    <Image
                      source={{ uri: bannerUri }}
                      style={styles.bannerImage}
                      resizeMode="cover"
                    />
                  ) : null}

                  {/* Thông tin chi tiết địa điểm, ban tổ chức */}
                  <YStack gap={6} marginBottom={14}>
                    <XStack alignItems="center" gap={8}>
                      <Ionicons name="location-outline" size={15} color={theme.primary} />
                      <TamaguiText fontSize={13} color={theme.textPrimary} flex={1}>
                        {evt.location || "Trường Đại học Công nghiệp TP.HCM (IUH)"}
                      </TamaguiText>
                    </XStack>
                    <XStack alignItems="center" gap={8}>
                      <Ionicons name="people-outline" size={15} color={theme.textSecondary} />
                      <TamaguiText fontSize={13} color={theme.textSecondary} flex={1}>
                        Ban tổ chức: {evt.organizer || "Đoàn Thanh niên - Hội Sinh viên IUH"}
                      </TamaguiText>
                    </XStack>
                    {evt.description ? (
                      <Paragraph size="$2" color={theme.textSecondary} marginTop={4} lineHeight={18}>
                        {evt.description}
                      </Paragraph>
                    ) : null}
                  </YStack>

                  {/* ───────────────────────────────────────────────────────────── */}
                  {/* PHẦN ĐÁNH GIÁ:                                               */}
                  {/* 1. Nếu đã đánh giá: Hiện sao & nhận xét của bản thân,        */}
                  {/*    KHÔNG HIỂN THỊ ĐÁNH GIÁ CỦA NGƯỜI KHÁC                     */}
                  {/* 2. Nếu chưa đánh giá: Cho phép chọn sao & viết nhận xét để gửi*/}
                  {/* ───────────────────────────────────────────────────────────── */}
                  {isReviewed ? (
                    // TH1: ĐÃ ĐÁNH GIÁ -> Hiển thị đánh giá của bản thân
                    <Card
                      borderRadius={12}
                      borderWidth={1}
                      borderColor={theme.success}
                      backgroundColor={isDark ? "#062E25" : "#F0FDF4"}
                      padding={14}
                      marginTop={6}
                    >
                      <XStack alignItems="center" justifyContent="space-between" marginBottom={8}>
                        <XStack alignItems="center" gap={6}>
                          <Ionicons name="checkmark-circle" size={18} color={theme.success} />
                          <Heading size="$3" fontWeight="700" color={theme.success}>
                            Đánh giá của bạn
                          </Heading>
                        </XStack>
                        <TamaguiText fontSize={11} color={theme.textSecondary}>
                          {formatReviewDate(myReview.createdAt)}
                        </TamaguiText>
                      </XStack>

                      {/* Hiển thị sao của bản thân */}
                      <XStack alignItems="center" gap={4} marginBottom={8}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Ionicons
                            key={s}
                            name={s <= (myReview.rating || 5) ? "star" : "star-outline"}
                            size={20}
                            color={theme.starActive}
                          />
                        ))}
                        <TamaguiText fontSize={13} fontWeight="700" color={theme.starActive} marginLeft={6}>
                          {myReview.rating}/5 sao
                        </TamaguiText>
                      </XStack>

                      {/* Nội dung nhận xét của bản thân */}
                      <Paragraph size="$3" fontStyle="italic" color={theme.textPrimary} lineHeight={20}>
                        "{myReview.comment}"
                      </Paragraph>

                      <XStack alignItems="center" gap={6} marginTop={10}>
                        <Ionicons name="information-circle-outline" size={14} color={theme.textTertiary} />
                        <TamaguiText fontSize={11} color={theme.textTertiary}>
                          Mỗi sự kiện chỉ được đánh giá 1 lần. Đánh giá của bạn đã được lưu vĩnh viễn.
                        </TamaguiText>
                      </XStack>
                    </Card>
                  ) : (
                    // TH2: CHƯA ĐÁNH GIÁ -> Cho phép đánh giá
                    <Card
                      borderRadius={12}
                      borderWidth={1}
                      borderColor={theme.border}
                      backgroundColor={theme.surfaceSecondary}
                      padding={14}
                      marginTop={6}
                    >
                      <Heading
                        size="$3"
                        fontWeight="700"
                        textAlign="center"
                        color={theme.textPrimary}
                        marginBottom={8}
                      >
                        Đánh giá trải nghiệm của bạn
                      </Heading>

                      {/* Bộ chọn sao */}
                      <StarRating
                        value={draftRating}
                        onChange={(val) =>
                          setDraftRatings((prev) => ({ ...prev, [eventId]: val }))
                        }
                        size={36}
                        starActive={theme.starActive}
                        starInactive={theme.starInactive}
                      />

                      {/* Ô nhập nhận xét */}
                      <Paragraph size="$2" fontWeight="600" color={theme.textSecondary} marginBottom={6}>
                        Ý kiến đóng góp & nhận xét của bạn:
                      </Paragraph>
                      <TextArea
                        borderWidth={1}
                        borderRadius={10}
                        paddingHorizontal={12}
                        paddingVertical={10}
                        fontSize={13}
                        minHeight={90}
                        backgroundColor={theme.inputBackground}
                        borderColor={theme.inputBorder}
                        color={theme.textPrimary}
                        placeholder="Chia sẻ cảm nhận về diễn giả, công tác tổ chức, nội dung chương trình..."
                        placeholderTextColor={theme.textTertiary as any}
                        value={draftComment}
                        onChangeText={(txt) =>
                          setDraftComments((prev) => ({ ...prev, [eventId]: txt }))
                        }
                        maxLength={500}
                        accessibilityLabel="Nhận xét sự kiện"
                      />
                      <Paragraph
                        size="$1"
                        textAlign="right"
                        color={theme.textTertiary}
                        marginTop={4}
                        marginBottom={12}
                      >
                        {draftComment.length}/500 ký tự
                      </Paragraph>

                      {/* Nút gửi đánh giá (chỉ được gửi 1 lần) */}
                      <Button
                        borderRadius={10}
                        height={46}
                        backgroundColor={isSubmitting ? "#94A3B8" : theme.primary}
                        opacity={isSubmitting ? 0.7 : 1}
                        disabled={isSubmitting}
                        onPress={() => handleSubmitReview(evt)}
                        pressStyle={{ opacity: 0.85 }}
                        accessibilityRole="button"
                        accessibilityLabel="Gửi đánh giá sự kiện này"
                      >
                        {isSubmitting ? (
                          <Spinner color="#FFFFFF" />
                        ) : (
                          <XStack alignItems="center" justifyContent="center" gap={8}>
                            <Ionicons name="send" size={16} color="#FFFFFF" />
                            <TamaguiText fontSize={15} fontWeight="700" color="#FFFFFF">
                              Gửi đánh giá
                            </TamaguiText>
                          </XStack>
                        )}
                      </Button>
                    </Card>
                  )}
                </YStack>
              )}
            </Card>
          );
        })}

        {/* ── Chỉ báo tự động tải thêm khi kéo tới cuối trang (+10 sự kiện) ── */}
        {isLoadingMore ? (
          <XStack alignItems="center" justifyContent="center" gap={8} paddingVertical={16}>
            <Spinner size="small" color={theme.primary} />
            <TamaguiText fontSize={13} fontWeight="600" color={theme.primary}>
              Đang tải thêm 10 sự kiện tiếp theo...
            </TamaguiText>
          </XStack>
        ) : hasMore ? (
          <XStack alignItems="center" justifyContent="center" gap={6} paddingVertical={14}>
            <Ionicons name="arrow-down" size={14} color={theme.textTertiary} />
            <TamaguiText fontSize={12} color={theme.textTertiary}>
              Kéo xuống cuối trang để tải thêm 10 sự kiện (còn {filteredEvents.length - displayedEvents.length} sự kiện)
            </TamaguiText>
          </XStack>
        ) : (
          displayedEvents.length > 0 && (
            <YStack alignItems="center" marginVertical={20}>
              <XStack alignItems="center" gap={6}>
                <Ionicons name="checkmark-done" size={16} color={theme.textTertiary} />
                <TamaguiText fontSize={12} color={theme.textTertiary}>
                  Đã hiển thị tất cả {filteredEvents.length} sự kiện
                </TamaguiText>
              </XStack>
            </YStack>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Native Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  thumbnailImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },
  bannerImage: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#E2E8F0",
  },
});
