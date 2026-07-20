import { createFileRoute } from "@tanstack/react-router";

import { Card } from "../components/Card";
import { getGreeting } from "../server/hello";

export const Route = createFileRoute("/")({
  component: Home,
  // Runs the server function during SSR / route matching.
  loader: () => getGreeting({ data: "TanStack Start" }),
});

function Home() {
  const greeting = Route.useLoaderData();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">TanStack Start · Minimal Template</h1>
        <p className="mt-2 text-gray-600">
          A headless golden base: SSR + server functions, TypeScript strict, Tailwind v4. No auth,
          no database.
        </p>
      </div>

      <Card title="Server function">
        <p>{greeting.message}</p>
        <p className="mt-1 text-sm text-gray-400">rendered at {greeting.at}</p>
      </Card>
    </main>
  );
}
