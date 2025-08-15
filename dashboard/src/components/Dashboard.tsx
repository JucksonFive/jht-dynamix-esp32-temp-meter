import { TemperatureChart } from "./TemperatureChart";

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

export const DeviceList = ({
  devices,
  selectedId,
  onSelect,
}: {
  devices: { id: string; lastSeen?: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
}) => {
  return (
    <aside className="w-72 shrink-0 border-r border-gray-200 bg-gray-50 h-[calc(100vh-5rem)] overflow-y-auto rounded-lg">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-3">Devices</h2>
        <ul className="space-y-2">
          {devices.map((d) => {
            const isActive = d.id === selectedId;
            return (
              <li key={d.id}>
                <button
                  onClick={() => onSelect(d.id)}
                  className={[
                    "w-full text-left px-3 py-2 rounded-md transition",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-white hover:bg-gray-100 text-gray-800 border border-gray-200",
                  ].join(" ")}
                  aria-current={isActive ? "page" : undefined}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{d.id}</span>
                    {d.lastSeen && (
                      <span
                        className={
                          "text-xs " +
                          (isActive ? "text-blue-100" : "text-gray-500")
                        }
                      >
                        {new Date(d.lastSeen).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
          {devices.length === 0 && (
            <li className="text-sm text-gray-500">No devices yet.</li>
          )}
        </ul>
      </div>
    </aside>
  );
};

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
        <DeviceList
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
