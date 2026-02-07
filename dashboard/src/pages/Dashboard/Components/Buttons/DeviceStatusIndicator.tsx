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
            ? "bg-status-normal shadow-[0_0_6px_rgba(34,197,94,0.6)]"
            : "bg-status-hot shadow-[0_0_6px_rgba(239,68,68,0.6)]",
          "animate-pulse",
        ].join(" ")}
      />
    </div>
  );
};

export default DeviceStatusIndicator;
