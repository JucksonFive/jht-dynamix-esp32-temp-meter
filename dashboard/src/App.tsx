import { getCurrentUser, signOut } from "aws-amplify/auth";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDevices } from "./hooks/useDevices";
import { useReadings } from "./hooks/useReadings";
import "./locale/i18n"; // initialize i18
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { Login } from "./pages/Login/Login";
import { type Range } from "./utils/types";
import { toLocalOffSetIso as toLocalOffsetIso } from "./utils/utils";

const THREE_WEEKS = 21 * 864e5;
const MINUTE = 60 * 1000;

function App() {
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);

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

  const { devices, loading: devicesLoading, removeDevice } = useDevices(user);

  const [range, setRange] = useState<Range>(() => {
    const now = toLocalOffsetIso();
    const from = toLocalOffsetIso(new Date(Date.now() - THREE_WEEKS));
    return { from, to: now };
  });

  const {
    data,
    loading: dataLoading,
    error: dataError,
  } = useReadings(user, range, {
    intervalMs: MINUTE,
  });

  const handleLogout = async () => {
    await signOut();
    setUser(null);
  };

  const handleDeviceDeleted = (id: string) => {
    removeDevice(id);
    setSelectedDeviceIds((prev) => prev.filter((did) => did !== id));
  };

  if (bootLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        {t("loading")}
      </div>
    );
  }
  if (!user) return <Login setUser={setUser} />;

  return (
    <>
      {dataError && (
        <div className="p-2 mb-2 text-sm text-white bg-red-500 rounded">
          {dataError}
        </div>
      )}

      <Dashboard
        data={data}
        devices={devices}
        range={range}
        onRangeChange={(r) => setRange(r)}
        selectedDeviceIds={selectedDeviceIds}
        setSelectedDeviceIds={setSelectedDeviceIds}
        handleLogout={handleLogout}
        loading={dataLoading || devicesLoading}
        onDeviceDeleted={handleDeviceDeleted}
      />
    </>
  );
}

export default App;
