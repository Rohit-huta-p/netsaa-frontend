// src/components/requirements/RequirementsFeedList.tsx
// Self-contained "Find work" feed of open client requirements. Reused by:
//   • the Creative-Lead "Apply" route (app/(app)/requirements/index.tsx)
//   • the agency-supplier "Find Work" bottom-nav tab (BottomNav → AGENCY_TABS)
// Both surfaces hit the same `requirementService.feed()` endpoint, which the
// backend authorizes for Creative Leads and agency-flagged clients (Part C).
// Each card navigates to the shared requirement detail at /(app)/requirements/{id}.
//
// The header mirrors the Events discovery page (app/(app)/events/index.tsx): ambient
// glow blobs, a kicker + inbox pill, a big font-black headline, an italic subhead,
// a search · filter · sort row (sort via the shared SortDropdown) and category pills —
// all in the FlatList's ListHeaderComponent so it scrolls away with the feed. Kept in
// the brand's orange skin (not the events' rose) to match the Ink cards below. Cards
// are the finalized "Ink · green-strip-only" design.

import { useState } from 'react';
import {
    View,
    Text,
    Pressable,
    TextInput,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Calendar, Zap, Search, Filter, Mail, ArrowUpDown } from 'lucide-react-native';
import {
    requirementService,
    RequirementFilters,
    EMPTY_REQ_FILTERS,
    activeReqFilterCount,
} from '@/services/requirementService';
import { inviteService } from '@/services/inviteService';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';
import { RequirementFilterSheet } from '@/components/requirements/RequirementFilterSheet';
import { SortDropdown } from '@/components/ui/SortDropdown';

// Compact budget for the card foot (e.g. ₹40K–60K) — mirrors compactBudget in requirements/[id].tsx.
const kfmt = (n: number) =>
    n >= 100000 ? `${(n / 100000).toFixed(n % 100000 ? 1 : 0)}L` : `${Math.round(n / 1000)}K`;
const compactBudget = (min?: number | null, max?: number | null): string => {
    if (min != null && max != null) return `₹${kfmt(min)}–${kfmt(max)}`;
    if (max != null) return `Up to ₹${kfmt(max)}`;
    if (min != null) return `₹${kfmt(min)}+`;
    return 'Budget open';
};

// Proposal cap — mirrors PROPOSAL_CAP in gigs-service/src/models/Requirement.ts.
const PROPOSAL_CAP = 5;

// Business type → gold chip label. Individuals get no chip (matches requirements/[id].tsx).
const HIRER_LABEL: Record<string, string> = {
    corporate: 'Company',
    agency: 'Agency',
    institution: 'Venue',
};

// Relative post age (matches requirements/[id].tsx). '' when unknown.
function timeAgo(iso?: string): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (isNaN(then)) return '';
    const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return `${Math.floor(d / 30)}mo ago`;
}

// Competition from proposalCount: wide-open (0 pitches) earns the scarce green
// strip; everything else shows quiet inline contention. Cap-full falls back to muted.
type Competition = { wideOpen: boolean; label: string; tone: 'hot' | 'mid' };
function competition(proposalCount: number): Competition {
    const left = PROPOSAL_CAP - proposalCount;
    if (proposalCount <= 0) return { wideOpen: true, label: '', tone: 'mid' };
    if (left <= 0) return { wideOpen: false, label: 'Slots full', tone: 'mid' };
    if (left === 1) return { wideOpen: false, label: 'Filling · 1 slot left', tone: 'hot' };
    return { wideOpen: false, label: `${proposalCount} of ${PROPOSAL_CAP} proposed`, tone: 'mid' };
}

// Sort options for the shared dropdown → map onto requirementService feed `sort`.
const REQ_SORT_OPTIONS = [
    { value: 'newest', label: 'Newest' },
    { value: 'budget', label: 'Budget' },
    { value: 'event', label: 'Date' },
];

// Category lenses (parallels EVENT_CATEGORIES). Wired to the occasion filter; exact
// matching depends on the backend occasion facet — same caveat as the events page.
const OCCASION_CATEGORIES = ['All briefs', 'Weddings', 'Corporate', 'College', 'Venues', 'Festivals'];

