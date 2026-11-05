/**
 * EventHostHub — the A·Minimal host console for a hosted event, the events sibling
 * of the gig hub's HirerGigHub. Replaces the warm "Living Poster" overview.
 *
 * The spine is the attendee lifecycle — Requests (gated only) · Going · Waitlist ·
 * Checked-in — not a poster: the listing is demoted to a compact header + a
 * "preview how viewers see it" link, and the next action stays on screen. Owner POV,
 * role-agnostic. Mockup: DOCS/04-design/mockups/manage-event-aminimal.html (frames
 * 1–10, 12). Composition + decisions: DOCS/03-features/events/
 * MANAGE_EVENT_BACKEND_READINESS.md.
 *
 * Reuses every existing piece — roster, approve/decline (RequestCard), check-in
 * scanner (route), walk-up (WalkupAddSheet), announce (AnnouncementComposer),
 * cancel (OrganizerCancellationModal), preview (EventPreviewModal), DM
 * (ContactActionSheet), payout status (usePayoutAccount) — behind one selector,
 * useEventHubData. Pay-as-fact: no fee math, no fabricated metrics; the host sees
 * only their own net ("Earned").
 *
 * Two row actions await backend (stubbed, clearly labelled):
 *   • Cancel + refund (per attendee) — TODO(B1), not built → explain + no-op.
 *   • Manual check-in by registrationId — TODO(B2), not built → route to scanner.
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable, ActivityIndicator,
  Alert, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, MoreHorizontal, Eye, Megaphone, QrCode, Plus, ChevronRight,
  Calendar, MapPin, Ticket, Clock, Share2, Pencil, Users, Lock, Check, X,
} from 'lucide-react-native';

import { useEventHubData, type EventHubStage } from '@/hooks/useEventHubData';
import {
  useWaitlistPromote, useUpdateRegistrationStatus, usePublishEvent, useUpdateEvent,
} from '@/hooks/useEvents';
import { useApproveRequest, useDeclineRequest } from '@/hooks/useEventRequests';
import { approvalErrorMessage, waitlistPromoteErrorMessage, type EventRosterRow } from '@/services/eventService';
import { dateRange, timeLine, lowestPrice } from '@/lib/eventDetailV3';
import { formatRupees } from '@/lib/eventPricing';
import { shareEvent } from '@/lib/eventShare';

import AttendeeRow from './AttendeeRow';
import AttendeeDetailSheet from './AttendeeDetailSheet';
import EventActionsSheet from './EventActionsSheet';
import RequestCard from './RequestCard';
import AnnouncementComposer from './AnnouncementComposer';
import OrganizerCancellationModal, { type OrganizerCancelResult } from './OrganizerCancellationModal';
import WalkupAddSheet from './WalkupAddSheet';
import EventPreviewModal from '@/components/events/detail/EventPreviewModal';
import { ContactActionSheet, type ContactTarget } from '@/features/team/ContactActionSheet';
import { C, F } from './hubTokens';
import { pendingSummary } from './requestFormat';

const HORIZ = 18;
const DAY = 86_400_000;

type Feedback = { kind: 'error' | 'success'; text: string };

/** A registration that landed in the last 24h gets a new-dot. */
function isRecent(iso?: string): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && Date.now() - t < DAY;
}

