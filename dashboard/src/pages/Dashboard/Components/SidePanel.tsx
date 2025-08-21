import React from "react";

export interface SidePanelDevice {
  id: string;
  lastSeen?: string;
}

export interface SidePanelProps {
  devices: SidePanelDevice[];
  selectedIds: string[];
  onSelectSingle: (id: string) => void; // uusi
  onToggleMulti: (id: string) => void; // uusi
  title?: string;
  className?: string;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  devices,
  selectedIds,
  onSelectSingle,
  onToggleMulti,
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
                    title="Klikkaa valitaksesi vain tämän"
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
                    title="Monivalinta: ruksaa lisätäksesi / poistaaksesi"
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
            <li className="text-sm text-gray-500">No devices yet.</li>
          )}
        </ul>
      </div>
    </aside>
  );
};

export default SidePanel;
