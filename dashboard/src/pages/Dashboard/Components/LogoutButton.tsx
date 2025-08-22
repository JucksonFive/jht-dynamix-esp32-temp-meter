import React from "react";
import strings from "../../../locale/strings";

interface LogoutButtonProps {
  onLogout: () => void;
  className?: string;
}

// Dedicated logout button to keep HeaderBar cleaner and allow reuse elsewhere
export const LogoutButton: React.FC<LogoutButtonProps> = ({
  onLogout,
  className = "",
}) => (
  <button
    className={[
      "text-sm text-white bg-red-500 hover:bg-red-600 rounded px-4 py-2",
      className,
    ].join(" ")}
    onClick={onLogout}
  >
    {strings.logout}
  </button>
);

export default LogoutButton;
