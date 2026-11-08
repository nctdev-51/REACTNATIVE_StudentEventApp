import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/ThemeContext';

export type AdminTabKey = 'dashboard' | 'events' | 'reports' | 'users';

interface AdminBottomTabProps {
  activeTab: AdminTabKey;
  onTabPress: (tab: AdminTabKey) => void;
}

const tabs: Array<{
  key: AdminTabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}> = [
  { key: 'dashboard', label: 'Tổng quan', icon: 'grid-outline', activeIcon: 'grid' },
  { key: 'events', label: 'Sự kiện', icon: 'calendar-outline', activeIcon: 'calendar' },
  { key: 'reports', label: 'Người tham gia', icon: 'people-outline', activeIcon: 'people' },
  { key: 'users', label: 'Sinh viên & ĐRL', icon: 'school-outline', activeIcon: 'school' },
];

/**
 * Thanh Bottom Navigation Bar chuyên nghiệp dành riêng cho phân hệ Quản Trị Viên (Admin).
 * Giúp Admin chuyển đổi nhanh giữa Dashboard, Quản lý Sự kiện, Người tham gia & Quota, và Điểm Rèn Luyện.
 */
export default function AdminBottomTab({ activeTab, onTabPress }: AdminBottomTabProps) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useAppTheme();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.container,
        {
          backgroundColor: theme.tabBackground,
          borderTopColor: theme.tabBorder,
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      {tabs.map((tab) => {
        const selected = tab.key === activeTab;
        const color = selected ? theme.primary : theme.textTertiary;

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            android_ripple={{ color: theme.primaryLight, borderless: true }}
            onPress={() => onTabPress(tab.key)}
            style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
          >
            <View
              style={[
                styles.iconWrap,
                selected && {
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : theme.primaryLight,
                },
              ]}
            >
              <Ionicons
                name={selected ? tab.activeIcon : tab.icon}
                size={21}
                color={color}
              />
            </View>
            <Text
              style={[
                styles.label,
                { color },
                selected && styles.labelSelected,
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  tabPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
  iconWrap: {
    width: 42,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '500',
    lineHeight: 14,
  },
  labelSelected: {
    fontWeight: '700',
  },
});

