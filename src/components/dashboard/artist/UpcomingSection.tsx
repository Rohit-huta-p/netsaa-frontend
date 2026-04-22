// netsa-mobile/src/components/dashboard/artist/UpcomingSection.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Briefcase, Calendar, MapPin } from 'lucide-react-native';
import SectionCard from '../SectionCard';
import useUpcoming, { UpcomingItem } from '@/hooks/useUpcoming';

/**
 * UpcomingSection — merged preview of hired gigs + event RSVPs sorted
 * ascending by date. Spec Task 14.
 *
 * Tabs: `This Week | This Month | Later`. Client-side filter against the
 * same `useUpcoming().data` list — no re-fetch per tab. Items without a
 * date are grouped into "Later" so the component never hides them.
 *
 * Renders an inline `UpcomingRow` (type icon + title + date + location /
 * counterparty) instead of reusing GigCard / EventCard — those cards are
 * ~1.5KB each of photo + chip chrome and would dwarf a dashboard preview.
 *
 * "See all" jumps to the artist-mode Gigs tab (/gigs). That route hosts
 * all hired/upcoming work today; when a dedicated Upcoming screen ships
 * we'll swap this href — call site is the only edit point.
 */

type RangeTab = 'week' | 'month' | 'later';

const TABS: { id: RangeTab; label: string }[] = [
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'later', label: 'Later' },
];

const EMPTY_COPY: Record<RangeTab, string> = {
  week: 'No upcoming gigs this week',
  month: 'No upcoming gigs this month',
  later: 'No gigs scheduled further out',
};

const MS_IN_DAY = 1000 * 60 * 60 * 24;

/**
 * Bucket an UpcomingItem into one of three range windows relative to now.
 * Undated items land in "later" so they surface somewhere.
 */
function bucketOf(item: UpcomingItem, nowMs: number): RangeTab {
  if (!item.date) return 'later';
  const t = new Date(item.date).getTime();
  if (Number.isNaN(t)) return 'later';
  const days = (t - nowMs) / MS_IN_DAY;
  if (days <= 7) return 'week';
  if (days <= 30) return 'month';
  return 'later';
}

function formatShortDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface UpcomingRowProps {
  item: UpcomingItem;
}

function UpcomingRow({ item }: UpcomingRowProps) {
  const Icon = item.type === 'event' ? Calendar : Briefcase;
  const href =
    item.type === 'event' ? `/events/${item.id}` : `/gigs/${item.id}`;
  const meta = [formatShortDate(item.date), item.location || item.counterparty]
    .filter((x): x is string => !!x)
    .join(' · ');

  return (
    <Link href={href as any} asChild>
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.75}
        accessibilityRole="link"
        accessibilityLabel={`${item.type === 'event' ? 'Event' : 'Gig'}: ${item.title}`}
      >
        <View style={styles.rowIconWrap}>
          <Icon size={16} color="#8B5CF6" strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {meta ? (
            <View style={styles.rowMetaRow}>
              {item.location ? (
                <MapPin size={10} color="#71717A" strokeWidth={1.8} />
              ) : null}
              <Text style={styles.rowMeta} numberOfLines={1}>
                {meta}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </Link>
  );
}

export default function UpcomingSection() {
  const { data, isLoading, error } = useUpcoming();
  const [tab, setTab] = useState<RangeTab>('week');

  const filtered = useMemo(() => {
    const now = Date.now();
    return (data ?? []).filter((item) => bucketOf(item, now) === tab);
  }, [data, tab]);

  return (
    <SectionCard
      title="Upcoming"
      seeAllHref="/gigs"
      isLoading={isLoading}
      error={(error as Error) ?? null}
    >
      <View style={styles.tabRow}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[styles.tabPill, active && styles.tabPillActive]}
              accessibilityRole="button"
              accessibilityLabel={`Filter: ${t.label}`}
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[styles.tabLabel, active && styles.tabLabelActive]}
                numberOfLines={1}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>{EMPTY_COPY[tab]}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filtered.map((item) => (
            <UpcomingRow key={`${item.type}-${item.id}`} item={item} />
          ))}
        </View>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1F1F23',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  tabPillActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  tabLabel: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: '#A1A1AA',
  },
  tabLabelActive: {
    fontFamily: 'Outfit-SemiBold',
    color: '#F5F5F5',
  },
  list: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  rowTitle: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 14,
    color: '#F5F5F5',
  },
  rowMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  rowMeta: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: '#A1A1AA',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: '#71717A',
  },
});
