import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("aws-amplify")) return "amplify";
            if (id.includes("recharts")) return "recharts";
            if (id.includes("date-fns")) return "date-fns";
            return "vendor";
          }
        },
      },
    },
  },
});
