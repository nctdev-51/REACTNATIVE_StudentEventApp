import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { setAuthToken } from '../services/api';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import { Colors } from '../theme';

/**
 * RootNavigator — quyết định hiển thị AuthStack hay MainStack
 * dựa trên trạng thái isAuthenticated trong Redux store.
 *
 * Khi token thay đổi, tự động cập nhật Axios header.
 */
export default function RootNavigator() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, token, loading } = useAppSelector((s) => s.auth);

  // Sync token vào Axios interceptor mỗi khi thay đổi
  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  // Hiển thị loading khi đang kiểm tra session
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return isAuthenticated ? <MainStack /> : <AuthStack />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
