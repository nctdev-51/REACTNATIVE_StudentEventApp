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
  CreateUserPayload,
  UpdateUserPayload,
} from "../types";
import { AISummary } from "../types/event";
import { mergeRegistrations } from '../utils/registrations';

// ─── Base URL ─────────────────────────────────────────────────────────────────

<<<<<<< HEAD
<<<<<<< HEAD
const debuggerHost = Constants.expoConfig?.hostUri;
=======
// `hostUri` is supplied by Expo Go only while developing.  In an Expo tunnel
// it names the Metro tunnel, not this API, so it must never be used as an API
// host.  SDK 58 also exposes it through expoGoConfig on some Expo Go builds.
const expoConstants = Constants as typeof Constants & {
  expoGoConfig?: { debuggerHost?: string } | null;
};
const debuggerHost =
  Constants.expoConfig?.hostUri ?? expoConstants.expoGoConfig?.debuggerHost;
>>>>>>> d3ca778 (Tata)
const isTunnel =
  debuggerHost?.includes("ngrok") || debuggerHost?.includes("exp.direct");
const autoDevIp = !isTunnel && debuggerHost ? debuggerHost.split(":")[0] : null;

export const DEV_LAN_IP =
  autoDevIp || (Platform.OS === "android" ? "192.168.1.3" : "localhost");
export const USE_DEV_LAN_IP = !!autoDevIp;

/**
 * Optional deployed API URL. Never hard-code a temporary Localtunnel address:
 * tunnels expire and surface as 503 errors for every app user. Expo inlines
 * EXPO_PUBLIC_* values from .env files at build time.
 */
const rawCloudUrl = process.env.EXPO_PUBLIC_API_URL?.trim()?.replace(/\/+$/, "");
export const CLOUD_API_URL =
  rawCloudUrl && (rawCloudUrl.startsWith("http://") || rawCloudUrl.startsWith("https://"))
    ? (rawCloudUrl.endsWith("/api") ? rawCloudUrl : `${rawCloudUrl}/api`)
    : null;

if (typeof __DEV__ !== "undefined" && __DEV__ && rawCloudUrl && !CLOUD_API_URL) {
  console.warn(
    "[API] Bỏ qua EXPO_PUBLIC_API_URL vì giá trị này không phải http(s) URL.",
  );
}

/**
 * ⚡ CHẾ ĐỘ THỬ NGHIỆM ĐỘC LẬP (KHÔNG CẦN BACKEND):
 * - Nếu = true: Ứng dụng chạy 100% bằng dữ liệu In-Memory ngay trên điện thoại (Expo Go).
 *   Không cần mở server backend, không cần deploy, phản hồi 0ms không bao giờ lỗi Network.
 * - Nếu = false: Ứng dụng gọi API thật qua Cloud URL / Tunnel hoặc LAN IP máy tính.
 *   (Khi server offline, app vẫn tự động fallback an toàn về dữ liệu mock).
 */
export const USE_STANDALONE_MOCK: boolean =
  process.env.EXPO_PUBLIC_USE_STANDALONE_MOCK === "true";

// `10.0.2.2` only reaches the host from an Android emulator.  A physical
// phone connected to Expo through a tunnel cannot reach it; force the existing
// in-memory fallbacks immediately instead of making every action wait 10s and
// surfacing a misleading Network Error.
const shouldUseOfflineFallback =
  USE_STANDALONE_MOCK || (isTunnel && !CLOUD_API_URL);

export const BASE_URL: string =
  CLOUD_API_URL ||
  (Platform.OS === "web"
    ? "http://localhost:5000/api"
    : Platform.OS === "android" && !autoDevIp
      ? "http://10.0.2.2:5000/api"
      : autoDevIp
        ? `http://${autoDevIp}:5000/api`
        : "http://localhost:5000/api");
=======
/**
 * Cấu hình BASE_URL trỏ đến backend Express (port 5000):
 * - Android Emulator: 10.0.2.2 → localhost máy host
 * - iOS / Web: localhost
 * - Thiết bị thật: đổi DEV_LAN_IP thành IP LAN của máy tính
 */
<<<<<<< HEAD
export const DEV_LAN_IP = "172.20.10.2";
=======
export const DEV_LAN_IP = "192.168.1.15";
>>>>>>> b65f9f5 (feat: update event management app)

export const BASE_URL: string = Platform.select({
  android: `http://172.20.10.2:3000/api`,
  ios: `http://localhost:3000/api`,
  default: `http://localhost:3000/api`,
});
>>>>>>> 8d9ed42 (Update Event)

