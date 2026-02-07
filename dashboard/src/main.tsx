import React from "react";
import ReactDOM from "react-dom/client";
import App from "src/App";
import "src/index.css";

import { Amplify } from "aws-amplify";
import { buildAmplifyConfig } from "src/amplify-config";
import { AppProvider } from "src/contexts/AppContext";
import { ThemeProvider } from "src/contexts/ThemeContext";
import { fetchDashboardConfig } from "src/services/api";
import { setRuntimeConfig } from "src/utils/runtimeConfig";

const bootstrap = async () => {
  try {
    const cfg = await fetchDashboardConfig();
    setRuntimeConfig(cfg);
  } catch (e) {}

  Amplify.configure(buildAmplifyConfig());

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <ThemeProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </ThemeProvider>
    </React.StrictMode>,
  );
};

bootstrap();
