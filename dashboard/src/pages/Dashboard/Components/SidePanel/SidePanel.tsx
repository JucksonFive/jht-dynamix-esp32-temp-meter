import React from "react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "../../../../contexts/AppContext";
import DeleteDeviceButton from "../Buttons/DeleteDeviceButton";
import DeviceMultiToggle from "../Buttons/DeviceMultiToggle";
import { DeviceSelectButton } from "../Buttons/DeviceSelectButton";
import SelectAllDevicesButton from "../Buttons/SelectAllDevicesButton";
import { SidePanelHeader } from "./SidePanelHeader";

export const SidePanel: React.FC = () => {
  const { t } = useTranslation();
  const {
    devices,
    selectedDeviceIds,
    setSelectedDeviceIds,
    handleDeviceDeleted,
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
            <ul className="space-y-2">
              {devices.map((d) => {
                const isActive = selectedDeviceIds.includes(d.deviceId);
                return (
                  <li key={d.deviceId}>
                    <div
                      className={[
                        "flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors group",
                        isActive
                          ? "bg-gradient-to-r from-neon-purple/25 via-neon-pink/25 to-neon-cyan/25 border border-neon-purple/40 shadow-glow-purple"
                          : "bg-white/5 border border-white/10 hover:border-neon-purple/40 hover:bg-white/10",
                      ].join(" ")}
                    >
                      <DeviceSelectButton
                        id={d.deviceId}
                        lastSeen={d.updatedAt}
                        active={isActive}
                        onSelect={onSelectSingle}
                        title={t("tooltipSelectSingle")}
                      />
                      <div className="flex items-center gap-2">
                        <DeviceMultiToggle
                          active={isActive}
                          onToggle={() => onToggleMulti(d.deviceId)}
                        />
                        <DeleteDeviceButton
                          deviceId={d.deviceId}
                          onDeleted={handleDeviceDeleted}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
              {devices.length === 0 && (
                <li className="text-sm text-gray-500">{t("noDevices")}</li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SidePanel;
