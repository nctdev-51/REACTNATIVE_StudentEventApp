<<<<<<< HEAD
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../theme";
import { navigate } from "../../navigation/navigationRef";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
=======
﻿import React, { useCallback, useEffect, useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, YStack } from 'tamagui';
import { Button, Card } from '../../components/common';
import { useAppSelector } from '../../hooks/redux';
import type { MainStackParamList } from '../../navigation/types';
import api from '../../services/api';
import { reminderMessages, scheduleEventReminder } from '../../services/eventReminders';
>>>>>>> b65f9f5 (feat: update event management app)

export interface RegistrationSuccessScreenProps {
  eventTitle?: string;
  onViewSchedule?: () => void;
  onGoHome?: () => void;
}
<<<<<<< HEAD

type NavProp = NativeStackNavigationProp<MainStackParamList>;
type RoutePropType = RouteProp<MainStackParamList, "RegistrationSuccess">;

const SUCCESS_COLOR = "#22C55E";

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
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    shadowColor: SUCCESS_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  checkmarkStem: {
    position: "absolute",
    width: 6,
    height: 42,
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
    transform: [{ rotate: "45deg" }],
    left: 60,
    top: 32,
  },
  checkmarkKick: {
    position: "absolute",
    width: 6,
    height: 22,
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
    transform: [{ rotate: "-45deg" }],
    left: 42,
    top: 52,
  },
});

// ---------------------------------------------------------------------------
// RegistrationSuccessScreen (Giao diện 8)
// ---------------------------------------------------------------------------

export default function RegistrationSuccessScreen({
  eventTitle: propEventTitle,
  onViewSchedule,
  onGoHome,
}: RegistrationSuccessScreenProps) {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { theme, isDark } = useAppTheme();

  const title =
    route.params?.eventTitle || propEventTitle || "Sự kiện sinh viên IUH";

  const handleViewSchedule = () => {
    if (onViewSchedule) {
      onViewSchedule();
      return;
    }
    try {
      (navigation as any).navigate("MainTabs", { screen: "MySchedule" });
    } catch {
      navigate("MainTabs", { screen: "MySchedule" });
    }
  };

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
      return;
    }
    try {
      (navigation as any).navigate("MainTabs", { screen: "Home" });
    } catch {
      navigate("MainTabs", { screen: "Home" });
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} />

      <View style={styles.container}>
        {/* Top Space / Graphic area */}
        <View style={styles.contentContainer}>
          <View style={styles.iconWrapper}>
            <SuccessCheckmarkIcon />
          </View>

          {/* Headline */}
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Đăng ký thành công!
          </Text>

          {/* Subtitle message */}
          <Text style={[styles.message, { color: theme.textSecondary }]}>
            Bạn đã đăng ký tham gia{"\n"}
            <Text style={[styles.eventTitleHighlight, { color: theme.primary }]}>
              {title}
            </Text>
            .
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={handleViewSchedule}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Xem trong lịch của tôi"
          >
            <Text style={styles.primaryButtonText}>Xem trong lịch của tôi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              {
                backgroundColor: theme.surfaceSecondary,
                borderColor: theme.border,
                borderWidth: 1,
              },
            ]}
            onPress={handleGoHome}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Quay về trang chủ"
          >
            <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
              Quay về trang chủ
            </Text>
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
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 40 : 20,
    paddingBottom: Platform.OS === "ios" ? 24 : 32,
  },

  // Main Content
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -40,
  },
  iconWrapper: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  eventTitleHighlight: {
    fontWeight: "600",
  },

  // Buttons
  buttonContainer: {
    gap: 12,
    width: "100%",
  },
  primaryButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
=======
export default function RegistrationSuccessScreen(props: RegistrationSuccessScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, 'RegistrationSuccess'>>();
  const userId = useAppSelector(state => state.auth.user?._id);
  const eventId = route.params?.eventId;
  const title = route.params?.eventTitle ?? props.eventTitle ?? 'Sự kiện';
  const [message, setMessage] = useState('Đang lập lịch nhắc nhở…');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(false);
  const schedule = useCallback(async () => {
    if (!eventId || !userId) {
      setMessage('Thiếu thông tin để lập lịch nhắc nhở.');
      return;
    }
    setBusy(true);
    setRetry(false);
    try {
      const event = await api.getEventById(eventId);
      const result = await scheduleEventReminder(event, userId);
      setMessage(reminderMessages[result]);
      setRetry(result === 'denied');
    } catch {
      setMessage('Đăng ký đã thành công, nhưng chưa thể đặt nhắc nhở. Vui lòng thử lại.');
      setRetry(true);
    } finally { setBusy(false); }
  }, [eventId, userId]);
  useEffect(() => { void schedule(); }, [schedule]);
  return <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
    <YStack flex={1} padding={24} gap={16} justifyContent="center">
      <Text fontSize={64} color="#22C55E" textAlign="center">✓</Text>
      <Text fontSize={24} fontWeight="700" textAlign="center">Đăng ký thành công!</Text>
      <Text textAlign="center">Bạn đã đăng ký tham gia {title}.</Text>
      <Card gap={12}>
        <Text accessibilityLiveRegion="polite">{message}</Text>
        {retry && <Button variant="secondary" loading={busy} onPress={schedule}>Thử đặt nhắc nhở lại</Button>}
      </Card>
      <Button onPress={props.onViewSchedule ?? (() => navigation.navigate('MySchedule'))}>Xem trong lịch của tôi</Button>
      <Button variant="secondary" onPress={props.onGoHome ?? (() => navigation.navigate('Home'))}>Quay về trang chủ</Button>
    </YStack>
  </SafeAreaView>;
}
>>>>>>> b65f9f5 (feat: update event management app)
