/**
 * PosterHero — the "Living Poster" hero for the event manage overview.
 * (event-manage-living-poster.html · Manage + Day-of frames · the .hero block)
 *
 * Full-bleed ~360px poster, top to bottom:
 *   - Background  — paginated media carousel (expo-image) or the brand-gradient
 *                   fallback (EventHeroGallery's logo asset over a dark wash)
 *   - Scrim       — transparent → near-black bottom gradient
 *   - Nav row     — glass back circle · status pill (TODAY / LIVE / DRAFT…) ·
 *                   Preview · Share · Settings
 *   - Add-photo   — dashed glass circle on the right edge
 *   - Hero foot   — carousel dots · serif title · orange organizer sub ·
 *                   date/venue meta · 5px capacity fill bar
 *
 * Purely presentational — all behavior arrives via callbacks; no data fetching.
 */
import { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import EventVideo from '../EventVideo';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Eye, Share2, Settings, ImagePlus } from 'lucide-react-native';
import type { EventDoc, EventMedia } from '@/services/eventService';
import { eventStatusLabel, eventStatusColor } from '@/lib/eventTokens';
import { formatRupees } from '@/lib/eventPricing';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = 360;

const NETSA_FALLBACK = require('@/../assets/netsa-logo-fallback.png');

// Inbox-rhythm palette (DOCS/designs/INBOX_RHYTHM_DESIGN_SYSTEM.md)
const BG='#060509', SURFACE='rgba(255,255,255,0.04)', HAIR='rgba(255,255,255,0.07)', HAIR2='rgba(255,255,255,0.10)';
const T0='#F3EFE8', T1='#A1A1AA', T2='#71717a', T3='#52525b', T4='#3f3f46', INK='#1A0D06';
const ORANGE='#FF6B35', ORANGE_SOFT='rgba(255,107,53,0.16)', ORANGE_LINE='rgba(255,107,53,0.34)';
const GREEN='#22C55E', BLUE='#5B8DEF', PURPLE='#8B5CF6', YELLOW='#EAB308', RED='#EF4444';
const DSC_CARD='#15131C', DSC_BODY='#D5D0C8', DSC_MUT='#6B6878', DSC_SEND='#F97316';

/** "Mar 14 — 20" (same month) / "Mar 14 — Apr 2" / "Mar 14". (per manage overview) */
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

interface PosterHeroProps {
  event: EventDoc;
  status: EventDoc['status'];     // drives the pill: live → green LIVE; else eventTokens label/color
  dayOf: boolean;                 // true (live events only) → "TODAY · DOORS OPEN" orange pill
  timeLabel: string;              // e.g. "21 days to go" (from overview's timeToGo)
  onBack(): void;
  onPreview(): void;
  onShare(): void;
  onSettings(): void;
  onAddPhoto(): void;
}

