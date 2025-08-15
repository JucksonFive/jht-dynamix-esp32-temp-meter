import React from "react";

export interface SidePanelDevice {
  id: string;
  lastSeen?: string;
}

export interface SidePanelProps {
  devices: SidePanelDevice[];
  selectedId: string;
  onSelect: (id: string) => void;
  title?: string;
  className?: string;
}

/**
 * Sidebar listing available devices with last-seen timestamps.
 */
export const SidePanel: React.FC<SidePanelProps> = ({
  devices,
  selectedId,
  onSelect,
  title = "Devices",
  className = "",
}) => {
  return (
    <aside
      className={[
        "w-72 shrink-0 border-r border-gray-200 bg-gray-50 h-[calc(100vh-5rem)] overflow-y-auto rounded-lg",
        className,
      ].join(" ")}
    >
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-3">{title}</h2>
        <ul className="space-y-2">
          {devices.map((d) => {
            const isActive = d.id === selectedId;
            return (
              <li key={d.id}>
                <button
                  onClick={() => onSelect(d.id)}
                  className={[
                    "w-full text-left px-3 py-2 rounded-md transition",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-white hover:bg-gray-100 text-gray-800 border border-gray-200",
                  ].join(" ")}
                  aria-current={isActive ? "page" : undefined}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{d.id}</span>
                    {d.lastSeen && (
                      <span
                        className={
                          "text-xs " +
                          (isActive ? "text-blue-100" : "text-gray-500")
                        }
                      >
                        {new Date(d.lastSeen).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
          {devices.length === 0 && (
            <li className="text-sm text-gray-500">No devices yet.</li>
          )}
        </ul>
      </div>
    </aside>
  );
};

export default SidePanel;
