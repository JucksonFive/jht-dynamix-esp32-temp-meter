import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../../ui/Elements/Button/Button";

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
    <Button
      intent="ghost"
      size="sm"
      onClick={onLogout}
      className={[
        "relative overflow-hidden font-medium",
        "bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan text-white",
        "shadow-lg shadow-neon-purple/30 hover:shadow-neon-purple/50",
        "focus:ring-neon-purple/40",
        className,
      ].join(" ")}
    >
      <span className="relative z-10">{t("logout")}</span>
    </Button>
  );
};

export default LogoutButton;
