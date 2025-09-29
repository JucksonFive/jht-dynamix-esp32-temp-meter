import React from "react";
import { useTranslation } from "react-i18next";
import { Device } from "../../../services/types";
import DeleteDeviceButton from "./Buttons/DeleteDeviceButton";
import DeviceMultiToggle from "./Buttons/DeviceMultiToggle";
import { DeviceSelectButton } from "./Buttons/DeviceSelectButton";
import { InfoButton } from "./Buttons/InfoButton";
import SelectAllDevicesButton from "./Buttons/SelectAllDevicesButton";

export interface SidePanelProps {
  devices: Device[];
  selectedIds: string[];
  onSelectSingle: (id: string) => void;
  onToggleMulti: (id: string) => void;
  title?: string;
  className?: string;
  onDeviceDeleted: (id: string) => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  devices,
  selectedIds,
  onSelectSingle,
  onToggleMulti,
  title = undefined,
  onDeviceDeleted,
  className = "",
}) => {
  const { t } = useTranslation();
  const panelTitle = title || t("sidePanelTitle");

  const handleSelectAll = () => {
    devices.forEach((d) => {
      if (!selectedIds.includes(d.deviceId)) {
        onToggleMulti(d.deviceId);
      }
    });
  };
  const handleUnselectAll = () => {
    devices.forEach((d) => {
      if (selectedIds.includes(d.deviceId)) {
        onToggleMulti(d.deviceId);
      }
    });
  };
  return (
    <aside
      className={[
        "relative",
        "w-full lg:w-72 shrink-0",
        "max-h-[22rem] lg:max-h-none overflow-y-auto",
        "rounded-2xl bg-midnight-800/70 backdrop-blur-xl",
        "ring-1 ring-white/10",
        className,
      ].join(" ")}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-[3px] rounded-r-2xl bg-gradient-to-b from-neon-pink via-neon-purple to-neon-cyan shadow-[0_0_8px_-1px_rgba(236,72,153,0.6)]"
      />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold">{panelTitle}</h2>
          <InfoButton />
        </div>
        <div className="mb-3">
          <SelectAllDevicesButton
            total={devices.length}
            selected={selectedIds.length}
            onSelectAll={handleSelectAll}
            onUnselectAll={handleUnselectAll}
          />
        </div>
        <ul className="space-y-2">
          {devices.map((d) => {
            const isActive = selectedIds.includes(d.deviceId);
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
                      onDeleted={onDeviceDeleted}
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
  );
};

export default SidePanel;
