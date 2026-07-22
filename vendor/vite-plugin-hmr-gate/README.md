# vendored: @unseal-network/vite-plugin-hmr-gate

Vendored copy of `@unseal-network/vite-plugin-hmr-gate@0.1.0` (the compiled
`dist/`, verbatim).

**Why vendored, not a dependency.** The package is published to GitHub Packages
(`npm.pkg.github.com`), which requires a `read:packages` token to install **even
for public packages** — and the E2B golden-template bake has no build-secret
mechanism to supply one without baking it into the image. Vendoring the two
zero-dependency files (it imports only `node:*` and has `vite` as a peer, which
this repo already has) removes that token requirement from the bake entirely.
See builder ADR 0003 and cloud-app-builder issue #37.

**Source of truth.** `cloud-app-builder/packages/vite-plugin-hmr-gate`.

**Updating.** Re-copy `dist/index.mjs` + `dist/index.d.mts` from a fresh
`@unseal-network/vite-plugin-hmr-gate` install (or a `dist` build of the source
package) into this directory. Keep the version above in sync.
