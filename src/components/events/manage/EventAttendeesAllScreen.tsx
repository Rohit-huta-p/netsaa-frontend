/**
 * EventAttendeesAllScreen — the "See all" full attendee list for a hosted event,
 * reached from the host hub's capped stage previews. The events sibling of the gig
 * hub's GigApplicantsAllScreen: one paginated, searchable, sortable list per group,
 * over the already-loaded useEventRoster cache (client-side, no new API).
 *
 * Groups are DERIVED from the event's shape (rosterFilters.visibleGroups) — a pay-now
 * ticket shows 3 chips, a paid audition up to 6 — and an eligible stage shows even at
 * count 0 so the host sees it exists. Rows reuse the hub's own components: AttendeeRow
 * (confirmed / checked-in / waitlist / cancelled), RequestCard (requests / awaiting
 * payment) and AttendeeDetailSheet, with actions from the shared useEventAttendeeActions.
 *
 * Build plan: DOCS/02-engineering/NETSA_Event_SeeAll_Build_Plan.md (§2).
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, X, ArrowUpDown } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEvent } from '@/hooks/useEvents';
import { useEventRoster } from '@/hooks/useEventRoster';
import { useEventAttendeeActions } from '@/hooks/useEventAttendeeActions';
import type { EventRosterRow } from '@/services/eventService';

import AttendeeRow from './AttendeeRow';
import AttendeeDetailSheet from './AttendeeDetailSheet';
import RequestCard from './RequestCard';
import { ContactActionSheet } from '@/features/team/ContactActionSheet';
import { C, F } from './hubTokens';
import {
  buildGroups, groupCounts, visibleGroups, filterAndSortAttendees,
  GROUP_LABEL, EMPTY_FILTERS, setName,
  type AttendeeGroup, type AttendeeSort, type AttendeeFilters,
} from './rosterFilters';

const PAGE = 20;
const HORIZ = 18;
const DAY = 86_400_000;

/** A registration that landed in the last 24h gets a new-dot. */
function isRecent(iso?: string): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && Date.now() - t < DAY;
}

const EMPTY_COPY: Record<AttendeeGroup, string> = {
  requests: 'No open requests. New requests land here to approve or decline.',
  awaitingpay: 'No one is mid-payment. Approved guests appear here until they pay.',
  confirmed: 'No one’s confirmed yet. Registrations show up here as they come in.',
  waitlist: 'No one’s waiting. A full house with a free seat promotes from here.',
  checkedin: 'No one’s checked in yet. Open the scanner on the day to check attendees in.',
  cancelled: 'No cancellations. Pulled-out, declined and no-show registrations show here.',
};

