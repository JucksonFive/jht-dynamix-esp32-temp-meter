// hooks/useReadingBounds.ts
import { useEffect, useState } from "react";
import { fetchReadingBounds } from "../services/api";

export function useReadingBounds(user: any) {
  const [bounds, setBounds] = useState<{ min: string; max: string } | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const b = await fetchReadingBounds();
        if (ac.signal.aborted) return;
        if (!b?.min || !b?.max) {
          const today = new Date().toISOString();
          setBounds({ min: today, max: today });
        } else {
          setBounds({ min: b.min, max: b.max });
        }
      } catch (e: any) {
        if (!ac.signal.aborted) setErr(e?.message ?? "Bounds fetch failed");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [user]);

  return { bounds, loading, error };
}
