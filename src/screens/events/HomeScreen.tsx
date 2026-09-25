import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import SearchBar from "../../components/events/SearchBar";
import CategoryChip from "../../components/events/CategoryChip";

interface HomeScreenProps {
  userName?: string;
}

export default function HomeScreen({
  userName,
}: HomeScreenProps) {
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.hello}>
            Xin chào,
          </Text>

          <Text style={styles.userName}>
            {userName ?? "Người dùng"} 👋
          </Text>
        </View>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {userName
              ? userName.charAt(0).toUpperCase()
              : "👤"}
          </Text>
        </View>
      </View>

      {/* Tìm kiếm */}
      <SearchBar />

      {/* Chủ đề */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
      >
        <CategoryChip
          label="Tất cả"
          selected
        />

        <CategoryChip label="Học thuật" />

        <CategoryChip label="Kỹ năng" />

        <CategoryChip label="Thể thao" />

        <CategoryChip label="Việc làm" />

        <CategoryChip label="Tình nguyện" />
      </ScrollView>

      {/* Sự kiện nổi bật */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Sự kiện nổi bật
        </Text>

        <Text style={styles.viewAll}>
          Xem tất cả ›
        </Text>
      </View>

      <View style={styles.emptyBox}>
        <Text style={styles.emptyIcon}>
          📅
        </Text>

        <Text style={styles.emptyTitle}>
          Chưa có sự kiện nổi bật
        </Text>

        <Text style={styles.emptyDescription}>
          Các sự kiện nổi bật sẽ được hiển thị tại đây.
        </Text>
      </View>

      {/* Sự kiện sắp tới */}
      <Text style={styles.sectionTitle}>
        Sự kiện sắp tới
      </Text>

      <View style={styles.emptyBox}>
        <Text style={styles.emptyIcon}>
          🗓️
        </Text>

        <Text style={styles.emptyTitle}>
          Chưa có sự kiện
        </Text>

        <Text style={styles.emptyDescription}>
          Danh sách sự kiện sắp tới sẽ được hiển thị tại đây.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  hello: {
    fontSize: 18,
    color: "#374151",
    marginBottom: 2,
  },

  userName: {
    fontSize: 25,
    fontWeight: "700",
    color: "#111827",
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2563eb",
  },

  categoryContainer: {
    marginTop: 14,
    marginBottom: 22,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    marginTop: 8,
  },

  viewAll: {
    fontSize: 14,
    color: "#6b7280",
  },

  emptyBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 24,
  },

  emptyIcon: {
    fontSize: 32,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },

  emptyDescription: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
});