export default function EventHostHub({ eventId }: { eventId: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const showMobileHeader = width < 768;

  const data = useEventHubData(eventId);

  // Stage selection — follows the phase-aware default until the host taps a tab.
  const [stage, setStage] = useState<EventHubStage | null>(null);
  const activeStage: EventHubStage = stage ?? data.defaultStage;

  // Sheets / modals
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [walkupOpen, setWalkupOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<EventRosterRow | null>(null);
  const [contactTarget, setContactTarget] = useState<ContactTarget | null>(null);

  // Requests / promote feedback + per-row busy lock
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const promote = useWaitlistPromote(eventId);
  const approve = useApproveRequest(eventId);
  const decline = useDeclineRequest(eventId);
  const noShow = useUpdateRegistrationStatus(eventId);
  const publish = usePublishEvent(eventId);
  const updateEvent = useUpdateEvent(eventId);

  if (data.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.orange} />
      </View>
    );
  }
  if (data.error || !data.event) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontFamily: F.body, color: C.t2 }}>Couldn't load this event.</Text>
      </View>
    );
  }

  const event = data.event;
  const {
    counts, seatsTotal, seatsTaken, seatsOpen, isPaid, priceRupees, earnedNet,
    payoutStatus, payout, dayOf, statusPill, gated, sticky, isDraft, isEmpty,
    canCancel, walkupsAllowed, goingRows, checkedInRows, waitlistRows, requestRows, approvedRows,
  } = data;

  const confirmedCount = counts.going + counts.checkedIn;
  const checkedInSeats = checkedInRows.reduce((n, r) => n + (r.seats ?? 1), 0);
  const door = event.registration?.door;

  // ---- meta line: "Fri 14 – Sun 20 Mar · Venue, City · ₹4,500" (pay-as-fact) ----
  const price = lowestPrice(event);
  const priceLabel = door === 'apply'
    ? 'Apply to attend'
    : !isPaid || price.amount === 0
      ? 'Free'
      : `${formatRupees(price.amount)}${price.multiple ? ' onwards' : ''}`;
  const venueLine = [event.location?.venueName, event.location?.city].filter(Boolean).join(', ');
  const metaLine = [dateRange(event.startsAt, event.endsAt), venueLine, priceLabel].filter(Boolean).join('  ·  ');

  const back = () => (router.canGoBack() ? router.back() : router.replace('/' as any));
  const goPayouts = () => router.push('/settings/payouts' as any);
  const goSettings = () => router.push(`/events/${eventId}/manage/settings` as any);
  const goEdit = () => router.push(`/events/${eventId}/edit` as any);
  const goScanner = () => router.push(`/events/${eventId}/manage/check-in` as any);

  const onShare = async () => {
    try { await shareEvent(event); } catch { /* dismissed */ }
  };

  // ---- row actions ----
  const openDetail = (row: EventRosterRow) => setDetailRow(row);
  const messageRow = (row: EventRosterRow) => {
    setDetailRow(null);
    setContactTarget({
      artistId: row.userId ?? '',
      displayName: (row.name ?? '').trim() || 'Attendee',
      phoneNumber: row.phone,
      gigTitle: event.title,
    });
  };
  // TODO(B2): one-tap manual check-in by registrationId isn't built (needs
  // POST /events/:id/registrations/:regId/check-in, which must flip the ticket
  // too). Route to the scanner — the backed check-in path — for now.
  const checkInRow = (row: EventRosterRow) => {
    setDetailRow(null);
    Alert.alert(
      'Check in at the door',
      'Scan this attendee’s QR (or enter their 6-digit code) in the scanner to check them in.',
      [{ text: 'Not now', style: 'cancel' }, { text: 'Open scanner', onPress: goScanner }],
    );
  };
  // TODO(B1): per-attendee organizer cancel + refund isn't built (needs a new
  // owner-gated endpoint that flips → cancelled, creates the Cashfree Refund and
  // frees the seat; free attendees could use PATCH status→cancelled, but we keep
  // this one path until B1 so the behaviour is consistent). Explain, don't fake it.
  const cancelRefundRow = (_row: EventRosterRow) => {
    setDetailRow(null);
    Alert.alert(
      'Coming soon',
      'Cancelling and refunding a single attendee is on the way. To refund everyone, cancel the event from the ⋯ menu.',
      [{ text: 'OK' }],
    );
  };
  const markNoShow = (row: EventRosterRow) => {
    setBusyId(row._id);
    noShow.mutate(
      { registrationId: row._id, status: 'no-show' },
      {
        onSuccess: () => { setDetailRow(null); setFeedback({ kind: 'success', text: `Marked ${firstName(row.name)} as a no-show.` }); },
        onError: () => setFeedback({ kind: 'error', text: 'Could not update. Please try again.' }),
        onSettled: () => setBusyId(null),
      },
    );
  };

  const onPromote = (row: EventRosterRow) => {
    if (busyId) return;
    setBusyId(row._id);
    setFeedback(null);
    promote.mutate(undefined, {
      onSuccess: () => setFeedback({ kind: 'success', text: `Promoted ${firstName(row.name)} into the open seat.` }),
      onError: (err) => setFeedback({ kind: 'error', text: waitlistPromoteErrorMessage(err) }),
      onSettled: () => setBusyId(null),
    });
  };

  const onApprove = (registrationId: string) => {
    if (busyId) return;
    setBusyId(registrationId);
    setFeedback(null);
    const who = firstName(requestRows.find((r) => r._id === registrationId)?.name);
    approve.mutate(registrationId, {
      onSuccess: (res) => setFeedback({
        kind: 'success',
        text: res.status === 'approved' ? `Approved — ${who} has 48h to pay and hold the seat.` : `Approved — ${who} is in.`,
      }),
      onError: (err) => setFeedback({ kind: 'error', text: approvalErrorMessage(err, 'approve') }),
      onSettled: () => setBusyId(null),
    });
  };
  const onDecline = (registrationId: string, reason?: string) => {
    if (busyId) return;
    setBusyId(registrationId);
    setFeedback(null);
    const who = firstName(requestRows.find((r) => r._id === registrationId)?.name);
    decline.mutate({ registrationId, reason }, {
      onSuccess: () => setFeedback({ kind: 'success', text: `Declined ${who}.` }),
      onError: (err) => setFeedback({ kind: 'error', text: approvalErrorMessage(err, 'decline') }),
      onSettled: () => setBusyId(null),
    });
  };

  const onPublish = () => {
    publish.mutate(undefined, {
      onError: () => Alert.alert('Could not publish', 'Something went wrong publishing your event. Please try again.'),
    });
  };
  const onToggleAcceptingRsvps = (nextAccepting: boolean) => {
    // Accepting RSVPs ⇒ registration NOT closed.
    updateEvent.mutate({ registrationClosed: !nextAccepting } as any);
  };

  const handleCancelled = (_r: OrganizerCancelResult) => {
    setCancelOpen(false);
    Alert.alert('Event cancelled', 'Attendees will be notified and refunds are being processed.');
  };

  // ------------------------------------------------------------------ pills
  const Pill = (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingVertical: 4, paddingHorizontal: 9, borderRadius: 999,
        backgroundColor: `${statusPill.color}1F`, borderWidth: 1, borderColor: `${statusPill.color}55`,
      }}
    >
      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: statusPill.color }} />
      <Text style={{ fontFamily: F.monoBold, fontSize: 8.5, letterSpacing: 1, color: statusPill.color, textTransform: 'uppercase' }}>
        {statusPill.label}
      </Text>
    </View>
  );

  const Header = (
    <>
      {showMobileHeader ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }}>
          <TouchableOpacity
            onPress={back}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={10}
            style={{ width: 38, height: 38, borderRadius: 11, borderWidth: 1, borderColor: C.hairline, alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft size={20} color={C.t2} />
          </TouchableOpacity>
          <Text numberOfLines={1} style={{ flex: 1, fontFamily: F.bold, fontSize: 18, color: C.cream, letterSpacing: -0.3 }}>{event.title}</Text>
          {Pill}
          <TouchableOpacity
            onPress={() => setActionsOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Event actions"
            hitSlop={8}
            style={{ width: 32, height: 32, borderRadius: 9, borderWidth: 1, borderColor: C.hairline, alignItems: 'center', justifyContent: 'center' }}
          >
            <MoreHorizontal size={18} color={C.t2} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: HORIZ, paddingTop: 16, paddingBottom: 4 }}>
          <Text numberOfLines={1} style={{ flex: 1, fontFamily: F.bold, fontSize: 20, color: C.cream, letterSpacing: -0.3 }}>{event.title}</Text>
          {Pill}
          <TouchableOpacity
            onPress={() => setActionsOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Event actions"
            hitSlop={8}
            style={{ width: 32, height: 32, borderRadius: 9, borderWidth: 1, borderColor: C.hairline, alignItems: 'center', justifyContent: 'center' }}
          >
            <MoreHorizontal size={18} color={C.t2} />
          </TouchableOpacity>
        </View>
      )}
      <Text numberOfLines={1} style={{ fontFamily: F.body, fontSize: 12, color: C.t3, paddingHorizontal: HORIZ, paddingTop: 4 }}>{metaLine}</Text>
      <TouchableOpacity
        onPress={() => setPreviewOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Preview how viewers see it"
        hitSlop={6}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: HORIZ, paddingTop: 10 }}
      >
        <Text style={{ fontFamily: F.semibold, fontSize: 12.5, color: C.orange }}>Preview how viewers see it</Text>
        <Eye size={13} color={C.orange} strokeWidth={2} />
      </TouchableOpacity>
    </>
  );

  // ------------------------------------------------------------------ draft
  if (isDraft) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {Header}
          <View style={{ alignItems: 'center', paddingHorizontal: 34, paddingTop: 44, paddingBottom: 8 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 1, borderColor: C.hairline, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
              <Pencil size={28} color={C.t2} strokeWidth={1.6} />
            </View>
            <Text style={{ fontFamily: F.serif, fontSize: 21, color: C.cream, textAlign: 'center' }}>Still a draft</Text>
            <Text style={{ fontFamily: F.body, fontSize: 13.5, color: C.t3, marginTop: 9, lineHeight: 21, textAlign: 'center' }}>
              No one can see or register yet. Publish to open the room — the managing tools appear once it’s live.
            </Text>
            <TouchableOpacity
              onPress={onPublish}
              disabled={publish.isPending}
              accessibilityRole="button"
              accessibilityLabel="Publish event"
              style={{ width: '100%', maxWidth: 260, height: 50, borderRadius: 14, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center', marginTop: 22, opacity: publish.isPending ? 0.6 : 1 }}
            >
              <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.ink }}>{publish.isPending ? 'Publishing…' : 'Publish event'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPreviewOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Preview how it will look"
              style={{ width: '100%', maxWidth: 260, height: 50, borderRadius: 14, borderWidth: 1, borderColor: C.hairline, alignItems: 'center', justifyContent: 'center', marginTop: 10 }}
            >
              <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.t2 }}>Preview how it’ll look</Text>
            </TouchableOpacity>
          </View>

          <SectionLabel>Before you publish</SectionLabel>
          <View style={{ paddingHorizontal: HORIZ }}>
            <ChecklistRow done label="Cover, story & agenda" />
            <ChecklistRow done label="Date, venue & capacity" />
            {isPaid && payoutStatus !== 'verified' ? (
              <TouchableOpacity onPress={goPayouts} accessibilityRole="button" accessibilityLabel="Set up payouts">
                <ChecklistRow gold label={`Set up payouts to collect ${priceRupees > 0 ? formatRupees(priceRupees) : ''} tickets`} />
              </TouchableOpacity>
            ) : isPaid ? (
              <ChecklistRow done label="Payouts ready" />
            ) : null}
          </View>
        </ScrollView>

        <EventPreviewModal event={event} visible={previewOpen} onClose={() => setPreviewOpen(false)} />
      </View>
    );
  }

  // ------------------------------------------------------------- spine data
  const spineStages: { key: EventHubStage; label: string; n: string; ph2?: boolean }[] = [
    ...(gated ? [{ key: 'requests' as const, label: 'Requests', n: String(counts.requests), ph2: true }] : []),
    { key: 'going', label: 'Going', n: String(counts.going) },
    { key: 'waitlist', label: 'Waitlist', n: String(counts.waitlist) },
    { key: 'checkedIn', label: 'Checked-in', n: counts.checkedIn > 0 ? String(counts.checkedIn) : '—' },
  ];

  // capacity bar — seats filled, or check-in progress on the checked-in stage
  const barTotalCells = Math.min(seatsTotal || 0, 36);
  const barLitSource = activeStage === 'checkedIn' ? checkedInSeats : seatsTaken;
  const barLit = seatsTotal > 0 ? Math.round((barLitSource / seatsTotal) * barTotalCells) : 0;

  const barnote = (() => {
    if (activeStage === 'requests') {
      return `${counts.requests} awaiting your approval${approvedRows.length ? ` · ${approvedRows.length} approved` : ''}`;
    }
    if (activeStage === 'waitlist') {
      const open = seatsOpen > 0 ? `${seatsOpen} seat${seatsOpen === 1 ? '' : 's'} open` : 'Full house';
      const waiting = `${counts.waitlist} waiting`;
      const tail = seatsOpen > 0 && counts.waitlist > 0 ? ' · promote the top of the queue' : '';
      return `${open} · ${waiting}${tail}`;
    }
    if (activeStage === 'checkedIn') {
      return `${counts.checkedIn} of ${confirmedCount || counts.checkedIn} checked in`;
    }
    if (isEmpty) return `0 of ${seatsTotal} seats · the room is open`;
    return `${seatsTaken} of ${seatsTotal} seats${seatsOpen > 0 ? ` · ${seatsOpen} to a full house` : ' · full house'}`;
  })();

  const lsecLabel = (() => {
    if (activeStage === 'requests') return `Requests · ${counts.requests}`;
    if (activeStage === 'waitlist') return `Waitlist · ${counts.waitlist}`;
    if (activeStage === 'checkedIn') return `Checked in · ${counts.checkedIn} of ${confirmedCount || counts.checkedIn}`;
    return `Going · ${counts.going}`;
  })();

  const stickyHeight = sticky.kind === 'none' ? 0 : 92;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: stickyHeight + insets.bottom + 24 }}>
        {Header}

        {/* day-of door CTAs lead the body */}
        {dayOf ? (
          <View style={{ paddingHorizontal: HORIZ, paddingTop: 14 }}>
            <TouchableOpacity
              onPress={goScanner}
              accessibilityRole="button"
              accessibilityLabel="Open check-in scanner"
              style={{ height: 50, borderRadius: 13, backgroundColor: C.cream, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <QrCode size={17} color={C.ink} strokeWidth={1.9} />
              <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.ink }}>Open check-in scanner</Text>
            </TouchableOpacity>
            {walkupsAllowed && seatsOpen > 0 ? (
              <TouchableOpacity
                onPress={() => setWalkupOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Add a walk-up"
                style={{ height: 44, borderRadius: 12, borderWidth: 1, borderColor: C.orangeLine, backgroundColor: C.orangeSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 9 }}
              >
                <Plus size={15} color={C.orange} strokeWidth={2.2} />
                <Text style={{ fontFamily: F.bold, fontSize: 12.5, color: C.orange }}>Add a walk-up</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* spine */}
        <View style={{ flexDirection: 'row', gap: 7, paddingHorizontal: HORIZ, paddingTop: 14 }}>
          {spineStages.map((s) => {
            const on = s.key === activeStage;
            return (
              <TouchableOpacity
                key={s.key}
                onPress={() => setStage(s.key)}
                accessibilityRole="tab"
                accessibilityLabel={`${s.label} stage`}
                accessibilityState={{ selected: on }}
                activeOpacity={0.8}
                style={{
                  flex: 1, paddingVertical: 9, paddingHorizontal: 6, borderRadius: 12, alignItems: 'center',
                  backgroundColor: on ? C.orangeSoft : C.card,
                  borderWidth: 1,
                  borderColor: on ? C.orangeLine : C.hairSoft,
                  borderStyle: s.ph2 ? 'dashed' : 'solid',
                }}
              >
                <Text style={{ fontFamily: F.bold, fontSize: 17, color: C.cream }}>{s.n}</Text>
                <Text style={{ fontFamily: F.monoBold, fontSize: 7.5, letterSpacing: 0.7, textTransform: 'uppercase', marginTop: 4, color: on ? (s.ph2 ? C.purple : C.orangeTint) : C.t3 }}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* capacity bar + barnote */}
        {activeStage !== 'requests' && barTotalCells > 0 ? (
          <View style={{ flexDirection: 'row', gap: 3, height: 5, marginTop: 12, paddingHorizontal: HORIZ }}>
            {Array.from({ length: barTotalCells }).map((_, i) => (
              <View key={i} style={{ flex: 1, borderRadius: 3, backgroundColor: i < barLit ? C.orange : C.slotOff }} />
            ))}
          </View>
        ) : null}
        <Text style={{ fontFamily: F.monoBold, fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', color: activeStage === 'requests' ? C.purple : C.t3, marginTop: 8, paddingHorizontal: HORIZ }}>
          {barnote}
        </Text>

        {/* feedback banner (requests / promote / no-show) */}
        {feedback ? (
          <Pressable
            onPress={() => setFeedback(null)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: HORIZ, marginTop: 14,
              borderRadius: 11, borderWidth: 1, padding: 12,
              backgroundColor: feedback.kind === 'error' ? C.coralSoft : C.mintSoft,
              borderColor: feedback.kind === 'error' ? C.coralLine : C.mintLine,
            }}
            accessibilityRole="button"
            accessibilityLabel={`${feedback.text}. Dismiss.`}
          >
            <Text style={{ flex: 1, fontFamily: F.medium, fontSize: 12.5, lineHeight: 18, color: feedback.kind === 'error' ? C.coral : C.mint }}>
              {feedback.text}
            </Text>
            <X size={15} color={feedback.kind === 'error' ? C.coral : C.mint} />
          </Pressable>
        ) : null}

        {/* empty room */}
        {isEmpty ? (
          <View style={{ alignItems: 'center', paddingHorizontal: 34, paddingTop: 48, paddingBottom: 24 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 1, borderColor: C.hairline, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
              <Users size={28} color={C.t2} strokeWidth={1.6} />
            </View>
            <Text style={{ fontFamily: F.serif, fontSize: 21, color: C.cream, textAlign: 'center' }}>No one’s registered yet</Text>
            <Text style={{ fontFamily: F.body, fontSize: 13.5, color: C.t3, marginTop: 9, lineHeight: 21, textAlign: 'center' }}>
              Share your event to fill the first seats. Registrations show up here as they come in.
            </Text>
            <TouchableOpacity
              onPress={onShare}
              accessibilityRole="button"
              accessibilityLabel="Share your event"
              style={{ width: '100%', maxWidth: 240, height: 50, borderRadius: 14, backgroundColor: C.cream, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 22 }}
            >
              <Share2 size={15} color={C.ink} strokeWidth={1.9} />
              <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.ink }}>Share your event</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* list header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: HORIZ, paddingTop: 16, paddingBottom: 2 }}>
              <Text style={{ fontFamily: F.monoBold, fontSize: 9.5, letterSpacing: 1.5, textTransform: 'uppercase', color: C.t2 }}>{lsecLabel}</Text>
              <Text style={{ fontFamily: F.monoBold, fontSize: 9, letterSpacing: 0.6, color: C.t3 }}>
                {activeStage === 'waitlist' ? 'POSITION' : 'RECENT'}
              </Text>
            </View>

            {/* body per stage */}
            <View style={{ paddingTop: 4 }}>
              {activeStage === 'requests' ? (
                <RequestsBody
                  eventId={eventId}
                  requestRows={requestRows}
                  approvedRows={approvedRows}
                  spots={event.spots}
                  busyId={busyId}
                  onApprove={onApprove}
                  onDecline={onDecline}
                />
              ) : activeStage === 'waitlist' ? (
                <WaitlistBody
                  rows={waitlistRows}
                  canPromoteTop={seatsOpen > 0}
                  promoting={promote.isPending}
                  busyId={busyId}
                  autoPromote={!!event.waitlistAutoPromote}
                  onPromote={onPromote}
                />
              ) : activeStage === 'checkedIn' ? (
                <CheckedInBody
                  attended={checkedInRows}
                  pending={goingRows}
                  onCheckIn={checkInRow}
                  onOpen={openDetail}
                />
              ) : (
                <GoingBody rows={goingRows} onOpen={openDetail} />
              )}
            </View>

            {/* Backstage */}
            <SectionLabel>Backstage</SectionLabel>
            <ToolRow
              iconBg="rgba(139,92,246,0.16)"
              icon={<Megaphone size={16} color={C.purple} strokeWidth={1.9} />}
              title="Send announcement"
              sub="push · email · SMS"
              onPress={() => setAnnounceOpen(true)}
              first
            />
            {dayOf ? null : (
              <ToolRow
                iconBg="rgba(34,197,94,0.14)"
                icon={<QrCode size={15} color={C.mint} strokeWidth={1.9} />}
                title="Check-in scanner"
                titleColor={C.t2}
                sub="unlocks on the day"
                trailing={(
                  <View style={{ borderWidth: 1, borderColor: C.hairline, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontFamily: F.mono, fontSize: 8, letterSpacing: 0.8, textTransform: 'uppercase', color: C.t3 }}>
                      {dateRange(event.startsAt).replace(/^[A-Za-z]{3}\s/, '')}
                    </Text>
                  </View>
                )}
                lock
              />
            )}

            {/* The money (pay-as-fact: host net only) */}
            <SectionLabel>The money</SectionLabel>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 22, paddingHorizontal: HORIZ }}>
              <MoneyStat n={isPaid ? formatRupees(earnedNet) : 'Free'} k="Earned" />
              <MoneyStat n={String(seatsTotal)} k="Seats" />
              <MoneyStat n={String(seatsOpen)} k="Open" />
            </View>
            <PayoutLine status={payoutStatus} payout={payout} onSetup={goPayouts} />

            {/* Essentials */}
            <SectionLabel>Essentials</SectionLabel>
            <View style={{ paddingHorizontal: HORIZ }}>
              <EssRow icon={<Calendar size={18} color={C.t2} strokeWidth={1.8} />} k="When" v={`${dateRange(event.startsAt, event.endsAt)}${timeLine(event) ? ` · ${timeLine(event)}` : ''}${data.daysLeft > 0 ? `  ·  ${data.daysLeft} day${data.daysLeft === 1 ? '' : 's'} to go` : ''}`} />
              {venueLine ? <EssRow icon={<MapPin size={18} color={C.t2} strokeWidth={1.8} />} k="Where" v={venueLine} /> : null}
              <EssRow icon={<Ticket size={18} color={C.t2} strokeWidth={1.8} />} k="Capacity · Price" v={`${seatsTotal} seats · ${isPaid && priceRupees > 0 ? `${formatRupees(priceRupees)} / ticket` : 'Free'}`} />
              {event.registrationDeadline ? (
                <EssRow icon={<Clock size={18} color={C.t2} strokeWidth={1.8} />} k="Registration deadline" v={formatDeadline(event.registrationDeadline)} last />
              ) : null}
            </View>
            <TouchableOpacity onPress={goSettings} accessibilityRole="button" accessibilityLabel="Edit in settings" hitSlop={6} style={{ alignItems: 'flex-end', paddingHorizontal: HORIZ, paddingTop: 12 }}>
              <Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.orange }}>Edit in settings →</Text>
            </TouchableOpacity>
          </>
        )}

        {/* quiet cancel foot */}
        {canCancel ? (
          <TouchableOpacity
            onPress={() => setCancelOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Cancel event"
            hitSlop={8}
            style={{ alignItems: 'center', marginHorizontal: HORIZ, marginTop: 22, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.hairSoft }}
          >
            <Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.coral }}>Cancel event</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      {/* sticky */}
      {sticky.kind !== 'none' ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: HORIZ, paddingTop: 14, paddingBottom: insets.bottom + 16, backgroundColor: C.bg }}>
          <TouchableOpacity
            onPress={() => {
              if (sticky.kind === 'announce') setAnnounceOpen(true);
              else if (sticky.kind === 'promote') { setStage('waitlist'); if (waitlistRows[0]) onPromote(waitlistRows[0]); }
            }}
            disabled={sticky.kind === 'promote' && promote.isPending}
            accessibilityRole="button"
            accessibilityLabel={sticky.label}
            style={{
              height: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              backgroundColor: sticky.kind === 'promote' ? C.cream : C.orangeSoft,
              borderWidth: sticky.kind === 'promote' ? 0 : 1, borderColor: C.orangeLine,
              opacity: sticky.kind === 'promote' && promote.isPending ? 0.6 : 1,
            }}
          >
            {sticky.kind === 'promote'
              ? <Check size={16} color={C.ink} strokeWidth={2.2} />
              : <Megaphone size={16} color={C.orange} strokeWidth={1.9} />}
            <Text style={{ fontFamily: F.bold, fontSize: 14.5, color: sticky.kind === 'promote' ? C.ink : C.orange }}>{sticky.label}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* sheets / modals */}
      <AnnouncementComposer visible={announceOpen} eventId={event._id} onClose={() => setAnnounceOpen(false)} onSent={() => setAnnounceOpen(false)} />
      <OrganizerCancellationModal
        visible={cancelOpen}
        eventId={event._id}
        attendeeCount={seatsTaken}
        ticketPriceRupees={priceRupees}
        onClose={() => setCancelOpen(false)}
        onCancelled={handleCancelled}
      />
      <EventPreviewModal event={event} visible={previewOpen} onClose={() => setPreviewOpen(false)} />
      {walkupsAllowed ? (
        <WalkupAddSheet
          visible={walkupOpen}
          event={event}
          remaining={seatsOpen}
          onClose={() => setWalkupOpen(false)}
          onAdded={() => setWalkupOpen(false)}
        />
      ) : null}
      <EventActionsSheet
        visible={actionsOpen}
        eventTitle={event.title}
        statusLabel={statusPill.label.toLowerCase()}
        isPaid={isPaid}
        priceRupees={priceRupees}
        payoutVerified={payoutStatus === 'verified'}
        payoutLine={payoutLineText(payout)}
        acceptingRsvps={!event.registrationClosed}
        seatsTaken={seatsTaken}
        seatsTotal={seatsTotal}
        canCancel={canCancel}
        onClose={() => setActionsOpen(false)}
        onEdit={() => { setActionsOpen(false); goEdit(); }}
        onShare={() => { setActionsOpen(false); onShare(); }}
        onPreview={() => { setActionsOpen(false); setPreviewOpen(true); }}
        onPayouts={() => { setActionsOpen(false); goPayouts(); }}
        onToggleAcceptingRsvps={onToggleAcceptingRsvps}
        onSettings={() => { setActionsOpen(false); goSettings(); }}
        onCancel={() => { setActionsOpen(false); setCancelOpen(true); }}
      />
      <AttendeeDetailSheet
        visible={!!detailRow}
        row={detailRow}
        busy={!!busyId && detailRow?._id === busyId}
        onClose={() => setDetailRow(null)}
        onMessage={messageRow}
        onCheckIn={checkInRow}
        onMarkNoShow={markNoShow}
        onCancelRefund={cancelRefundRow}
      />
      <ContactActionSheet visible={!!contactTarget} onClose={() => setContactTarget(null)} target={contactTarget} />
    </View>
  );
}

