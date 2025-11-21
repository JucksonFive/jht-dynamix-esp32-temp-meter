import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Range } from "../../../utils/types";
import { MultiPoint, bucketizeMulti, fmtTime } from "../../../utils/utils";

const PALETTE = [
  "#818cf8", // indigo-400
  "#d946ef", // fuchsia-500
  "#06b6d4", // cyan-500
  "#f472b6", // pink-400
  "#a855f7", // purple-500
  "#6366f1", // indigo-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
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
    <div className="w-full h-[360px] sm:h-[420px] min-h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={rows}
          margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis
            dataKey="ts"
            type="number"
            domain={xDomain}
            tickFormatter={(v) => fmtTime(new Date(v))}
            stroke="#9ca3af"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
          />
          <YAxis
            unit="°C"
            width={48}
            stroke="#9ca3af"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
          />
          <Tooltip
            labelFormatter={(v) => new Date(v as number).toLocaleString()}
            formatter={(val: any, name) => [
              `${(val as number).toFixed(2)} °C`,
              name,
            ]}
            contentStyle={{
              background: "#1c2330",
              border: "1px solid #334155",
              borderRadius: "0.75rem",
              padding: "0.5rem 0.75rem",
            }}
            labelStyle={{ color: "#e2e8f0" }}
          />
          <Legend />
          {deviceIds.map((id, i) => (
            <Line
              key={id}
              type="monotone"
              dataKey={id}
              stroke={PALETTE[i % PALETTE.length]}
              dot={{ r: 2 }}
              strokeWidth={2}
              isAnimationActive={false}
              strokeOpacity={0.95}
              activeDot={{
                r: 4,
                strokeWidth: 0,
                fill: PALETTE[i % PALETTE.length],
              }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
