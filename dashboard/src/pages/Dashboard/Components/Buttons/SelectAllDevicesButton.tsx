import React from "react";
import { useTranslation } from "react-i18next";

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
          "w-full flex items-center justify-between text-left px-2.5 py-2 rounded-lg",
          "transition-colors border",
          allSelected
            ? "bg-gradient-to-r from-neon-purple/25 via-neon-pink/25 to-neon-cyan/25 border-neon-purple/40 text-neon-purple"
            : "bg-white/5 border-white/10 hover:border-neon-purple/40 hover:bg-white/10 text-gray-300 hover:text-gray-100",
          "focus:outline-none focus:ring-2 focus:ring-neon-purple/40",
        ].join(" ")}
      >
        <span className="text-sm font-medium">
          {allSelected ? t("unselectAll") : t("selectAll")}
        </span>
        <span
          className="ml-2 w-4 h-4 flex items-center justify-center"
          aria-hidden="true"
        >
          {allSelected && (
            <img
              src="/src/ui/icons/check-all.svg"
              alt="all"
              className="w-4 h-4 text-green-400"
            />
          )}
          {isIndeterminate && !allSelected && (
            <img
              src="/src/ui/icons/indeterminate.svg"
              alt="partial"
              className="w-4 h-4 text-current"
            />
          )}
          {!allSelected && !isIndeterminate && (
            <span className="text-[10px] text-gray-300">
              {selected > 0 ? selected : 0}
            </span>
          )}
        </span>
      </button>
    </div>
  );
};

export default SelectAllDevicesButton;
