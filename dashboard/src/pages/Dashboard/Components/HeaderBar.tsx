import React from "react";
import { useTranslation } from "react-i18next";
import LogoutButton from "./Buttons/LogoutButton";

interface HeaderBarProps {
  title: string;
  onLogout: () => void;
  className?: string;
  actionsRight?: React.ReactNode; // optional extra actions on the right before logout
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  onLogout,
  className = "",
  actionsRight,
}) => {
  const { t } = useTranslation();
  return (
    <div
      className={["flex justify-between items-center mb-4", className].join(
        " "
      )}
    >
      <h1 className="text-2xl font-bold">{title || t("appTitle")}</h1>
      <div className="flex items-center gap-3">
        {actionsRight}
        <LogoutButton onLogout={onLogout} />
      </div>
    </div>
  );
};

export default HeaderBar;
