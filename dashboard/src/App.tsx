// Uber-auth-aware App.tsx for JT-DYNAMIX Dashboard (multi-device)

import { useEffect, useState } from "react";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import { Login } from "./components/Login";
import { fetchTemperatureData } from "./services/api";
import { Dashboard } from "./components/Dashboard";

interface DeviceData {
  id: string;
  temperature: number;
  timestamp: string;
}

function App() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<DeviceData[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (user) fetchTemperatureData().then(setData);
  }, [user]);

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
    <Dashboard
      data={data}
      selectedDeviceId={selectedDeviceId}
      setSelectedDeviceId={setSelectedDeviceId}
      handleLogout={handleLogout}
    />
  );
}

export default App;
