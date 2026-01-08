import { useAppContext } from "src/contexts/AppContext";
import { DateRangeFilter } from "src/pages/Dashboard/Components/DateRange/DateRangeFilter";
import { HeaderBar } from "src/pages/Dashboard/Components/HeaderBar";
import { SelectDeviceHelp } from "src/pages/Dashboard/Components/SidePanel/SelectDeviceHelp";
import { SidePanel } from "src/pages/Dashboard/Components/SidePanel/SidePanel";
import { TemperatureHistoryPanel } from "src/pages/Dashboard/Components/TemperatureChart/TemperatureHistoryPanel";

export const Dashboard = () => {
  const { selectedDeviceIds, handleLogout } = useAppContext();

  return (
    <div className="min-h-screen w-full bg-gradient-dashboard text-gray-100">
      <div className="mx-auto max-w-[1700px] px-5 lg:px-10 py-5 lg:py-8">
        <HeaderBar onLogout={handleLogout} />
        <DateRangeFilter />
        <div className="flex flex-col xl:flex-row gap-8 items-stretch">
          <SidePanel />
          <main className="flex-1 min-w-0">
            <div className="h-full bg-midnight-800/70 backdrop-blur-xl ring-1 ring-white/10 shadow-inner-soft rounded-2xl p-5 lg:p-7">
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
  );
};
export default Dashboard;