// ─── Axios Instance ───────────────────────────────────────────────────────────

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
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
  if (__DEV__) {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  }
  if (shouldUseOfflineFallback) {
    const err: any = new Error("OFFLINE_FALLBACK_ACTIVE");
    err.code = "ERR_NETWORK";
    return Promise.reject(err);
  }
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
  point: 38,
  role: "student",
  faculty: "Khoa Công nghệ thông tin",
  avatarUrl: "https://i.pravatar.cc/300?img=12",
};

export const MOCK_STUDENT_2: User = {
  _id: "66f1a1020000000000000002",
  studentId: "SV02",
  fullName: "Trần Thị Bích",
  email: "sv02@iuh.edu.vn",
  point: 85,
  role: "student",
  faculty: "Khoa Quản trị kinh doanh",
  status: "active",
  avatarUrl: "https://i.pravatar.cc/300?img=47",
};

export const MOCK_STUDENT_3: User = {
  _id: "66f1a1040000000000000004",
  studentId: "SV03",
  fullName: "Lê Hoàng Nam",
  email: "sv03@iuh.edu.vn",
  point: 95,
  role: "student",
  faculty: "Khoa Công nghệ thông tin",
  status: "active",
  avatarUrl: "https://i.pravatar.cc/300?img=15",
};

export const MOCK_STUDENT_4: User = {
  _id: "66f1a1050000000000000005",
  studentId: "SV04",
  fullName: "Phạm Minh Khoa",
  email: "sv04@iuh.edu.vn",
  point: 40,
  role: "student",
  faculty: "Khoa Điện - Điện tử",
  status: "inactive",
  avatarUrl: "https://i.pravatar.cc/300?img=33",
};

export let inMemoryUsers: User[] = [
  MOCK_ADMIN_USER,
  MOCK_DEFAULT_USER,
  MOCK_STUDENT_2,
  MOCK_STUDENT_3,
  MOCK_STUDENT_4,
];

let inMemoryEvents = [...eventsData];
// Only successful QR responses are overlaid on a stale server response. Keep
// these separate from seeded demo registrations and scope them to the user.
let confirmedQrCheckIns: Registration[] = [];

