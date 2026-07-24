import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin, lazyPlugins } from "vite-plus";
import { defineConfig as tanstackDefineConfig } from "@unseal-ai/vite-tanstack-config";


export default defineConfig(tanstackDefineConfig({
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
  resolve: {
    tsconfigPaths: true,
  },
  plugins: lazyPlugins(() => [
    tailwindcss(),
    // Official Cloudflare path (developers.cloudflare.com -> TanStack Start):
    // dev runs the SSR environment inside workerd (bindings via
    // `cloudflare:workers` -- identical in dev and production); build emits a
    // wrangler-deployable Worker. viteReact must come after tanstackStart.
    cloudflare({ viteEnvironment: { name: "ssr" } }),
  ]),
}));
