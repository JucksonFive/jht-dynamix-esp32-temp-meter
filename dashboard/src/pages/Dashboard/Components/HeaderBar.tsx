import React from "react";
import { useTranslation } from "react-i18next";
import LogoutButton from "./Buttons/LogoutButton";

interface HeaderBarProps {
  onLogout: () => void;

  actionsRight?: React.ReactNode; // optional extra actions on the right before logout
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onLogout,
  actionsRight,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-2xl font-bold">{t("appTitle")}</h1>
      <div className="flex items-center gap-3">
        {actionsRight}
        <LogoutButton onLogout={onLogout} />
      </div>
    </div>
  );
};

export default HeaderBar;
