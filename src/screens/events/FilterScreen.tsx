import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import CategoryChip from "../../components/events/CategoryChip";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";

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
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Bộ lọc sự kiện
          </Text>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Chủ đề */}
        <Text style={styles.sectionTitle}>
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
        <Text style={styles.sectionTitle}>
          Ngày diễn ra
        </Text>

        <View style={styles.wrap}>
          {DATES.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.option,
                date === item.value &&
                  styles.optionSelected,
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
                  date === item.value &&
                    styles.optionTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Khoa */}
        <Text style={styles.sectionTitle}>
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

        {/* Áp dụng */}
        <TouchableOpacity
          style={styles.applyButton}
          onPress={handleApply}
        >
          <Text style={styles.applyText}>
            Áp dụng
          </Text>
        </TouchableOpacity>

        {/* Reset */}
        <TouchableOpacity onPress={handleReset}>
          <Text style={styles.clearText}>
            Xóa bộ lọc
          </Text>
        </TouchableOpacity>
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

  optionSelected: {
    backgroundColor: "#2563eb",
  },

  optionText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },

  optionTextSelected: {
    color: "#ffffff",
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