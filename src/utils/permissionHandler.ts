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


// ─── Danh mục Địa điểm Hội trường & Khuôn viên trường IUH ─────────────────────

export interface CampusVenue {
  id: string;
  name: string;
  fullAddress: string;
  description: string;
  latitude: number;
  longitude: number;
  defaultRadius: number;
}

export const IUH_CAMPUS_VENUES: CampusVenue[] = [
  {
    id: 'hoi_truong_a',
    name: 'Hội trường A (Tòa nhà A - Cơ sở chính)',
    fullAddress: 'Hội trường A, 12 Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP.HCM',
    description: 'Sức chứa 1.000 chỗ, các sự kiện lớn cấp trường & khai giảng',
    latitude: 10.82216,
    longitude: 106.68761,
    defaultRadius: 300,
  },
  {
    id: 'hoi_truong_e4',
    name: 'Hội trường E4 (Tầng 4 Nhà E)',
    fullAddress: 'Tầng 4 Nhà E, 12 Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP.HCM',
    description: 'Hội thảo chuyên đề, sinh hoạt công dân & bảo vệ đồ án',
    latitude: 10.82245,
    longitude: 106.68785,
    defaultRadius: 200,
  },
  {
    id: 'nha_thi_dau',
    name: 'Nhà thi đấu Đa năng IUH',
    fullAddress: 'Khu thể thao, 12 Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP.HCM',
    description: 'Hội thao sinh viên, văn nghệ & triển lãm việc làm Job Fair',
    latitude: 10.82190,
    longitude: 106.68810,
    defaultRadius: 300,
  },
  {
    id: 'san_trung_tam',
    name: 'Sân trường Trung tâm Cơ sở 1',
    fullAddress: 'Sân trung tâm, 12 Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP.HCM',
    description: 'Ngày hội đoàn viên, hiến máu tình nguyện, cắm trại',
    latitude: 10.82220,
    longitude: 106.68750,
    defaultRadius: 500,
  },
  {
    id: 'thu_vien_b',
    name: 'Trung tâm Hội thảo - Thư viện (Nhà B)',
    fullAddress: 'Nhà B, 12 Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP.HCM',
    description: 'Hội nghị khoa học sinh viên & không gian học tập số',
    latitude: 10.82230,
    longitude: 106.68730,
    defaultRadius: 200,
  },
  {
    id: 'nha_x_cong_nghe',
    name: 'Khu thực hành Công nghệ cao (Nhà X)',
    fullAddress: 'Nhà X, 12 Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP.HCM',
    description: 'Cuộc thi Robocon, IoT, AI hackathon',
    latitude: 10.82260,
    longitude: 106.68820,
    defaultRadius: 200,
  },
  {
    id: 'co_so_2_thanh_hoa',
    name: 'Phân hiệu Thanh Hóa (Cơ sở 2)',
    fullAddress: 'Xã Quảng Tâm, TP. Thanh Hóa, Tỉnh Thanh Hóa',
    description: 'Khuôn viên đào tạo phân hiệu miền Bắc',
    latitude: 19.78310,
    longitude: 105.82360,
    defaultRadius: 500,
  },
  {
    id: 'co_so_3_bien_hoa',
    name: 'Cơ sở Biên Hòa (Đồng Nai)',
    fullAddress: 'Phường Tân Hiệp, TP. Biên Hòa, Tỉnh Đồng Nai',
    description: 'Cơ sở đào tạo thực hành kỹ thuật công nghệ',
    latitude: 10.95740,
    longitude: 106.84270,
    defaultRadius: 500,
  },
];

// ─── Tự động gán toạ độ ngầm từ Tên Địa Điểm (Không bao giờ báo lỗi) ─────────

/**
 * Chuyển đổi tên địa điểm (Hội trường A, Nhà E, Nhà thi đấu...) thành toạ độ ngầm.
 * Thuật toán chạy ngầm để giảng viên/quản lý không cần bận tâm về số liệu GPS.
 */
export async function geocodeAddress(
  address: string
): Promise<{ latitude: number; longitude: number; formattedAddress: string; radiusMeters?: number }> {
  if (!address || !address.trim()) {
    // Mặc định: Khuôn viên chính IUH
    return {
      latitude: 10.82216,
      longitude: 106.68761,
      formattedAddress: 'Trường Đại học Công nghiệp TP.HCM (Cơ sở chính)',
      radiusMeters: 500,
    };
  }

  const cleanQuery = address.trim();
  const lower = cleanQuery.toLowerCase();

  // 1. Đối soát nhanh với danh mục hội trường IUH
  for (const venue of IUH_CAMPUS_VENUES) {
    const vLower = venue.name.toLowerCase();
    const idLower = venue.id.toLowerCase();
    if (
      lower.includes(vLower) ||
      vLower.includes(lower) ||
      (lower.includes('e4') && idLower.includes('e4')) ||
      (lower.includes('nhà thi đấu') && idLower.includes('nha_thi_dau')) ||
      (lower.includes('sân') && idLower.includes('san')) ||
      (lower.includes('thư viện') && idLower.includes('thu_vien')) ||
      (lower.includes('nhà x') && idLower.includes('nha_x')) ||
      (lower.includes('thanh hóa') && idLower.includes('thanh_hoa')) ||
      (lower.includes('biên hòa') && idLower.includes('bien_hoa'))
    ) {
      return {
        latitude: venue.latitude,
        longitude: venue.longitude,
        formattedAddress: venue.name,
        radiusMeters: venue.defaultRadius,
      };
    }
  }

  // 2. Thử Geocode native từ Google Location Provider
  try {
    const searchQuery = cleanQuery.includes('TP.HCM') || cleanQuery.includes('Hồ Chí Minh')
      ? cleanQuery
      : `${cleanQuery}, Gò Vấp, TP. Hồ Chí Minh`;

    const results = await Location.geocodeAsync(searchQuery);
    if (results && results.length > 0) {
      const best = results[0];
      return {
        latitude: best.latitude,
        longitude: best.longitude,
        formattedAddress: cleanQuery,
        radiusMeters: 300,
      };
    }
  } catch (e) {
    // bỏ qua lỗi native
  }

  // 3. Fallback an toàn: Gán toạ độ Cơ sở chính IUH (12 Nguyễn Văn Bảo) với tên địa điểm của giảng viên
  return {
    latitude: 10.82216,
    longitude: 106.68761,
    formattedAddress: cleanQuery,
    radiusMeters: 500,
  };
}
