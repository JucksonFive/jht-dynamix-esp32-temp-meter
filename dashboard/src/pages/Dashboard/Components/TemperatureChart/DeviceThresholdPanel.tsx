import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "../../../../contexts/AppContext";
import { updateDeviceThreshold } from "../../../../services/api";
import { Button } from "../../../../ui/Elements/Button/Button";
import ErrorIndicator from "../Buttons/ErrorIndicator";

export const DeviceThresholdPanel: React.FC = () => {
  const { t } = useTranslation();
  const { devices, selectedDeviceIds, latestTemperatures, updateDevice } =
    useAppContext();
  const selectedDeviceId =
    selectedDeviceIds.length === 1 ? selectedDeviceIds[0] : null;
  const device = useMemo(
    () => devices.find((d) => d.deviceId === selectedDeviceId),
    [devices, selectedDeviceId]
  );

  const [thresholdInput, setThresholdInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!device) {
      setThresholdInput("");
      setError(null);
      return;
    }
    setThresholdInput(
      typeof device.temperatureThreshold === "number"
        ? String(device.temperatureThreshold)
        : ""
    );
    setError(null);
  }, [device?.deviceId, device?.temperatureThreshold]);

  if (!device || !selectedDeviceId) return null;

  const currentTemp = latestTemperatures.get(device.deviceId);
  const currentThreshold =
    typeof device.temperatureThreshold === "number"
      ? device.temperatureThreshold
      : null;
  const hasCurrentTemp =
    typeof currentTemp === "number" && Number.isFinite(currentTemp);
  const isOverThreshold =
    hasCurrentTemp &&
    typeof currentThreshold === "number" &&
    currentTemp > currentThreshold;

  const raw = thresholdInput.trim();
  const parsed = raw === "" ? null : Number(raw);
  const isValid = raw === "" || Number.isFinite(parsed);
  const hasChanges = isValid && parsed !== currentThreshold;

  const handleSave = async () => {
    if (!isValid) {
      setError(t("thresholdInvalid"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await updateDeviceThreshold(device.deviceId, parsed);
      updateDevice(device.deviceId, {
        temperatureThreshold:
          res.temperatureThreshold === null
            ? undefined
            : res.temperatureThreshold,
      });
    } catch (err) {
      console.error("Failed to update threshold", err);
      setError(t("thresholdSaveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-6 rounded-2xl bg-midnight-800/70 backdrop-blur-xl shadow-inner-soft ring-1 ring-white/10 border border-white/5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">
            {t("thresholdTitle")}
          </div>
          <p className="text-xs text-gray-400">{t("thresholdHint")}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {hasCurrentTemp ? (
            <>
              <span
                className={
                  isOverThreshold ? "text-red-300 font-semibold" : "text-gray-200"
                }
              >
                {t("currentTemperature")}: {currentTemp.toFixed(1)}°C
              </span>
              {isOverThreshold && (
                <span className="flex items-center gap-1 text-red-300">
                  <ErrorIndicator
                    title={t("thresholdExceeded")}
                    size={12}
                  />
                  {t("thresholdExceeded")}
                </span>
              )}
            </>
          ) : (
            <span className="text-gray-500">{t("temperatureUnavailable")}</span>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-col sm:flex-row sm:items-end gap-3">
        <label className="flex-1 text-[11px] uppercase tracking-wide font-semibold text-gray-400">
          {t("thresholdLabel")}
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            value={thresholdInput}
            onChange={(event) => {
              setThresholdInput(event.target.value);
              if (error) setError(null);
            }}
            placeholder={t("thresholdPlaceholder")}
            className="mt-2 w-full rounded-md bg-midnight-700/60 border border-white/10 focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/40 text-gray-200 placeholder-gray-500 text-[11px] py-2 px-3 backdrop-blur-sm transition-colors"
          />
        </label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            intent="ghost"
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan text-white shadow-lg shadow-neon-purple/30 hover:shadow-neon-purple/50 focus:ring-neon-purple/40"
          >
            {saving ? t("thresholdSaving") : t("thresholdSave")}
          </Button>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-300 flex items-center gap-2">
          <ErrorIndicator title={error} size={14} />
          {error}
        </p>
      )}
    </section>
  );
};

export default DeviceThresholdPanel;
