import { useState, useEffect, useCallback } from "react";
import { fetchUserDevices } from "../services/api";
import { Device } from "../services/types";
import strings from "../locale/strings";
import axios from "axios";

export function useDevices(user: any) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
          setError(strings.fetchDevicesError);
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
