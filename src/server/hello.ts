import { createServerFn } from "@tanstack/react-start";

import { formatGreeting } from "../lib/greeting";

/**
 * Example server function. Runs only on the server; the client calls it over a
 * same-origin RPC boundary. Add new ones as `createServerFn(...).handler(...)`.
 */
export const getGreeting = createServerFn({ method: "GET" })
  .inputValidator((name: string) => name)
  .handler(({ data }) => {
    return { message: formatGreeting(data), at: new Date().toISOString() };
  });
