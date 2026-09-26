"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  // One client per browser session, created inside the component so it is never
  // shared between requests during server rendering.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            // A 404 from the API means "not yours or not there"; retrying it
            // just delays the empty state.
            retry: (failureCount, error) =>
              failureCount < 2 && !String(error.message).startsWith("404"),
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
