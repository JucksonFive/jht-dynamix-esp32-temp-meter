import React from "react";

interface DeviceStatusIndicatorProps {
  isOnline: boolean;
}

export const DeviceStatusIndicator: React.FC<DeviceStatusIndicatorProps> = ({
  isOnline,
}) => {
  return (
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
  );
};

export default DeviceStatusIndicator;
