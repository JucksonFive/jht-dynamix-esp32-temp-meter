// App.tsx
import { getCurrentUser, signOut } from "aws-amplify/auth";
import { useEffect, useMemo, useState } from "react";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { Login } from "./pages/Login/Login";
import { toLocalOffSetIso as toLocalOffsetIso } from "./utils/utils";
import { useReadingBounds } from "./hooks/useReadingBounds";
import { useReadings } from "./hooks/useReadings";
import { clampRange, type Range } from "./utils/types";

const THREE_WEEKS = 21 * 864e5;

function App() {
  const [user, setUser] = useState<any>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  // auth bootstrap
  const [bootLoading, setBootLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const u = await getCurrentUser();
        setUser(u);
      } catch {
        setUser(null);
      } finally {
        setBootLoading(false);
      }
    })();
  }, []);

  // bounds
  const {
    bounds,
    loading: boundsLoading,
    error: boundsError,
  } = useReadingBounds(user);

  // range (init kun bounds ladattu)
  const [range, setRange] = useState<Range>(() => {
    const now = toLocalOffsetIso();
    const from = toLocalOffsetIso(new Date(Date.now() - THREE_WEEKS));
    return { from, to: now };
  });

  useEffect(() => {
    if (!bounds) return;
    const maxD = new Date(bounds.max);
    const start = new Date(
      Math.max(new Date(bounds.min).getTime(), maxD.getTime() - THREE_WEEKS)
    );
    setRange({ from: toLocalOffsetIso(start), to: toLocalOffsetIso(maxD) });
  }, [bounds?.min, bounds?.max]); // init tai kun bounds päivittyy

  // readings
  const clampedRange = useMemo(
    () =>
      bounds ? clampRange(range, { from: bounds.min, to: bounds.max }) : range,
    [range, bounds]
  );
  const {
    data,
    loading: dataLoading,
    error: dataError,
  } = useReadings(user, clampedRange, {
    intervalMs: 60000,
  });

  const handleLogout = async () => {
    await signOut();
    setUser(null);
  };

  if (bootLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }
  if (!user) return <Login setUser={setUser} />;

  const error = boundsError || dataError;

  return (
    <>
      {error && (
        <div className="p-2 mb-2 text-sm text-white bg-red-500 rounded">
          {error}
        </div>
      )}

      <Dashboard
        data={data}
        bounds={bounds}
        range={clampedRange}
        onRangeChange={(r) => setRange(r)}
        selectedDeviceId={selectedDeviceId}
        setSelectedDeviceId={setSelectedDeviceId}
        handleLogout={handleLogout}
        loading={boundsLoading || dataLoading}
      />
    </>
  );
}

export default App;
