import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import api, { setAuthToken } from '../services/api';
import { clearAuthSession, saveAuthSession } from '../services/authSession';
import { registerRemotePushDevice } from '../services/remotePush';
import { hydrateSession, logout, updateUser } from '../features/auth/authSlice';
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

  // A token is registered only after the shared session is authenticated.
  // Failure is non-blocking and will be retried at the next app launch.
  useEffect(() => {
    if (!isHydrating && isAuthenticated && token && user) {
      void registerRemotePushDevice();
    }
  }, [isAuthenticated, isHydrating, token, user]);

  // A stored session can outlive a tunnel restart or an earlier offline-demo
  // login. Validate its identity with Express before letting it access admin
  // screens; otherwise the UI may look like Admin while the server correctly
  // returns 403 for a student token.
  useEffect(() => {
    if (isHydrating || !isAuthenticated || !token) return;

    let disposed = false;
    const validateRemoteSession = async () => {
      if (token.startsWith('offline-')) {
        if (!disposed) dispatch(logout());
        return;
      }
      try {
        const serverUser = await api.getCurrentUser();
        if (!disposed) dispatch(updateUser(serverUser));
      } catch (error: any) {
        // Do not log a demo user out merely because 4G briefly drops. Only an
        // explicit authentication rejection invalidates the saved session.
        const status = error?.response?.status;
        if (!disposed && (status === 401 || status === 403)) {
          dispatch(logout());
        }
      }
    };

    void validateRemoteSession();
    return () => {
      disposed = true;
    };
  }, [dispatch, isAuthenticated, isHydrating, token]);

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
