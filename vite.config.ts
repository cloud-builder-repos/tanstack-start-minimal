import { cpSync, existsSync } from "node:fs";
import path from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, type Plugin, lazyPlugins } from "vite-plus";
import { gateEnabledFromEnv, hmrGate } from "@unseal-network/vite-plugin-hmr-gate";

/**
 * Build-only: stage the platform deploy contract (`.openai/hosting.json` +
 * `.openai/drizzle/*.sql`, written when a database is added) into the build
 * output, so the artifact is self-contained for the platform's deploy step.
 */
function stagePlatformArtifacts(): Plugin {
  return {
    name: "stage-platform-artifacts",
    apply: "build",
    closeBundle() {
      const from = path.resolve(process.cwd(), ".openai");
      const to = path.resolve(process.cwd(), "dist/.openai");
      if (existsSync(from) && existsSync(path.resolve(process.cwd(), "dist"))) {
        cpSync(from, to, { recursive: true });
      }
    },
  };
}

export default defineConfig({
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
    // Preview-supervision prevention layer (sandbox only, paired with the
    // hmrGate() plugin below): debounce the file watcher so chokidar fires on
    // write-stable files, not on every intermediate byte of an agent edit.
    // Off in local dev so watch behavior matches native vite. See ADR 0003.
    ...(gateEnabledFromEnv() && {
      watch: { awaitWriteFinish: { stabilityThreshold: 1000, pollInterval: 100 } },
    }),
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
    tanstackStart(),
    viteReact(),
    stagePlatformArtifacts(),
    // Preview-supervision HMR gate (sandbox only): holds file-watcher events
    // during an agent edit and flushes once at turn end via POST /__hmr_flush.
    hmrGate(),
  ]),
});
