import React from "react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "src/contexts/AppContext";
import SelectAllDevicesButton from "src/pages/Dashboard/Components/Buttons/SelectAllDevicesButton";
import { DeviceList } from "src/pages/Dashboard/Components/SidePanel/DeviceList";
import { SidePanelHeader } from "src/pages/Dashboard/Components/SidePanel/SidePanelHeader";

export const SidePanel: React.FC = () => {
  const { t } = useTranslation();
  const {
    devices,
    selectedDeviceIds,
    setSelectedDeviceIds,
    handleDeviceDeleted,
    lastSeen,
  } = useAppContext();

  const onSelectSingle = (id: string) => setSelectedDeviceIds([id]);

  const onToggleMulti = (id: string) =>
    setSelectedDeviceIds((prev: string[]) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleSelectAll = () => {
    const allIds = devices.map((d) => d.deviceId);
    setSelectedDeviceIds(allIds);
  };

  const handleUnselectAll = () => {
    setSelectedDeviceIds([]);
  };

  return (
    <aside className="xl:w-80 shrink-0">
      <div className="panel p-4 max-h-[calc(100vh-200px)] overflow-hidden flex flex-col bg-white dark:bg-[#1a1717] border border-neutral-300 dark:border-[#3d3434]">
        <SidePanelHeader title={t("sidePanelTitle")} />

        <div className="flex items-center justify-between mb-3 pb-3 border-b border-neutral-300 dark:border-[#3d3434]">
          <span className="text-xs text-neutral-500 dark:text-[#a39999] tracking-wide">
            {selectedDeviceIds.length}/{devices.length}
          </span>
        </div>

        <SelectAllDevicesButton
          total={devices.length}
          selected={selectedDeviceIds.length}
          onSelectAll={handleSelectAll}
          onUnselectAll={handleUnselectAll}
        />

        <div className="flex-1 overflow-y-auto">
          <DeviceList
            devices={devices}
            selectedDeviceIds={selectedDeviceIds}
            lastSeen={lastSeen}
            onSelectSingle={onSelectSingle}
            onToggleMulti={onToggleMulti}
            onDeviceDeleted={handleDeviceDeleted}
          />
        </div>
      </div>
    </aside>
  );
};

export default SidePanel;
