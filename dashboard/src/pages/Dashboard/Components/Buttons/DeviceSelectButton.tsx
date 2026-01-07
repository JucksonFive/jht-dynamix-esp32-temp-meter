import React from "react";
import DeviceInfo from "./DeviceInfo";
import DeviceStatusIndicator from "./DeviceStatusIndicator";

interface DeviceSelectButtonProps {
  id: string;
  updatedAt: string;
  active: boolean;
  onSelect: (id: string) => void;
  title?: string;
}

export const DeviceSelectButton: React.FC<DeviceSelectButtonProps> = ({
  id,
  updatedAt,
  active,
  onSelect,
  title,
}) => {
  // Device is online if last seen within 90 seconds (3x heartbeat interval)
  const isOnline = updatedAt
    ? Date.now() - new Date(updatedAt).getTime() < 5 * 60 * 1000
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
        <DeviceInfo id={id} updatedAt={updatedAt} />
      </div>
    </button>
  );
};

export default DeviceSelectButton;
