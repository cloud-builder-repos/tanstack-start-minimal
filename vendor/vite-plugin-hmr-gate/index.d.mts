import { Plugin } from "vite";
//#region gate.d.ts
/**
 * HMR gate — the preview-supervision "prevention layer" for the project
 * templates' dev server.
 *
 * While an agent turn is editing files inside the platform sandbox, the dev
 * server must NOT chase half-written files and reload the preview mid-edit —
 * that is the dominant preview-crash trigger (a broken vite.config or a
 * half-saved module takes the SSR entry down). This module holds Vite's
 * file-watcher events until the platform flushes them once, at turn end, via
 * `POST /__hmr_flush`.
 *
 * The design is our own, MIT-referenced from Lovable's
 * `@lovable.dev/vite-plugin-hmr-gate` — we depend on no competitor package.
 * See builder ADR 0003 "Rollout §1" and spec #35 / #37.
 *
 * The logic here is pure and effect-injected so it unit-tests without a real
 * Vite server; `plugin.ts` is the thin adapter that wires it to
 * `server.watcher` / `server.middlewares` / `server.ws`.
 */
type WatchEventType = "change" | "add" | "unlink";
interface PendingEvent {
  readonly type: WatchEventType;
  readonly path: string;
}
/** Side effects the controller needs from the host Vite dev server. */
interface GateEffects {
  /** Read a file's current content for hashing (undefined if unreadable). */
  readFile(path: string): string | Uint8Array | undefined;
  /** Re-emit a held event into Vite so it refreshes its module graph. */
  replay(type: WatchEventType, path: string): void;
  /** Trigger a single browser full-reload. */
  reload(): void;
}
/** Env var the platform sets to enable the gate inside the preview sandbox. */
declare const HMR_GATE_ENV = "HMR_GATE";
/**
 * Whether the prevention layer is enabled — true only when the platform sets
 * `HMR_GATE` in the sandbox. Off in local dev, so behavior matches native
 * vite. The platform side that sets this lives in the builder repo (golden
 * template env + engine preview env — a separate ticket); keep this name in
 * sync with it, same precedent as the preview-port constant.
 */
declare function gateEnabledFromEnv(env?: Record<string, string | undefined>): boolean;
//#endregion
//#region plugin.d.ts
/** Platform posts here at turn end to release held events + full-reload once. */
declare const FLUSH_ENDPOINT = "/__hmr_flush";
/** Read-only view of the events the gate is currently holding. */
declare const STATUS_ENDPOINT = "/__hmr_status";
/**
 * HMR gate Vite plugin (dev-server only). Enabled inside the platform sandbox
 * (`HMR_GATE` env); a no-op in local dev, so behavior matches native vite.
 *
 * While enabled it holds Vite's file-watcher `change`/`add`/`unlink` events so
 * the preview never reloads a half-written edit, and exposes:
 *   - `POST /__hmr_flush`  → replay held events into Vite + one full-reload
 *   - `GET  /__hmr_status` → the currently-held events
 *
 * All logic lives in `GateController` (unit-tested); this file only wires it to
 * the live dev server. See `gate.ts` and builder ADR 0003.
 */
declare function hmrGate(): Plugin;
//#endregion
export { FLUSH_ENDPOINT, type GateEffects, HMR_GATE_ENV, type PendingEvent, STATUS_ENDPOINT, type WatchEventType, gateEnabledFromEnv, hmrGate };