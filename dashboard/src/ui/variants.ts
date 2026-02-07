// Central UI variant configuration for Refined Minimal design system

export const buttonIntents = {
  primary:
    "bg-primary-500 text-white hover:bg-primary-600 focus:ring-2 focus:ring-primary-500/40",
  danger:
    "bg-status-hot text-white hover:bg-red-600 focus:ring-2 focus:ring-status-hot/40",
  secondary:
    "bg-neutral-100 dark:bg-[#231f1f] text-neutral-800 dark:text-[#d4c5c5] hover:bg-neutral-200 dark:hover:bg-[#2d2626] focus:ring-2 focus:ring-neutral-400/40 border border-neutral-200 dark:border-[#2d2626]",
  outline:
    "border border-neutral-300 dark:border-[#3d3434] text-neutral-800 dark:text-[#d4c5c5] hover:border-primary-500 hover:text-primary-600 focus:ring-2 focus:ring-primary-500/40",
  ghost:
    "bg-transparent text-neutral-500 dark:text-[#a39999] hover:bg-neutral-100 dark:hover:bg-[#231f1f] hover:text-neutral-900 dark:hover:text-[#f5f0f0] focus:ring-2 focus:ring-neutral-400/40",
  link: "bg-transparent text-primary-600 dark:text-[#fb7185] hover:underline px-0",
} as const;

export const buttonSizes = {
  sm: "text-xs px-3 py-1.5",
  md: "text-sm px-4 py-2",
  lg: "text-sm px-5 py-3",
} as const;

export interface ButtonVariantConfig {
  intent?: keyof typeof buttonIntents;
  size?: keyof typeof buttonSizes;
  rounded?: boolean | "full";
}

export const applyButtonVariants = (cfg: ButtonVariantConfig = {}) => {
  const intent = cfg.intent || "primary";
  const size = cfg.size || "md";
  const rounded =
    cfg.rounded === "full"
      ? "rounded-full"
      : cfg.rounded === true
        ? "rounded-lg"
        : "rounded-lg";
  return [
    "inline-flex items-center justify-center font-medium transition-colors select-none",
    "disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none",
    buttonIntents[intent],
    buttonSizes[size],
    rounded,
  ]
    .filter(Boolean)
    .join(" ");
};
