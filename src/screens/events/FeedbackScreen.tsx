import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { submitFeedback } from '../../features/events/feedbacksSlice';
import { Colors } from '../../theme';

type FeedbackNavProp = NativeStackNavigationProp<MainStackParamList>;
type FeedbackRouteProp = RouteProp<MainStackParamList, 'Feedback'>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT_COLOR = Colors.primary;
const STAR_ACTIVE = '#FBBF24';
const STAR_INACTIVE = '#CBD5E1';
const BACKGROUND = '#FFFFFF';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const BORDER_COLOR = '#E2E8F0';

// ---------------------------------------------------------------------------
// StarRating component
// ---------------------------------------------------------------------------

interface StarRatingProps {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}

function StarRating({ value, onChange, size = 36 }: StarRatingProps) {
  return (
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
                  color: isFilled ? STAR_ACTIVE : STAR_INACTIVE,
                },
              ]}
            >
              {isFilled ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  touchable: { paddingHorizontal: 2, paddingVertical: 4 },
  star: { lineHeight: 46, includeFontPadding: false },
});

// ---------------------------------------------------------------------------
// FeedbackScreen
// ---------------------------------------------------------------------------

export default function FeedbackScreen() {
  const navigation = useNavigation<FeedbackNavProp>();
  const route = useRoute<FeedbackRouteProp>();
  const dispatch = useAppDispatch();

  const user = useAppSelector((s) => s.auth.user);
  const { submitting } = useAppSelector((s) => s.feedbacks);

  const eventId = route.params?.eventId;
  const eventTitle = route.params?.eventTitle ?? 'Sự kiện';

  const [rating, setRating] = useState<number>(4);
  const [comment, setComment] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!user || !eventId) {
      Alert.alert('Lỗi', 'Không thể xác định người dùng hoặc sự kiện.');
      return;
    }
    if (rating === 0) {
      Alert.alert('Thiếu đánh giá', 'Vui lòng chọn số sao.');
      return;
    }

    const result = await dispatch(
      submitFeedback({
        eventId,
        userId: user._id,
        rating,
        comment: comment.trim(),
      })
    );

    if (submitFeedback.fulfilled.match(result)) {
      Alert.alert(
        '✅ Gửi thành công!',
        `Cảm ơn bạn đã đánh giá "${eventTitle}" với ${rating} sao!`,
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.canGoBack()
                ? navigation.goBack()
                : navigation.navigate('Home'),
          },
        ]
      );
    } else {
      Alert.alert(
        'Gửi thất bại',
        (result.payload as string) ?? 'Vui lòng thử lại.'
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              navigation.canGoBack()
                ? navigation.goBack()
                : navigation.navigate('Home')
            }
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <Text style={styles.backArrow}>‹</Text>
            <Text style={styles.backLabel}>Quay lại</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.header}>Đánh giá sự kiện</Text>

<<<<<<< HEAD
        {/* ── Event Info ── */}
        <View style={styles.eventRow}>
          <View style={styles.thumbnailFallback}>
            <Text style={styles.thumbnailFallbackText}>⚛</Text>
=======
        <Text style={[styles.header, { color: theme.textPrimary }]}>
          Đánh giá sự kiện
        </Text>
        <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
          Góp ý chất lượng và trải nghiệm tham gia sự kiện
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
          {eventsList.map((evt, index) => {
            const evtId = evt.id || evt._id || `evt-${index}`;
            const isSelected =
              evtId === (currentEvent?.id || currentEvent?._id);
            return (
              <TouchableOpacity
                key={`${evtId}-${index}`}
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
>>>>>>> 6a72187 (Ver1_NguyenNhiTam)
          </View>
          <View style={styles.eventMeta}>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {eventTitle}
            </Text>
            <Text style={styles.eventDate}>
              {eventId ? `Mã sự kiện: ${eventId.slice(-6)}` : '—'}
            </Text>
          </View>
        </View>

        {/* ── Rating ── */}
        <Text style={styles.question}>Bạn thấy sự kiện này thế nào?</Text>
        <View style={styles.starsWrapper}>
          <StarRating value={rating} onChange={setRating} size={38} />
        </View>

        {/* ── Comment ── */}
        <TextInput
          style={[styles.commentInput, isFocused && styles.commentInputFocused]}
          placeholder="Chia sẻ cảm nhận của bạn..."
          placeholderTextColor={TEXT_SECONDARY}
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

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (rating === 0 || submitting) && styles.submitButtonDisabled,
          ]}
          activeOpacity={0.85}
          disabled={rating === 0 || submitting}
          accessibilityRole="button"
          accessibilityLabel="Gửi đánh giá"
          onPress={handleSubmit}
        >
<<<<<<< HEAD
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Gửi đánh giá</Text>
          )}
        </TouchableOpacity>
=======
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
          Tổng hợp đánh giá khách quan từ sinh viên tham dự
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
>>>>>>> c4f94b6 (Refactor check-in screens to enhance UI and UX with theme support)
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BACKGROUND },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 40,
  },

  header: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 36,
  },
  thumbnailFallback: {
    width: 74,
    height: 74,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailFallbackText: { fontSize: 32, color: '#38BDF8' },
  eventMeta: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 6,
    lineHeight: 22,
  },
  eventDate: { fontSize: 14, color: TEXT_SECONDARY },

  question: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 16,
  },
  starsWrapper: { alignItems: 'center', marginBottom: 24 },

  commentInput: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: TEXT_PRIMARY,
    minHeight: 120,
    backgroundColor: '#FFFFFF',
    marginBottom: 28,
  },
  commentInputFocused: { borderColor: ACCENT_COLOR },

  submitButton: {
    backgroundColor: ACCENT_COLOR,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: ACCENT_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  submitText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
    elevation: 0,
    shadowOpacity: 0,
  },

  topBar: { paddingVertical: 8, marginBottom: 4 },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  backArrow: {
    fontSize: 26,
    color: ACCENT_COLOR,
    fontWeight: '300',
    lineHeight: 28,
    marginRight: 4,
  },
  backLabel: { fontSize: 15, color: ACCENT_COLOR, fontWeight: '500' },
});
