# tanstack-start-minimal

A minimal **TanStack Start** frontend template (SSR + server functions). The golden base for every end-user project of the AI site-builder product: a single app, a single `package.json`, minimal dependencies — **no auth, no database, not a monorepo**.

Stack: TypeScript (strict) · Tailwind CSS v4 · Cloudflare Workers/workerd · shadcn/ui · **[Vite+](https://viteplus.dev)** (the `vp` toolchain — Vite + Rolldown, Vitest, Oxlint, Oxfmt) on Bun.

AI agents: read [`AGENTS.md`](./AGENTS.md) first.

## Getting started

Install the Vite+ CLI once (it manages the package manager and Node version for you):

```bash
curl -fsSL https://vite.plus | bash   # macOS / Linux
# Windows (PowerShell): irm https://vite.plus/ps1 | iex
```

Then, in the project:

```bash
vp install
vp dev        # http://localhost:3000
```

## Scripts

`vp` is the entry point for everything. The `package.json` scripts wrap it, so `bun run <script>` works too.

| Command              | Purpose                                                |
| -------------------- | ------------------------------------------------------ |
| `vp dev`             | Local dev (Vite + workerd; no separate `wrangler dev`) |
| `vp build`           | Production build (Cloudflare Worker → `dist/`)         |
| `vp preview`         | Preview the production build locally                   |
| `vp check`           | Quality gate: format + lint + type-check               |
| `vp test run`        | Run tests once (Vitest)                                |
| `vp lint` / `vp fmt` | Lint (Oxlint) / format (Oxfmt) individually            |

> `vp check`'s type-checker needs `src/routeTree.gen.ts`, which the dev server and `build` generate. Keep `vp dev` running so it does not falsely fail on a missing generated file.

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

This template targets Cloudflare Workers. `@unseal-ai/vite-tanstack-config` installs Cloudflare's Vite integration and runs SSR in workerd during `vp dev`; do not run a separate `wrangler dev`. `wrangler.jsonc` remains the source of bindings and compatibility settings, while `vp build` emits the Worker deployment output. See the [Cloudflare × TanStack Start docs](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/).
