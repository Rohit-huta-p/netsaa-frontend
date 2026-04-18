import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import connectionService, { type FollowListUser } from '@/services/connectionService';
import { useAuthStore } from '@/stores/authStore';

/**
 * Follow relationship + counts + list hooks (PRD §8.9.5).
 *
 * All mutations invalidate the relevant queries on success so the UI
 * updates without manual refetches.
 */

export type FollowStatus = { iFollow: boolean; followsMe: boolean };
export type FollowCounts = { followers: number; following: number };

export { type FollowListUser };

// ── Keys ──
export const followKeys = {
    status: (targetId: string | undefined) => ['follow-status', targetId] as const,
    counts: (userId: string | undefined) => ['follow-counts', userId] as const,
    followingList: (userId: string | undefined) => ['following-list', userId] as const,
    followersList: (userId: string | undefined) => ['followers-list', userId] as const,
};

// ── Follow status (am I following them? do they follow me back?) ──
export function useFollowStatus(targetId: string | undefined) {
    const { user } = useAuthStore();
    const meId = (user as any)?._id;

    return useQuery<FollowStatus, Error>({
        queryKey: followKeys.status(targetId),
        queryFn: () => connectionService.getFollowStatus(targetId!),
        enabled: !!targetId && !!meId && targetId !== meId,
        staleTime: 2 * 60 * 1000,   // 2 min
        gcTime: 10 * 60 * 1000,
    });
}

// ── Follower + following counts for a given user ──
export function useFollowCounts(userId: string | undefined) {
    return useQuery<FollowCounts, Error>({
        queryKey: followKeys.counts(userId),
        queryFn: () => connectionService.getFollowCounts(userId!),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
    });
}

// ── My following / followers lists ──
export function useMyFollowing(limit = 50) {
    const { user } = useAuthStore();
    const meId = (user as any)?._id;
    return useQuery<FollowListUser[], Error>({
        queryKey: followKeys.followingList(meId),
        queryFn: () => connectionService.getFollowing(limit, 0),
        enabled: !!meId,
        staleTime: 2 * 60 * 1000,
    });
}

export function useMyFollowers(limit = 50) {
    const { user } = useAuthStore();
    const meId = (user as any)?._id;
    return useQuery<FollowListUser[], Error>({
        queryKey: followKeys.followersList(meId),
        queryFn: () => connectionService.getFollowers(limit, 0),
        enabled: !!meId,
        staleTime: 2 * 60 * 1000,
    });
}

// ── Mutations (with optimistic cache updates) ──
export function useFollowMutations(targetId: string | undefined) {
    const qc = useQueryClient();
    const { user } = useAuthStore();
    const meId = (user as any)?._id;

    const invalidate = () => {
        if (targetId) {
            qc.invalidateQueries({ queryKey: followKeys.status(targetId) });
            qc.invalidateQueries({ queryKey: followKeys.counts(targetId) });
        }
        if (meId) {
            qc.invalidateQueries({ queryKey: followKeys.counts(meId) });
            qc.invalidateQueries({ queryKey: followKeys.followingList(meId) });
        }
    };

    const follow = useMutation({
        mutationFn: () => connectionService.followUser(targetId!),
        onMutate: async () => {
            // Optimistic: set iFollow=true immediately
            if (!targetId) return;
            await qc.cancelQueries({ queryKey: followKeys.status(targetId) });
            const prev = qc.getQueryData<FollowStatus>(followKeys.status(targetId));
            qc.setQueryData<FollowStatus>(followKeys.status(targetId), {
                iFollow: true,
                followsMe: prev?.followsMe ?? false,
            });
            return { prev };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.prev && targetId) {
                qc.setQueryData(followKeys.status(targetId), ctx.prev);
            }
        },
        onSettled: invalidate,
    });

    const unfollow = useMutation({
        mutationFn: () => connectionService.unfollowUser(targetId!),
        onMutate: async () => {
            if (!targetId) return;
            await qc.cancelQueries({ queryKey: followKeys.status(targetId) });
            const prev = qc.getQueryData<FollowStatus>(followKeys.status(targetId));
            qc.setQueryData<FollowStatus>(followKeys.status(targetId), {
                iFollow: false,
                followsMe: prev?.followsMe ?? false,
            });
            return { prev };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.prev && targetId) {
                qc.setQueryData(followKeys.status(targetId), ctx.prev);
            }
        },
        onSettled: invalidate,
    });

    return { follow, unfollow };
}
