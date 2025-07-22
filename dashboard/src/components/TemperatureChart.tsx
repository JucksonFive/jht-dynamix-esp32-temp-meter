import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type TemperatureData = {
  timestamp: string;
  temperature: number;
};

export const TemperatureChart = ({ data }: { data: TemperatureData[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="timestamp"
        tickFormatter={(t) => new Date(t).toLocaleTimeString()}
      />
      <YAxis unit="°C" />
      <Tooltip labelFormatter={(t) => new Date(t).toLocaleString()} />
      <Line
        type="monotone"
        dataKey="temperature"
        stroke="#2D9CDB"
        strokeWidth={2}
        dot={false}
      />
    </LineChart>
  </ResponsiveContainer>
);
