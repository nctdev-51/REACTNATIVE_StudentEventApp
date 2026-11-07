import { Event } from "../types/event";

export interface Semester {
  id: string;
  name: string;
  shortName: string;
  start: string;
  end: string;
}

/**
 * Mốc "YYYY-MM-DD" phủ liên tục (kể cả học kỳ hè) để mỗi sự kiện luôn suy ra
 * được đúng một học kỳ.
 */
export const SEMESTERS: Semester[] = [
  {
    id: "2026-2027-HK1",
    name: "Học kỳ 1 - Năm học 2026-2027",
    shortName: "HK1 2026-2027",
    start: "2026-08-01",
    end: "2026-12-31",
  },
  {
    id: "2026-2027-HK2",
    name: "Học kỳ 2 - Năm học 2026-2027",
    shortName: "HK2 2026-2027",
    start: "2027-01-01",
    end: "2027-05-31",
  },
  {
    id: "2026-2027-HK3",
    name: "Học kỳ hè - Năm học 2026-2027",
    shortName: "HK hè 2026-2027",
    start: "2027-06-01",
    end: "2027-07-31",
  },
  {
    id: "2025-2026-HK1",
    name: "Học kỳ 1 - Năm học 2025-2026",
    shortName: "HK1 2025-2026",
    start: "2025-08-01",
    end: "2025-12-31",
  },
  {
    id: "2025-2026-HK2",
    name: "Học kỳ 2 - Năm học 2025-2026",
    shortName: "HK2 2025-2026",
    start: "2026-01-01",
    end: "2026-05-31",
  },
  {
    id: "2025-2026-HK3",
    name: "Học kỳ hè - Năm học 2025-2026",
    shortName: "HK hè 2025-2026",
    start: "2026-06-01",
    end: "2026-07-31",
  },
  {
    id: "2024-2025-HK1",
    name: "Học kỳ 1 - Năm học 2024-2025",
    shortName: "HK1 2024-2025",
    start: "2024-08-01",
    end: "2024-12-31",
  },
  {
    id: "2024-2025-HK2",
    name: "Học kỳ 2 - Năm học 2024-2025",
    shortName: "HK2 2024-2025",
    start: "2025-01-01",
    end: "2025-07-31",
  },
];

/** Danh sách theo thứ tự thời gian mới nhất trước — dùng cho bộ chọn. */
export const SEMESTERS_NEWEST_FIRST: Semester[] = [...SEMESTERS].sort((a, b) =>
  b.start.localeCompare(a.start),
);

export function getSemester(id: string | null): Semester | null {
  if (!id) return null;
  return SEMESTERS.find((s) => s.id === id) ?? null;
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Ưu tiên `semesterId` do admin gán; nếu không có thì suy ra từ ngày bắt đầu.
 * Sự kiện nằm ngoài bảng học kỳ được gán vào học kỳ gần nhất để không bị mất
 * khỏi danh sách. Chuỗi "YYYY-MM-DD" so sánh trực tiếp được, không phụ thuộc
 * timezone của máy.
 */
export function getEventSemesterId(event: Event): string | null {
  if (event.semesterId && getSemester(event.semesterId)) {
    return event.semesterId;
  }

  const start = event.time?.start?.slice(0, 10);
  if (!start) return null;

  const containing = SEMESTERS.find((s) => start >= s.start && start <= s.end);
  if (containing) return containing.id;

  const ordered = [...SEMESTERS].sort((a, b) => a.start.localeCompare(b.start));
  if (start < ordered[0].start) return ordered[0].id;
  return ordered[ordered.length - 1].id;
}

export function filterEventsBySemester(
  events: Event[],
  semesterId: string | null,
): Event[] {
  if (!semesterId) return events;
  return events.filter((event) => getEventSemesterId(event) === semesterId);
}

/** Học kỳ đang diễn ra, hoặc học kỳ gần nhất nếu hôm nay rơi vào khoảng nghỉ. */
export function getCurrentSemesterId(today: Date = new Date()): string {
  const iso = toIsoDate(today);

  const ongoing = SEMESTERS.find((s) => iso >= s.start && iso <= s.end);
  if (ongoing) return ongoing.id;

  const ordered = [...SEMESTERS].sort((a, b) => a.start.localeCompare(b.start));
  const upcoming = ordered.find((s) => s.start > iso);
  return upcoming?.id ?? ordered[ordered.length - 1].id;
}

export function isSemesterCurrent(
  semesterId: string,
  today: Date = new Date(),
): boolean {
  return getCurrentSemesterId(today) === semesterId;
}

export function countEventsInSemester(
  events: Event[],
  semesterId: string,
): number {
  return events.filter((event) => getEventSemesterId(event) === semesterId).length;
}

export function formatSemesterRange(semester: Semester): string {
  const fmt = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };
  return `${fmt(semester.start)} – ${fmt(semester.end)}`;
}