import { defineConfig } from "@unseal-ai/vite-tanstack-config";

export default defineConfig({
  vite: {
    fmt: {},
    lint: {
      jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
      rules: { "vite-plus/prefer-vite-plus-imports": "error" },
      options: { typeAware: true, typeCheck: true },
    },
    server: {
      host: true,
      port: 3000,
      allowedHosts: true,
    },
  },
});
