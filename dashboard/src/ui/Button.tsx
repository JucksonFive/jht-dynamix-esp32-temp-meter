import React from "react";
import { applyButtonVariants, ButtonVariantConfig } from "./variants";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantConfig {
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  intent,
  size,
  rounded,
  className = "",
  children,
  ...rest
}) => {
  const cls = [applyButtonVariants({ intent, size, rounded }), className]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
};

export default Button;
