import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

/**
 * Điều hướng an toàn toàn cục cho mọi tác vụ trong hệ thống (Drawer, Thunk, Deep Link, Services)
 * Tự động phân giải các stack/tab lồng nhau (MainTabs, AdminTabs, StudentPreview)
 */
export function navigate(name: string, params?: any) {
  const doNavigate = () => {
    if (!navigationRef.isReady()) return;

    try {
      const rootState = navigationRef.getRootState();
      const topRouteNames = rootState?.routeNames || [];
      const isAdminStackActive = topRouteNames.includes('AdminTabs');

      // ─── 1. Điều hướng khi Quản Trị Viên (AdminStack) đang hoạt động ─────────
      if (isAdminStackActive) {
        // Tab quản trị thuộc AdminTabs
        if (
          name === 'AdminDashboard' ||
          name === 'AdminEvents' ||
          name === 'AdminCheckInReports' ||
          name === 'AdminUsers'
        ) {
          navigationRef.navigate('AdminTabs', { screen: name, params });
          return;
        }

        // Màn hình stack quản trị
        if (name === 'AdminCreateEvent' || name === 'AdminQRDisplay') {
          navigationRef.navigate(name, params);
          return;
        }

        // Admin muốn mở màn hình sinh viên -> điều hướng qua StudentPreview
        if (name === 'Home' || name === 'MySchedule' || name === 'Profile') {
          navigationRef.navigate('StudentPreview', {
            screen: 'MainTabs',
            params: { screen: name, params },
          });
          return;
        }

        if (name === 'CheckIn') {
          navigationRef.navigate('StudentPreview', {
            screen: 'MainTabs',
            params: {
              screen: 'CheckIn',
              params: params?.screen ? params : { screen: 'QRScanner', params },
            },
          });
          return;
        }

        if (
          name === 'EventDetail' ||
          name === 'Notification' ||
          name === 'Feedback' ||
          name === 'Filter' ||
          name === 'RegistrationSuccess'
        ) {
          navigationRef.navigate('StudentPreview', {
            screen: name,
            params,
          });
          return;
        }
      }

      // ─── 2. Điều hướng khi Sinh Viên (MainStack) đang hoạt động ──────────────
      if (name === 'Home' || name === 'MySchedule' || name === 'Profile') {
        navigationRef.navigate('MainTabs', { screen: name, params });
        return;
      }

      if (name === 'CheckIn') {
        navigationRef.navigate('MainTabs', {
          screen: 'CheckIn',
          params: params?.screen ? params : { screen: 'QRScanner', params },
        });
        return;
      }

      // Nếu đang ở MainStack mà gọi về Admin / AdminTabs
      if (name === 'Admin' || name === 'AdminTabs') {
        if (topRouteNames.includes('AdminTabs')) {
          navigationRef.navigate('AdminTabs');
        } else if (navigationRef.canGoBack()) {
          navigationRef.goBack();
        }
        return;
      }

      // Điều hướng thông thường cho các màn hình khớp tên
      navigationRef.navigate(name, params);
    } catch (err) {
      console.warn(`[Navigation] Cảnh báo điều hướng tới "${name}":`, err);
      try {
        navigationRef.navigate(name, params);
      } catch (fallbackErr) {
        console.error(`[Navigation] Lỗi điều hướng fallback tới "${name}":`, fallbackErr);
      }
    }
  };

  if (navigationRef.isReady()) {
    doNavigate();
  } else {
    setTimeout(doNavigate, 120);
  }
}

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

export function resetTo(name: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name, params }],
      })
    );
  }
}
