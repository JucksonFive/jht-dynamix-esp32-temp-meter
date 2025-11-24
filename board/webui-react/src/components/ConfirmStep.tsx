import React from "react";

interface ConfirmStepProps {
  values: Record<string, string>;
  onBack: () => void;
}

export const ConfirmStep: React.FC<ConfirmStepProps> = ({ values, onBack }) => {
  const summary = Object.entries(values)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  const submit = async () => {
    try {
      const res = await fetch("/complete-setup", { method: "POST" });
      const text = await res.text();
      alert(
        res.ok
          ? "✅ Setup complete! Device will restart."
          : `❌ Failed: ${text}`
      );
    } catch (e: unknown) {
      console.error("Setup submission failed:", e);
      const msg = e instanceof Error ? ` ${e.message}` : "";
      alert(`❌ Network error.${msg}`);
    }
  };

  return (
    <div className="step">
      <h2>3. Confirm Settings</h2>
      <pre>{summary}</pre>
      <div className="button-group">
        <button type="button" onClick={onBack}>
          Back
        </button>
        <button type="button" onClick={submit}>
          Save Configuration
        </button>
      </div>
    </div>
  );
};
