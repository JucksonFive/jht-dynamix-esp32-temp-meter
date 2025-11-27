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
  console.log("lastSeen", lastSeen);
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
      <span>{id}</span>
      {lastSeen && (
        <span className="block text-[10px] text-gray-500">
          {formatDateTime(lastSeen)}
        </span>
      )}
    </button>
  );
};

export default DeviceSelectButton;
