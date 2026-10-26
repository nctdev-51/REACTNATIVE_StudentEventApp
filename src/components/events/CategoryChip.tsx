import { StyleSheet, Text, View } from "react-native";

interface CategoryChipProps {
  label: string;
  selected?: boolean;
}

export default function CategoryChip({
  label,
  selected = false,
}: CategoryChipProps) {
  return (
    <View
      style={[
        styles.chip,
        selected && styles.chipSelected,
      ]}
    >
      <Text
        style={[
          styles.text,
          selected && styles.textSelected,
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
    backgroundColor: "#f3f4f6",
    marginRight: 8,
  },

  chipSelected: {
    backgroundColor: "#2563eb",
  },

  text: {
    fontSize: 14,
    color: "#4b5563",
    fontWeight: "500",
  },

  textSelected: {
    color: "#ffffff",
    fontWeight: "600",
  },
});