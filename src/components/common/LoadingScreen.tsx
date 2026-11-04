import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../theme';

interface Props {
  message?: string;
}

/**
 * LoadingScreen — dùng làm màn hình chờ toàn trang
 */
export default function LoadingScreen({ message = 'Đang tải...' }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: 12,
  },
  text: {
    fontSize: Typography.base,
    color: Colors.gray500,
  },
});
