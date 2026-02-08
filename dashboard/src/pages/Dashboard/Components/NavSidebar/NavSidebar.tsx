import React from "react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "src/contexts/AppContext";
import { useTheme } from "src/contexts/ThemeContext";
import LogoutButton from "src/pages/Dashboard/Components/Buttons/LogoutButton";

interface NavSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const NavSidebar: React.FC<NavSidebarProps> = ({
  collapsed,
  onToggle,
}) => {
  const { t } = useTranslation();
  const { handleLogout } = useAppContext();
  const { resolved, toggle } = useTheme();

  return (
    <>
      {/* Overlay for mobile when expanded */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onToggle}
          aria-hidden
        />
      )}

      <aside
        data-testid="nav-sidebar"
        className={[
          "fixed top-0 left-0 z-50 h-screen flex flex-col",
          "bg-white dark:bg-[#1a1717] border-r border-neutral-200 dark:border-[#2d2626] shadow-sm",
          "transition-[width] duration-200 ease-in-out",
          collapsed ? "w-16" : "w-56",
        ].join(" ")}
      >
        {/* Toggle / brand */}
        <div className="flex items-center h-16 px-3 border-b border-neutral-200 dark:border-[#2d2626] shrink-0">
          <button
            onClick={onToggle}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-neutral-600 dark:text-[#a39999] hover:bg-neutral-100 dark:hover:bg-[#231f1f] transition-colors"
            aria-label={collapsed ? t("navExpand") : t("navCollapse")}
          >
            {collapsed ? <MenuIcon /> : <CloseIcon />}
          </button>
          {!collapsed && (
            <span className="ml-2 text-sm font-semibold text-neutral-800 dark:text-[#f5f0f0] truncate">
              {t("appTitle")}
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-y-auto">
          <NavItem
            icon={<DashboardIcon />}
            label={t("navDashboard")}
            collapsed={collapsed}
            active
          />
        </nav>

        {/* Bottom – Theme toggle + Logout */}
        <div className="shrink-0 px-2 pb-4 border-t border-neutral-200 dark:border-[#2d2626] pt-3 space-y-2">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="w-full h-10 rounded-lg flex items-center justify-center gap-2 text-neutral-600 dark:text-[#a39999] hover:bg-neutral-100 dark:hover:bg-[#231f1f] transition-colors"
            aria-label={
              resolved === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            title={resolved === "dark" ? "Light mode" : "Dark mode"}
          >
            {resolved === "dark" ? <SunIcon /> : <MoonIcon />}
            {!collapsed && (
              <span className="text-sm font-medium">
                {resolved === "dark" ? "Light" : "Dark"}
              </span>
            )}
          </button>
          {collapsed ? (
            <button
              onClick={handleLogout}
              className="w-full h-10 rounded-lg flex items-center justify-center text-accent-500 dark:text-[#f43f5e] hover:bg-accent-50 dark:hover:bg-[#2d1219] transition-colors"
              aria-label={t("logout")}
              title={t("logout")}
            >
              <LogoutIcon />
            </button>
          ) : (
            <LogoutButton onLogout={handleLogout} className="w-full" />
          )}
        </div>
      </aside>
    </>
  );
};

/* ── Nav Item ── */
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  active?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  collapsed,
  active,
  onClick,
}) => (
  <button
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={[
      "flex items-center gap-3 rounded-lg px-3 h-10 text-sm font-medium transition-colors w-full",
      active
        ? "bg-primary-50 dark:bg-[#2d1219] text-primary-600 dark:text-[#f43f5e] border border-primary-200 dark:border-[#4d2233]"
        : "text-neutral-600 dark:text-[#a39999] hover:bg-neutral-100 dark:hover:bg-[#231f1f] hover:text-neutral-900 dark:hover:text-[#f5f0f0]",
      collapsed ? "justify-center" : "",
    ].join(" ")}
  >
    <span className="shrink-0 w-5 h-5 flex items-center justify-center">
      {icon}
    </span>
    {!collapsed && <span className="truncate">{label}</span>}
  </button>
);

/* ── Simple SVG Icons ── */
const MenuIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const DashboardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const LogoutIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export default NavSidebar;
