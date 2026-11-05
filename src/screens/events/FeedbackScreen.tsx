import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation/types";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { submitFeedback } from "../../features/events/feedbacksSlice";
import { useAppTheme } from "../../theme";
import {
  findDbEvent,
  findDbUser,
  getDefaultDbUser,
  getAttendedEventsFromDb,
  getEnrichedFeedbacksFromDb,
  addFeedbackToDb,
  EnrichedFeedback,
} from "../../data/dbService";

type FeedbackNavProp = NativeStackNavigationProp<MainStackParamList>;
type FeedbackRouteProp = RouteProp<MainStackParamList, "Feedback">;

// ---------------------------------------------------------------------------
// StarRating component
// ---------------------------------------------------------------------------

interface StarRatingProps {
  value: number;
  onChange: (v: number) => void;
  size?: number;
  starActive: string;
  starInactive: string;
}

function StarRating({
  value,
  onChange,
  size = 36,
  starActive,
  starInactive,
}: StarRatingProps) {
  const ratingLabels: Record<number, string> = {
    1: "1/5 - Cần cải thiện",
    2: "2/5 - Tạm được",
    3: "3/5 - Bình thường",
    4: "4/5 - Tốt, hài lòng",
    5: "5/5 - Rất xuất sắc & bổ ích",
  };

  return (
    <View style={starStyles.wrapper}>
      <View
        style={starStyles.row}
        accessibilityRole="adjustable"
        accessibilityLabel={`Đánh giá ${value} sao trên 5`}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= value;
          return (
            <TouchableOpacity
              key={star}
              onPress={() => onChange(star)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${star} sao`}
              style={starStyles.touchable}
            >
              <Text
                style={[
                  starStyles.star,
                  {
                    fontSize: size,
                    color: isFilled ? starActive : starInactive,
                  },
                ]}
              >
                {isFilled ? "★" : "☆"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={[starStyles.ratingLabel, { color: starActive }]}>
        {ratingLabels[value] || ""}
      </Text>
    </View>
  );
}

const starStyles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  touchable: { paddingHorizontal: 4, paddingVertical: 4 },
  star: { lineHeight: 46, includeFontPadding: false },
  ratingLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
});

// ---------------------------------------------------------------------------
// FeedbackScreen
// ---------------------------------------------------------------------------

export default function FeedbackScreen() {
  const navigation = useNavigation<FeedbackNavProp>();
  const route = useRoute<FeedbackRouteProp>();
  const dispatch = useAppDispatch();
  const { theme, isDark, mode, toggleTheme } = useAppTheme();

  const authUser = useAppSelector((s) => s.auth.user);
  const { submitting } = useAppSelector((s) => s.feedbacks);

  // Người dùng từ db.json
  const defaultStudent = getDefaultDbUser();
  const currentUser = authUser?._id ? authUser : findDbUser(defaultStudent._id);

  // Danh sách sự kiện lấy từ db.json
  const eventsList = useMemo(
    () => getAttendedEventsFromDb(currentUser?._id),
    [currentUser?._id],
  );

  // Sự kiện được chọn từ params hoặc mặc định từ db.json
  const initialEventId =
    route.params?.eventId || eventsList[0]?.id || eventsList[0]?._id;
  const [selectedEventId, setSelectedEventId] =
    useState<string>(initialEventId);

  // Chi tiết sự kiện đang chọn từ db.json
  const currentEvent = useMemo(() => {
    return findDbEvent(selectedEventId) || eventsList[0];
  }, [selectedEventId, eventsList]);

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  // Danh sách đánh giá lấy trực tiếp từ db.json
  const [feedbacks, setFeedbacks] = useState<EnrichedFeedback[]>(() => {
    return getEnrichedFeedbacksFromDb();
  });

  const handleSelectEvent = (evt: any) => {
    const id = evt.id || evt._id;
    setSelectedEventId(id);
    setImageError(false);
  };

  const handleSubmit = async () => {
    if (!currentEvent) {
      Alert.alert("Lỗi", "Chưa chọn sự kiện để đánh giá.");
      return;
    }
    if (rating === 0) {
      Alert.alert("Thiếu đánh giá", "Vui lòng chọn số sao từ 1 đến 5.");
      return;
    }
    if (!comment.trim()) {
      Alert.alert(
        "Thiếu nhận xét",
        "Vui lòng nhập vài dòng cảm nhận của bạn về sự kiện.",
      );
      return;
    }

    const payload = {
      eventId: currentEvent.id || currentEvent._id,
      userId:
        currentUser?._id || (currentUser as any)?.id || defaultStudent._id,
      rating,
      comment: comment.trim(),
    };

    // 1. Thêm ngay vào dbState in-memory của db.json
    const newEnriched = addFeedbackToDb(payload);
    setFeedbacks((prev) => [newEnriched, ...prev]);

    // 2. Thử đồng bộ với Redux / API
    try {
      await dispatch(submitFeedback(payload));
    } catch (e) {
      // Bỏ qua lỗi nếu backend offline, dữ liệu đã lưu vào db.json in-memory
    }

    Alert.alert(
      "✅ Đánh giá thành công!",
      `Cảm ơn bạn đã đóng góp ý kiến cho sự kiện "${currentEvent.title}" với ${rating} sao!`,
      [
        {
          text: "Tiếp tục",
          onPress: () => {
            setComment("");
            setRating(5);
          },
        },
        {
          text: "Về trang chủ",
          onPress: () => navigation.navigate("Home"),
        },
      ],
    );
  };

  // Định dạng ngày hiển thị
  const formatEventDate = (timeObj?: { start?: string; end?: string }) => {
    if (!timeObj?.start) return "Sắp diễn ra";
    try {
      const d = new Date(timeObj.start);
      return `Ngày ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} • ${d.getHours()}:${d.getMinutes() < 10 ? "0" : ""}${d.getMinutes()}`;
    } catch {
      return "Sắp diễn ra";
    }
  };

  const eventImage = currentEvent?.images?.[0];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Header Bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() =>
              navigation.canGoBack()
                ? navigation.goBack()
                : navigation.navigate("Home")
            }
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <Text style={[styles.backArrow, { color: theme.primary }]}>‹</Text>
            <Text style={[styles.backLabel, { color: theme.primary }]}>
              Quay lại
            </Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          {/* Nút bấm đổi theme Sáng/Tối trực tiếp */}
          <TouchableOpacity
            style={[
              styles.themeToggleBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={toggleTheme}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Chuyển chế độ ${isDark ? "Sáng" : "Tối"}`}
          >
            <Text style={styles.themeToggleEmoji}>{isDark ? "☀️" : "🌙"}</Text>
            <Text
              style={[styles.themeToggleText, { color: theme.textPrimary }]}
            >
              {mode}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.header, { color: theme.textPrimary }]}>
          Đánh giá sự kiện
        </Text>
        <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
          Dữ liệu đồng bộ trực tiếp từ db.json
        </Text>

        {/* ── Thanh chọn sự kiện từ db.json ── */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Chọn sự kiện cần đánh giá
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.eventChipsScroll}
        >
          {eventsList.map((evt) => {
            const evtId = evt.id || evt._id;
            const isSelected =
              evtId === (currentEvent?.id || currentEvent?._id);
            return (
              <TouchableOpacity
                key={evtId}
                style={[
                  styles.eventChip,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => handleSelectEvent(evt)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.eventChipText,
                    { color: isSelected ? "#FFFFFF" : theme.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {evt.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Thẻ sự kiện chi tiết từ db.json ── */}
        {currentEvent && (
          <View
            style={[
              styles.eventCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                shadowColor: theme.cardShadow,
              },
            ]}
          >
            <View style={styles.eventRow}>
              {eventImage && !imageError ? (
                <Image
                  source={{ uri: eventImage }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <View
                  style={[
                    styles.thumbnailFallback,
                    { backgroundColor: theme.primaryLight },
                  ]}
                >
                  <Text
                    style={[
                      styles.thumbnailFallbackText,
                      { color: theme.primary },
                    ]}
                  >
                    🎓
                  </Text>
                </View>
              )}

              <View style={styles.eventMeta}>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: theme.primaryLight },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryBadgeText,
                        { color: theme.primary },
                      ]}
                    >
                      {currentEvent.category || "Sự kiện"}
                    </Text>
                  </View>
                  {currentEvent.trainingPoints ? (
                    <Text
                      style={[styles.pointsBadge, { color: theme.success }]}
                    >
                      +{currentEvent.trainingPoints} ĐRL
                    </Text>
                  ) : null}
                </View>

                <Text
                  style={[styles.eventTitle, { color: theme.textPrimary }]}
                  numberOfLines={2}
                >
                  {currentEvent.title}
                </Text>

                <Text
                  style={[styles.eventDate, { color: theme.textSecondary }]}
                >
                  📅 {formatEventDate(currentEvent.time)}
                </Text>

                <Text
                  style={[styles.eventLocation, { color: theme.textTertiary }]}
                  numberOfLines={1}
                >
                  📍 {currentEvent.location || "IUH TP. Hồ Chí Minh"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Form đánh giá sao ── */}
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              shadowColor: theme.cardShadow,
            },
          ]}
        >
          <Text style={[styles.question, { color: theme.textPrimary }]}>
            Trải nghiệm của bạn về sự kiện này?
          </Text>

          <StarRating
            value={rating}
            onChange={setRating}
            size={40}
            starActive={theme.starActive}
            starInactive={theme.starInactive}
          />

          {/* Ô nhập nhận xét */}
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Ý kiến đóng góp & nhận xét
          </Text>
          <TextInput
            style={[
              styles.commentInput,
              {
                backgroundColor: theme.inputBackground,
                borderColor: isFocused ? theme.primary : theme.inputBorder,
                color: theme.textPrimary,
              },
            ]}
            placeholder="Chia sẻ cảm nhận của bạn về diễn giả, công tác tổ chức, nội dung..."
            placeholderTextColor={theme.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={comment}
            onChangeText={setComment}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={500}
            accessibilityLabel="Ô nhập cảm nhận"
          />
          <Text style={[styles.charCount, { color: theme.textTertiary }]}>
            {comment.length}/500 ký tự
          </Text>

          {/* Nút gửi đánh giá */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: theme.primary },
              (rating === 0 || submitting) && styles.submitButtonDisabled,
            ]}
            activeOpacity={0.85}
            disabled={rating === 0 || submitting}
            accessibilityRole="button"
            accessibilityLabel="Gửi đánh giá"
            onPress={handleSubmit}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Gửi đánh giá</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Danh sách đánh giá đã có từ db.json ── */}
        <View style={styles.feedbacksHeaderRow}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.textPrimary, marginBottom: 0 },
            ]}
          >
            Đánh giá từ cộng đồng sinh viên ({feedbacks.length})
          </Text>
        </View>
        <Text
          style={[styles.feedbacksSubtitle, { color: theme.textSecondary }]}
        >
          Dữ liệu nạp từ feedbacks trong file server/db.json
        </Text>

        {feedbacks.map((item) => (
          <View
            key={item.id || item._id}
            style={[
              styles.reviewCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                shadowColor: theme.cardShadow,
              },
            ]}
          >
            <View style={styles.reviewUserRow}>
              {item.userAvatar ? (
                <Image
                  source={{ uri: item.userAvatar }}
                  style={styles.reviewAvatar}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.reviewAvatarFallback,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Text style={styles.reviewAvatarInitial}>
                    {(item.userName || "S").charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={styles.reviewUserInfo}>
                <Text
                  style={[styles.reviewUserName, { color: theme.textPrimary }]}
                >
                  {item.userName}
                </Text>
                <Text
                  style={[
                    styles.reviewUserFaculty,
                    { color: theme.textSecondary },
                  ]}
                >
                  {item.userFaculty || "Sinh viên IUH"}
                </Text>
              </View>

              <View style={styles.reviewStarsBox}>
                <Text style={[styles.reviewStars, { color: theme.starActive }]}>
                  {"★".repeat(item.rating || 5)}
                  {"☆".repeat(5 - (item.rating || 5))}
                </Text>
              </View>
            </View>

            {/* Tên sự kiện được review */}
            <View
              style={[
                styles.reviewEventBox,
                { backgroundColor: theme.surfaceSecondary },
              ]}
            >
              <Text
                style={[styles.reviewEventTitle, { color: theme.textPrimary }]}
                numberOfLines={1}
              >
                🎯 {item.eventTitle}
              </Text>
            </View>

            {/* Nội dung comment */}
            <Text style={[styles.reviewComment, { color: theme.textPrimary }]}>
              "{item.comment}"
            </Text>

            <Text style={[styles.reviewDate, { color: theme.textTertiary }]}>
              {new Date(item.createdAt).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  backArrow: {
    fontSize: 22,
    fontWeight: "300",
    lineHeight: 22,
    marginRight: 4,
  },
  backLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  themeToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  themeToggleEmoji: {
    fontSize: 14,
  },
  themeToggleText: {
    fontSize: 13,
    fontWeight: "600",
  },

  header: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    marginBottom: 16,
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },

  eventChipsScroll: {
    gap: 8,
    paddingBottom: 16,
  },
  eventChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 240,
  },
  eventChipText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Event Card
  eventCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  thumbnailImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },
  thumbnailFallback: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailFallbackText: {
    fontSize: 32,
  },
  eventMeta: {
    flex: 1,
    marginLeft: 14,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  pointsBadge: {
    fontSize: 12,
    fontWeight: "700",
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 12,
  },

  // Form Card
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  question: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 110,
  },
  charCount: {
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
    marginBottom: 16,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  submitButtonDisabled: {
    backgroundColor: "#94A3B8",
    opacity: 0.7,
  },

  // Community Feedbacks
  feedbacksHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  feedbacksSubtitle: {
    fontSize: 12,
    marginBottom: 14,
    marginTop: 2,
  },
  reviewCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  reviewUserRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
  },
  reviewAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewAvatarInitial: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  reviewUserInfo: {
    flex: 1,
    marginLeft: 10,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: "700",
  },
  reviewUserFaculty: {
    fontSize: 11,
  },
  reviewStarsBox: {
    alignItems: "flex-end",
  },
  reviewStars: {
    fontSize: 16,
    letterSpacing: 2,
  },
  reviewEventBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  reviewEventTitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 6,
    fontStyle: "italic",
  },
  reviewDate: {
    fontSize: 11,
  },
});
