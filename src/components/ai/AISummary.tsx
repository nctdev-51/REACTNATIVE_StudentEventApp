import { StyleSheet, Text, View } from "react-native";
import Octicons from "@expo/vector-icons/Octicons";
import { AISummary as AISummaryType } from "../../types/event";

interface AISummaryProps {
  summary: AISummaryType;
}

export default function AISummary({ summary }: AISummaryProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Octicons name="sparkles-fill" color="#FFB02E" style={styles.aiIcon} />

        <View>
          <Text style={styles.title}>Tóm tắt bởi AI</Text>

          <Text style={styles.subtitle}>Thông tin chính của sự kiện</Text>
        </View>
      </View>

      <View style={styles.summaryBox}>
        <View style={styles.item}>
          <Text style={styles.label}>Sự kiện</Text>

          <Text style={styles.value}>{summary.what}</Text>
        </View>

        <View style={styles.item}>
          <Text style={styles.label}>Khi nào</Text>

          <Text style={styles.value}>{summary.when}</Text>
        </View>

        <View style={styles.item}>
          <Text style={styles.label}>Ở đâu</Text>

          <Text style={styles.value}>{summary.where}</Text>
        </View>

        <View style={styles.itemLast}>
          <Text style={styles.label}>Lợi ích</Text>

          <Text style={styles.value}>{summary.benefits}</Text>
        </View>
      </View>

      <Text style={styles.note}>
        Nội dung được tạo bởi AI, có thể chưa hoàn toàn chính xác.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  aiIcon: {
    fontSize: 26,
    marginRight: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },

  summaryBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 14,
  },

  item: {
    paddingBottom: 14,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  itemLast: {
    paddingBottom: 2,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563eb",
    marginBottom: 5,
  },

  value: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 21,
  },

  note: {
    fontSize: 12,
    color: "#9ca3af",
    lineHeight: 18,
    marginTop: 12,
  },
});
