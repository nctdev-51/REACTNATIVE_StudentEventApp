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

export type EventStatus =
  | "draft"
  | "pending_approval"
  | "published"
  | "registration_closed"
  | "ongoing"
  | "completed"
  | "cancelled"
  | "upcoming"
  | "past";

export interface EventAttachment {
  name: string;
  url: string;
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

  /** Học kỳ mà sự kiện thuộc về (admin gán); không có thì suy ra từ thời gian */
  semesterId?: string;

  status: EventStatus;

  /** Trạng thái ẩn bởi admin (khi ẩn, sinh viên sẽ không nhìn thấy trên trang chủ) */
  isHidden?: boolean;

  qrCode?: string;

  /** Quản lý Quota và Waitlist */
  maxSlots?: number;
  waitlistSlots?: number;
  registeredCount?: number;
  waitlistCount?: number;

  /** Mã PIN dự phòng khi GPS/Camera lỗi (Fallback) */
  checkInPasscode?: string;

  /** Phân loại đối tượng tham gia */
  targetFaculties?: string[];
  targetCohorts?: string[];

  /** Hạn chót hủy vé */
  cancellationDeadline?: string;

  /** Tiện ích: Livestream & Tài liệu đính kèm */
  livestreamUrl?: string | null;
  attachments?: EventAttachment[];

  createdAt?: string;
  updatedAt?: string;
}