// ───────────────────────────────────────────────────────── stage bodies

function GoingBody({ rows, onOpen }: { rows: EventRosterRow[]; onOpen: (r: EventRosterRow) => void }) {
  if (rows.length === 0) {
    return <EmptyBody text="No one’s going yet." />;
  }
  return (
    <>
      {rows.map((row, i) => (
        <AttendeeRow key={row._id} row={row} variant="going" isNew={isRecent(row.registeredAt)} onPress={() => onOpen(row)} first={i === 0} />
      ))}
    </>
  );
}

function CheckedInBody({
  attended, pending, onCheckIn, onOpen,
}: {
  attended: EventRosterRow[]; pending: EventRosterRow[];
  onCheckIn: (r: EventRosterRow) => void; onOpen: (r: EventRosterRow) => void;
}) {
  if (attended.length === 0 && pending.length === 0) {
    return <EmptyBody text="No one’s in yet. Open the scanner to check attendees in." />;
  }
  let idx = 0;
  return (
    <>
      {attended.map((row) => (
        <AttendeeRow key={row._id} row={row} variant="attended" onPress={() => onOpen(row)} first={idx++ === 0} />
      ))}
      {pending.map((row) => (
        <AttendeeRow key={row._id} row={row} variant="pending-checkin" onCheckIn={() => onCheckIn(row)} first={idx++ === 0} />
      ))}
    </>
  );
}

