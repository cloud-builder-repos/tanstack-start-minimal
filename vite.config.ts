import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    // tanstackStart wires file-based routing + SSR; nitro provides the
    // deployable server (Node output by default; preset is switchable, see
    // README "Deployment"). viteReact must come after tanstackStart.
    tanstackStart(),
    nitro(),
    viteReact(),
  ],
});
