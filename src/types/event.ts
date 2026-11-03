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

  aiSummary: AISummary;

  status: "upcoming" | "ongoing" | "completed";

  qrCode?: string;

  createdAt?: string;
}