function rememberQrCheckIn(payload: { eventId: string; userId?: string }, response: any) {
  if (!response?.success || !payload.userId) return response;
  const registration = response.data?.registration;
  confirmedQrCheckIns = mergeRegistrations([...confirmedQrCheckIns, {
    ...registration,
    _id: registration?._id || registration?.id || `qr_${payload.userId}_${payload.eventId}`,
    eventId: payload.eventId,
    userId: payload.userId,
    participantRole: registration?.participantRole || 'attendee',
    status: 'checked_in',
    checkInTime: registration?.checkInTime || new Date().toISOString(),
  }], inMemoryEvents);
  return response;
}
let inMemoryRegistrations: Registration[] = [
  {
    _id: "66f1b3010000000000000001",
    eventId: "66f1e2010000000000000001",
    userId: "66f1a1010000000000000001",
    participantRole: "attendee",
    status: "checked_in",
    qrCode: "EVENTMATE:66f1b3010000000000000001",
    checkInTime: "2026-10-15T08:30:00.000Z",
    createdAt: "2026-09-20T10:00:00.000Z",
  },
  {
    _id: "66f1b3020000000000000002",
    eventId: "66f1e2020000000000000002",
    userId: "66f1a1010000000000000001",
    participantRole: "volunteer",
    status: "checked_in",
    qrCode: "EVENTMATE:66f1b3020000000000000002",
    checkInTime: "2026-09-25T13:45:00.000Z",
    createdAt: "2026-09-20T11:00:00.000Z",
  },
  {
    _id: "66f1b3030000000000000003",
    eventId: "66f1e2040000000000000004",
    userId: "66f1a1010000000000000001",
    participantRole: "attendee",
    status: "completed",
    qrCode: "EVENTMATE:66f1b3030000000000000003",
    checkInTime: "2026-08-10T08:15:30.000Z",
    checkOutTime: "2026-08-20T16:55:00.000Z",
    createdAt: "2026-08-01T09:30:00.000Z",
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
    const isNetworkError =
      err?.code === "ERR_NETWORK" ||
      err?.code === "ECONNABORTED" ||
      !err?.response;

    // Nếu không phải lỗi mạng (ví dụ mật khẩu sai do server trả về 401), ném lỗi thực tế
    if (!USE_STANDALONE_MOCK && !isNetworkError) throw err;

    // Fallback tài khoản demo khi server offline / mạng chưa thông để không bao giờ bị chặn
    const email = credentials.email?.toLowerCase().trim();
    const password = credentials.password;
    if (email === "admin.doan@iuh.edu.vn" && password === "admin123") {
      return { token: "offline-mock-admin-token", user: MOCK_ADMIN_USER };
    }
    if (email === "sv02@iuh.edu.vn" && password === "123456") {
      return { token: "offline-mock-student-token-2", user: MOCK_STUDENT_2 };
    }
    if (email === "sv01@iuh.edu.vn" && password === "123456") {
      return { token: "offline-mock-student-token", user: MOCK_DEFAULT_USER };
    }

    throw new Error("Email hoặc mật khẩu không đúng.");
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
    const isNetworkError =
      err?.code === "ERR_NETWORK" ||
      err?.code === "ECONNABORTED" ||
      !err?.response;

    if (USE_STANDALONE_MOCK || isNetworkError) {
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
    if (USE_STANDALONE_MOCK) {
      return MOCK_DEFAULT_USER;
    }
    throw err;
  }
};

export const updateProfile = async (
  data: Partial<
    Pick<User, "fullName" | "studentId" | "avatarUrl" | "phone" | "faculty">
  >,
): Promise<User> => {
  const body: any = {};
  if (data.fullName !== undefined) body.name = data.fullName;
  if (data.studentId !== undefined) body.studentId = data.studentId;
  if (data.avatarUrl !== undefined) body.avatar = data.avatarUrl;
  if (data.phone !== undefined) body.phone = data.phone;
  if (data.faculty !== undefined) body.faculty = data.faculty;
  try {
    const res = await apiClient.put("/auth/me", body);
    return mapBackendUser(res.data);
  } catch (err: any) {
    if (USE_STANDALONE_MOCK) {
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
    const status = err?.response?.status;
    if (
      err?.code === "ERR_NETWORK" ||
      err?.code === "ECONNABORTED" ||
      !err?.response ||
      status === 404 ||
      (status && status >= 500)
    ) {
      console.warn(
        "[API] Events fallback (server offline/lỗi):",
        err?.code ?? status,
      );
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
    const status = err?.response?.status;
    if (
      err?.code === "ERR_NETWORK" ||
      err?.code === "ERR_INVALID_URL" ||
      !err?.response ||
      status === 404 ||
      (status && status >= 500)
    ) {
      const found = inMemoryEvents.find(
        (e) => e._id === id || (e as any).id === id,
      );
      if (found) return found;
    }
    throw err;
  }
};

export const updateEventCoordinates = async (
  eventId: string,
  coordinates: { latitude: number; longitude: number },
  locationName?: string,
): Promise<Event> => {
  const payload: any = { coordinates };
  if (locationName) payload.location = locationName;

  try {
    const res = await apiClient.patch("/events/" + eventId, payload);
    const updated = unwrapOne<Event>(res.data);
    // Cập nhật bộ nhớ ram
    inMemoryEvents = inMemoryEvents.map((e) =>
      e._id === eventId || (e as any).id === eventId
        ? {
            ...e,
            coordinates,
            ...(locationName ? { location: locationName } : {}),
          }
        : e,
    );
    return updated;
  } catch (err: any) {
    // Cập nhật local in-memory
    inMemoryEvents = inMemoryEvents.map((e) =>
      e._id === eventId || (e as any).id === eventId
        ? {
            ...e,
            coordinates,
            ...(locationName ? { location: locationName } : {}),
          }
        : e,
    );
    const found = inMemoryEvents.find(
      (e) => e._id === eventId || (e as any).id === eventId,
    );
    return (
      found ||
      ({
        _id: eventId,
        title: "Sự kiện",
        coordinates,
        location: locationName || "",
      } as any)
    );
  }
};

export const createEvent = async (
  eventData: Partial<Event> & { bannerUrl?: string },
): Promise<Event> => {
  const newEvent: Event = {
    _id: "evt_" + Date.now(),
    id: "evt_" + Date.now(),
    title: eventData.title || "Sự kiện mới",
    description: eventData.description || "",
    category: eventData.category || "Học thuật",
    location: eventData.location || "Đại học Công nghiệp TP.HCM",
    coordinates: eventData.coordinates || {
      latitude: 10.8221,
      longitude: 106.6876,
    },
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
    maxSlots: Number(eventData.maxSlots) || 100,
    waitlistSlots: Number(eventData.waitlistSlots) || 20,
    semesterId: eventData.semesterId,
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
    // MongoDB owns `_id`. The client-only `evt_...` identifier is useful for
    // standalone mock mode but is not a valid ObjectId for Express/Mongoose.
    const { _id: _localId, id: _localAlias, createdAt: _localCreatedAt, ...eventPayload } = newEvent;
    const res = await apiClient.post("/events", eventPayload);
    const saved = unwrapOne<Event>(res.data);
    inMemoryEvents.unshift(saved);
    return saved;
  } catch (error) {
    // Admin must never see a false success for a publish action.  A local-only
    // event cannot be discovered by another account and would make the admin
    // and student lists disagree.  The explicit demo switch remains available.
    if (!USE_STANDALONE_MOCK) throw error;
    inMemoryEvents.unshift(newEvent);
    return newEvent;
  }
};

export const deleteEvent = async (eventId: string): Promise<boolean> => {
  try {
    await apiClient.delete(`/events/${eventId}`);
    inMemoryEvents = inMemoryEvents.filter(
      (e) => e._id !== eventId && (e as any).id !== eventId,
    );
    return true;
  } catch (e) {
    inMemoryEvents = inMemoryEvents.filter(
      (e) => e._id !== eventId && (e as any).id !== eventId,
    );
    return true;
  }
};

/**
 * Ẩn hoặc hiện sự kiện (dành cho Admin)
 */
export const toggleHideEvent = async (
  eventId: string,
  currentHidden: boolean,
): Promise<boolean> => {
  const newHidden = !currentHidden;
  try {
    await apiClient.patch(`/events/${eventId}`, { isHidden: newHidden });
    inMemoryEvents = inMemoryEvents.map((e) =>
      e._id === eventId || (e as any).id === eventId
        ? { ...e, isHidden: newHidden }
        : e,
    );
    return newHidden;
  } catch (e) {
    inMemoryEvents = inMemoryEvents.map((e) =>
      e._id === eventId || (e as any).id === eventId
        ? { ...e, isHidden: newHidden }
        : e,
    );
    return newHidden;
  }
};

/**
 * Kiểm tra xem sự kiện đã diễn ra trong quá khứ / hết hạn chưa
 */
export const isEventPast = (event?: Event | null): boolean => {
  if (!event) return false;
  if (event.status === "completed" || (event.status as any) === "past")
    return true;
  const now = new Date();
  const endTime = event.time?.end
    ? new Date(event.time.end)
    : event.time?.start
      ? new Date(event.time.start)
      : null;
  if (
    endTime &&
    !isNaN(endTime.getTime()) &&
    endTime.getTime() < now.getTime()
  ) {
    return true;
  }
  return false;
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
  const mergeCheckIns = (list: Registration[]) => mergeRegistrations([
    ...list,
    ...confirmedQrCheckIns.filter(r => r.userId === userId),
  ], inMemoryEvents);
  try {
    const res = await apiClient.get("/registrations", { params: { userId } });
    const list = unwrapList<Registration>(res.data);
    if (list.length > 0) return mergeCheckIns(list);
    return mergeCheckIns(inMemoryRegistrations.filter((r) => r.userId === userId));
  } catch (e) {
    return mergeCheckIns(inMemoryRegistrations.filter((r) => r.userId === userId));
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
  const isExistingRegistration = (registration: Registration) => {
    const registrationEventId =
      typeof registration.eventId === "object" && registration.eventId !== null
        ? (registration.eventId as { _id?: string; id?: string })._id ??
          (registration.eventId as { id?: string }).id
        : registration.eventId;
    return (
      registrationEventId === data.eventId &&
      registration.userId === data.userId &&
      registration.status !== "cancelled"
    );
  };

  try {
    const registrations = await getRegistrationsByUser(data.userId);
    if (registrations.some(isExistingRegistration)) {
      throw new Error("Bạn đã đăng ký hoặc check-in sự kiện này rồi.");
    }
    const res = await apiClient.post("/registrations", data);
    const reg = unwrapOne<Registration>(res.data);
    inMemoryRegistrations.unshift(reg);
    return reg;
  } catch (e: any) {
    // Do not turn an intentional duplicate-registration error into an offline
    // success. Only transport failures use the in-memory fallback.
    if (e?.response || e?.message?.includes("đăng ký") || e?.message?.includes("check-in")) {
      throw e;
    }
    if (inMemoryRegistrations.some(isExistingRegistration)) {
      throw new Error("Bạn đã đăng ký hoặc check-in sự kiện này rồi.");
    }
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

export interface DynamicQrTokenResponse {
  eventId: string;
  eventTitle: string;
  token: string;
  expiresAt: number;
  ttlSeconds: number;
  schemeUrl: string;
  universalUrl: string;
  qrPayload: string;
}

export const getEventQrToken = async (
  eventId: string
): Promise<DynamicQrTokenResponse> => {
  try {
    const res = await apiClient.get(`/events/${eventId}/qr-token`);
    if (res.data?.data) return res.data.data;
    if (res.data?.token) return res.data;
  } catch (err) {
    console.warn('[API] getEventQrToken offline fallback:', err);
  }

  // Offline fallback token
  const now = Math.floor(Date.now() / 1000);
  const ttl = 45;
  const mockToken = `mock_jwt_${eventId}_${now}`;
  return {
    eventId,
    eventTitle: 'Sự kiện sinh viên',
    token: mockToken,
    expiresAt: now + ttl,
    ttlSeconds: ttl,
    schemeUrl: `studentevent://checkin?eventId=${eventId}&token=${mockToken}&exp=${now + ttl}`,
    universalUrl: `https://studentevent.iuh.edu.vn/checkin?eventId=${eventId}&token=${mockToken}&exp=${now + ttl}`,
    qrPayload: `studentevent://checkin?eventId=${eventId}&token=${mockToken}&exp=${now + ttl}`,
  };
};

export const qrCheckIn = async (payload: {
  eventId: string;
  userId?: string;
  studentId?: string;
  token?: string;
  method?: 'qr_scan' | 'passcode' | 'dynamic_qr';
  passcode?: string;
  userLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    isMockLocation?: boolean;
    mocked?: boolean;
  };
}): Promise<any> => {
  try {
    const res = await apiClient.post("/registrations/check-in", payload);
    return rememberQrCheckIn(payload, res.data);
  } catch (err: any) {
    if (err?.code === "ERR_NETWORK" || !err?.response) {
      console.warn("[API] Offline QR Check-in Mock Mode");

      const matchedEvent = inMemoryEvents.find(
        (e) => e._id === payload.eventId || (e as any).id === payload.eventId,
      );

      // Nếu không tìm thấy sự kiện khớp
      if (!matchedEvent) {
        return {
          success: false,
          message:
            "Mã QR không hợp lệ hoặc sự kiện không tồn tại trên hệ thống.",
        };
      }

      // Kiểm tra Anti-Fake GPS trong chế độ Offline
      if (
        matchedEvent.coordinates &&
        matchedEvent.coordinates.latitude &&
        matchedEvent.coordinates.longitude
      ) {
        if (
          !payload.userLocation ||
          payload.userLocation.latitude === undefined
        ) {
          return {
            success: false,
            message:
              "Sự kiện yêu cầu xác thực vị trí (GPS) để chống check-in giả mạo. Vui lòng cấp quyền vị trí.",
          };
        }

        const R = 6371000;
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const dLat = toRad(
          matchedEvent.coordinates.latitude - payload.userLocation.latitude,
        );
        const dLon = toRad(
          matchedEvent.coordinates.longitude - payload.userLocation.longitude,
        );
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(payload.userLocation.latitude)) *
            Math.cos(toRad(matchedEvent.coordinates.latitude)) *
            Math.sin(dLon / 2) ** 2;
        const dist = Math.round(
          R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
        );

        if (dist > 500) {
          const distStr =
            dist < 1000 ? dist + "m" : (dist / 1000).toFixed(1) + "km";
          return {
            success: false,
            message: `Vị trí không hợp lệ! Bạn đang cách địa điểm sự kiện ${distStr} (vượt quá bán kính cho phép 500m). Vui lòng có mặt tại địa điểm để điểm danh.`,
            distanceMeters: dist,
          };
        }
      }

      // Kiểm tra xem sinh viên đã đăng ký sự kiện này chưa
      const targetUserId = payload.userId || MOCK_DEFAULT_USER._id;
      const existingReg = inMemoryRegistrations.find(
        (r) =>
          r.eventId === payload.eventId &&
          (r.userId === targetUserId || r.userId === payload.userId)
      );

      if (!existingReg) {
        if (payload.userId === "student1") {
          const newReg: Registration = {
            _id: "reg_" + Date.now(),
            eventId: payload.eventId,
            userId: payload.userId,
            participantRole: "attendee",
            status: "checked_in",
            checkInTime: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            checkInLocation: payload.userLocation,
          };
          inMemoryRegistrations.unshift(newReg);
          return rememberQrCheckIn(payload, {
            success: true,
            message: "Điểm danh thành công! Vị trí toạ độ GPS hợp lệ.",
            data: {
              registration: newReg,
              event: matchedEvent,
            },
          });
        }

        return {
          success: false,
          notRegistered: true,
          message: "Bạn chưa đăng ký tham gia sự kiện này! Vui lòng đăng ký trước khi điểm danh.",
        };
      }

      if (existingReg.status === "waitlist") {
        return {
          success: false,
          isWaitlist: true,
          message: "Bạn đang ở trong Danh sách chờ (Waitlist). Chỉ sinh viên trong danh sách chính thức mới được phép điểm danh.",
        };
      }

      if (existingReg.status === "cancelled") {
        return {
          success: false,
          isCancelled: true,
          message: "Bạn đã hủy đăng ký sự kiện này. Không thể điểm danh.",
        };
      }

      if (existingReg.status === "checked_in") {
        return rememberQrCheckIn(payload, {
          success: true,
          alreadyCheckedIn: true,
          message: "Sinh viên đã điểm danh sự kiện này trước đó.",
          data: {
            registration: existingReg,
            event: matchedEvent,
          },
        });
      }

      const updatedReg: Registration = {
        ...existingReg,
        status: "checked_in",
        checkInTime: new Date().toISOString(),
        checkInLocation: payload.userLocation,
      };

      inMemoryRegistrations = inMemoryRegistrations.map((r) =>
        r._id === existingReg._id ? updatedReg : r
      );

      return rememberQrCheckIn(payload, {
        success: true,
        message: "Điểm danh thành công! Vị trí toạ độ GPS hợp lệ.",
        data: {
          registration: updatedReg,
          event: matchedEvent,
        },
      });
    }
    throw err;
  }
};

export const adminManualCheckIn = async (payload: {
  eventId: string;
  studentIdOrEmail: string;
  note?: string;
}): Promise<{
  success: boolean;
  message: string;
  registration?: Registration;
}> => {
  const cleanId = payload.studentIdOrEmail.trim().toLowerCase();

  let allUsers: User[] = [MOCK_DEFAULT_USER, MOCK_ADMIN_USER];
  try {
    const fetched = await getUsers();
    if (fetched && fetched.length > 0) allUsers = fetched;
  } catch (e) {}

  const targetUser = allUsers.find(
    (u) =>
      u.studentId?.toLowerCase() === cleanId ||
      u.email?.toLowerCase() === cleanId ||
      u.fullName?.toLowerCase().includes(cleanId),
  ) || {
    _id: "user_" + Date.now(),
    studentId: payload.studentIdOrEmail.toUpperCase(),
    fullName: `Sinh viên ${payload.studentIdOrEmail.toUpperCase()}`,
    email: `${cleanId}@iuh.edu.vn`,
    point: 100,
    role: "student" as const,
    faculty: "Khoa Công nghệ thông tin",
  };

  const existingRegistration = (await getRegistrationsByUser(targetUser._id)).find(
    (registration) => {
      const registrationEventId =
        typeof registration.eventId === "object" && registration.eventId !== null
          ? (registration.eventId as { _id?: string; id?: string })._id ??
            (registration.eventId as { id?: string }).id
          : registration.eventId;
      return registrationEventId === payload.eventId && registration.status !== "cancelled";
    },
  );

  if (existingRegistration?.status === "checked_in") {
    return {
      success: false,
      message: `${targetUser.fullName} đã check-in sự kiện này trước đó.`,
      registration: existingRegistration,
    };
  }

  // A registered student is promoted to checked-in rather than receiving a
  // second registration record.
  if (existingRegistration) {
    const checkedInAt = new Date().toISOString();
    const updated = {
      ...existingRegistration,
      status: "checked_in" as const,
      checkInTime: checkedInAt,
      checkInMethod: "admin_manual" as const,
      note: payload.note || "Admin xác nhận tham dự thủ công tại hội trường",
    };
    const registrationId = (existingRegistration as { id?: string }).id || existingRegistration._id;
    try {
      await apiClient.patch(`/registrations/${registrationId}`, updated);
    } catch (error: any) {
      if (error?.response) throw error;
    }
    inMemoryRegistrations = inMemoryRegistrations.map((registration) =>
      registration._id === existingRegistration._id ? updated : registration,
    );
    return {
      success: true,
      message: `Đã xác nhận điểm danh bù cho ${targetUser.fullName} (${targetUser.studentId}).`,
      registration: updated,
    };
  }

  const newReg: Registration = {
    _id: "reg_manual_" + Date.now(),
    eventId: payload.eventId,
    userId: targetUser._id,
    participantRole: "attendee",
    status: "checked_in",
    checkInTime: new Date().toISOString(),
    checkInMethod: "admin_manual",
    note: payload.note || "Admin xác nhận tham dự thủ công tại hội trường",
    createdAt: new Date().toISOString(),
  };

  try {
    await apiClient.post("/registrations", newReg);
  } catch (error: any) {
    if (error?.response) throw error;
  }
  inMemoryRegistrations.unshift(newReg);

  return {
    success: true,
    message: `Đã điểm danh bù thành công cho ${targetUser.fullName} (${targetUser.studentId})!`,
    registration: newReg,
  };
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
    const existing = inMemoryRegistrations.find(
      (r) => r._id === registrationId,
    );
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

export const updateEventQuota = async (
  eventId: string,
  maxSlots: number,
  waitlistSlots: number,
): Promise<{ success: boolean; message: string; data?: Event; promotedCount?: number }> => {
  try {
    const res = await apiClient.patch(`/admin/events/${eventId}/quota`, {
      maxSlots,
      waitlistSlots,
    });
    return res.data;
  } catch (e: any) {
    const ev = inMemoryEvents.find(
      (item) => item._id === eventId || (item as any).id === eventId,
    );
    if (ev) {
      ev.maxSlots = maxSlots;
      ev.waitlistSlots = waitlistSlots;
    }
    return {
      success: true,
      message: `Đã cập nhật Quota: ${maxSlots} chỗ chính thức, ${waitlistSlots} chỗ chờ.`,
      data: ev,
    };
  }
};

export const addEventAttendee = async (
  eventId: string,
  studentIdOrEmail: string,
  fullName?: string,
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const res = await apiClient.post(`/admin/events/${eventId}/attendees`, {
      studentIdOrEmail,
      fullName,
    });
    return res.data;
  } catch (e: any) {
    const cleanId = studentIdOrEmail.trim().toUpperCase();
    const newReg: Registration = {
      _id: "reg_" + Date.now(),
      eventId,
      userId: "user_" + cleanId,
      participantRole: "attendee",
      status: "registered",
      createdAt: new Date().toISOString(),
      registeredAt: new Date().toISOString(),
    };
    inMemoryRegistrations.unshift(newReg);
    return {
      success: true,
      message: `Đã thêm thành công sinh viên (${cleanId}) vào danh sách sự kiện!`,
      data: { registration: newReg },
    };
  }
};

export const removeEventAttendee = async (
  registrationId: string,
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const res = await apiClient.delete(`/admin/registrations/${registrationId}`);
    return res.data;
  } catch (e: any) {
    const reg = inMemoryRegistrations.find((r) => r._id === registrationId);
    if (reg) {
      reg.status = "cancelled";
    }
    return {
      success: true,
      message: "Đã xoá sinh viên khỏi danh sách sự kiện thành công!",
      data: { cancelledRegistrationId: registrationId },
    };
  }
};

export const adminQuickCheckIn = async (
  registrationId: string,
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const res = await apiClient.post(
      `/admin/registrations/${registrationId}/quick-checkin`,
    );
    return res.data;
  } catch (e: any) {
    const reg = inMemoryRegistrations.find((r) => r._id === registrationId);
    if (reg) {
      reg.status = "checked_in";
      reg.checkInMethod = "admin_manual";
      reg.checkInTime = new Date().toISOString();
    }
    return {
      success: true,
      message: "Admin điểm danh nhanh thành công!",
      data: reg,
    };
  }
};

// ─── Feedbacks ────────────────────────────────────────────────────────────────

export const getAllFeedbacks = async (): Promise<Feedback[]> => {
  try {
    const res = await apiClient.get("/feedbacks");
    return unwrapList<Feedback>(res.data);
  } catch (e) {
    return [];
  }
};

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

export const getFeedbacksByUser = async (
  userId: string,
): Promise<Feedback[]> => {
  try {
    const res = await apiClient.get("/feedbacks", { params: { userId } });
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

// ─── Users & Admin User Management ──────────────────────────────────────────

export const getUsers = async (): Promise<User[]> => {
  try {
    const res = await apiClient.get("/users");
    const list = unwrapList<any>(res.data);
    if (list && list.length > 0) {
      return list.map(mapBackendUser);
    }
    return inMemoryUsers;
  } catch (e) {
    return inMemoryUsers;
  }
};

export const getUserById = async (id: string): Promise<User> => {
  try {
    const res = await apiClient.get(`/users/${id}`);
    return mapBackendUser(res.data);
  } catch (e) {
    const found = inMemoryUsers.find(
      (u) => u._id === id || (u as any).id === id,
    );
    if (found) return found;
    return MOCK_DEFAULT_USER;
  }
};

export const adminUpdateUser = async (
  userId: string,
  data: Partial<User>,
): Promise<User> => {
  try {
    const res = await apiClient.patch(`/users/${userId}`, data);
    return mapBackendUser(res.data);
  } catch (e) {
    const idx = inMemoryUsers.findIndex(
      (u) => u._id === userId || (u as any).id === userId,
    );
    if (idx !== -1) {
      inMemoryUsers[idx] = { ...inMemoryUsers[idx], ...data };
      return inMemoryUsers[idx];
    }
    const updated = { ...MOCK_DEFAULT_USER, ...data, _id: userId };
    inMemoryUsers.push(updated);
    return updated;
  }
};

export const adminCreateUser = async (
  payload: CreateUserPayload,
): Promise<User> => {
  const newUser: User = {
    _id: "user_" + Date.now(),
    studentId: payload.studentId,
    fullName: payload.fullName,
    email: payload.email,
    role: payload.role,
    faculty: payload.faculty || "Khoa Công nghệ thông tin",
    point: payload.point ?? 0,
    phone: payload.phone,
    status: "active",
    isActive: true,
    avatarUrl: `https://i.pravatar.cc/300?img=${Math.floor(Math.random() * 50) + 1}`,
    createdAt: new Date().toISOString(),
  };

  try {
    const res = await apiClient.post("/users", {
      ...newUser,
      id: newUser._id,
      name: newUser.fullName,
      password: payload.password || "123456",
    });
    return mapBackendUser(res.data);
  } catch (e) {
    inMemoryUsers.unshift(newUser);
    return newUser;
  }
};

export const adminDeleteUser = async (userId: string): Promise<boolean> => {
  try {
    await apiClient.delete(`/users/${userId}`);
    inMemoryUsers = inMemoryUsers.filter(
      (u) => u._id !== userId && (u as any).id !== userId,
    );
    return true;
  } catch (e) {
    inMemoryUsers = inMemoryUsers.filter(
      (u) => u._id !== userId && (u as any).id !== userId,
    );
    return true;
  }
};

// Luồng khiếu nại Check-in (Fallback Dispute Flow)
export const submitCheckInAppeal = async (payload: {
  eventId: string;
  userId?: string;
  studentId?: string;
  studentName?: string;
  reason: string;
  proofImageUrl?: string;
}) => {
  const res = await apiClient.post("/registrations/appeal", payload);
  return res.data;
};

// Cài đặt thông báo & Giờ yên lặng (Quiet Hours)
export const getNotificationPreferences = async (userId: string) => {
  try {
    const res = await apiClient.get(`/users/${userId}/preferences`);
    return res.data?.data || res.data;
  } catch {
    return null;
  }
};

export const updateNotificationPreferences = async (userId: string, prefs: any) => {
  const res = await apiClient.put(`/users/${userId}/preferences`, prefs);
  return res.data;
};

// Tiện ích Lịch (Google Calendar & iCalendar .ICS)
export const getCalendarIcsUrl = (eventId: string) => {
  const base = apiClient.defaults.baseURL || "http://localhost:5000";
  return `${base}/events/${eventId}/calendar.ics`;
};

export const getGoogleCalendarAddUrl = (event: { title: string; description?: string; location?: string; time?: { start: string; end: string } }) => {
  const title = encodeURIComponent(event.title || "Sự kiện sinh viên IUH");
  const details = encodeURIComponent(event.description || "");
  const location = encodeURIComponent(event.location || "");
  const formatTime = (d?: string) => (d ? new Date(d).toISOString().replace(/-|:|\.\d\d\d/g, "") : "");
  const dates = `${formatTime(event.time?.start)}/${formatTime(event.time?.end)}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
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
  toggleHideEvent,
  isEventPast,
  getAllRegistrations,
  getRegistrationsByUser,
  getRegistrationsByEvent,
  registerEvent,
  checkIn,
  qrCheckIn,
  adminManualCheckIn,
  cancelRegistration,
  updateEventQuota,
  addEventAttendee,
  removeEventAttendee,
  adminQuickCheckIn,
  getAllFeedbacks,
  getFeedbacksByEvent,
  getFeedbacksByUser,
  createFeedback,
  getNotificationsByUser,
  markNotificationAsRead,
  getUsers,
  getUserById,
  adminUpdateUser,
  adminCreateUser,
  adminDeleteUser,
  setAuthToken,
  setBaseUrl,
  submitCheckInAppeal,
  getEventQrToken,
  getNotificationPreferences,
  updateNotificationPreferences,
  getCalendarIcsUrl,
  getGoogleCalendarAddUrl,
};

// AI Summary
export const summarizeEvent = async (eventId: string): Promise<AISummary> => {
<<<<<<< HEAD
  const res = await apiClient.post(`/events/${eventId}/summarize`);
  return res.data.data;
};
=======
  try {
    const res = await apiClient.post(`/events/${eventId}/summarize`);
    return res.data.data;
  } catch (error: any) {
    // A deployed mock server may temporarily lag behind the mobile build. Use
    // its already-public event data only for the missing route case; real API,
    // authorization and network errors remain visible to the user.
    if (error?.response?.status !== 404) throw error;
    const event = await getEventById(eventId);
    if (!event) throw error;
    const start = new Date(event.time?.start);
    return event.aiSummary ?? {
      what: event.description || `Sự kiện ${event.title}.`,
      when: Number.isNaN(start.getTime())
        ? "Thời gian sẽ được ban tổ chức cập nhật."
        : `Bắt đầu lúc ${start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ngày ${start.toLocaleDateString("vi-VN")}.`,
      where: event.location || "Địa điểm sẽ được ban tổ chức cập nhật.",
      benefits: event.trainingPoints
        ? `Người tham gia được cộng ${event.trainingPoints} điểm rèn luyện.`
        : "Cơ hội cập nhật kiến thức và kết nối cùng cộng đồng sinh viên.",
    };
  }
};
>>>>>>> 42418ae (feat: enhance event registration handling and UI components for better user experience)
