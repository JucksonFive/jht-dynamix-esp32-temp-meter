import React from "react";

export interface LogoProps {
  size?: number; // square size in px
  className?: string;
  title?: string;
  text?: string; // center text override
}

/**
 * Reusable circle logo used across the dashboard.
 */
export const Logo: React.FC<LogoProps> = ({
  size = 128,
  className = "",
  title = "JT-DYNAMIX Logo",
  text = "JT-DYNAMIX",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      <circle
        cx="64"
        cy="64"
        r="60"
        stroke="#2D9CDB"
        strokeWidth="4"
        fill="#F2F2F2"
      />
      <path
        d="M64 4 A60 60 0 0 1 64 124"
        stroke="#27AE60"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M4 64 A60 60 0 0 1 124 64"
        stroke="#EB5757"
        strokeWidth="3"
        fill="none"
      />
      <text
        x="64"
        y="72"
        textAnchor="middle"
        fontSize="18"
        fill="#333"
        fontFamily="Arial"
        fontWeight="bold"
      >
        {text}
      </text>
    </svg>
  );
};

export default Logo;