export default function RequirementsFeedList() {
    const router = useRouter();
    const navClearance = (useMobileTabBarHeight() || 64) + 56;

    const [q, setQ] = useState('');
    const [filters, setFilters] = useState<RequirementFilters>(EMPTY_REQ_FILTERS);
    const [filterOpen, setFilterOpen] = useState(false);
    const [showSort, setShowSort] = useState(false);

    // Debounce the search text into the query key so each keystroke doesn't fire a request.
    const debouncedQ = useDebouncedValue(q, 300);

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['requirements', 'feed', debouncedQ, filters],
        queryFn: () => requirementService.feed({ q: debouncedQ, filters }),
    });
    const requirements = data?.requirements ?? [];

    // Received invites badge — pending (sent|viewed) invitations sent to me by
    // clients. Mirrors the artist-home count; the inbox pill opens the inbox.
    const { data: receivedInvites = [] } = useQuery({
        queryKey: ['invites', 'received'],
        queryFn: inviteService.received,
        staleTime: 60_000,
        retry: false,
    });
    const pendingInviteCount = (receivedInvites as any[]).filter(
        (inv) => inv.status === 'sent' || inv.status === 'viewed',
    ).length;

    const hasFilters = activeReqFilterCount(filters) > 0;
    const sortActive = filters.sort !== 'newest';

    // Category pills drive the occasion facet (empty = "All briefs").
    const activeCategory = filters.occasions[0] || 'All briefs';
    const pressCategory = (cat: string) =>
        setFilters((f) => ({ ...f, occasions: cat === 'All briefs' ? [] : [cat] }));

    return (
        <View className="flex-1 bg-black">
            {/* Ambient warm glow — echoes the events discovery page */}
            <View
                pointerEvents="none"
                className="absolute top-[8%] -left-[15%] w-[600px] h-[600px] bg-[#FF6B35]/10 rounded-full opacity-60 blur-3xl"
            />
            <View
                pointerEvents="none"
                className="absolute bottom-[12%] -right-[12%] w-[500px] h-[500px] bg-[#F59E0B]/10 rounded-full opacity-40 blur-3xl"
            />

            <SafeAreaView className="flex-1" edges={['top']}>
                <FlatList
                    data={requirements as any[]}
                    keyExtractor={(r: any) => r._id}
                    contentContainerStyle={{
                        paddingHorizontal: 24,
                        paddingTop: 24,
                        paddingBottom: navClearance,
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#FF6B35" />
                    }
                    ListEmptyComponent={
                        isLoading ? (
                            <ActivityIndicator color="#FF6B35" style={{ marginTop: 48 }} />
                        ) : (
                            <Text
                                style={{ fontFamily: 'Outfit-Regular' }}
                                className="text-zinc-500 text-[13px] text-center mt-10"
                            >
                                {q || hasFilters
                                    ? 'No requirements match these filters. Try widening your search.'
                                    : 'No open requirements right now. New ones appear here the moment clients post.'}
                            </Text>
                        )
                    }
                    ListHeaderComponent={
                        <View className="mb-2">
                            {/* ── Editorial hero ── */}
                            <View className="mb-10">
                                <View className="flex-row items-center justify-between mb-8">
                                    <View className="self-start bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
                                        <Text
                                            style={{ fontFamily: 'Outfit-Bold' }}
                                            className="text-zinc-400 text-[10px] uppercase tracking-[0.3em]"
                                        >
                                            The Brief Board
                                        </Text>
                                    </View>

                                    {/* Inbox pill — opens the recipient inbox; badge = pending */}
                                    <TouchableOpacity
                                        onPress={() => router.push('/(app)/invites' as any)}
                                        accessibilityLabel="invites"
                                        hitSlop={8}
                                        className="flex-row items-center gap-1.5 px-4 py-2 rounded-full bg-[#FF6B35]"
                                    >
                                        <Mail size={14} color="#1A0D06" />
                                        <Text
                                            style={{ fontFamily: 'Outfit-ExtraBold' }}
                                            className="text-[#1A0D06] text-xs uppercase tracking-widest"
                                        >
                                            Inbox
                                        </Text>
                                        {pendingInviteCount > 0 && (
                                            <View className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#22C55E] border-2 border-black items-center justify-center">
                                                <Text
                                                    style={{ fontFamily: 'Outfit-Bold' }}
                                                    className="text-[#04210f] text-[8px]"
                                                >
                                                    {pendingInviteCount > 9 ? '9+' : String(pendingInviteCount)}
                                                </Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                {/* Headline — font-black, tight uppercase; second line brand-orange */}
                                <Text className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9] mb-3">
                                    FIND YOUR
                                </Text>
                                <Text className="text-5xl md:text-7xl font-black text-[#FF6B35] tracking-tighter leading-[0.9] mb-5">
                                    NEXT STAGE.
                                </Text>
                                <Text className="text-lg text-zinc-400 font-light italic leading-relaxed">
                                    From intimate sangeets to corporate mainstages. Live briefs from
                                    clients across India — pitch for the ones worth your craft.
                                </Text>
                            </View>

                            {/* Search · filter · sort */}
                            <View className="flex-row gap-3" style={{ position: 'relative', zIndex: 40 }}>
                                <View className="relative h-14 bg-zinc-900/50 border border-white/5 rounded-2xl flex-row items-center px-4 flex-1">
                                    <Search size={20} color="#71717a" />
                                    <TextInput
                                        value={q}
                                        onChangeText={setQ}
                                        placeholder="Search briefs, cities…"
                                        placeholderTextColor="#71717a"
                                        accessibilityLabel="search-requirements"
                                        style={{ fontFamily: 'Outfit-Regular' }}
                                        className="flex-1 ml-3 text-white text-base h-full"
                                    />
                                </View>

                                {/* Filter → opens the panel. White active + count badge. */}
                                <TouchableOpacity
                                    onPress={() => setFilterOpen(true)}
                                    accessibilityLabel="open-req-filters"
                                    className={`h-14 px-5 rounded-2xl flex-row items-center gap-2 border ${
                                        hasFilters ? 'bg-white border-white' : 'bg-zinc-900/50 border-white/10'
                                    }`}
                                >
                                    <Filter size={18} color={hasFilters ? '#000' : '#fff'} />
                                    {hasFilters && (
                                        <View className="bg-black rounded-full w-5 h-5 items-center justify-center">
                                            <Text
                                                style={{ fontFamily: 'Outfit-ExtraBold' }}
                                                className="text-white text-[10px]"
                                            >
                                                {activeReqFilterCount(filters)}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>

                                {/* Sort → icon-only; anchors the shared dropdown below it */}
                                <View style={{ position: 'relative', zIndex: 50 }}>
                                    <TouchableOpacity
                                        onPress={() => setShowSort((v) => !v)}
                                        accessibilityLabel="open-req-sort"
                                        className={`h-14 px-5 rounded-2xl flex-row items-center gap-2 border ${
                                            sortActive ? 'bg-white border-white' : 'bg-zinc-900/50 border-white/10'
                                        }`}
                                    >
                                        <ArrowUpDown size={18} color={sortActive ? '#000' : '#fff'} />
                                    </TouchableOpacity>
                                    <SortDropdown
                                        visible={showSort}
                                        options={REQ_SORT_OPTIONS}
                                        value={filters.sort}
                                        onSelect={(v) =>
                                            setFilters((f) => ({
                                                ...f,
                                                sort: v as RequirementFilters['sort'],
                                            }))
                                        }
                                        onClose={() => setShowSort(false)}
                                        accent="#FF6B35"
                                        align="right"
                                        title="Sort briefs"
                                    />
                                </View>
                            </View>

                            {/* Category pills */}
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                className="mt-4 mb-6 flex-grow-0"
                                contentContainerStyle={{ gap: 8 }}
                            >
                                {OCCASION_CATEGORIES.map((cat) => {
                                    const isActive = cat === activeCategory;
                                    return (
                                        <TouchableOpacity
                                            key={cat}
                                            onPress={() => pressCategory(cat)}
                                            className={`h-12 px-5 rounded-2xl items-center justify-center border ${
                                                isActive ? 'bg-white border-transparent' : 'bg-transparent border-white/10'
                                            }`}
                                        >
                                            <Text
                                                style={{ fontFamily: 'Outfit-ExtraBold' }}
                                                className={`text-[10px] uppercase tracking-widest ${
                                                    isActive ? 'text-black' : 'text-zinc-500'
                                                }`}
                                            >
                                                {cat}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    }
                    renderItem={({ item }: { item: any }) => {
                        const comp = competition(item.proposalCount || 0);
                        const hirer = HIRER_LABEL[item.clientSnapshot?.hirerType ?? ''];
                        const fresh = timeAgo(item.createdAt);
                        const isNew =
                            !!item.createdAt &&
                            Date.now() - new Date(item.createdAt).getTime() < 3_600_000;
                        // Occasion rides as a supplementary chip only when a distinct title exists;
                        // otherwise it *is* the title line below (avoids showing it twice).
                        const showOccasionChip = !!item.title && !!item.occasionText;

                        return (
                            <Pressable
                                onPress={() => router.push(`/(app)/requirements/${item._id}` as any)}
                                style={{
                                    borderRadius: 16,
                                    marginBottom: 12,
                                    overflow: 'hidden',
                                    backgroundColor: '#0e0e11',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.09)',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 10 },
                                    shadowOpacity: 0.5,
                                    shadowRadius: 20,
                                    elevation: 8,
                                }}
                            >
                                {/* Scarce green strip — wide-open briefs only (be the first to pitch) */}
                                {comp.wideOpen && (
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 8,
                                            paddingHorizontal: 15,
                                            paddingVertical: 9,
                                            backgroundColor: 'rgba(34,197,94,0.10)',
                                            borderBottomWidth: 1,
                                            borderBottomColor: 'rgba(34,197,94,0.16)',
                                        }}
                                    >
                                        <Zap size={13} color="#22C55E" />
                                        <Text
                                            style={{
                                                fontFamily: 'Outfit-SemiBold',
                                                color: '#22C55E',
                                                fontSize: 11,
                                            }}
                                        >
                                            Wide open · be the first to pitch
                                        </Text>
                                    </View>
                                )}

                                <View style={{ padding: 14 }}>
                                    {/* Occasion · hirer · freshness */}
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 8,
                                            marginBottom: 9,
                                        }}
                                    >
                                        {showOccasionChip && (
                                            <View
                                                style={{
                                                    flexShrink: 1,
                                                    backgroundColor: 'rgba(255,107,53,0.12)',
                                                    borderRadius: 5,
                                                    paddingHorizontal: 7,
                                                    paddingVertical: 2,
                                                }}
                                            >
                                                <Text
                                                    numberOfLines={1}
                                                    style={{
                                                        fontFamily: 'Outfit-SemiBold',
                                                        color: '#FF6B35',
                                                        fontSize: 10,
                                                    }}
                                                >
                                                    {item.occasionText}
                                                </Text>
                                            </View>
                                        )}
                                        {hirer && (
                                            <View
                                                style={{
                                                    backgroundColor: 'rgba(245,158,11,0.14)',
                                                    borderRadius: 5,
                                                    paddingHorizontal: 6,
                                                    paddingVertical: 2,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontFamily: 'Outfit-Bold',
                                                        color: '#F59E0B',
                                                        fontSize: 9,
                                                        letterSpacing: 0.4,
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    {hirer}
                                                </Text>
                                            </View>
                                        )}
                                        <View style={{ flex: 1 }} />
                                        {!!fresh && (
                                            <Text
                                                style={{
                                                    fontFamily: 'SpaceMono-Regular',
                                                    color: isNew ? '#22C55E' : '#52525b',
                                                    fontSize: 10,
                                                }}
                                            >
                                                {fresh}
                                            </Text>
                                        )}
                                    </View>

                                    {/* Title */}
                                    <Text
                                        numberOfLines={2}
                                        style={{
                                            fontFamily: 'Outfit-SemiBold',
                                            color: '#f4f4f5',
                                            fontSize: 15,
                                            lineHeight: 20,
                                            marginBottom: 8,
                                        }}
                                    >
                                        {item.title || item.occasionText}
                                    </Text>

                                    {/* City · date */}
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 5,
                                            marginBottom: 12,
                                        }}
                                    >
                                        <MapPin size={12} color="#71717a" />
                                        <Text
                                            style={{
                                                fontFamily: 'Outfit-Regular',
                                                color: '#a1a1aa',
                                                fontSize: 12,
                                                marginRight: 8,
                                            }}
                                        >
                                            {item.city}
                                        </Text>
                                        <Calendar size={12} color="#71717a" />
                                        <Text
                                            style={{
                                                fontFamily: 'Outfit-Regular',
                                                color: '#a1a1aa',
                                                fontSize: 12,
                                            }}
                                        >
                                            {item.eventDate
                                                ? new Date(item.eventDate).toLocaleDateString('en-IN')
                                                : '—'}
                                        </Text>
                                    </View>

                                    {/* Budget · inline competition (non-wide-open only) */}
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            paddingTop: 12,
                                            borderTopWidth: 1,
                                            borderTopColor: 'rgba(255,255,255,0.08)',
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontFamily: 'SpaceMono-Bold',
                                                color: '#F59E0B',
                                                fontSize: 15,
                                            }}
                                        >
                                            {compactBudget(item.budgetMin, item.budgetMax)}
                                        </Text>
                                        {!comp.wideOpen && !!comp.label && (
                                            <Text
                                                style={{
                                                    fontFamily: 'Outfit-SemiBold',
                                                    color: comp.tone === 'hot' ? '#F59E0B' : '#a1a1aa',
                                                    fontSize: 11.5,
                                                }}
                                            >
                                                {comp.label}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </Pressable>
                        );
                    }}
                />
            </SafeAreaView>

            <RequirementFilterSheet
                visible={filterOpen}
                applied={filters}
                q={debouncedQ}
                onApply={setFilters}
                onClose={() => setFilterOpen(false)}
            />
        </View>
    );
}
