import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface LogoutConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  displayName: string;
  theme: any;
  isDark: boolean;
}

export default function LogoutConfirmModal({
  visible,
  onClose,
  onConfirm,
  displayName,
  theme,
  isDark,
}: LogoutConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: isDark ? "#3B181A" : "#FEE2E2" },
            ]}
          >
            <Ionicons name="log-out-outline" size={28} color={theme.danger} />
          </View>

          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Xác nhận đăng xuất
          </Text>

          <Text style={[styles.message, { color: theme.textSecondary }]}>
            Bạn có chắc chắn muốn đăng xuất khỏi tài khoản{" "}
            <Text style={[styles.highlightText, { color: theme.textPrimary }]}>
              {displayName}
            </Text>{" "}
            không? Mọi phiên làm việc hiện tại sẽ kết thúc.
          </Text>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
              activeOpacity={0.8}
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: theme.textPrimary }]}>
                Hủy bỏ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: theme.danger },
              ]}
              activeOpacity={0.8}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 24,
  },
  highlightText: {
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {},
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
  },
  confirmText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
