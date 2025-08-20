// hooks/useReadings.ts
import { useEffect, useRef, useState } from "react";
import { fetchAllUserReadings } from "../services/api";
import type { Reading } from "../services/types";
import type { Range } from "../utils/range";

export interface DeviceData {
  id: string;
  temperature: number;
  timestamp: string;
}

export function useReadings(
  user: any,
  range: Range,
  { intervalMs = 60000 } = {}
) {
  const [data, setData] = useState<DeviceData[]>([]);
  const [error, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<number | null>(null);

  const load = async (signal?: AbortSignal, r = range) => {
    try {
      setErr(null);
      setLoading(true);
      const items = await fetchAllUserReadings({
        from: r.from,
        to: r.to,
        pageSize: 500,
      });
      if (signal?.aborted) return;
      setData(
        items.map((x: Reading) => ({
          id: x.deviceId,
          temperature: x.temperature,
          timestamp: x.timestamp,
        }))
      );
    } catch (e: any) {
      if (!signal?.aborted) setErr(e?.message ?? "Fetch failed");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const ac = new AbortController();
    load(ac.signal);
    // setup auto-refresh
    if (intervalMs > 0) {
      timerRef.current = window.setInterval(() => {
        const aci = new AbortController();
        load(aci.signal);
      }, intervalMs);
    }
    return () => {
      ac.abort();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [user, range.from, range.to, intervalMs]); // riippuu vain rangesta ja userista

  return { data, loading, error, reload: () => load(undefined) };
}
