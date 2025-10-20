import React from "react";
import { useTranslation } from "react-i18next";

export interface AuthErrorMessageProps {
  error?: string | null;
  className?: string;
}

export const AuthErrorMessage: React.FC<AuthErrorMessageProps> = ({
  error,
  className = "",
}) => {
  const { t } = useTranslation();
  if (!error) return null;
  return (
    <div className={["text-red-600 text-sm text-center", className].join(" ")}>
      <p>{t("authError")}</p>
    </div>
  );
};

export default AuthErrorMessage;
