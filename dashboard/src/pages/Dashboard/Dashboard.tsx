import { Suspense, lazy, useState } from "react";
import { useAppContext } from "src/contexts/AppContext";
import { DateRangeFilter } from "src/pages/Dashboard/Components/DateRange/DateRangeFilter";
import { HeaderBar } from "src/pages/Dashboard/Components/HeaderBar";
import { NavSidebar } from "src/pages/Dashboard/Components/NavSidebar/NavSidebar";
import { SelectDeviceHelp } from "src/pages/Dashboard/Components/SidePanel/SelectDeviceHelp";
import { SidePanel } from "src/pages/Dashboard/Components/SidePanel/SidePanel";
import { TemperatureHistoryPanel } from "src/pages/Dashboard/Components/TemperatureChart/TemperatureHistoryPanel";

const DashboardScene = lazy(
  () => import("src/pages/Dashboard/Components/DashboardScene"),
);

export const Dashboard = () => {
  const { selectedDeviceIds } = useAppContext();
  const [navCollapsed, setNavCollapsed] = useState(true);

  return (
    <div className="relative min-h-screen w-full bg-neutral-50 dark:bg-[#0f0d0d] text-neutral-900 dark:text-[#f5f0f0] transition-colors duration-200">
      <Suspense fallback={null}>
        <DashboardScene />
      </Suspense>
      <NavSidebar
        collapsed={navCollapsed}
        onToggle={() => setNavCollapsed((c) => !c)}
      />
      <div
        className={[
          "relative z-10 transition-[margin-left] duration-200",
          navCollapsed ? "ml-16" : "ml-56",
        ].join(" ")}
      >
        <div className="relative mx-auto max-w-[1700px] px-5 lg:px-10 py-4 lg:py-6">
          <HeaderBar />
          <DateRangeFilter />
          <div className="flex flex-col xl:flex-row gap-4 items-stretch">
            <SidePanel />
            <main className="flex-1 min-w-0">
              <div className="h-full panel p-5 lg:p-6">
                {selectedDeviceIds.length > 0 ? (
                  <TemperatureHistoryPanel />
                ) : (
                  <SelectDeviceHelp />
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