export default function EventAttendeesAllScreen({
  eventId, initialStage, initialName = '',
}: {
  eventId: string;
  initialStage?: AttendeeGroup;
  initialName?: string;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const eventQuery = useEvent(eventId);
  const rosterQuery = useEventRoster(eventId);
  const event = eventQuery.data;
  const actions = useEventAttendeeActions(eventId, event);

  const [activeGroup, setActiveGroup] = useState<AttendeeGroup>(initialStage ?? 'confirmed');
  const [filters, setFilters] = useState<AttendeeFilters>(initialName ? { name: initialName } : EMPTY_FILTERS);
  const [sortKind, setSortKind] = useState<'natural' | 'name'>('natural');
  const [visibleCount, setVisibleCount] = useState(PAGE);

  // Bucket the roster into the six groups, then derive which chips show.
  const groups = useMemo(() => buildGroups(rosterQuery.data), [rosterQuery.data]);
  const counts = useMemo(() => groupCounts(groups), [groups]);
  const visible = useMemo(() => visibleGroups(event, counts), [event, counts]);

  // The selected group must be one that's actually visible (a deep-linked ?stage that
  // doesn't apply to this event falls back to the first visible group).
  const effectiveGroup: AttendeeGroup = visible.includes(activeGroup) ? activeGroup : (visible[0] ?? 'confirmed');

  // One natural/name toggle. "Natural" = the group's own order: Requests oldest-first,
  // Waitlist by queue position, everything else newest-first.
  const sortArg: AttendeeSort = sortKind === 'name'
    ? 'name'
    : effectiveGroup === 'waitlist' ? 'waitlist' : 'registered';
  const sortLabel = sortKind === 'name'
    ? 'Name A–Z'
    : effectiveGroup === 'waitlist' ? 'Queue order'
      : effectiveGroup === 'requests' ? 'Oldest first' : 'Most recent';

  const base = groups[effectiveGroup];
  const filtered = useMemo(
    () => filterAndSortAttendees(base, filters, sortArg, effectiveGroup),
    [base, filters, sortArg, effectiveGroup],
  );
  const shown = filtered.slice(0, visibleCount);

  // Reset paging whenever the window no longer maps.
  useEffect(() => { setVisibleCount(PAGE); }, [filters, sortKind, effectiveGroup]);

  const seatsOpen = Math.max(0, (event?.capacity?.total ?? 0) - (event?.capacity?.registeredCount ?? 0));
  const nameQ = filters.name.trim();

  const switchGroup = (g: AttendeeGroup) => { setActiveGroup(g); setSortKind('natural'); };
  const back = () => (router.canGoBack() ? router.back() : router.replace(`/events/${eventId}/manage/overview` as any));

  if (eventQuery.isLoading || rosterQuery.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }}>
        <ActivityIndicator color={C.orange} />
      </View>
    );
  }
  if (eventQuery.error || !event) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: insets.top }}>
        <Text style={{ fontFamily: F.body, color: C.t2 }}>Couldn’t load attendees.</Text>
      </View>
    );
  }

  const header = (
    <View>
      {/* back + title */}
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
        <Text numberOfLines={1} style={{ flex: 1, fontFamily: F.bold, fontSize: 18, color: C.cream, letterSpacing: -0.3 }}>
          All attendees
        </Text>
      </View>

      {/* group selector — exactly the groups this event's shape allows */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: 'row', gap: 7, paddingHorizontal: HORIZ, paddingTop: 12 }}
      >
        {visible.map((g) => {
          const on = g === effectiveGroup;
          return (
            <TouchableOpacity
              key={g}
              onPress={() => switchGroup(g)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${GROUP_LABEL[g]}, ${counts[g]}`}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingVertical: 8, paddingHorizontal: 13, borderRadius: 999,
                backgroundColor: on ? C.orangeSoft : C.card,
                borderWidth: 1, borderColor: on ? C.orangeLine : C.hairSoft,
              }}
            >
              <Text style={{ fontFamily: F.semibold, fontSize: 12.5, color: on ? C.orange : C.t2 }}>{GROUP_LABEL[g]}</Text>
              <Text style={{ fontFamily: F.monoBold, fontSize: 10, color: on ? C.orange : C.t3 }}>{counts[g]}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* search */}
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 10, height: 44,
          marginHorizontal: HORIZ, marginTop: 12, paddingHorizontal: 13,
          backgroundColor: C.card, borderWidth: 1, borderColor: C.hairSoft, borderRadius: 12,
        }}
      >
        <Search size={17} color={C.t3} strokeWidth={1.9} />
        <TextInput
          value={filters.name}
          onChangeText={(t) => setFilters((f) => setName(f, t))}
          placeholder="Search by name or phone"
          placeholderTextColor={C.t3}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor={C.orange}
          accessibilityLabel="Search attendees by name or phone"
          style={[
            { flex: 1, minWidth: 0, fontFamily: F.body, fontSize: 14.5, color: C.cream, padding: 0 },
            Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
          ]}
        />
        {filters.name.length > 0 ? (
          <TouchableOpacity
            onPress={() => setFilters((f) => setName(f, ''))}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={12} color={C.t3} strokeWidth={2.2} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* sort pill + "showing N of M" */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: HORIZ, paddingTop: 12, paddingBottom: 2 }}>
        <TouchableOpacity
          onPress={() => setSortKind((k) => (k === 'name' ? 'natural' : 'name'))}
          accessibilityRole="button"
          accessibilityLabel={`Sort: ${sortLabel}. Tap to change.`}
          activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: C.hairline, backgroundColor: C.card }}
        >
          <ArrowUpDown size={13} color={C.t2} strokeWidth={1.9} />
          <Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.t1 }}>{sortLabel}</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: F.monoBold, fontSize: 9.5, letterSpacing: 0.6, color: C.t3 }}>
          {`Showing ${Math.min(shown.length, filtered.length)} of ${filtered.length}`}
        </Text>
      </View>

      {/* feedback banner (approve/decline/promote/check-in/cancel) */}
      {actions.feedback ? (
        <TouchableOpacity
          onPress={actions.clearFeedback}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`${actions.feedback.text}. Dismiss.`}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: HORIZ, marginTop: 12,
            borderRadius: 11, borderWidth: 1, padding: 12,
            backgroundColor: actions.feedback.kind === 'error' ? C.coralSoft : C.mintSoft,
            borderColor: actions.feedback.kind === 'error' ? C.coralLine : C.mintLine,
          }}
        >
          <Text style={{ flex: 1, fontFamily: F.medium, fontSize: 12.5, lineHeight: 18, color: actions.feedback.kind === 'error' ? C.coral : C.mint }}>
            {actions.feedback.text}
          </Text>
          <X size={15} color={actions.feedback.kind === 'error' ? C.coral : C.mint} />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderItem = ({ item, index }: { item: EventRosterRow; index: number }) => {
    if (effectiveGroup === 'requests') {
      return (
        <View style={{ paddingHorizontal: HORIZ, paddingTop: index === 0 ? 10 : 0 }}>
          <RequestCard
            row={item}
            spots={event.spots}
            mode="pending"
            busy={actions.busyId === item._id}
            onApprove={(id) => actions.approveRequest(id, item.name)}
            onDecline={(id, reason) => actions.declineRequest(id, reason, item.name)}
          />
        </View>
      );
    }
    if (effectiveGroup === 'awaitingpay') {
      return (
        <View style={{ paddingHorizontal: HORIZ, paddingTop: index === 0 ? 10 : 0 }}>
          <RequestCard row={item} spots={event.spots} mode="approved" />
        </View>
      );
    }
    if (effectiveGroup === 'waitlist') {
      return (
        <AttendeeRow
          row={item}
          variant="waitlist"
          canPromote={index === 0 && seatsOpen > 0}
          promoting={actions.promoting && actions.busyId === item._id}
          onPromote={() => actions.promoteRow(item)}
          first={index === 0}
        />
      );
    }
    if (effectiveGroup === 'checkedin') {
      return <AttendeeRow row={item} variant="attended" onPress={() => actions.openDetail(item)} first={index === 0} />;
    }
    if (effectiveGroup === 'cancelled') {
      return <AttendeeRow row={item} variant="cancelled" first={index === 0} />;
    }
    return (
      <AttendeeRow
        row={item}
        variant="going"
        isNew={isRecent(item.registeredAt)}
        onPress={() => actions.openDetail(item)}
        first={index === 0}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <FlatList
        data={shown}
        keyExtractor={(r) => r._id}
        ListHeaderComponent={header}
        renderItem={renderItem}
        onEndReached={() => { if (visibleCount < filtered.length) setVisibleCount((c) => c + PAGE); }}
        onEndReachedThreshold={0.6}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={{ paddingVertical: 44, paddingHorizontal: 28, alignItems: 'center', gap: 14 }}>
            <Text style={{ fontFamily: F.body, fontSize: 13, color: C.t3, textAlign: 'center', lineHeight: 20 }}>
              {nameQ ? `No attendees match “${nameQ}”.` : EMPTY_COPY[effectiveGroup]}
            </Text>
            {nameQ ? (
              <TouchableOpacity
                onPress={() => setFilters((f) => setName(f, ''))}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: C.cream }}
              >
                <Text style={{ fontFamily: F.bold, fontSize: 12.5, color: C.ink }}>Clear search</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
        ListFooterComponent={
          visibleCount < filtered.length
            ? <ActivityIndicator color={C.orange} style={{ marginVertical: 20 }} />
            : <View style={{ height: insets.bottom + 40 }} />
        }
        showsVerticalScrollIndicator={false}
      />

      <AttendeeDetailSheet
        visible={!!actions.detailRow}
        row={actions.detailRow}
        busy={!!actions.busyId && actions.detailRow?._id === actions.busyId}
        onClose={actions.closeDetail}
        onMessage={actions.messageRow}
        onCheckIn={actions.checkInRow}
        onMarkNoShow={actions.markNoShow}
        onCancelRefund={actions.cancelRefundRow}
      />
      <ContactActionSheet visible={!!actions.contactTarget} onClose={actions.closeContact} target={actions.contactTarget} />
    </View>
  );
}