function WaitlistBody({
  rows, canPromoteTop, promoting, busyId, autoPromote, onPromote,
}: {
  rows: EventRosterRow[]; canPromoteTop: boolean; promoting: boolean; busyId: string | null;
  autoPromote: boolean; onPromote: (r: EventRosterRow) => void;
}) {
  if (rows.length === 0) {
    return <EmptyBody text="No one’s waiting. A full house with a free seat promotes from here." />;
  }
  return (
    <>
      {rows.map((row, i) => (
        <AttendeeRow
          key={row._id}
          row={row}
          variant="waitlist"
          canPromote={i === 0 && canPromoteTop}
          promoting={promoting && busyId === row._id}
          onPromote={() => onPromote(row)}
          first={i === 0}
        />
      ))}
      <View style={{ marginHorizontal: HORIZ, marginTop: 16, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(59,130,246,0.26)', backgroundColor: 'rgba(59,130,246,0.10)', padding: 12 }}>
        <Text style={{ fontFamily: F.body, fontSize: 11.5, lineHeight: 18, color: C.t1 }}>
          {autoPromote
            ? 'Auto-promote is on — the top of the queue gets 30 min to confirm when a seat opens. Promote manually any time.'
            : 'Auto-promote is off — promote the top of the queue manually when a seat opens.'}
        </Text>
      </View>
    </>
  );
}

function RequestsBody({
  eventId, requestRows, approvedRows, spots, busyId, onApprove, onDecline,
}: {
  eventId: string;
  requestRows: EventRosterRow[];
  approvedRows: EventRosterRow[];
  spots?: any[];
  busyId: string | null;
  onApprove: (id: string) => void;
  onDecline: (id: string, reason?: string) => void;
}) {
  if (requestRows.length === 0 && approvedRows.length === 0) {
    return <EmptyBody text="You’re all caught up. New requests land here with their answers to approve or decline." />;
  }
  return (
    <View style={{ paddingHorizontal: HORIZ, paddingTop: 8 }}>
      {requestRows.length > 0 ? (
        <View style={{ marginBottom: approvedRows.length > 0 ? 24 : 0 }}>
          <Text style={{ fontFamily: F.body, fontSize: 11.5, color: C.t3, marginBottom: 12 }}>{pendingSummary(requestRows.length)}</Text>
          {requestRows.map((row) => (
            <RequestCard key={row._id} row={row} spots={spots} mode="pending" busy={busyId === row._id} onApprove={onApprove} onDecline={onDecline} />
          ))}
        </View>
      ) : null}
      {approvedRows.length > 0 ? (
        <View>
          <Text style={{ fontFamily: F.monoBold, fontSize: 9.5, letterSpacing: 1.5, textTransform: 'uppercase', color: C.t3, marginBottom: 12 }}>Awaiting payment · {approvedRows.length}</Text>
          {approvedRows.map((row) => (
            <RequestCard key={row._id} row={row} spots={spots} mode="approved" />
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ───────────────────────────────────────────────────────── small pieces

function EmptyBody({ text }: { text: string }) {
  return (
    <View style={{ paddingHorizontal: 34, paddingVertical: 40, alignItems: 'center' }}>
      <Text style={{ fontFamily: F.body, fontSize: 13, color: C.t3, textAlign: 'center', lineHeight: 20 }}>{text}</Text>
    </View>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontFamily: F.monoBold, fontSize: 9.5, letterSpacing: 1.9, textTransform: 'uppercase', color: C.t3, paddingHorizontal: HORIZ, paddingTop: 24, paddingBottom: 10 }}>
      {children}
    </Text>
  );
}

function ToolRow({
  icon, iconBg, title, sub, titleColor, onPress, trailing, lock, first,
}: {
  icon: React.ReactNode; iconBg: string; title: string; sub: string;
  titleColor?: string; onPress?: () => void; trailing?: React.ReactNode; lock?: boolean; first?: boolean;
}) {
  const Wrapper: any = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      {...(onPress ? { accessibilityRole: 'button', accessibilityLabel: title, activeOpacity: 0.7 } : {})}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: HORIZ, paddingVertical: 12, borderTopWidth: first ? 0 : 1, borderTopColor: C.hairSoft }}
    >
      <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: F.medium, fontSize: 13.5, color: titleColor ?? C.cream }}>{title}</Text>
        <Text style={{ fontFamily: F.body, fontSize: 10.5, color: C.t3, marginTop: 2 }}>{sub}</Text>
      </View>
      {trailing ?? (lock ? <Lock size={13} color={C.t3} strokeWidth={1.9} /> : <ChevronRight size={16} color={C.t2} strokeWidth={2} />)}
    </Wrapper>
  );
}

function MoneyStat({ n, k }: { n: string; k: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontFamily: F.serif, fontSize: 22, color: C.cream, lineHeight: 24 }} numberOfLines={1} adjustsFontSizeToFit>{n}</Text>
      <Text style={{ fontFamily: F.mono, fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', color: C.t3, marginTop: 5 }}>{k}</Text>
    </View>
  );
}

function PayoutLine({ status, payout, onSetup }: { status: string | null; payout: any; onSetup: () => void }) {
  if (status === null) return null; // loading — no flash
  if (status === 'verified') {
    return (
      <Text style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 0.2, color: C.t3, textAlign: 'center', paddingHorizontal: HORIZ, paddingTop: 12 }}>
        {payoutDestination(payout)} · <Text style={{ fontFamily: F.monoBold, color: C.mint }}>verified</Text> · payout ~2 days after
      </Text>
    );
  }
  if (status === 'submitted' || status === 'pending_kyc') {
    return (
      <Text style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 0.2, color: C.gold, textAlign: 'center', paddingHorizontal: HORIZ, paddingTop: 12 }}>
        verifying payouts…
      </Text>
    );
  }
  // not_started / rejected / suspended
  return (
    <TouchableOpacity onPress={onSetup} hitSlop={8} accessibilityRole="button" accessibilityLabel="Set up payouts to get paid" style={{ paddingTop: 12 }}>
      <Text style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 0.2, color: C.orange, textAlign: 'center' }}>
        {status === 'rejected' || status === 'suspended' ? 'Payouts need attention — tap to fix →' : 'Set up payouts to get paid →'}
      </Text>
    </TouchableOpacity>
  );
}

