// src/features/hirer-hub/hooks/useDiscussionBadge.ts
//
// Front-end-only "new comments since you last opened Discussion" badge for the
// owner hub. No backend: the thread (DiscussionTab) already fetches every
// comment and pushes live socket updates; it feeds its list + loading state
// here via `onMessages`. We keep a per-gig, per-device watermark (`lastSeenAt`)
// in AsyncStorage and badge = others' real comments newer than it.
//
// The baseline is established once the INITIAL fetch has settled (so an empty
// thread is distinguishable from a not-yet-loaded one):
//   - existing comments  → watermark = newest existing createdAt (all seen)
//   - empty thread       → watermark = 0 (epoch), so every future comment badges
// `lastSeenAt` is `null` until then, and the badge reads 0 while null — so the
// full backlog never flashes and the first comment on a fresh gig is NOT
// silently stamped as seen.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAuthStore from '@/stores/authStore';

export type BadgeMessage = {
    _id: string;
    authorId?: string;
    createdAt?: string;
    isDeleted?: boolean;
};

const keyFor = (gigId: string) => `hub:discussion:lastSeen:${gigId}`;

const timeOf = (iso?: string): number => {
    const t = iso ? new Date(iso).getTime() : 0;
    return Number.isFinite(t) ? t : 0;
};

const isReal = (m: BadgeMessage): boolean =>
    !m.isDeleted && !String(m._id).startsWith('temp-');

// Newest createdAt across all real comments (mine or others) — the "everything
// up to here has been seen" watermark. 0 for an empty/placeholder list.
function newestRealAt(msgs: BadgeMessage[]): number {
    let latest = 0;
    for (const m of msgs) {
        if (!isReal(m)) continue;
        const t = timeOf(m.createdAt);
        if (t > latest) latest = t;
    }
    return latest;
}

/**
 * @param gigId  the gig whose discussion we're badging
 * @param active true while the Discussion tab is on screen — new arrivals the
 *               owner is looking at advance the watermark instead of badging.
 * @returns `badge` (count to render) and `onMessages` (wire to DiscussionTab's
 *          `onMessagesChange`, which reports `(messages, loading)`).
 */
export function useDiscussionBadge(gigId: string, active: boolean) {
    const currentUserId = useAuthStore((s) => s.user?._id);

    const [messages, setMessages] = useState<BadgeMessage[]>([]);
    const [loaded, setLoaded] = useState(false);        // initial fetch settled
    const [hydrated, setHydrated] = useState(false);     // AsyncStorage read done
    const [lastSeenAt, setLastSeenAt] = useState<number | null>(null); // null = no baseline yet

    // Was a watermark already stored? Set during hydrate so the seed effect
    // never overwrites a stored baseline on a render race.
    const storedPresentRef = useRef(false);

    // Hydrate the stored watermark once per gig.
    useEffect(() => {
        let mounted = true;
        storedPresentRef.current = false;
        setHydrated(false);
        setLastSeenAt(null);
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(keyFor(gigId));
                if (!mounted) return;
                if (raw != null) {
                    const n = Number(raw);
                    storedPresentRef.current = true;
                    setLastSeenAt(Number.isFinite(n) ? n : 0);
                }
            } catch {
                /* treat as no stored baseline */
            } finally {
                if (mounted) setHydrated(true);
            }
        })();
        return () => { mounted = false; };
    }, [gigId]);

    const persist = useCallback((ts: number) => {
        AsyncStorage.setItem(keyFor(gigId), String(ts)).catch(() => {});
    }, [gigId]);

    // Wire this to DiscussionTab.onMessagesChange(messages, loading).
    const onMessages = useCallback((msgs: BadgeMessage[], loading?: boolean) => {
        setMessages(Array.isArray(msgs) ? msgs : []);
        if (loading === false) setLoaded(true);
    }, []);

    // Establish the baseline once the initial fetch settles and nothing was
    // stored: treat the whole existing thread as seen (newest existing time),
    // or epoch (0) for an empty thread so every future comment badges.
    useEffect(() => {
        if (!hydrated || storedPresentRef.current || lastSeenAt != null || !loaded) return;
        const base = newestRealAt(messages);
        setLastSeenAt(base);
        persist(base);
    }, [hydrated, loaded, lastSeenAt, messages, persist]);

    // While Discussion is open, keep the watermark at the newest comment so the
    // owner never sees a badge for something they're actively looking at.
    useEffect(() => {
        if (!hydrated || !active) return;
        const newest = newestRealAt(messages);
        const base = lastSeenAt ?? 0;
        if (newest > base) {
            setLastSeenAt(newest);
            persist(newest);
        }
    }, [active, hydrated, messages, lastSeenAt, persist]);

    // Badge = others' real comments newer than the watermark. 0 until a
    // baseline exists (hydrated + seeded), so the full total never flashes.
    const badge = useMemo(() => {
        if (!hydrated || lastSeenAt == null) return 0;
        let n = 0;
        for (const m of messages) {
            if (!isReal(m)) continue;
            if (currentUserId && String(m.authorId) === String(currentUserId)) continue;
            if (timeOf(m.createdAt) > lastSeenAt) n++;
        }
        return n;
    }, [hydrated, lastSeenAt, messages, currentUserId]);

    return { badge, onMessages };
}

export default useDiscussionBadge;
