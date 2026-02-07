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
      <span className="font-medium text-neutral-900 dark:text-[#f5f0f0]">
        {id}
      </span>
      <span className="block text-[10px] text-neutral-500 dark:text-[#a39999]">
        {t("lastSeen")}: {formatDateTime(updatedAt)}
      </span>
    </div>
  );
};

export default DeviceInfo;
