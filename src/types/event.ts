export interface EventTime {
  start: string;
  end: string;
}

export interface AISummary {
  what: string;
  when: string;
  where: string;
  benefits: string;
}

/**
 * Toạ độ GPS của địa điểm tổ chức sự kiện.
 * Dùng để xác minh vị trí sinh viên khi check-in (Anti-Fake).
 */
export interface EventCoordinates {
  latitude: number;
  longitude: number;
  radiusMeters?: number; // Bán kính cho phép check-in tính bằng mét (mặc định 500m)
}

export interface Event {
  _id: string;
  id?: string;

  title: string;

  faculty: string;

  category: string;

  time: EventTime;

  location: string;

  /** Toạ độ GPS địa điểm — dùng cho chống check-in giả mạo (Anti-Fake) */
  coordinates?: EventCoordinates;

  organizer: string;

  description: string;

  images: string[];

  trainingPoints: number;

  aiSummary?: AISummary;

  status: "upcoming" | "ongoing" | "completed" | "past";

  /** Trạng thái ẩn bởi admin (khi ẩn, sinh viên sẽ không nhìn thấy trên trang chủ) */
  isHidden?: boolean;

  qrCode?: string;

  createdAt?: string;
}
