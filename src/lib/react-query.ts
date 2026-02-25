// src/lib/react-query.ts
import { QueryClient, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

/* ── Online Manager ──
 * Bridges React Query's offline-aware features with the device's actual
 * network state.  When the device goes offline, React Query will:
 *   - Pause mutations (they queue automatically)
 *   - Mark queries as paused
 * When the device comes back online, React Query will:
 *   - Flush the queued mutations in order
 *   - Refetch paused queries
 */
onlineManager.setEventListener((setOnline) => {
    return NetInfo.addEventListener((state) => {
        setOnline(!!state.isConnected);
    });
});

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 2,
        },
        mutations: {
            // Retry once on transient failures (network blip)
            retry: 1,
        },
    },
});
