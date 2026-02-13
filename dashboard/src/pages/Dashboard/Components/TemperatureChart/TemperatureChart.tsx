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
import { useTheme } from "src/contexts/ThemeContext";
import { fmtTime } from "src/utils/dateFormatter";
import { Range } from "src/utils/types";
import { MultiPoint, bucketizeMulti } from "src/utils/utils";

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
}: Readonly<{
  data: MultiPoint[];
  range: Range;
}>) {
  const { resolved } = useTheme();
  const isDark = resolved === "dark";

  const chartColors = isDark
    ? {
        grid: "#2d2626",
        axis: "#3d3434",
        tick: "#a39999",
        label: "#f5f0f0",
        tooltipBg: "#1a1717",
        tooltipBorder: "#2d2626",
      }
    : {
        grid: "#e5e5e5",
        axis: "#d4d4d4",
        tick: "#737373",
        label: "#171717",
        tooltipBg: "#ffffff",
        tooltipBorder: "#e5e5e5",
      };

  const { rows, deviceIds } = useMemo(
    () => bucketizeMulti(data, range),
    [data, range],
  );
  // Determine X domain: if data span is much smaller than selected range, zoom to data.
  const dataMin = rows.length
    ? Math.min(...rows.map((r) => r.ts as number))
    : new Date(range.from).getTime();

  const dataMax = rows.length
    ? Math.max(...rows.map((r) => r.ts as number))
    : new Date(range.to).getTime();

  const selectedSpan =
    new Date(range.to).getTime() - new Date(range.from).getTime();

  const dataSpan = dataMax - dataMin;

  const useDataDomain = dataSpan > 0 && dataSpan < selectedSpan / 5;

  const xDomain = useDataDomain
    ? [dataMin, dataMax]
    : [new Date(range.from).getTime(), new Date(range.to).getTime()];

  return (
    <div className="w-full h-[360px] sm:h-[420px] min-h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={rows}
          margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
          <XAxis
            dataKey="ts"
            type="number"
            domain={xDomain}
            tickFormatter={(v) => fmtTime(new Date(v))}
            stroke={chartColors.axis}
            tick={{ fill: chartColors.tick, fontSize: 12 }}
          />
          <YAxis
            unit="°C"
            width={48}
            stroke={chartColors.axis}
            tick={{ fill: chartColors.tick, fontSize: 12 }}
          />
          <Tooltip
            labelFormatter={(v) => new Date(v as number).toLocaleString()}
            formatter={(val) => {
              if (typeof val === "number") {
                return [`${val.toFixed(2)} °C`];
              }
              return ["N/A"];
            }}
            contentStyle={{
              background: chartColors.tooltipBg,
              border: `1px solid ${chartColors.tooltipBorder}`,
              borderRadius: "0.75rem",
              padding: "0.5rem 0.75rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
            labelStyle={{ color: chartColors.label }}
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
