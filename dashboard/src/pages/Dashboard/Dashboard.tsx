import { TemperatureChart } from "./Components/TemperatureChart";
import { SidePanel } from "./Components/SidePanel";
import { DateRangePicker } from "./Components/DateRangePicker";

interface DeviceData {
  id: string;
  temperature: number;
  timestamp: string; // ISO
}

interface DashboardProps {
  data: DeviceData[];
  range: { from: string; to: string };
  autoLive?: boolean;
  onRangeChange: (r: { from: string; to: string }) => void;
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  handleLogout: () => void;
}

export const Dashboard = ({
  data,
  range,
  autoLive = true,
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

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">JT-DYNAMIX Dashboard</h1>
        <button
          className="text-sm text-white bg-red-500 hover:bg-red-600 rounded px-4 py-2"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      {/* Range controls */}
      <div className="mb-4 flex items-center gap-4">
        <DateRangePicker value={range} onChange={onRangeChange} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={autoLive} readOnly />
          Live
        </label>
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
              onRangeChange={(r) => onRangeChange(r)} // esim. brush-zoom palauttaa uuden välin
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
