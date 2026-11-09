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
import { mergeRegistrations, entityId } from '../utils/registrations';

// ─── Base URL ─────────────────────────────────────────────────────────────────

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
const debuggerHost = Constants.expoConfig?.hostUri;
=======
=======
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
// `hostUri` is supplied by Expo Go only while developing.  In an Expo tunnel
// it names the Metro tunnel, not this API, so it must never be used as an API
// host.  SDK 58 also exposes it through expoGoConfig on some Expo Go builds.
const expoConstants = Constants as typeof Constants & {
  expoGoConfig?: { debuggerHost?: string } | null;
};
const debuggerHost =
  Constants.expoConfig?.hostUri ?? expoConstants.expoGoConfig?.debuggerHost;
<<<<<<< HEAD
>>>>>>> d3ca778 (Tata)
=======
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
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
const rawCloudUrl = process.env.EXPO_PUBLIC_API_URL
  ?.trim()
  ?.replace(/^['"]|['"]$/g, "")
  ?.replace(/\/+$/, "");
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
 *   Các thao tác ghi sẽ thất bại rõ ràng nếu API/DB không sẵn sàng, để không
 *   bao giờ hiển thị một thay đổi cục bộ như thể nó đã được đồng bộ.
 */
export const USE_STANDALONE_MOCK: boolean =
  process.env.EXPO_PUBLIC_USE_STANDALONE_MOCK === "true";

// Local mock data is intentionally opt-in. In normal mode every successful
// write must come from the shared API/database, even when Expo itself runs
// through a tunnel.
const shouldUseOfflineFallback = USE_STANDALONE_MOCK;

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
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

if (typeof __DEV__ !== "undefined" && __DEV__ && typeof console?.log === "function") {
  console.log(`[API] Configured BASE_URL=${BASE_URL} (offlineFallback=${shouldUseOfflineFallback})`);
}

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
    status: "registered",
    qrCode: "EVENTMATE:66f1b3010000000000000001",
    checkInTime: null,
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
    const auth = mapBackendAuth(res.data);
    if (auth.token) {
      _authToken = auth.token;
    }
    return auth;
  } catch (err: any) {
    const isNetworkError =
      err?.code === "ERR_NETWORK" ||
      err?.code === "ECONNABORTED" ||
      !err?.response;

    // Demo accounts only exist in the explicit standalone mode. A network
    // failure must never make an unavailable shared API look like a login.
    if (!USE_STANDALONE_MOCK || !isNetworkError) throw err;

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
    const auth = mapBackendAuth(res.data);
    if (auth.token) {
      _authToken = auth.token;
    }
    return auth;
  } catch (err: any) {
    const isNetworkError =
      err?.code === "ERR_NETWORK" ||
      err?.code === "ECONNABORTED" ||
      !err?.response;

    if (USE_STANDALONE_MOCK && isNetworkError) {
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
  } catch (error) {
    if (!shouldUseOfflineFallback) throw error;
  }
};

export async function requestPasswordReset(email: string): Promise<{ demoCode?: string }> {
  const res = await apiClient.post("/auth/forgot-password", { email });
  return res.data ?? {};
}

export async function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
  await apiClient.post("/auth/reset-password", { email, code, newPassword });
}

export async function requestEmailChange(newEmail: string): Promise<{ demoCode?: string }> {
  const res = await apiClient.post("/auth/change-email/request", { newEmail });
  return res.data ?? {};
}

