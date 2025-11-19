import React, { useState } from "react";
import { useWifiScan } from "../hooks/useWifiScan";
import { PasswordModal } from "./PasswordModal";
import { Spinner } from "./Spinner";

interface WifiStepProps {
  onConnected: () => void;
}

export const WifiStep: React.FC<WifiStepProps> = ({ onConnected }) => {
  const { networks, loading, error, retry } = useWifiScan(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const submitWifi = async (password: string) => {
    if (!selected) return;
    setConnecting(true);
    setStatus(null);
    const formData = new FormData();
    formData.append("ssid", selected);
    formData.append("password", password.trim());
    try {
      const res = await fetch("/connect-to-wifi", {
        method: "POST",
        body: formData,
      });
      setConnecting(false);
      if (res.ok) {
        setStatus("✅ Connected to WiFi!");
        setTimeout(onConnected, 1200);
      } else {
        setStatus("❌ Connection failed. Check password.");
      }
    } catch (e) {
      setConnecting(false);
      setStatus("❌ Network error. Try again.");
    } finally {
      setSelected(null);
    }
  };

  return (
    <div className="step">
      <h2>1. WiFi Settings</h2>
      {loading && <Spinner text="Scanning for networks..." />}
      {error && (
        <p className="status error">
          Scan error: {error}{" "}
          <button type="button" onClick={retry}>
            Retry
          </button>
        </p>
      )}
      <ul id="wifi-list">
        {networks.map((n) => (
          <li
            key={n.ssid}
            className="wifi-item"
            onClick={() => setSelected(n.ssid)}
          >
            {n.ssid}
          </li>
        ))}
      </ul>
      {connecting && <Spinner text="Connecting..." />}
      {status && (
        <p
          className={`status ${status.startsWith("✅") ? "success" : "error"}`}
        >
          {status}
        </p>
      )}
      <PasswordModal
        ssid={selected}
        onClose={() => setSelected(null)}
        onSubmit={submitWifi}
      />
    </div>
  );
};
