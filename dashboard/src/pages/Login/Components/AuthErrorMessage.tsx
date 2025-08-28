import React from "react";
import strings from "../../../locale/strings";

export interface AuthErrorMessageProps {
  error?: string | null;
  className?: string;
}

export const AuthErrorMessage: React.FC<AuthErrorMessageProps> = ({
  error,
  className = "",
}) => {
  if (!error) return null;
  return (
    <div className={["text-red-600 text-sm text-center", className].join(" ")}>
      <p>{strings.authError}</p>
    </div>
  );
};

export default AuthErrorMessage;
