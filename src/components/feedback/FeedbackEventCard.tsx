import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StarRating from "./StarRating";

export interface FeedbackEventCardProps {
  evt: any;
  myReview?: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  draftRating: number;
  onDraftRatingChange: (val: number) => void;
  draftComment: string;
  onDraftCommentChange: (val: string) => void;
  isSubmitting: boolean;
  onSubmitReview: () => void;
  theme: any;
  isDark: boolean;
  formatEventDate: (timeObj?: any) => string;
  formatReviewDate: (dateStr?: string) => string;
}

export default function FeedbackEventCard({
  evt,
  myReview,
  isExpanded,
  onToggleExpand,
  draftRating,
  onDraftRatingChange,
  draftComment,
  onDraftCommentChange,
  isSubmitting,
  onSubmitReview,
  theme,
  isDark,
  formatEventDate,
  formatReviewDate,
}: FeedbackEventCardProps) {
  const isReviewed = !!myReview;
  const bannerUri = evt.images?.[0];

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: isExpanded ? theme.primary : theme.border,
          backgroundColor: theme.surface,
        },
      ]}
    >
      {/* Header của thẻ sự kiện */}
      <TouchableOpacity
        onPress={onToggleExpand}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${evt.title}, ${isReviewed ? "Đã đánh giá" : "Chưa đánh giá"}`}
      >
        <View style={styles.headerRow}>
          {bannerUri ? (
            <Image
              source={{ uri: bannerUri }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.thumbnailFallback,
                { backgroundColor: theme.primaryLight },
              ]}
            >
              <Ionicons name="school-outline" size={32} color={theme.primary} />
            </View>
          )}

          <View style={styles.headerInfo}>
            <View style={styles.badgeRow}>
              <View style={styles.categoryAndPoints}>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: theme.primaryLight },
                  ]}
                >
                  <Text
                    style={[styles.categoryText, { color: theme.primary }]}
                  >
                    {evt.category || "Học thuật"}
                  </Text>
                </View>
                {evt.trainingPoints ? (
                  <Text style={[styles.pointsText, { color: theme.success }]}>
                    +{evt.trainingPoints} ĐRL
                  </Text>
                ) : null}
              </View>

              {/* Huy hiệu trạng thái đánh giá */}
              {isReviewed ? (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: isDark ? "#064E3B" : "#ECFDF5" },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={13}
                    color={theme.success}
                  />
                  <Text
                    style={[styles.statusText, { color: theme.success }]}
                  >
                    {myReview.rating}★ Đã đánh giá
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: isDark ? "#78350F" : "#FEF3C7" },
                  ]}
                >
                  <Ionicons name="time" size={13} color="#D97706" />
                  <Text style={[styles.statusText, { color: "#D97706" }]}>
                    Chưa đánh giá
                  </Text>
                </View>
              )}
            </View>

            <Text
              style={[styles.eventTitle, { color: theme.textPrimary }]}
              numberOfLines={2}
            >
              {evt.title}
            </Text>

            <View style={styles.dateRow}>
              <Ionicons
                name="calendar-outline"
                size={12}
                color={theme.textSecondary}
              />
              <Text
                style={[styles.dateText, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {formatEventDate(evt.time)}
              </Text>
            </View>
          </View>

          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={theme.textTertiary}
            style={styles.chevron}
          />
        </View>
      </TouchableOpacity>

      {/* Phần Mở Rộng: Chi tiết sự kiện & Đánh giá */}
      {isExpanded && (
        <View
          style={[
            styles.expandedSection,
            { borderTopColor: theme.border },
          ]}
        >
          {bannerUri ? (
            <Image
              source={{ uri: bannerUri }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          ) : null}

          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <Ionicons
                name="location-outline"
                size={15}
                color={theme.primary}
              />
              <Text style={[styles.detailText, { color: theme.textPrimary }]}>
                {evt.location || "Trường Đại học Công nghiệp TP.HCM (IUH)"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons
                name="people-outline"
                size={15}
                color={theme.textSecondary}
              />
              <Text
                style={[styles.detailText, { color: theme.textSecondary }]}
              >
                Ban tổ chức: {evt.organizer || "Đoàn Thanh niên - Hội Sinh viên IUH"}
              </Text>
            </View>
            {evt.description ? (
              <Text
                style={[
                  styles.descriptionText,
                  { color: theme.textSecondary },
                ]}
              >
                {evt.description}
              </Text>
            ) : null}
          </View>

          {isReviewed ? (
            /* TH1: ĐÃ ĐÁNH GIÁ -> Hiển thị "Đánh giá của bạn" (Mỗi sự kiện chỉ được đánh giá 1 lần) */
            <View
              style={[
                styles.reviewBox,
                {
                  borderColor: theme.success,
                  backgroundColor: isDark ? "#062E25" : "#F0FDF4",
                },
              ]}
            >
              <View style={styles.reviewHeader}>
                <View style={styles.reviewTitleRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={theme.success}
                  />
                  <Text
                    style={[styles.reviewTitleText, { color: theme.success }]}
                  >
                    Đánh giá của bạn
                  </Text>
                </View>
                <Text
                  style={[
                    styles.reviewDateText,
                    { color: theme.textSecondary },
                  ]}
                >
                  {formatReviewDate(myReview.createdAt)}
                </Text>
              </View>

              <View style={styles.starDisplayRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name={s <= (myReview.rating || 5) ? "star" : "star-outline"}
                    size={20}
                    color={theme.starActive}
                  />
                ))}
                <Text
                  style={[styles.starRatingValue, { color: theme.starActive }]}
                >
                  {myReview.rating}/5 sao
                </Text>
              </View>

              <Text
                style={[styles.commentText, { color: theme.textPrimary }]}
              >
                "{myReview.comment}"
              </Text>

              <View style={styles.footerNoteRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={14}
                  color={theme.textTertiary}
                />
                <Text
                  style={[styles.footerNoteText, { color: theme.textTertiary }]}
                >
                  Mỗi sự kiện chỉ được đánh giá 1 lần. Đánh giá của bạn đã được lưu vĩnh viễn.
                </Text>
              </View>
            </View>
          ) : (
            /* TH2: CHƯA ĐÁNH GIÁ -> Form đánh giá */
            <View
              style={[
                styles.formBox,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.surfaceSecondary,
                },
              ]}
            >
              <Text
                style={[styles.formTitle, { color: theme.textPrimary }]}
              >
                Đánh giá trải nghiệm của bạn
              </Text>

              <StarRating
                value={draftRating}
                onChange={onDraftRatingChange}
                size={36}
                starActive={theme.starActive}
                starInactive={theme.starInactive}
              />

              <Text
                style={[styles.formLabel, { color: theme.textSecondary }]}
              >
                Ý kiến đóng góp & nhận xét của bạn:
              </Text>

              <TextInput
                style={[
                  styles.textAreaInput,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.textPrimary,
                  },
                ]}
                multiline
                numberOfLines={4}
                placeholder="Chia sẻ cảm nhận về diễn giả, công tác tổ chức, nội dung chương trình..."
                placeholderTextColor={theme.textTertiary}
                value={draftComment}
                onChangeText={onDraftCommentChange}
                maxLength={500}
                accessibilityLabel="Nhận xét sự kiện"
              />

              <Text
                style={[styles.charCountText, { color: theme.textTertiary }]}
              >
                {draftComment.length}/500 ký tự
              </Text>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: isSubmitting ? "#94A3B8" : theme.primary,
                    opacity: isSubmitting ? 0.7 : 1,
                  },
                ]}
                disabled={isSubmitting}
                activeOpacity={0.85}
                onPress={onSubmitReview}
                accessibilityRole="button"
                accessibilityLabel="Gửi đánh giá sự kiện này"
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={styles.submitContent}>
                    <Ionicons name="send" size={16} color="#FFFFFF" />
                    <Text style={styles.submitText}>Gửi đánh giá</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  thumbnailImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },
  thumbnailFallback: {
    width: 70,
    height: 70,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  categoryAndPoints: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "700",
  },
  pointsText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dateText: {
    fontSize: 11,
  },
  chevron: {
    marginLeft: 6,
  },
  expandedSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  bannerImage: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#E2E8F0",
  },
  eventDetails: {
    gap: 6,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    flex: 1,
  },
  descriptionText: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  reviewBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 6,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  reviewTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reviewTitleText: {
    fontSize: 14,
    fontWeight: "700",
  },
  reviewDateText: {
    fontSize: 11,
  },
  starDisplayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  starRatingValue: {
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
  },
  commentText: {
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 20,
  },
  footerNoteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  footerNoteText: {
    fontSize: 11,
    flex: 1,
  },
  formBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 6,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    minHeight: 90,
    textAlignVertical: "top",
  },
  charCountText: {
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
    marginBottom: 12,
  },
  submitButton: {
    borderRadius: 10,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
  },
  submitContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
