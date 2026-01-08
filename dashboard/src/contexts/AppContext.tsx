import { getCurrentUser, signOut } from "aws-amplify/auth";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useDevices } from "src/hooks/useDevices";
import { useReadings } from "src/hooks/useReadings";
import { Device } from "src/services/types";
import { toLocalOffsetIso } from "src/utils/dateFormatter";
import { DeviceData, Nullable, Range, User } from "src/utils/types";
const ONE_DAY = 864e5;
const MINUTE = 60 * 1000;

interface AppContextType {
  // User
  user: Nullable<User>;
  bootLoading: boolean;
  handleLogout: () => Promise<void>;

  // Devices
  devices: Device[];
  devicesLoading: boolean;
  removeDevice: (id: string) => void;
  handleDeviceDeleted: (id: string) => void;

  // Readings
  data: DeviceData[];
  dataLoading: boolean;
  dataError: Nullable<string>;

  // Range
  range: Range;
  setRange: React.Dispatch<React.SetStateAction<Range>>;

  // Selection
  selectedDeviceIds: string[];
  setSelectedDeviceIds: React.Dispatch<React.SetStateAction<string[]>>;

  lastSeen: Map<string, string>;
  setLastSeen: React.Dispatch<React.SetStateAction<Map<string, string>>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Nullable<User>>(null);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [bootLoading, setBootLoading] = useState(true);
  const [didInitRangeFromDevices, setDidInitRangeFromDevices] = useState(false);
  // Initialize user
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

  // Devices
  const { devices, loading: devicesLoading, removeDevice } = useDevices(user);

  // Range
  const [range, setRange] = useState<Range>(() => {
    const now = toLocalOffsetIso();
    const from = toLocalOffsetIso(new Date(Date.now() - ONE_DAY));
    return { from, to: now };
  });

  useEffect(() => {
    if (didInitRangeFromDevices) return;
    if (!devices.length) return;

    const latestUpdatedAtMs = Math.max(
      ...devices
        .map((d) => new Date(d.updatedAt).getTime())
        .filter((ms) => Number.isFinite(ms))
    );

    if (!Number.isFinite(latestUpdatedAtMs)) {
      setDidInitRangeFromDevices(true);
      return;
    }

    setRange((prev) => {
      const prevToMs = new Date(prev.to).getTime();
      const nowMs = Date.now();
      const prevLooksLikeDefaultNow =
        Number.isFinite(prevToMs) && Math.abs(prevToMs - nowMs) < 2 * MINUTE;

      if (!prevLooksLikeDefaultNow) return prev;

      const to = toLocalOffsetIso(new Date(latestUpdatedAtMs));
      const from = toLocalOffsetIso(new Date(latestUpdatedAtMs - ONE_DAY));
      return { from, to };
    });

    setDidInitRangeFromDevices(true);
  }, [devices, didInitRangeFromDevices]);

  useEffect(() => {
    if (!selectedDeviceIds.length) return;
    if (!devices.length) return;

    const selectedUpdatedAtMs = devices
      .filter((d) => selectedDeviceIds.includes(d.deviceId))
      .map((d) => new Date(d.updatedAt).getTime())
      .filter((ms) => Number.isFinite(ms));

    if (!selectedUpdatedAtMs.length) return;

    const latestSelectedUpdatedAtMs = Math.max(...selectedUpdatedAtMs);

    setRange((prev) => {
      const prevFromMs = new Date(prev.from).getTime();
      const prevToMs = new Date(prev.to).getTime();
      const prevSpanMs =
        Number.isFinite(prevFromMs) &&
        Number.isFinite(prevToMs) &&
        prevToMs > prevFromMs
          ? prevToMs - prevFromMs
          : ONE_DAY;

      if (
        Number.isFinite(prevToMs) &&
        Math.abs(prevToMs - latestSelectedUpdatedAtMs) < 1000
      ) {
        return prev;
      }

      const to = toLocalOffsetIso(new Date(latestSelectedUpdatedAtMs));
      const from = toLocalOffsetIso(
        new Date(latestSelectedUpdatedAtMs - prevSpanMs)
      );
      return { from, to };
    });
  }, [devices, selectedDeviceIds]);

  // Readings
  const {
    data,
    loading: dataLoading,
    error: dataError,
    lastSeen: ls,
  } = useReadings(user, range, {
    intervalMs: MINUTE,
  });

  // Handlers
  const handleLogout = async () => {
    await signOut();
    setUser(null);
  };

  const handleDeviceDeleted = (id: string) => {
    removeDevice(id);
    setSelectedDeviceIds((prev) => prev.filter((did) => did !== id));
  };

  const value: AppContextType = {
    user,
    bootLoading,
    handleLogout,
    devices,
    devicesLoading,
    removeDevice,
    handleDeviceDeleted,
    data,
    dataLoading,
    dataError,
    range,
    setRange,
    selectedDeviceIds,
    setSelectedDeviceIds,
    lastSeen: ls ?? new Map(),
    setLastSeen: () => {}, // Read-only
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
