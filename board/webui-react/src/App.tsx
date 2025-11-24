import React, { useState } from "react";
import { ConfirmStep } from "./components/ConfirmStep";
import { CredentialsStep } from "./components/CredentialsStep";
import { WifiStep } from "./components/WifiStep";
import "./style.css";

export const App: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const handleWifiConnected = () => setStep(2);
  const handleCredentialsLinked = (vals?: {
    deviceId: string;
    username: string;
    userPassword: string;
  }) => {
    if (vals) setFormValues((v) => ({ ...v, ...vals }));
    setStep(3);
  };
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="container">
      <div className="header">
        <img src="globe.svg" alt="Globe Logo" className="logo" />
      </div>
      <h1>Device Configuration</h1>
      {step === 1 && <WifiStep onConnected={handleWifiConnected} />}
      {step === 2 && (
        <CredentialsStep
          onLinked={() => handleCredentialsLinked()}
          onBack={goBack}
        />
      )}
      {step === 3 && <ConfirmStep values={formValues} onBack={goBack} />}
      <footer className="footer">
        <p>JT-Dynamix &copy; 2025</p>
      </footer>
    </div>
  );
};
