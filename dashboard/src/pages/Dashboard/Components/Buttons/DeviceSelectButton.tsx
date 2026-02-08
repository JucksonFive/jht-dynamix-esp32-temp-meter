import React from "react";
import DeviceInfo from "src/pages/Dashboard/Components/Buttons/DeviceInfo";
import DeviceStatusIndicator from "src/pages/Dashboard/Components/Buttons/DeviceStatusIndicator";

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
        "flex-1 text-left px-1 py-1 rounded-lg",
        "focus:outline-none focus:ring-2 focus:ring-accent-500/50",
        active
          ? "text-accent-600 dark:text-[#fb7185] font-semibold"
          : "text-neutral-800 dark:text-[#d4c5c5] group-hover:text-neutral-900 dark:group-hover:text-[#f5f0f0]",
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
