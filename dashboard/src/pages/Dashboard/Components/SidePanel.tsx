import React from "react";
import strings from "../../../locale/strings";
import { InfoButton } from "./Buttons/InfoButton";
import { DeviceSelectButton } from "./Buttons/DeviceSelectButton";
import DeleteDeviceButton from "./Buttons/DeleteDeviceButton";

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
                    "flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors group",
                    isActive
                      ? "bg-gradient-to-r from-neon-purple/25 via-neon-pink/25 to-neon-cyan/25 border border-neon-purple/40 shadow-glow-purple"
                      : "bg-white/5 border border-white/10 hover:border-neon-purple/40 hover:bg-white/10",
                  ].join(" ")}
                >
                  <DeviceSelectButton
                    id={d.id}
                    lastSeen={d.lastSeen}
                    active={isActive}
                    onSelect={onSelectSingle}
                    title={strings.tooltipSelectSingle}
                  />
                  <div className="flex items-center gap-2">
                    <label
                      className="flex items-center cursor-pointer"
                      title={strings.tooltipToggleMulti}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-neon-purple focus:ring-neon-purple/50"
                        checked={isActive}
                        onChange={() => onToggleMulti(d.id)}
                      />
                    </label>
                    <DeleteDeviceButton deviceId={d.id} />
                  </div>
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
