import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
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
    // Official Cloudflare path (developers.cloudflare.com -> TanStack Start):
    // dev runs the SSR environment inside workerd (bindings via
    // `cloudflare:workers` -- identical in dev and production); build emits a
    // wrangler-deployable Worker. viteReact must come after tanstackStart.
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
    viteReact(),
  ],
});