function EssRow({ icon, k, v, last }: { icon: React.ReactNode; k: string; v: string; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 13, paddingVertical: 13, borderBottomWidth: last ? 0 : 1, borderBottomColor: C.hairSoft, alignItems: 'flex-start' }}>
      <View style={{ width: 22, paddingTop: 1 }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: 1.3, textTransform: 'uppercase', color: C.t3 }}>{k}</Text>
        <Text style={{ fontFamily: F.medium, fontSize: 13.5, color: C.t1, marginTop: 3 }}>{v}</Text>
      </View>
    </View>
  );
}

function ChecklistRow({ label, done, gold }: { label: string; done?: boolean; gold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 13, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.hairSoft, alignItems: 'center' }}>
      <View style={{ width: 22, alignItems: 'center' }}>
        {done ? <Check size={18} color={C.mint} strokeWidth={2} /> : <Clock size={18} color={C.gold} strokeWidth={1.9} />}
      </View>
      <Text style={{ fontFamily: F.medium, fontSize: 13.5, color: gold ? C.gold : C.t1 }}>{label}</Text>
    </View>
  );
}

// ───────────────────────────────────────────────────────── helpers

function firstName(name?: string): string {
  const n = (name ?? '').trim();
  return n ? n.split(/\s+/)[0] : 'them';
}

/** "HDFC ••1234" / "user@okaxis" — the verified payout destination. */
function payoutDestination(payout: any): string {
  if (!payout) return 'Bank';
  if (payout.payoutMethod === 'upi' && payout.upiVpaMasked) return payout.upiVpaMasked;
  return `${payout.bankName ?? 'Bank'} ••${payout.bankLast4 ?? ''}`.trim();
}

/** Subtitle for the ⋯ sheet's verified Payouts row. */
function payoutLineText(payout: any): string | undefined {
  if (!payout || payout.status !== 'verified') return undefined;
  return `${payoutDestination(payout)} · payout ~2 days after`;
}

function formatDeadline(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${date} · ${time}`;
}
