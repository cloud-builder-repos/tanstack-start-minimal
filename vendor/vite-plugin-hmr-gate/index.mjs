import { createHash } from "node:crypto";
import process from "node:process";
import { readFileSync } from "node:fs";
//#region gate.ts
/** Sentinel hash for a deleted file — distinct from any real content hash. */
const DELETED = "\0deleted";
/**
* Path segments of Vite-internal, dependency, and generated/runtime-state
* locations. Vite already omits some of these from its watcher, but the
* Cloudflare/miniflare runtime (`.wrangler`) and Nitro output (`.output`)
* churn constantly under the project root — gating them would pile up phantom
* events and force a full-reload on every flush. A passthrough path always
* reaches Vite's own handlers unchanged.
*/
const PASSTHROUGH_SEGMENTS = [
	"/node_modules/",
	"/.git/",
	"/.vite/",
	"/.tanstack/",
	"/.wrangler/",
	"/.output/",
	"/dist/"
];
/** Whether the gate must never hold events for this path. */
function isPassthrough(path) {
	return PASSTHROUGH_SEGMENTS.some((segment) => path.includes(segment));
}
/**
* Pure state: dedupes watcher events by content hash and holds one pending
* event per path (latest event wins) until flushed.
*/
var HmrGate = class {
	/**
	* Last committed content hash per path. Persists across flushes so a no-op
	* rewrite (identical bytes) never produces an event, even after a flush.
	*/
	#hashes = /* @__PURE__ */ new Map();
	/** Held events keyed by path, in first-seen order. */
	#pending = /* @__PURE__ */ new Map();
	/**
	* Record a raw watcher event. `content` is the file's new bytes (omit for
	* `unlink`). Returns true when a pending event was (re)recorded, false when
	* the path is passthrough or the content is unchanged (a no-op rewrite).
	*/
	record(type, path, content) {
		if (isPassthrough(path)) return false;
		const hash = type === "unlink" ? DELETED : hashOf(content);
		if (this.#hashes.get(path) === hash) return false;
		this.#hashes.set(path, hash);
		this.#pending.set(path, type);
		return true;
	}
	/** Read-only snapshot of currently-held events. */
	status() {
		return [...this.#pending].map(([path, type]) => ({
			type,
			path
		}));
	}
	/** Number of held events. */
	get size() {
		return this.#pending.size;
	}
	/** Drain held events for replay and clear the pending set (hashes persist). */
	flush() {
		const events = this.status();
		this.#pending.clear();
		return events;
	}
};
function hashOf(content) {
	return createHash("sha1").update(content ?? "").digest("hex");
}
/**
* Orchestrates the gate against injected effects: intercepts watcher events
* (reading content to hash), and on flush replays held events into Vite then
* fires exactly one full-reload.
*/
var GateController = class {
	#gate = new HmrGate();
	#effects;
	constructor(effects) {
		this.#effects = effects;
	}
	/**
	* Handle one raw watcher event. Returns true if the event was intercepted
	* (the caller must NOT propagate it to Vite); false for passthrough paths
	* (the caller must let Vite handle them as usual).
	*/
	intercept(type, path) {
		if (isPassthrough(path)) return false;
		const content = type === "unlink" ? void 0 : this.#effects.readFile(path);
		this.#gate.record(type, path, content);
		return true;
	}
	/** Read-only snapshot of held events. */
	status() {
		return this.#gate.status();
	}
	/**
	* Replay held events into Vite, then fire one full-reload. A harmless no-op
	* (no replay, no reload) when nothing is held. Returns the flushed events.
	*/
	flush() {
		const events = this.#gate.flush();
		for (const event of events) this.#effects.replay(event.type, event.path);
		if (events.length > 0) this.#effects.reload();
		return events;
	}
};
/** Env var the platform sets to enable the gate inside the preview sandbox. */
const HMR_GATE_ENV = "HMR_GATE";
/**
* Whether the prevention layer is enabled — true only when the platform sets
* `HMR_GATE` in the sandbox. Off in local dev, so behavior matches native
* vite. The platform side that sets this lives in the builder repo (golden
* template env + engine preview env — a separate ticket); keep this name in
* sync with it, same precedent as the preview-port constant.
*/
function gateEnabledFromEnv(env = process.env) {
	const value = env[HMR_GATE_ENV];
	return value === "1" || value === "true" || value === "on";
}
//#endregion
//#region plugin.ts
/** Platform posts here at turn end to release held events + full-reload once. */
const FLUSH_ENDPOINT = "/__hmr_flush";
/** Read-only view of the events the gate is currently holding. */
const STATUS_ENDPOINT = "/__hmr_status";
const WATCH_EVENTS = /* @__PURE__ */ new Set([
	"change",
	"add",
	"unlink"
]);
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
function hmrGate() {
	const enabled = gateEnabledFromEnv();
	return {
		name: "hmr-gate",
		apply: "serve",
		configureServer(server) {
			if (!enabled) return;
			const { watcher } = server;
			const originalEmit = watcher.emit.bind(watcher);
			const controller = new GateController({
				readFile: (path) => {
					try {
						return readFileSync(path);
					} catch {
						return;
					}
				},
				replay: (type, path) => {
					originalEmit(type, path);
				},
				reload: () => {
					server.ws.send({ type: "full-reload" });
				}
			});
			watcher.emit = (event, ...args) => {
				if (typeof event === "string" && WATCH_EVENTS.has(event)) {
					const file = args[0];
					if (typeof file === "string" && controller.intercept(event, file)) return true;
				}
				return originalEmit(event, ...args);
			};
			server.middlewares.use((req, res, next) => {
				const pathname = (req.url ?? "").split("?")[0];
				if (req.method === "POST" && pathname === "/__hmr_flush") {
					const flushed = controller.flush();
					sendJson(res, {
						flushed,
						count: flushed.length
					});
					return;
				}
				if (req.method === "GET" && pathname === "/__hmr_status") {
					const pending = controller.status();
					sendJson(res, {
						gated: true,
						pending,
						count: pending.length
					});
					return;
				}
				next();
			});
		}
	};
}
function sendJson(res, body) {
	res.statusCode = 200;
	res.setHeader("content-type", "application/json");
	res.end(JSON.stringify(body));
}
//#endregion
export { FLUSH_ENDPOINT, HMR_GATE_ENV, STATUS_ENDPOINT, gateEnabledFromEnv, hmrGate };
