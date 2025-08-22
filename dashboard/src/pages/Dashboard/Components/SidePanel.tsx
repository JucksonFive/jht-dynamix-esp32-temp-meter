import React from "react";
import strings from "../../../locale/strings";

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
          <button
            type="button"
            aria-label={strings.sidePanelSelectionHelp}
            title={strings.sidePanelSelectionHelp}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            <span aria-hidden>ℹ️</span>
          </button>
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
                  <button
                    type="button"
                    onClick={() => onSelectSingle(d.id)}
                    className={[
                      "flex-1 text-left px-1 py-1 rounded",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500",
                      isActive ? "text-blue-700 font-medium" : "text-gray-800",
                    ].join(" ")}
                    title={strings.tooltipSelectSingle}
                  >
                    <span>{d.id}</span>
                    {d.lastSeen && (
                      <span className="block text-[10px] text-gray-500">
                        {new Date(d.lastSeen).toLocaleTimeString()}
                      </span>
                    )}
                  </button>
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
