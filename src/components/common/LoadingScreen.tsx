import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Typography } from '../../theme';
import { useAppTheme } from '../../theme/ThemeContext';

interface Props {
  message?: string;
}

/**
 * LoadingScreen — dùng làm màn hình chờ toàn trang
 */
export default function LoadingScreen({ message = 'Đang tải...' }: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.text, { color: theme.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    fontSize: Typography.base,
  },
});
