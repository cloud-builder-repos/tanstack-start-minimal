import type { ReactNode } from "react";

/** Example shared component. Styled with Tailwind utility classes only. */
export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold text-gray-900">{title}</h2>
      <div className="text-gray-600">{children}</div>
    </section>
  );
}
