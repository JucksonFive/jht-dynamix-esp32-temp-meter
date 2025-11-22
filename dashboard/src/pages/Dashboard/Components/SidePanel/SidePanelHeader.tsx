import React from "react";
import { InfoButton } from "../Buttons/InfoButton";

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
      <h2 className="text-lg font-semibold">{title}</h2>
      <InfoButton />
    </div>
  );
};

export default SidePanelHeader;
