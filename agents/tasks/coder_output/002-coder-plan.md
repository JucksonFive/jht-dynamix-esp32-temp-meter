### Summary

This change introduces Progressive Web App (PWA) capabilities to the dashboard. It adds a web app manifest and a minimal service worker, making the dashboard installable on users' desktops or mobile home screens for an app-like experience.

### Implementation Plan

**Assumption:** The `dashboard` directory contains a standard Vite+React project structure, including an `index.html` at the root and a `src/main.tsx` as the main application entry point. The following changes are based on this assumption.

1.  **Update Manifest:** Modify `dashboard/public/manifest.json` to replace the placeholder content with details specific to the JHT-Dynamix Temperature Dashboard.
2.  **Create Service Worker:** Create a new, minimal service worker file at `dashboard/public/sw.js`. This file will be empty of logic for now, fulfilling the PWA requirement for an install prompt.
3.  **Link Manifest:** Update `dashboard/index.html` to add a `<link>` tag for the manifest and a `<meta>` tag for the theme color in the document `<head>`.
4.  **Register Service Worker:** Add JavaScript to `dashboard/src/main.tsx` to register the new service worker when the application loads.

### Code Changes

```diff
diff --git a/dashboard/index.html b/dashboard/index.html
--- a/dashboard/index.html
+++ b/dashboard/index.html
@@ -3,7 +3,9 @@
   <head>
     <meta charset="UTF-8" />
     <link rel="icon" href="/favicon.ico" />
+    <link rel="manifest" href="/manifest.json" />
     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
+    <meta name="theme-color" content="#1f2937" />
     <title>JHT-Dynamix Dashboard</title>
   </head>
   <body>

```
```diff
diff --git a/dashboard/public/manifest.json b/dashboard/public/manifest.json
index 752225f..6d37651 100644
--- a/dashboard/public/manifest.json
+++ b/dashboard/public/manifest.json
@@ -1,7 +1,7 @@
 {
-  "short_name": "React App",
-  "name": "Create React App Sample",
+  "short_name": "Temp Meter",
+  "name": "JHT-Dynamix Temperature Dashboard",
   "icons": [
     {
       "src": "favicon.ico",
@@ -17,7 +17,7 @@
   ],
   "start_url": ".",
   "display": "standalone",
-  "theme_color": "#000000",
+  "theme_color": "#1f2937",
   "background_color": "#ffffff"
 }

```
```diff
diff --git a/dashboard/public/sw.js b/dashboard/public/sw.js
new file mode 100644
index 0000000..f69a194
--- /dev/null
+++ b/dashboard/public/sw.js
@@ -0,0 +1,3 @@
+// This is a minimal service worker to enable PWA installation.
+// Caching and offline support will be added in a future ticket.
+

```
```diff
diff --git a/dashboard/src/main.tsx b/dashboard/src/main.tsx
--- a/dashboard/src/main.tsx
+++ b/dashboard/src/main.tsx
@@ -3,6 +3,19 @@
 import App from "./App";
 import "./index.css";
 
+// Register the service worker for PWA functionality.
+if ("serviceWorker" in navigator) {
+  window.addEventListener("load", () => {
+    navigator.serviceWorker
+      .register("/sw.js")
+      .then((registration) => {
+        console.log("Service Worker registered: ", registration);
+      })
+      .catch((registrationError) => {
+        console.log("Service Worker registration failed: ", registrationError);
+      });
+  });
+}
+
 ReactDOM.createRoot(document.getElementById("root")!).render(
   <React.StrictMode>
     <App />

```

### Tests

#### Automated Tests

No automated tests are added in this change. Existing tests should continue to pass.

#### Manual Tests

1.  **Build and serve the dashboard:** Run `npm run build` and then `npm run preview` inside the `dashboard` directory.
2.  **Verify PWA readiness:**
    *   Open the dashboard in a compatible browser (e.g., Chrome).
    *   Open Developer Tools and navigate to the **Lighthouse** tab.
    *   Run a PWA audit and confirm that the "Installable" check passes.
3.  **Verify Manifest and Service Worker:**
    *   In Developer Tools, navigate to the **Application** tab.
    *   Under **Manifest**, check that the details from `manifest.json` are loaded correctly (e.g., name, colors, icons).
    *   Under **Service Workers**, confirm that `sw.js` is registered and activated.
4.  **Test Installation:**
    *   An "Install" icon should appear in the browser's address bar. Click it and complete the installation prompt.
    *   Verify a new application icon appears on your desktop or mobile home screen.
5.  **Test Standalone Launch:**
    *   Close the browser tab.
    *   Launch the dashboard using the newly created home screen icon.
    *   Confirm that the application opens in its own standalone window, without browser UI elements like the address bar.
6.  **Regression Check:**
    *   Briefly navigate through the installed application (e.g., log in, view charts) to ensure all existing functionality remains intact.