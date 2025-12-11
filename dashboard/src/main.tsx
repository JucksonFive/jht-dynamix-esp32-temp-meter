import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { Amplify } from "aws-amplify";
import { buildAmplifyConfig } from "./amplify-config";
import { AppProvider } from "./contexts/AppContext";
import { fetchDashboardConfig } from "./services/api";
import { setRuntimeConfig } from "./utils/runtimeConfig";

const bootstrap = async () => {
  try {
    const cfg = await fetchDashboardConfig();
    setRuntimeConfig(cfg);
  } catch (e) {}

  Amplify.configure(buildAmplifyConfig());

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <AppProvider>
        <App />
      </AppProvider>
    </React.StrictMode>
  );
};

bootstrap();
