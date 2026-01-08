import { useState, useEffect, useCallback } from "react";
import { fetchUserDevices } from "src/services/api";
import { Device } from "src/services/types";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { Nullable } from "src/utils/types";

export function useDevices(user: any) {
  const { t } = useTranslation();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Nullable<string>>(null);

  const removeDevice = useCallback((deviceId: string) => {
    setDevices((prev) => prev.filter((d) => d.deviceId !== deviceId));
  }, []);

  useEffect(() => {
    if (!user) {
      setDevices([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const getDevices = async () => {
      setLoading(true);
      setError(null);
      try {
        const userDevices = await fetchUserDevices({
          signal: controller.signal,
        });
        setDevices(userDevices);
      } catch (err: any) {
        if (!axios.isCancel(err)) {
          setError(t("fetchDevicesError"));
          console.error(err);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    getDevices();
    return () => controller.abort();
  }, [user]);

  return { devices, loading, error, removeDevice };
}
