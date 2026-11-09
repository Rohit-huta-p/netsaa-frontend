import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import followService, { type FollowState } from '@/services/followService';
import { useAuthStore } from '@/stores/authStore';

/**
 * Follow state for `userId` + a one-tap optimistic toggle. A follow is a
 * one-way, instant subscription (notified when they post a gig/event) —
 * distinct from a Connection. Enabled for any signed-in viewer, including the
 * owner (so they can see their own follower count); the toggle is only wired
 * for non-owners in the UI.
 */
export function useFollow(userId: string | undefined) {
    const qc = useQueryClient();
    const meId = useAuthStore((s) => (s.user as any)?._id);
    const key = ['follow', meId, userId];

    const { data } = useQuery<FollowState, Error>({
        queryKey: key,
        queryFn: () => followService.getStatus(userId!),
        enabled: !!userId && !!meId,
        staleTime: 30 * 1000,
    });

    const [busy, setBusy] = useState(false);
    const isFollowing = data?.isFollowing ?? false;
    const followerCount = data?.followerCount ?? 0;

    const shift = (following: boolean, base: number) =>
        Math.max(0, base + (following ? 1 : -1));

    const toggle = async () => {
        if (!userId || busy) return;
        const next = !isFollowing;
        setBusy(true);
        // Optimistic — flip state + nudge the count, roll back on failure.
        qc.setQueryData<FollowState>(key, (old) => ({
            isFollowing: next,
            followerCount: shift(next, old?.followerCount ?? followerCount),
        }));
        try {
            const res = next
                ? await followService.follow(userId)
                : await followService.unfollow(userId);
            qc.setQueryData<FollowState>(key, res);
        } catch {
            qc.setQueryData<FollowState>(key, (old) => ({
                isFollowing: !next,
                followerCount: shift(!next, old?.followerCount ?? followerCount),
            }));
        } finally {
            setBusy(false);
        }
    };

    return { isFollowing, followerCount, toggle, busy };
}
