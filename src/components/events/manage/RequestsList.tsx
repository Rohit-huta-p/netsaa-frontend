/**
 * RequestsList — the host Requests surface body (event-manage-aminimal.html ·
 * frame 11). Two sections off the bucketed roster:
 *   • "Requests"          — pending guest_list/apply requests → Approve / Decline
 *   • "Awaiting payment"  — approved PAID holds, read-only (who still owes payment)
 *
 * Owns the approve/decline mutations, a single feedback banner, and the per-row
 * busy lock. Capacity (409) and non-host (403) failures surface the backend's own
 * copy via approvalErrorMessage. On success the roster query is invalidated, so
 * the row drops out of the pending bucket on refetch.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { useEvent } from '@/hooks/useEvents';
import { useEventRoster } from '@/hooks/useEventRoster';
import { useApproveRequest, useDeclineRequest } from '@/hooks/useEventRequests';
import { approvalErrorMessage } from '@/services/eventService';
import RequestCard from './RequestCard';
import { pendingSummary } from './requestFormat';

const C = {
  bg: '#121216',
  cream: '#F3EFE8',
  text3: '#9C99A6',
  text4: '#6E6C76',
  orange: '#FF6B35',
  errBg: 'rgba(240,101,107,0.12)',
  errLine: 'rgba(240,101,107,0.3)',
  err: '#F0858A',
  okBg: 'rgba(34,197,94,0.12)',
  okLine: 'rgba(34,197,94,0.3)',
  ok: '#6EE7A0',
};

type Feedback = { kind: 'error' | 'success'; text: string };

export default function RequestsList({ eventId }: { eventId: string }) {
  const { data: event } = useEvent(eventId);
  const { data, isLoading, refetch, isRefetching } = useEventRoster(eventId);
  const approve = useApproveRequest(eventId);
  const decline = useDeclineRequest(eventId);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const requests = data?.requests ?? [];
  const approved = data?.approved ?? [];
  const counts = data?.counts;
  const spots = event?.spots;

  const nameFor = (id: string) => requests.find((r) => r._id === id)?.name?.trim() || 'the request';

  const onApprove = (registrationId: string) => {
    if (busyId) return;
    setBusyId(registrationId);
    setFeedback(null);
    const who = nameFor(registrationId);
    approve.mutate(registrationId, {
      onSuccess: (res) => {
        setFeedback({
          kind: 'success',
          text: res.status === 'approved'
            ? `Approved — ${who} has 48h to pay and hold the seat.`
            : `Approved — ${who} is in.`,
        });
      },
      onError: (err) => setFeedback({ kind: 'error', text: approvalErrorMessage(err, 'approve') }),
      onSettled: () => setBusyId(null),
    });
  };

  const onDecline = (registrationId: string, reason?: string) => {
    if (busyId) return;
    setBusyId(registrationId);
    setFeedback(null);
    const who = nameFor(registrationId);
    decline.mutate({ registrationId, reason }, {
      onSuccess: () => setFeedback({ kind: 'success', text: `Declined ${who}.` }),
      onError: (err) => setFeedback({ kind: 'error', text: approvalErrorMessage(err, 'decline') }),
      onSettled: () => setBusyId(null),
    });
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator color={C.orange} />
      </View>
    );
  }

  const nothing = requests.length === 0 && approved.length === 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.orange} />}
    >
      {feedback ? (
        <Pressable
          onPress={() => setFeedback(null)}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 10,
            borderRadius: 11, borderWidth: 1, padding: 12, marginBottom: 14,
            backgroundColor: feedback.kind === 'error' ? C.errBg : C.okBg,
            borderColor: feedback.kind === 'error' ? C.errLine : C.okLine,
          }}
          accessibilityRole="button"
          accessibilityLabel={`${feedback.text}. Dismiss.`}
        >
          <Text style={{ flex: 1, fontFamily: 'Outfit-Medium', fontSize: 12.5, lineHeight: 18, color: feedback.kind === 'error' ? C.err : C.ok }}>
            {feedback.text}
          </Text>
          <X size={15} color={feedback.kind === 'error' ? C.err : C.ok} />
        </Pressable>
      ) : null}

      {nothing ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 72 }}>
          <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 21, color: C.cream, marginBottom: 7, textAlign: 'center' }}>
            You're all caught up
          </Text>
          <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 13, color: C.text3, textAlign: 'center', lineHeight: 20 }}>
            When someone asks to join, their request lands here with their answers for you to approve or decline.
          </Text>
        </View>
      ) : null}

      {requests.length > 0 ? (
        <View style={{ marginBottom: approved.length > 0 ? 28 : 0 }}>
          <SectionHead
            label="Requests"
            count={counts?.requests ?? requests.length}
            sub={pendingSummary(counts?.requests ?? requests.length)}
          />
          {requests.map((row) => (
            <RequestCard
              key={row._id}
              row={row}
              spots={spots}
              mode="pending"
              busy={busyId === row._id}
              onApprove={onApprove}
              onDecline={onDecline}
            />
          ))}
        </View>
      ) : null}

      {approved.length > 0 ? (
        <View>
          <SectionHead
            label="Awaiting payment"
            count={counts?.approved ?? approved.length}
            sub="Approved — holding a seat until they pay within 48h."
          />
          {approved.map((row) => (
            <RequestCard key={row._id} row={row} spots={spots} mode="approved" />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function SectionHead({ label, count, sub }: { label: string; count: number; sub: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 19, color: C.cream }}>{label}</Text>
        <Text
          style={{
            fontFamily: 'SpaceMono-Bold', fontSize: 10, color: C.orange,
            backgroundColor: 'rgba(255,107,53,0.14)', overflow: 'hidden',
            minWidth: 20, textAlign: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99,
          }}
        >
          {count}
        </Text>
      </View>
      <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 11.5, color: C.text4, marginTop: 4 }}>{sub}</Text>
    </View>
  );
}
