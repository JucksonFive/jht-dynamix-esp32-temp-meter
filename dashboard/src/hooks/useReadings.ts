// hooks/useReadings.ts
import { useEffect, useRef, useState } from "react";
import {
  fetchAllUserReadings,
  getLatestReadingPerDevice,
} from "../services/api";
import type { Reading } from "../services/types";
import type { Nullable, Range } from "../utils/types";

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
  const lastFetchParams = useRef<{ from: string; to: string } | null>(null);
  const [lastSeen, setLastSeen] = useState<Map<string, string>>(new Map());

  const load = async (signal?: AbortSignal, r = range) => {
    try {
      setErr(null);

      let fetchFrom = r.from;
      let isIncremental = false;

      // Check if we can do incremental fetch (only if extending forward)
      if (
        data.length > 0 &&
        lastFetchParams.current &&
        lastFetchParams.current.from === r.from &&
        new Date(r.to).getTime() >
          new Date(lastFetchParams.current.to).getTime()
      ) {
        const maxTs = data.reduce(
          (max, item) => (item.timestamp > max ? item.timestamp : max),
          ""
        );
        if (maxTs) {
          fetchFrom = maxTs;
          isIncremental = true;
        }
      }

      if (!isIncremental) {
        setLoading(true);
      }

      const items = await fetchAllUserReadings({
        from: fetchFrom,
        to: r.to,
        pageSize: 500,
      });
      if (signal?.aborted) return;

      // Update last seen
      const newLastSeen = getLatestReadingPerDevice(items);
      setLastSeen((prev) => {
        const next = new Map(prev);
        newLastSeen.forEach((v, k) => next.set(k, v));
        return next;
      });

      if (isIncremental) {
        setData((prev) => {
          const existing = new Map(
            prev.map((d) => [`${d.id}-${d.timestamp}`, d])
          );
          items.forEach((x: Reading) => {
            existing.set(`${x.deviceId}-${x.timestamp}`, {
              id: x.deviceId,
              temperature: x.temperature,
              timestamp: x.timestamp,
            });
          });
          return Array.from(existing.values()).sort((a, b) =>
            a.timestamp.localeCompare(b.timestamp)
          );
        });
      } else {
        setData(
          items.map((x: Reading) => ({
            id: x.deviceId,
            temperature: x.temperature,
            timestamp: x.timestamp,
          }))
        );
      }
      lastFetchParams.current = { from: r.from, to: r.to };
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
