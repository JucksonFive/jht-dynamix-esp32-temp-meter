// TemperatureChart.tsx
import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { timestamp: string; temperature: number };
type Range = { from: string; to: string };

const fmtTime = (d: Date) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "2-digit",
  }).format(d);

function spanMs(r: Range) {
  return Math.max(0, +new Date(r.to) - +new Date(r.from));
}

function pickBucketMs(ms: number) {
  // ~target points ~150–300
  if (ms <= 12 * 3600_000) return 5 * 60_000; // ≤12h → 5 min
  if (ms <= 3 * 86400_000) return 15 * 60_000; // ≤3d → 15 min
  if (ms <= 14 * 86400_000) return 60 * 60_000; // ≤2vko → 1 h
  if (ms <= 60 * 86400_000) return 6 * 3600_000; // ≤60d → 6 h
  return 24 * 3600_000; // >60d → 1 d
}

function bucketize(points: Point[], r: Range) {
  const ms = spanMs(r);
  const bucket = pickBucketMs(ms);
  const acc: Record<number, { sum: number; n: number }> = {};
  for (const p of points) {
    const t = +new Date(p.timestamp);
    const key = Math.floor(t / bucket) * bucket;
    const a = (acc[key] ||= { sum: 0, n: 0 });
    a.sum += p.temperature;
    a.n += 1;
  }
  return Object.entries(acc)
    .map(([k, v]) => ({ ts: new Date(+k), temperature: v.sum / v.n }))
    .sort((a, b) => +a.ts - +b.ts);
}

export function TemperatureChart({
  data,
  range,
}: {
  data: Point[]; // raw points (already filtered by range on backend)
  range: Range; // current fetch range
  onRangeChange?: (r: Range) => void; // called when brush changes
}) {
  const series = useMemo(
    () => bucketize(data, range),
    [data, range.from, range.to]
  );

  const xDomain = [new Date(range.from), new Date(range.to)];

  return (
    <div className="h-[420px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="ts"
            type="number"
            domain={[xDomain[0].getTime(), xDomain[1].getTime()]}
            tickFormatter={(v) => fmtTime(new Date(v))}
          />
          <YAxis unit="°C" width={48} />
          <Tooltip
            labelFormatter={(v) => new Date(v as number).toLocaleString()}
            formatter={(val: any) => [
              `${(val as number).toFixed(2)} °C`,
              "Temp",
            ]}
          />
          <Line
            type="monotone"
            dataKey="temperature"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
