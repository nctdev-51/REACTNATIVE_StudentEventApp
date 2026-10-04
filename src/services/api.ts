import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';

/**
 * Cấu hình BASE_URL dùng chung cho toàn bộ ứng dụng:
 * - Android Emulator: 10.0.2.2 trỏ về localhost của máy tính host
 * - iOS Simulator / Web: localhost
 * - Thiết bị thật (Expo Go): Thay bằng IP mạng LAN máy tính của bạn (vd: 'http://192.168.1.15:3000')
 */
export const DEV_LAN_IP = '192.168.1.100'; // Đổi IP này khi test trên điện thoại thật chung Wi-Fi

export const BASE_URL: string = Platform.select({
  android: 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

// Tạo Axios instance với cấu hình mặc định
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Cho phép linh hoạt cập nhật Base URL lúc runtime (hữu ích khi test đổi IP máy thật)
 */
export const setBaseUrl = (newUrl: string) => {
  apiClient.defaults.baseURL = newUrl;
};

// ==========================================
// ĐỊNH NGHĨA KIỂU DỮ LIỆU (TYPES / INTERFACES)
// ==========================================

export interface User {
  id: string;
  _id: string;
  studentId: string;
  fullName: string;
  email: string;
  password?: string;
  point: number;
  role: 'student' | 'admin';
}

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

export interface Event {
  id: string;
  _id: string;
  title: string;
  category: 'Học thuật' | 'Kỹ năng' | 'Thể thao' | string;
  time: EventTime;
  location: string;
  description: string;
  images: string[];
  aiSummary: AISummary;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface Registration {
  id: string;
  _id: string;
  eventId: string;
  userId: string;
  participantRole: 'attendee' | 'volunteer';
  status: 'registered' | 'checked_in' | 'cancelled';
  checkInTime: string | null;
}

export interface Feedback {
  id: string;
  _id: string;
  eventId: string;
  userId: string;
  rating: number; // 1 đến 5
  comment: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  _id: string;
  userId: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

// ==========================================
// CÁC HÀM GỌI API THEO CHUẨN RESTful
// ==========================================

// --- 1. Users ---
export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<User[]>('/users');
  return response.data;
};

export const getUserById = async (id: string): Promise<User> => {
  const response = await apiClient.get<User>(`/users/${id}`);
  return response.data;
};

// --- 2. Events ---
export const getEvents = async (params?: {
  category?: string;
  status?: string;
}): Promise<Event[]> => {
  const response = await apiClient.get<Event[]>('/events', { params });
  return response.data;
};

export const getEventById = async (id: string): Promise<Event> => {
  const response = await apiClient.get<Event>(`/events/${id}`);
  return response.data;
};

// --- 3. Registrations ---
export const getRegistrationsByUser = async (
  userId: string
): Promise<Registration[]> => {
  const response = await apiClient.get<Registration[]>('/registrations', {
    params: { userId },
  });
  return response.data;
};

export const getRegistrationsByEvent = async (
  eventId: string
): Promise<Registration[]> => {
  const response = await apiClient.get<Registration[]>('/registrations', {
    params: { eventId },
  });
  return response.data;
};

export const registerEvent = async (
  data: Omit<Registration, 'id' | '_id'> & { id?: string; _id?: string }
): Promise<Registration> => {
  // Tự động sinh ID mô phỏng MongoDB ObjectId nếu chưa có
  const generatedId =
    data.id ||
    data._id ||
    Date.now().toString(16).padStart(24, '0');

  const payload: Registration = {
    ...data,
    id: generatedId,
    _id: generatedId,
    status: data.status || 'registered',
    checkInTime: data.checkInTime || null,
  };

  const response = await apiClient.post<Registration>('/registrations', payload);
  return response.data;
};

export const checkIn = async (
  registrationId: string
): Promise<Registration> => {
  const response = await apiClient.patch<Registration>(
    `/registrations/${registrationId}`,
    {
      status: 'checked_in',
      checkInTime: new Date().toISOString(),
    }
  );
  return response.data;
};

export const cancelRegistration = async (
  registrationId: string
): Promise<Registration> => {
  const response = await apiClient.patch<Registration>(
    `/registrations/${registrationId}`,
    {
      status: 'cancelled',
    }
  );
  return response.data;
};

// --- 4. Feedbacks ---
export const getFeedbacksByEvent = async (
  eventId: string
): Promise<Feedback[]> => {
  const response = await apiClient.get<Feedback[]>('/feedbacks', {
    params: { eventId },
  });
  return response.data;
};

export const createFeedback = async (
  data: Omit<Feedback, 'id' | '_id' | 'createdAt'> & {
    id?: string;
    _id?: string;
    createdAt?: string;
  }
): Promise<Feedback> => {
  const generatedId =
    data.id ||
    data._id ||
    Date.now().toString(16).padStart(24, '0');

  const payload: Feedback = {
    ...data,
    id: generatedId,
    _id: generatedId,
    createdAt: data.createdAt || new Date().toISOString(),
  };

  const response = await apiClient.post<Feedback>('/feedbacks', payload);
  return response.data;
};

// --- 5. Notifications ---
export const getNotificationsByUser = async (
  userId: string
): Promise<Notification[]> => {
  const response = await apiClient.get<Notification[]>('/notifications', {
    params: { userId },
  });
  return response.data;
};

export const markNotificationAsRead = async (
  notificationId: string
): Promise<Notification> => {
  const response = await apiClient.patch<Notification>(
    `/notifications/${notificationId}`,
    {
      isRead: true,
    }
  );
  return response.data;
};

// Export mặc định đóng gói toàn bộ hàm
export default {
  BASE_URL,
  apiClient,
  setBaseUrl,
  getUsers,
  getUserById,
  getEvents,
  getEventById,
  getRegistrationsByUser,
  getRegistrationsByEvent,
  registerEvent,
  checkIn,
  cancelRegistration,
  getFeedbacksByEvent,
  createFeedback,
  getNotificationsByUser,
  markNotificationAsRead,
};
