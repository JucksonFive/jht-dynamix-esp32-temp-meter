import { getCurrentUser, signOut } from "aws-amplify/auth";
import { useEffect, useState } from "react";
import { Login } from "./components/Login";
import { TemperatureChart } from "./components/TemperatureChart";
import { fetchTemperatureData } from "./services/api";

function App() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState([]);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (user) fetchTemperatureData().then(setData);
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
  };

  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-2xl font-bold mb-4">JT-DYNAMIX Dashboard</h1>
      <button
        className="text-blue-600 underline text-sm mb-4"
        onClick={handleLogout}
      >
        Logout
      </button>
      <TemperatureChart data={data} />
    </div>
  );
}

export default App;
