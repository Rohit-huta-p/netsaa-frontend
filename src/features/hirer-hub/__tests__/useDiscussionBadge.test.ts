// Unit tests for the owner-hub new-comment badge. These drive the hook's
// `onMessages(messages, loading)` input directly (the real DiscussionTab feeds
// it in the app) and assert the badge count across the cases that matter:
// first-ever open, empty-then-first-comment, exclusions, clear-while-open, and
// per-gig persistence across remounts.

import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDiscussionBadge } from '../hooks/useDiscussionBadge';

// Control the current user id so the "exclude my own comments" case is testable.
let mockUserId: string | undefined;
jest.mock('@/stores/authStore', () => ({
    __esModule: true,
    default: (selector: any) => selector({ user: mockUserId ? { _id: mockUserId } : null }),
}));

const iso = (ms: number) => new Date(ms).toISOString();
const msg = (id: string, authorId: string, ms: number, extra: Record<string, unknown> = {}) =>
    ({ _id: id, authorId, createdAt: iso(ms), ...extra });

describe('useDiscussionBadge', () => {
    beforeEach(async () => {
        mockUserId = undefined;
        await AsyncStorage.clear();
    });

    it('treats a thread that already has comments as seen on first open (no backlog)', async () => {
        const { result } = renderHook(() => useDiscussionBadge('g1', false));
        await waitFor(() => {}); // flush hydrate
        act(() => result.current.onMessages([msg('a', 'u2', 1000), msg('b', 'u3', 2000)], false));
        await waitFor(() => expect(result.current.badge).toBe(0));
    });

    it('badges the first comment on a fresh (empty) gig', async () => {
        const { result } = renderHook(() => useDiscussionBadge('g1', false));
        await waitFor(() => {});
        act(() => result.current.onMessages([], false)); // fetch settles empty
        await waitFor(() => expect(result.current.badge).toBe(0));
        act(() => result.current.onMessages([msg('q1', 'u2', 5000)], false)); // first question
        await waitFor(() => expect(result.current.badge).toBe(1));
    });

    it('badges only comments newer than the baseline', async () => {
        const { result } = renderHook(() => useDiscussionBadge('g1', false));
        await waitFor(() => {});
        act(() => result.current.onMessages([msg('a', 'u2', 1000), msg('b', 'u3', 2000)], false)); // baseline 2000
        await waitFor(() => expect(result.current.badge).toBe(0));
        act(() => result.current.onMessages([msg('a', 'u2', 1000), msg('b', 'u3', 2000), msg('c', 'u4', 3000)], false));
        await waitFor(() => expect(result.current.badge).toBe(1));
    });

    it('excludes my own, optimistic (temp-) and deleted comments', async () => {
        mockUserId = 'me';
        const { result } = renderHook(() => useDiscussionBadge('g1', false));
        await waitFor(() => {});
        act(() => result.current.onMessages([], false)); // baseline 0
        await waitFor(() => expect(result.current.badge).toBe(0));
        act(() => result.current.onMessages([
            msg('mine', 'me', 5000),
            msg('temp-1', 'u2', 6000),
            msg('del', 'u3', 7000, { isDeleted: true }),
            msg('real', 'u4', 8000),
        ], false));
        await waitFor(() => expect(result.current.badge).toBe(1)); // only 'real'
    });

    it('does NOT badge before the initial fetch settles (loading)', async () => {
        const { result } = renderHook(() => useDiscussionBadge('g1', false));
        await waitFor(() => {});
        // messages arrive but the fetch is still loading → no baseline yet, 0
        act(() => result.current.onMessages([msg('a', 'u2', 1000)], true));
        await waitFor(() => {});
        expect(result.current.badge).toBe(0);
    });

    it('clears while the Discussion tab is active and holds at 0 as new ones arrive', async () => {
        const { result, rerender } = renderHook(
            ({ a }: { a: boolean }) => useDiscussionBadge('g1', a),
            { initialProps: { a: false } }
        );
        await waitFor(() => {});
        act(() => result.current.onMessages([msg('a', 'u2', 1000)], false)); // baseline 1000
        await waitFor(() => expect(result.current.badge).toBe(0));
        act(() => result.current.onMessages([msg('a', 'u2', 1000), msg('b', 'u3', 2000)], false));
        await waitFor(() => expect(result.current.badge).toBe(1));
        rerender({ a: true }); // open Discussion
        await waitFor(() => expect(result.current.badge).toBe(0));
        act(() => result.current.onMessages([msg('a', 'u2', 1000), msg('b', 'u3', 2000), msg('c', 'u4', 3000)], false));
        await waitFor(() => expect(result.current.badge).toBe(0)); // stays 0 while watching
    });

    it('persists the watermark across remounts (per gig)', async () => {
        const first = renderHook(() => useDiscussionBadge('g1', false));
        await waitFor(() => {});
        act(() => first.result.current.onMessages([msg('a', 'u2', 1000), msg('b', 'u3', 2000)], false)); // baseline 2000
        await waitFor(() => expect(first.result.current.badge).toBe(0));
        first.unmount();

        const second = renderHook(() => useDiscussionBadge('g1', false));
        await waitFor(() => {}); // reads stored 2000
        act(() => second.result.current.onMessages([msg('a', 'u2', 1000), msg('b', 'u3', 2000), msg('c', 'u4', 3000)], false));
        await waitFor(() => expect(second.result.current.badge).toBe(1)); // only the newer 'c'
    });
});
