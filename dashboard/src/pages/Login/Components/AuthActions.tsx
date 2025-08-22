import React from "react";
import { Button } from "../../../ui/Button";
import { AuthButtonContent } from "./AuthButtonContent";
import { AuthErrorMessage } from "./AuthErrorMessage";
import { ToggleAuthModeButton } from "./ToggleAuthModeButton";
import strings from "../../../locale/strings";

export interface AuthActionsProps {
  mode: "signin" | "signup";
  loading: boolean;
  error?: string | null;
  disabled?: boolean;
  onAuth: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onToggleMode: () => void;
}

export const AuthActions: React.FC<AuthActionsProps> = ({
  mode,
  loading,
  error,
  disabled,
  onAuth,
  onToggleMode,
}) => {
  return (
    <div>
      <Button
        intent="ghost"
        size="md"
        onClick={onAuth}
        disabled={disabled}
        aria-busy={loading}
        className="w-full mb-4 gap-2 relative overflow-hidden bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan text-white shadow-lg shadow-neon-purple/30 hover:shadow-neon-purple/50 focus:ring-neon-purple/40"
      >
        <AuthButtonContent mode={mode} loading={loading} />
      </Button>
      <AuthErrorMessage error={error} className="mb-2" />
      <ToggleAuthModeButton mode={mode} onToggleMode={onToggleMode} />
    </div>
  );
};

export default AuthActions;
