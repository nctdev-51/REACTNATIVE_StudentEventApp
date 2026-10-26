import axios, { AxiosInstance } from "axios";
import { Platform } from "react-native";
import {
  User,
  Event,
  Registration,
  Feedback,
  Notification,
  AuthCredentials,
  RegisterPayload,
  AuthResponse,
  CreateRegistrationPayload,
  CreateFeedbackPayload,
} from "../types";

// ─── Base URL ─────────────────────────────────────────────────────────────────

/**
 * Cấu hình BASE_URL trỏ đến backend Express (port 5000):
 * - Android Emulator: 10.0.2.2 → localhost máy host
 * - iOS / Web: localhost
 * - Thiết bị thật: đổi DEV_LAN_IP thành IP LAN của máy tính
 */
export const DEV_LAN_IP = "192.168.1.100";

export const BASE_URL: string = Platform.select({
  android: `http://10.0.2.2:5000/api`,
  ios: `http://localhost:5000/api`,
  default: `http://localhost:5000/api`,
});

// ─── Axios Instance ───────────────────────────────────────────────────────────

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Interceptor: tự động gắn Authorization header từ token hiện tại.
 * Token được set từ bên ngoài qua setAuthToken().
 */
let _authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  _authToken = token;
};

apiClient.interceptors.request.use((config) => {
  if (_authToken) {
    config.headers.Authorization = `Bearer ${_authToken}`;
  }
  return config;
});

// Interceptor: log lỗi 401 (token hết hạn)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // Token hết hạn — authSlice sẽ xử lý logout
      console.warn("[API] Unauthorized 401 — token có thể đã hết hạn");
    }
    return Promise.reject(error);
  },
);

/**
 * Cập nhật Base URL lúc runtime (test đổi IP thiết bị thật)
 */
export const setBaseUrl = (newUrl: string) => {
  apiClient.defaults.baseURL = newUrl;
};

// ─── Response Adapter ─────────────────────────────────────────────────────────

/**
 * Backend Express trả về:
 *   { success: true, data: { user: { name, email, ... }, accessToken, refreshToken } }
 *
 * Frontend Redux (authSlice) kỳ vọng:
 *   { token: string, user: User }
 *
 * Hàm này chuyển đổi giữa hai format, đồng thời map:
 *   user.name  → user.fullName  (theo interface User frontend)
 *   accessToken → token
 */
function mapBackendAuth(responseData: any): AuthResponse {
  const { user: rawUser, accessToken } = responseData.data ?? responseData;

  const user: User = {
    _id: rawUser._id,
    studentId: rawUser.studentId ?? "",
    fullName: rawUser.name ?? rawUser.fullName ?? "",
    email: rawUser.email,
    point: rawUser.point ?? 0,
    role: rawUser.role === "admin" ? "admin" : "student",
    faculty: rawUser.faculty ?? undefined,
    avatarUrl: rawUser.avatar ?? rawUser.avatarUrl ?? undefined,
    phone: rawUser.phone ?? undefined,
    createdAt: rawUser.createdAt ?? undefined,
  };

  return { token: accessToken ?? responseData.token, user };
}

/**
 * Adapter cho danh sách user trả về từ /api/auth/me
 */
function mapBackendUser(responseData: any): User {
  const rawUser = responseData.data?.user ?? responseData.data ?? responseData;
  return {
    _id: rawUser._id,
    studentId: rawUser.studentId ?? "",
    fullName: rawUser.name ?? rawUser.fullName ?? "",
    email: rawUser.email,
    point: rawUser.point ?? 0,
    role: rawUser.role === "admin" ? "admin" : "student",
    faculty: rawUser.faculty ?? undefined,
    avatarUrl: rawUser.avatar ?? rawUser.avatarUrl ?? undefined,
    phone: rawUser.phone ?? undefined,
    createdAt: rawUser.createdAt ?? undefined,
  };
}

/**
 * Unwrap data từ { success, data: [...] } nếu cần
 */
function unwrapList<T>(responseData: any): T[] {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData.data)) return responseData.data;
  return [];
}

