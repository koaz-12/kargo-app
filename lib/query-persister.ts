import { get, set, del } from 'idb-keyval';
import { Persister } from '@tanstack/react-query-persist-client';

/**
 * Creates an IndexedDB persister for React Query
 * This allows storing fetch results in the browser's local DB so they are
 * available when offline.
 */
export function createIDBPersister(idbValidKey: string = 'reactQuery') {
    return {
        persistClient: async (client: any) => {
            await set(idbValidKey, client);
        },
        restoreClient: async () => {
            return await get(idbValidKey);
        },
        removeClient: async () => {
            await del(idbValidKey);
        },
    } as Persister;
}
