import React from "react";
import { useTranslation } from "react-i18next";
import { LoadingSpinner } from "src/pages/Login/Components/LoadingSpinner";

export interface AuthButtonContentProps {
  mode: "signin" | "signup";
  loading: boolean;
}

export const AuthButtonContent: React.FC<AuthButtonContentProps> = ({
  mode,
  loading,
}) => {
  const { t } = useTranslation();
  if (loading) {
    return (
      <>
        <LoadingSpinner
          size={20}
          label={mode === "signin" ? t("authSigningIn") : t("authSigningUp")}
        />
        <span>
          {mode === "signin"
            ? t("authSigningInEllipsis")
            : t("authSigningUpEllipsis")}
        </span>
      </>
    );
  }
  return <span>{mode === "signin" ? t("authSignIn") : t("authSignUp")}</span>;
};

export default AuthButtonContent;
