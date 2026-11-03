import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { setAuthToken } from '../services/api';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import AdminStack from './AdminStack';
import { Colors } from '../theme';

/**
 * RootNavigator — Phân quyền đăng nhập & điều hướng hệ thống:
 * - Chưa đăng nhập -> AuthStack (Login / Register)
 * - Đăng nhập tài khoản Admin (role === 'admin') -> AdminStack (Dashboard Quản trị, Quản lý vị trí GPS, Báo cáo điểm danh)
 * - Đăng nhập tài khoản Sinh viên (role === 'student') -> MainStack (Sự kiện, Điểm danh QR, Lịch trình, Thông báo)
 */
export default function RootNavigator() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, token, user, loading } = useAppSelector((s) => s.auth);

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

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  // Phân quyền theo vai trò người dùng
  if (user?.role === 'admin') {
    return <AdminStack />;
  }

  return <MainStack />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
