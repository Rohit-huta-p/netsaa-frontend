// src/components/requirements/RequirementsFeedList.tsx
// Self-contained "Find work" feed of open client requirements. Reused by:
//   • the Creative-Lead "Apply" route (app/(app)/requirements/index.tsx)
//   • the agency-supplier "Find Work" bottom-nav tab (BottomNav → AGENCY_TABS)
// Both surfaces hit the same `requirementService.feed()` endpoint, which the
// backend authorizes for Creative Leads and agency-flagged clients (Part C).
// Each card navigates to the shared requirement detail at /(app)/requirements/{id}.
//
// Search (q) + a multi-section filter sheet (City · Occasion · Min budget) + Sort
// mirror the Talent directory. Active facets show as removable chips below the
// search bar; the funnel turns orange with a count badge when filters are on.

import { useState } from 'react';
import {
    View,
    Text,
    Pressable,
    TextInput,
    FlatList,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Calendar, IndianRupee, Search, Filter, X, Mail } from 'lucide-react-native';
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

const fmtBudget = (min?: number | null, max?: number | null) => {
    const f = (n: number) => `₹${n.toLocaleString('en-IN')}`;
    if (min != null && max != null) return `${f(min)} – ${f(max)}`;
    if (max != null) return `Up to ${f(max)}`;
    if (min != null) return `${f(min)} onwards`;
    return 'Budget open';
};

