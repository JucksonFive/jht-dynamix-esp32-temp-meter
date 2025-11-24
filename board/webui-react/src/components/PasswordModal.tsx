import React, { useState } from "react";

interface PasswordModalProps {
  ssid: string | null;
  onClose: () => void;
  onSubmit: (password: string) => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  ssid,
  onClose,
  onSubmit,
}) => {
  const [pwd, setPwd] = useState("");
  if (!ssid) return null;
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>
          Enter Password for <span>{ssid}</span>
        </h3>
        <input
          type="password"
          placeholder="WiFi Password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSubmit(pwd);
            }
          }}
        />
        <div className="button-group">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" onClick={() => onSubmit(pwd)}>
            Connect
          </button>
        </div>
      </div>
    </div>
  );
};
