import React from "react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "../../../../contexts/AppContext";
import { DateRangePicker } from "./DateRangePicker";
import { LiveToggle } from "./LiveToggle";

interface DateRangeFilterProps {
  className?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  className = "mb-6 flex flex-col sm:flex-row sm:items-end gap-4 relative z-40",
}) => {
  const { t } = useTranslation();
  const { range, setRange } = useAppContext();
  return (
    <section className={className}>
      <div className="bg-midnight-800/70 backdrop-blur-xl rounded-2xl shadow-inner-soft ring-1 ring-white/10 p-5 w-full sm:w-auto border border-white/5">
        <div className="flex justify-between items-center mb-2">
          <div className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">
            {t("dateRange")}
          </div>
          <LiveToggle />
        </div>
        <DateRangePicker
          value={range}
          onChange={setRange}
          // @ts-ignore: allowed prop provided for limiting range visually
          allowed={{ min: range.from, max: range.to }}
        />
      </div>
    </section>
  );
};

export default DateRangeFilter;
