import { lazy } from "react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "src/contexts/AppContext";
import "src/locale/i18n";

const Dashboard = lazy(() => import("src/pages/Dashboard/Dashboard"));
const Login = lazy(() => import("src/pages/Login/Login"));

function App() {
  const { t } = useTranslation();
  const { user, bootLoading, dataError } = useAppContext();

  if (bootLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-[#0f0d0d] flex items-center justify-center text-neutral-500 dark:text-[#a39999]">
        {t("loading")}
      </div>
    );
  }
  if (!user) return <Login />;

  return (
    <>
      {dataError && (
        <div className="p-2 mb-2 text-sm text-white bg-status-hot">
          {dataError}
        </div>
      )}
      <Dashboard />
    </>
  );
}

export default App;
