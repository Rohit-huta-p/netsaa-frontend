/**
 * YourStageArtist — main stage section on artist home.
 *
 * Two-level navigation per locked mockup
 * (DOCS/04-design/mockups/artist-home-v1.html §4):
 *
 *   ┌─────────────────────────────────────┐
 *   │ GIGS · 4   EVENTS · 3               │  ← primary toggle
 *   ├─────────────────────────────────────┤
 *   │ Upcoming · 2   Active · 3   Saved   │  ← sub-tabs (when GIGS)
 *   │ Upcoming · 1   Saved · 2   Past · 1 │  ← sub-tabs (when EVENTS)
 *   └─────────────────────────────────────┘
 *
 * Each sub-section shows:
 *   - Upcoming: a hero "next up" card (when one exists) + smaller cards
 *   - Active: list of in-flight applications with status pills
 *   - Saved: list of bookmarked items
 *   - Past (events only): muted-treatment list with "rate organizer" CTA
 *
 * All sub-sections end with a dashed "View all → /gigs" or
 * "/events" link.
 *
 * Data:
 *   - useUpcoming     → confirmed gigs (type='gig') + registered events (type='event')
 *   - useApplications → active applications
 *   - useSavedItems   → saved gigs, saved events, past attended events
 *
 * State is fully local — sub-tab selection survives toggling stage
 * because each stage tracks its own active sub independently.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import useUpcoming, { UpcomingItem } from '@/hooks/useUpcoming';
import useApplications from '@/hooks/useApplications';
import { useSavedItems } from '@/hooks/useSavedItems';

type Stage = 'gigs' | 'events' | 'all';
type GigSub = 'booked' | 'applied' | 'saved';
type EventSub = 'registered' | 'saved' | 'past';
type AllSub = 'upcoming' | 'saved';

const PURPLE = '#8B5CF6';
const ORANGE = '#FF6B35';
const PAPER = '#F0ECE6';
const MUTED = '#8C857B';
const PAPER_DIM = '#C8C0B5';

const ACTIVE_APP_STATUSES = new Set([
    'applied',
    'shortlisted',
    'reviewed',
    'offered',
    'pending',
]);

// ─── Application state machine (Option B + dots, locked 2026-05-18) ───
// 4-step progression artist sees on home. "Offered" replaces "Approved"
// because the artist still has to accept — it conveys hirer intent +
// pending artist action. "Hired" is the terminal state where both sides
// confirmed; rows in that state move out of Active into Upcoming.
type AppState = 'applied' | 'reviewed' | 'shortlisted' | 'offered' | 'hired' | 'closed' | 'withdrawn';

const STATE_META: Record<AppState, { pill: string; tone: PillTone; subline: string; dotsFilled: number; active?: boolean }> = {
    applied: { pill: 'APPLIED', tone: 'muted', subline: 'waiting on review', dotsFilled: 1 },
    reviewed: { pill: 'REVIEWED', tone: 'purple', subline: "hirer's deciding", dotsFilled: 2 },
    shortlisted: { pill: 'SHORTLISTED', tone: 'gold', subline: 'waiting on offer', dotsFilled: 3 },
    offered: { pill: 'OFFERED', tone: 'green', subline: 'your decision', dotsFilled: 4, active: true },
    hired: { pill: 'HIRED', tone: 'green', subline: 'confirmed', dotsFilled: 4 },
    closed: { pill: 'CLOSED', tone: 'muted', subline: 'no go', dotsFilled: 0 },
    withdrawn: { pill: 'WITHDRAWN', tone: 'muted', subline: 'you pulled out', dotsFilled: 0 },
};

function normalizeAppState(raw: string): AppState {
    const s = raw.toLowerCase();
    if (s === 'applied') return 'applied';
    if (s === 'reviewed' || s === 'pending') return 'reviewed';
    if (s === 'shortlisted') return 'shortlisted';
    if (s === 'offered' || s === 'approved') return 'offered';
    if (s === 'hired') return 'hired';
    if (s === 'rejected' || s === 'declined' || s === 'closed') return 'closed';
    if (s === 'withdrawn') return 'withdrawn';
    return 'applied';
}

function safeArr(x: any): any[] {
    if (!x) return [];
    if (Array.isArray(x)) return x;
    if (Array.isArray(x.data)) return x.data;
    if (Array.isArray(x.items)) return x.items;
    return [];
}

function fmtShortDate(iso?: string | null): string {
    if (!iso) return 'TBD';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'TBD';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function fmtTime(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

function daysUntil(iso?: string | null): number | null {
    if (!iso) return null;
    const d = new Date(iso).getTime();
    if (Number.isNaN(d)) return null;
    return Math.round((d - Date.now()) / 86_400_000);
}

function fmtUntil(iso?: string | null): string {
    const d = daysUntil(iso);
    if (d === null) return '';
    if (d <= 0) return 'today';
    if (d === 1) return '1 day';
    return `${d} days`;
}

function fmtRupees(n?: number | null): string {
    if (n == null || !Number.isFinite(n) || n <= 0) return 'Free';
    if (n >= 100_000) return `₹${(n / 100_000).toFixed(n % 100_000 === 0 ? 0 : 1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
    return `₹${n.toLocaleString('en-IN')}`;
}

export default function YourStageArtist() {
    const router = useRouter();
    const [stage, setStage] = useState<Stage>('gigs');
    const [gigSub, setGigSub] = useState<GigSub>('booked');
    const [eventSub, setEventSub] = useState<EventSub>('registered');
    const [allSub, setAllSub] = useState<AllSub>('upcoming');

    const upcomingQ = useUpcoming();
    const appsQ = useApplications();
    const savedQ = useSavedItems();

    const buckets = useMemo(() => {
        const upcomingArr = safeArr((upcomingQ as any)?.data);
        const upcomingGigs: UpcomingItem[] = upcomingArr.filter(
            (u: any) => u?.type === 'gig',
        );
        const upcomingEvents: UpcomingItem[] = upcomingArr.filter(
            (u: any) => u?.type === 'event',
        );

        const apps = safeArr(appsQ.data);
        const activeApps = apps.filter((a: any) =>
            ACTIVE_APP_STATUSES.has(String(a?.status ?? '').toLowerCase()),
        );

        // useSavedItems returns a COMBINED `savedItems` (events + gigs, each
        // tagged with `type`) plus `historyItems` (past registrations). Split
        // them into the buckets the panels need. The old `savedEvents`/`savedGigs`/
        // `pastEvents` keys never existed on the hook → Saved was always empty.
        const saved = savedQ as any;
        const allSaved = safeArr(saved?.savedItems);
        const savedGigs = allSaved.filter((it: any) => it?.type === 'GIG');
        const savedEvents = allSaved.filter((it: any) => it?.type === 'EVENT');
        const pastEvents = safeArr(saved?.historyItems);

        return {
            upcomingGigs,
            upcomingEvents,
            activeApps,
            savedGigs,
            savedEvents,
            pastEvents,
            // ALL — merged across gigs + events (upcoming sorted soonest-first).
            allUpcoming: [...upcomingGigs, ...upcomingEvents].sort(
                (a: any, b: any) => new Date(a?.date ?? 0).getTime() - new Date(b?.date ?? 0).getTime(),
            ),
            allSaved: [...savedGigs, ...savedEvents],
        };
    }, [upcomingQ, appsQ.data, savedQ]);

    const gigsTotal =
        buckets.upcomingGigs.length +
        buckets.activeApps.length +
        buckets.savedGigs.length;
    const eventsTotal =
        buckets.upcomingEvents.length +
        buckets.savedEvents.length +
        buckets.pastEvents.length;
    const allTotal = buckets.allUpcoming.length + buckets.allSaved.length;

    return (
        <View style={styles.root}>
            {/* Eyebrow + title */}
            <Text style={styles.eyebrow}>YOUR STAGE</Text>
            <Text style={styles.title}>What you're in.</Text>

            {/* Primary toggle */}
            <View style={styles.stageTabs}>
                <StageTab
                    label="ALL"
                    count={allTotal}
                    active={stage === 'all'}
                    onPress={() => setStage('all')}
                />
                <StageTab
                    label="GIGS"
                    count={gigsTotal}
                    active={stage === 'gigs'}
                    onPress={() => setStage('gigs')}
                />
                <StageTab
                    label="EVENTS"
                    count={eventsTotal}
                    active={stage === 'events'}
                    onPress={() => setStage('events')}
                />
            </View>

            {/* Stage panels */}
            {stage === 'gigs' ? (
                <GigsPanel
                    sub={gigSub}
                    setSub={setGigSub}
                    upcoming={buckets.upcomingGigs}
                    active={buckets.activeApps}
                    saved={buckets.savedGigs}
                    onViewAll={() => router.push('/gigs' as any)}
                />
            ) : stage === 'events' ? (
                <EventsPanel
                    sub={eventSub}
                    setSub={setEventSub}
                    upcoming={buckets.upcomingEvents}
                    saved={buckets.savedEvents}
                    past={buckets.pastEvents}
                    onViewAll={() => router.push('/events' as any)}
                />
            ) : (
                <AllPanel
                    sub={allSub}
                    setSub={setAllSub}
                    upcoming={buckets.allUpcoming}
                    saved={buckets.allSaved}
                />
            )}
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────────────
function StageTab({
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
        <Pressable
            onPress={onPress}
            style={[styles.stageTab, active && styles.stageTabActive]}
        >
            <Text
                style={[styles.stageTabText, active && styles.stageTabTextActive]}
            >
                {label} · {count}
            </Text>
        </Pressable>
    );
}

