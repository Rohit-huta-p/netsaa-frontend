/**
 * EventManageHero — editorial hero for the event manage overview.
 *
 * Mirrors the editorial language of the hirer home redesign: DM Serif
 * Display title, orange status pill, Space Mono date stamp.
 *
 * Layout:
 *   - Cover image strip (if any media exists, hero photo)
 *   - "Event" eyebrow (mono, uppercase, letter-spaced)
 *   - Title in DM Serif 28pt
 *   - Status pill + venue/online + date+time row
 */
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import type { EventDoc } from '@/services/eventService';
import {
  eventStatusLabel,
  eventStatusColor,
  durationKindLabel,
} from '@/lib/eventTokens';

function formatDateTime(iso?: string): string {
  if (!iso) return 'Date TBD';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Date TBD';
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }) + ' · ' + d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function venueLabel(loc?: EventDoc['location']): string {
  if (!loc) return '';
  if (loc.kind === 'online') return loc.onlinePlatform ?? 'Online';
  return loc.venueName ? `${loc.venueName}` : (loc.address ?? '');
}

export default function EventManageHero({ event }: { event: EventDoc }) {
  const heroMedia = event.media?.find((m) => m.isHero) ?? event.media?.[0];
  const hasHeroImage =
    heroMedia && heroMedia.kind === 'photo' && heroMedia.url && heroMedia.url !== 'netsa-fallback';
  const statusKey = (event.status as keyof typeof eventStatusLabel) ?? 'draft';
  const statusText = eventStatusLabel[statusKey] ?? 'Draft';
  const statusColor = eventStatusColor[statusKey] ?? '#6B6878';
  const venue = venueLabel(event.location);
  const duration = event.durationKind ? durationKindLabel[event.durationKind] : '';

  return (
    <View style={styles.container}>
      {hasHeroImage ? (
        <Image source={{ uri: heroMedia!.url }} style={styles.cover} resizeMode="cover" />
      ) : (
        <View style={[styles.cover, styles.coverFallback]}>
          <Text style={styles.coverFallbackText}>{event.title?.[0]?.toUpperCase() ?? '·'}</Text>
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.eyebrow}>EVENT</Text>
        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>

        {event.tagline ? (
          <Text style={styles.tagline} numberOfLines={2}>{event.tagline}</Text>
        ) : null}

        <View style={styles.metaRow}>
          <View style={[styles.pill, { backgroundColor: hexAlpha(statusColor, 0.12) }]}>
            <View style={[styles.pillDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.pillText, { color: statusColor }]}>{statusText}</Text>
          </View>
          {venue ? <Text style={styles.metaText}>{venue}</Text> : null}
        </View>

        <Text style={styles.stamp}>
          {formatDateTime(event.startsAt)}
          {duration ? `  ·  ${duration}` : ''}
        </Text>
      </View>
    </View>
  );
}

/** Quick alpha helper: takes a hex like #RRGGBB and returns rgba(r,g,b,a). */
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
  container: { gap: 16 },
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: '#0D0B12',
  },
  coverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14111B',
    borderColor: 'rgba(243,239,232,0.09)',
    borderWidth: 1,
  },
  coverFallbackText: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 56,
    color: '#FF6B35',
  },
  body: { gap: 8 },
  eyebrow: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 10,
    letterSpacing: 2,
    color: '#6B6878',
  },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: '#F3EFE8',
  },
  tagline: {
    fontFamily: 'Outfit-Light',
    fontSize: 14,
    lineHeight: 20,
    color: '#B8B1A6',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillDot: { width: 6, height: 6, borderRadius: 99 },
  pillText: { fontFamily: 'Outfit-Bold', fontSize: 9, letterSpacing: 1 },
  metaText: { fontSize: 12, color: '#B8B1A6', fontFamily: 'Outfit-Medium' },
  stamp: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#6B6878',
    marginTop: 2,
  },
});
