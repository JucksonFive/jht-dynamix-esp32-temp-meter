import React from "react";
import strings from "../../../locale/strings";
import { InfoButton } from "./InfoButton";
import { DeviceSelectButton } from "./DeviceSelectButton";

export interface SidePanelDevice {
  id: string;
  lastSeen?: string;
}

export interface SidePanelProps {
  devices: SidePanelDevice[];
  selectedIds: string[];
  onSelectSingle: (id: string) => void;
  onToggleMulti: (id: string) => void;
  title?: string;
  className?: string;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  devices,
  selectedIds,
  onSelectSingle,
  onToggleMulti,
  title = strings.sidePanelTitle,
  className = "",
}) => {
  return (
    <aside
      className={[
        // Mobile: full width card; Desktop: fixed width panel with full-height scroll
        "bg-gray-50 rounded-lg border border-gray-200 lg:border-r lg:rounded-lg",
        "w-full lg:w-72 shrink-0",
        "max-h-[22rem] lg:max-h-none overflow-y-auto",
        className,
      ].join(" ")}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <InfoButton />
        </div>
        <ul className="space-y-2">
          {devices.map((d) => {
            const isActive = selectedIds.includes(d.id);
            return (
              <li key={d.id}>
                <div
                  className={[
                    "flex items-center justify-between rounded-md border px-2 py-1",
                    isActive
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white",
                  ].join(" ")}
                >
                  <DeviceSelectButton
                    id={d.id}
                    lastSeen={d.lastSeen}
                    active={isActive}
                    onSelect={onSelectSingle}
                    title={strings.tooltipSelectSingle}
                  />
                  <label
                    className="flex items-center ml-2 cursor-pointer"
                    title={strings.tooltipToggleMulti}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-blue-600"
                      checked={isActive}
                      onChange={() => onToggleMulti(d.id)}
                    />
                  </label>
                </div>
              </li>
            );
          })}
          {devices.length === 0 && (
            <li className="text-sm text-gray-500">{strings.noDevices}</li>
          )}
        </ul>
      </div>
    </aside>
  );
};

export default SidePanel;
