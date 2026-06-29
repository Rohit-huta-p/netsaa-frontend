/**
 * OverviewActions — the O4 mockup's "Quick actions" list.
 *
 * Matches event-flow-mockups-organizer.html · O4: a mono section label over
 * flush inbox rows (40px coloured avatar · title · sublabel · muted chevron),
 * no surrounding card. Four rows, in mockup order:
 *   View roster · Send announcement · Open check-in scanner · Cancel event
 *
 * Share / Edit / Reschedule are intentionally not here — the mockup keeps O4
 * to these four; share lives on the public detail screen, editing-live is V2.
 * Cancel is wired to OrganizerCancellationModal (Sprint 3); announcement to
 * AnnouncementComposer (Sprint 5). Cancel only shows while cancellable.
 */
import React, { useState } from 'react';
import { View, Pressable, Text, StyleSheet, Alert } from 'react-native';
import { Users, MessageSquare, Lock, Ban, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import type { EventDoc } from '@/services/eventService';
import OrganizerCancellationModal, { type OrganizerCancelResult } from '@/components/events/manage/OrganizerCancellationModal';
import AnnouncementComposer from '@/components/events/manage/AnnouncementComposer';
import { useQueryClient } from '@tanstack/react-query';
import { eventKeys } from '@/hooks/useEvents';

export default function OverviewActions({ event }: { event: EventDoc }) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [announceOpen, setAnnounceOpen] = useState(false);
  const qc = useQueryClient();
  const router = useRouter();

  const registered = event.capacity?.registeredCount ?? 0;
  const waitlist = (event as any).waitlistCount ?? 0;
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
    <View style={styles.container}>
      <Text style={styles.label}>QUICK ACTIONS</Text>

      <ActionRow
        Icon={Users}
        color="#5B8DEF"
        label="View roster"
        sublabel={`${registered} confirmed · ${waitlist} on waitlist · check-in roster`}
        onPress={() => router.push(`/events/${event._id}/manage/roster`)}
      />

      <ActionRow
        Icon={MessageSquare}
        color="#8B5CF6"
        label="Send announcement"
        sublabel="push / email / SMS · choose audience"
        onPress={() => setAnnounceOpen(true)}
      />

      <ActionRow
        Icon={Lock}
        color="#22C55E"
        label="Open check-in scanner"
        sublabel="unlocks day-of · QR scan"
        onPress={() => router.push(`/events/${event._id}/manage/check-in`)}
      />

      {canCancel ? (
        <ActionRow
          Icon={Ban}
          color="#EF4444"
          label="Cancel event"
          sublabel="refund all attendees · destructive"
          onPress={() => setCancelOpen(true)}
        />
      ) : null}

      <OrganizerCancellationModal
        visible={cancelOpen}
        eventId={event._id}
        attendeeCount={registered}
        ticketPriceRupees={ticketPriceRupees}
        onClose={() => setCancelOpen(false)}
        onCancelled={handleCancelled}
      />

      <AnnouncementComposer
        visible={announceOpen}
        eventId={event._id}
        onClose={() => setAnnounceOpen(false)}
        onSent={() => setAnnounceOpen(false)}
      />
    </View>
  );
}

function ActionRow({
  Icon,
  color,
  label,
  sublabel,
  onPress,
}: {
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  label: string;
  sublabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${sublabel}`}
    >
      <View style={[styles.av, { backgroundColor: hexAlpha(color, 0.16) }]}>
        <Icon size={18} color={color} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub}>{sublabel}</Text>
      </View>
      <ChevronRight size={18} color="#4A4854" />
    </Pressable>
  );
}

function hexAlpha(hex: string, alpha: number): string {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return `rgba(255,107,53,${alpha})`;
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
  container: { gap: 0 },
  label: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 10,
    letterSpacing: 1.8,
    color: '#6B6878',
    marginTop: 6,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: 'rgba(243,239,232,0.07)',
  },
  av: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, minWidth: 0 },
  rowLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 13.5,
    color: '#F3EFE8',
    lineHeight: 18,
  },
  rowSub: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11.5,
    color: '#9C99A6',
    marginTop: 2,
  },
});