export default function PosterHero({
  event,
  status,
  dayOf,
  timeLabel,
  onBack,
  onPreview,
  onShare,
  onSettings,
  onAddPhoto,
}: PosterHeroProps) {
  const [index, setIndex] = useState(0);

  const media: EventMedia[] = [...(event.media ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  // Orange serif sub — organizer display name when the backend populated it.
  // No invented copy: if the name isn't resolvable, the line is omitted.
  const organizerName = typeof event.organizerId === 'object' ? event.organizerId?.name : undefined;

  const meta = [dateRange(event.startsAt, event.endsAt), venueLabel(event.location)]
    .filter(Boolean)
    .join(' · ');

  // Price — sits opposite the date/venue in the hero foot (justify-between).
  // Paid → "₹4,500 tkt"; free → "Free". Same pricing read as RoomStats.
  const isPaid = event.registrationMode === 'paid_ticket';
  const ticketPrice = (event as any).pricing?.amount ?? (event as any).ticketPrice ?? 0;
  const priceLabel = isPaid ? formatRupees(ticketPrice) : 'Free';

  const pct = event.capacity?.total
    ? Math.max(0, Math.min(100, Math.round((event.capacity.registeredCount / event.capacity.total) * 100)))
    : 0;

  // Non-live pill copy — the status label, plus the countdown only where the
  // schedule is still forward-looking (draft / pending_review). For cancelled
  // and completed the timeLabel ("underway", "ended") adds noise, not info.
  const statusColor = eventStatusColor[status];
  const statusText =
    timeLabel && (status === 'draft' || status === 'pending_review')
      ? `${eventStatusLabel[status].toUpperCase()} · ${timeLabel}`
      : eventStatusLabel[status].toUpperCase();

  return (
    <View style={styles.hero}>
      {/* Background — media carousel, or the brand-gradient fallback */}
      {media.length > 0 ? (
        <FlatList
          data={media}
          keyExtractor={(_, i) => `poster-media-${i}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            setIndex(Math.max(0, Math.min(media.length - 1, i)));
          }}
          renderItem={({ item }) => (
            item.kind === 'video' && item.muxPlaybackId ? (
              <EventVideo playbackId={item.muxPlaybackId} style={{ width: SCREEN_W, height: HERO_H }} />
            ) : (
              <ExpoImage
                source={{ uri: item.kind === 'video' ? item.thumbnailUrl ?? item.url : item.url }}
                style={{ width: SCREEN_W, height: HERO_H }}
                contentFit="cover"
                transition={200}
              />
            )
          )}
        />
      ) : (
        <View style={{ width: SCREEN_W, height: HERO_H }}>
          <LinearGradient colors={['#20122b', '#0b0710']} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(255,107,53,0.45)', 'rgba(255,107,53,0)']}
            start={{ x: 0.68, y: 0.05 }}
            end={{ x: 0.2, y: 0.9 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(139,92,246,0.35)', 'rgba(139,92,246,0)']}
            start={{ x: 0.2, y: 0.65 }}
            end={{ x: 0.85, y: 0.15 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.fallbackLogoWrap}>
            <Image source={NETSA_FALLBACK} style={styles.fallbackLogo} resizeMode="contain" />
          </View>
        </View>
      )}

      {/* Scrim — transparent → near-black over the bottom 80% */}
      <LinearGradient
        colors={['transparent', 'rgba(6,5,9,0.35)', 'rgba(6,5,9,0.96)']}
        locations={[0, 0.4, 1]}
        pointerEvents="none"
        style={styles.scrim}
      />

      {/* Nav row — glass controls over the scrim */}
      <View style={styles.nav} pointerEvents="box-none">
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={styles.glassCircle}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={18} color="#fff" />
        </Pressable>

        {dayOf ? (
          <View style={[styles.livePill, styles.todayPill]}>
            <View style={[styles.livePillDot, { backgroundColor: INK }]} />
            <Text style={[styles.livePillText, { color: INK }]} numberOfLines={1}>
              TODAY · DOORS OPEN
            </Text>
          </View>
        ) : status === 'live' ? (
          <View style={styles.livePill}>
            <View style={[styles.livePillDot, { backgroundColor: GREEN }]} />
            <Text style={[styles.livePillText, { color: GREEN }]} numberOfLines={1}>
              {timeLabel ? `LIVE · ${timeLabel}` : 'LIVE'}
            </Text>
          </View>
        ) : (
          // draft / pending_review / cancelled / completed — same glass pill,
          // dot + text + border tinted with the eventTokens status color.
          <View style={[styles.livePill, { borderColor: `${statusColor}66` }]}>
            <View style={[styles.livePillDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.livePillText, { color: statusColor }]} numberOfLines={1}>
              {statusText}
            </Text>
          </View>
        )}

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={onPreview}
          hitSlop={6}
          style={styles.previewPill}
          accessibilityRole="button"
          accessibilityLabel="Preview as a viewer"
        >
          <Eye size={13} color="#fff" />
          <Text style={styles.previewText}>Preview</Text>
        </Pressable>
        <Pressable
          onPress={onShare}
          hitSlop={6}
          style={styles.glassCircle}
          accessibilityRole="button"
          accessibilityLabel="Share event"
        >
          <Share2 size={15} color="#fff" />
        </Pressable>
        <Pressable
          onPress={onSettings}
          hitSlop={6}
          style={styles.glassCircle}
          accessibilityRole="button"
          accessibilityLabel="Event settings"
        >
          <Settings size={15} color="#fff" />
        </Pressable>
      </View>

      {/* Add-photo — dashed circle on the right edge */}
      <Pressable
        onPress={onAddPhoto}
        hitSlop={8}
        style={styles.addPhoto}
        accessibilityRole="button"
        accessibilityLabel="Add photo"
      >
        <ImagePlus size={18} color="#fff" />
      </Pressable>

      {/* Hero foot — dots · title · sub · meta · fill bar */}
      <View style={styles.foot} pointerEvents="none">
        {media.length > 1 && (
          <View style={styles.dots}>
            {media.map((_, i) => (
              <View key={`poster-dot-${i}`} style={[styles.dot, i === index && styles.dotOn]} />
            ))}
          </View>
        )}
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        {organizerName ? <Text style={styles.sub}>{organizerName}</Text> : null}
        <View style={styles.metaRow}>
          {meta ? (
            <Text style={styles.meta} numberOfLines={1}>{meta}</Text>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <Text style={styles.price}>
            {priceLabel}
            {isPaid ? <Text style={styles.priceUnit}> tkt</Text> : null}
          </Text>
        </View>
        <View style={styles.fillTrack}>
          <LinearGradient
            colors={['#FF8A5B', ORANGE]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.fillBar, { width: `${pct}%` }]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: HERO_H,
    overflow: 'hidden',
    backgroundColor: '#0b0710',
  },
  fallbackLogoWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackLogo: { width: 96, height: 96, opacity: 0.35 },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: HERO_H * 0.8,
  },
  // Mockup: 34px status row, then the nav row (padding 6px 16px).
  nav: {
    position: 'absolute',
    top: 34,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  glassCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    maxWidth: 150,
    flexShrink: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.4)',
    borderRadius: 99,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  todayPill: {
    backgroundColor: ORANGE,
    borderColor: ORANGE,
  },
  livePillDot: { width: 6, height: 6, borderRadius: 3 },
  livePillText: { fontFamily: 'Outfit-Bold', fontSize: 10 },
  previewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 99,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  previewText: { fontFamily: 'Outfit-SemiBold', fontSize: 11, color: '#fff' },
  addPhoto: {
    position: 'absolute',
    right: 12,
    top: '44%',
    transform: [{ translateY: -21 }],
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  foot: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 18,
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotOn: { width: 16, backgroundColor: '#fff' },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    color: '#fff',
    fontSize: 36,
    lineHeight: 35,
    letterSpacing: -0.72,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 24,
  },
  sub: {
    fontFamily: 'DMSerifDisplay_400Regular',
    color: ORANGE,
    fontSize: 15,
    marginTop: 7,
  },
  // .metarow — date/venue on the left, price justified to the right, baselines aligned
  metaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 5,
  },
  meta: {
    flex: 1,
    fontFamily: 'Outfit-Regular',
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11.5,
  },
  price: {
    fontFamily: 'DMSerifDisplay_400Regular',
    color: '#fff',
    fontSize: 16,
    flexShrink: 0,
  },
  priceUnit: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 8,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.64,
    textTransform: 'uppercase',
  },
  fillTrack: {
    height: 5,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginTop: 14,
    overflow: 'hidden',
  },
  fillBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 99,
  },
});
