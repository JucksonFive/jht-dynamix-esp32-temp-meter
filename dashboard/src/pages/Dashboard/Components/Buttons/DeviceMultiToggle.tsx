import React from "react";
import { useTranslation } from "react-i18next";

export interface DeviceMultiToggleProps {
  active: boolean;
  onToggle: () => void;
  title?: string;
  className?: string;
}

/**
 * Checkbox used for adding/removing a device to multi-selection in the side panel.
 */
const DeviceMultiToggle: React.FC<DeviceMultiToggleProps> = ({
  active,
  onToggle,
  title,
  className = "",
}) => {
  const { t } = useTranslation();
  const resolvedTitle = title || t("tooltipToggleMulti");
  return (
    <label
      className={["flex items-center cursor-pointer", className].join(" ")}
      title={resolvedTitle}
      aria-label={resolvedTitle}
    >
      <input
        type="checkbox"
        className="h-4 w-4 accent-neon-purple focus:ring-neon-purple/50"
        checked={active}
        onChange={onToggle}
        aria-checked={active}
      />
    </label>
  );
};

export default DeviceMultiToggle;
