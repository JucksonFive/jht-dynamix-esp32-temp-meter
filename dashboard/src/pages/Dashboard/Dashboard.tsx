import { format, isAfter, isBefore, parseISO } from "date-fns";
import { useMemo } from "react";
import { DateRangePicker } from "./Components/DateRangePicker";
import { SidePanel } from "./Components/SidePanel";
import { TemperatureChart } from "./Components/TemperatureChart";

const parseYMD = (s: string) => parseISO(s);
const fmtYMD = (d: Date) => format(d, "yyyy-MM-dd");
interface DeviceData {
  id: string;
  temperature: number;
  timestamp: string;
}
interface DashboardProps {
  data: DeviceData[];
  bounds: { min: string; max: string } | null;
  range: { from: string; to: string };
  onRangeChange: (r: { from: string; to: string }) => void;
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  handleLogout: () => void;
  loading: boolean;
}

export const Dashboard = ({
  data,
  bounds,
  range,
  onRangeChange,
  selectedDeviceId,
  setSelectedDeviceId,
  handleLogout,
}: DashboardProps) => {
  const lastSeenMap = new Map<string, string>();
  for (const d of data) {
    const prev = lastSeenMap.get(d.id);
    if (!prev || prev < d.timestamp) lastSeenMap.set(d.id, d.timestamp);
  }
  const devices = Array.from(lastSeenMap, ([id, lastSeen]) => ({
    id,
    lastSeen,
  }));

  const selectedData = selectedDeviceId
    ? data.filter((d) => d.id === selectedDeviceId)
    : [];

  const clampedRange = useMemo(() => {
    if (!bounds) return range;
    const min = parseYMD(bounds.min);
    const max = parseYMD(bounds.max);
    const f = parseYMD(range.from);
    const t = parseYMD(range.to);
    const cf = isBefore(f, min) ? min : isAfter(f, max) ? max : f;
    const ct = isBefore(t, min) ? min : isAfter(t, max) ? max : t;
    return { from: fmtYMD(cf), to: fmtYMD(ct) };
  }, [range.from, range.to, bounds?.min, bounds?.max]);

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">JT-DYNAMIX Dashboard</h1>
        <button
          className="text-sm text-white bg-red-500 hover:bg-red-600 rounded px-4 py-2"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <DateRangePicker
          value={clampedRange}
          onChange={onRangeChange}
          // @ts-ignore
          allowed={bounds ?? { min: clampedRange.from, max: clampedRange.to }}
        />
      </div>

      {/* Main layout */}
      <div className="flex gap-6">
        <SidePanel
          devices={devices}
          selectedId={selectedDeviceId}
          onSelect={setSelectedDeviceId}
        />

        <main className="flex-1">
          {selectedDeviceId ? (
            <TemperatureChart
              data={selectedData.map((d) => ({
                timestamp: d.timestamp,
                temperature: d.temperature,
              }))}
              range={range}
              onRangeChange={(r) => onRangeChange(r)}
            />
          ) : (
            <div className="h-full grid place-items-center">
              <p className="text-gray-500">
                Select a device from the left to view data.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
