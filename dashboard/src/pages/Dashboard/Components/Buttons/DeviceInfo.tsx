import { t } from "i18next";
import React from "react";
import { formatDateTime } from "../../../../utils/dateFormatter";

interface DeviceInfoProps {
  id: string;
  lastSeen?: string;
}

export const DeviceInfo: React.FC<DeviceInfoProps> = ({ id, lastSeen }) => {
  return (
    <div className="flex-1">
      <span>{id}</span>
      {lastSeen && (
        <span className="block text-[10px] text-gray-500">
          {t("lastSeen")}: {formatDateTime(lastSeen)}
        </span>
      )}
    </div>
  );
};

export default DeviceInfo;
