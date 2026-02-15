// hooks/useReadings.ts
import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchAllUserReadings,
  getLatestReadingPerDevice,
} from "src/services/api";
import type { Reading } from "src/services/types";
import type { Nullable, Range, User } from "src/utils/types";

export interface DeviceData {
  id: string;
  temperature: number;
  timestamp: string;
}

export function useReadings(
  user: Nullable<User>,
  range: Range,
  { intervalMs = 60000 } = {},
) {
  const [data, setData] = useState<DeviceData[]>([]);
  const [error, setErr] = useState<Nullable<string>>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<Nullable<number>>(null);
  const [lastSeen, setLastSeen] = useState<Map<string, string>>(new Map());
  const load = useCallback(
    async (signal?: AbortSignal, r = range) => {
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
          })),
        );
      } catch (e: unknown) {
        if (!signal?.aborted)
          setErr(e instanceof Error ? e.message : "Fetch failed");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [range],
  );

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
  }, [user, range.from, range.to, intervalMs, load]);

  return { data, loading, error, lastSeen, reload: () => load(undefined) };
}
