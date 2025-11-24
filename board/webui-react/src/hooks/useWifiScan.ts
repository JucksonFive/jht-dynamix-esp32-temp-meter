import { useCallback, useEffect, useState } from "react";

export interface WifiNetwork {
  ssid: string;
}

interface WifiScanState {
  loading: boolean;
  error: string | null;
  networks: WifiNetwork[];
}

export function useWifiScan(autoStart = true) {
  const [state, setState] = useState<WifiScanState>({
    loading: false,
    error: null,
    networks: [],
  });

  const pollWifiList = useCallback(
    async (maxAttempts = 10, interval = 1000) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const res = await fetch("/scan-wifi");
          const text = await res.text();
          if (res.status === 202 || text === "Scan started") {
            await new Promise((r) => setTimeout(r, interval));
            continue;
          }
          const data = JSON.parse(text);
          if (!data || !Array.isArray(data.networks)) {
            throw new Error("Invalid JSON structure");
          }
          setState({ loading: false, error: null, networks: data.networks });
          return;
        } catch (err) {
          if (attempt === maxAttempts - 1) {
            setState({
              loading: false,
              error: (err as Error).message,
              networks: [],
            });
          } else {
            await new Promise((r) => setTimeout(r, interval));
          }
        }
      }
    },
    []
  );

  useEffect(() => {
    if (autoStart) pollWifiList();
  }, [autoStart, pollWifiList]);

  return { ...state, retry: () => pollWifiList() };
}
