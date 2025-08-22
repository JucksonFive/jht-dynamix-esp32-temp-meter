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
import { MultiPoint, bucketizeMulti, fmtTime } from "../../../utils/utils";

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
    <div className="w-full h-[360px] sm:h-[420px] min-h-[260px]">
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
