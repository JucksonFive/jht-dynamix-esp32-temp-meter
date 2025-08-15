import React from "react";

export interface LoadingSpinnerProps {
  size?: number; // diameter in px
  strokeWidth?: number;
  className?: string;
  colorClass?: string; // tailwind text-* class
  label?: string; // accessibility label
}

/** Accessible, tailwind-friendly circular loading spinner. */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 20,
  strokeWidth = 4,
  className = "",
  colorClass = "text-white",
  label = "Loading",
}) => {
  const radius = 10; // SVG viewBox uses 24, circle r=10 with stroke fits
  return (
    <span role="status" aria-label={label} className={`inline-flex ${className}`}>
      <svg
        className={`animate-spin ${colorClass}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        width={size}
        height={size}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
};

export default LoadingSpinner;
