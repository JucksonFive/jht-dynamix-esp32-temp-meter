import React from "react";
import { Button } from "../../../ui/Button";
import strings from "../../../locale/strings";

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
  return (
    <div className={["flex justify-center", className].join(" ")}>
      <Button
        intent="link"
        size="sm"
        onClick={onToggleMode}
        className="text-neon-purple hover:text-neon-pink"
      >
        {mode === "signin"
          ? strings.authCreateAccount
          : strings.authAlreadyAccount}
      </Button>
    </div>
  );
};

export default ToggleAuthModeButton;
