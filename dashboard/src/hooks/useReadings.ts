// hooks/useReadings.ts
import { useEffect, useRef, useState } from "react";
import {
  fetchAllUserReadings,
  getLatestReadingPerDevice,
} from "src/services/api";
import type { Reading } from "src/services/types";
import type { Nullable, Range } from "src/utils/types";

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
  const [error, setErr] = useState<Nullable<string>>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<Nullable<number>>(null);
  const [lastSeen, setLastSeen] = useState<Map<string, string>>(new Map());
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

      setLastSeen(getLatestReadingPerDevice(items));

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
  }, [user, range.from, range.to, intervalMs]);

  return { data, loading, error, lastSeen, reload: () => load(undefined) };
}
