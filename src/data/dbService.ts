import AsyncStorage from '@react-native-async-storage/async-storage';
import dbRaw from './db.json';

export const FEEDBACKS_STORAGE_KEY = '@student_app_persisted_feedbacks';

// In-memory working copy initialized from db.json
const dbState = {
  users: [...((dbRaw as any).users || [])] as any[],
  events: [...((dbRaw as any).events || [])] as any[],
  registrations: [...((dbRaw as any).registrations || [])] as any[],
  feedbacks: [...((dbRaw as any).feedbacks || [])] as any[],
  notifications: [...((dbRaw as any).notifications || [])] as any[],
};

export interface UserStats {
  eventsAttended: number;
  pointsAccumulated: number;
  reviews: number;
}

export interface EnrichedFeedback {
  id: string;
  _id: string;
  eventId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  userName: string;
  userAvatar?: string;
  userFaculty?: string;
  eventTitle: string;
  eventCategory?: string;
  eventImage?: string;
}

/** Lấy danh sách users từ db.json */
export const getDbUsers = (): any[] => {
  return dbState.users;
};

/** Lấy danh sách sự kiện từ db.json */
export const getDbEvents = (): any[] => {
  return dbState.events;
};

/** Lấy danh sách đăng ký từ db.json */
export const getDbRegistrations = (): any[] => {
  return dbState.registrations;
};

/** Lấy danh sách feedbacks từ db.json */
export const getDbFeedbacks = (): any[] => {
  return dbState.feedbacks;
};

/** Lấy sinh viên mặc định đầu tiên từ db.json (Nguyễn Văn A - SV01) */
export const getDefaultDbUser = () => {
  const firstUser = dbState.users[0];
  if (!firstUser) {
    return {
      _id: '66f1a1010000000000000001',
      id: '66f1a1010000000000000001',
      studentId: 'SV01',
      fullName: 'Nguyễn Văn A',
      name: 'Nguyễn Văn A',
      email: 'sv01@iuh.edu.vn',
      faculty: 'Khoa Công nghệ thông tin',
      point: 38,
      role: 'student',
      phone: '0901234567',
      avatarUrl: 'https://i.pravatar.cc/300?img=12',
    };
  }
  return {
    ...firstUser,
    fullName: firstUser.name || firstUser.fullName || 'Nguyễn Văn A',
    avatarUrl: firstUser.avatarUrl || firstUser.avatar || 'https://i.pravatar.cc/300?img=12',
  };
};

/** Tìm user theo ID hoặc Email */
export const findDbUser = (query?: string) => {
  if (!query) return getDefaultDbUser();
  const found = dbState.users.find(
    (u) =>
      u.id === query ||
      u._id === query ||
      u.email?.toLowerCase() === query.toLowerCase() ||
      u.studentId?.toLowerCase() === query.toLowerCase()
  );
  if (!found) return getDefaultDbUser();
  return {
    ...found,
    fullName: found.name || found.fullName || 'Sinh viên IUH',
    avatarUrl: found.avatarUrl || found.avatar || 'https://i.pravatar.cc/300?img=12',
  };
};

/** Tìm sự kiện theo ID */
export const findDbEvent = (eventId?: string) => {
  if (!eventId) return null;
  return dbState.events.find((e) => e.id === eventId || e._id === eventId) || null;
};

/**
 * Tính toán thống kê hoạt động chính xác từ db.json:
 * - eventsAttended: số sự kiện sinh viên đã tham gia (status: checked_in hoặc completed)
 * - pointsAccumulated: điểm rèn luyện trong db.json
 * - reviews: số lượt đánh giá do sinh viên này gửi trong feedbacks
 */
