import { format, parseISO } from "date-fns";

export const toLocalOffSetIso = (date: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());

  const offsetMinTotal = -date.getTimezoneOffset();
  const sign = offsetMinTotal >= 0 ? "+" : "-";
  const offH = pad(Math.floor(Math.abs(offsetMinTotal) / 60));
  const offM = pad(Math.abs(offsetMinTotal) % 60);

  return `${y}-${m}-${d}T${hh}:${mm}:${ss}${sign}${offH}:${offM}`;
};

export const parseYMD = (s: string) => parseISO(s);
export const fmtYMD = (d: Date) => format(d, "yyyy-MM-dd");