// Short label for the budget chip (e.g. ₹50k+, ₹1L+).
const budgetChipLabel = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(0)}L+` : `₹${(n / 1000).toFixed(0)}k+`;

export default function RequirementsFeedList() {
    const router = useRouter();
    const navClearance = (useMobileTabBarHeight() || 64) + 56;

    const [q, setQ] = useState('');
    const [filters, setFilters] = useState<RequirementFilters>(EMPTY_REQ_FILTERS);
    const [filterOpen, setFilterOpen] = useState(false);

    // Debounce the search text into the query key so each keystroke doesn't fire a request.
    const debouncedQ = useDebouncedValue(q, 300);

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['requirements', 'feed', debouncedQ, filters],
        queryFn: () => requirementService.feed({ q: debouncedQ, filters }),
    });
    const requirements = data?.requirements ?? [];

    // Received invites badge — pending (sent|viewed) invitations sent to me by
    // clients. Mirrors the artist-home count; the Mail icon opens the inbox.
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

    // Active-filter chips — one removable chip per active facet (sort excluded).
    const chips: { key: string; label: string; clear: () => void }[] = [
        ...filters.cities.map((c) => ({
            key: `city:${c}`,
            label: c,
            clear: () => setFilters((f) => ({ ...f, cities: f.cities.filter((x) => x !== c) })),
        })),
        ...filters.occasions.map((o) => ({
            key: `occasion:${o}`,
            label: o,
            clear: () =>
                setFilters((f) => ({ ...f, occasions: f.occasions.filter((x) => x !== o) })),
        })),
        ...(filters.minBudget
            ? [
                  {
                      key: 'budget',
                      label: budgetChipLabel(filters.minBudget),
                      clear: () => setFilters((f) => ({ ...f, minBudget: null })),
                  },
              ]
            : []),
    ];

    return (
        <View style={{ flex: 1, backgroundColor: '#09090b', paddingTop: 12, paddingHorizontal: 20 }}>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 14,
                }}
            >
                <Text
                    style={{
                        fontFamily: 'DMSerifDisplay_400Regular',
                        color: '#f4f4f5',
                        fontSize: 22,
                    }}
                >
                    Find work
                </Text>

                {/* Received invites — opens the recipient inbox; badge = pending */}
                <Pressable
                    onPress={() => router.push('/(app)/invites' as any)}
                    accessibilityLabel="invites"
                    hitSlop={8}
                    style={{ position: 'relative', padding: 4 }}
                >
                    <Mail size={22} color="#f4f4f5" />
                    {pendingInviteCount > 0 && (
                        <View
                            style={{
                                position: 'absolute',
                                top: -2,
                                right: -2,
                                minWidth: 16,
                                height: 16,
                                borderRadius: 8,
                                backgroundColor: '#FF6B35',
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingHorizontal: 3,
                                borderWidth: 1.5,
                                borderColor: '#09090b',
                            }}
                        >
                            <Text
                                style={{ fontFamily: 'Outfit-SemiBold', color: '#fff', fontSize: 9 }}
                            >
                                {pendingInviteCount > 9 ? '9+' : String(pendingInviteCount)}
                            </Text>
                        </View>
                    )}
                </Pressable>
            </View>

            {/* Search + filter funnel */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <View
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        backgroundColor: '#15151C',
                        borderWidth: 1,
                        borderColor: '#20202A',
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                    }}
                >
                    <Search size={16} color="#8A857B" />
                    <TextInput
                        value={q}
                        onChangeText={setQ}
                        placeholder="Search occasions, cities…"
                        placeholderTextColor="#52525b"
                        accessibilityLabel="search-requirements"
                        style={{
                            flex: 1,
                            fontFamily: 'Outfit-Regular',
                            color: '#f4f4f5',
                            fontSize: 13,
                        }}
                    />
                </View>

                {/* Funnel → opens the filter panel. Orange + count badge when filters are active. */}
                <Pressable
                    onPress={() => setFilterOpen(true)}
                    accessibilityLabel="open-req-filters"
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: hasFilters ? '#FF6B35' : '#20202A',
                        backgroundColor: hasFilters ? 'rgba(255,107,53,0.08)' : '#15151C',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Filter size={18} color={hasFilters ? '#FF6B35' : '#8A857B'} />
                    {hasFilters && (
                        <View
                            style={{
                                position: 'absolute',
                                top: -4,
                                right: -4,
                                minWidth: 16,
                                height: 16,
                                borderRadius: 8,
                                backgroundColor: '#FF6B35',
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingHorizontal: 3,
                            }}
                        >
                            <Text
                                style={{ fontFamily: 'Outfit-SemiBold', color: '#fff', fontSize: 10 }}
                            >
                                {activeReqFilterCount(filters)}
                            </Text>
                        </View>
                    )}
                </Pressable>
            </View>

            {/* Active filters — removable chips (the funnel above opens the panel) */}
            {chips.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {chips.map((chip) => (
                        <Pressable
                            key={chip.key}
                            onPress={chip.clear}
                            accessibilityLabel={`clear-req-filter-${chip.key}`}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                borderWidth: 1,
                                borderColor: '#FF6B35',
                                backgroundColor: 'rgba(255,107,53,0.08)',
                                borderRadius: 99,
                                paddingLeft: 12,
                                paddingRight: 8,
                                paddingVertical: 5,
                            }}
                        >
                            <Text
                                style={{
                                    fontFamily: 'Outfit-SemiBold',
                                    color: '#FF6B35',
                                    fontSize: 12,
                                }}
                            >
                                {chip.label}
                            </Text>
                            <X size={13} color="#FF6B35" />
                        </Pressable>
                    ))}
                </View>
            )}

            <FlatList
                data={requirements as any[]}
                keyExtractor={(r: any) => r._id}
                contentContainerStyle={{ paddingBottom: navClearance }}
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
                renderItem={({ item }: { item: any }) => (
                    <Pressable
                        onPress={() => router.push(`/(app)/requirements/${item._id}` as any)}
                        className="border border-white/10 rounded-2xl p-4 mb-3"
                    >
                        <Text
                            style={{ fontFamily: 'Outfit-SemiBold' }}
                            className="text-zinc-100 text-[15px] mb-1"
                        >
                            {item.title || item.occasionText}
                        </Text>
                        {item.occasionText && (
                            <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6 }}>
                                <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 11 }}>{item.occasionText}</Text>
                            </View>
                        )}
                        <Text
                            style={{ fontFamily: 'Outfit-Regular' }}
                            className="text-zinc-400 text-[12px] mb-2"
                            numberOfLines={2}
                        >
                            {item.description}
                        </Text>
                        <View className="flex-row items-center flex-wrap">
                            <MapPin size={12} color="#71717a" />
                            <Text
                                style={{ fontFamily: 'Outfit-Regular' }}
                                className="text-zinc-500 text-[12px] ml-1 mr-3"
                            >
                                {item.city}
                            </Text>
                            <Calendar size={12} color="#71717a" />
                            <Text
                                style={{ fontFamily: 'Outfit-Regular' }}
                                className="text-zinc-500 text-[12px] ml-1 mr-3"
                            >
                                {new Date(item.eventDate).toLocaleDateString('en-IN')}
                            </Text>
                            <IndianRupee size={12} color="#71717a" />
                            <Text
                                style={{ fontFamily: 'Outfit-Regular' }}
                                className="text-zinc-500 text-[12px] ml-1"
                            >
                                {fmtBudget(item.budgetMin, item.budgetMax)}
                            </Text>
                        </View>
                        <Text
                            style={{ fontFamily: 'Outfit-Regular' }}
                            className="text-zinc-600 text-[11px] mt-2"
                        >
                            {5 - (item.proposalCount || 0)} proposal slots left
                        </Text>
                    </Pressable>
                )}
            />

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