function unwrapOne<T>(responseData: any): T {
  if (responseData?.data !== undefined && !Array.isArray(responseData.data)) {
    return responseData.data as T;
  }
  return responseData as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Backend trả: { success, message, data: { user, accessToken, refreshToken } }
 */
export const login = async (
  credentials: AuthCredentials,
): Promise<AuthResponse> => {
  const res = await apiClient.post("/auth/login", credentials);
  return mapBackendAuth(res.data);
};

/**
 * POST /api/auth/register
 * Backend trả: { success, message, data: { user, accessToken, refreshToken } }
 */
export const register = async (
  payload: RegisterPayload,
): Promise<AuthResponse> => {
  // Map RegisterPayload → backend expects { name, email, password, studentId }
  const body = {
    name: payload.fullName,
    email: payload.email,
    password: payload.password,
    studentId: payload.studentId,
    faculty: payload.faculty,
  };
  const res = await apiClient.post("/auth/register", body);
  return mapBackendAuth(res.data);
};

/**
 * GET /api/auth/me — lấy user đang đăng nhập từ token
 * Backend trả: { success, data: { user } }
 */
export const getCurrentUser = async (): Promise<User> => {
  const res = await apiClient.get("/auth/me");
  return mapBackendUser(res.data);
};

/**
 * PUT /api/auth/me — cập nhật profile
 */
export const updateProfile = async (
  data: Partial<Pick<User, "fullName" | "studentId" | "avatarUrl">>,
): Promise<User> => {
  const body: any = {};
  if (data.fullName !== undefined) body.name = data.fullName;
  if (data.studentId !== undefined) body.studentId = data.studentId;
  if (data.avatarUrl !== undefined) body.avatar = data.avatarUrl;
  const res = await apiClient.put("/auth/me", body);
  return mapBackendUser(res.data);
};

/**
 * PUT /api/auth/change-password
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  await apiClient.put("/auth/change-password", {
    currentPassword,
    newPassword,
  });
};

/**
 * POST /api/auth/logout
 */
export const logout = async (): Promise<void> => {
  await apiClient.post("/auth/logout");
};

// ─── Events ───────────────────────────────────────────────────────────────────

export const getEvents = async (params?: {
  category?: string;
  status?: string;
}): Promise<Event[]> => {
  const res = await apiClient.get("/events", { params });
  return unwrapList<Event>(res.data);
};

export const getEventById = async (id: string): Promise<Event> => {
  const res = await apiClient.get(`/events/${id}`);
  return unwrapOne<Event>(res.data);
};

// ─── Registrations ────────────────────────────────────────────────────────────

export const getRegistrationsByUser = async (
  userId: string,
): Promise<Registration[]> => {
  const res = await apiClient.get("/registrations", { params: { userId } });
  return unwrapList<Registration>(res.data);
};

export const getRegistrationsByEvent = async (
  eventId: string,
): Promise<Registration[]> => {
  const res = await apiClient.get("/registrations", { params: { eventId } });
  return unwrapList<Registration>(res.data);
};

export const registerEvent = async (
  data: CreateRegistrationPayload,
): Promise<Registration> => {
  const res = await apiClient.post("/registrations", data);
  return unwrapOne<Registration>(res.data);
};

export const checkIn = async (
  registrationId: string,
): Promise<Registration> => {
  const res = await apiClient.patch(`/registrations/${registrationId}`, {
    status: "checked_in",
    checkInTime: new Date().toISOString(),
  });
  return unwrapOne<Registration>(res.data);
};

export const qrCheckIn = async (payload: {
  eventId: string;
  userId?: string;
  studentId?: string;
}): Promise<any> => {
  const res = await apiClient.post("/registrations/check-in", payload);
  return res.data;
};

export const cancelRegistration = async (
  registrationId: string,
): Promise<Registration> => {
  const res = await apiClient.patch(`/registrations/${registrationId}`, {
    status: "cancelled",
  });
  return unwrapOne<Registration>(res.data);
};

// ─── Feedbacks ────────────────────────────────────────────────────────────────

export const getFeedbacksByEvent = async (
  eventId: string,
): Promise<Feedback[]> => {
  const res = await apiClient.get("/feedbacks", { params: { eventId } });
  return unwrapList<Feedback>(res.data);
};

export const createFeedback = async (
  data: CreateFeedbackPayload,
): Promise<Feedback> => {
  const res = await apiClient.post("/feedbacks", data);
  return unwrapOne<Feedback>(res.data);
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const getNotificationsByUser = async (
  userId: string,
): Promise<Notification[]> => {
  const res = await apiClient.get("/notifications", { params: { userId } });
  return unwrapList<Notification>(res.data);
};

export const markNotificationAsRead = async (
  notificationId: string,
): Promise<Notification> => {
  const res = await apiClient.patch(`/notifications/${notificationId}`, {
    isRead: true,
  });
  return unwrapOne<Notification>(res.data);
};

// ─── Users (legacy — dùng nếu cần admin) ─────────────────────────────────────

export const getUsers = async (): Promise<User[]> => {
  const res = await apiClient.get("/users");
  return unwrapList<User>(res.data);
};

export const getUserById = async (id: string): Promise<User> => {
  const res = await apiClient.get(`/users/${id}`);
  return unwrapOne<User>(res.data);
};

// ─── Default export (namespace object) ───────────────────────────────────────

export default {
  // Config
  BASE_URL,
  apiClient,
  setBaseUrl,
  setAuthToken,
  // Auth
  login,
  register,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
  // Users
  getUsers,
  getUserById,
  // Events
  getEvents,
  getEventById,
  // Registrations
  getRegistrationsByUser,
  getRegistrationsByEvent,
  registerEvent,
  checkIn,
  qrCheckIn,
  cancelRegistration,
  // Feedbacks
  getFeedbacksByEvent,
  createFeedback,
  // Notifications
  getNotificationsByUser,
  markNotificationAsRead,
};
