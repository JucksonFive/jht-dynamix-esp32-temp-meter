import React from "react";
import { useTranslation } from "react-i18next";

interface InfoButtonProps {
  ariaLabel?: string;
  title?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

export const InfoButton: React.FC<InfoButtonProps> = ({
  ariaLabel,
  title,
  onClick,
  className = "",
}) => {
  const { t } = useTranslation();
  const label = ariaLabel || t("sidePanelSelectionHelp");
  const ttl = title || t("sidePanelSelectionHelp");
  return (
    <button
      type="button"
      aria-label={label}
      title={ttl}
      onClick={onClick}
      className={[
        "text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors",
        className,
      ].join(" ")}
    >
      <span aria-hidden>ℹ️</span>
    </button>
  );
};

export default InfoButton;
