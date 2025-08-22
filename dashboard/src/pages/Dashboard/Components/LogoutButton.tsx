import React from "react";
import strings from "../../../locale/strings";
import { Button } from "../../../ui/Button";

interface LogoutButtonProps {
  onLogout: () => void;
  className?: string;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  onLogout,
  className = "",
}) => (
  <Button intent="danger" size="sm" onClick={onLogout} className={className}>
    {strings.logout}
  </Button>
);

export default LogoutButton;
