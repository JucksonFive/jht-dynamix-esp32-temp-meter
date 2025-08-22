// Central UI variant configuration for reusable components (buttons etc.)
// Extend by adding more intents, sizes, or component-specific tokens.

export const buttonIntents = {
  primary:
    "bg-black text-white hover:bg-gray-900 focus:ring-2 focus:ring-black/40",
  danger:
    "bg-red-500 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-500/40",
  secondary:
    "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400/40",
  outline:
    "border border-gray-300 text-gray-800 hover:bg-gray-50 focus:ring-2 focus:ring-gray-300/50",
  ghost:
    "bg-transparent text-gray-800 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200/60",
  link: "bg-transparent text-blue-600 hover:underline px-0",
} as const;

export const buttonSizes = {
  sm: "text-sm px-3 py-1.5",
  md: "text-sm px-4 py-2",
  lg: "text-base px-5 py-3",
} as const;

export interface ButtonVariantConfig {
  intent?: keyof typeof buttonIntents;
  size?: keyof typeof buttonSizes;
  rounded?: boolean | "full"; // true -> rounded, false -> none, "full" -> rounded-full
}

export const applyButtonVariants = (cfg: ButtonVariantConfig = {}) => {
  const intent = cfg.intent || "primary";
  const size = cfg.size || "md";
  const rounded =
    cfg.rounded === "full"
      ? "rounded-full"
      : cfg.rounded === false
      ? ""
      : "rounded";
  return [
    // base
    "inline-flex items-center justify-center font-medium transition-colors select-none",
    "disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none",
    buttonIntents[intent],
    buttonSizes[size],
    rounded,
  ]
    .filter(Boolean)
    .join(" ");
};
