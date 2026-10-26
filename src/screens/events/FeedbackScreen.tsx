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
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />
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

        {/* ── Event Info ── */}
        <View style={styles.eventRow}>
          <View style={styles.thumbnailFallback}>
            <Text style={styles.thumbnailFallbackText}>⚛</Text>
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
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Gửi đánh giá</Text>
          )}
        </TouchableOpacity>
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
