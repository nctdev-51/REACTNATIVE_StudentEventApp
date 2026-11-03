import axios, { AxiosInstance } from "axios";
import { eventsData } from "../data/eventsData";
import { Platform } from "react-native";
import Constants from "expo-constants";
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

const debuggerHost = Constants.expoConfig?.hostUri;
const isTunnel = debuggerHost?.includes("ngrok") || debuggerHost?.includes("exp.direct");
const autoDevIp = !isTunnel && debuggerHost ? debuggerHost.split(":")[0] : null;

export const DEV_LAN_IP = autoDevIp || (Platform.OS === "android" ? "10.0.2.2" : "localhost");
export const USE_DEV_LAN_IP = !!autoDevIp;

/**
 * URL Backend Cloud (Deploy Render / Localtunnel):
 * Điền link Cloud vào đây (ví dụ: "https://student-event-server.onrender.com/api")
 */
export const CLOUD_API_URL: string | null = null;

export const BASE_URL: string =
  CLOUD_API_URL ||
  (Platform.OS === "web"
    ? "http://localhost:5000/api"
    : Platform.OS === "android" && !autoDevIp
    ? "http://10.0.2.2:5000/api"
    : autoDevIp
    ? `http://${autoDevIp}:5000/api`
    : "http://localhost:5000/api");

// ─── Axios Instance ───────────────────────────────────────────────────────────

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 3500,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      console.warn("[API] Unauthorized 401 — token có thể đã hết hạn");
    }
    return Promise.reject(error);
  },
);

export const setBaseUrl = (newUrl: string) => {
  apiClient.defaults.baseURL = newUrl;
};

// ─── Response Adapter ─────────────────────────────────────────────────────────

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

// ─── Offline Mock Data Fallbacks ──────────────────────────────────────────────
export const MOCK_ADMIN_USER: User = {
  _id: "66f1a1030000000000000003",
  studentId: "AD01",
  fullName: "Ban Quản Trị Đoàn Hội",
  email: "admin.doan@iuh.edu.vn",
  point: 500,
  role: "admin",
  faculty: "Phòng Công tác sinh viên",
  avatarUrl: "https://i.pravatar.cc/300?img=5",
};

export const MOCK_DEFAULT_USER: User = {
  _id: "66f1a1010000000000000001",
  studentId: "SV01",
  fullName: "Nguyễn Văn A",
  email: "sv01@iuh.edu.vn",
  point: 120,
  role: "student",
  faculty: "Khoa Công nghệ thông tin",
  avatarUrl: "https://i.pravatar.cc/300?img=12",
};

let inMemoryEvents = [...eventsData];
let inMemoryRegistrations: Registration[] = [
  {
    _id: "reg_001",
    eventId: "66f1e2010000000000000001",
    userId: "66f1a1010000000000000001",
    participantRole: "attendee",
    status: "checked_in",
    checkInTime: "2026-09-15T08:05:00.000Z",
    createdAt: "2026-09-10T08:00:00.000Z",
    checkInLocation: { latitude: 10.8221, longitude: 106.6876 },
  },
  {
    _id: "reg_002",
    eventId: "66f1e2020000000000000002",
    userId: "66f1a1020000000000000002",
    participantRole: "attendee",
    status: "checked_in",
    checkInTime: "2026-09-20T08:10:00.000Z",
    createdAt: "2026-09-12T09:30:00.000Z",
    checkInLocation: { latitude: 10.8225, longitude: 106.6880 },
  },
];

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const login = async (
  credentials: AuthCredentials,
): Promise<AuthResponse> => {
  try {
    const res = await apiClient.post("/auth/login", credentials);
    return mapBackendAuth(res.data);
  } catch (err: any) {
    // Tự động kích hoạt Offline Fallback khi không thấy server để app luôn chạy mượt mà
    if (err?.code === "ERR_NETWORK" || !err?.response) {
      console.warn("[API] Offline Login Fallback Mode (Server không phản hồi)");
      const email = credentials.email?.toLowerCase().trim();

      if (email.includes("admin")) {
        return {
          token: "offline-mock-admin-token",
          user: MOCK_ADMIN_USER,
        };
      }

      if (email === "sv02@iuh.edu.vn") {
        return {
          token: "offline-mock-student-token-2",
          user: {
            _id: "66f1a1020000000000000002",
            studentId: "SV02",
            fullName: "Trần Thị Bích",
            email: "sv02@iuh.edu.vn",
            point: 85,
            role: "student",
            faculty: "Khoa Kinh tế",
            avatarUrl: "https://i.pravatar.cc/300?img=47",
          },
        };
      }

      return {
        token: "offline-mock-student-token",
        user: MOCK_DEFAULT_USER,
      };
    }
    throw err;
  }
};

