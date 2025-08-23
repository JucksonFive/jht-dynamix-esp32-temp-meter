import React from "react";
import strings from "../../../../locale/strings";

interface InfoButtonProps {
  ariaLabel?: string;
  title?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

export const InfoButton: React.FC<InfoButtonProps> = ({
  ariaLabel = strings.sidePanelSelectionHelp,
  title = strings.sidePanelSelectionHelp,
  onClick,
  className = "",
}) => (
  <button
    type="button"
    aria-label={ariaLabel}
    title={title}
    onClick={onClick}
    className={[
      "text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors",
      className,
    ].join(" ")}
  >
    <span aria-hidden>ℹ️</span>
  </button>
);

export default InfoButton;
