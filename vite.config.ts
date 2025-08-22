import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const isCapacitor = process.env.BUILD_TARGET === "capacitor";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      ...(isCapacitor
        ? {}
        : {
            "capacitor-health": path.resolve(
              __dirname,
              "./src/stubs/capacitor-health.ts",
            ),
            "@capacitor/local-notifications": path.resolve(
              __dirname,
              "./src/stubs/local-notifications.ts",
            ),
            "@capacitor/push-notifications": path.resolve(
              __dirname,
              "./src/stubs/push-notifications.ts",
            ),
          }),
    },
  },
  build: {
    outDir: isCapacitor ? "www" : "build",
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
}));