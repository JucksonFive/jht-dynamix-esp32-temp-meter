import React from "react";
import { useTranslation } from "react-i18next";
import { Nullable } from "src/utils/types";

export interface AuthErrorMessageProps {
  error?: Nullable<string>;
  className?: string;
}

export const AuthErrorMessage: React.FC<AuthErrorMessageProps> = ({
  error,
  className = "",
}) => {
  const { t } = useTranslation();
  if (!error) return null;
  return (
    <div
      className={[
        "text-red-600 dark:text-red-400 text-sm text-center",
        className,
      ].join(" ")}
    >
      <p>{t("authError")}</p>
    </div>
  );
};

export default AuthErrorMessage;
