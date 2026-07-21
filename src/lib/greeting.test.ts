import { describe, expect, it } from "vite-plus/test";

import { formatGreeting } from "./greeting";

describe("formatGreeting", () => {
  it("greets a named person", () => {
    expect(formatGreeting("Ada")).toBe("Hello, Ada!");
  });

  it("trims surrounding whitespace", () => {
    expect(formatGreeting("  Ada  ")).toBe("Hello, Ada!");
  });

  it("falls back to the world when the name is empty", () => {
    expect(formatGreeting("   ")).toBe("Hello, world!");
  });
});
