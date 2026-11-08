import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  FlatList,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
  Keyboard,
  TouchableOpacity,
  RefreshControl,
  View,
  Text,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { MainStackParamList } from "../../navigation/types";
import { navigate } from "../../navigation/navigationRef";
import { useAppSelector } from "../../hooks/redux";
import { useAppTheme } from "../../theme";
import api from "../../services/api";
import {
  findDbEvent,
  findDbUser,
  getDefaultDbUser,
  getOnlyAttendedEventsFromDb,
  getEnrichedFeedbacksFromDb,
  loadFeedbacksFromStorage,
  mergeFeedbacksIntoDb,
  enrichFeedback,
  EnrichedFeedback,
} from "../../data/dbService";

import FeedbackEventCard from "../../components/feedback/FeedbackEventCard";

type FeedbackNavProp = NativeStackNavigationProp<MainStackParamList>;
type FeedbackRouteProp = RouteProp<MainStackParamList, "Feedback">;
type FilterTab = "all" | "reviewed" | "not_reviewed";

// ---------------------------------------------------------------------------
// FeedbackScreen Component
// ---------------------------------------------------------------------------

export default function FeedbackScreen() {
  const navigation = useNavigation<FeedbackNavProp>();
  const route = useRoute<FeedbackRouteProp>();
  const { theme, isDark } = useAppTheme();

  const authUser = useAppSelector((s) => s.auth.user);
  const defaultStudent = getDefaultDbUser();
  const currentUser = authUser?._id ? authUser : findDbUser(defaultStudent._id);
  const currentUserId = currentUser?._id || (currentUser as any)?.id || defaultStudent._id;

  // Danh sách sự kiện đã tham dự (khởi tạo từ dbService và cập nhật trực tiếp từ Backend_v2)
  const [attendedEvents, setAttendedEvents] = useState<any[]>(() => {
    return getOnlyAttendedEventsFromDb(currentUserId);
  });

  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [visibleLimit, setVisibleLimit] = useState<number>(5);

  const [expandedEventId, setExpandedEventId] = useState<string | null>(
    route.params?.eventId || (attendedEvents[0]?.id || attendedEvents[0]?._id || null),
  );

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
    try {
      const [regList, allEvents] = await Promise.all([
        api.getRegistrationsByUser(currentUserId),
        api.getEvents(),
      ]);

      if (Array.isArray(regList) && regList.length > 0) {
        const eventsMap = new Map<string, any>();
        for (const r of regList) {
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

    // 2. Lấy trực tiếp danh sách feedbacks từ Backend MongoDB
    try {
      const apiFeedbacks = await api.getAllFeedbacks();
      if (Array.isArray(apiFeedbacks)) {
        const merged = mergeFeedbacksIntoDb(apiFeedbacks);
        setFeedbacks(merged);
      }
    } catch {
      // Offline fallback an toàn nếu không kết nối được backend
      try {
        const stored = await loadFeedbacksFromStorage();
        if (stored && stored.length > 0) {
          setFeedbacks(stored);
        }
      } catch {
        // ignore
      }
    }
  }, [currentUserId]);

  useEffect(() => {
    loadPersistedData();
  }, [loadPersistedData]);

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

  // Helper tìm "Đánh giá của bạn" (Mỗi sự kiện chỉ được đánh giá 1 lần)
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
        return (
          fEvtId === eventId &&
          (fUserId === currentUserId ||
            fUserId === defaultStudent._id ||
            (authUser?._id && fUserId === authUser._id))
        );
      });
    },
    [feedbacks, currentUserId, defaultStudent._id, authUser?._id],
  );

  // Đếm số lượng cho 3 tab
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

  // Lọc danh sách theo tab
  const filteredEvents = useMemo(() => {
    return attendedEvents.filter((evt) => {
      const id = evt.id || evt._id;
      const isReviewed = !!getMyReview(id);
      if (filterTab === "reviewed") return isReviewed;
      if (filterTab === "not_reviewed") return !isReviewed;
      return true;
    });
  }, [attendedEvents, filterTab, getMyReview]);

  const displayedEvents = useMemo(() => {
    return filteredEvents.slice(0, visibleLimit);
  }, [filteredEvents, visibleLimit]);

  const hasMore = visibleLimit < filteredEvents.length;

  const handleLoadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleLimit((prev) => Math.min(prev + 10, filteredEvents.length));
      setIsLoadingMore(false);
    }, 250);
  }, [hasMore, isLoadingMore, filteredEvents.length]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
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

  // Gửi đánh giá cho sự kiện
  const handleSubmitReview = async (evt: any) => {
    const eventId = evt.id || evt._id;
    if (submittingEventId) return;

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
      let serverRes: any = null;
      try {
        serverRes = await api.createFeedback(payload);
      } catch (apiErr: any) {
        const errMsg = apiErr?.response?.data?.message || apiErr?.message || "Không thể kết nối đến máy chủ MongoDB.";
        const fullMsg = `Lỗi máy chủ MongoDB: ${errMsg}\nVui lòng kiểm tra server Backend.`;
        if (Platform.OS === "web") alert(fullMsg);
        else Alert.alert("Không thể lưu đánh giá", fullMsg);
        return;
      }

      if (serverRes && (serverRes.id || serverRes._id)) {
        const enrichedServer = enrichFeedback(serverRes);
        setFeedbacks((prev) => {
          const sKey = serverRes.id || serverRes._id;
          const filtered = prev.filter((f) => (f.id || f._id) !== sKey);
          return [enrichedServer, ...filtered];
        });
        mergeFeedbacksIntoDb([serverRes]);
      }

      setDraftComments((prev) => ({ ...prev, [eventId]: "" }));
      const successMsg = `Đánh giá cho sự kiện "${evt.title}" (${ratingVal} sao) đã được lưu trực tiếp vào cơ sở dữ liệu MongoDB.`;
      if (Platform.OS === "web") alert(`Đánh giá thành công!\n${successMsg}`);
      else Alert.alert("Đánh giá thành công!", successMsg);
    } finally {
      setSubmittingEventId(null);
    }
  };

  // Cấu hình 3 tab bộ lọc
  const filterTabsConfig = [
    {
      key: "all" as FilterTab,
      label: `Tất cả (${allCount})`,
      icon: "apps-outline" as const,
      color: filterTab === "all" ? "#FFFFFF" : theme.textSecondary,
    },
    {
      key: "reviewed" as FilterTab,
      label: `Đã đánh giá (${reviewedCount})`,
      icon: "checkmark-circle" as const,
      color: filterTab === "reviewed" ? "#FFFFFF" : theme.success,
    },
    {
      key: "not_reviewed" as FilterTab,
      label: `Chưa đánh giá (${notReviewedCount})`,
      icon: "time-outline" as const,
      color: filterTab === "not_reviewed" ? "#FFFFFF" : "#F59E0B",
    },
  ];

  // Render Header của danh sách (gồm nút Quay lại, Tiêu đề, 3 Tab, và Số lượng hiển thị)
  const renderListHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Header Bar */}
      <View style={styles.navBarRow}>
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigate("Home");
            }
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
        >
          <View style={styles.backButtonContent}>
            <Ionicons name="chevron-back" size={20} color={theme.primary} />
            <Text style={[styles.backButtonText, { color: theme.primary }]}>
              Quay lại
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
        Góp ý & Đánh giá sự kiện
      </Text>
      <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
        Danh sách sự kiện bạn đã tham dự. Mỗi sự kiện chỉ được phép đánh giá 1 lần. Đánh giá của bạn giúp nâng cao chất lượng các chương trình.
      </Text>

      {/* 3 Ô Bộ Lọc (Tất cả, Đã đánh giá, Chưa đánh giá) */}
      <View style={styles.tabsRow}>
        {filterTabsConfig.map((tab) => {
          const isSelected = filterTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                {
                  backgroundColor: isSelected ? theme.primary : theme.surface,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
              onPress={() => handleTabChange(tab.key)}
              activeOpacity={0.75}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
            >
              <View style={styles.tabContent}>
                <Ionicons name={tab.icon} size={16} color={tab.color} />
                <Text
                  style={[
                    styles.tabText,
                    { color: isSelected ? "#FFFFFF" : theme.textPrimary },
                  ]}
                >
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Thông tin số lượng hiển thị */}
      <View style={styles.countRow}>
        <Text style={[styles.countText, { color: theme.textTertiary }]}>
          Hiển thị {displayedEvents.length} / {filteredEvents.length} sự kiện gần nhất
        </Text>
        {filterTab !== "all" && (
          <TouchableOpacity onPress={() => handleTabChange("all")}>
            <Text style={[styles.viewAllText, { color: theme.primary }]}>
              Xem tất cả
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Render khi danh sách trống
  const renderListEmpty = () => (
    <View
      style={[
        styles.emptyCard,
        {
          borderColor: theme.border,
          backgroundColor: theme.surface,
        },
      ]}
    >
      <Ionicons
        name={filterTab === "reviewed" ? "checkmark-done-circle-outline" : "file-tray-outline"}
        size={54}
        color={theme.primary}
      />
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
        {filterTab === "reviewed"
          ? "Chưa có sự kiện nào đã đánh giá"
          : filterTab === "not_reviewed"
          ? "Bạn đã hoàn thành đánh giá cho tất cả sự kiện!"
          : "Không tìm thấy sự kiện đã tham dự"}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        {filterTab === "not_reviewed"
          ? "Cảm ơn bạn đã đóng góp ý kiến quý báu cho nhà trường."
          : "Hãy tham gia các sự kiện để trải nghiệm và gửi đánh giá nhé."}
      </Text>
    </View>
  );

  // Render Footer (tải thêm sự kiện hoặc thông báo đã hết)
  const renderListFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.footerLoading}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.loadingMoreText, { color: theme.primary }]}>
            Đang tải thêm 10 sự kiện tiếp theo...
          </Text>
        </View>
      );
    }
    if (hasMore) {
      return (
        <View style={styles.footerPrompt}>
          <Ionicons name="arrow-down" size={14} color={theme.textTertiary} />
          <Text style={[styles.footerPromptText, { color: theme.textTertiary }]}>
            Kéo xuống cuối trang để tải thêm 10 sự kiện (còn {filteredEvents.length - displayedEvents.length} sự kiện)
          </Text>
        </View>
      );
    }
    if (displayedEvents.length > 0) {
      return (
        <View style={styles.footerEnd}>
          <View style={styles.footerEndContent}>
            <Ionicons name="checkmark-done" size={16} color={theme.textTertiary} />
            <Text style={[styles.footerPromptText, { color: theme.textTertiary }]}>
              Đã hiển thị tất cả {filteredEvents.length} sự kiện
            </Text>
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={["top", "bottom"]}
    >
      <StatusBar barStyle={theme.statusBarStyle} />

      <FlatList
        data={displayedEvents}
        keyExtractor={(item) => item.id || item._id}
        renderItem={({ item: evt }) => {
          const eventId = evt.id || evt._id;
          const myReview = getMyReview(eventId);
          const isExpanded = expandedEventId === eventId;

          return (
            <FeedbackEventCard
              key={eventId}
              evt={evt}
              myReview={myReview}
              isExpanded={isExpanded}
              onToggleExpand={() => setExpandedEventId(isExpanded ? null : eventId)}
              draftRating={draftRatings[eventId] || 5}
              onDraftRatingChange={(val) =>
                setDraftRatings((prev) => ({ ...prev, [eventId]: val }))
              }
              draftComment={draftComments[eventId] || ""}
              onDraftCommentChange={(txt) =>
                setDraftComments((prev) => ({ ...prev, [eventId]: txt }))
              }
              isSubmitting={submittingEventId === eventId}
              onSubmitReview={() => handleSubmitReview(evt)}
              theme={theme}
              isDark={isDark}
              formatEventDate={formatEventDate}
              formatReviewDate={formatReviewDate}
            />
          );
        }}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderListEmpty}
        ListFooterComponent={renderListFooter}
        contentContainerStyle={styles.listContent}
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 4,
  },
  navBarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    paddingTop: Platform.OS === "android" ? 10 : 6,
  },
  backButton: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  tabButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  footerLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  loadingMoreText: {
    fontSize: 13,
    fontWeight: "600",
  },
  footerPrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
  },
  footerPromptText: {
    fontSize: 12,
  },
  footerEnd: {
    alignItems: "center",
    marginVertical: 20,
  },
  footerEndContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
