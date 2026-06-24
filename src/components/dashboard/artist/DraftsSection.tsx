/**
 * DraftsSection — artist-home dashboard section for in-progress application
 * drafts stored in client-local AsyncStorage.
 *
 * RESPONSIBILITIES
 * ----------------
 * 1. Consume useDrafts() for the list + a `remove` action.
 * 2. Show up to 3 drafts (most recently updated first). If more exist, show
 *    a "See all (N)" label — but there is NO drafts-list route yet, so the
 *    hint stays as a status label only.
 * 3. Each row: gig title snapshot ("gigTitle" on the draft record) + "Last
 *    edited <relative time>".
 * 4. Row tap → resume flow by pushing to the gig detail route with a
 *    `resumeDraftId` query param. GigDetailsPage reads this param and
 *    re-opens GigApplyModal with the draft prefilled (see Part B).
 * 5. Long-press → confirm dialog → call remove(draftId). No swipe gesture
 *    — spec says "swipe OR long-press", long-press is simpler and works
 *    with Touchable without bringing in react-native-gesture-handler.
 * 6. Empty state: encouraging copy per spec.
 *
 * Uses the ApplicationDraft shape as defined in draftService.ts:
 *   { draftId, gigId, gigTitle?, pitch?, quotedRate?, availability?,
 *     updatedAt }
 * The plan doc mentions gigSnapshot.title and lastEditedAt — those are
 * semantic aliases; the real service fields are gigTitle and updatedAt.
 */
import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import SectionCard from '../SectionCard';
import useDrafts from '@/hooks/useDrafts';
import type { ApplicationDraft } from '@/services/draftService';

const MAX_VISIBLE = 3;

function relativeTime(iso?: string): string {
  if (!iso) return 'unknown';
  const ms = Date.now() - new Date(iso).getTime();
  if (!isFinite(ms) || ms < 0) return 'just now';
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

export default function DraftsSection() {
  const { drafts, isLoading, remove } = useDrafts();
  const router = useRouter();

  // Most-recent first for the preview slice.
  const sorted = [...drafts].sort((a, b) => {
    const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return tb - ta;
  });
  const visible = sorted.slice(0, MAX_VISIBLE);
  const overflow = Math.max(0, sorted.length - MAX_VISIBLE);

  const confirmRemove = (draft: ApplicationDraft) => {
    Alert.alert(
      'Delete draft?',
      `"${draft.gigTitle ?? 'Untitled draft'}" will be removed. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            remove(draft.draftId).catch(() => {
              // useDrafts swallows; surfacing via Alert keeps UX consistent.
              Alert.alert('Could not delete draft', 'Please try again.');
            });
          },
        },
      ]
    );
  };

  const resume = (draft: ApplicationDraft) => {
    router.push({
      pathname: '/(app)/gigs/[id]',
      params: {
        id: String(draft.gigId),
        resumeDraftId: String(draft.draftId),
      },
    });
  };

  const isEmpty = !isLoading && drafts.length === 0;

  return (
    <SectionCard
      title="Drafts"
      // No drafts-list route exists yet; omit seeAllHref. Overflow count is
      // surfaced via a non-interactive label below the list.
      isLoading={isLoading}
    >
      <View style={styles.wrap}>
        {isEmpty ? (
          <View style={styles.emptyInline}>
            <Text style={styles.emptyTitle}>No drafts yet</Text>
            <Text style={styles.emptySub}>
              Start applying to a gig and save progress anytime
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.list}>
              {visible.map((d) => (
                <TouchableOpacity
                  key={d.draftId}
                  onPress={() => resume(d)}
                  onLongPress={() => confirmRemove(d)}
                  delayLongPress={350}
                  style={styles.row}
                  accessibilityRole="button"
                  accessibilityLabel={`Resume draft for ${d.gigTitle ?? 'untitled gig'}`}
                  accessibilityHint="Long press to delete"
                  testID={`draft-row-${d.draftId}`}
                >
                  <View style={styles.rowMain}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {d.gigTitle ?? 'Untitled draft'}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {`Last edited ${relativeTime(d.updatedAt)}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {overflow > 0 ? (
              <Text style={styles.overflowLabel}>
                +{overflow} more draft{overflow === 1 ? '' : 's'}
              </Text>
            ) : null}
          </>
        )}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: -4,
  },
  list: {
    marginTop: 4,
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1F1F23',
  },
  rowMain: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 14,
    color: '#F5F5F5',
  },
  rowMeta: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
  },
  overflowLabel: {
    marginTop: 10,
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: '#71717A',
    textAlign: 'center',
  },
  emptyInline: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 14,
    color: '#D4D4D8',
  },
  emptySub: {
    marginTop: 6,
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: '#71717A',
    textAlign: 'center',
  },
});
