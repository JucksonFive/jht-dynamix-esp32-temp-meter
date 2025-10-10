import React from "react";

interface LinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
  target?: string;
  rel?: string;
}

export const Link: React.FC<LinkProps> = ({
  href,
  children,
  className = "",
  external = false,
  target,
  rel,
}) => {
  // Default styles for internal navigation links
  const defaultClassName = "hover:text-brand-primary transition";
  const combinedClassName = className
    ? `${defaultClassName} ${className}`
    : defaultClassName;

  // Auto-detect external links if not explicitly specified
  const isExternal =
    external || href.startsWith("http") || href.startsWith("//");

  // Default target and rel for external links
  const linkTarget = target || (isExternal ? "_blank" : undefined);
  const linkRel = rel || (isExternal ? "noopener noreferrer" : undefined);

  return (
    <a
      href={href}
      className={combinedClassName}
      target={linkTarget}
      rel={linkRel}
    >
      {children}
    </a>
  );
};
