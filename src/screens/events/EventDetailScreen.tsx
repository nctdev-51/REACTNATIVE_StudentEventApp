import {
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function EventDetailScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.emptyState}>
        <Text style={styles.icon}>
          📅
        </Text>

        <Text style={styles.title}>
          Chưa có thông tin sự kiện
        </Text>

        <Text style={styles.description}>
          Vui lòng chọn một sự kiện để xem thông tin chi tiết.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  icon: {
    fontSize: 50,
    marginBottom: 16,
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
});