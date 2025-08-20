import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { Range } from "../../../utils/types";

interface Props {
  value: Range;
  onChange: (range: Range) => void;
}

export const DateRangePicker = ({ value, onChange }: Props) => {
  const fromDate = value.from ? new Date(value.from) : null;
  const toDate = value.to ? new Date(value.to) : null;
  const dateFormat = "dd-MM-yyyy";

  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">Date Range</label>
      <DatePicker
        selectsRange
        startDate={fromDate}
        endDate={toDate}
        onChange={(dates) => {
          const [start, end] = dates as [Date | null, Date | null];
          if (start) {
            onChange({
              from: format(start, dateFormat),
              to: end
                ? format(new Date(end.getTime() - 86400000), dateFormat)
                : value.to,
            });
          }
        }}
        dateFormat="dd.MM.yyyy"
        className="border rounded px-2 py-1"
      />
    </div>
  );
};
