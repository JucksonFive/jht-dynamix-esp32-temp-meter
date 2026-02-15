import React from "react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "src/contexts/AppContext";
import { DateRangePicker } from "src/pages/Dashboard/Components/DateRange/DateRangePicker";

interface DateRangeFilterProps {
  className?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  className = "mb-4 flex flex-col sm:flex-row sm:items-end gap-4 relative z-40",
}) => {
  const { t } = useTranslation();
  const { range, setRange } = useAppContext();
  return (
    <section className={className}>
      <div className="panel p-4 w-full sm:w-auto bg-white dark:bg-[#1a1717] border border-neutral-300 dark:border-[#3d3434]">
        <div className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-[#a39999] mb-3">
          {t("dateRange")}
        </div>
        <DateRangePicker value={range} onChange={setRange} />
      </div>
    </section>
  );
};

export default DateRangeFilter;
