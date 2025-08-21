import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Range } from "../../../utils/types";

interface MultiPoint {
  id: string;
  timestamp: string;
  temperature: number;
}

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
  if (ms <= 12 * 3600_000) return 5 * 60_000;
  if (ms <= 3 * 86400_000) return 15 * 60_000;
  if (ms <= 14 * 86400_000) return 60 * 60_000;
  if (ms <= 60 * 86400_000) return 6 * 3600_000;
  return 24 * 3600_000;
}

function bucketizeMulti(points: MultiPoint[], r: Range) {
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
      const out: any = { ts: new Date(row.ts) };
      for (const id of Object.keys(row.per)) {
        const c = row.per[id];
        out[id] = c.sum / c.n;
      }
      return out;
    })
    .sort((a, b) => +a.ts - +b.ts);
  return { rows, deviceIds };
}

const PALETTE = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#0d9488",
  "#db2777",
  "#4b5563",
];

export function TemperatureChart({
  data,
  range,
}: {
  data: MultiPoint[];
  range: Range;
}) {
  const { rows, deviceIds } = useMemo(
    () => bucketizeMulti(data, range),
    [data, range.from, range.to]
  );

  const xDomain = [
    new Date(range.from).getTime(),
    new Date(range.to).getTime(),
  ];

  return (
    <div className="h-[420px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="ts"
            type="number"
            domain={xDomain}
            tickFormatter={(v) => fmtTime(new Date(v))}
          />
          <YAxis unit="°C" width={48} />
          <Tooltip
            labelFormatter={(v) => new Date(v as number).toLocaleString()}
            formatter={(val: any, name) => [
              `${(val as number).toFixed(2)} °C`,
              name,
            ]}
          />
          <Legend />
          {deviceIds.map((id, i) => (
            <Line
              key={id}
              type="monotone"
              dataKey={id}
              stroke={PALETTE[i % PALETTE.length]}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
