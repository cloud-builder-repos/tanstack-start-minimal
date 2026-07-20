/** Pure, framework-agnostic helper — the kind of logic that gets unit-tested. */
export function formatGreeting(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? `Hello, ${trimmed}!` : "Hello, world!";
}
