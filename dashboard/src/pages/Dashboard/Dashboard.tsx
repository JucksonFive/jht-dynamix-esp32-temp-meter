import React from "react";
import { useTranslation } from "react-i18next";
import { Device } from "../../services/types";
import { DeviceData, Range } from "../../utils/types";
import { DateRangeFilter } from "./Components/DateRange/DateRangeFilter";
import { HeaderBar } from "./Components/HeaderBar";
import { SelectDeviceHelp } from "./Components/SidePanel/SelectDeviceHelp";
import { SidePanel } from "./Components/SidePanel/SidePanel";
import { TemperatureHistoryPanel } from "./Components/TemperatureChart/TemperatureHistoryPanel";

interface DashboardProps {
  data: DeviceData[];
  devices: Device[];
  range: Range;
  onRangeChange: (r: Range) => void;
  selectedDeviceIds: string[];
  setSelectedDeviceIds: React.Dispatch<React.SetStateAction<string[]>>;
  handleLogout: () => void;
  loading: boolean;
  onDeviceDeleted: (id: string) => void;
}

export const Dashboard = ({
  data,
  devices,
  range,
  onRangeChange,
  selectedDeviceIds,
  setSelectedDeviceIds,
  handleLogout,
  onDeviceDeleted,
}: DashboardProps) => {
  const { t } = useTranslation();

  const selectedData =
    selectedDeviceIds.length > 0
      ? data.filter((d) => selectedDeviceIds.includes(d.id))
      : [];

  const selectSingle = (id: string) => setSelectedDeviceIds([id]);

  const toggleMulti = (id: string) =>
    setSelectedDeviceIds((prev: string[]) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <div className="min-h-screen w-full bg-gradient-dashboard text-gray-100">
      <div className="mx-auto max-w-[1700px] px-5 lg:px-10 py-5 lg:py-8">
        <HeaderBar onLogout={handleLogout} />
        <DateRangeFilter range={range} onRangeChange={onRangeChange} />
        <div className="flex flex-col xl:flex-row gap-8 items-stretch">
          <SidePanel
            devices={devices}
            selectedIds={selectedDeviceIds}
            onSelectSingle={selectSingle}
            onToggleMulti={toggleMulti}
            onDeviceDeleted={onDeviceDeleted}
          />
          <main className="flex-1 min-w-0">
            <div className="h-full bg-midnight-800/70 backdrop-blur-xl ring-1 ring-white/10 shadow-inner-soft rounded-2xl p-5 lg:p-7">
              {selectedDeviceIds.length > 0 ? (
                <TemperatureHistoryPanel
                  selectedData={selectedData}
                  range={range}
                  selectedDeviceIds={selectedDeviceIds}
                />
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
