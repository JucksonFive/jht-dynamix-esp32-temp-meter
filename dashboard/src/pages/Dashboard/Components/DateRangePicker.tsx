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
    <div className="flex flex-col gap-2">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          {strings.fromLabel}
        </label>
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
          className="border rounded px-2 py-1"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          {strings.toLabel}
        </label>
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
          className="border rounded px-2 py-1"
        />
      </div>
    </div>
  );
};
