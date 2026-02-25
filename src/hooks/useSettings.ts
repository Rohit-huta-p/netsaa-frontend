// src/hooks/useSettings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import settingsService from '../services/settingsService';
import type { IUserSettings } from '../types';

/* ── Query / Mutation key factory ── */
export const settingsKeys = {
    all: ['settings'] as const,
    detail: () => [...settingsKeys.all, 'detail'] as const,
    mutation: () => [...settingsKeys.all, 'mutation'] as const,
};

/* ── Type for partial update payload ── */
export type SettingsUpdate = Partial<{
    privacy: Partial<IUserSettings['privacy']>;
    notifications: Partial<IUserSettings['notifications']>;
    messaging: Partial<IUserSettings['messaging']>;
    account: Partial<IUserSettings['account']>;
}>;

/**
 * Fetch user settings.
 * Returns normalized settings with server-applied defaults.
 */
export const useSettings = () => {
    return useQuery({
        queryKey: settingsKeys.detail(),
        queryFn: settingsService.getSettings,
    });
};

/**
 * Optimistically update settings with race-condition safety and offline support.
 *
 * Flow:
 *  1. Cancel in-flight settings queries (prevent stale overwrite)
 *  2. Snapshot current cache for rollback
 *  3. Optimistically merge update into cache → UI updates instantly
 *  4. Fire PATCH /users/me/settings
 *  5. On success → server response reconciles the cache
 *  6. On error  → rollback to snapshot + toast
 *  7. On settled → always revalidate from server
 *
 * Offline:
 *  - `networkMode: 'offlineFirst'` means the optimistic write happens immediately
 *  - React Query's onlineManager (wired to NetInfo) pauses the actual PATCH
 *  - When connectivity returns, the PATCH fires automatically
 *  - If multiple toggles were flipped offline, each mutation queues independently
 *
 * Race conditions:
 *  - Each onMutate reads the latest cache (which includes prior optimistic writes)
 *  - cancelQueries prevents stale refetches from overwriting optimistic data
 *  - onSettled always revalidates, reconciling the final server truth
 */
export const useUpdateSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: settingsKeys.mutation(),

        mutationFn: (update: SettingsUpdate) =>
            settingsService.updateSettings(update),

        // networkMode 'offlineFirst':
        //   - onMutate fires immediately (optimistic UI)
        //   - actual network call is paused when offline
        //   - auto-retried when back online via onlineManager
        networkMode: 'offlineFirst',

        onMutate: async (update) => {
            // ── 1. Cancel in-flight queries (prevent stale refetch overwriting optimistic data) ──
            // Race prevention: each onMutate reads the latest cache (including prior
            // optimistic writes), so rapid toggles chain correctly. onSettled always
            // revalidates from the server to reconcile the final truth.
            await queryClient.cancelQueries({ queryKey: settingsKeys.detail() });

            // ── 2. Snapshot for rollback ──
            const previous = queryClient.getQueryData<IUserSettings>(settingsKeys.detail());

            // ── 3. Optimistic merge ──
            if (previous) {
                const next = { ...previous };
                for (const section of ['privacy', 'notifications', 'messaging', 'account'] as const) {
                    if (update[section]) {
                        next[section] = { ...next[section], ...update[section] } as any;
                    }
                }
                queryClient.setQueryData(settingsKeys.detail(), next);
            }

            return { previous };
        },

        onSuccess: (serverSettings) => {
            // ── 5. Reconcile with server truth ──
            // The server returns the full normalized settings object.
            // We write it directly to cache so the UI reflects any server-side
            // coercions (e.g. the allowMessagesFrom/allowConnectionRequests constraint).
            queryClient.setQueryData(settingsKeys.detail(), serverSettings);
        },

        onError: (_err, _update, context) => {
            // ── 6. Rollback + toast ──
            if (context?.previous) {
                queryClient.setQueryData(settingsKeys.detail(), context.previous);
            }
            Alert.alert(
                'Update Failed',
                'Your setting could not be saved. Please try again.',
            );
        },

        onSettled: () => {
            // ── 7. Always revalidate from server ──
            // This catches any drift between optimistic state and server state.
            queryClient.invalidateQueries({ queryKey: settingsKeys.detail() });
        },
    });
};
