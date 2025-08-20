import { getCurrentUser, signOut } from "aws-amplify/auth";
import { useEffect, useState } from "react";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { Login } from "./pages/Login/Login";
import { fetchAllUserReadings, fetchReadingBounds } from "./services/api";
import { Reading } from "./services/types";
import { toLocalOffSetIso as toLocalOffsetIso } from "./utils/utils";

interface DeviceData {
  id: string;
  temperature: number;
  timestamp: string;
}

const THREE_WEEKS = 21 * 864e5;

function App() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<DeviceData[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bounds, setBounds] = useState<{ min: string; max: string } | null>(
    null
  );

  const [range, setRange] = useState(() => ({
    from: toLocalOffsetIso(new Date(Date.now() - THREE_WEEKS)),
    to: toLocalOffsetIso(),
  }));

  const [autoLive] = useState(true);

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

    const load = async (r = range) => {
      try {
        setError(null);

        const items = await fetchAllUserReadings({
          from: r.from,
          to: r.to,
          pageSize: 500,
        });
        const b = await fetchReadingBounds();
        if (cancelled) return;
        if (!b?.min || !b?.max) {
          const today = new Date().toISOString();
          setBounds({ min: today, max: today });
        } else {
          setBounds({ min: b.min, max: b.max });
        }
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
      setRange((prev) => ({
        ...prev,
        to: toLocalOffsetIso(),
      }));
      load();
    }, 60000);

    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [user, range.from, range.to]);

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
        range={range}
        bounds={bounds}
        autoLive={autoLive}
        onRangeChange={(r) => setRange(r)}
        selectedDeviceId={selectedDeviceId}
        setSelectedDeviceId={setSelectedDeviceId}
        handleLogout={handleLogout}
      />
    </>
  );
}

export default App;
