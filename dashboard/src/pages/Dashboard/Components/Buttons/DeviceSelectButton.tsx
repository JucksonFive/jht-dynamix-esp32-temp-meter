import React from "react";
import DeviceInfo from "./DeviceInfo";
import ErrorIndicator from "./ErrorIndicator";
import DeviceStatusIndicator from "./DeviceStatusIndicator";

interface DeviceSelectButtonProps {
  id: string;
  lastSeen?: string;
  active: boolean;
  onSelect: (id: string) => void;
  title?: string;
  alert?: boolean;
  alertTitle?: string;
}

export const DeviceSelectButton: React.FC<DeviceSelectButtonProps> = ({
  id,
  lastSeen,
  active,
  onSelect,
  title,
  alert = false,
  alertTitle,
}) => {
  // Device is online if last seen within 90 seconds (3x heartbeat interval)
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
        <DeviceStatusIndicator isOnline={isOnline} />
        <DeviceInfo id={id} lastSeen={lastSeen} />
        {alert && (
          <ErrorIndicator
            title={alertTitle || "Threshold exceeded"}
            size={12}
            className="ml-auto"
          />
        )}
      </div>
    </button>
  );
};

export default DeviceSelectButton;
