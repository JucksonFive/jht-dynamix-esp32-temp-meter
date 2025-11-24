import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { Amplify } from "aws-amplify";
import amplifyConfig from "./amplify-config";
import { AppProvider } from "./contexts/AppContext";

Amplify.configure(amplifyConfig);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
