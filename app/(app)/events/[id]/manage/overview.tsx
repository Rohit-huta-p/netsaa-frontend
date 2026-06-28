/**
 * Event manage / Overview tab.
 *
 * Editorial layout for the hirer's view of a single event they organize.
 * Mirrors the redesigned hirer home language: DM Serif headlines, Outfit
 * body, near-black canvas, orange accent.
 *
 * Order (top to bottom):
 *   1. EventStickyCTA       — urgent banner (event soon, sold out, etc.)
 *   2. EventManageHero      — title, status, venue, date, cover
 *   3. EventCapacityBar     — animated fill with sold-out / filling-up tags
 *   4. OverviewKpis         — time to event, views, saves (secondary)
 *   5. EventMoneyBlock      — revenue summary (paid events only)
 *   6. EventRecentRegistrations — last 5 RSVPs with link to Roster
 *   7. OverviewActions      — share, edit, reschedule, cancel
 */
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useEvent } from '@/hooks/useEvents';
import EventManageHero from '@/components/events/manage/EventManageHero';
import OverviewStatsGrid from '@/components/events/manage/OverviewStatsGrid';
import EventRecentRegistrations from '@/components/events/manage/EventRecentRegistrations';
import OverviewActions from '@/components/events/manage/OverviewActions';
import EventStickyCTA from '@/components/events/manage/EventStickyCTA';

export default function OverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#060509' }}>
        <ActivityIndicator color="#FF6B35" />
      </View>
    );
  }
  if (!event) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#060509' }}
      contentContainerStyle={{ padding: 24, paddingBottom: 80, gap: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <EventStickyCTA event={event} />
      <EventManageHero event={event} />
      <OverviewStatsGrid event={event} />
      <EventRecentRegistrations eventId={id!} />
      <OverviewActions event={event} />
    </ScrollView>
  );
}
