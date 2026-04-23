/**
 * useUnreadCount — React Query hook for the artist-home Messages preview.
 * Wraps conversationService.getConversations() and aggregates an unread
 * total.
 *
 * RETURN SHAPE
 * ------------
 *   {
 *     totalUnread: number,              // sum of unreadCount across threads
 *     threads: PopulatedConversation[], // full thread list (consumer can slice)
 *     isLoading: boolean,
 *     error: unknown | null,
 *   }
 *
 * KEY + STALE
 * -----------
 * queryKey: queryKeys.artist.conversations()
 * staleTime: 30 seconds — unread counts need to feel live without
 *   hammering the server. Socket push (if wired up elsewhere) can
 *   invalidate this key to force a refetch.
 *
 * SERVER FIELD FALLBACK
 * ---------------------
 * Lane B added `unreadCount` to each thread server-side. Older
 * deployments may still return threads without the field. In that case
 * we fall back to 0 per thread (totalUnread = 0). Per the plan's
 * failure-modes table, the Messages preview is already preview-only
 * (shows top 3 threads with previews) — a 0 badge on a stale deployment
 * degrades gracefully rather than crashing.
 *
 * INVALIDATION CONTRACT
 * ---------------------
 * Sending a message, marking a thread read, or opening a conversation
 * should call:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.artist.conversations() })
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import conversationService, {
  type PopulatedConversation,
} from '../services/conversationService';
import { queryKeys } from '../constants/queryKeys';

export function useUnreadCount() {
  const query = useQuery<PopulatedConversation[]>({
    queryKey: queryKeys.artist.conversations(),
    queryFn: () => conversationService.getConversations(),
    staleTime: 1000 * 30,
  });

  const threads = query.data ?? [];

  const totalUnread = useMemo(
    () =>
      threads.reduce((sum, t) => {
        // Fallback: if the server didn't return the field (older deploy),
        // treat the thread as having 0 unread. Acceptable degradation —
        // the preview UI is non-critical.
        const n = typeof t.unreadCount === 'number' ? t.unreadCount : 0;
        return sum + n;
      }, 0),
    [threads]
  );

  return {
    totalUnread,
    threads,
    isLoading: query.isLoading,
    error: query.error ?? null,
  };
}

export default useUnreadCount;
