import React from "react";

interface ErrorIndicatorProps {
  title?: string;
  size?: number;
  className?: string;
}

/**
 * Animated error badge (glowing concentric pulse + exclamation).
 * Pure SVG so it scales crisply. Uses currentColor for theming.
 */
const ErrorIndicator: React.FC<ErrorIndicatorProps> = ({
  title = "Error",
  size = 14,
  className = "",
}) => {
  const id = React.useId();
  return (
    <span
      role="img"
      aria-label={title}
      title={title}
      className={["inline-flex items-center justify-center", className].join(
        " "
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-red-400 drop-shadow-[0_0_4px_rgba(248,113,113,0.55)]"
      >
        <defs>
          <radialGradient id={`err-grad-${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f87171" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#dc2626" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
          </radialGradient>
          <filter
            id={`err-glow-${id}`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="2.8"
              result="blur"
            />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Pulsing halo */}
        <circle
          cx={12}
          cy={12}
          r={8}
          fill={`url(#err-grad-${id})`}
          className="animate-ping-fast origin-center"
          style={{ animation: "err-pulse 1.4s ease-in-out infinite" }}
        />
        {/* Inner badge */}
        <circle
          cx={12}
          cy={12}
          r={7}
          fill="#1f0a0a"
          stroke="#fca5a5"
          strokeWidth={1}
          filter={`url(#err-glow-${id})`}
        />
        {/* Exclamation */}
        <line x1={12} y1={8} x2={12} y2={13} strokeWidth={2} />
        <circle cx={12} cy={16.25} r={1.15} fill="currentColor" stroke="none" />
      </svg>
      <style>{`
        @keyframes err-pulse { 0% { transform: scale(0.6); opacity: 0.85;} 70% { transform: scale(1); opacity: 0;} 100% { transform: scale(1); opacity: 0;} }
      `}</style>
    </span>
  );
};

export default ErrorIndicator;
