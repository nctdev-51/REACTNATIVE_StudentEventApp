import React, { useState, useEffect } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../../theme/ThemeContext";
import { getNotificationPreferences, updateNotificationPreferences } from "../../services/api";
import type { NotificationPreference } from "../../types/notification";

interface Props {
  visible: boolean;
  onClose: () => void;
  userId?: string;
}

export default function NotificationPreferencesModal({ visible, onClose, userId }: Props) {
  const { theme, isDark } = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [enablePush, setEnablePush] = useState(true);
  const [notifyScheduleChange, setNotifyScheduleChange] = useState(true);
  const [notifyUrgent, setNotifyUrgent] = useState(true);
  const [notifyReminders, setNotifyReminders] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietHoursStart, setQuietHoursStart] = useState("22:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState("06:00");
  const [reminderMinutes, setReminderMinutes] = useState(60);

  useEffect(() => {
    if (visible && userId) {
      loadPreferences();
    }
  }, [visible, userId]);

  const loadPreferences = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data: NotificationPreference = await getNotificationPreferences(userId);
      if (data) {
        setEnablePush(data.enablePush !== false);
        setNotifyScheduleChange(data.notifyScheduleChange !== false);
        setNotifyUrgent(data.notifyUrgent !== false);
        setNotifyReminders(data.notifyReminders !== false);
        setQuietHoursEnabled(!!data.quietHoursEnabled);
        setQuietHoursStart(data.quietHoursStart || "22:00");
        setQuietHoursEnd(data.quietHoursEnd || "06:00");
        setReminderMinutes(data.reminderMinutesBefore || 60);
      }
    } catch {
      // Dùng cấu hình mặc định
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      await updateNotificationPreferences(userId, {
        enablePush,
        notifyScheduleChange,
        notifyUrgent,
        notifyReminders,
        quietHoursEnabled,
        quietHoursStart,
        quietHoursEnd,
        reminderMinutesBefore: reminderMinutes,
      });
      Alert.alert("Thành công", "Đã lưu tùy chọn nhận thông báo và giờ yên lặng.");
      onClose();
    } catch (e: any) {
      Alert.alert("Lỗi", "Không thể lưu cài đặt thông báo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={styles.iconCircle}>
                <Ionicons name="notifications" size={20} color="#2563EB" />
              </View>
              <Text style={[styles.title, { color: theme.textPrimary }]}>Tùy Chọn Thông Báo</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={{ marginTop: 12, color: theme.textSecondary }}>Đang tải cài đặt...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 450 }}>
              {/* Kênh nhận */}
              <Text style={styles.sectionTitle}>KÊNH NHẬN THÔNG BÁO</Text>
              <View style={[styles.row, { borderColor: theme.borderSubtle }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Thông báo đẩy (Push)</Text>
                  <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>Nhận thông báo tức thì trên điện thoại</Text>
                </View>
                <Switch value={enablePush} onValueChange={setEnablePush} trackColor={{ false: '#CBD5E1', true: '#93C5FD' }} thumbColor={enablePush ? '#2563EB' : '#F1F5F9'} />
              </View>

              {/* Loại thông báo */}
              <Text style={[styles.sectionTitle, { marginTop: 18 }]}>LOẠI THÔNG BÁO QUAN TÂM</Text>
              <View style={[styles.row, { borderColor: theme.borderSubtle }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Đổi lịch / Đổi phòng</Text>
                  <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>Khi BTC cập nhật địa điểm hoặc giờ tổ chức</Text>
                </View>
                <Switch value={notifyScheduleChange} onValueChange={setNotifyScheduleChange} trackColor={{ false: '#CBD5E1', true: '#93C5FD' }} thumbColor={notifyScheduleChange ? '#2563EB' : '#F1F5F9'} />
              </View>

              <View style={[styles.row, { borderColor: theme.borderSubtle }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Thông báo khẩn cấp</Text>
                  <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>Hủy sự kiện hoặc tin khẩn từ Đoàn Trường</Text>
                </View>
                <Switch value={notifyUrgent} onValueChange={setNotifyUrgent} trackColor={{ false: '#CBD5E1', true: '#93C5FD' }} thumbColor={notifyUrgent ? '#2563EB' : '#F1F5F9'} />
              </View>

              <View style={[styles.row, { borderColor: theme.borderSubtle }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Nhắc nhở trước sự kiện</Text>
                  <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>Nhắc chuẩn bị tham dự sự kiện đã đăng ký</Text>
                </View>
                <Switch value={notifyReminders} onValueChange={setNotifyReminders} trackColor={{ false: '#CBD5E1', true: '#93C5FD' }} thumbColor={notifyReminders ? '#2563EB' : '#F1F5F9'} />
              </View>

              {/* Giờ yên lặng (Quiet Hours) */}
              <Text style={[styles.sectionTitle, { marginTop: 18 }]}>GIỜ YÊN LẶNG (QUIET HOURS)</Text>
              <View style={[styles.row, { borderColor: theme.borderSubtle }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Bật Giờ Yên Lặng</Text>
                  <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>
                    Chặn chuông/rung ban đêm (22:00 - 06:00), chỉ cho phép tin khẩn cấp
                  </Text>
                </View>
                <Switch value={quietHoursEnabled} onValueChange={setQuietHoursEnabled} trackColor={{ false: '#CBD5E1', true: '#93C5FD' }} thumbColor={quietHoursEnabled ? '#2563EB' : '#F1F5F9'} />
              </View>

              {/* Thời gian nhắc trước */}
              <Text style={[styles.sectionTitle, { marginTop: 18 }]}>THỜI GIAN NHẮC TRƯỚC SỰ KIỆN</Text>
              <View style={styles.chipRow}>
                {[15, 30, 60, 120].map((mins) => {
                  const isSelected = reminderMinutes === mins;
                  const label = mins < 60 ? `${mins} phút` : `${mins / 60} giờ`;
                  return (
                    <TouchableOpacity
                      key={mins}
                      onPress={() => setReminderMinutes(mins)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? "#2563EB" : isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
                          borderColor: isSelected ? "#2563EB" : theme.borderSubtle,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: isSelected ? "#FFFFFF" : theme.textPrimary }]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* Footer buttons */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={[styles.cancelBtn, { borderColor: theme.border }]}>
              <Text style={{ color: theme.textSecondary, fontWeight: "600" }}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Lưu Cài Đặt</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  rowDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
    marginBottom: 10,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
    minWidth: 110,
  },
});
