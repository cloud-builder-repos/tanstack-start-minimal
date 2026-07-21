# tanstack-start-minimal

A minimal **TanStack Start** frontend template (SSR + server functions). The golden base for every end-user project of the AI site-builder product: a single app, a single `package.json`, minimal dependencies — **no auth, no database, not a monorepo**.

Stack: TypeScript (strict) · Tailwind CSS v4 · Vite · Nitro · Biome (lint + format) · Vitest · Bun.

AI agents: read [`AGENTS.md`](./AGENTS.md) first.

## Getting started

```bash
bun install
bun run dev        # http://localhost:3000
```

## Scripts

Invoke scripts with `bun run <script>` — plain `bun build` / `bun test` run Bun's own bundler / test runner, not these scripts.

| Command | Purpose |
|---|---|
| `bun run dev` | Local dev (Vite + Nitro) |
| `bun run build` | Production build (Cloudflare Worker → `dist/server/` + `dist/client/`) |
| `bun run start` | Preview the production build locally (`vite preview`) |
| `bun run check-types` / `bun run lint` / `bun run format` / `bun run test` | Quality-gate steps |

> `check-types` (tsc) needs `src/routeTree.gen.ts`, which the dev server and `build` generate. Keep `bun run dev` running so `tsc` does not falsely fail on a missing generated file.

## Project structure

```
src/
  routes/__root.tsx   # Root document
  routes/index.tsx    # Home "/", loader calls a server function for SSR
  server/hello.ts     # Server function example (createServerFn)
  components/Card.tsx # Shared component example
  lib/greeting.ts     # Pure logic example (+ greeting.test.ts unit test)
  styles.css          # Tailwind entry
```

## Database & auth

This template ships without a database or auth on purpose. They are **on-demand platform capabilities** — when a project needs persistence or login, the platform adds a **Cloudflare D1** database (a Worker binding, no connection string) and wires auth on top of it. See [`AGENTS.md`](./AGENTS.md) → "Adding a database / auth". Do not add Postgres, a `DATABASE_URL`, or provision cloud resources by hand.

## Deployment

Hosting is provided by **Nitro**, which can switch presets to emit output for different platforms. The default preset is `node-server`. Switch presets with the **`NITRO_PRESET`** environment variable — no code changes needed.

### Vercel

```bash
NITRO_PRESET=vercel bun run build
```

Output is in Vercel [Build Output API](https://vercel.com/docs/build-output-api) format: `.vercel/output/` (`config.json` + `functions/__server.func/` + `static/`).

On Vercel you **usually don't need to set `NITRO_PRESET` manually**: in the Vercel build environment Nitro auto-detects and applies the `vercel` preset (see the [Vercel × TanStack Start docs](https://vercel.com/docs/frameworks/full-stack/tanstack-start)). Import the repo into Vercel and use the default `bun run build`. Set the variable manually only when reproducing the production output structure locally.

### Cloudflare

Use Nitro's Cloudflare preset:

```bash
NITRO_PRESET=cloudflare_module bun run build
```

This template uses Cloudflare's official TanStack Start path: `@cloudflare/vite-plugin` (`cloudflare({ viteEnvironment: { name: "ssr" } })` before `tanstackStart()` in `vite.config.ts`) with `wrangler.jsonc` (`main: "@tanstack/react-start/server-entry"`). Dev runs the SSR environment inside workerd, so server code reads bindings via `import { env } from "cloudflare:workers"` — identical in dev and production. `bun run build` emits a wrangler-deployable Worker under `dist/` (`dist/server/index.js` + `dist/server/wrangler.json` + static assets in `dist/client/`). See the [Cloudflare × TanStack Start docs](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/).
