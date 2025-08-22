import { isAfter, isBefore } from "date-fns";
import React, { useMemo } from "react";
import { Bounds, DeviceData, Range } from "../../utils/types";
import { fmtYMD, parseYMD } from "../../utils/utils";
import { DateRangePicker } from "./Components/DateRangePicker";
import { SidePanel } from "./Components/SidePanel";
import { TemperatureChart } from "./Components/TemperatureChart";
import { HeaderBar } from "./Components/HeaderBar";
import strings from "../../locale/strings";

interface DashboardProps {
  data: DeviceData[];
  bounds: Bounds | null;
  range: Range;
  onRangeChange: (r: Range) => void;
  selectedDeviceIds: string[];
  setSelectedDeviceIds: React.Dispatch<React.SetStateAction<string[]>>;
  handleLogout: () => void;
  loading: boolean;
}

export const Dashboard = ({
  data,
  bounds,
  range,
  onRangeChange,
  selectedDeviceIds,
  setSelectedDeviceIds,
  handleLogout,
}: DashboardProps) => {
  const lastSeenMap = new Map<string, string>();
  for (const d of data) {
    const prev = lastSeenMap.get(d.id);
    if (!prev || prev < d.timestamp) lastSeenMap.set(d.id, d.timestamp);
  }
  const devices = Array.from(lastSeenMap, ([id, lastSeen]) => ({
    id,
    lastSeen,
  }));

  const selectedData =
    selectedDeviceIds.length > 0
      ? data.filter((d) => selectedDeviceIds.includes(d.id))
      : [];

  const selectSingle = (id: string) => setSelectedDeviceIds([id]);

  const toggleMulti = (id: string) =>
    setSelectedDeviceIds((prev: string[]) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  const clampedRange = useMemo(() => {
    if (!bounds) return range;
    const min = parseYMD(bounds.min);
    const max = parseYMD(bounds.max);
    const f = parseYMD(range.from);
    const t = parseYMD(range.to);
    const cf = isBefore(f, min) ? min : isAfter(f, max) ? max : f;
    const ct = isBefore(t, min) ? min : isAfter(t, max) ? max : t;
    return { from: fmtYMD(cf), to: fmtYMD(ct) };
  }, [range.from, range.to, bounds?.min, bounds?.max]);

  return (
    <div className="min-h-screen bg-white p-6">
      <HeaderBar title={strings.appTitle} onLogout={handleLogout} />

      <div className="mb-4 flex items-center gap-4">
        <DateRangePicker
          value={clampedRange}
          onChange={onRangeChange}
          // @ts-ignore
          allowed={bounds ?? { min: clampedRange.from, max: clampedRange.to }}
        />
      </div>

      {/* Main layout (mobile: stacked, desktop: side-by-side) */}
      <div className="flex flex-col lg:flex-row gap-6">
        <SidePanel
          devices={devices}
          selectedIds={selectedDeviceIds}
          onSelectSingle={selectSingle}
          onToggleMulti={toggleMulti}
          className="w-full lg:w-72 h-auto lg:h-[calc(100vh-5rem)]"
        />
        <main className="flex-1 min-w-0">
          {selectedDeviceIds.length > 0 ? (
            <TemperatureChart
              data={selectedData.map((d) => ({
                id: d.id,
                timestamp: d.timestamp,
                temperature: d.temperature,
              }))}
              range={range}
            />
          ) : (
            <div className="h-full min-h-[16rem] grid place-items-center border border-dashed rounded-lg">
              <p className="text-gray-500 text-center px-4">
                {strings.selectDeviceHelp}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
