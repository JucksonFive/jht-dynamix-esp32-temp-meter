import React from "react";
import { useTranslation } from "react-i18next";

interface LogoutButtonProps {
  onLogout: () => void;
  className?: string;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  onLogout,
  className = "",
}) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={onLogout}
      className={[
        "px-4 py-2 text-sm font-medium rounded-lg",
        "bg-accent-500 text-white",
        "hover:bg-accent-600",
        "transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500/40",
        className,
      ].join(" ")}
    >
      {t("logout")}
    </button>
  );
};

export default LogoutButton;
