/**
 * StageDoorDiscussion — the "Stage Door" band on the manage overview.
 * (event-manage-living-poster.html · Manage + Day-of frames · the `.band` block)
 *
 * The ONE distinct surface on the de-carded sheet: a full-bleed warm band
 * (breaks the sheet's 20px gutter via marginHorizontal:-20 — the parent sheet
 * clips it edge-to-edge) so the conversation reads as its own room.
 *
 * Header: 26px orange-soft door square (MessageSquare) · serif "Stage door" ·
 * right-aligned mono yellow "{n} messages" (only when there are comments —
 * discussionCount is a TOTAL, not an unread count, so no "new"/"NEW" claim).
 * Body: the shared <DiscussionTab> thread, rendered DIRECTLY — not the
 * registration-gated DiscussionTabs wrapper. The manage surface is
 * organizer-only by construction; the host has no EventRegistration, so the
 * attendees_only gate would lock them out of their own thread. NOT restyled
 * here; moderation (pin / mark-answered) is deferred until the backend exists.
 */
import { View, Text, StyleSheet } from 'react-native';
import { MessageSquare } from 'lucide-react-native';
import type { EventDoc } from '@/services/eventService';
import DiscussionTab from '@/components/common/DiscussionTab';

// Inbox-rhythm palette (DOCS/designs/INBOX_RHYTHM_DESIGN_SYSTEM.md)
const BG='#060509', SURFACE='rgba(255,255,255,0.04)', HAIR='rgba(255,255,255,0.07)', HAIR2='rgba(255,255,255,0.10)';
const T0='#F3EFE8', T1='#A1A1AA', T2='#71717a', T3='#52525b', T4='#3f3f46', INK='#1A0D06';
const ORANGE='#FF6B35', ORANGE_SOFT='rgba(255,107,53,0.16)', ORANGE_LINE='rgba(255,107,53,0.34)';
const GREEN='#22C55E', BLUE='#5B8DEF', PURPLE='#8B5CF6', YELLOW='#EAB308', RED='#EF4444';
const DSC_CARD='#15131C', DSC_BODY='#D5D0C8', DSC_MUT='#6B6878', DSC_SEND='#F97316';

interface StageDoorDiscussionProps {
  event: EventDoc;
}

export default function StageDoorDiscussion({ event }: StageDoorDiscussionProps) {
  const count = event.discussionCount ?? 0;

  return (
    <View style={styles.band}>
      <View style={styles.head}>
        <View style={styles.door}>
          <MessageSquare size={14} color={ORANGE} />
        </View>
        <Text style={styles.title}>Stage door</Text>
        {count > 0 ? <Text style={styles.count}>{count} messages</Text> : null}
      </View>

      {/* The real thread — drop-in, self-managing; do not restyle. */}
      <DiscussionTab id={event._id} type="event" />
    </View>
  );
}

const styles = StyleSheet.create({
  // .band — full-bleed warm surface: margin 24px -20px 0 · padding 18/20 ·
  // warm dark bg · orange-tinted top hairline · plain bottom hairline
  band: {
    marginTop: 24,
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#17131e',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,107,53,0.18)',
    borderBottomWidth: 1,
    borderBottomColor: HAIR,
  },
  // .band-head — door square · serif label · trailing mono count
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  door: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: ORANGE_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 16,
    color: T0,
  },
  count: {
    marginLeft: 'auto',
    fontFamily: 'SpaceMono-Regular',
    fontSize: 9,
    color: YELLOW,
    textTransform: 'uppercase',
  },
});
