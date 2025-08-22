import React from "react";
import { Button } from "../../../ui/Button";
import { AuthButtonContent } from "./AuthButtonContent";
import { AuthErrorMessage } from "./AuthErrorMessage";
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
        intent="primary"
        size="md"
        onClick={onAuth}
        disabled={disabled}
        aria-busy={loading}
        className="w-full mb-4 gap-2"
      >
        <AuthButtonContent mode={mode} loading={loading} />
      </Button>
      <AuthErrorMessage error={error} className="mb-2" />
      <Button intent="link" size="sm" onClick={onToggleMode}>
        {mode === "signin"
          ? strings.authCreateAccount
          : strings.authAlreadyAccount}
      </Button>
    </div>
  );
};

export default AuthActions;