export const getUserStatsFromDb = (userId?: string): UserStats => {
  const targetUser = findDbUser(userId);
  const uId = targetUser?._id || targetUser?.id;

  const attendedRegs = dbState.registrations.filter((r) => {
    const isUser = r.userId === uId;
    const isAttended = r.status === 'checked_in' || (r.status as string) === 'completed';
    return isUser && isAttended;
  });

  const reviewsCount = dbState.feedbacks.filter(
    (f) => f.userId === uId
  ).length;

  // Tính tổng điểm rèn luyện từ các sự kiện đã tham gia
  const pointsSum = attendedRegs.reduce((sum, r) => {
    const evId =
      typeof r.eventId === 'object' && r.eventId !== null
        ? (r.eventId as any)._id || (r.eventId as any).id
        : r.eventId;
    const ev = dbState.events.find((e) => (e._id || e.id) === evId);
    return sum + (Number(ev?.trainingPoints) || 0);
  }, 0);

  const points =
    pointsSum > 0
      ? pointsSum
      : typeof targetUser?.point === 'number'
      ? targetUser.point
      : 38;

  return {
    eventsAttended: attendedRegs.length,
    pointsAccumulated: points,
    reviews: reviewsCount,
  };
};

/**
 * Lấy danh sách sự kiện người dùng đã tham gia hoặc có trong db.json
 * để người dùng chọn đánh giá
 */
export const getAttendedEventsFromDb = (userId?: string) => {
  const targetUser = findDbUser(userId);
  const uId = targetUser?._id || targetUser?.id;

  const userRegs = dbState.registrations.filter(
    (r) => r.userId === uId && (r.status === 'checked_in' || (r.status as string) === 'completed')
  );

  const registeredEventIds = new Set(
    userRegs.map((r) => (typeof r.eventId === 'object' && r.eventId !== null ? (r.eventId._id || r.eventId.id) : r.eventId))
  );

  // Sự kiện đã đăng ký/tham gia lên trước, các sự kiện khác lên sau
  const sorted = [...dbState.events].sort((a, b) => {
    const aHas = registeredEventIds.has(a.id || a._id);
    const bHas = registeredEventIds.has(b.id || b._id);
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    return 0;
  });

  return sorted;
};

/**
 * Lấy danh sách các sự kiện sinh viên đã tham dự,
 * sắp xếp sự kiện gần nhất lên đầu.
 */
export const getOnlyAttendedEventsFromDb = (userId?: string): any[] => {
  const targetUser = findDbUser(userId);
  const uId = targetUser?._id || targetUser?.id;

  const userRegs = dbState.registrations.filter(
    (r) => r.userId === uId && (r.status === 'checked_in' || (r.status as string) === 'completed')
  );

  const registeredEventIds = new Set(
    userRegs.map((r) => (typeof r.eventId === 'object' && r.eventId !== null ? (r.eventId._id || r.eventId.id) : r.eventId))
  );
  const attendedList = dbState.events.filter((e) => registeredEventIds.has(e.id || e._id));

  const list = attendedList.length > 0 ? attendedList : dbState.events;

  // Sắp xếp sự kiện gần nhất lên đầu (thời gian mới nhất trước)
  return [...list].sort((a, b) => {
    const timeA = new Date(a.time?.start || a.createdAt || 0).getTime();
    const timeB = new Date(b.time?.start || b.createdAt || 0).getTime();
    return timeB - timeA;
  });
};

/**
 * Helper làm giàu dữ liệu đánh giá: gắn thông tin sinh viên và sự kiện tương ứng
 */
export const enrichFeedback = (f: any): EnrichedFeedback => {
  const userIdStr = typeof f.userId === 'object' && f.userId !== null ? (f.userId._id || f.userId.id) : f.userId;
  const eventIdStr = typeof f.eventId === 'object' && f.eventId !== null ? (f.eventId._id || f.eventId.id) : f.eventId;

  const author =
    dbState.users.find((u) => u.id === userIdStr || u._id === userIdStr) ||
    (typeof f.userId === 'object' ? f.userId : null);
  const event =
    dbState.events.find((e) => e.id === eventIdStr || e._id === eventIdStr) ||
    (typeof f.eventId === 'object' ? f.eventId : null);

  return {
    id: f.id || f._id || `fb_${Date.now()}_${Math.random()}`,
    _id: f._id || f.id || `fb_${Date.now()}_${Math.random()}`,
    eventId: eventIdStr,
    userId: userIdStr,
    rating: typeof f.rating === 'number' ? f.rating : 5,
    comment: f.comment || '',
    createdAt: f.createdAt || new Date().toISOString(),
    userName: f.userName || (author ? (author.name || (author as any).fullName) : 'Nguyễn Văn A'),
    userAvatar: f.userAvatar || author?.avatarUrl || (author as any)?.avatar || 'https://i.pravatar.cc/300?img=12',
    userFaculty: f.userFaculty || author?.faculty || 'Khoa Công nghệ thông tin',
    eventTitle: f.eventTitle || event?.title || 'Sự kiện IUH',
    eventCategory: f.eventCategory || event?.category || 'Sự kiện',
    eventImage: f.eventImage || event?.images?.[0] || 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80',
  };
};