function SubTab({
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
        <Pressable onPress={onPress} style={styles.subTab}>
            <Text style={[styles.subTabText, active && styles.subTabTextActive]}>
                {label}
            </Text>
            <View
                style={[styles.subCount, active && styles.subCountActive]}
            >
                <Text
                    style={[
                        styles.subCountText,
                        active && styles.subCountTextActive,
                    ]}
                >
                    {count}
                </Text>
            </View>
            {active ? <View style={styles.subTabUnderline} /> : null}
        </Pressable>
    );
}

// ─────────────────────────────────────────────────────────────────────
// Panels
// ─────────────────────────────────────────────────────────────────────
function GigsPanel({
    sub,
    setSub,
    upcoming,
    active,
    saved,
    onViewAll,
}: {
    sub: GigSub;
    setSub: (s: GigSub) => void;
    upcoming: UpcomingItem[];
    active: any[];
    saved: any[];
    onViewAll: () => void;
}) {
    return (
        <View>
            <View style={styles.subTabs}>
                <SubTab label="BOOKED" count={upcoming.length} active={sub === 'booked'} onPress={() => setSub('booked')} />
                <SubTab label="APPLIED" count={active.length} active={sub === 'applied'} onPress={() => setSub('applied')} />
                <SubTab label="SAVED" count={saved.length} active={sub === 'saved'} onPress={() => setSub('saved')} />
            </View>

            {sub === 'booked' ? (
                <UpcomingList items={upcoming} kind="gig" onViewAll={onViewAll} />
            ) : sub === 'applied' ? (
                <ActiveAppsList items={active} onViewAll={onViewAll} />
            ) : (
                <SavedList items={saved} kind="gig" onViewAll={onViewAll} />
            )}
        </View>
    );
}

