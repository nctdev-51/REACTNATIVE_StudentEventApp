/**
 * locationUtils.ts — Tiện ích xử lý vị trí (Anti-Fake Check-in)
 *
 * Chức năng:
 * - Tính khoảng cách giữa 2 toạ độ GPS bằng công thức Haversine
 * - Kiểm tra sinh viên có nằm trong bán kính cho phép khi check-in
 *
 * CLO6: Sử dụng Expo Location SDK
 */

/** Bán kính cho phép check-in (mét) — sinh viên phải ở trong phạm vi này */
export const CHECK_IN_RADIUS_METERS = 500;

/**
 * Công thức Haversine — tính khoảng cách giữa 2 điểm GPS trên bề mặt Trái Đất.
 *
 * @param lat1 Vĩ độ điểm 1 (độ)
 * @param lon1 Kinh độ điểm 1 (độ)
 * @param lat2 Vĩ độ điểm 2 (độ)
 * @param lon2 Kinh độ điểm 2 (độ)
 * @returns Khoảng cách (mét)
 */
export function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6_371_000; // Bán kính trung bình Trái Đất (m)
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Kiểm tra vị trí người dùng có nằm trong bán kính cho phép so với địa điểm sự kiện.
 *
 * @returns { withinRadius: boolean, distanceMeters: number (đã làm tròn) }
 */
export function isWithinCheckInRadius(
  userLat: number,
  userLon: number,
  eventLat: number,
  eventLon: number,
  radiusMeters: number = CHECK_IN_RADIUS_METERS,
): { withinRadius: boolean; distanceMeters: number } {
  const distance = getDistanceMeters(userLat, userLon, eventLat, eventLon);
  return {
    withinRadius: distance <= radiusMeters,
    distanceMeters: Math.round(distance),
  };
}

/**
 * Format khoảng cách thành chuỗi dễ đọc (ví dụ: "350m", "1.2km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

