import { TemperatureChart } from "./Components/TemperatureChart";
import { SidePanel } from "./Components/SidePanel";

interface DeviceData {
  id: string;
  temperature: number;
  timestamp: string; // ISO
}

interface DashboardProps {
  data: DeviceData[];
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  handleLogout: () => void;
}

export const Dashboard = ({
  data,
  selectedDeviceId,
  setSelectedDeviceId,
  handleLogout,
}: DashboardProps) => {
  // unique devices + lastSeen (latest timestamp per id)
  const map = new Map<string, string>();
  for (const d of data) {
    const prev = map.get(d.id);
    if (!prev || new Date(d.timestamp) > new Date(prev))
      map.set(d.id, d.timestamp);
  }
  const devices = Array.from(map.entries()).map(([id, lastSeen]) => ({
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

      {/* Main layout */}
      <div className="flex gap-6">
        <SidePanel
          devices={devices}
          selectedId={selectedDeviceId}
          onSelect={(id) => setSelectedDeviceId(id)}
        />

        <main className="flex-1">
          {selectedDeviceId ? (
            <TemperatureChart data={selectedData} />
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
