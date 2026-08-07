import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
  },
  // Nitro's dependency tracer can miss React when pnpm hoists it outside this
  // workspace package, leaving server chunks with require("react") but no
  // React package in the deployed function. Bundle it into the SSR output.
  ssr: command === "build" ? { noExternal: ["react", "react-dom"] } : undefined,
  plugins: [tailwindcss(), tanstackStart(), nitro(), viteReact()],
}));
