import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import ErrorIndicator from "src/pages/Dashboard/Components/Buttons/ErrorIndicator";
import { rebootDevice } from "src/services/api";
import ConfirmDialog from "src/ui/Elements/Modal/ConfirmDialog";
import { Nullable } from "src/utils/types";

interface RestartDeviceButtonProps {
  deviceId: string;
  size?: number;
}

export const RestartDeviceButton: React.FC<RestartDeviceButtonProps> = ({
  deviceId,
  size = 16,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Nullable<string>>(null);
  const [open, setOpen] = useState(false);

  const handleRestart = async () => {
    if (loading) return;
    try {
      setError(null);
      setLoading(true);
      await rebootDevice(deviceId);
    } catch (err: any) {
      console.error("Restart device failed", err);
      setError(err?.message || "Restart failed");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        title={t("restartDevice")}
        className={`p-1 rounded-md transition-colors text-neon-cyan hover:text-neon-pink hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-neon-cyan/30 ${
          loading ? "opacity-60 cursor-not-allowed" : ""
        }`}
        aria-label={`Restart device ${deviceId}`}
        disabled={loading}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
      {error && <ErrorIndicator title={error} size={14} className="ml-1" />}
      <ConfirmDialog
        open={open}
        title={t("restartDevice")}
        description={t("restartAction")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        loading={loading}
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        }
        onCancel={() => setOpen(false)}
        onConfirm={handleRestart}
      />
    </div>
  );
};

export default RestartDeviceButton;
