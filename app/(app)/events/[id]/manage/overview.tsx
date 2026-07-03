/**
 * Event manage / Overview — "The Living Poster".
 * (event-manage-living-poster.html · Manage + Day-of frames, exact)
 *
 * A poster hero (cover carousel + fill bar + Preview/Share/Settings/add-photo)
 * over a rounded, de-carded sheet. Sheet order:
 *   [day-of only] DayOfCtas   — big check-in CTA + walk-up CTA at the very top
 *   RoomStats                 — centered "The room" stats + payout line
 *   BackstageActions          — flush rows (roster · announce · scanner)
 *   StageDoorDiscussion       — the one warm full-bleed band (real thread)
 *   Cancel                    — quiet centered red row, only while cancellable
 *
 * This screen owns the day-of computation, the announce/cancel modals, share,
 * preview navigation, and the live checked-in count (shared roster query).
 * The manage flow is a headerless Stack — the hero draws its own nav.
 */
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useEvent, eventKeys } from '@/hooks/useEvents';
import { useEventRoster } from '@/hooks/useEventRoster';
import { shareEvent } from '@/lib/eventShare';
import PosterHero from '@/components/events/manage/PosterHero';
import RoomStats from '@/components/events/manage/RoomStats';
import BackstageActions, { DayOfCtas } from '@/components/events/manage/BackstageActions';
import StageDoorDiscussion from '@/components/events/manage/StageDoorDiscussion';
import AnnouncementComposer from '@/components/events/manage/AnnouncementComposer';
import OrganizerCancellationModal, {
  type OrganizerCancelResult,
} from '@/components/events/manage/OrganizerCancellationModal';

// Inbox-rhythm palette (DOCS/designs/INBOX_RHYTHM_DESIGN_SYSTEM.md)
const BG='#060509', SURFACE='rgba(255,255,255,0.04)', HAIR='rgba(255,255,255,0.07)', HAIR2='rgba(255,255,255,0.10)';
const T0='#F3EFE8', T1='#A1A1AA', T2='#71717a', T3='#52525b', T4='#3f3f46', INK='#1A0D06';
const ORANGE='#FF6B35', ORANGE_SOFT='rgba(255,107,53,0.16)', ORANGE_LINE='rgba(255,107,53,0.34)';
const GREEN='#22C55E', BLUE='#5B8DEF', PURPLE='#8B5CF6', YELLOW='#EAB308', RED='#EF4444';
const DSC_CARD='#15131C', DSC_BODY='#D5D0C8', DSC_MUT='#6B6878', DSC_SEND='#F97316';

const DAY = 86400000;

/** "21 days to go" / "tomorrow" / "today" / "underway" / "ended". */
function timeToGo(startsAt?: string, endsAt?: string): string {
  if (!startsAt) return '';
  const start = new Date(startsAt).getTime();
  if (Number.isNaN(start)) return '';
  const now = Date.now();
  const end = endsAt ? new Date(endsAt).getTime() : start;
  if (now > end + DAY) return 'ended';
  if (now >= start) return 'underway';
  const d = Math.ceil((start - now) / DAY);
  if (d <= 0) return 'today';
  if (d === 1) return 'tomorrow';
  return `${d} days to go`;
}

export default function OverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: event, isLoading } = useEvent(id);
  // Shared React Query cache with the roster screen — powers the live
  // day-of "Checked in" stat.
  const { data: roster } = useEventRoster(id);
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={ORANGE} />
      </View>
    );
  }
  if (!event) return null;

  const tl = timeToGo(event.startsAt, event.endsAt);
  const dayOf = tl === 'today' || tl === 'underway';

  // Live checked-in count (day-of only); undefined until the roster loads → "—".
  const checkedIn = dayOf
    ? roster?.confirmed.filter((r) => r.status === 'attended').length
    : undefined;

  // Modal derivations — same as OverviewActions.
  const attendeeCount = event.capacity?.registeredCount ?? 0;
  const ticketPriceRupees: number = (event as any).pricing?.amount ?? 0;
  const canCancel = event.status === 'live' || event.status === 'pending_review';

  const handleCancelled = (_result: OrganizerCancelResult) => {
    setCancelOpen(false);
    qc.invalidateQueries({ queryKey: eventKeys.detail(event._id) });
    Alert.alert(
      'Event cancelled',
      'All attendees have been notified and refunds are being processed.',
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PosterHero
          event={event}
          dayOf={dayOf}
          timeLabel={tl}
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          onPreview={() => router.push(`/events/${id}?preview=1` as any)}
          onShare={() => shareEvent(event)}
          onSettings={() => router.push(`/events/${id}/manage/settings` as any)}
          onAddPhoto={() => router.push(`/events/${id}/edit` as any)}
        />

        {/* The sheet — rounded, pulled up over the poster. overflow:'hidden'
            so the Stage Door band's marginHorizontal:-20 full-bleed clips
            cleanly at the screen edge (no horizontal scroll). */}
        <View style={styles.sheet}>
          <View style={styles.grab} />

          {/* Day-of — the two door actions lead the sheet */}
          {dayOf ? <DayOfCtas event={event} /> : null}

          <RoomStats event={event} dayOf={dayOf} checkedInCount={checkedIn} />

          <BackstageActions
            event={event}
            dayOf={dayOf}
            onAnnounce={() => setAnnounceOpen(true)}
          />

          <StageDoorDiscussion event={event} />

          {/* Quiet Cancel — hairline top, centered red text (only while cancellable) */}
          {canCancel ? (
            <Pressable
              onPress={() => setCancelOpen(true)}
              style={styles.cancelRow}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Cancel event"
            >
              <Text style={styles.cancelText}>Cancel event</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      <AnnouncementComposer
        visible={announceOpen}
        eventId={event._id}
        onClose={() => setAnnounceOpen(false)}
        onSent={() => setAnnounceOpen(false)}
      />
      <OrganizerCancellationModal
        visible={cancelOpen}
        eventId={event._id}
        attendeeCount={attendeeCount}
        ticketPriceRupees={ticketPriceRupees}
        onClose={() => setCancelOpen(false)}
        onCancelled={handleCancelled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG },
  // .sheet — rounded top, -18 overlap onto the poster, clips the band's bleed
  sheet: {
    marginTop: -18,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: BG,
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 32,
    overflow: 'hidden',
  },
  // .grab — 36×4 sheet handle
  grab: {
    width: 36,
    height: 4,
    borderRadius: 99,
    backgroundColor: T4,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  // .cancel — quiet centered destructive row at the foot
  cancelRow: {
    alignItems: 'center',
    marginTop: 26,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: HAIR,
  },
  cancelText: { fontFamily: 'Outfit-SemiBold', fontSize: 12, color: RED },
});