export const register = async (
  payload: RegisterPayload,
): Promise<AuthResponse> => {
  try {
    const body = {
      name: payload.fullName,
      email: payload.email,
      password: payload.password,
      studentId: payload.studentId,
      faculty: payload.faculty,
    };
    const res = await apiClient.post("/auth/register", body);
    return mapBackendAuth(res.data);
  } catch (err: any) {
    if (err?.code === "ERR_NETWORK" || !err?.response) {
      const newUser: User = {
        _id: "user_" + Date.now(),
        studentId: payload.studentId,
        fullName: payload.fullName,
        email: payload.email,
        point: 0,
        role: "student",
        faculty: payload.faculty,
      };
      return { token: "offline-token-" + Date.now(), user: newUser };
    }
    throw err;
  }
};

export const getCurrentUser = async (): Promise<User> => {
  try {
    const res = await apiClient.get("/auth/me");
    return mapBackendUser(res.data);
  } catch (err: any) {
    if (err?.code === "ERR_NETWORK" || !err?.response) {
      return MOCK_DEFAULT_USER;
    }
    throw err;
  }
};

export const updateProfile = async (
  data: Partial<Pick<User, "fullName" | "studentId" | "avatarUrl">>,
): Promise<User> => {
  const body: any = {};
  if (data.fullName !== undefined) body.name = data.fullName;
  if (data.studentId !== undefined) body.studentId = data.studentId;
  if (data.avatarUrl !== undefined) body.avatar = data.avatarUrl;
  try {
    const res = await apiClient.put("/auth/me", body);
    return mapBackendUser(res.data);
  } catch (err: any) {
    if (err?.code === "ERR_NETWORK" || !err?.response) {
      return { ...MOCK_DEFAULT_USER, ...data };
    }
    throw err;
  }
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  try {
    await apiClient.put("/auth/change-password", {
      currentPassword,
      newPassword,
    });
  } catch (e) {
    // offline pass
  }
};

export const logout = async (): Promise<void> => {
  try {
    await apiClient.post("/auth/logout");
  } catch (e) {
    // offline pass
  }
};

// ─── Events ───────────────────────────────────────────────────────────────────

export const getEvents = async (params?: {
  category?: string;
  status?: string;
}): Promise<Event[]> => {
  try {
    const res = await apiClient.get("/events", { params });
    const list = unwrapList<Event>(res.data);
    if (list.length > 0) return list;
    return inMemoryEvents;
  } catch (err: any) {
    if (err?.code === "ERR_NETWORK" || !err?.response) {
      console.warn("[API] Offline events fallback");
      return inMemoryEvents;
    }
    throw err;
  }
};

export const getEventById = async (id: string): Promise<Event> => {
  try {
    const res = await apiClient.get(`/events/${id}`);
    return unwrapOne<Event>(res.data);
  } catch (err: any) {
    if (err?.code === "ERR_NETWORK" || !err?.response) {
      const found = inMemoryEvents.find((e) => e._id === id || (e as any).id === id);
      if (found) return found;
    }
    throw err;
  }
};

