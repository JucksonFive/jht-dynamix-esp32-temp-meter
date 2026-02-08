import React from "react";
import { useTranslation } from "react-i18next";

import DeleteDeviceButton from "src/pages/Dashboard/Components/Buttons/DeleteDeviceButton";
import DeviceMultiToggle from "src/pages/Dashboard/Components/Buttons/DeviceMultiToggle";
import { DeviceSelectButton } from "src/pages/Dashboard/Components/Buttons/DeviceSelectButton";
import { Device } from "src/services/types";

interface DeviceListProps {
  devices: Device[];
  selectedDeviceIds: string[];
  lastSeen?: Map<string, string>;
  onSelectSingle: (id: string) => void;
  onToggleMulti: (id: string) => void;
  onDeviceDeleted: (deviceId: string) => void;
}

export const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  selectedDeviceIds,
  onSelectSingle,
  lastSeen,
  onToggleMulti,
  onDeviceDeleted,
}) => {
  const { t } = useTranslation();
  return (
    <ul className="space-y-2">
      {devices.map((d) => {
        const isActive = selectedDeviceIds.includes(d.deviceId);
        return (
          <li key={d.deviceId}>
            <div
              className={[
                "flex items-center gap-2 px-3 py-2 transition-all group border rounded-xl",
                isActive
                  ? "device-selected border-accent-500 bg-accent-50 dark:bg-[#2d1219] dark:border-[#f43f5e]"
                  : "bg-white dark:bg-[#1a1717] border-neutral-300 dark:border-[#3d3434] hover:border-neutral-400 dark:hover:border-[#4d4040] hover:shadow-sm",
              ].join(" ")}
            >
              <DeviceSelectButton
                id={d.deviceId}
                updatedAt={d.updatedAt}
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
        <li className="text-sm text-neutral-500 dark:text-[#a39999]">
          {t("noDevices")}
        </li>
      )}
    </ul>
  );
};

export default DeviceList;
