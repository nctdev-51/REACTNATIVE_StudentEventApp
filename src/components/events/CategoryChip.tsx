import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../../theme/ThemeContext";

interface CategoryChipProps {
  label: string;
  selected?: boolean;
}

export default function CategoryChip({
  label,
  selected = false,
}: CategoryChipProps) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.primary : theme.surfaceSecondary,
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: selected ? "#ffffff" : theme.textSecondary,
            fontWeight: selected ? "600" : "500",
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  text: {
    fontSize: 14,
  },
});