/**
 * Lưu danh sách feedbacks vào AsyncStorage để bảo đảm không bị mất khi load lại trang
 */
export const saveFeedbacksToStorage = async (list?: any[]): Promise<void> => {
  try {
    const toSave = list || dbState.feedbacks;
    await AsyncStorage.setItem(FEEDBACKS_STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.warn('[dbService] Error saving feedbacks to AsyncStorage:', err);
  }
};

/**
 * Đọc feedbacks đã lưu từ AsyncStorage và hợp nhất vào dbState
 */
export const loadFeedbacksFromStorage = async (): Promise<EnrichedFeedback[]> => {
  try {
    const raw = await AsyncStorage.getItem(FEEDBACKS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingKeys = new Set(dbState.feedbacks.map((f) => f.id || f._id));
        for (const item of parsed) {
          const key = item.id || item._id;
          if (key && !existingKeys.has(key)) {
            dbState.feedbacks.push(item);
            existingKeys.add(key);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[dbService] Error loading feedbacks from AsyncStorage:', err);
  }
  return getEnrichedFeedbacksFromDb();
};

/**
 * Hợp nhất danh sách feedbacks (từ API hoặc storage) vào dbState và lưu xuống AsyncStorage
 */
export const mergeFeedbacksIntoDb = (incoming: any[]): EnrichedFeedback[] => {
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return getEnrichedFeedbacksFromDb();
  }

  const existingKeys = new Set(dbState.feedbacks.map((f) => f.id || f._id));
  const newItems: any[] = [];

  for (const item of incoming) {
    const key = item.id || item._id;
    if (key && !existingKeys.has(key)) {
      newItems.push(item);
      existingKeys.add(key);
    }
  }

  if (newItems.length > 0) {
    dbState.feedbacks = [...newItems, ...dbState.feedbacks];
    saveFeedbacksToStorage(dbState.feedbacks).catch(() => {});
  }

  return getEnrichedFeedbacksFromDb();
};

/**
 * Lấy danh sách feedbacks được gắn kèm thông tin sự kiện & người dùng từ db.json
 */
export const getEnrichedFeedbacksFromDb = (eventId?: string): EnrichedFeedback[] => {
  let list = dbState.feedbacks;
  if (eventId) {
    list = list.filter((f) => f.eventId === eventId);
  }

  return list.map(enrichFeedback);
};

/**
 * Thêm một đánh giá mới vào bộ dữ liệu dbState và lưu bền vững vào AsyncStorage
 */
export const addFeedbackToDb = (data: {
  eventId: string;
  userId: string;
  rating: number;
  comment: string;
}): EnrichedFeedback => {
  const newId = '66f1f' + Math.floor(1000000000000000000 + Math.random() * 9000000000000000000).toString(16).substring(0, 19);
  const now = new Date().toISOString();

  const newFeedback = {
    id: newId,
    _id: newId,
    eventId: data.eventId,
    userId: data.userId,
    rating: data.rating,
    comment: data.comment,
    createdAt: now,
  };

  dbState.feedbacks.unshift(newFeedback);
  // Tự động lưu bền vững vào local storage
  saveFeedbacksToStorage(dbState.feedbacks).catch(() => {});

  return enrichFeedback(newFeedback);
};

export default {
  getDbUsers,
  getDbEvents,
  getDbRegistrations,
  getDbFeedbacks,
  getDefaultDbUser,
  findDbUser,
  findDbEvent,
  getUserStatsFromDb,
  getAttendedEventsFromDb,
  getOnlyAttendedEventsFromDb,
  enrichFeedback,
  getEnrichedFeedbacksFromDb,
  saveFeedbacksToStorage,
  loadFeedbacksFromStorage,
  mergeFeedbacksIntoDb,
  addFeedbackToDb,
};
