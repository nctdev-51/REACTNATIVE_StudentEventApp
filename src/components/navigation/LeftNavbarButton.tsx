import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useDrawer } from '../../context/DrawerContext';
import { Colors, Shadow } from '../../theme';

interface LeftNavbarButtonProps {
  style?: StyleProp<ViewStyle>;
  tintColor?: string;
  hasNotification?: boolean;
}

export default function LeftNavbarButton({
  style,
  tintColor = Colors.gray800,
  hasNotification = false,
}: LeftNavbarButtonProps) {
  const { openDrawer } = useDrawer();

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={openDrawer}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityLabel="Mở menu điều hướng"
      accessibilityRole="button"
    >
      {/* Biểu tượng 3 thanh ngang Hamburger Bar thanh lịch */}
      <View style={styles.barsContainer}>
        <View style={[styles.bar, { backgroundColor: tintColor }]} />
        <View style={[styles.bar, styles.shortBar, { backgroundColor: tintColor }]} />
        <View style={[styles.bar, { backgroundColor: tintColor }]} />
      </View>

      {hasNotification && <View style={styles.badgeDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  barsContainer: {
    width: 20,
    height: 14,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bar: {
    width: 20,
    height: 2.2,
    borderRadius: 2,
  },
  shortBar: {
    width: 14,
  },
  badgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});

