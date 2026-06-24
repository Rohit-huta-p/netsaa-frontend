import { useState } from 'react';
import { View, Text, Pressable, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, X } from 'lucide-react-native';
import {
    directoryService,
    DirectoryPerson,
    TalentFilters,
    EMPTY_FILTERS,
    activeFilterCount,
} from '@/services/directoryService';
import connectionService from '@/services/connectionService';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';
import { useAuthStore } from '@/stores/authStore';
import { InviteSheet } from '@/components/talent/InviteSheet';
import { PersonCard, ConnState } from '@/components/talent/PersonCard';
import { TalentFilterSheet } from '@/components/talent/TalentFilterSheet';

const CATEGORIES = [
    'Dancer',
    'Choreographer',
    'Singer',
    'Musician',
    'Instrumentalist',
    'Band',
    'DJ',
    'Music Director',
    'Actor',
    'Theatre Artist',
    'Anchor',
    'Comedian',
    'Magician',
    'Mimicry Artist',
    'Poet',
    'Voice Artist',
    'Storyteller',
    'Folk Artist',
    'Puppeteer',
];
const CITIES = [
    'Pune',
    'Mumbai',
    'Delhi',
    'Bengaluru',
    'Hyderabad',
    'Chennai',
    'Kolkata',
    'Ahmedabad',
    'Jaipur',
    'Chandigarh',
];
export default function Talent() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const navClearance = (useMobileTabBarHeight() || 64) + 56;
    const authRole = useAuthStore((s) => s.role);
    const isClient = authRole === 'client';
    // A creative_lead hires artists DOWN the chain; agencies are client-layer
    // suppliers, so they're hidden from CL viewers (segment chip + results).
    const isCreativeLead = authRole === 'creative_lead';
    const currentUserId = useAuthStore((s) => s.user?._id);

    // ── Connection state — accepted + pending-sent, derived into per-person status.
    const { data: connections = [] } = useQuery({
        queryKey: ['connections', 'accepted'],
        queryFn: () => connectionService.getConnections(),
    });
    const { data: sentRequests = [] } = useQuery({
        queryKey: ['connections', 'sentPending'],
        queryFn: () => connectionService.getSentConnectionRequests(),
    });

    const connectedSet = new Set<string>();
    (connections as any[]).forEach((c) => {
        const a = c?.requesterId?._id ? String(c.requesterId._id) : String(c?.requesterId ?? '');
        const b = c?.recipientId?._id ? String(c.recipientId._id) : String(c?.recipientId ?? '');
        const other = a === String(currentUserId) ? b : a;
        if (other) connectedSet.add(other);
    });
    const pendingSet = new Set<string>();
    (sentRequests as any[]).forEach((r) => {
        const id = r?.recipientId?._id ? String(r.recipientId._id) : String(r?.recipientId ?? '');
        if (id) pendingSet.add(id);
    });

    const connStateFor = (id: string): ConnState =>
        connectedSet.has(id) ? 'connected' : pendingSet.has(id) ? 'pending' : 'none';

    // Connect-only — pure connection request, called from the sheet's "Connect
    // only" button. Optimistic → Pending; rethrows so the sheet shows the error.
    const connectOnly = async (id: string) => {
        if (connectedSet.has(id) || pendingSet.has(id)) return;
        queryClient.setQueryData<any[]>(['connections', 'sentPending'], (prev = []) => [
            ...prev,
            { _id: `opt-${id}`, recipientId: { _id: id }, status: 'pending' },
        ]);
        try {
            await connectionService.sendConnectionRequest(id);
            void queryClient.invalidateQueries({ queryKey: ['connections'] });
        } catch (err) {
            // Roll back the optimistic pending entry, then surface to the sheet.
            queryClient.setQueryData<any[]>(['connections', 'sentPending'], (prev = []) =>
                prev.filter((r) => (r?.recipientId?._id ?? r?.recipientId) !== id),
            );
            throw err;
        }
    };

    const [q, setQ] = useState('');
    // Seed the craft filter from Home's "Browse by craft" (it pushes ?craft=).
    const { craft } = useLocalSearchParams<{ craft?: string }>();
    const initialCraft = Array.isArray(craft) ? craft[0] : craft;
    const [filters, setFilters] = useState<TalentFilters>(
        initialCraft ? { ...EMPTY_FILTERS, artTypes: [initialCraft] } : EMPTY_FILTERS,
    );
    const [role, setRole] = useState<string | null>(null);

    // Invite sheet state — which person's sheet is open (null = closed)
    const [invitePerson, setInvitePerson] = useState<DirectoryPerson | null>(null);

    // Filter panel bottom-sheet open/closed
    const [filterOpen, setFilterOpen] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['directory', q, role, filters],
        queryFn: () => directoryService.list({ q, role, filters }),
    });
    // Defense in depth: even under "All", a CL never sees agencies. The directory
    // API also enforces this server-side (viewer-scoped pipeline); this guards
    // against stale or over-broad responses.
    const people = (data?.people ?? []).filter((p) => !(isCreativeLead && p.kind === 'agency'));

    // Active-filter chips — one removable chip per active facet (sort excluded).
    const chips: { key: string; label: string; clear: () => void }[] = [
        ...filters.artTypes.map((a) => ({
            key: `art:${a}`,
            label: a,
            clear: () =>
                setFilters((f) => ({ ...f, artTypes: f.artTypes.filter((x) => x !== a) })),
        })),
        ...filters.city.map((c) => ({
            key: `city:${c}`,
            label: c,
            clear: () => setFilters((f) => ({ ...f, city: f.city.filter((x) => x !== c) })),
        })),
        ...(filters.trust !== 'any'
            ? [
                  {
                      key: 'trust',
                      label: filters.trust === 'verified' ? 'Verified' : 'Trusted+',
                      clear: () => setFilters((f) => ({ ...f, trust: 'any' })),
                  },
              ]
            : []),
        ...(filters.hasMedia
            ? [
                  {
                      key: 'media',
                      label: 'Has portfolio',
                      clear: () => setFilters((f) => ({ ...f, hasMedia: false })),
                  },
              ]
            : []),
        ...filters.experience.map((e) => ({
            key: `exp:${e}`,
            label: e[0].toUpperCase() + e.slice(1),
            clear: () =>
                setFilters((f) => ({ ...f, experience: f.experience.filter((x) => x !== e) })),
        })),
        ...(filters.gender
            ? [
                  {
                      key: 'gender',
                      label: filters.gender,
                      clear: () => setFilters((f) => ({ ...f, gender: null })),
                  },
              ]
            : []),
    ];

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={{ flex: 1, backgroundColor: '#09090b', paddingTop: 12, paddingHorizontal: 20 }}>
                <View style={{ marginBottom: 14 }}>
                    <Text
                        style={{
                            fontFamily: 'DMSerifDisplay_400Regular',
                            color: '#f4f4f5',
                            fontSize: 22,
                        }}
                    >
                        Find talent
                    </Text>
                </View>

                {/* Search + craft-filter funnel */}
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
                            placeholder="Search dancers, choreographers…"
                            placeholderTextColor="#52525b"
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
                        accessibilityLabel="open-filters"
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: activeFilterCount(filters) > 0 ? '#FF6B35' : '#20202A',
                            backgroundColor:
                                activeFilterCount(filters) > 0 ? 'rgba(255,107,53,0.08)' : '#15151C',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Filter
                            size={18}
                            color={activeFilterCount(filters) > 0 ? '#FF6B35' : '#8A857B'}
                        />
                        {activeFilterCount(filters) > 0 && (
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
                                    style={{
                                        fontFamily: 'Outfit-SemiBold',
                                        color: '#fff',
                                        fontSize: 10,
                                    }}
                                >
                                    {activeFilterCount(filters)}
                                </Text>
                            </View>
                        )}
                    </Pressable>
                </View>

                {/* Role segment chips */}
                <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                    {[
                        { k: null, l: 'All' },
                        { k: 'artist', l: 'Artists' },
                        { k: 'creative_lead', l: 'Creative Leads' },
                        // Agencies are hidden from creative_lead viewers.
                        ...(isCreativeLead ? [] : [{ k: 'agency', l: 'Agencies' }]),
                    ].map((r) => (
                        <Pressable
                            key={r.l}
                            onPress={() => setRole(r.k)}
                            style={{
                                borderWidth: 1,
                                borderColor: role === r.k ? '#FF6B35' : '#2A2A33',
                                backgroundColor:
                                    role === r.k ? 'rgba(255,107,53,0.08)' : 'transparent',
                                borderRadius: 99,
                                paddingHorizontal: 11,
                                paddingVertical: 5,
                                marginRight: 6,
                            }}
                        >
                            <Text
                                style={{
                                    fontFamily: 'Outfit-Regular',
                                    color: role === r.k ? '#FF6B35' : '#C9C4BA',
                                    fontSize: 12,
                                }}
                            >
                                {r.l}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* Active filters — removable chips (the funnel above opens the panel) */}
                {chips.length > 0 && (
                    <View
                        style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: 8,
                            marginBottom: 12,
                        }}
                    >
                        {chips.map((chip) => (
                            <Pressable
                                key={chip.key}
                                onPress={chip.clear}
                                accessibilityLabel={`clear-filter-${chip.key}`}
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

                {/* Results */}
                {isLoading ? (
                    <ActivityIndicator color="#FF6B35" style={{ marginTop: 40 }} />
                ) : (
                    <FlatList
                        data={people}
                        keyExtractor={(p) => p._id}
                        contentContainerStyle={{ paddingBottom: navClearance }}
                        ListEmptyComponent={
                            <Text
                                style={{
                                    fontFamily: 'Outfit-Regular',
                                    color: '#71717a',
                                    fontSize: 13,
                                    textAlign: 'center',
                                    marginTop: 40,
                                }}
                            >
                                No one matches yet. Try a different search.
                            </Text>
                        }
                        renderItem={({ item }) => {
                            const isSelf = !!currentUserId && item._id === String(currentUserId);
                            return (
                            <View>
                                <PersonCard
                                    person={item}
                                    onPress={() => router.push(`/(app)/profile/${item._id}` as any)}
                                    connState={isSelf ? undefined : connStateFor(item._id)}
                                    // The single Connect pill opens the Connect sheet.
                                    onConnect={isSelf ? undefined : () => setInvitePerson(
                                        invitePerson?._id === item._id ? null : item,
                                    )}
                                />
                                {invitePerson?._id === item._id && (
                                    <InviteSheet
                                        visible
                                        person={{
                                            _id: item._id,
                                            displayName: item.displayName,
                                            // kind drives toRole: artist | creative_lead | agency
                                            role: item.kind,
                                        }}
                                        onClose={() => setInvitePerson(null)}
                                        connState={connStateFor(item._id)}
                                        onConnectOnly={() => connectOnly(item._id)}
                                        isClient={isClient}
                                    />
                                )}
                            </View>
                            );
                        }}
                    />
                )}

                <TalentFilterSheet
                    visible={filterOpen}
                    applied={filters}
                    crafts={CATEGORIES}
                    cities={CITIES}
                    role={role}
                    q={q}
                    onApply={setFilters}
                    onClose={() => setFilterOpen(false)}
                />
            </View>
        </>
    );
}
