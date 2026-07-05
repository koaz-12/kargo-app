'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useState, useEffect } from 'react';
import { createIDBPersister } from '../lib/query-persister';

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute
                gcTime: 24 * 60 * 60 * 1000, // 24 hours caching for offline mode
                refetchOnWindowFocus: false,
                retry: 1,
            },
            mutations: {
                retry: 0,
            },
        },
    }));

    const [persister, setPersister] = useState<any>(null);

    useEffect(() => {
        // We initialize it here so SSR doesn't fail accessing indexedDB
        setPersister(createIDBPersister());
    }, []);

    if (!persister) {
        // Return children wrapped in standard QueryClientProvider while calculating 
        // the persister on client side, avoiding hydration context mismatch.
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    }

    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister }}
        >
            {children}
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} position="bottom" />
            )}
        </PersistQueryClientProvider>
    );
}
