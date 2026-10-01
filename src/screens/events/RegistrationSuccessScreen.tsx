import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RegistrationSuccessScreenProps {
  eventTitle?: string;
  onViewSchedule?: () => void;
  onGoHome?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT_COLOR = '#2563EB';
const BACKGROUND = '#FFFFFF';
const SCREEN_BG = '#FFFFFF';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const SUCCESS_COLOR = '#22C55E';
const SECONDARY_BTN_BG = '#F1F5F9';

// ---------------------------------------------------------------------------
// Custom Vector Icons (Pure React Native Views)
// ---------------------------------------------------------------------------

/** Big Green Circle with Checkmark */
function SuccessCheckmarkIcon() {
  return (
    <View style={iconStyles.circleContainer}>
      <View style={iconStyles.checkmarkStem} />
      <View style={iconStyles.checkmarkKick} />
    </View>
  );
}

const iconStyles = StyleSheet.create({
  circleContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: SUCCESS_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: SUCCESS_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  checkmarkStem: {
    position: 'absolute',
    width: 6,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    transform: [{ rotate: '45deg' }],
    left: 60,
    top: 32,
  },
  checkmarkKick: {
    position: 'absolute',
    width: 6,
    height: 22,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    transform: [{ rotate: '-45deg' }],
    left: 42,
    top: 52,
  },
});

// ---------------------------------------------------------------------------
// RegistrationSuccessScreen (Giao diện 8)
// ---------------------------------------------------------------------------

export default function RegistrationSuccessScreen({
  eventTitle = 'Workshop React Native',
  onViewSchedule,
  onGoHome,
}: RegistrationSuccessScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />

      <View style={styles.container}>
        {/* Top Space / Graphic area */}
        <View style={styles.contentContainer}>
          <View style={styles.iconWrapper}>
            <SuccessCheckmarkIcon />
          </View>

          {/* Headline */}
          <Text style={styles.title}>Đăng ký thành công!</Text>

          {/* Subtitle message */}
          <Text style={styles.message}>
            Bạn đã đăng ký tham gia{'\n'}
            <Text style={styles.eventTitleHighlight}>{eventTitle}</Text>.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onViewSchedule}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Xem trong lịch của tôi"
          >
            <Text style={styles.primaryButtonText}>Xem trong lịch của tôi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onGoHome}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Quay về trang chủ"
          >
            <Text style={styles.secondaryButtonText}>Quay về trang chủ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: Platform.OS === 'ios' ? 24 : 32,
  },

  // Main Content
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -40,
  },
  iconWrapper: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  eventTitleHighlight: {
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },

  // Buttons
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: ACCENT_COLOR,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: ACCENT_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: SECONDARY_BTN_BG,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    color: ACCENT_COLOR,
    fontSize: 15,
    fontWeight: '600',
  },
});
