import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import CategoryChip from "../../components/events/CategoryChip";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { useAppTheme } from "../../theme/ThemeContext";

import {
  setFilterCategory,
  setFilterFaculty,
  setFilterDate,
  resetFilter,
} from "../../features/events/eventsSlice";

const CATEGORIES = [
  "Tất cả",
  "Học thuật",
  "Kỹ năng",
  "Thể thao",
  "Việc làm",
  "Tình nguyện",
];

const FACULTIES = [
  "Tất cả",
  "Khoa Công nghệ thông tin",
  "Khoa Quản trị kinh doanh",
  "Toàn trường",
];

const DATES = [
  { label: "Hôm nay", value: "today" },
  { label: "Tuần này", value: "week" },
  { label: "Tháng này", value: "month" },
];

export default function FilterScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { theme } = useAppTheme();

  const filter = useAppSelector(
    (state) => state.events.filter
  );

  const [category, setCategory] = useState(
    filter.category ?? "Tất cả"
  );

  const [faculty, setFaculty] = useState(
    filter.faculty ?? "Tất cả"
  );

  const [date, setDate] = useState(
    filter.date
  );

  const handleApply = () => {
    dispatch(
      setFilterCategory(
        category === "Tất cả" ? null : category
      )
    );

    dispatch(
      setFilterFaculty(
        faculty === "Tất cả" ? null : faculty
      )
    );

    dispatch(setFilterDate(date));

    navigation.goBack();
  };

  const handleReset = () => {
    setCategory("Tất cả");
    setFaculty("Tất cả");
    setDate(null);

    dispatch(resetFilter());
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Bộ lọc sự kiện
          </Text>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.closeBtn, { backgroundColor: theme.surfaceSecondary }]}
          >
            <Text style={[styles.close, { color: theme.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Chủ đề */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Chủ đề
        </Text>

        <View style={styles.wrap}>
          {CATEGORIES.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setCategory(item)}
            >
              <CategoryChip
                label={item}
                selected={category === item}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Ngày */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Ngày diễn ra
        </Text>

        <View style={styles.wrap}>
          {DATES.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.option,
                { backgroundColor: theme.surfaceSecondary, borderColor: theme.border, borderWidth: 1 },
                date === item.value && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() =>
                setDate(
                  date === item.value
                    ? null
                    : item.value
                )
              }
            >
              <Text
                style={[
                  styles.optionText,
                  { color: theme.textSecondary },
                  date === item.value && { color: "#ffffff", fontWeight: "700" },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Khoa */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Khoa
        </Text>

        <View style={styles.wrap}>
          {FACULTIES.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setFaculty(item)}
            >
              <CategoryChip
                label={item}
                selected={faculty === item}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Áp dụng */}
        <TouchableOpacity
          style={[styles.applyButton, { backgroundColor: theme.primary }]}
          onPress={handleApply}
        >
          <Text style={styles.applyText}>
            ✓ Áp dụng bộ lọc
          </Text>
        </TouchableOpacity>

        {/* Reset */}
        <TouchableOpacity onPress={handleReset} style={styles.clearBtn}>
          <Text style={[styles.clearText, { color: theme.textSecondary }]}>
            Xóa toàn bộ bộ lọc
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
  },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  close: {
    fontSize: 16,
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 8,
  },

  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 22,
  },

  option: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },

  optionText: {
    fontSize: 14,
    fontWeight: "500",
  },

  divider: {
    height: 1,
    marginVertical: 16,
  },

  applyButton: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },

  applyText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  clearBtn: {
    marginTop: 14,
    paddingVertical: 8,
    alignItems: "center",
  },

  clearText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
});
