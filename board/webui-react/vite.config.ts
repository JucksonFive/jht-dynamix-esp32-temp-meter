import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../data/html", // suoraan ESP32 data/html kansioon
    emptyOutDir: true,
    assetsDir: ".",
    sourcemap: false,
    minify: "esbuild",
  },
});
