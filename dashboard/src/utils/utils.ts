import { format, parseISO } from "date-fns";
import { Range } from "./types";

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

// ---------------- Temperature chart helpers ----------------

export const fmtTime = (d: Date) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "2-digit",
  }).format(d);

export interface MultiPoint {
  id: string;
  timestamp: string;
  temperature: number;
}

export function spanMs(r: Range) {
  return Math.max(0, +new Date(r.to) - +new Date(r.from));
}

export function pickBucketMs(ms: number) {
  if (ms <= 12 * 3600_000) return 5 * 60_000; // 5 min
  if (ms <= 3 * 86400_000) return 15 * 60_000; // 15 min
  if (ms <= 14 * 86400_000) return 60 * 60_000; // 1 hour
  if (ms <= 60 * 86400_000) return 6 * 3600_000; // 6 hours
  return 24 * 3600_000; // 1 day
}

export function bucketizeMulti(points: MultiPoint[], r: Range) {
  if (!points.length) return { rows: [], deviceIds: [] as string[] };
  const ms = spanMs(r);
  const bucket = pickBucketMs(ms);
  const acc: Record<
    number,
    { ts: number; per: Record<string, { sum: number; n: number }> }
  > = {};
  const deviceSet = new Set<string>();
  for (const p of points) {
    const t = +new Date(p.timestamp);
    const key = Math.floor(t / bucket) * bucket;
    const row = (acc[key] ||= { ts: key, per: {} });
    const cell = (row.per[p.id] ||= { sum: 0, n: 0 });
    cell.sum += p.temperature;
    cell.n += 1;
    deviceSet.add(p.id);
  }
  const deviceIds = Array.from(deviceSet).sort();
  const rows = Object.values(acc)
    .map((row) => {
      const out: Record<string, any> = { ts: new Date(row.ts) };
      for (const id of Object.keys(row.per)) {
        const c = row.per[id];
        out[id] = c.sum / c.n;
      }
      return out;
    })
    .sort((a, b) => +(a.ts as Date) - +(b.ts as Date));
  return { rows, deviceIds };
}

export const clampRange = (r: Range, bounds: Range): Range => ({
  from: r.from < bounds.from ? bounds.from : r.from,
  to: r.to > bounds.to ? bounds.to : r.to,
});

export const isAllTime = (r: Range, b: Range) =>
  r.from === b.from && r.to === b.to;
