import React from "react";
import { useTranslation } from "react-i18next";
import { Range } from "../../../../utils/types";
import { DateRangePicker } from "./DateRangePicker";

interface DateRangeFilterProps {
  range: Range;
  onRangeChange: (r: Range) => void;
  className?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  range,
  onRangeChange,
  className = "mb-6 flex flex-col sm:flex-row sm:items-end gap-4 relative z-40",
}) => {
  const { t } = useTranslation();
  return (
    <section className={className}>
      <div className="bg-midnight-800/70 backdrop-blur-xl rounded-2xl shadow-inner-soft ring-1 ring-white/10 p-5 w-full sm:w-auto border border-white/5">
        <div className="text-[11px] uppercase tracking-wide font-semibold text-gray-400 mb-2">
          {t("dateRange")}
        </div>
        <DateRangePicker
          value={range}
          onChange={onRangeChange}
          // @ts-ignore: allowed prop provided for limiting range visually
          allowed={{ min: range.from, max: range.to }}
        />
      </div>
    </section>
  );
};

export default DateRangeFilter;
