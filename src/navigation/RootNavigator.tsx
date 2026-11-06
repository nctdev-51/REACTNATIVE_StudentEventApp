import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { setAuthToken } from '../services/api';
import { clearAuthSession, saveAuthSession } from '../services/authSession';
import { hydrateSession } from '../features/auth/authSlice';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import AdminStack from './AdminStack';
import { useAppTheme } from '../theme/ThemeContext';

/**
 * RootNavigator — Phân quyền đăng nhập & điều hướng hệ thống:
 * - Chưa đăng nhập -> AuthStack (Login / Register)
 * - Đăng nhập tài khoản Admin (role === 'admin') -> AdminStack (Dashboard Quản trị, Quản lý vị trí GPS, Báo cáo điểm danh)
 * - Đăng nhập tài khoản Sinh viên (role === 'student') -> MainStack (Sự kiện, Điểm danh QR, Lịch trình, Thông báo)
 */
export default function RootNavigator() {
  const { theme } = useAppTheme();
  const dispatch = useAppDispatch();
  const { isAuthenticated, token, user, isHydrating } = useAppSelector((s) => s.auth);

  // Hydrate once so the app never flashes the Login stack before a saved
  // session has been evaluated.
  useEffect(() => {
    void dispatch(hydrateSession());
  }, [dispatch]);

  // Sync token vào Axios interceptor mỗi khi thay đổi
  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  // Keep the persisted session in sync with Redux. This also handles profile
  // updates and role switches without scattering storage calls across screens.
  useEffect(() => {
    if (isHydrating) return;

    const syncSession = async () => {
      try {
        if (isAuthenticated && token && user) {
          await saveAuthSession({ token, user });
        } else {
          await clearAuthSession();
        }
      } catch (error) {
        // Persistence is an enhancement; a storage failure must not block auth.
        console.warn('[Auth] Could not persist session', error);
      }
    };

    void syncSession();
  }, [isAuthenticated, isHydrating, token, user]);

  // Hiển thị loading khi đang kiểm tra session
  if (isHydrating) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.statusBarStyle} />
        <ActivityIndicator size="large" color={theme.primary} />
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
  },
});
