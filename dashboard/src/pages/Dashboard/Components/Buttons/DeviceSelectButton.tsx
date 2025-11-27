import { t } from "i18next";
import React from "react";
import { formatDateTime } from "../../../../utils/dateFormatter";

interface DeviceSelectButtonProps {
  id: string;
  lastSeen?: string;
  active: boolean;
  onSelect: (id: string) => void;
  title?: string;
}

export const DeviceSelectButton: React.FC<DeviceSelectButtonProps> = ({
  id,
  lastSeen,
  active,
  onSelect,
  title,
}) => {
  // Device is online if last seen within 5 minutes
  const isOnline = lastSeen
    ? Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000
    : false;

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={[
        "flex-1 text-left px-1 py-1 rounded-md",
        "focus:outline-none focus:ring-2 focus:ring-neon-purple/50",
        active
          ? "text-neon-purple font-semibold drop-shadow"
          : "text-gray-300 group-hover:text-gray-100",
        "transition-colors",
      ].join(" ")}
      title={title}
    >
      <div className="flex items-center gap-2">
        <div className="relative">
          <div
            className={[
              "w-2 h-2 rounded-full",
              isOnline
                ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]",
              "animate-pulse",
            ].join(" ")}
          />
        </div>
        <div className="flex-1">
          <span>{id}</span>
          {lastSeen && (
            <span className="block text-[10px] text-gray-500">
              {t("lastSeen")}: {formatDateTime(lastSeen)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default DeviceSelectButton;
