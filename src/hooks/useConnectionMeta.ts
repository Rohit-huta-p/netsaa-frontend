import { useQuery } from '@tanstack/react-query';
import connectionService from '@/services/connectionService';
import { useAuthStore } from '@/stores/authStore';

/**
 * Hooks for per-pair connection metadata:
 *   - useMutualConnections: number + sample of users in common
 *   - useConnectionDegree : 1 | 2 | 3 | null (null = 4+ or disconnected)
 *
 * Both endpoints are server-cached in Redis so client caching can be aggressive.
 * We use long staleTime (5 min) to avoid re-fetching on every profile remount.
 */

type MutualsPayload = {
    count: number;
    users: Array<{
        _id: string;
        displayName: string;
        profileImageUrl?: string;
        role?: string;
        artistType?: string | string[];
    }>;
};

export function useMutualConnections(userId: string | undefined, limit = 10) {
    const { user } = useAuthStore();
    const meId = (user as any)?._id;

    return useQuery<MutualsPayload, Error>({
        queryKey: ['mutual-connections', meId, userId, limit],
        queryFn: () => connectionService.getMutualConnections(userId!, limit),
        enabled: !!userId && !!meId && userId !== meId,
        staleTime: 5 * 60 * 1000,      // 5 min — server Redis cache is 10min
        gcTime: 15 * 60 * 1000,        // keep in memory 15 min
    });
}

type DegreePayload = { degree: 1 | 2 | 3 | null };

export function useConnectionDegree(userId: string | undefined) {
    const { user } = useAuthStore();
    const meId = (user as any)?._id;

    return useQuery<DegreePayload, Error>({
        queryKey: ['connection-degree', meId, userId],
        queryFn: () => connectionService.getConnectionDegree(userId!),
        enabled: !!userId && !!meId && userId !== meId,
        staleTime: 10 * 60 * 1000,     // 10 min — server Redis TTL is 1h
        gcTime: 30 * 60 * 1000,
    });
}

export type PYMKSuggestion = {
    userId: string;
    displayName: string;
    profileImageUrl?: string;
    role?: string;
    artistType?: string | string[];
    primaryCity?: string | null;
    mutualCount: number;
    score: number;
    reason: string;
};

type PYMKPayload = {
    suggestions: PYMKSuggestion[];
    cached?: boolean;
};

/**
 * People You May Know. Server-cached 1h on-demand, 24h when warmed by
 * the daily BullMQ cron. Client cache is 30min — aggressive because
 * PYMK results are stable between connection changes.
 */
export function usePYMK(limit = 10) {
    const { user } = useAuthStore();
    const meId = (user as any)?._id;

    return useQuery<PYMKPayload, Error>({
        queryKey: ['pymk', meId, limit],
        queryFn: () => connectionService.getPYMK(limit),
        enabled: !!meId,
        staleTime: 30 * 60 * 1000,     // 30 min client cache
        gcTime: 60 * 60 * 1000,        // keep 1 hr in memory
    });
}
