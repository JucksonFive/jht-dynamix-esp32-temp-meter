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
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100">
      <div className="mx-auto max-w-[1600px] px-4 lg:px-8 py-4 lg:py-6">
        <HeaderBar title={strings.appTitle} onLogout={handleLogout} />

        {/* Filters */}
        <section className="mb-5 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="bg-white/70 dark:bg-gray-800/60 backdrop-blur rounded-xl shadow-sm border border-gray-200/70 dark:border-gray-700/60 p-4 w-full sm:w-auto">
            <div className="text-[11px] uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400 mb-2">
              {strings.dateRange}
            </div>
            <DateRangePicker
              value={clampedRange}
              onChange={onRangeChange}
              // @ts-ignore
              allowed={
                bounds ?? { min: clampedRange.from, max: clampedRange.to }
              }
            />
          </div>
        </section>

        {/* Main layout (mobile: stacked, desktop: side-by-side) */}
        <div className="flex flex-col xl:flex-row gap-6 items-stretch">
          <div className="xl:w-72">
            <div className="h-full bg-white/70 dark:bg-gray-800/60 backdrop-blur border border-gray-200/70 dark:border-gray-700/60 shadow-sm rounded-2xl">
              <SidePanel
                devices={devices}
                selectedIds={selectedDeviceIds}
                onSelectSingle={selectSingle}
                onToggleMulti={toggleMulti}
                className="bg-transparent border-0 w-full max-h-[unset]"
              />
            </div>
          </div>
          <main className="flex-1 min-w-0">
            <div className="h-full bg-white/70 dark:bg-gray-800/60 backdrop-blur border border-gray-200/70 dark:border-gray-700/60 shadow-sm rounded-2xl p-4 lg:p-6">
              {selectedDeviceIds.length > 0 ? (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <h2 className="text-lg font-semibold tracking-tight">
                      {strings.temperatureHistory}
                    </h2>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-2 flex-wrap">
                      {selectedDeviceIds.map((id) => (
                        <span
                          key={id}
                          className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 text-[11px] font-medium"
                        >
                          {id}
                        </span>
                      ))}
                    </div>
                  </div>
                  <TemperatureChart
                    data={selectedData.map((d) => ({
                      id: d.id,
                      timestamp: d.timestamp,
                      temperature: d.temperature,
                    }))}
                    range={range}
                  />
                </div>
              ) : (
                <div className="h-full min-h-[18rem] grid place-items-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                  <p className="text-gray-500 dark:text-gray-400 text-center px-6 text-sm">
                    {strings.selectDeviceHelp}
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
