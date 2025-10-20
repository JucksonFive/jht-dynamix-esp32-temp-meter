import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../../ui/Elements/Button/Button";

export interface ToggleAuthModeButtonProps {
  mode: "signin" | "signup";
  onToggleMode: () => void;
  className?: string;
}

export const ToggleAuthModeButton: React.FC<ToggleAuthModeButtonProps> = ({
  mode,
  onToggleMode,
  className = "",
}) => {
  const { t } = useTranslation();
  return (
    <div className={["flex justify-center", className].join(" ")}>
      <Button
        intent="link"
        size="sm"
        onClick={onToggleMode}
        className="text-neon-purple hover:text-neon-pink"
      >
        {mode === "signin" ? t("authCreateAccount") : t("authAlreadyAccount")}
      </Button>
    </div>
  );
};

export default ToggleAuthModeButton;
