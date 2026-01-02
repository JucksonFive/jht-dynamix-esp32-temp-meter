import { getCurrentUser, signOut } from "aws-amplify/auth";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useDevices } from "../hooks/useDevices";
import { useReadings } from "../hooks/useReadings";
import { Device } from "../services/types";
import { toLocalOffsetIso } from "../utils/dateFormatter";
import { DeviceData, Nullable, Range, User } from "../utils/types";
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
  updateDevice: (id: string, updates: Partial<Device>) => void;
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
  latestTemperatures: Map<string, number>;
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
  const {
    devices,
    loading: devicesLoading,
    removeDevice,
    updateDevice,
  } = useDevices(user);

  // Range
  const [range, setRange] = useState<Range>(() => {
    const now = toLocalOffsetIso();
    const from = toLocalOffsetIso(new Date(Date.now() - ONE_DAY));
    return { from, to: now };
  });

  // Readings
  const {
    data,
    loading: dataLoading,
    error: dataError,
    lastSeen: ls,
    latestTemperatures: latestTemps,
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
    updateDevice,
    handleDeviceDeleted,
    data,
    dataLoading,
    dataError,
    range,
    setRange,
    selectedDeviceIds,
    setSelectedDeviceIds,
    lastSeen: ls ?? new Map(),
    latestTemperatures: latestTemps ?? new Map(),
    setLastSeen: () => {}, // Read-only
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
