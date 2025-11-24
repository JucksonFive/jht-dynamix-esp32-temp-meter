import React, { useState } from "react";
import { Spinner } from "./Spinner";

interface CredentialsStepProps {
  onLinked: () => void;
  onBack: () => void;
}

export const CredentialsStep: React.FC<CredentialsStepProps> = ({
  onLinked,
  onBack,
}) => {
  const [deviceId, setDeviceId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!deviceId || !username || !password) {
      alert("Fill all fields");
      return;
    }
    setLoading(true);
    setStatus(null);
    const fd = new FormData();
    fd.append("username", username.trim());
    fd.append("userPassword", password.trim());
    fd.append("deviceId", deviceId.trim());
    try {
      const res = await fetch("/link-device", { method: "POST", body: fd });
      setLoading(false);
      if (res.ok) {
        setStatus("✅ Device linked to user!");
        setTimeout(onLinked, 1200);
      } else {
        setStatus("❌ Connection failed.");
      }
    } catch (e) {
      setLoading(false);
      setStatus("❌ Network error. Try again.");
    }
  };

  return (
    <div className="step">
      <h2>2. JT-Credentials</h2>
      <input
        value={deviceId}
        onChange={(e) => setDeviceId(e.target.value)}
        placeholder="Device ID"
      />
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <p className="register-link">
        No account yet?{" "}
        <a href="http://localhost:5173/" target="_blank">
          Create one here
        </a>
      </p>
      <div className="button-group">
        <button type="button" onClick={onBack}>
          Back
        </button>
        <button type="button" onClick={submit}>
          Next
        </button>
      </div>
      {loading && <Spinner text="Connecting..." />}
      {status && (
        <p
          className={`status ${status.startsWith("✅") ? "success" : "error"}`}
        >
          {status}
        </p>
      )}
    </div>
  );
};
