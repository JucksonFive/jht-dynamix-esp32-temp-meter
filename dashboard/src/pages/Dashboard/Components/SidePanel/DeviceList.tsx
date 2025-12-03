import React from "react";
import { useTranslation } from "react-i18next";

import { Device } from "../../../../services/types";
import DeleteDeviceButton from "../Buttons/DeleteDeviceButton";
import DeviceMultiToggle from "../Buttons/DeviceMultiToggle";
import { DeviceSelectButton } from "../Buttons/DeviceSelectButton";

interface DeviceListProps {
  devices: Device[];
  selectedDeviceIds: string[];
  onSelectSingle: (id: string) => void;
  onToggleMulti: (id: string) => void;
  onDeviceDeleted: (deviceId: string) => void;
}

export const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  selectedDeviceIds,
  onSelectSingle,
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
                "flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors group",
                isActive
                  ? "bg-gradient-to-r from-neon-purple/25 via-neon-pink/25 to-neon-cyan/25 border border-neon-purple/40 shadow-glow-purple"
                  : "bg-white/5 border border-white/10 hover:border-neon-purple/40 hover:bg-white/10",
              ].join(" ")}
            >
              <DeviceSelectButton
                id={d.deviceId}
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
  );
};

export default DeviceList;
