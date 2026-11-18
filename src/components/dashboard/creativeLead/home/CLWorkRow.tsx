// src/components/dashboard/creativeLead/home/CLWorkRow.tsx
//
// The Creative Lead "Your work" card (design: DOCS/04-design/mockups/
// creative-lead-work-card-redesign.html, variation B). A bordered card with the
// gig/event identity on the left and a compact signal cluster pinned to the
// top-right: applicants (always) + discussion (only when there are comments). The
// discussion icon warms to orange when the owner has unanswered "waiting" questions.
//
// Kept separate from the shared artist Row (which this does NOT touch): the CL card
// carries two signals, not one ₹pay figure. The cluster is laid out IN FLOW (a flex
// sibling with alignSelf:'flex-start'), with the count beside the icon — no absolute
// negative offsets (which clip on Android) and no fixed right padding (which breaks
// on three-digit counts).

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Users, MessageSquare } from 'lucide-react-native';
import { HC, HF, Pill, SkeletonBlock, type PillTone } from '@/components/dashboard/artist/home/ui';

export interface CLWorkRowProps {
  title: string;
  initial: string;
  kind: 'gig' | 'event';
  pill: { label: string; tone: PillTone };
  meta?: string;
  /** Applicants (gig) or registrations (event). Always shown, even at 0. */
  peopleCount: number;
  /** Total comments. `undefined` (backend not shipped) → the discussion icon is hidden. */
  discussionCount?: number;
  /** Gigs — unanswered questions the owner owes a reply on. `> 0` → discussion goes orange. */
  waitingCount?: number;
  muted?: boolean;
  /** Draft rows show "Finish →" in place of the signals. */
  draftFinish?: boolean;
  onPress?: () => void;
}

function Signal({ Icon, count, hot }: { Icon: typeof Users; count: number; hot: boolean }) {
  return (
    <View style={styles.sig}>
      <Icon size={13} color={hot ? HC.orange : HC.t3} strokeWidth={1.9} />
      <Text style={[styles.sup, { color: hot ? HC.orange : HC.t2 }]}>{count}</Text>
    </View>
  );
}

export default function CLWorkRow({
  title,
  initial,
  kind,
  pill,
  meta,
  peopleCount,
  discussionCount,
  waitingCount,
  muted,
  draftFinish,
  onPress,
}: CLWorkRowProps) {
  const showDiscussion = typeof discussionCount === 'number' && discussionCount > 0;
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={[styles.thumb, kind === 'event' && styles.thumbEv, muted && styles.thumbDim]}>
        <Text style={[styles.thumbTxt, kind === 'event' && { color: HC.purple }, muted && { color: HC.t3 }]}>
          {initial}
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={[styles.title, muted && { color: HC.t1 }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.metaRow}>
          <Pill label={pill.label} tone={pill.tone} />
          {meta ? (
            <Text style={styles.meta} numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.cluster}>
        {draftFinish ? (
          <Text style={styles.finish}>Finish →</Text>
        ) : (
          <>
            <Signal Icon={Users} count={peopleCount} hot={false} />
            {showDiscussion ? (
              <Signal Icon={MessageSquare} count={discussionCount as number} hot={(waitingCount ?? 0) > 0} />
            ) : null}
          </>
        )}
      </View>
    </Pressable>
  );
}

/** Loading placeholder that matches the card shape (so loading doesn't jump rows→cards). */
export function CLWorkRowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.card}>
          <SkeletonBlock style={styles.skThumb} />
          <View style={styles.body}>
            <SkeletonBlock style={styles.skLineA} />
            <SkeletonBlock style={styles.skLineB} />
          </View>
          <View style={styles.cluster}>
            <SkeletonBlock style={styles.skSig} />
            <SkeletonBlock style={styles.skSig} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: HC.hair,
    borderRadius: 14,
    backgroundColor: '#191920',
    paddingVertical: 13,
    paddingHorizontal: 13,
    marginBottom: 10,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,53,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEv: { backgroundColor: 'rgba(139,92,246,0.14)' },
  thumbDim: { backgroundColor: 'rgba(255,255,255,0.05)' },
  thumbTxt: { fontFamily: HF.serif, fontSize: 17, color: HC.orange },

  body: { flex: 1, minWidth: 0 },
  title: { fontFamily: HF.body, fontSize: 14, color: HC.cream },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  meta: { fontFamily: HF.mono, fontSize: 9.5, letterSpacing: 0.3, color: HC.t2, flexShrink: 1 },

  // Signal cluster — in flow, pinned to the card's top-right (last child + alignSelf).
  cluster: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'flex-start', gap: 15, paddingTop: 2 },
  sig: { flexDirection: 'row', alignItems: 'flex-start' },
  sup: { fontFamily: HF.mono, fontSize: 8, marginTop: -3, marginLeft: 1 },
  finish: { fontFamily: HF.mono, fontSize: 9, letterSpacing: 0.8, color: HC.orange },

  skThumb: { width: 40, height: 40, borderRadius: 10 },
  skLineA: { height: 13, width: '58%', borderRadius: 6, marginBottom: 7 },
  skLineB: { height: 10, width: '34%', borderRadius: 6 },
  skSig: { width: 22, height: 13, borderRadius: 4 },
});
