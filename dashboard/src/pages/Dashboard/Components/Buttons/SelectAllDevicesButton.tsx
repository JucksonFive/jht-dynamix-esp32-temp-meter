import React from "react";
import { useTranslation } from "react-i18next";

import checkAllIcon from "src/ui/icons/check-all.svg";
import indeterminateIcon from "src/ui/icons/indeterminate.svg";

interface SelectAllDevicesButtonProps {
  total: number;
  selected: number;
  onSelectAll: () => void;
  onUnselectAll: () => void;
}

export const SelectAllDevicesButton: React.FC<SelectAllDevicesButtonProps> = ({
  total,
  selected,
  onSelectAll,
  onUnselectAll,
}) => {
  const { t } = useTranslation();
  const allSelected = total > 0 && selected === total;
  const isIndeterminate = selected > 0 && selected < total;
  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => (allSelected ? onUnselectAll() : onSelectAll())}
        title={t("tooltipSelectAll")}
        className={[
          "w-full flex items-center justify-between text-left px-3 py-2",
          "transition-colors border rounded-lg text-sm",
          allSelected
            ? "bg-accent-50 dark:bg-[#2d1219] border-accent-500 dark:border-[#f43f5e] text-accent-600 dark:text-[#fb7185]"
            : "bg-neutral-50 dark:bg-[#231f1f] border-neutral-200 dark:border-[#2d2626] text-neutral-800 dark:text-[#d4c5c5] hover:border-accent-500 hover:text-accent-600",
          "focus:outline-none focus:ring-2 focus:ring-accent-500/40",
        ].join(" ")}
      >
        <span className="font-medium">
          {allSelected ? t("unselectAll") : t("selectAll")}
        </span>
        <span
          className="ml-2 w-4 h-4 flex items-center justify-center"
          aria-hidden="true"
        >
          {allSelected && (
            <img src={checkAllIcon} alt="all" className="w-4 h-4" />
          )}
          {isIndeterminate && !allSelected && (
            <img src={indeterminateIcon} alt="partial" className="w-4 h-4" />
          )}
          {!allSelected && !isIndeterminate && (
            <span className="text-[10px] text-neutral-500 dark:text-[#a39999]">
              {selected > 0 ? selected : 0}
            </span>
          )}
        </span>
      </button>
    </div>
  );
};

export default SelectAllDevicesButton;
