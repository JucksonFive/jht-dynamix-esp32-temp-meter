import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle } from "react-icons/fi";
import ErrorIndicator from "src/pages/Dashboard/Components/Buttons/ErrorIndicator";
import { factoryResetDevice } from "src/services/api";
import { Nullable } from "src/utils/types";

const REQUIRED_CONFIRM = "FACTORY_RESET";

interface FactoryResetButtonProps {
  deviceId: string;
  size?: number;
}

export const FactoryResetButton: React.FC<FactoryResetButtonProps> = ({
  deviceId,
  size = 16,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Nullable<string>>(null);
  const inputRef = useRef<Nullable<HTMLInputElement>>(null);

  const canSubmit = confirmText.trim() === REQUIRED_CONFIRM && !loading;

  useEffect(() => {
    if (open) {
      setConfirmText("");
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const onSubmit = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      setError(null);
      await factoryResetDevice(deviceId, REQUIRED_CONFIRM);
      setOpen(false);
    } catch (err: any) {
      console.error("Factory reset failed", err);
      setError(err?.message || "Factory reset failed");
    } finally {
      setLoading(false);
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
        title={t("factoryResetDevice")}
        className={`p-1 rounded-md transition-colors text-red-400 hover:text-red-200 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/40 ${
          loading ? "opacity-60 cursor-not-allowed" : ""
        }`}
        aria-label={`Factory reset device ${deviceId}`}
        disabled={loading}
      >
        <FiAlertTriangle size={size} />
      </button>
      {error && <ErrorIndicator title={error} size={14} className="ml-1" />}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="factory-reset-title"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-midnight-800 border border-white/10 rounded-xl shadow-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="factory-reset-title"
              className="text-lg font-semibold mb-2 flex items-center gap-2 text-red-300"
            >
              <FiAlertTriangle />
              {t("factoryResetDevice")}
            </h2>
            <p className="text-sm text-gray-300 mb-4 whitespace-pre-line">
              {t("factoryResetAction")}
            </p>

            <label className="block text-sm text-gray-200 mb-2">
              {t("factoryResetTypePrompt", { value: REQUIRED_CONFIRM })}
            </label>
            <input
              ref={inputRef}
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-black/20 border border-white/10 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/40"
              placeholder={REQUIRED_CONFIRM}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmit();
                if (e.key === "Escape" && !loading) setOpen(false);
              }}
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-md bg-gray-600/40 hover:bg-gray-500/40 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400/40 disabled:opacity-60"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-500 text-white focus:outline-none focus:ring-2 focus:ring-red-400/50 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={onSubmit}
                disabled={!canSubmit}
              >
                {loading ? "..." : t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FactoryResetButton;
