import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  studentId: string;
  email: string;
  initialFullName: string;
  initialPhone: string;
  initialFaculty: string;
  pointsAccumulated: number;
  onSave: (data: { fullName: string; phone: string; faculty: string }) => Promise<void>;
}

export default function EditProfileModal({
  visible,
  onClose,
  studentId,
  email,
  initialFullName,
  initialPhone,
  initialFaculty,
  pointsAccumulated,
  onSave,
}: EditProfileModalProps) {
  const [editFullName, setEditFullName] = useState(initialFullName);
  const [editPhone, setEditPhone] = useState(initialPhone);
  const [editFaculty, setEditFaculty] = useState(initialFaculty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setEditFullName(initialFullName);
      setEditPhone(initialPhone);
      setEditFaculty(initialFaculty);
    }
  }, [visible, initialFullName, initialPhone, initialFaculty]);

  const handleSave = async () => {
    if (!editFullName.trim()) {
      Alert.alert("Lỗi", "Họ tên không được để trống.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        fullName: editFullName.trim(),
        phone: editPhone.trim(),
        faculty: editFaculty.trim(),
      });
      onClose();
    } catch (err: any) {
      Alert.alert(
        "Không thể lưu hồ sơ",
        err?.response?.data?.message ??
          err?.message ??
          "Kiểm tra kết nối mạng và thử lại.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardWrap}
        >
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleWrap}>
                <Ionicons name="person-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.headerTitle}>Cập Nhật Thông Tin Cá Nhân</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Đóng modal"
              >
                <Ionicons name="close" size={22} color="#E0E7FF" />
              </TouchableOpacity>
            </View>

            {/* Body */}
            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Mã số sinh viên (MSSV)</Text>
              <View style={styles.readOnlyBox}>
                <Text style={styles.readOnlyText}>{studentId}</Text>
                <View style={styles.fixedBadge}>
                  <Text style={styles.fixedBadgeText}>Cố định</Text>
                </View>
              </View>

              <Text style={styles.fieldLabel}>Email trường</Text>
              <View style={styles.readOnlyBox}>
                <Text style={styles.readOnlyText}>{email}</Text>
                <View style={styles.fixedBadge}>
                  <Text style={styles.fixedBadgeText}>Cố định</Text>
                </View>
              </View>

              <Text style={styles.fieldLabel}>Họ và tên *</Text>
              <TextInput
                style={styles.input}
                value={editFullName}
                onChangeText={setEditFullName}
                placeholder="Nhập họ và tên..."
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.fieldLabel}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Ví dụ: 0912345678"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />

              <Text style={styles.fieldLabel}>Khoa / Viện đào tạo</Text>
              <TextInput
                style={styles.input}
                value={editFaculty}
                onChangeText={setEditFaculty}
                placeholder="Ví dụ: Khoa Công nghệ thông tin"
                placeholderTextColor="#94A3B8"
              />

              {/* Điểm rèn luyện tích luỹ */}
              <View style={styles.pointsBox}>
                <View style={styles.pointsLabelWrap}>
                  <Ionicons name="star" size={15} color="#1D4ED8" />
                  <Text style={styles.pointsLabel}>Điểm rèn luyện tích lũy:</Text>
                </View>
                <Text style={styles.pointsValue}>{pointsAccumulated} / 100 ĐRL</Text>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                disabled={saving}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Lưu Thay Đổi</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  keyboardWrap: {
    width: "100%",
    alignItems: "center",
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#1E3A8A",
  },
  headerTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 16,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
    marginTop: 4,
  },
  readOnlyBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  readOnlyText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  fixedBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fixedBadgeText: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13.5,
    color: "#0F172A",
    marginBottom: 10,
  },
  pointsBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginTop: 4,
    marginBottom: 16,
  },
  pointsLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pointsLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  pointsValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2563EB",
  },
  saveBtn: {
    backgroundColor: "#2563EB",
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
