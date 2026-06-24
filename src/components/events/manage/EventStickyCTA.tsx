/**
 * EventStickyCTA — urgent action banner on the manage overview.
 *
 * Surfaces the most pressing thing about the event right now. v1 logic:
 *
 *   1. Event starts within 24h → "Tonight at 7pm · share the link"
 *   2. Event starts within 48h → "In 2 days · capacity {pct}%"
 *   3. Capacity ≥ 90% (and event still upcoming) → "Filling up · {n} seats left"
 *   4. Cancelled → "Cancelled {date} · refund queue active"
 *   5. Completed → "Wrapped {date} · review your no-shows"
 *   6. Default → null (no banner)
 *
 * Returns null when no urgency applies so the layout stays clean for
 * "everything is fine, no rush" events.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Share, Platform, Alert } from 'react-native';
import { Send, AlertCircle, CheckCircle, Clock } from 'lucide-react-native';
import type { EventDoc } from '@/services/eventService';
import { CAPACITY_URGENCY_THRESHOLD } from '@/lib/eventTokens';

interface State {
  kind: 'starting_soon' | 'upcoming_soon' | 'filling_up' | 'cancelled' | 'completed' | null;
  title: string;
  body: string;
  cta?: { label: string; onPress: () => void };
  accentColor: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}

async function copyShareLink(eventId: string) {
  const url = `https://netsaa.com/events/${eventId}`;
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).clipboard) {
    try {
      await (navigator as any).clipboard.writeText(url);
      Alert.alert('Link copied', url);
      return;
    } catch {
      // fall through to Share
    }
  }
  try {
    await Share.share({ message: url });
  } catch {
    Alert.alert('Share link', url);
  }
}

function computeState(event: EventDoc): State {
  const startsAt = event.startsAt ? new Date(event.startsAt) : null;
  const hoursToGo =
    startsAt && !Number.isNaN(startsAt.getTime())
      ? (startsAt.getTime() - Date.now()) / 3_600_000
      : Infinity;
  const fillPct =
    event.capacity?.total && event.capacity.total > 0
      ? event.capacity.registeredCount / event.capacity.total
      : 0;
  const slotsLeft = Math.max(0, (event.capacity?.total ?? 0) - (event.capacity?.registeredCount ?? 0));

  if (event.status === 'cancelled') {
    return {
      kind: 'cancelled',
      title: 'Event cancelled',
      body: 'Refund queue is processing automatically. Check the roster for individual statuses.',
      accentColor: '#EF4444',
      Icon: AlertCircle,
    };
  }

  if (event.status === 'completed') {
    return {
      kind: 'completed',
      title: 'Event wrapped',
      body: 'Mark no-shows in the roster so registration history stays clean.',
      accentColor: '#22C55E',
      Icon: CheckCircle,
    };
  }

  if (startsAt && hoursToGo > 0 && hoursToGo <= 24) {
    const timeLabel = startsAt.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
    });
    return {
      kind: 'starting_soon',
      title: hoursToGo < 2 ? 'Starts in under 2h' : `Today at ${timeLabel}`,
      body: `${event.capacity?.registeredCount ?? 0} attendees confirmed · share the link to fill last seats.`,
      cta: {
        label: 'Share link',
        onPress: () => copyShareLink(event._id),
      },
      accentColor: '#FF6B35',
      Icon: Clock,
    };
  }

  if (startsAt && hoursToGo > 24 && hoursToGo <= 48) {
    return {
      kind: 'upcoming_soon',
      title: 'In 2 days',
      body: `${Math.round(fillPct * 100)}% filled · final push to reach capacity.`,
      cta: {
        label: 'Share link',
        onPress: () => copyShareLink(event._id),
      },
      accentColor: '#F59E0B',
      Icon: Clock,
    };
  }

  if (fillPct >= CAPACITY_URGENCY_THRESHOLD && fillPct < 1) {
    return {
      kind: 'filling_up',
      title: 'Filling up',
      body: `${slotsLeft} seat${slotsLeft === 1 ? '' : 's'} left before sold-out.`,
      cta: {
        label: 'Share link',
        onPress: () => copyShareLink(event._id),
      },
      accentColor: '#F59E0B',
      Icon: Send,
    };
  }

  return {
    kind: null,
    title: '',
    body: '',
    accentColor: '#6B6878',
    Icon: Clock,
  };
}

export default function EventStickyCTA({ event }: { event: EventDoc }) {
  const state = useMemo(() => computeState(event), [event]);

  if (state.kind === null) return null;
  const { Icon } = state;

  return (
    <View
      style={[
        styles.container,
        { borderColor: hexAlpha(state.accentColor, 0.30), backgroundColor: hexAlpha(state.accentColor, 0.06) },
      ]}
      accessibilityRole="alert"
      accessibilityLabel={`${state.title}. ${state.body}`}
    >
      <View style={[styles.iconWrap, { backgroundColor: hexAlpha(state.accentColor, 0.18) }]}>
        <Icon size={18} color={state.accentColor} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: state.accentColor }]}>{state.title}</Text>
        <Text style={styles.bodyText}>{state.body}</Text>
      </View>
      {state.cta ? (
        <Pressable
          style={[styles.cta, { backgroundColor: state.accentColor }]}
          onPress={state.cta.onPress}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>{state.cta.label}</Text>
        </Pressable>
      ) : null}
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: 'Outfit-Bold',
    fontSize: 13,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  bodyText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: '#B8B1A6',
    lineHeight: 17,
    marginTop: 2,
  },
  cta: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  ctaText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 12,
    color: '#0A0A0F',
    letterSpacing: 0.3,
  },
});
