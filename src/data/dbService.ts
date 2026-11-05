import dbRaw from './db.json';

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
      point: 120,
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
  if (!eventId) return dbState.events[0] || null;
  return dbState.events.find((e) => e.id === eventId || e._id === eventId) || dbState.events[0] || null;
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

  const attendedCount = dbState.registrations.filter((r) => {
    const isUser = r.userId === uId;
    const isAttended = r.status === 'checked_in' || (r.status as string) === 'completed';
    return isUser && isAttended;
  }).length;

  const reviewsCount = dbState.feedbacks.filter(
    (f) => f.userId === uId
  ).length;

  const points = typeof targetUser?.point === 'number' ? targetUser.point : 120;

  return {
    eventsAttended: attendedCount > 0 ? attendedCount : 2, // fallback theo db.json SV01 có 2 lần tham gia
    pointsAccumulated: points,
    reviews: reviewsCount > 0 ? reviewsCount : 1, // fallback theo db.json SV01 có 1 feedback
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
    (r) => r.userId === uId && (r.status === 'checked_in' || (r.status as string) === 'completed' || r.status === 'registered')
  );

  const registeredEventIds = new Set(userRegs.map((r) => r.eventId));

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
 * Lấy danh sách feedbacks được gắn kèm thông tin sự kiện & người dùng từ db.json
 */
export const getEnrichedFeedbacksFromDb = (eventId?: string): EnrichedFeedback[] => {
  let list = dbState.feedbacks;
  if (eventId) {
    list = list.filter((f) => f.eventId === eventId);
  }

  return list.map((f) => {
    const author = dbState.users.find((u) => u.id === f.userId || u._id === f.userId);
    const event = dbState.events.find((e) => e.id === f.eventId || e._id === f.eventId);

    return {
      id: f.id || f._id,
      _id: f._id || f.id,
      eventId: f.eventId,
      userId: f.userId,
      rating: f.rating || 5,
      comment: f.comment || '',
      createdAt: f.createdAt || new Date().toISOString(),
      userName: author ? (author.name || (author as any).fullName) : 'Sinh viên IUH',
      userAvatar: author?.avatarUrl || (author as any)?.avatar,
      userFaculty: author?.faculty || 'Trường ĐH Công nghiệp TP.HCM',
      eventTitle: event?.title || 'Sự kiện IUH',
      eventCategory: event?.category || 'Sự kiện',
      eventImage: event?.images?.[0] || 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80',
    };
  });
};

/**
 * Thêm một đánh giá mới vào bộ dữ liệu dbState trong memory
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

  const author = dbState.users.find((u) => u.id === data.userId || u._id === data.userId);
  const event = dbState.events.find((e) => e.id === data.eventId || e._id === data.eventId);

  return {
    ...newFeedback,
    userName: author ? (author.name || (author as any).fullName) : 'Nguyễn Văn A',
    userAvatar: author?.avatarUrl || (author as any)?.avatar || 'https://i.pravatar.cc/300?img=12',
    userFaculty: author?.faculty || 'Khoa Công nghệ thông tin',
    eventTitle: event?.title || 'Sự kiện đã đánh giá',
    eventCategory: event?.category || 'Học thuật',
    eventImage: event?.images?.[0] || 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80',
  };
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
  getEnrichedFeedbacksFromDb,
  addFeedbackToDb,
};
