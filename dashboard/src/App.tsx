import { getCurrentUser, signOut } from "aws-amplify/auth";
import { useEffect, useState } from "react";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { Login } from "./pages/Login/Login";
import { fetchAllUserReadings } from "./services/api";
import { Reading } from "./services/types";
import { toLocalOffSetIso } from "./utils/utils";

interface DeviceData {
  id: string; // mapped from deviceId
  temperature: number;
  timestamp: string;
}

function App() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<DeviceData[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // optional: viimeiset 7 päivää
  const [from] = useState(
    () => toLocalOffSetIso(new Date(Date.now() - 7 * 24 * 3600 * 1000)) // 👈 local offset
  );
  const [to, setTo] = useState(() => toLocalOffSetIso());

  useEffect(() => {
    (async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // data fetch + 30s auto-refresh
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      try {
        setError(null);
        const items = await fetchAllUserReadings({ from, to, pageSize: 500 });
        if (cancelled) return;
        setData(
          items.map((r: Reading) => ({
            id: r.deviceId,
            temperature: r.temperature,
            timestamp: r.timestamp,
          }))
        );
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Fetch failed");
      }
    };

    load();
    const iv = setInterval(() => {
      setTo(() => toLocalOffSetIso()); // päivitä 'to' => triggeröi refetch
      load();
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [user, from, to]);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }
  if (!user) return <Login setUser={setUser} />;

  return (
    <>
      {error && (
        <div className="p-2 mb-2 text-sm text-white bg-red-500 rounded">
          {error}
        </div>
      )}
      <Dashboard
        data={data}
        selectedDeviceId={selectedDeviceId}
        setSelectedDeviceId={setSelectedDeviceId}
        handleLogout={handleLogout}
      />
    </>
  );
}

export default App;
