import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AntDesign from "@expo/vector-icons/FontAwesome";
interface AIErrorProps {
  message?: string;
  onRetry?: () => void;
}

export default function AIError({
  message = "Không thể tạo tóm tắt AI. Vui lòng thử lại sau.",
  onRetry,
}: AIErrorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <AntDesign name="warning" size={35} color="#FFB02E" />
      </View>

      <Text style={styles.title}>Có lỗi xảy ra</Text>

      <Text style={styles.message}>{message}</Text>

      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },

  message: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 300,
  },

  retryButton: {
    marginTop: 22,
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 10,
  },

  retryText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
