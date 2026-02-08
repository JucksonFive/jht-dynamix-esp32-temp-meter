import React from "react";
import { InfoButton } from "src/pages/Dashboard/Components/Buttons/InfoButton";

interface SidePanelHeaderProps {
  title: string;
  className?: string;
}

export const SidePanelHeader: React.FC<SidePanelHeaderProps> = ({
  title,
  className = "",
}) => {
  return (
    <div className={["flex items-center gap-2 mb-3", className].join(" ")}>
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-[#f5f0f0]">
        {title}
      </h2>
      <InfoButton />
    </div>
  );
};

export default SidePanelHeader;
