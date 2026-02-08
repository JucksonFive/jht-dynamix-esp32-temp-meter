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
      <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-[#f5f0f0]">
        {heading}
      </h2>
      <div className="text-xs text-neutral-500 dark:text-[#a39999] flex gap-2 flex-wrap">
        {selectedDeviceIds.map((id) => (
          <span
            key={id}
            className="px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-[#231f1f] text-neutral-700 dark:text-[#d4c5c5] border border-neutral-200 dark:border-[#2d2626] text-[11px] font-medium"
          >
            {id}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TemperatureHistoryHeader;