function EventsPanel({
    sub,
    setSub,
    upcoming,
    saved,
    past,
    onViewAll,
}: {
    sub: EventSub;
    setSub: (s: EventSub) => void;
    upcoming: UpcomingItem[];
    saved: any[];
    past: any[];
    onViewAll: () => void;
}) {
    return (
        <View>
            <View style={styles.subTabs}>
                <SubTab label="REGISTERED" count={upcoming.length} active={sub === 'registered'} onPress={() => setSub('registered')} />
                <SubTab label="SAVED" count={saved.length} active={sub === 'saved'} onPress={() => setSub('saved')} />
                <SubTab label="PAST" count={past.length} active={sub === 'past'} onPress={() => setSub('past')} />
            </View>

            {sub === 'registered' ? (
                <UpcomingList items={upcoming} kind="event" onViewAll={onViewAll} />
            ) : sub === 'saved' ? (
                <SavedList items={saved} kind="event" onViewAll={onViewAll} />
            ) : (
                <PastList items={past} onViewAll={onViewAll} />
            )}
        </View>
    );
}

function AllPanel({
    sub,
    setSub,
    upcoming,
    saved,
}: {
    sub: AllSub;
    setSub: (s: AllSub) => void;
    upcoming: any[];
    saved: any[];
}) {
    return (
        <View>
            <View style={styles.subTabs}>
                <SubTab label="UPCOMING" count={upcoming.length} active={sub === 'upcoming'} onPress={() => setSub('upcoming')} />
                <SubTab label="SAVED" count={saved.length} active={sub === 'saved'} onPress={() => setSub('saved')} />
            </View>

            {sub === 'upcoming' ? (
                <MergedList items={upcoming} empty="Nothing on your calendar yet — apply to gigs or RSVP to events." />
            ) : (
                <MergedList items={saved} empty="Nothing saved yet — bookmark gigs and events to see them here." />
            )}
        </View>
    );
}

