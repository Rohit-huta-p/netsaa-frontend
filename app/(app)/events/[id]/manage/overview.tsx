/**
 * Event manage / Overview tab — O4 "Manage overview" mockup, exact.
 * (event-flow-mockups-organizer.html · O4)
 *
 * Top to bottom:
 *   0. Nav      — back · "Manage" · settings gear (O4 nav row)
 *   1. Header   — status badge ("LIVE · 21 days to go") + title + venue·date
 *   2. Stats    — 2×2 gridlined: Registered / Waitlist / Earnings / Discussion
 *   3. Actions  — "Quick actions" rows (roster / announce / scanner / cancel)
 *
 * The manage flow is a headerless Stack, so this screen draws its own nav row.
 */
import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert, StyleSheet } from 'react-native';
import { ChevronLeft, Settings } from 'lucide-react-native';
import { useEvent } from '@/hooks/useEvents';
import { eventStatusLabel, eventStatusColor } from '@/lib/eventTokens';
import OverviewStatsGrid from '@/components/events/manage/OverviewStatsGrid';
import OverviewActions from '@/components/events/manage/OverviewActions';
import type { EventDoc } from '@/services/eventService';

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

/** "Mar 14 — 20" (same month) / "Mar 14 — Apr 2" / "Mar 14". */
function dateRange(startsAt?: string, endsAt?: string): string {
  if (!startsAt) return 'Date TBD';
  const s = new Date(startsAt);
  if (Number.isNaN(s.getTime())) return 'Date TBD';
  const mon: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = s.toLocaleDateString('en-IN', mon);
  if (!endsAt) return startStr;
  const e = new Date(endsAt);
  if (Number.isNaN(e.getTime()) || e.toDateString() === s.toDateString()) return startStr;
  const sameMonth = e.getMonth() === s.getMonth() && e.getFullYear() === s.getFullYear();
  const endStr = sameMonth ? String(e.getDate()) : e.toLocaleDateString('en-IN', mon);
  return `${startStr} — ${endStr}`;
}

function venueLabel(loc?: EventDoc['location']): string {
  if (!loc) return '';
  if (loc.kind === 'online') return loc.onlinePlatform ?? 'Online';
  return loc.venueName ?? loc.address ?? '';
}

export default function OverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: event, isLoading } = useEvent(id);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FF6B35" />
      </View>
    );
  }
  if (!event) return null;

  const statusKey = (event.status as keyof typeof eventStatusLabel) ?? 'draft';
  const statusText = (eventStatusLabel[statusKey] ?? 'Draft').toUpperCase();
  const statusColor = eventStatusColor[statusKey] ?? '#6B6878';
  const timeLabel = timeToGo(event.startsAt, event.endsAt);
  const venue = venueLabel(event.location);
  const subtitle = [dateRange(event.startsAt, event.endsAt), venue].filter(Boolean).join(' · ');

  return (
    <View style={styles.screen}>
      {/* 0 · Nav — back · Manage · settings */}
      <View style={styles.nav}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={8}
          style={styles.navBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={18} color="#F3EFE8" />
        </Pressable>
        <Text style={styles.navTitle}>Manage</Text>
        <Pressable
          onPress={() => Alert.alert('Event settings', 'Event settings are coming soon.')}
          hitSlop={8}
          style={styles.navBtn}
          accessibilityRole="button"
          accessibilityLabel="Event settings"
        >
          <Settings size={17} color="#F3EFE8" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 1 · Header */}
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: hexAlpha(statusColor, 0.14) }]}>
            <View style={[styles.badgeDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {statusText}{timeLabel ? ` · ${timeLabel}` : ''}
            </Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
          {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
        </View>

        {/* 2 · Stats */}
        <OverviewStatsGrid event={event} />

        {/* 3 · Quick actions */}
        <OverviewActions event={event} />
      </ScrollView>
    </View>
  );
}

function hexAlpha(hex: string, alpha: number): string {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return `rgba(34,197,94,${alpha})`;
  const int = parseInt(m[1], 16);
  return `rgba(${(int >> 16) & 255},${(int >> 8) & 255},${int & 255},${alpha})`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#060509' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#060509' },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: { flex: 1, fontFamily: 'DMSerifDisplay_400Regular', color: '#F3EFE8', fontSize: 20 },
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 64, gap: 16 },
  header: { gap: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 99 },
  badgeText: { fontFamily: 'Outfit-SemiBold', fontSize: 10.5 },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 24,
    lineHeight: 27,
    letterSpacing: -0.4,
    color: '#F3EFE8',
  },
  sub: { fontFamily: 'Outfit-Regular', fontSize: 12, color: '#9C99A6' },
});
