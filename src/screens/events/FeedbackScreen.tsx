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
} from 'react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EventInfo {
  id: string;
  title: string;
  date: string;
  thumbnailUrl?: string;
}

export interface FeedbackScreenProps {
  event?: EventInfo;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT_COLOR = '#2563EB'; // Blue
const STAR_ACTIVE = '#FBBF24'; // Amber-400
const STAR_INACTIVE = '#CBD5E1'; // Slate-300
const BACKGROUND = '#FFFFFF';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const BORDER_COLOR = '#E2E8F0';

const DEFAULT_EVENT: EventInfo = {
  id: '1',
  title: 'Workshop React Native',
  date: '20/09/2026',
  thumbnailUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&q=80',
};

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
            {/* Outline star '☆' for inactive, filled '★' for active */}
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
  touchable: {
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  star: {
    lineHeight: 46,
    includeFontPadding: false,
  },
});

// ---------------------------------------------------------------------------
// FeedbackScreen
// ---------------------------------------------------------------------------

export default function FeedbackScreen({ event = DEFAULT_EVENT }: FeedbackScreenProps) {
  // Mockup shows 4 stars selected initially
  const [rating, setRating] = useState<number>(4);
  const [comment, setComment] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <Text style={styles.header}>Đánh giá sự kiện</Text>

        {/* ── Event Info ─────────────────────────────────────────────────── */}
        <View style={styles.eventRow}>
          {event.thumbnailUrl && !imageError ? (
            <Image
              source={{ uri: event.thumbnailUrl }}
              style={styles.thumbnail}
              resizeMode="cover"
              onError={() => setImageError(true)}
              accessible
              accessibilityLabel={`Ảnh sự kiện ${event.title}`}
            />
          ) : (
            <View style={styles.thumbnailFallback}>
              <View style={styles.reactAtomCenter} />
              <Text style={styles.thumbnailFallbackText}>⚛</Text>
            </View>
          )}

          <View style={styles.eventMeta}>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {event.title}
            </Text>
            <Text style={styles.eventDate}>{event.date}</Text>
          </View>
        </View>

        {/* ── Rating question ─────────────────────────────────────────────── */}
        <Text style={styles.question}>Bạn thấy sự kiện này thế nào?</Text>

        <View style={styles.starsWrapper}>
          <StarRating value={rating} onChange={setRating} size={38} />
        </View>

        {/* ── Comment box ─────────────────────────────────────────────────── */}
        <TextInput
          style={[
            styles.commentInput,
            isFocused && styles.commentInputFocused,
          ]}
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

        {/* ── Submit button (UI interaction only, no backend) ─────────────── */}
        <TouchableOpacity
          style={styles.submitButton}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Gửi đánh giá"
          onPress={() => {
            // Client UI-only interaction: no submit/auth simulation
          }}
        >
          <Text style={styles.submitText}>Gửi đánh giá</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Header
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 24,
    letterSpacing: -0.3,
  },

  // Event info
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 36,
  },
  thumbnail: {
    width: 74,
    height: 74,
    borderRadius: 12,
    backgroundColor: '#0F172A',
  },
  thumbnailFallback: {
    width: 74,
    height: 74,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactAtomCenter: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38BDF8',
  },
  thumbnailFallbackText: {
    fontSize: 32,
    color: '#38BDF8',
  },
  eventMeta: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 6,
    lineHeight: 22,
  },
  eventDate: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    fontWeight: '400',
  },

  // Rating section
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 16,
  },
  starsWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },

  // Comment input
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
  commentInputFocused: {
    borderColor: ACCENT_COLOR,
  },

  // Submit button
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
      android: {
        elevation: 3,
      },
    }),
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
