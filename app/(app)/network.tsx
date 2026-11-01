import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
    View, Text, Pressable, StyleSheet, TextInput, Image,
    ActivityIndicator, RefreshControl, Animated, Easing, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
    ChevronLeft, ChevronRight, Search, X, Users, Sparkles,
    MessageCircle, Send,
} from 'lucide-react-native';

import AppScrollView from '@/components/AppScrollView';
import { useAuthStore } from '@/stores/authStore';
import connectionService from '@/services/connectionService';
import conversationService from '@/services/conversationService';
import { Connection, ConnectionRequest } from '@/types/connection';
import { NotificationsBell } from '@/components/notifications/NotificationsBell';
import { usePresence } from '@/hooks/usePresence';
import { interpretConnectionError } from '@/utils/connectionErrors';
import { PYMKCarousel } from '@/components/network/PYMKCarousel';
import { usePymk, useDismissPymk } from '@/hooks/usePymk';

// ─── A·Minimal palette (locked tokens — same family as gigs / CL home / notifications) ───
const C = {
    orange: '#FF6B35',
    orangeSoft: 'rgba(255,107,53,0.12)',
    orangeLine: 'rgba(255,107,53,0.30)',
    ink: '#190B05',
    green: '#22C55E',
    bg: '#121216',
    surface: '#1C1C23',
    surface2: '#212129',
    avatarbg: '#2A2A33',
    text: '#FFFFFF',
    text1: '#D4D4D8',
    text2: '#A1A1AA',
    text3: '#8B8B99',
    text4: '#6B6B78',
    border: 'rgba(255,255,255,0.06)',
    border2: 'rgba(255,255,255,0.10)',
};

type FilterKey = 'all' | 'artists' | 'leads';

// The hiring side of the three-role model. "Leads" = creative_lead (legacy
// hirer/organizer kept so existing connections aren't hidden); everyone else
// (artists, clients, untyped) falls under "Artists".
const isLead = (role?: string) =>
    role === 'creative_lead' || role === 'hirer' || role === 'organizer';

// ──────────────────────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────────────────────

const initials = (name?: string) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
};

