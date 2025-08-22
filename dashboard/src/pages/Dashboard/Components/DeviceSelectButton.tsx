import React from "react";

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
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={[
        "flex-1 text-left px-1 py-1 rounded",
        "focus:outline-none focus:ring-2 focus:ring-blue-500",
        active ? "text-blue-700 font-medium" : "text-gray-800",
      ].join(" ")}
      title={title}
    >
      <span>{id}</span>
      {lastSeen && (
        <span className="block text-[10px] text-gray-500">
          {new Date(lastSeen).toLocaleTimeString()}
        </span>
      )}
    </button>
  );
};

export default DeviceSelectButton;
