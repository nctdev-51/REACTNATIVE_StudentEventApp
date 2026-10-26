import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CategoryChip from "../../components/events/CategoryChip";

export default function FilterScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            Bộ lọc sự kiện
          </Text>

          <Text style={styles.close}>
            ✕
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          Chủ đề
        </Text>

        <View style={styles.wrap}>
          <CategoryChip
            label="Tất cả"
            selected
          />

          <CategoryChip label="Học thuật" />

          <CategoryChip label="Kỹ năng" />

          <CategoryChip label="Thể thao" />

          <CategoryChip label="Việc làm" />

          <CategoryChip label="Tình nguyện" />
        </View>

        <Text style={styles.sectionTitle}>
          Ngày diễn ra
        </Text>

        <View style={styles.wrap}>
          <View style={styles.option}>
            <Text style={styles.optionText}>
              Hôm nay
            </Text>
          </View>

          <View style={styles.option}>
            <Text style={styles.optionText}>
              Tuần này
            </Text>
          </View>

          <View style={styles.option}>
            <Text style={styles.optionText}>
              Tháng này
            </Text>
          </View>

          <View style={styles.option}>
            <Text style={styles.optionText}>
              Tùy chọn 📅
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Khoa
        </Text>

        <View style={styles.wrap}>
          <CategoryChip
            label="Tất cả"
            selected
          />

          <CategoryChip label="Công nghệ thông tin" />

          <CategoryChip label="Quản trị kinh doanh" />

          <CategoryChip label="Toàn trường" />
        </View>

        <View style={styles.applyButton}>
          <Text style={styles.applyText}>
            Áp dụng
          </Text>
        </View>

        <Text style={styles.clearText}>
          Xóa bộ lọc
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },

  close: {
    fontSize: 24,
    color: "#6b7280",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
    marginTop: 10,
  },

  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 22,
  },

  option: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },

  optionText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },

  applyButton: {
    backgroundColor: "#2563eb",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },

  applyText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  clearText: {
    textAlign: "center",
    color: "#2563eb",
    marginTop: 18,
    fontSize: 15,
    fontWeight: "600",
  },
});