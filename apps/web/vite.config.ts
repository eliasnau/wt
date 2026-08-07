import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
  },
  // Keep one external React instance for SSR and explicitly include it in the
  // deploy artifact. Bundling React creates a second hook dispatcher, while
  // relying on automatic tracing misses pnpm's workspace-level installation.
  nitro: {
    traceDeps: ["react*", "react-dom*"],
  },
  plugins: [tailwindcss(), tanstackStart(), nitro(), viteReact()],
});
