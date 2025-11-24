import { lazy } from "react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "./contexts/AppContext";
import "./locale/i18n"; // initialize i18

const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const Login = lazy(() => import("./pages/Login/Login"));

function App() {
  const { t } = useTranslation();
  const { user, bootLoading, dataError, dataLoading, devicesLoading } =
    useAppContext();

  if (bootLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        {t("loading")}
      </div>
    );
  }
  if (!user) return <Login />;

  return (
    <>
      {dataError && (
        <div className="p-2 mb-2 text-sm text-white bg-red-500 rounded">
          {dataError}
        </div>
      )}

      <Dashboard loading={dataLoading || devicesLoading} />
    </>
  );
}

export default App;
