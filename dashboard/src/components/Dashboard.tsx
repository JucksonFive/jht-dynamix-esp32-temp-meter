import { TemperatureChart } from "./TemperatureChart";

interface DeviceData {
  id: string;
  temperature: number;
  timestamp: string;
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
  const uniqueDevices = Array.from(new Set(data.map((d) => d.id)));
  const selectedData = selectedDeviceId
    ? data.filter((d) => d.id === selectedDeviceId)
    : [];

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

      <div className="mb-4">
        <label className="block mb-1 text-gray-700">Select Device:</label>
        <select
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="">-- Select a device --</option>
          {uniqueDevices.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>

      {selectedDeviceId ? (
        <TemperatureChart data={selectedData} />
      ) : (
        <p className="text-gray-500">Select a device to view data.</p>
      )}
    </div>
  );
};
