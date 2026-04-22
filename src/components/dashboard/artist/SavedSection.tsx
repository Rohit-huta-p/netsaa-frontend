/**
 * SavedSection — artist-home dashboard section for saved gigs + events.
 *
 * RESPONSIBILITIES
 * ----------------
 * 1. Render two tabs: "Gigs ({gigCount})" and "Events ({eventCount})" with
 *    live counts from useSavedItems (artistHome/).
 * 2. Show up to 5 compact preview rows for the active tab. Inline rows
 *    rather than reusing GigCard/EventCard — those cards are full-bleed
 *    marketing cards that would blow out the dashboard card's spacing.
 *    Per plan: "don't over-engineer".
 * 3. "See all" routes to /saved (existing route verified under app/(app)/).
 * 4. Per-tab empty state copy: "No saved {type} yet".
 *
 * Data hook: @/hooks/artistHome/useSavedItems — note the artistHome/
 * namespace (the shipped /saved screen uses a different wider hook at
 * @/hooks/useSavedItems with saved + applied + upcoming + history).
 */
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import SectionCard from '../SectionCard';
import { useSavedItems } from '@/hooks/artistHome/useSavedItems';

type Tab = 'gigs' | 'events';

interface SavedGigRow {
  _id?: string;
  id?: string;
  title?: string;
  organizerName?: string;
  organizer?: { name?: string };
  hirer?: { name?: string };
  eventDate?: string;
  startDate?: string;
  amount?: number;
  payAmount?: number;
  compensation?: { amount?: number };
}

interface SavedEventRow {
  _id?: string;
  id?: string;
  title?: string;
  startDate?: string;
  startsAt?: string;
  venue?: string;
  location?: string;
}

function formatDate(raw?: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatPay(g: SavedGigRow): string {
  const amount =
    g.amount ?? g.payAmount ?? g.compensation?.amount ?? undefined;
  if (!amount || amount <= 0) return '';
  return `Rs. ${amount.toLocaleString('en-IN')}`;
}

export default function SavedSection() {
  const [tab, setTab] = useState<Tab>('gigs');
  const router = useRouter();
  const { gigs, events, isLoading, error } = useSavedItems(5);

  const gigRows = useMemo(() => gigs as SavedGigRow[], [gigs]);
  const eventRows = useMemo(() => events as SavedEventRow[], [events]);

  const activeRows = tab === 'gigs' ? gigRows : eventRows;
  const isEmpty = !isLoading && !error && activeRows.length === 0;

  return (
    <SectionCard
      title="Saved"
      seeAllHref="/saved"
      isLoading={isLoading}
      error={(error as Error) ?? null}
    >
      <View style={styles.wrap}>
        <View style={styles.tabRow}>
          <TabButton
            label="Gigs"
            count={gigRows.length}
            active={tab === 'gigs'}
            onPress={() => setTab('gigs')}
          />
          <TabButton
            label="Events"
            count={eventRows.length}
            active={tab === 'events'}
            onPress={() => setTab('events')}
          />
        </View>

        {isEmpty ? (
          <View style={styles.emptyInline}>
            <Text style={styles.emptyText}>
              {tab === 'gigs' ? 'No saved gigs yet' : 'No saved events yet'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {tab === 'gigs'
              ? gigRows.slice(0, 5).map((g, idx) => {
                  const id = g._id ?? g.id ?? `gig-${idx}`;
                  const title = g.title ?? 'Untitled gig';
                  const hirer =
                    g.organizerName ??
                    g.organizer?.name ??
                    g.hirer?.name ??
                    'Hirer';
                  const date = formatDate(g.eventDate ?? g.startDate);
                  const pay = formatPay(g);
                  return (
                    <TouchableOpacity
                      key={id}
                      onPress={() =>
                        router.push({
                          pathname: '/(app)/gigs/[id]',
                          params: { id: String(id) },
                        })
                      }
                      style={styles.row}
                      accessibilityRole="button"
                      accessibilityLabel={`Saved gig: ${title}`}
                    >
                      <View style={styles.rowMain}>
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {title}
                        </Text>
                        <Text style={styles.rowMeta} numberOfLines={1}>
                          {hirer}
                          {date ? ` • ${date}` : ''}
                        </Text>
                      </View>
                      {pay ? <Text style={styles.rowRight}>{pay}</Text> : null}
                    </TouchableOpacity>
                  );
                })
              : eventRows.slice(0, 5).map((e, idx) => {
                  const id = e._id ?? e.id ?? `ev-${idx}`;
                  const title = e.title ?? 'Untitled event';
                  const date = formatDate(e.startDate ?? e.startsAt);
                  const venue = e.venue ?? e.location ?? '';
                  return (
                    <TouchableOpacity
                      key={id}
                      onPress={() =>
                        router.push({
                          pathname: '/(app)/events/[id]',
                          params: { id: String(id) },
                        })
                      }
                      style={styles.row}
                      accessibilityRole="button"
                      accessibilityLabel={`Saved event: ${title}`}
                    >
                      <View style={styles.rowMain}>
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {title}
                        </Text>
                        <Text style={styles.rowMeta} numberOfLines={1}>
                          {date ? date : ''}
                          {date && venue ? ' • ' : ''}
                          {venue}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
          </View>
        )}
      </View>
    </SectionCard>
  );
}

function TabButton({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label} tab, ${count} items${active ? ', selected' : ''}`}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
      <View style={[styles.badge, active && styles.badgeActive]}>
        <Text style={[styles.badgeText, active && styles.badgeTextActive]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: -4,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#1F1F23',
    borderWidth: 1,
    borderColor: '#26262C',
  },
  tabActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  tabText: {
    fontFamily: 'Outfit-Medium',
    fontSize: 12,
    color: '#A1A1AA',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  badge: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: '#26262C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  badgeText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 10,
    color: '#A1A1AA',
  },
  badgeTextActive: {
    color: '#FFFFFF',
  },
  list: {
    marginTop: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1F1F23',
  },
  rowMain: {
    flex: 1,
    paddingRight: 12,
  },
  rowTitle: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 14,
    color: '#F5F5F5',
  },
  rowMeta: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
  },
  rowRight: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 13,
    color: '#F59E0B',
  },
  emptyInline: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 14,
    color: '#71717A',
    textAlign: 'center',
  },
});
