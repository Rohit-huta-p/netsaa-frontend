// netsa-mobile/src/components/dashboard/artist/MessagesPreview.tsx
import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import SectionCard from '../SectionCard';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { useAuthStore } from '@/stores/authStore';
import type { PopulatedConversation } from '@/services/conversationService';

/**
 * MessagesPreview — artist-home dashboard section (Plan 2, Task 20).
 *
 * Shows the top 3 message threads (by last-activity time) with avatars,
 * display names, a truncated last-message snippet, and relative time.
 * Displays a small "{n} unread" pill next to the title when the server
 * (or client fallback) reports any unread messages.
 *
 * Data: consumes `useUnreadCount()` — no props. Route: "See all" links to
 * `/connections` (this codebase keeps the message inbox under the
 * connections screen rather than a standalone /messages route).
 */

const MAX_THREADS = 3;
const SNIPPET_MAX_LEN = 50;
const SEE_ALL_HREF = '/connections';

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!isFinite(ms) || ms < 0) return 'now';
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function truncateSnippet(text: string, max = SNIPPET_MAX_LEN): string {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
}

export default function MessagesPreview() {
  const { totalUnread, threads, isLoading, error } = useUnreadCount();
  const selfId = useAuthStore((s) => s.user?._id);

  const topThreads = useMemo(() => {
    // Defensive sort: server *should* return desc by lastMessageAt, but we
    // can't rely on it. Threads with no timestamp fall to the bottom.
    const copy = [...threads];
    copy.sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    });
    return copy.slice(0, MAX_THREADS);
  }, [threads]);

  const isEmpty = !isLoading && !error && threads.length === 0;

  return (
    <SectionCard
      title="Messages"
      seeAllHref={SEE_ALL_HREF}
      isLoading={isLoading}
      isEmpty={isEmpty}
      error={(error as Error) ?? null}
      emptyState={
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a conversation from any profile or gig
          </Text>
        </View>
      }
    >
      {/* Unread pill sits at the top of the section body (SectionCard keeps
          the title row for its own layout + "See all" link, so we render
          the unread pill here inside the children container). */}
      {totalUnread > 0 ? (
        <View style={styles.pillRow}>
          <View style={styles.unreadPill} accessibilityLabel={`${totalUnread} unread`}>
            <Text style={styles.unreadPillText}>{totalUnread} unread</Text>
          </View>
        </View>
      ) : null}
      <View style={styles.list}>
        {topThreads.map((t) => (
          <ThreadRow key={t._id} thread={t} selfId={selfId} />
        ))}
      </View>
    </SectionCard>
  );
}

function ThreadRow({
  thread,
  selfId,
}: {
  thread: PopulatedConversation;
  selfId?: string;
}) {
  // Pick the first non-self participant for display. Falls back to the
  // first participant if every entry is self (shouldn't happen, but guards
  // against corrupt data).
  const other =
    thread.participants.find((p) => p._id !== selfId) ?? thread.participants[0];

  const name = other?.displayName ?? 'Unknown';
  const avatarUri = other?.profilePicture;
  const snippet = truncateSnippet(thread.lastMessage ?? '');
  const time = thread.lastMessageAt ? relativeTime(thread.lastMessageAt) : '';
  const hasUnread = (thread.unreadCount ?? 0) > 0;

  return (
    <View style={styles.row}>
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarInitial}>
            {(name[0] ?? '?').toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.rowBody}>
        <View style={styles.rowTopLine}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {time ? <Text style={styles.time}>{time}</Text> : null}
        </View>
        <View style={styles.rowBottomLine}>
          <Text style={styles.snippet} numberOfLines={1}>
            {snippet || 'No messages yet'}
          </Text>
          {hasUnread ? <View style={styles.unreadDot} /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1F1F23',
    marginRight: 12,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 15,
    color: '#A1A1AA',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
    fontFamily: 'Outfit-SemiBold',
    fontSize: 14,
    color: '#F5F5F5',
    marginRight: 8,
  },
  time: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: '#71717A',
  },
  rowBottomLine: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  snippet: {
    flex: 1,
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: '#A1A1AA',
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
  },
  pillRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  unreadPill: {
    backgroundColor: '#3B1F5E',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  unreadPillText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    color: '#C4B5FD',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyTitle: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 14,
    color: '#A1A1AA',
  },
  emptySubtitle: {
    marginTop: 6,
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: '#71717A',
    textAlign: 'center',
  },
});
