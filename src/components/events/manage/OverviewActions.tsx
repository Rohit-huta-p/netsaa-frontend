/**
 * OverviewActions — quick actions on the event manage overview.
 *
 * Editorial styling: dark tile with leading icon + label + chevron-style
 * affordance, matching the hirer home action queue rows.
 *
 * Reschedule stays behind EXPO_PUBLIC_FEATURE_EVENTS_CANCEL_RESCHEDULE.
 * Cancel event is now wired to OrganizerCancellationModal (Sprint 3, Task 8).
 */
import React, { useState } from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Edit3, XCircle, Clock, Share2 } from 'lucide-react-native';
import type { EventDoc } from '@/services/eventService';
import OrganizerCancellationModal, { type OrganizerCancelResult } from '@/components/events/manage/OrganizerCancellationModal';
import { useQueryClient } from '@tanstack/react-query';
import { eventKeys } from '@/hooks/useEvents';

const EVENTS_MANAGE_CANCEL_RESCHEDULE =
  process.env.EXPO_PUBLIC_FEATURE_EVENTS_CANCEL_RESCHEDULE === '1';

async function shareEvent(eventId: string, title: string) {
  const url = `https://netsaa.com/events/${eventId}`;
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).clipboard) {
    try {
      await (navigator as any).clipboard.writeText(url);
      Alert.alert('Link copied', url);
      return;
    } catch {
      // fall through
    }
  }
  try {
    await Share.share({ message: `${title} — ${url}`, url });
  } catch {
    Alert.alert('Share', url);
  }
}

export default function OverviewActions({ event }: { event: EventDoc }) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const qc = useQueryClient();

  const attendeeCount = event.capacity?.registeredCount ?? 0;
  const ticketPriceRupees: number = (event as any).pricing?.amount ?? 0;

  const handleCancelled = (_result: OrganizerCancelResult) => {
    setCancelOpen(false);
    // Invalidate event detail so status flips to 'cancelled' in the UI
    qc.invalidateQueries({ queryKey: eventKeys.detail(event._id) });
    Alert.alert(
      'Event cancelled',
      'All attendees have been notified and refunds are being processed.',
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.h3}>Actions</Text>

      <ActionRow
        Icon={Share2}
        iconColor="#FF6B35"
        label="Share event link"
        sublabel="Copy or share the public URL"
        onPress={() => shareEvent(event._id, event.title ?? 'Event')}
      />

      <ActionRow
        Icon={Edit3}
        iconColor="#B8B1A6"
        label="Edit details"
        sublabel="Editing live events ships in V2"
        onPress={() => Alert.alert('Edit', 'Editing live events ships in V2.')}
      />

      {EVENTS_MANAGE_CANCEL_RESCHEDULE ? (
        <ActionRow
          Icon={Clock}
          iconColor="#F59E0B"
          label="Reschedule event"
          sublabel="Pick a new date — refunds are honored automatically"
          onPress={() =>
            Alert.alert('Reschedule', 'Coming soon — backend wiring in progress.')
          }
        />
      ) : null}

      {/* Cancel event — always available; wired to OrganizerCancellationModal (Sprint 3) */}
      {event.status === 'live' || event.status === 'pending_review' ? (
        <ActionRow
          Icon={XCircle}
          iconColor="#EF4444"
          label="Cancel event"
          sublabel="Attendees refunded · NETSA absorbs service fee"
          onPress={() => setCancelOpen(true)}
        />
      ) : null}

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

function ActionRow({
  Icon,
  iconColor,
  label,
  sublabel,
  onPress,
}: {
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  iconColor: string;
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
      <View style={[styles.iconWrap, { backgroundColor: hexAlpha(iconColor, 0.12) }]}>
        <Icon size={16} color={iconColor} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub}>{sublabel}</Text>
      </View>
      <Text style={[styles.chevron, { color: iconColor }]}>›</Text>
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
  container: {
    backgroundColor: '#11111A',
    borderColor: 'rgba(243,239,232,0.09)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  h3: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    letterSpacing: -0.5,
    color: '#F3EFE8',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(243,239,232,0.05)',
  },
  iconWrap: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1, minWidth: 0 },
  rowLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 14,
    color: '#F3EFE8',
    lineHeight: 18,
  },
  rowSub: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: '#6B6878',
    marginTop: 2,
  },
  chevron: { fontSize: 18, fontFamily: 'Outfit-Bold' },
});
