/**
 * permissionHandler.ts — Module quản lý quyền truy cập Camera & Location
 *
 * Đồng bộ xin quyền cho cả Camera và Location trước khi quét QR check-in.
 * Sử dụng dịch vụ định vị Google Play Services Location (Fused Location Provider trên Android)
 * và Apple CoreLocation trên iOS.
 *
 * CLO6: Xử lý quyền truy cập Expo SDK (Camera, Location)
 */

import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';

// ─── Location Permission & Service Check ──────────────────────────────────────

export interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
  servicesEnabled?: boolean;
}

/**
 * Kiểm tra xem dịch vụ định vị (GPS) trên thiết bị có đang được bật hay không.
 */
export async function checkLocationServicesEnabled(): Promise<boolean> {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch (e) {
    return true; // Fallback
  }
}

/**
 * Xin quyền Location foreground và kiểm tra GPS phần cứng.
 * Nếu GPS đang tắt hoặc người dùng đã từ chối vĩnh viễn,
 * hiển thị Alert hướng dẫn bật GPS / mở Settings.
 */
export async function requestLocationPermission(): Promise<PermissionResult> {
  // 1. Kiểm tra GPS phần cứng trên máy
  const servicesEnabled = await checkLocationServicesEnabled();
  if (!servicesEnabled) {
    Alert.alert(
      'Chưa bật định vị GPS',
      'Vui lòng bật tính năng Vị trí (GPS) trên thiết bị của bạn để ứng dụng có thể xác định toạ độ Google Maps khi check-in.',
      [
        { text: 'Để sau', style: 'cancel' },
        {
          text: 'Mở Cài đặt GPS',
          onPress: () => {
            if (Platform.OS === 'android') {
              Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() =>
                Linking.openSettings()
              );
            } else {
              Linking.openSettings();
            }
          },
        },
      ]
    );
    return { granted: false, canAskAgain: true, servicesEnabled: false };
  }

  // 2. Xin quyền ứng dụng
  const { status, canAskAgain } =
    await Location.requestForegroundPermissionsAsync();

  if (status === 'granted') {
    return { granted: true, canAskAgain: true, servicesEnabled: true };
  }

  // Người dùng đã chọn "Không hỏi lại" → hướng dẫn mở Settings
  if (!canAskAgain) {
    Alert.alert(
      'Cần quyền Vị trí (Google Maps)',
      'Ứng dụng cần truy cập vị trí GPS thực tế để xác minh bạn đang có mặt tại sự kiện.\n\nVui lòng vào Cài đặt → Quyền ứng dụng → Vị trí → Chọn "Cho phép khi dùng ứng dụng".',
      [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() },
      ]
    );
  }

  return { granted: false, canAskAgain, servicesEnabled: true };
}

/**
 * Kiểm tra quyền Location hiện tại mà không xin mới
 */
export async function checkLocationPermission(): Promise<PermissionResult> {
  const { status, canAskAgain } =
    await Location.getForegroundPermissionsAsync();
  return { granted: status === 'granted', canAskAgain };
}

// ─── Get Current Location (Google Play Services / High Accuracy) ──────────────

/**
 * Lấy vị trí GPS hiện tại của thiết bị với độ chính xác cao (Accuracy.High).
 * Trên Android: Tận dụng Google Play Services Fused Location Provider.
 *
 * @param timeoutMs Thời gian tối đa chờ lấy vị trí (ms)
 * @returns LocationObject hoặc null nếu thất bại
 */
export async function getCurrentPosition(
  timeoutMs: number = 10_000
): Promise<Location.LocationObject | null> {
  try {
    const servicesEnabled = await checkLocationServicesEnabled();
    if (!servicesEnabled) {
      console.warn('[permissionHandler] Dịch vụ vị trí đang tắt');
      return null;
    }

    // Ưu tiên độ chính xác cao để đối soát với Google Maps
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeInterval: 2000,
    });
    return location;
  } catch (error) {
    console.warn('[permissionHandler] Lỗi getCurrentPositionAsync, thử lấy vị trí gần nhất (lastKnown):', error);
    try {
      // Fallback: Lấy vị trí đã biết gần nhất nếu GPS chưa kịp khóa toạ độ
      const lastKnown = await Location.getLastKnownPositionAsync();
      return lastKnown;
    } catch (e) {
      return null;
    }
  }
}

// ─── Reverse Geocoding (Lấy địa chỉ thực tế từ Google Maps / Geocoder) ─────────

/**
 * Chuyển đổi toạ độ GPS thành địa chỉ đường phố thực tế (Reverse Geocoding).
 * Ví dụ: "12 Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP. Hồ Chí Minh"
 */
export async function reverseGeocodeAddress(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (results && results.length > 0) {
      const item = results[0];
      const parts = [
        item.streetNumber,
        item.street,
        item.subregion || item.district,
        item.city || item.region,
      ].filter(Boolean);

      if (parts.length > 0) {
        return parts.join(', ');
      }
      return item.name || null;
    }
    return null;
  } catch (err) {
    console.warn('[permissionHandler] Lỗi reverse geocode:', err);
    return null;
  }
}

// ─── Google Maps Deep Linking ────────────────────────────────────────────────

/**
 * Mở ứng dụng Google Maps (hoặc trình duyệt) hiển thị toạ độ địa điểm.
 */
export function openInGoogleMaps(
  latitude: number,
  longitude: number,
  label: string = 'Địa điểm sự kiện'
) {
  const url = Platform.select({
    ios: `maps:0,0?q=${encodeURIComponent(label)}@${latitude},${longitude}`,
    android: `geo:0,0?q=${latitude},${longitude}(${encodeURIComponent(label)})`,
    default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  })!;

  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        return Linking.openURL(
          `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
        );
      }
    })
    .catch((err) => console.warn('Không thể mở Google Maps:', err));
}

// ─── Forward Geocoding (Tìm toạ độ từ địa chỉ text) ──────────────────────────

/**
 * Forward Geocoding: Chuyển đổi tên địa chỉ dạng text thành toạ độ GPS.
 * Dùng cho Admin cài đặt vị trí sự kiện bằng tìm kiếm văn bản.
 * Ví dụ: "12 Nguyễn Văn Bảo, Gò Vấp" -> { latitude: 10.8221, longitude: 106.6876 }
 */
export async function geocodeAddress(
  address: string
): Promise<{ latitude: number; longitude: number; formattedAddress?: string } | null> {
  if (!address || !address.trim()) return null;

  const cleanQuery = address.trim();

  // 1. Dùng Expo Location Geocode SDK (chạy trên Google Geocoder native của máy)
  try {
    const results = await Location.geocodeAsync(cleanQuery);
    if (results && results.length > 0) {
      const best = results[0];
      return {
        latitude: best.latitude,
        longitude: best.longitude,
        formattedAddress: cleanQuery,
      };
    }
  } catch (e) {
    console.warn('[permissionHandler] Expo geocodeAsync lỗi hoặc không tìm thấy:', e);
  }

  // 2. Fallback: Dùng OpenStreetMap Nominatim Geocoding API (miễn phí, phủ toàn Việt Nam)
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&limit=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'StudentEventApp/1.0',
        'Accept': 'application/json',
      },
    });
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        formattedAddress: data[0].display_name,
      };
    }
  } catch (err) {
    console.warn('[permissionHandler] Nominatim geocode fallback error:', err);
  }

  return null;
}
