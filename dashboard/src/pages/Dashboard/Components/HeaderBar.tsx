import React from "react";
import strings from "../../../locale/strings";

interface HeaderBarProps {
  title: string;
  onLogout: () => void;
  className?: string;
  actionsRight?: React.ReactNode; // optional extra actions on the right before logout
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  onLogout,
  className = "",
  actionsRight,
}) => {
  return (
    <div
      className={["flex justify-between items-center mb-4", className].join(
        " "
      )}
    >
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex items-center gap-3">
        {actionsRight}
        <button
          className="text-sm text-white bg-red-500 hover:bg-red-600 rounded px-4 py-2"
          onClick={onLogout}
        >
          {strings.logout}
        </button>
      </div>
    </div>
  );
};

export default HeaderBar;
