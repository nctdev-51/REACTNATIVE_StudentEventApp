import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Octicons from "@expo/vector-icons/Octicons";

export default function AILoading() {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Octicons name="sparkles-fill" size={45} color="#FFB02E" />
      </View>

      <Text style={styles.title}>Đang tạo tóm tắt...</Text>

      <Text style={styles.description}>AI đang phân tích nội dung sự kiện</Text>

      <ActivityIndicator size="large" color="#2563eb" style={styles.loading} />

      <Text style={styles.waitingText}>Vui lòng chờ trong giây lát</Text>
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },

  title: {
    fontSize: 21,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },

  description: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 21,
  },

  loading: {
    marginTop: 24,
  },

  waitingText: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 12,
  },
});
