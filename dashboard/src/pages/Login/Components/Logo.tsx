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
      <defs>
        <linearGradient
          id="lg1"
          x1="0"
          y1="0"
          x2="128"
          y2="128"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <circle
        cx="64"
        cy="64"
        r="60"
        stroke="url(#lg1)"
        strokeWidth="4"
        fill="#111827"
      />
      <path
        d="M64 4 A60 60 0 0 1 64 124"
        stroke="#06b6d4"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M4 64 A60 60 0 0 1 124 64"
        stroke="#ec4899"
        strokeWidth="3"
        fill="none"
      />
      <text
        x="64"
        y="72"
        textAnchor="middle"
        fontSize="18"
        fill="#f1f5f9"
        fontFamily="'Inter', 'Arial'"
        fontWeight="bold"
      >
        {text}
      </text>
    </svg>
  );
};

export default Logo;
