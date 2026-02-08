import React from "react";
import { AuthErrorMessage } from "src/pages/Login/Components/AuthErrorMessage";
import { AuthButtonContent } from "src/pages/Login/Components/Buttons/AuthButtonContent";
import { ToggleAuthModeButton } from "src/pages/Login/Components/Buttons/ToggleAuthModeButton";
import { Button } from "src/ui/Elements/Button/Button";
import { Nullable } from "src/utils/types";

export interface AuthActionsProps {
  mode: "signin" | "signup";
  loading: boolean;
  error?: Nullable<string>;
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
        intent="primary"
        size="md"
        onClick={onAuth}
        disabled={disabled}
        aria-busy={loading}
        className="w-full mb-4 gap-2 bg-accent-500 text-white hover:bg-accent-600 font-medium"
      >
        <AuthButtonContent mode={mode} loading={loading} />
      </Button>
      <AuthErrorMessage error={error} className="mb-2" />
      <ToggleAuthModeButton mode={mode} onToggleMode={onToggleMode} />
    </div>
  );
};

export default AuthActions;
