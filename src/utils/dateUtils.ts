export function formatEventDateTime(
  startString?: string,
  endString?: string,
): string {
  if (!startString || !endString) {
    return "Chưa cập nhật thời gian";
  }

  const start = new Date(startString);
  const end = new Date(endString);

  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
    return "Chưa cập nhật thời gian";
  }

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
  };

  const isSameDay =
    start.getDate() === end.getDate() &&
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();

  if (isSameDay) {
    return `${formatDate(start)} · ${formatTime(start)} - ${formatTime(end)}`;
  }

  return `${formatDate(start)} ${formatTime(start)} - ${formatDate(end)} ${formatTime(end)}`;
}
