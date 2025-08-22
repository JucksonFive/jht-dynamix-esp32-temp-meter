import React from "react";

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
      {error}
    </div>
  );
};

export default AuthErrorMessage;
