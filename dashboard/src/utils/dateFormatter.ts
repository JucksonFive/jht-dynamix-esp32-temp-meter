import { format, parseISO } from "date-fns";
/**
 * Formats a date string to Finnish locale format: dd.MM.yyyy HH:mm
 * @param dateString - ISO date string or any valid date format
 * @returns Formatted date string in format "27.11.2025 14:30"
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);

  const datePart = date.toLocaleDateString("fi-FI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const timePart = date.toLocaleTimeString("fi-FI", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${datePart} ${timePart}`;
};

/**
 * Formats a date string to Finnish locale date only: dd.MM.yyyy
 * @param dateString - ISO date string or any valid date format
 * @returns Formatted date string in format "27.11.2025"
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("fi-FI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Formats a date string to Finnish locale time only: HH:mm
 * @param dateString - ISO date string or any valid date format
 * @returns Formatted time string in format "14:30"
 */
export const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString("fi-FI", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const toLocalOffsetIso = (date: Date = new Date()) =>
  format(date, "yyyy-MM-dd'T'HH:mm:ssXXX");

export const parseYMD = (s: string) => parseISO(s);
export const fmtYMD = (d: Date) => format(d, "yyyy-MM-dd");

// ---------------- Temperature chart helpers ----------------

export const fmtTime = (d: Date) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "2-digit",
  }).format(d);
