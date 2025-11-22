import React from "react";
import { useTranslation } from "react-i18next";

interface TemperatureHistoryHeaderProps {
  selectedDeviceIds: string[];
  title?: string; // optional override
  className?: string;
}

export const TemperatureHistoryHeader: React.FC<
  TemperatureHistoryHeaderProps
> = ({
  selectedDeviceIds,
  title,
  className = "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6",
}) => {
  const { t } = useTranslation();
  const heading = title || t("temperatureHistory");
  return (
    <div className={className}>
      <h2 className="text-xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan">
        {heading}
      </h2>
      <div className="text-xs text-gray-400 flex gap-2 flex-wrap">
        {selectedDeviceIds.map((id) => (
          <span
            key={id}
            className="px-2 py-0.5 rounded-full bg-midnight-700/80 text-gray-200 border border-white/10 text-[11px] font-medium shadow-glow-purple/20"
          >
            {id}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TemperatureHistoryHeader;
