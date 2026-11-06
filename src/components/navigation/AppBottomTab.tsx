import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../../theme/ThemeContext";

export type AppTabKey = "home" | "schedule" | "checkin" | "profile";

interface AppBottomTabProps {
  activeTab: AppTabKey;
  onTabPress: (tab: AppTabKey) => void;
}

const tabs: Array<{ key: AppTabKey; label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }> = [
  { key: "home", label: "Trang chủ", icon: "home-outline", activeIcon: "home" },
  { key: "schedule", label: "Lịch", icon: "calendar-outline", activeIcon: "calendar" },
  { key: "checkin", label: "Check-in", icon: "qr-code-outline", activeIcon: "qr-code" },
  { key: "profile", label: "Cá nhân", icon: "person-outline", activeIcon: "person" },
];

/** Shared, safe-area aware navigation used by all student-facing screens. */
export default function AppBottomTab({ activeTab, onTabPress }: AppBottomTabProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();

  return (
    <View accessibilityRole="tablist" style={[styles.container, { backgroundColor: theme.tabBackground, borderTopColor: theme.tabBorder, paddingBottom: Math.max(insets.bottom, 10) }]}>
      {tabs.map((tab) => {
        const selected = tab.key === activeTab;
        const color = selected ? theme.primary : theme.textTertiary;
        return (
          <Pressable key={tab.key} accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{ selected }} android_ripple={{ color: theme.primaryLight, borderless: true }} onPress={() => onTabPress(tab.key)} style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}>
            <View style={[styles.iconWrap, selected && { backgroundColor: theme.primaryLight }]}>
              <Ionicons name={selected ? tab.activeIcon : tab.icon} size={21} color={color} />
            </View>
            <Text style={[styles.label, { color }, selected && styles.labelSelected]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, shadowColor: "#0F172A", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 12 },
  tab: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", gap: 2, borderRadius: 14 },
  tabPressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
  iconWrap: { width: 40, height: 27, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 11, fontWeight: "500", lineHeight: 14 },
  labelSelected: { fontWeight: "700" },
});