/** Merged gigs + events list — routes each row per its own `type`. */
function MergedList({ items, empty }: { items: any[]; empty: string }) {
    const router = useRouter();
    if (!items || items.length === 0) {
        return <EmptySlot copy={empty} onViewAll={() => router.push('/events' as any)} label="Browse events" />;
    }
    return (
        <View>
            {items.map((it: any, i: number) => {
                const isEvent = it?.type === 'event' || it?.type === 'EVENT';
                const id = it?.id ?? it?._id;
                const priceNum = it?.payRupees ?? it?.pricing?.amount;
                return (
                    <ItemRow
                        key={`${it?.type}-${id ?? i}`}
                        title={it?.title ?? 'Untitled'}
                        pill={{ label: isEvent ? 'Event' : 'Gig', tone: isEvent ? 'purple' : 'green' }}
                        metaLeft={[it?.location, it?.date ? fmtShortDate(it.date) : null].filter(Boolean).join(' · ')}
                        rightTop={typeof priceNum === 'number' ? fmtRupees(priceNum) : ''}
                        rightBottom={it?.date ? fmtUntil(it.date) : ''}
                        onPress={() => id && router.push((isEvent ? `/events/${id}` : `/gigs/${id}`) as any)}
                    />
                );
            })}
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────
// Lists
// ─────────────────────────────────────────────────────────────────────
function UpcomingList({
    items,
    kind,
    onViewAll,
}: {
    items: UpcomingItem[];
    kind: 'gig' | 'event';
    onViewAll: () => void;
}) {
    const router = useRouter();
    if (items.length === 0) {
        return (
            <EmptySlot
                copy={
                    kind === 'gig'
                        ? 'No upcoming gigs yet. Apply to start filling your stage.'
                        : 'No upcoming events. Browse what\'s happening near you.'
                }
                onViewAll={onViewAll}
                label={kind === 'gig' ? 'Browse gigs' : 'Browse events'}
            />
        );
    }

    const [hero, ...rest] = items;

    return (
        <View>
            {/* Hero next-up card */}
            <Pressable
                onPress={() =>
                    router.push((kind === 'gig' ? `/gigs/${hero.id}` : `/events/${hero.id}`) as any)
                }
                style={styles.heroCard}
            >
                <Text style={styles.heroTag}>
                    ▸ NEXT {kind.toUpperCase()}
                    {hero.date ? ` · ${fmtUntil(hero.date).toUpperCase()}` : ''}
                </Text>
                <Text style={styles.heroTitle} numberOfLines={2}>
                    {hero.title}
                </Text>
                <Text style={styles.heroMeta} numberOfLines={1}>
                    {fmtShortDate(hero.date)}
                    {hero.date ? ` · ${fmtTime(hero.date)}` : ''}
                    {hero.location ? ` · ${hero.location}` : ''}
                </Text>
                <View style={styles.heroFooter}>
                    <Text
                        style={[
                            styles.heroPay,
                            // Free events display in green at a smaller size to
                            // distinguish "$0 paid event" (a real number)
                            // from "no ticket price required".
                            kind === 'event' && (!hero.payRupees || hero.payRupees <= 0) && styles.heroPayFree,
                        ]}
                    >
                        {kind === 'event'
                            ? hero.payRupees && hero.payRupees > 0
                                ? fmtRupees(hero.payRupees)
                                : 'Free RSVP'
                            : hero.payRupees != null
                                ? fmtRupees(hero.payRupees)
                                : '—'}
                    </Text>
                    <View style={styles.heroCta}>
                        <Text style={styles.heroCtaText}>
                            {kind === 'event' ? 'VIEW TICKET' : 'VIEW BRIEF'}
                        </Text>
                    </View>
                </View>
            </Pressable>

            {/* Smaller follow-up cards */}
            {rest.map((it) => (
                <ItemRow
                    key={it.id}
                    title={it.title}
                    metaLeft={`${it.location ?? 'TBD'} · ${fmtShortDate(it.date)}`}
                    pill={kind === 'gig' ? { label: 'Hired', tone: 'green' } : undefined}
                    rightTop={
                        kind === 'gig'
                            ? it.payRupees != null ? fmtRupees(it.payRupees) : '—'
                            : it.payRupees && it.payRupees > 0
                                ? fmtRupees(it.payRupees)
                                : 'Free'
                    }
                    rightBottom={fmtUntil(it.date)}
                    onPress={() =>
                        router.push((kind === 'gig' ? `/gigs/${it.id}` : `/events/${it.id}`) as any)
                    }
                />
            ))}

            <ViewAllLink onPress={onViewAll} kind={kind} />
        </View>
    );
}

function ActiveAppsList({
    items,
    onViewAll,
}: {
    items: any[];
    onViewAll: () => void;
}) {
    const router = useRouter();
    if (items.length === 0) {
        return (
            <EmptySlot
                copy="No active applications. Submit one and it lands here."
                onViewAll={onViewAll}
                label="Browse gigs"
            />
        );
    }

    return (
        <View>
            {items.map((a, i) => {
                const state = normalizeAppState(String(a?.status ?? 'applied'));
                const meta = STATE_META[state];
                const pay = fmtRupees(a?.gig?.payRupees ?? a?.payRupees);
                const isOffered = state === 'offered';
                const replyBy =
                    a?.offerExpiresAt ? `Reply by ${new Date(a.offerExpiresAt).toLocaleDateString('en-IN', { weekday: 'short' })}`
                        : a?.appliedAt ? fmtUntil(a.appliedAt) + ' ago'
                            : '';

                return (
                    <ItemRow
                        key={a?._id ?? a?.id ?? i}
                        title={a?.gig?.title ?? a?.gigTitle ?? 'Application'}
                        pill={{ label: meta.pill, tone: meta.tone }}
                        subline={
                            isOffered
                                ? `${meta.subline} · ${pay}`
                                : meta.subline
                        }
                        dotsFilled={meta.dotsFilled}
                        rightTop={isOffered ? undefined : pay}
                        rightBottom={isOffered ? replyBy : (a?.appliedAt ? fmtUntil(a.appliedAt) + ' ago' : '')}
                        actionCta={
                            isOffered
                                ? {
                                    label: 'Accept ▸',
                                    onPress: () =>
                                        router.push(`/gigs/${a?.gigId ?? a?.gig?._id ?? ''}` as any),
                                }
                                : undefined
                        }
                        onPress={() => router.push(`/gigs/${a?.gigId ?? a?.gig?._id ?? ''}` as any)}
                    />
                );
            })}
            <ViewAllLink onPress={onViewAll} kind="gig" />
        </View>
    );
}

function SavedList({
    items,
    kind,
    onViewAll,
}: {
    items: any[];
    kind: 'gig' | 'event';
    onViewAll: () => void;
}) {
    const router = useRouter();
    if (items.length === 0) {
        return (
            <EmptySlot
                copy={
                    kind === 'gig'
                        ? 'No saved gigs. Bookmark the ones worth revisiting.'
                        : 'No saved events. Bookmark to come back later.'
                }
                onViewAll={onViewAll}
                label={kind === 'gig' ? 'Browse gigs' : 'Browse events'}
            />
        );
    }

    return (
        <View>
            {items.map((it, i) => (
                <ItemRow
                    key={it?._id ?? it?.id ?? i}
                    title={it?.title ?? it?.name ?? 'Saved item'}
                    pill={{ label: 'Saved', tone: 'muted' }}
                    metaLeft={it?.location ?? it?.city ?? ''}
                    rightTop={kind === 'event' ? (it?.pricing?.amount ? fmtRupees(it.pricing.amount) : 'Free') : fmtRupees(it?.payRupees)}
                    rightBottom={fmtUntil(it?.startsAt ?? it?.date) || ''}
                    onPress={() =>
                        router.push((kind === 'gig' ? `/gigs/${it?._id ?? ''}` : `/events/${it?._id ?? ''}`) as any)
                    }
                />
            ))}
            <ViewAllLink onPress={onViewAll} kind={kind} />
        </View>
    );
}

function PastList({
    items,
    onViewAll,
}: {
    items: any[];
    onViewAll: () => void;
}) {
    const router = useRouter();
    if (items.length === 0) {
        return (
            <EmptySlot
                copy="No past events yet. Attended events show up here so you can rate the organizer."
                onViewAll={onViewAll}
                label="Browse events"
            />
        );
    }

    return (
        <View>
            {items.map((it, i) => (
                <ItemRow
                    key={it?._id ?? it?.id ?? i}
                    title={it?.title ?? 'Past event'}
                    pill={{ label: 'Attended', tone: 'muted' }}
                    metaLeft={it?.location ?? ''}
                    rightTop="RATE"
                    rightBottom="organizer"
                    muted
                    onPress={() => router.push(`/events/${it?._id ?? ''}` as any)}
                />
            ))}
            <ViewAllLink onPress={onViewAll} kind="event" />
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────────────────────────────
type PillTone = 'muted' | 'gold' | 'purple' | 'green';

const PILL_STYLES: Record<PillTone, { bg: string; color: string }> = {
    muted: { bg: 'rgba(255,255,255,0.04)', color: PAPER_DIM },
    gold: { bg: 'rgba(245,158,11,0.10)', color: '#F59E0B' },
    purple: { bg: 'rgba(139,92,246,0.12)', color: PURPLE },
    green: { bg: 'rgba(34,197,94,0.10)', color: '#22C55E' },
};

function ItemRow({
    title,
    metaLeft,
    pill,
    subline,
    dotsFilled,
    rightTop,
    rightBottom,
    actionCta,
    muted,
    onPress,
}: {
    title: string;
    metaLeft?: string;
    pill?: { label: string; tone: PillTone };
    /** Optional second meta line — used by Active applications for state-machine hint. */
    subline?: string;
    /** Optional 4-dot progress indicator. 0-4 dots filled. Active states show the
     *  last dot purple-bordered to signal "waiting on you". */
    dotsFilled?: number;
    rightTop?: string;
    rightBottom?: string;
    actionCta?: { label: string; onPress: () => void };
    muted?: boolean;
    onPress?: () => void;
}) {
    const thumbInitial = (title?.[0] ?? '?').toUpperCase();
    const dotColor = pill ? PILL_STYLES[pill.tone].color : ORANGE;
    return (
        <Pressable onPress={onPress} style={styles.itemCard}>
            <View
                style={[
                    styles.itemThumb,
                    muted && { opacity: 0.55 },
                ]}
            >
                <Text style={styles.itemThumbText}>{thumbInitial}</Text>
            </View>

            <View style={styles.itemBody}>
                <Text
                    style={[styles.itemTitle, muted && { color: PAPER_DIM }]}
                    numberOfLines={1}
                >
                    {title}
                </Text>
                <View style={styles.itemMetaRow}>
                    {pill ? (
                        <View
                            style={[
                                styles.itemPill,
                                { backgroundColor: PILL_STYLES[pill.tone].bg },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.itemPillText,
                                    { color: PILL_STYLES[pill.tone].color },
                                ]}
                            >
                                {pill.label.toUpperCase()}
                            </Text>
                        </View>
                    ) : null}
                    {subline ? (
                        <Text style={styles.itemSubline} numberOfLines={1}>
                            {subline}
                        </Text>
                    ) : metaLeft ? (
                        <Text style={styles.itemMetaText} numberOfLines={1}>
                            {metaLeft}
                        </Text>
                    ) : null}
                </View>
                {typeof dotsFilled === 'number' ? (
                    <View style={styles.dotsRow}>
                        {[0, 1, 2, 3].map((i) => (
                            <View
                                key={i}
                                style={[
                                    styles.dot,
                                    i < dotsFilled
                                        ? { backgroundColor: dotColor, opacity: 1 }
                                        : { backgroundColor: 'rgba(255,255,255,0.10)' },
                                    i < 3 ? styles.dotConnector : null,
                                ]}
                            />
                        ))}
                    </View>
                ) : null}
            </View>

            <View style={styles.itemSide}>
                {actionCta ? (
                    <Pressable onPress={actionCta.onPress} style={styles.actionCta}>
                        <Text style={styles.actionCtaText}>{actionCta.label}</Text>
                    </Pressable>
                ) : rightTop ? (
                    <Text style={styles.itemSidePrimary}>{rightTop}</Text>
                ) : null}
                {rightBottom ? (
                    <Text style={styles.itemSideSub}>{rightBottom}</Text>
                ) : null}
            </View>
        </Pressable>
    );
}

function ViewAllLink({ onPress, kind }: { onPress: () => void; kind: 'gig' | 'event' }) {
    return (
        <Pressable onPress={onPress} style={styles.viewAll}>
            <Text style={styles.viewAllText}>
                VIEW ALL {kind === 'gig' ? 'GIGS' : 'EVENTS'} →
            </Text>
        </Pressable>
    );
}

function EmptySlot({
    copy,
    onViewAll,
    label,
}: {
    copy: string;
    onViewAll: () => void;
    label: string;
}) {
    return (
        <View style={styles.empty}>
            <Text style={styles.emptyCopy}>{copy}</Text>
            <Pressable onPress={onViewAll} style={styles.emptyCta}>
                <Text style={styles.emptyCtaText}>{label.toUpperCase()} →</Text>
            </Pressable>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        paddingHorizontal: 24,
        marginTop: 30, // consistent ~36px section rhythm (grid mb 6 + this)
    },
    eyebrow: {
        fontFamily: 'Outfit-Bold',
        fontSize: 11,
        letterSpacing: 1.7,
        textTransform: 'uppercase',
        color: '#C8C0B5',
        marginBottom: 8,
    },
    title: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 28,
        letterSpacing: -0.8,
        color: PAPER,
        marginBottom: 14,
    },

    // Stage tabs (primary) — v3 white-fill active signature
    stageTabs: {
        flexDirection: 'row',
        gap: 7,
        marginBottom: 16,
        alignSelf: 'flex-start',
    },
    stageTab: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
    },
    stageTabActive: { backgroundColor: PAPER, borderColor: PAPER },
    stageTabText: {
        fontFamily: 'SpaceMono-Regular',
        fontSize: 10,
        letterSpacing: 1.5,
        color: MUTED,
    },
    stageTabTextActive: { color: '#1A0D06', fontFamily: 'Outfit-SemiBold' },

    // Sub-tabs (secondary)
    subTabs: {
        flexDirection: 'row',
        gap: 22,
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    subTab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingTop: 10,
        paddingBottom: 12,
        position: 'relative',
    },
    subTabText: {
        fontFamily: 'SpaceMono-Regular',
        fontSize: 10,
        letterSpacing: 1.5,
        color: MUTED,
    },
    subTabTextActive: { color: PAPER },
    subCount: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    subCountActive: { backgroundColor: 'rgba(255,107,53,0.18)' },
    subCountText: { fontSize: 9, color: PAPER_DIM, fontFamily: 'Outfit-Regular' },
    subCountTextActive: { color: ORANGE, fontFamily: 'Outfit-Bold' },
    subTabUnderline: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: -1,
        height: 1.5,
        backgroundColor: ORANGE,
    },

    // Hero card
    heroCard: {
        backgroundColor: '#14111B',
        borderColor: 'rgba(255,107,53,0.20)',
        borderWidth: 1,
        borderRadius: 22,
        padding: 22,
        marginBottom: 12,
        overflow: 'hidden',
    },
    heroTag: {
        fontFamily: 'SpaceMono-Regular',
        fontSize: 9,
        letterSpacing: 1.8,
        color: ORANGE,
        marginBottom: 8,
    },
    heroTitle: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 22,
        letterSpacing: -0.5,
        lineHeight: 26,
        color: PAPER,
        marginBottom: 8,
    },
    heroMeta: {
        fontFamily: 'Outfit-Regular',
        fontSize: 12,
        color: PAPER_DIM,
        marginBottom: 14,
    },
    heroFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    heroPay: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 18,
        color: PAPER,
        marginRight: 'auto',
        letterSpacing: -0.3,
    },
    heroPayFree: {
        color: '#22C55E',
        fontSize: 15,
    },
    heroCta: {
        backgroundColor: ORANGE,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 999,
    },
    heroCtaText: {
        fontFamily: 'Outfit-Bold',
        fontSize: 10,
        letterSpacing: 1.5,
        color: '#1A0D06',
    },

    // Item cards
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(255,255,255,0.10)',
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
    },
    itemThumb: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: 'rgba(255,107,53,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemThumbText: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 18,
        color: ORANGE,
    },
    itemBody: { flex: 1, minWidth: 0 },
    itemTitle: {
        fontFamily: 'Outfit-Regular',
        fontSize: 14,
        color: PAPER,
        marginBottom: 3,
    },
    itemMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    itemPill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
    },
    itemPillText: {
        fontFamily: 'Outfit-Bold',
        fontSize: 9,
        letterSpacing: 1,
    },
    itemMetaText: {
        flex: 1,
        fontFamily: 'Outfit-Regular',
        fontSize: 11,
        color: MUTED,
    },
    itemSubline: {
        flex: 1,
        fontFamily: 'DMSerifDisplay_400Regular',
        fontStyle: 'italic',
        fontSize: 11,
        color: PAPER_DIM,
    },

    // 4-dot progress strip for application state
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginRight: 24,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dotConnector: {
        // Dots are 8px wide. Connector becomes the gap visual via flex layout
        // — applied as marginRight on every dot except the last so the spacing
        // reads as a continuous progress bar.
        marginRight: 18,
    },

    // Action CTA chip (Offered state)
    actionCta: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: '#22C55E',
    },
    actionCtaText: {
        fontFamily: 'Outfit-Bold',
        fontSize: 11,
        letterSpacing: 0.5,
        color: '#0A0A0F',
    },
    itemSide: { alignItems: 'flex-end' },
    itemSidePrimary: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 14,
        color: PAPER,
        letterSpacing: -0.3,
    },
    itemSideSub: {
        fontFamily: 'SpaceMono-Regular',
        fontSize: 9,
        letterSpacing: 1,
        color: PAPER_DIM,
        marginTop: 2,
    },

    // View all link
    viewAll: {
        marginTop: 14,
        padding: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.09)',
        borderRadius: 14,
        alignItems: 'center',
    },
    viewAllText: {
        fontFamily: 'SpaceMono-Regular',
        fontSize: 10,
        letterSpacing: 1.5,
        color: ORANGE,
    },

    // Empty slot — no card; just the text + a plain link (per "keep the text").
    empty: {
        paddingVertical: 22,
        paddingHorizontal: 8,
        alignItems: 'center',
        marginBottom: 8,
    },
    emptyCopy: {
        fontFamily: 'Outfit-Regular',
        fontSize: 13,
        color: PAPER_DIM,
        textAlign: 'center',
        marginBottom: 10,
        lineHeight: 18,
    },
    emptyCta: {
        marginTop: 2,
    },
    emptyCtaText: {
        fontFamily: 'SpaceMono-Regular',
        fontSize: 10,
        letterSpacing: 1.5,
        color: ORANGE,
    },
});
