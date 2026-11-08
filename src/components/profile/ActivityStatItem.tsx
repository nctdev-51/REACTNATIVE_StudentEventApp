import React from "react";
import { View, Text, StyleSheet } from "react-native";

export interface ActivityStatItemProps {
  value: number;
  label: string;
  accentColor: string;
  labelColor: string;
}

export default function ActivityStatItem({
  value,
  label,
  accentColor,
  labelColor,
}: ActivityStatItemProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.valueText, { color: accentColor }]}>{value}</Text>
      <Text style={[styles.labelText, { color: labelColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  valueText: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  labelText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
});
