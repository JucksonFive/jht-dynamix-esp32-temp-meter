import { Range } from "src/utils/types";

export interface MultiPoint {
  id: string;
  timestamp: string;
  temperature: number;
}

export function spanMs(r: Range) {
  return Math.max(0, +new Date(r.to) - +new Date(r.from));
}

export function pickBucketMs(ms: number) {
  if (ms <= 3600_000) return 60_000; // 1 min for intervals <= 1h
  if (ms <= 12 * 3600_000) return 5 * 60_000; // 5 min
  if (ms <= 3 * 86400_000) return 15 * 60_000; // 15 min
  if (ms <= 14 * 86400_000) return 60 * 60_000; // 1 hour
  if (ms <= 60 * 86400_000) return 6 * 3600_000; // 6 hours
  return 24 * 3600_000; // 1 day
}

export function bucketizeMulti(points: MultiPoint[], r: Range) {
  if (!points.length) return { rows: [], deviceIds: [] as string[] };

  const getTime = (p: MultiPoint) => new Date(p.timestamp).getTime();
  const minTs = points.reduce(
    (acc, p) => Math.min(acc, getTime(p)),
    Number.POSITIVE_INFINITY
  );
  const maxTs = points.reduce(
    (acc, p) => Math.max(acc, getTime(p)),
    Number.NEGATIVE_INFINITY
  );

  const ms = Math.max(0, Math.min(spanMs(r), maxTs - minTs) || 1);
  const bucket = pickBucketMs(ms);

  const acc: Record<
    number,
    { ts: number; per: Record<string, { sum: number; n: number }> }
  > = {};
  const deviceSet = new Set<string>();

  for (const p of points) {
    const t = getTime(p);
    const key = Math.floor((t - minTs) / bucket) * bucket + minTs;

    const row = (acc[key] ||= { ts: key, per: {} });
    const cell = (row.per[p.id] ||= { sum: 0, n: 0 });
    cell.sum += p.temperature;
    cell.n += 1;
    deviceSet.add(p.id);
  }

  const deviceIds = Array.from(deviceSet).sort();
  const rows = Object.values(acc)
    .map((row) => {
      const out: Record<string, unknown> = { ts: new Date(row.ts) };
      for (const id of Object.keys(row.per)) {
        const c = row.per[id];
        out[id] = c.sum / c.n;
      }
      return out;
    })
    .sort((a, b) => +(a.ts as Date) - +(b.ts as Date));

  return { rows, deviceIds };
}
