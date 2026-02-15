import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";

type DateStr = string;

interface Props {
  value: Readonly<{ from: DateStr; to: DateStr }>;
  onChange: (r: { from: DateStr; to: DateStr }) => void;
}

export const DateRangePicker = ({ value, onChange }: Readonly<Props>) => {
  const { t } = useTranslation();
  const fromDate = value.from ? new Date(value.from) : null;
  const toDate = value.to ? new Date(value.to) : null;

  return (
    <div className="flex flex-col sm:flex-row gap-4 relative z-30 text-sm">
      <div className="flex flex-col gap-1">
        <label className="block text-xs font-medium text-neutral-600 dark:text-[#a39999]">
          {t("fromLabel")}
        </label>
        <div className="relative group">
          <DatePicker
            selected={fromDate}
            onChange={(d: Date | null) =>
              d &&
              onChange({
                from: format(d, "yyyy-MM-dd"),
                to: value.to,
              })
            }
            maxDate={toDate || undefined}
            dateFormat="dd.MM.yyyy"
            className="w-full pl-8 bg-neutral-50 dark:bg-[#231f1f] border border-neutral-200 dark:border-[#2d2626] rounded-lg focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 text-neutral-900 dark:text-[#f5f0f0] placeholder-neutral-400 dark:placeholder-[#5d5050] text-sm py-2 px-3 transition-colors"
            popperClassName="z-50"
          />
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-accent-500/70 group-focus-within:text-accent-500">
            ◷
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="block text-xs font-medium text-neutral-600 dark:text-[#a39999]">
          {t("toLabel")}
        </label>
        <div className="relative group">
          <DatePicker
            selected={toDate}
            onChange={(d: Date | null) =>
              d &&
              onChange({
                from: value.from,
                to: format(d, "yyyy-MM-dd"),
              })
            }
            minDate={fromDate || undefined}
            maxDate={new Date()}
            dateFormat="dd.MM.yyyy"
            className="w-full pl-8 bg-neutral-50 dark:bg-[#231f1f] border border-neutral-200 dark:border-[#2d2626] rounded-lg focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 text-neutral-900 dark:text-[#f5f0f0] placeholder-neutral-400 dark:placeholder-[#5d5050] text-sm py-2 px-3 transition-colors"
            popperClassName="z-50"
          />
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-accent-500/70 group-focus-within:text-accent-500">
            ◷
          </span>
        </div>
      </div>
    </div>
  );
};
