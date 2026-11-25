// src/hooks/useEventAttendeeActions.ts
//
// The attendee row-actions controller for the Manage-Event surfaces — the events
// sibling of the gig hub's useGigApplicantActions. Owns the per-row busy lock, the
// feedback banner, the open detail row and the contact target, and wraps the six
// backed mutations (check-in · no-show · cancel+refund · waitlist promote · approve ·
// decline) with identical copy + error handling.
//
// Used by EventAttendeesAllScreen (the See-all list). NOTE: EventHostHub still
// carries its own inline copy of this logic; migrating the hub onto this hook is a
// planned follow-up (kept out of the See-all PR to avoid rewiring the untested,
// shipped hub). Keep the two in sync until then — this hook is the canonical home.

import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import {
  useWaitlistPromote, useUpdateRegistrationStatus,
  useCheckInByRegistration, useCancelRegistrationByOrganizer,
} from '@/hooks/useEvents';
import { useApproveRequest, useDeclineRequest } from '@/hooks/useEventRequests';
import {
  approvalErrorMessage, waitlistPromoteErrorMessage,
  checkInErrorMessage, cancelRegistrationErrorMessage,
  type EventRosterRow, type EventDoc,
} from '@/services/eventService';
import type { ContactTarget } from '@/features/team/ContactActionSheet';

export type AttendeeFeedback = { kind: 'error' | 'success'; text: string };

function firstName(name?: string): string {
  const n = (name ?? '').trim();
  return n ? n.split(/\s+/)[0] : 'them';
}

export function useEventAttendeeActions(
  eventId: string,
  event?: Pick<EventDoc, 'title' | 'registrationMode'> | null,
) {
  const [feedback, setFeedback] = useState<AttendeeFeedback | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [detailRow, setDetailRow] = useState<EventRosterRow | null>(null);
  const [contactTarget, setContactTarget] = useState<ContactTarget | null>(null);

  const promote = useWaitlistPromote(eventId);
  const approve = useApproveRequest(eventId);
  const decline = useDeclineRequest(eventId);
  const noShow = useUpdateRegistrationStatus(eventId);
  const checkIn = useCheckInByRegistration(eventId);
  const cancelAttendee = useCancelRegistrationByOrganizer(eventId);

  const isPaid = event?.registrationMode === 'paid_ticket';

  const openDetail = useCallback((row: EventRosterRow) => setDetailRow(row), []);
  const closeDetail = useCallback(() => setDetailRow(null), []);
  const closeContact = useCallback(() => setContactTarget(null), []);
  const clearFeedback = useCallback(() => setFeedback(null), []);

  const messageRow = useCallback((row: EventRosterRow) => {
    setDetailRow(null);
    setContactTarget({
      artistId: row.userId ?? '',
      displayName: (row.name ?? '').trim() || 'Attendee',
      phoneNumber: row.phone,
      gigTitle: event?.title,
    });
  }, [event?.title]);

  const checkInRow = useCallback((row: EventRosterRow) => {
    if (busyId) return;
    setBusyId(row._id);
    setFeedback(null);
    checkIn.mutate({ registrationId: row._id }, {
      onSuccess: () => { setDetailRow(null); setFeedback({ kind: 'success', text: `Checked ${firstName(row.name)} in.` }); },
      onError: (err) => setFeedback({ kind: 'error', text: checkInErrorMessage(err) }),
      onSettled: () => setBusyId(null),
    });
  }, [busyId, checkIn]);

  const cancelRefundRow = useCallback((row: EventRosterRow) => {
    if (busyId) return;
    Alert.alert(
      `Cancel ${firstName(row.name)}?`,
      isPaid
        ? 'Their seat is freed and a refund is initiated to their original payment method. This can’t be undone.'
        : 'Their seat is freed and their registration is cancelled. This can’t be undone.',
      [
        { text: 'Keep attendee', style: 'cancel' },
        {
          text: 'Cancel attendee',
          style: 'destructive',
          onPress: () => {
            if (busyId) return;
            setBusyId(row._id);
            setFeedback(null);
            cancelAttendee.mutate({ registrationId: row._id, reason: 'Cancelled by organizer' }, {
              onSuccess: (res: any) => {
                setDetailRow(null);
                setFeedback({
                  kind: 'success',
                  text: res?.refund
                    ? `Cancelled ${firstName(row.name)} — a refund is on the way.`
                    : `Cancelled ${firstName(row.name)}.`,
                });
              },
              onError: (err) => setFeedback({ kind: 'error', text: cancelRegistrationErrorMessage(err) }),
              onSettled: () => setBusyId(null),
            });
          },
        },
      ],
    );
  }, [busyId, isPaid, cancelAttendee]);

  const markNoShow = useCallback((row: EventRosterRow) => {
    if (busyId) return;
    setBusyId(row._id);
    setFeedback(null);
    noShow.mutate({ registrationId: row._id, status: 'no-show' }, {
      onSuccess: () => { setDetailRow(null); setFeedback({ kind: 'success', text: `Marked ${firstName(row.name)} as a no-show.` }); },
      onError: () => setFeedback({ kind: 'error', text: 'Could not update. Please try again.' }),
      onSettled: () => setBusyId(null),
    });
  }, [busyId, noShow]);

  const promoteRow = useCallback((row: EventRosterRow) => {
    if (busyId) return;
    setBusyId(row._id);
    setFeedback(null);
    promote.mutate(undefined, {
      onSuccess: () => setFeedback({ kind: 'success', text: `Invited ${firstName(row.name)} — the seat's held until they confirm.` }),
      onError: (err) => setFeedback({ kind: 'error', text: waitlistPromoteErrorMessage(err) }),
      onSettled: () => setBusyId(null),
    });
  }, [busyId, promote]);

  const approveRequest = useCallback((registrationId: string, name?: string) => {
    if (busyId) return;
    setBusyId(registrationId);
    setFeedback(null);
    const who = firstName(name);
    approve.mutate(registrationId, {
      onSuccess: (res: any) => setFeedback({
        kind: 'success',
        text: res?.status === 'approved' ? `Approved — ${who} has 48h to pay and hold the seat.` : `Approved — ${who} is in.`,
      }),
      onError: (err) => setFeedback({ kind: 'error', text: approvalErrorMessage(err, 'approve') }),
      onSettled: () => setBusyId(null),
    });
  }, [busyId, approve]);

  const declineRequest = useCallback((registrationId: string, reason?: string, name?: string) => {
    if (busyId) return;
    setBusyId(registrationId);
    setFeedback(null);
    const who = firstName(name);
    decline.mutate({ registrationId, reason }, {
      onSuccess: () => setFeedback({ kind: 'success', text: `Declined ${who}.` }),
      onError: (err) => setFeedback({ kind: 'error', text: approvalErrorMessage(err, 'decline') }),
      onSettled: () => setBusyId(null),
    });
  }, [busyId, decline]);

  return {
    feedback, setFeedback, clearFeedback,
    busyId,
    detailRow, openDetail, closeDetail,
    contactTarget, messageRow, closeContact,
    checkInRow, cancelRefundRow, markNoShow, promoteRow, approveRequest, declineRequest,
    promoting: promote.isPending,
  };
}
