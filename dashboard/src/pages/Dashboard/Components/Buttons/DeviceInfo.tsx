import { t } from "i18next";
import React from "react";
import { formatDateTime } from "src/utils/dateFormatter";

interface DeviceInfoProps {
  id: string;
  updatedAt: string;
}

export const DeviceInfo: React.FC<DeviceInfoProps> = ({ id, updatedAt }) => {
  return (
    <div className="flex-1">
      <span>{id}</span>
      <span className="block text-[10px] text-gray-500">
        {t("lastSeen")}: {formatDateTime(updatedAt)}
      </span>
    </div>
  );
};

export default DeviceInfo;