export async function confirmEmailChange(code: string): Promise<User> {
  const res = await apiClient.post("/auth/change-email/confirm", { code });
  return mapBackendUser(res.data);
}

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
    return unwrapList<Event>(res.data);
  } catch (err: any) {
    const status = err?.response?.status;
    if (
      shouldUseOfflineFallback &&
      (err?.code === "ERR_NETWORK" ||
        err?.code === "ECONNABORTED" ||
        !err?.response ||
        status === 404 ||
        (status && status >= 500))
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
      shouldUseOfflineFallback &&
      (err?.code === "ERR_NETWORK" ||
        err?.code === "ERR_INVALID_URL" ||
        !err?.response ||
        status === 404 ||
        (status && status >= 500))
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
    if (!shouldUseOfflineFallback) throw err;
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
  const start = eventData.time?.start ?? new Date().toISOString();
  const end = eventData.time?.end ?? new Date(Date.now() + 2 * 3600 * 1000).toISOString();
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
    throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu.');
  }

  const maxSlots = Number(eventData.maxSlots ?? 100);
  const waitlistSlots = Number(eventData.waitlistSlots ?? 20);
  if (!Number.isInteger(maxSlots) || maxSlots < 1) {
    throw new Error('Số lượng tham gia chính thức phải là số nguyên lớn hơn 0.');
  }
  if (!Number.isInteger(waitlistSlots) || waitlistSlots < 0) {
    throw new Error('Số lượng danh sách chờ phải là số nguyên không âm.');
  }

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
    time: { start, end },
    organizer: eventData.organizer || "Ban Chấp hành Đoàn trường",
    faculty: eventData.faculty || "Toàn trường",
    images: [
      eventData.bannerUrl ||
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    ],
    trainingPoints: eventData.trainingPoints ?? 5,
    maxSlots,
    waitlistSlots,
    semesterId: eventData.semesterId,
    status: (eventData.status as any) || "upcoming",
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
  } catch (e: any) {
    if (e?.response || !shouldUseOfflineFallback) {
      throw e;
    }
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
  } catch (e: any) {
    if (e?.response || !shouldUseOfflineFallback) {
      throw e;
    }
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
    endTime.getTime() <= now.getTime()
  ) {
    return true;
  }
  return false;
};

// ─── Registrations ────────────────────────────────────────────────────────────

export const getAllRegistrations = async (): Promise<Registration[]> => {
  try {
    const res = await apiClient.get("/registrations");
    return unwrapList<Registration>(res.data);
  } catch (e) {
    if (!shouldUseOfflineFallback) throw e;
    return inMemoryRegistrations;
  }
};

export const getRegistrationsByUser = async (
  userId: string,
): Promise<Registration[]> => {
  const mergeCheckIns = (list: Registration[]) => mergeRegistrations([
    ...list,
    ...confirmedQrCheckIns.filter(r => entityId(r.userId) === userId),
  ], inMemoryEvents);
  try {
    const res = await apiClient.get("/registrations", { params: { userId } });
    const list = unwrapList<Registration>(res.data);
    return mergeCheckIns(list);
  } catch (e) {
    if (!shouldUseOfflineFallback) throw e;
    return mergeCheckIns(inMemoryRegistrations.filter((r) => entityId(r.userId) === userId));
  }
};

export const getRegistrationsByEvent = async (
  eventId: string,
): Promise<Registration[]> => {
  try {
    const res = await apiClient.get("/registrations", { params: { eventId } });
    return unwrapList<Registration>(res.data);
  } catch (e) {
    if (!shouldUseOfflineFallback) throw e;
    return inMemoryRegistrations.filter((r) => entityId(r.eventId) === eventId);
  }
};

