import React from "react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "../../../../contexts/AppContext";
import SelectAllDevicesButton from "../Buttons/SelectAllDevicesButton";
import { DeviceList } from "./DeviceList";
import { SidePanelHeader } from "./SidePanelHeader";

export const SidePanel: React.FC = () => {
  const { t } = useTranslation();
  const {
    devices,
    selectedDeviceIds,
    setSelectedDeviceIds,
    handleDeviceDeleted,
    lastSeen,
    latestTemperatures,
  } = useAppContext();

  const onSelectSingle = (id: string) => setSelectedDeviceIds([id]);

  const onToggleMulti = (id: string) =>
    setSelectedDeviceIds((prev: string[]) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleSelectAll = () => {
    devices.forEach((d) => {
      if (!selectedDeviceIds.includes(d.deviceId)) {
        onToggleMulti(d.deviceId);
      }
    });
  };
  const handleUnselectAll = () => {
    devices.forEach((d) => {
      if (selectedDeviceIds.includes(d.deviceId)) {
        onToggleMulti(d.deviceId);
      }
    });
  };
  return (
    <div className="xl:w-72">
      <div className="h-full bg-midnight-800/70 backdrop-blur-xl shadow-inner-soft rounded-2xl">
        <aside
          className={[
            "relative",
            "w-full lg:w-72 shrink-0",
            "max-h-[22rem] lg:max-h-none overflow-y-auto",
            "rounded-2xl bg-midnight-800/70 backdrop-blur-xl",
            "ring-1 ring-white/10",
            "bg-transparent border-0 w-full max-h-[unset] text-gray-200",
          ].join(" ")}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-[3px] rounded-r-2xl bg-gradient-to-b from-neon-pink via-neon-purple to-neon-cyan shadow-[0_0_8px_-1px_rgba(236,72,153,0.6)]"
          />
          <div className="p-4">
            <SidePanelHeader title={t("sidePanelTitle")} />
            <SelectAllDevicesButton
              total={devices.length}
              selected={selectedDeviceIds.length}
              onSelectAll={handleSelectAll}
              onUnselectAll={handleUnselectAll}
            />
            <DeviceList
              devices={devices}
              selectedDeviceIds={selectedDeviceIds}
              lastSeen={lastSeen}
              latestTemperatures={latestTemperatures}
              onSelectSingle={onSelectSingle}
              onToggleMulti={onToggleMulti}
              onDeviceDeleted={handleDeviceDeleted}
            />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SidePanel;
