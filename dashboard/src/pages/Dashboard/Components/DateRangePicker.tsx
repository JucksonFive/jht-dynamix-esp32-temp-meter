import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import strings from "../../../locale/strings";

type DateStr = string;
interface Props {
  value: { from: DateStr; to: DateStr };
  onChange: (r: { from: DateStr; to: DateStr }) => void;
}

export const DateRangePicker = ({ value, onChange }: Props) => {
  const fromDate = value.from ? new Date(value.from) : null;
  const toDate = value.to ? new Date(value.to) : null;

  return (
    <div className="flex flex-col gap-3 relative z-30 text-xs">
      <div className="flex flex-col gap-1 w-full">
        <label className="block text-[10px] uppercase tracking-wide font-semibold text-gray-400">
          {strings.fromLabel}
        </label>
        <div className="relative group">
          <DatePicker
            selected={fromDate}
            onChange={(d) =>
              d &&
              onChange({
                from: format(d, "yyyy-MM-dd"),
                to: value.to,
              })
            }
            maxDate={toDate || undefined}
            dateFormat="dd.MM.yyyy"
            className="w-full pl-8 rounded-md bg-midnight-700/60 border border-white/10 focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/40 text-gray-200 placeholder-gray-500 text-[11px] py-2 backdrop-blur-sm transition-colors"
            popperClassName="z-50"
          />
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-neon-purple/70 group-focus-within:text-neon-purple">
            📅
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1 w-full">
        <label className="block text-[10px] uppercase tracking-wide font-semibold text-gray-400">
          {strings.toLabel}
        </label>
        <div className="relative group">
          <DatePicker
            selected={toDate}
            onChange={(d) =>
              d &&
              onChange({
                from: value.from,
                to: format(d, "yyyy-MM-dd"),
              })
            }
            minDate={fromDate || undefined}
            maxDate={new Date()}
            dateFormat="dd.MM.yyyy"
            className="w-full pl-8 rounded-md bg-midnight-700/60 border border-white/10 focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/40 text-gray-200 placeholder-gray-500 text-[11px] py-2 backdrop-blur-sm transition-colors"
            popperClassName="z-50"
          />
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-neon-purple/70 group-focus-within:text-neon-purple">
            📅
          </span>
        </div>
      </div>
    </div>
  );
};
