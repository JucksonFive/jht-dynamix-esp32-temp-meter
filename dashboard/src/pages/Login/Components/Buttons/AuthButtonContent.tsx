import React from "react";
import { LoadingSpinner } from "../LoadingSpinner";
import strings from "../../../../locale/strings";

export interface AuthButtonContentProps {
  mode: "signin" | "signup";
  loading: boolean;
}

export const AuthButtonContent: React.FC<AuthButtonContentProps> = ({
  mode,
  loading,
}) => {
  if (loading) {
    return (
      <>
        <LoadingSpinner
          size={20}
          label={
            mode === "signin" ? strings.authSigningIn : strings.authSigningUp
          }
        />
        <span>
          {mode === "signin"
            ? strings.authSigningInEllipsis
            : strings.authSigningUpEllipsis}
        </span>
      </>
    );
  }
  return (
    <span>{mode === "signin" ? strings.authSignIn : strings.authSignUp}</span>
  );
};

export default AuthButtonContent;
