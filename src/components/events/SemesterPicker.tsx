import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../../theme/ThemeContext";
import {
  SEMESTERS_NEWEST_FIRST,
  Semester,
  countEventsInSemester,
  formatSemesterRange,
  getCurrentSemesterId,
  getSemester,
} from "../../utils/semester";
import { Event } from "../../types/event";

interface SemesterPickerProps {
  /** Học kỳ đang chọn */
  value: string | null;
  onChange: (semesterId: string | null) => void;
  /** Toàn bộ sự kiện, dùng để đếm số hoạt động từng học kỳ */
  events?: Event[];
  /** Cho phép chọn "Tất cả học kỳ" */
  allowAll?: boolean;
  label?: string;
  style?: object;
}

export default function SemesterPicker({
  value,
  onChange,
  events = [],
  allowAll = true,
  label = "Học kỳ",
  style,
}: SemesterPickerProps) {
  const { theme, isDark } = useAppTheme();
  const [open, setOpen] = useState(false);

  const currentSemesterId = useMemo(() => getCurrentSemesterId(), []);

  const selected = getSemester(value);

  const options = useMemo(() => {
    const list = SEMESTERS_NEWEST_FIRST.map((semester) => ({
      semester,
      count: countEventsInSemester(events, semester.id),
    }));
    return list;
  }, [events]);

  const handleSelect = (semesterId: string | null) => {
    onChange(semesterId);
    setOpen(false);
  };

  const summary = selected
    ? selected.name
    : allowAll
      ? "Tất cả học kỳ"
      : "Chưa chọn học kỳ";

  const sub = selected
    ? `${formatSemesterRange(selected)}${
        selected.id === currentSemesterId ? " • Đang diễn ra" : ""
      }`
    : allowAll
      ? "Hiển thị hoạt động của mọi học kỳ"
      : undefined;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.trigger,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
          style,
        ]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${summary}`}
      >
        <View
          style={[
            styles.triggerIcon,
            { backgroundColor: isDark ? "rgba(59,130,246,0.18)" : "#EFF6FF" },
          ]}
        >
          <Ionicons name="school-outline" size={18} color={theme.primary} />
        </View>

        <View style={styles.triggerTextBox}>
          <Text style={[styles.triggerLabel, { color: theme.textTertiary }]}>
            {label}
          </Text>
          <Text
            style={[styles.triggerValue, { color: theme.textPrimary }]}
            numberOfLines={1}
          >
            {summary}
          </Text>
          {!!sub && (
            <Text
              style={[styles.triggerSub, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {sub}
            </Text>
          )}
        </View>

        <Ionicons
          name="chevron-down"
          size={18}
          color={theme.textSecondary}
        />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>
                Chọn học kỳ
              </Text>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                style={[
                  styles.closeBtn,
                  { backgroundColor: theme.surfaceSecondary },
                ]}
              >
                <Ionicons name="close" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.sheetHint, { color: theme.textSecondary }]}>
              Chọn học kỳ để xem các hoạt động diễn ra trong học kỳ đó.
            </Text>

            <ScrollView
              style={styles.list}
              showsVerticalScrollIndicator={false}
            >
              {allowAll && (
                <OptionRow
                  title="Tất cả học kỳ"
                  subtitle="Không giới hạn thời gian"
                  selected={value === null}
                  onPress={() => handleSelect(null)}
                />
              )}

              {options.map(({ semester, count }) => (
                <OptionRow
                  key={semester.id}
                  title={semester.name}
                  subtitle={`${formatSemesterRange(semester)} • ${count} hoạt động${
                    semester.id === currentSemesterId ? " • Đang diễn ra" : ""
                  }`}
                  selected={value === semester.id}
                  onPress={() => handleSelect(semester.id)}
                />
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function OptionRow({
  title,
  subtitle,
  selected,
  onPress,
}: {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();

  return (
    <TouchableOpacity
      style={[
        styles.option,
        {
          backgroundColor: selected ? theme.primaryLight : theme.surfaceSecondary,
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <View style={styles.optionTextBox}>
        <Text
          style={[
            styles.optionTitle,
            { color: selected ? theme.primary : theme.textPrimary },
            selected && styles.optionTitleSelected,
          ]}
        >
          {title}
        </Text>
        {!!subtitle && (
          <Text style={[styles.optionSub, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>

      {selected && (
        <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  triggerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  triggerTextBox: {
    flex: 1,
  },
  triggerLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  triggerValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  triggerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  sheet: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    maxHeight: "80%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetHint: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 17,
  },
  list: {
    marginTop: 2,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  optionTextBox: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  optionTitleSelected: {
    fontWeight: "700",
  },
  optionSub: {
    fontSize: 12,
    marginTop: 3,
  },
});