export const registerEvent = async (
  data: CreateRegistrationPayload,
): Promise<Registration> => {
  const targetEventId = entityId(data.eventId);
  const targetUserId = entityId(data.userId);
  const isExistingRegistration = (registration: Registration) =>
    entityId(registration.eventId) === targetEventId &&
    entityId(registration.userId) === targetUserId &&
    registration.status !== "cancelled";

  const upsertInMemory = (reg: Registration) => {
    const idx = inMemoryRegistrations.findIndex(
      (r) =>
        entityId(r.eventId) === entityId(reg.eventId || targetEventId) &&
        entityId(r.userId) === entityId(reg.userId || targetUserId),
    );
    if (idx !== -1) {
      inMemoryRegistrations[idx] = reg;
    } else {
      inMemoryRegistrations.unshift(reg);
    }
  };

  try {
    const registrations = await getRegistrationsByUser(targetUserId);
    if (registrations.some(isExistingRegistration)) {
      throw new Error("Bạn đã đăng ký hoặc check-in sự kiện này rồi.");
    }
    const res = await apiClient.post("/registrations", data);
    const reg = unwrapOne<Registration>(res.data);
    upsertInMemory(reg);
    return reg;
  } catch (e: any) {
    // Do not turn an intentional server/business rejection into an offline
    // success. Only transport failures in offline mode use the in-memory fallback.
    const isTransportError =
      e?.code === "ERR_NETWORK" ||
      e?.code === "ECONNABORTED" ||
      (!e?.response && !e?.message?.includes("đăng ký") && !e?.message?.includes("check-in"));
    if (e?.response || !isTransportError || !shouldUseOfflineFallback) {
      throw e;
    }
    if (
      confirmedQrCheckIns.some(isExistingRegistration) ||
      inMemoryRegistrations.some(isExistingRegistration)
    ) {
      throw new Error("Bạn đã đăng ký hoặc check-in sự kiện này rồi.");
    }

    const matchedEvent = inMemoryEvents.find(
      (ev) => entityId(ev) === targetEventId,
    );
    if (matchedEvent) {
      if (["draft", "pending_approval"].includes(matchedEvent.status)) {
        throw new Error("Sự kiện chưa được mở đăng ký.");
      }
      if (matchedEvent.status === "cancelled") {
        throw new Error("Sự kiện đã bị hủy, không thể đăng ký.");
      }
      if (matchedEvent.status === "registration_closed") {
        throw new Error("Sự kiện đã đóng cổng đăng ký.");
      }
      if (isEventPast(matchedEvent)) {
        throw new Error("Sự kiện đã kết thúc, không thể đăng ký.");
      }
    }

    const activeEventRegs = inMemoryRegistrations.filter(
      (r) => entityId(r.eventId) === targetEventId && r.status !== "cancelled",
    );
    const maxSlots = typeof matchedEvent?.maxSlots === "number" ? matchedEvent.maxSlots : 100;
    const waitlistSlots = typeof matchedEvent?.waitlistSlots === "number" ? matchedEvent.waitlistSlots : 20;
    const officialCount = activeEventRegs.filter((r) =>
      ["registered", "checked_in", "completed"].includes(r.status),
    ).length;
    const waitlistCount = activeEventRegs.filter((r) => r.status === "waitlist").length;

    let offlineStatus: "registered" | "waitlist" = "registered";
    let waitlistPosition: number | null = null;
    if (officialCount >= maxSlots) {
      if (waitlistCount < waitlistSlots) {
        offlineStatus = "waitlist";
        waitlistPosition = waitlistCount + 1;
      } else {
        throw new Error("Sự kiện đã hết vé chính thức và danh sách chờ!");
      }
    }

    const existingCancelled = inMemoryRegistrations.find(
      (r) =>
        entityId(r.eventId) === targetEventId &&
        entityId(r.userId) === targetUserId &&
        r.status === "cancelled",
    );

    const reg: Registration = {
      _id: existingCancelled?._id || "reg_" + Date.now(),
      eventId: data.eventId,
      userId: data.userId,
      participantRole: data.participantRole || "attendee",
      status: offlineStatus,
      waitlistPosition,
      checkInTime: null,
      registeredAt: new Date().toISOString(),
      createdAt: existingCancelled?.createdAt || new Date().toISOString(),
    };
    upsertInMemory(reg);
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
    if (USE_STANDALONE_MOCK && (err?.code === "ERR_NETWORK" || !err?.response)) {
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

      if (["draft", "pending_approval"].includes(matchedEvent.status)) {
        return {
          success: false,
          message: "Sự kiện chưa được mở điểm danh.",
        };
      }

      if (matchedEvent.status === "cancelled") {
        return {
          success: false,
          message: "Sự kiện đã bị hủy, không thể điểm danh.",
        };
      }

      if (isEventPast(matchedEvent)) {
        return {
          success: false,
          message: "Sự kiện đã kết thúc, cổng điểm danh đã đóng.",
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
          !Number.isFinite(Number(payload.userLocation.latitude)) ||
          !Number.isFinite(Number(payload.userLocation.longitude))
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
        const radiusMeters = matchedEvent.coordinates.radiusMeters || 500;

        if (dist > radiusMeters) {
          const distStr =
            dist < 1000 ? dist + "m" : (dist / 1000).toFixed(1) + "km";
          return {
            success: false,
            message: `Vị trí không hợp lệ! Bạn đang cách địa điểm sự kiện ${distStr} (vượt quá bán kính cho phép ${radiusMeters}m). Vui lòng có mặt tại địa điểm để điểm danh.`,
            distanceMeters: dist,
          };
        }
      }

      // Kiểm tra xem sinh viên đã đăng ký sự kiện này chưa
      const targetUserId = payload.userId || MOCK_DEFAULT_USER._id;
      const existingReg = inMemoryRegistrations.find(
        (r) =>
          entityId(r.eventId) === entityId(payload.eventId) &&
          (entityId(r.userId) === targetUserId || entityId(r.userId) === payload.userId)
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

      if (existingReg.status === "checked_in" || existingReg.status === "completed") {
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
  const noteText =
    payload.note?.trim() || "Admin xác nhận tham dự thủ công tại hội trường";

  let allUsers: User[] = [MOCK_DEFAULT_USER, MOCK_ADMIN_USER];
  try {
    const fetched = await getUsers();
    if (fetched && fetched.length > 0) allUsers = fetched;
  } catch (e) {}

  const matchedUser = allUsers.find(
    (u) =>
      u.studentId?.toLowerCase() === cleanId ||
      u.email?.toLowerCase() === cleanId ||
      u.fullName?.toLowerCase().includes(cleanId),
  );

  if (!matchedUser && !shouldUseOfflineFallback) {
    throw new Error(
      `Không tìm thấy sinh viên "${payload.studentIdOrEmail.trim()}" trong hệ thống.`,
    );
  }

  const targetUser: User = matchedUser || {
    _id: "user_" + Date.now(),
    studentId: payload.studentIdOrEmail.trim().toUpperCase(),
    fullName: `Sinh viên ${payload.studentIdOrEmail.trim().toUpperCase()}`,
    email: cleanId.includes("@") ? cleanId : `${cleanId}@iuh.edu.vn`,
    point: 100,
    role: "student" as const,
    faculty: "Khoa Công nghệ thông tin",
  };

  const targetEventId = entityId(payload.eventId);
  const existingRegistration = (await getRegistrationsByUser(targetUser._id)).find(
    (registration) =>
      entityId(registration.eventId) === targetEventId &&
      registration.status !== "cancelled",
  );

  if (
    existingRegistration?.status === "checked_in" ||
    existingRegistration?.status === "completed"
  ) {
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
    const patchBody = {
      status: "checked_in" as const,
      checkInTime: checkedInAt,
      checkInMethod: "admin_manual" as const,
      note: noteText,
    };
    const registrationId =
      (existingRegistration as { id?: string }).id || existingRegistration._id;
    let savedReg: Registration = {
      ...existingRegistration,
      ...patchBody,
    };

    try {
      const patchRes = await apiClient.patch(
        `/registrations/${registrationId}`,
        patchBody,
      );
      savedReg = unwrapOne<Registration>(patchRes.data);
    } catch (error: any) {
      if (error?.response || !shouldUseOfflineFallback) throw error;
    }

    inMemoryRegistrations = inMemoryRegistrations.map((registration) =>
      registration._id === existingRegistration._id ? savedReg : registration,
    );
    return {
      success: true,
      message: `Đã xác nhận điểm danh bù cho ${targetUser.fullName} (${targetUser.studentId}).`,
      registration: savedReg,
    };
  }

  const checkedInAt = new Date().toISOString();
  const createBody: Record<string, any> = {
    eventId: payload.eventId,
    userId: targetUser._id,
    studentId: targetUser.studentId,
    participantRole: "attendee",
    status: "checked_in",
    checkInTime: checkedInAt,
    checkInMethod: "admin_manual",
    note: noteText,
  };

  let createdReg: Registration = {
    _id: "reg_manual_" + Date.now(),
    eventId: payload.eventId,
    userId: targetUser._id,
    participantRole: "attendee",
    status: "checked_in",
    checkInTime: checkedInAt,
    checkInMethod: "admin_manual",
    note: noteText,
    createdAt: checkedInAt,
  };

  try {
    const postRes = await apiClient.post("/registrations", createBody);
    createdReg = unwrapOne<Registration>(postRes.data);
  } catch (error: any) {
    if (error?.response || !shouldUseOfflineFallback) throw error;
  }

  inMemoryRegistrations.unshift(createdReg);

  return {
    success: true,
    message: `Đã điểm danh bù thành công cho ${targetUser.fullName} (${targetUser.studentId})!`,
    registration: createdReg,
  };
};

export const cancelRegistration = async (
  registrationId: string,
): Promise<Registration> => {
  try {
    const res = await apiClient.patch(`/registrations/${registrationId}`, {
      status: "cancelled",
    });
    const updated = unwrapOne<Registration>(res.data);
    inMemoryRegistrations = inMemoryRegistrations.map((r) =>
      r._id === registrationId || (r as any).id === registrationId ? updated : r,
    );
    confirmedQrCheckIns = confirmedQrCheckIns.filter(
      (r) => r._id !== registrationId && (r as any).id !== registrationId,
    );
    return updated;
  } catch (e: any) {
    if (e?.response || !shouldUseOfflineFallback) {
      throw e;
    }
    const existing = inMemoryRegistrations.find(
      (r) => r._id === registrationId || (r as any).id === registrationId,
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
    if (e?.response || !shouldUseOfflineFallback) {
      throw e;
    }
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
    if (e?.response || !shouldUseOfflineFallback) {
      throw e;
    }
    const cleanId = studentIdOrEmail.trim().toUpperCase();
    const targetEventId = entityId(eventId);
    const localUser = inMemoryUsers.find(
      (u) =>
        u.studentId?.toUpperCase() === cleanId ||
        u.email?.toLowerCase() === studentIdOrEmail.trim().toLowerCase(),
    );
    const offlineUserId = localUser?._id || "user_" + cleanId;
    const duplicate = inMemoryRegistrations.find(
      (r) =>
        entityId(r.eventId) === targetEventId &&
        entityId(r.userId) === offlineUserId &&
        r.status !== "cancelled",
    );
    if (duplicate) {
      throw new Error(`Sinh viên (${cleanId}) đã có tên trong danh sách sự kiện này.`);
    }

    const ev = inMemoryEvents.find((item) => entityId(item) === targetEventId);
    const maxSlots = typeof ev?.maxSlots === "number" ? ev.maxSlots : 100;
    const waitlistSlots = typeof ev?.waitlistSlots === "number" ? ev.waitlistSlots : 20;
    const activeRegs = inMemoryRegistrations.filter(
      (r) => entityId(r.eventId) === targetEventId && r.status !== "cancelled",
    );
    const officialCount = activeRegs.filter((r) =>
      ["registered", "checked_in", "completed"].includes(r.status),
    ).length;
    const waitlistCount = activeRegs.filter((r) => r.status === "waitlist").length;

    let assignedStatus: "registered" | "waitlist" = "registered";
    let waitlistPosition: number | null = null;
    if (officialCount >= maxSlots) {
      if (waitlistCount < waitlistSlots) {
        assignedStatus = "waitlist";
        waitlistPosition = waitlistCount + 1;
      } else {
        throw new Error("Sự kiện đã đầy cả vé chính thức và danh sách chờ!");
      }
    }

    const newReg: Registration = {
      _id: "reg_" + Date.now(),
      eventId,
      userId: offlineUserId,
      participantRole: "attendee",
      status: assignedStatus,
      waitlistPosition,
      createdAt: new Date().toISOString(),
      registeredAt: new Date().toISOString(),
    };
    inMemoryRegistrations.unshift(newReg);
    return {
      success: true,
      message:
        assignedStatus === "waitlist"
          ? `Sự kiện đã đủ chỗ chính thức. Đã thêm sinh viên (${cleanId}) vào Waitlist #${waitlistPosition}.`
          : `Đã thêm thành công sinh viên (${cleanId}) vào danh sách sự kiện!`,
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
    if (e?.response || !shouldUseOfflineFallback) {
      throw e;
    }
    const reg = inMemoryRegistrations.find(
      (r) => r._id === registrationId || (r as any).id === registrationId,
    );
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
    if (e?.response || !shouldUseOfflineFallback) {
      throw e;
    }
    const reg = inMemoryRegistrations.find(
      (r) => r._id === registrationId || (r as any).id === registrationId,
    );
    if (reg) {
      if (reg.status === "waitlist" || reg.status === "cancelled") {
        throw new Error("Chỉ có thể điểm danh nhanh cho sinh viên trong danh sách chính thức.");
      }
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
    if (!shouldUseOfflineFallback) throw e;
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
    if (!shouldUseOfflineFallback) throw e;
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
    if (!shouldUseOfflineFallback) throw e;
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
    if (!shouldUseOfflineFallback) throw e;
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

export const unregisterPushToken = async (token: string): Promise<void> => {
  await apiClient.delete("/users/me/push-tokens", { data: { token } });
};

// ─── Users & Admin User Management ──────────────────────────────────────────

export const getUsers = async (): Promise<User[]> => {
  try {
    const res = await apiClient.get("/users");
    const list = unwrapList<any>(res.data);
    return list.map(mapBackendUser);
  } catch (e) {
    if (!shouldUseOfflineFallback) throw e;
    return inMemoryUsers;
  }
};

export const getUserById = async (id: string): Promise<User> => {
  try {
    const res = await apiClient.get(`/users/${id}`);
    return mapBackendUser(res.data);
  } catch (e) {
    if (!shouldUseOfflineFallback) throw e;
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
  } catch (e: any) {
    if (e?.response || !shouldUseOfflineFallback) {
      throw e;
    }
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
    const { _id: _localId, createdAt: _localCreatedAt, ...userBody } = newUser;
    const res = await apiClient.post("/users", {
      ...userBody,
      name: newUser.fullName,
      password: payload.password || "123456",
    });
    return mapBackendUser(res.data);
  } catch (e: any) {
    if (e?.response || !shouldUseOfflineFallback) {
      throw e;
    }
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
  } catch (e: any) {
    if (e?.response || !shouldUseOfflineFallback) {
      throw e;
    }
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
<<<<<<< HEAD
=======
};

function formatViDateTime(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${hours}:${minutes} ngày ${day}/${month}/${year}`;
  } catch {
    return "";
  }
}

export const generateLocalAISummary = (event?: Partial<Event> | null): AISummary => {
  const start = formatViDateTime(event?.time?.start);
  const end = formatViDateTime(event?.time?.end);
  let whenText = "Thời gian chi tiết xem tại thông tin sự kiện";
  if (start && end) {
    whenText = `${start} — ${end}`;
  } else if (start) {
    whenText = `Bắt đầu lúc ${start}`;
  }

  let whatText = "";
  if (event?.description && event.description.trim().length > 10) {
    const clean = event.description.trim().replace(/\s+/g, " ");
    whatText = clean.length > 250 ? `${clean.slice(0, 247)}...` : clean;
  } else {
    whatText = `Sự kiện "${event?.title || "Sự kiện sinh viên"}" do ${
      event?.organizer || event?.faculty || "Trường Đại học Công nghiệp TP.HCM (IUH)"
    } tổ chức thuộc danh mục ${event?.category || "hoạt động phong trào"}.`;
  }

  const whereText =
    event?.location || "Khuôn viên Trường Đại học Công nghiệp TP.HCM (IUH)";

  const points = event?.trainingPoints
    ? `+${event.trainingPoints} điểm rèn luyện (ĐRL)`
    : "Ghi nhận tham gia tích cực";
  const benefitsText = `${points}, trau dồi kiến thức thực tế, nâng cao kỹ năng mềm và mở rộng cơ hội kết nối cộng đồng sinh viên IUH.`;

  return {
    what: whatText,
    when: whenText,
    where: whereText,
    benefits: benefitsText,
  };
};

// Bộ nhớ cache riêng biệt cho AI Summary (tránh ghi đè trực tiếp lên frozen Redux object)
const aiSummaryCache = new Map<string, AISummary>();

// AI Summary
export const summarizeEvent = async (
  eventId: string,
  eventData?: Partial<Event> | null
): Promise<AISummary> => {
  if (eventId && aiSummaryCache.has(eventId)) {
    return aiSummaryCache.get(eventId)!;
  }

  const resolvedEvent =
    eventData ||
    inMemoryEvents.find(
      (e) => e._id === eventId || (e as any).id === eventId
    ) ||
    eventsData.find(
      (e) => e._id === eventId || (e as any).id === eventId
    );

  // 1. Thử gọi backend API để lấy tóm tắt từ Gemini AI
  try {
    const res = await apiClient.post(
      `/events/${eventId}/summarize`,
      { event: resolvedEvent },
      { timeout: 8000 }
    );
    if (res.data?.data && res.data.data.what) {
      const summary: AISummary = res.data.data;
      if (eventId) {
        aiSummaryCache.set(eventId, summary);
      }
      return summary;
    }
  } catch (err: any) {
    console.warn(
      "[AI] Gọi backend tóm tắt thất bại hoặc offline, tự động kích hoạt bộ tóm tắt thông minh trên máy:",
      err?.message || err
    );
  }

  // 2. Dự phòng 1: Nếu sự kiện đã có sẵn aiSummary
  if (resolvedEvent?.aiSummary?.what) {
    if (eventId) {
      aiSummaryCache.set(eventId, resolvedEvent.aiSummary);
    }
    return resolvedEvent.aiSummary;
  }

  // 3. Dự phòng 2: Tự động tổng hợp tóm tắt chất lượng cao từ metadata sự kiện
  const localSummary = generateLocalAISummary(resolvedEvent);
  if (eventId) {
    aiSummaryCache.set(eventId, localSummary);
  }
  return localSummary;
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
};

<<<<<<< HEAD
// AI Summary
export const summarizeEvent = async (eventId: string): Promise<AISummary> => {
<<<<<<< HEAD
  const res = await apiClient.post(`/events/${eventId}/summarize`);
  return res.data.data;
};
=======
=======
function formatViDateTime(dateStr?: string): string {
  if (!dateStr) return "";
>>>>>>> 15ed82f (tata)
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${hours}:${minutes} ngày ${day}/${month}/${year}`;
  } catch {
    return "";
  }
}

export const generateLocalAISummary = (event?: Partial<Event> | null): AISummary => {
  const start = formatViDateTime(event?.time?.start);
  const end = formatViDateTime(event?.time?.end);
  let whenText = "Thời gian chi tiết xem tại thông tin sự kiện";
  if (start && end) {
    whenText = `${start} — ${end}`;
  } else if (start) {
    whenText = `Bắt đầu lúc ${start}`;
  }

  let whatText = "";
  if (event?.description && event.description.trim().length > 10) {
    const clean = event.description.trim().replace(/\s+/g, " ");
    whatText = clean.length > 250 ? `${clean.slice(0, 247)}...` : clean;
  } else {
    whatText = `Sự kiện "${event?.title || "Sự kiện sinh viên"}" do ${
      event?.organizer || event?.faculty || "Trường Đại học Công nghiệp TP.HCM (IUH)"
    } tổ chức thuộc danh mục ${event?.category || "hoạt động phong trào"}.`;
  }

  const whereText =
    event?.location || "Khuôn viên Trường Đại học Công nghiệp TP.HCM (IUH)";

  const points = event?.trainingPoints
    ? `+${event.trainingPoints} điểm rèn luyện (ĐRL)`
    : "Ghi nhận tham gia tích cực";
  const benefitsText = `${points}, trau dồi kiến thức thực tế, nâng cao kỹ năng mềm và mở rộng cơ hội kết nối cộng đồng sinh viên IUH.`;

  return {
    what: whatText,
    when: whenText,
    where: whereText,
    benefits: benefitsText,
  };
};

// Bộ nhớ cache riêng biệt cho AI Summary (tránh ghi đè trực tiếp lên frozen Redux object)
const aiSummaryCache = new Map<string, AISummary>();

// AI Summary
export const summarizeEvent = async (
  eventId: string,
  eventData?: Partial<Event> | null
): Promise<AISummary> => {
  if (eventId && aiSummaryCache.has(eventId)) {
    return aiSummaryCache.get(eventId)!;
  }

  const resolvedEvent =
    eventData ||
    inMemoryEvents.find(
      (e) => e._id === eventId || (e as any).id === eventId
    ) ||
    eventsData.find(
      (e) => e._id === eventId || (e as any).id === eventId
    );

  // 1. Thử gọi backend API để lấy tóm tắt từ Gemini AI
  try {
    const res = await apiClient.post(
      `/events/${eventId}/summarize`,
      { event: resolvedEvent },
      { timeout: 8000 }
    );
    if (res.data?.data && res.data.data.what) {
      const summary: AISummary = res.data.data;
      if (eventId) {
        aiSummaryCache.set(eventId, summary);
      }
      return summary;
    }
  } catch (err: any) {
    console.warn(
      "[AI] Gọi backend tóm tắt thất bại hoặc offline, tự động kích hoạt bộ tóm tắt thông minh trên máy:",
      err?.message || err
    );
  }

  // 2. Dự phòng 1: Nếu sự kiện đã có sẵn aiSummary
  if (resolvedEvent?.aiSummary?.what) {
    if (eventId) {
      aiSummaryCache.set(eventId, resolvedEvent.aiSummary);
    }
    return resolvedEvent.aiSummary;
  }

  // 3. Dự phòng 2: Tự động tổng hợp tóm tắt chất lượng cao từ metadata sự kiện
  const localSummary = generateLocalAISummary(resolvedEvent);
  if (eventId) {
    aiSummaryCache.set(eventId, localSummary);
  }
  return localSummary;
};
>>>>>>> 42418ae (feat: enhance event registration handling and UI components for better user experience)