const timeAgo = (iso?: string) => {
    if (!iso) return '';
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d`;
    return `${Math.floor(diff / 2592000)}mo`;
};

const roleLabel = (u: any) => {
    const at = u?.artistType;
    if (Array.isArray(at) && at.length) return at[0];
    if (typeof at === 'string' && at) return at;
    if (u?.role === 'client') return 'Client';
    if (u?.role === 'creative_lead' || u?.role === 'hirer' || u?.role === 'organizer') return 'Creative Lead';
    return 'Artist';
};

// ──────────────────────────────────────────────────────────────
//  Subcomponents
// ──────────────────────────────────────────────────────────────

const PulseDot = () => {
    const scale = useMemo(() => new Animated.Value(1), []);
    const opacity = useMemo(() => new Animated.Value(0.6), []);
    useEffect(() => {
        const loop = Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(scale, { toValue: 2.2, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                    Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
                ]),
                Animated.sequence([
                    Animated.timing(opacity, { toValue: 0, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                    Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
                ]),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [scale, opacity]);
    return (
        <View style={{ width: 8, height: 8 }}>
            <Animated.View style={[s.pulseDotRing, { transform: [{ scale }], opacity }]} />
            <View style={s.pulseDot} />
        </View>
    );
};

const Avatar = ({ uri, name, size = 44, online = false }: { uri?: string; name?: string; size?: number; online?: boolean }) => {
    const dotSize = Math.max(9, Math.round(size * 0.26));
    const inner = uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.avatarbg }} />
    ) : (
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.avatarbg, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: C.text1, fontFamily: 'Outfit-Bold', fontSize: size * 0.34, letterSpacing: -0.2 }}>
                {initials(name).toUpperCase()}
            </Text>
        </View>
    );
    return (
        <View style={{ width: size, height: size }}>
            {inner}
            {online && (
                <View
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: dotSize,
                        height: dotSize,
                        borderRadius: dotSize / 2,
                        backgroundColor: C.green,
                        borderWidth: 2,
                        borderColor: C.bg,
                    }}
                />
            )}
        </View>
    );
};

const ConnItem = ({ item, currentUserId, onMessage, onPressUser, online = false }: {
    item: Connection;
    currentUserId?: string;
    onMessage: (c: Connection) => void;
    onPressUser: (id: string) => void;
    online?: boolean;
}) => {
    const other = item.requesterId._id === currentUserId ? item.recipientId : item.requesterId;
    return (
        <Pressable
            onPress={() => onPressUser(other._id)}
            style={({ pressed }) => [s.connRow, pressed && { backgroundColor: 'rgba(255,255,255,0.02)' }]}
        >
            <Avatar uri={other.profileImageUrl} name={other.displayName || other.firstName} size={44} online={online} />
            <View style={s.connInfo}>
                <Text style={s.connName} numberOfLines={1}>{other.displayName || other.firstName}</Text>
                <Text style={s.connMeta} numberOfLines={1}>
                    {roleLabel(other)} · Connected {timeAgo(item.createdAt)}
                </Text>
            </View>
            <Pressable
                onPress={() => onMessage(item)}
                style={({ pressed }) => [s.connAction, pressed && { opacity: 0.6 }]}
                hitSlop={8}
            >
                <MessageCircle size={14} color={C.text2} strokeWidth={2} />
            </Pressable>
        </Pressable>
    );
};

// ──────────────────────────────────────────────────────────────
//  Main screen
// ──────────────────────────────────────────────────────────────

export default function NetworkPage() {
    const { user } = useAuthStore();
    const currentUserId = user?._id;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [invitations, setInvitations] = useState<ConnectionRequest[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [sentRequests, setSentRequests] = useState<Connection[]>([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

    // Discover people — pymkService (artist-search-v2). Dismiss persists server-side.
    const { data: pymkData } = usePymk(1, 10);
    const dismissMutation = useDismissPymk();

    const handlePymkConnect = async (artistId: string) => {
        try {
            await connectionService.sendConnectionRequest(artistId);
        } catch (e: any) {
            const info = interpretConnectionError(e);
            if (!info.swallow) {
                Alert.alert(info.title, info.message);
            }
        }
    };

    const fetchAll = useCallback(async () => {
        try {
            const [reqs, conns, sent] = await Promise.all([
                connectionService.getConnectionRequests(),
                connectionService.getConnections(),
                connectionService.getSentConnectionRequests(),
            ]);
            setInvitations(reqs || []);
            setConnections(conns || []);
            setSentRequests(sent || []);
        } catch (e) {
            console.error('[network] fetchAll failed', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAll();
    };

    const openMessage = async (conn: Connection) => {
        const other = conn.requesterId._id === currentUserId ? conn.recipientId : conn.requesterId;
        try {
            const convo = await conversationService.createConversation(other._id);
            const convoId = (convo as any)?._id;
            if (convoId) {
                router.push(`/(app)/inbox?c=${convoId}` as any);
            } else {
                router.push('/(app)/inbox' as any);
            }
        } catch (e) {
            console.error('[network] openMessage failed', e);
            router.push('/(app)/inbox' as any);
        }
    };

    const goProfile = (id: string) => router.push(`/profile/${id}` as any);

    // ── Filter + search ──
    const filteredConnections = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        let list = connections;
        if (activeFilter === 'artists') {
            list = list.filter(c => {
                const other = c.requesterId._id === currentUserId ? c.recipientId : c.requesterId;
                return !isLead(other.role);
            });
        } else if (activeFilter === 'leads') {
            list = list.filter(c => {
                const other = c.requesterId._id === currentUserId ? c.recipientId : c.requesterId;
                return isLead(other.role);
            });
        }
        if (q) {
            list = list.filter(c => {
                const other = c.requesterId._id === currentUserId ? c.recipientId : c.requesterId;
                const name = (other.displayName || other.firstName || '').toLowerCase();
                return name.includes(q);
            });
        }
        return list;
    }, [connections, activeFilter, searchQuery, currentUserId]);

    // Real-time online presence for all connection counterparts.
    const connectionUserIds = useMemo(
        () => connections.map(c => (c.requesterId._id === currentUserId ? c.recipientId._id : c.requesterId._id)),
        [connections, currentUserId]
    );
    const onlineUsers = usePresence(connectionUserIds);

    const connCount = connections.length;
    const inviteCount = invitations.length;
    const sentCount = sentRequests.length;
    // hasAny = should we render the rich-state body (vs the empty hero)?
    // User has content if they have connections or pending invites.
    const hasAny = inviteCount + connCount > 0;
    const pymkItems = pymkData?.items ?? [];

    // ──────────────────────────────────────────────────────────
    //  Render
    // ──────────────────────────────────────────────────────────
    return (
        <View style={s.root}>
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                {/* Top bar */}
                <View style={s.topBar}>
                    <Pressable onPress={() => router.back()} style={s.iconBtn} hitSlop={8}>
                        <ChevronLeft size={18} color={C.text2} strokeWidth={2} />
                    </Pressable>
                    <Text style={s.topTitle}>Network</Text>
                    <NotificationsBell size={18} color={C.text2} badgeBorderColor={C.bg} />
                </View>

                {loading ? (
                    <View style={s.loadingWrap}>
                        <ActivityIndicator size="large" color={C.orange} />
                        <Text style={s.loadingText}>Loading your network…</Text>
                    </View>
                ) : (
                    <AppScrollView
                        contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.text2} />}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Empty hero — truly new user */}
                        {!hasAny && (
                            <View style={s.emptyHero}>
                                <View style={s.emptyIcon}>
                                    <Users size={28} color={C.orange} strokeWidth={2} />
                                </View>
                                <Text style={s.emptyTitle}>Build your crew</Text>
                                <Text style={s.emptyDesc}>
                                    Connect with artists and creative leads. A strong network surfaces better gigs — and builds the trust that wins them.
                                </Text>
                                <Pressable
                                    onPress={() => router.push('/gigs' as any)}
                                    style={({ pressed }) => [s.emptyCta, pressed && { opacity: 0.85 }]}
                                >
                                    <Sparkles size={15} color={C.ink} strokeWidth={2.5} />
                                    <Text style={s.emptyCtaText}>Discover artists</Text>
                                </Pressable>
                            </View>
                        )}

                        {/* Invitations link — always visible; opens /network/invitations (Received / Sent tabs) */}
                        <Pressable
                            onPress={() => router.push('/(app)/network/invitations' as any)}
                            style={({ pressed }) => [s.invitesLink, inviteCount > 0 && s.invitesLinkPending, pressed && { opacity: 0.85 }]}
                        >
                            <View style={s.invitesLinkLeft}>
                                {inviteCount > 0 ? <PulseDot /> : null}
                                <Text style={s.invitesLinkTitle}>Invitations</Text>
                                {inviteCount > 0 ? (
                                    <View style={s.invitesLinkBadge}>
                                        <Text style={s.invitesLinkBadgeText}>{inviteCount}</Text>
                                    </View>
                                ) : null}
                            </View>
                            <View style={s.invitesLinkRight}>
                                <View style={s.invitesSentPill}>
                                    <Send size={12} color={sentCount > 0 ? C.text2 : C.text4} strokeWidth={2} />
                                    <Text style={[s.invitesSentPillText, sentCount === 0 && { color: C.text4 }]}>
                                        {sentCount} sent
                                    </Text>
                                </View>
                                <ChevronRight size={16} color={C.text3} strokeWidth={2} />
                            </View>
                        </Pressable>

                        {/* Discover people — one consolidated rail (pymkService) */}
                        {pymkItems.length > 0 && (
                            <>
                                <View style={s.sectionHead}>
                                    <Text style={s.sectionTitle}>Discover people</Text>
                                </View>
                                <PYMKCarousel
                                    items={pymkItems}
                                    onConnect={handlePymkConnect}
                                    onDismiss={(id) => dismissMutation.mutate(id)}
                                />
                            </>
                        )}

                        {/* Section header */}
                        {connCount > 0 && (
                            <View style={s.sectionHead}>
                                <Text style={s.sectionTitle}>Connections</Text>
                                <Text style={s.sectionMeta}>
                                    {filteredConnections.length} of {connCount}
                                </Text>
                            </View>
                        )}

                        {/* Filter tabs + search — one horizontal row above the list */}
                        {connCount > 0 && (
                            <View style={s.filterRow}>
                                {(['all', 'artists', 'leads'] as FilterKey[]).map(key => {
                                    const active = activeFilter === key;
                                    return (
                                        <Pressable
                                            key={key}
                                            onPress={() => setActiveFilter(key)}
                                            style={s.filterTab}
                                        >
                                            <Text style={[s.filterTabText, active && s.filterTabTextActive]}>
                                                {/* 'Leads' relabeled → 'Creative Lead' (swap back to restore) */}
                                                {key === 'all' ? 'All' : key === 'artists' ? 'Artists' : 'Creative Lead'}
                                            </Text>
                                            {active && <View style={s.filterTabUnderline} />}
                                        </Pressable>
                                    );
                                })}
                                <Pressable
                                    onPress={() => setSearchOpen(v => !v)}
                                    style={s.filterSearchBtn}
                                    hitSlop={8}
                                >
                                    <Search size={16} color={searchOpen ? C.orange : C.text2} strokeWidth={2} />
                                </Pressable>
                            </View>
                        )}

                        {/* Search input (toggle) — below the filter row */}
                        {connCount > 0 && searchOpen && (
                            <View style={s.searchWrap}>
                                <Search size={16} color={C.text3} strokeWidth={2} />
                                <TextInput
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholder="Search connections"
                                    placeholderTextColor={C.text3}
                                    style={s.searchInput}
                                    autoFocus
                                />
                                {searchQuery.length > 0 && (
                                    <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                                        <X size={14} color={C.text3} strokeWidth={2} />
                                    </Pressable>
                                )}
                            </View>
                        )}

                        {/* Connections list */}
                        {connCount > 0 && (
                            <View style={s.connList}>
                                {filteredConnections.length === 0 ? (
                                    <View style={s.noResults}>
                                        <Text style={s.noResultsText}>
                                            {searchQuery ? `No matches for “${searchQuery}”` : 'No one in this filter.'}
                                        </Text>
                                    </View>
                                ) : (
                                    filteredConnections.map(c => {
                                        const otherId = c.requesterId._id === currentUserId ? c.recipientId._id : c.requesterId._id;
                                        return (
                                            <ConnItem
                                                key={c._id}
                                                item={c}
                                                currentUserId={currentUserId}
                                                onMessage={openMessage}
                                                onPressUser={goProfile}
                                                online={onlineUsers.has(otherId)}
                                            />
                                        );
                                    })
                                )}
                            </View>
                        )}

                        {/* Sent requests moved to /network/invitations (Sent tab) */}
                    </AppScrollView>
                )}
            </SafeAreaView>
        </View>
    );
}

// ──────────────────────────────────────────────────────────────
//  Styles
// ──────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },

    // Top bar
    topBar: {
        paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    iconBtn: {
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1, borderColor: C.border,
        alignItems: 'center', justifyContent: 'center',
    },
    topTitle: {
        fontSize: 22, color: C.text, letterSpacing: -0.3,
        fontFamily: 'DMSerifDisplay_400Regular',
    },

    // Loading
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: C.text3, fontSize: 12, fontFamily: 'Outfit-Regular' },

    // Pulse dot
    pulseDot: {
        position: 'absolute', top: 0, left: 0,
        width: 8, height: 8, borderRadius: 4, backgroundColor: C.orange,
    },
    pulseDotRing: {
        position: 'absolute', top: 0, left: 0,
        width: 8, height: 8, borderRadius: 4, backgroundColor: C.orange,
    },

    // Invites link row — opens /network/invitations. Goes orange-soft when pending.
    invitesLink: {
        marginHorizontal: 14, marginTop: 10, marginBottom: 2,
        paddingVertical: 14, paddingHorizontal: 16,
        borderRadius: 14,
        backgroundColor: C.surface,
        borderWidth: 1, borderColor: C.border2,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    invitesLinkPending: {
        backgroundColor: C.orangeSoft,
        borderColor: C.orangeLine,
    },
    invitesLinkLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    invitesLinkRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    invitesLinkTitle: {
        fontSize: 14, color: C.text, fontFamily: 'Outfit-SemiBold',
        letterSpacing: 0.2,
    },
    invitesLinkBadge: {
        paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, minWidth: 22, alignItems: 'center',
        backgroundColor: C.orange,
    },
    invitesLinkBadgeText: { color: C.ink, fontSize: 11, fontFamily: 'SpaceMono-Bold' },
    invitesSentPill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 11, paddingVertical: 4, borderRadius: 999,
        backgroundColor: C.surface2,
        borderWidth: 1, borderColor: C.border,
    },
    invitesSentPillText: { color: C.text2, fontSize: 10.5, fontFamily: 'SpaceMono-Regular' },

    // Search
    searchWrap: {
        marginHorizontal: 14, marginTop: 12,
        paddingHorizontal: 14, paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: C.surface2,
        borderWidth: 1, borderColor: C.border,
        flexDirection: 'row', alignItems: 'center', gap: 10,
    },
    searchInput: {
        flex: 1, color: C.text, fontSize: 13, padding: 0,
        fontFamily: 'Outfit-Regular',
    },

    // Filter tabs + search (one horizontal row above the list)
    filterRow: {
        flexDirection: 'row', alignItems: 'flex-end', gap: 22,
        paddingHorizontal: 20, marginTop: 8,
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    filterTab: { paddingBottom: 10, position: 'relative' },
    filterTabText: { fontSize: 14, color: C.text3, letterSpacing: 0.3, fontFamily: 'Outfit-Regular' },
    filterTabTextActive: { color: C.text, fontFamily: 'Outfit-SemiBold' },
    filterTabUnderline: {
        position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, borderRadius: 2,
        backgroundColor: C.orange,
    },
    filterSearchBtn: { marginLeft: 'auto', paddingBottom: 9 },

    // Section header
    sectionHead: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 24, paddingBottom: 4,
    },
    sectionTitle: {
        fontSize: 9.5, color: C.text2,
        textTransform: 'uppercase', letterSpacing: 1.9,
        fontFamily: 'SpaceMono-Bold',
    },
    sectionMeta: { fontSize: 10, color: C.text3, letterSpacing: 0.3, fontFamily: 'SpaceMono-Regular' },

    // Conn list
    connList: { marginTop: 8 },
    connRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 20, paddingVertical: 12,
        borderTopWidth: 1, borderTopColor: C.border,
    },
    connInfo: { flex: 1, minWidth: 0 },
    connName: { fontSize: 14, color: C.text, fontFamily: 'Outfit-SemiBold' },
    connMeta: { fontSize: 11.5, color: C.text3, marginTop: 2, fontFamily: 'Outfit-Regular' },
    connAction: {
        width: 36, height: 36, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1, borderColor: C.border,
        alignItems: 'center', justifyContent: 'center',
    },

    // No results
    noResults: { paddingVertical: 44, alignItems: 'center' },
    noResultsText: { color: C.text3, fontSize: 13, fontFamily: 'Outfit-Regular' },

    // Empty hero
    emptyHero: {
        marginHorizontal: 18, marginTop: 34,
        paddingHorizontal: 22, paddingVertical: 36,
        alignItems: 'center',
        borderRadius: 22,
        backgroundColor: C.surface,
        borderWidth: 1, borderColor: C.border,
    },
    emptyIcon: {
        width: 72, height: 72, borderRadius: 36, marginBottom: 18,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: C.orangeSoft,
        borderWidth: 1, borderColor: C.orangeLine,
    },
    emptyTitle: {
        fontSize: 24, color: C.text, marginBottom: 9, letterSpacing: -0.3,
        fontFamily: 'DMSerifDisplay_400Regular',
    },
    emptyDesc: {
        fontSize: 13, color: C.text2, textAlign: 'center', lineHeight: 20,
        marginBottom: 22, maxWidth: 264,
        fontFamily: 'Outfit-Regular',
    },
    emptyCta: {
        flexDirection: 'row', alignItems: 'center', gap: 7,
        paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12,
        backgroundColor: C.orange,
    },
    emptyCtaText: {
        fontSize: 13, color: C.ink,
        fontFamily: 'Outfit-Bold',
    },
});
