import { defineConfig } from "@unseal-ai/vite-tanstack-config";

export default defineConfig({
  vite: {
    server: {
      host: true,
      port: 3000,
      allowedHosts: true,
    },
  },
});
