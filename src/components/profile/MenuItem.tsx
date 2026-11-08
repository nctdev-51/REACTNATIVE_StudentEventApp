import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  isLast?: boolean;
  onPress?: () => void;
  textColor?: string;
  bgColor?: string;
  borderSubtle?: string;
  badgeBg?: string;
  chevronColor?: string;
}

export default function MenuItem({
  icon,
  label,
  badge,
  isLast = false,
  onPress,
  textColor = "#0F172A",
  bgColor = "#FFFFFF",
  borderSubtle = "#F1F5F9",
  badgeBg = "#EFF6FF",
  chevronColor = "#94A3B8",
}: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          borderBottomColor: borderSubtle,
          borderBottomWidth: isLast ? 0 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={[styles.labelText, { color: textColor }]}>{label}</Text>
      <View style={styles.rightWrap}>
        {badge ? (
          <View style={[styles.badgeWrap, { backgroundColor: badgeBg }]}>
            <Text style={[styles.badgeText, { color: textColor }]}>{badge}</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={chevronColor} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  labelText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  rightWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  badgeWrap: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
