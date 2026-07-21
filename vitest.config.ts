import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

// Tests run against plain modules (pure logic / components), so we deliberately
// do NOT load the tanstackStart/nitro plugins here — keeps the test runtime
// simple and fast. Test files live next to their source as `*.test.ts(x)`.
export default defineConfig({
  plugins: [viteReact()],
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