export const updateEventCoordinates = async (
  eventId: string,
  coordinates: { latitude: number; longitude: number },
  locationName?: string
): Promise<Event> => {
  const payload: any = { coordinates };
  if (locationName) payload.location = locationName;

  try {
    const res = await apiClient.patch('/events/' + eventId, payload);
    const updated = unwrapOne<Event>(res.data);
    // Cập nhật bộ nhớ ram
    inMemoryEvents = inMemoryEvents.map((e) =>
      e._id === eventId || (e as any).id === eventId
        ? { ...e, coordinates, ...(locationName ? { location: locationName } : {}) }
        : e
    );
    return updated;
  } catch (err: any) {
    // Cập nhật local in-memory
    inMemoryEvents = inMemoryEvents.map((e) =>
      e._id === eventId || (e as any).id === eventId
        ? { ...e, coordinates, ...(locationName ? { location: locationName } : {}) }
        : e
    );
    const found = inMemoryEvents.find((e) => e._id === eventId || (e as any).id === eventId);
    return found || ({ _id: eventId, title: "Sự kiện", coordinates, location: locationName || "" } as any);
  }
};

export const createEvent = async (eventData: Partial<Event> & { bannerUrl?: string }): Promise<Event> => {
  const newEvent: Event = {
    _id: "evt_" + Date.now(),
    id: "evt_" + Date.now(),
    title: eventData.title || "Sự kiện mới",
    description: eventData.description || "",
    category: eventData.category || "Học thuật",
    location: eventData.location || "Đại học Công nghiệp TP.HCM",
    coordinates: eventData.coordinates || { latitude: 10.8221, longitude: 106.6876 },
    time: eventData.time || {
      start: new Date().toISOString(),
      end: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    },
    organizer: eventData.organizer || "Ban Chấp hành Đoàn trường",
    faculty: eventData.faculty || "Toàn trường",
    images: [
      eventData.bannerUrl ||
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    ],
    trainingPoints: eventData.trainingPoints ?? 5,
    status: (eventData.status as any) || "upcoming",
    aiSummary: {
      what: eventData.title || "Sự kiện trường",
      when: "Theo lịch thông báo",
      where: eventData.location || "Hội trường IUH",
      benefits: `Nhận +${eventData.trainingPoints ?? 5} điểm rèn luyện`,
    },
    qrCode: `EVENTMATE:evt_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  try {
    const res = await apiClient.post("/events", newEvent);
    const saved = unwrapOne<Event>(res.data);
    inMemoryEvents.unshift(saved);
    return saved;
  } catch (e) {
    inMemoryEvents.unshift(newEvent);
    return newEvent;
  }
};

export const deleteEvent = async (eventId: string): Promise<boolean> => {
  try {
    await apiClient.delete(`/events/${eventId}`);
    inMemoryEvents = inMemoryEvents.filter((e) => e._id !== eventId && (e as any).id !== eventId);
    return true;
  } catch (e) {
    inMemoryEvents = inMemoryEvents.filter((e) => e._id !== eventId && (e as any).id !== eventId);
    return true;
  }
};

// ─── Registrations ────────────────────────────────────────────────────────────

export const getAllRegistrations = async (): Promise<Registration[]> => {
  try {
    const res = await apiClient.get("/registrations");
    const list = unwrapList<Registration>(res.data);
    if (list.length > 0) return list;
    return inMemoryRegistrations;
  } catch (e) {
    return inMemoryRegistrations;
  }
};

export const getRegistrationsByUser = async (
  userId: string,
): Promise<Registration[]> => {
  try {
    const res = await apiClient.get("/registrations", { params: { userId } });
    const list = unwrapList<Registration>(res.data);
    if (list.length > 0) return list;
    return inMemoryRegistrations.filter((r) => r.userId === userId);
  } catch (e) {
    return inMemoryRegistrations.filter((r) => r.userId === userId);
  }
};

export const getRegistrationsByEvent = async (
  eventId: string,
): Promise<Registration[]> => {
  try {
    const res = await apiClient.get("/registrations", { params: { eventId } });
    const list = unwrapList<Registration>(res.data);
    if (list.length > 0) return list;
    return inMemoryRegistrations.filter((r) => r.eventId === eventId);
  } catch (e) {
    return inMemoryRegistrations.filter((r) => r.eventId === eventId);
  }
};

export const registerEvent = async (
  data: CreateRegistrationPayload,
): Promise<Registration> => {
  try {
    const res = await apiClient.post("/registrations", data);
    const reg = unwrapOne<Registration>(res.data);
    inMemoryRegistrations.unshift(reg);
    return reg;
  } catch (e) {
    const reg: Registration = {
      _id: "reg_" + Date.now(),
      eventId: data.eventId,
      userId: data.userId,
      participantRole: data.participantRole || "attendee",
      status: "registered",
      checkInTime: null,
      createdAt: new Date().toISOString(),
    };
    inMemoryRegistrations.unshift(reg);
    return reg;
  }
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
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}): Promise<any> => {
  try {
    const res = await apiClient.post("/registrations/check-in", payload);
    return res.data;
  } catch (err: any) {
    if (err?.code === "ERR_NETWORK" || !err?.response) {
      console.warn("[API] Offline QR Check-in Mock Success");
      const newReg: Registration = {
        _id: "reg_" + Date.now(),
        eventId: payload.eventId,
        userId: payload.userId || "user_offline",
        participantRole: "attendee",
        status: "checked_in",
        checkInTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        checkInLocation: payload.userLocation,
      };
      inMemoryRegistrations.unshift(newReg);
      return {
        success: true,
        message: "Điểm danh thành công (Chế độ Offline)",
        data: {
          registration: newReg,
          event: inMemoryEvents.find((e) => e._id === payload.eventId),
        },
      };
    }
    throw err;
  }
};

export const cancelRegistration = async (
  registrationId: string,
): Promise<Registration> => {
  try {
    const res = await apiClient.patch(`/registrations/${registrationId}`, {
      status: "cancelled",
    });
    return unwrapOne<Registration>(res.data);
  } catch (e) {
    const existing = inMemoryRegistrations.find((r) => r._id === registrationId);
    if (existing) {
      existing.status = "cancelled";
      return existing;
    }
    return {
      _id: registrationId,
      eventId: "",
      userId: "",
      participantRole: "attendee",
      status: "cancelled",
      checkInTime: null,
    };
  }
};

// ─── Feedbacks ────────────────────────────────────────────────────────────────

export const getFeedbacksByEvent = async (
  eventId: string,
): Promise<Feedback[]> => {
  try {
    const res = await apiClient.get("/feedbacks", { params: { eventId } });
    return unwrapList<Feedback>(res.data);
  } catch (e) {
    return [];
  }
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
  try {
    const res = await apiClient.get("/notifications", { params: { userId } });
    return unwrapList<Notification>(res.data);
  } catch (e) {
    return [];
  }
};

export const markNotificationAsRead = async (
  notificationId: string,
): Promise<Notification> => {
  const res = await apiClient.patch(`/notifications/${notificationId}`, {
    isRead: true,
  });
  return unwrapOne<Notification>(res.data);
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const getUsers = async (): Promise<User[]> => {
  try {
    const res = await apiClient.get("/users");
    return unwrapList<User>(res.data);
  } catch (e) {
    return [MOCK_DEFAULT_USER, MOCK_ADMIN_USER];
  }
};

export const getUserById = async (id: string): Promise<User> => {
  const res = await apiClient.get(`/users/${id}`);
  return mapBackendUser(res.data);
};

// ─── Default Export ───────────────────────────────────────────────────────────

export default {
  login,
  register,
  getCurrentUser,
  updateProfile,
  changePassword,
  logout,
  getEvents,
  getEventById,
  updateEventCoordinates,
  createEvent,
  deleteEvent,
  getAllRegistrations,
  getRegistrationsByUser,
  getRegistrationsByEvent,
  registerEvent,
  checkIn,
  qrCheckIn,
  cancelRegistration,
  getFeedbacksByEvent,
  createFeedback,
  getNotificationsByUser,
  markNotificationAsRead,
  getUsers,
  getUserById,
  setAuthToken,
  setBaseUrl,
};
