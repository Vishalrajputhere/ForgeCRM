'use client';

/**
 * TanStack Query Provider
 *
 * Wraps the application with a QueryClient for server state management.
 * Configured with sensible defaults for a CRM application.
 *
 * Documentation: docs/04_Frontend/404_STATE_MANAGEMENT.md
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

interface QueryProviderProps {
  readonly children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps): React.JSX.Element {
  // Create a new QueryClient per component instance to avoid shared state between users
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: 1 minute — data is considered fresh for 1 minute
            staleTime: 60 * 1000,
            // GC time: 10 minutes — cached data is kept for 10 minutes
            gcTime: 10 * 60 * 1000,
            // Retry failed requests up to 3 times with exponential backoff
            retry: (failureCount, error: unknown) => {
              // Don't retry on 4xx errors (client errors)
              if (
                error instanceof Error &&
                'status' in error &&
                typeof error.status === 'number' &&
                error.status >= 400 &&
                error.status < 500
              ) {
                return false;
              }
              return failureCount < 3;
            },
            // Refetch on window focus for up-to-date data
            refetchOnWindowFocus: true,
            // Don't refetch on reconnect (data may still be valid)
            refetchOnReconnect: 'always',
          },
          mutations: {
            // Retry mutations once on network errors
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query Devtools — only rendered in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
