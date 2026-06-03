import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
    View, Text, Pressable, StyleSheet, TextInput, Image,
    ActivityIndicator, RefreshControl, Animated, Easing, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
    ChevronLeft, ChevronRight, Search, Check, X, Clock, Send, Users, Sparkles,
    MessageCircle, ChevronDown, ChevronUp, ArrowUpDown, CheckCheck,
    UserPlus,
} from 'lucide-react-native';

import AppScrollView from '@/components/AppScrollView';
import { useAuthStore } from '@/stores/authStore';
import connectionService from '@/services/connectionService';
import conversationService from '@/services/conversationService';
import { Connection, ConnectionRequest } from '@/types/connection';
import { NotificationsBell } from '@/components/notifications/NotificationsBell';
import { usePYMK, type PYMKSuggestion } from '@/hooks/useConnectionMeta';
import { useFollowCounts, useMyFollowing, useFollowMutations, type FollowListUser } from '@/hooks/useFollow';
import { interpretConnectionError } from '@/utils/connectionErrors';
import { PYMKCarousel } from '@/components/network/PYMKCarousel';
import { usePymk, useDismissPymk } from '@/hooks/usePymk';

// ─── Design palette (from connections-page.html) ───
const C = {
    pink: '#EC4899',
    orange: '#F97316',
    gold: '#EAB308',
    cyan: '#06B6D4',
    green: '#34D399',
    red: '#EF4444',
    bg: '#0A0A10',
    surface: '#121018',
    surface2: '#1A1824',
    text: '#F0ECE6',
    text2: '#6B6878',
    text3: '#4A4656',
    text4: '#3A3746',
    border: 'rgba(255,255,255,0.06)',
    borderPink: 'rgba(236,72,153,0.18)',
};

type FilterKey = 'all' | 'artists' | 'hirers' | 'recent';

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
    return u?.role === 'hirer' ? 'Hirer' : 'Artist';
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

const Avatar = ({ uri, name, size = 44, gradient = [C.pink, C.orange] }: { uri?: string; name?: string; size?: number; gradient?: [string, string] }) => {
    if (uri) {
        return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.surface2 }} />;
    }
    return (
        <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
        >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.32 }}>
                {initials(name).toUpperCase()}
            </Text>
        </LinearGradient>
    );
};

const InviteRow = ({ item, onAccept, onIgnore, onPressUser, busy }: {
    item: ConnectionRequest;
    onAccept: (id: string) => void;
    onIgnore: (id: string) => void;
    onPressUser: (id: string) => void;
    busy: boolean;
}) => {
    const u = item.requesterId;
    return (
        <View style={s.inviteRow}>
            <Pressable onPress={() => onPressUser(u._id)}>
                <Avatar uri={u.profileImageUrl} name={u.displayName || u.firstName} size={44} />
            </Pressable>
            <Pressable style={s.inviteInfo} onPress={() => onPressUser(u._id)}>
                <Text style={s.inviteName} numberOfLines={1}>{u.displayName || u.firstName}</Text>
                <Text style={s.inviteMeta} numberOfLines={1}>
                    {roleLabel(u)}
                    {typeof item.mutuals === 'number' && item.mutuals > 0 ? ` · ${item.mutuals} mutual` : ''}
                </Text>
                {item.message ? (
                    <Text style={s.inviteContext} numberOfLines={1}>“{item.message}”</Text>
                ) : null}
            </Pressable>
            <View style={s.inviteActions}>
                <Pressable
                    onPress={() => onIgnore(item._id)}
                    disabled={busy}
                    style={({ pressed }) => [s.inviteBtnIgnore, pressed && { opacity: 0.5 }]}
                >
                    <X size={14} color={C.text2} strokeWidth={2.5} />
                </Pressable>
                <Pressable
                    onPress={() => onAccept(item._id)}
                    disabled={busy}
                    style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                >
                    <LinearGradient
                        colors={[C.pink, C.orange]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={s.inviteBtnAccept}
                    >
                        <Check size={14} color="#fff" strokeWidth={2.5} />
                    </LinearGradient>
                </Pressable>
            </View>
        </View>
    );
};

const ConnItem = ({ item, currentUserId, onMessage, onPressUser }: {
    item: Connection;
    currentUserId?: string;
    onMessage: (c: Connection) => void;
    onPressUser: (id: string) => void;
}) => {
    const other = item.requesterId._id === currentUserId ? item.recipientId : item.requesterId;
    return (
        <Pressable
            onPress={() => onPressUser(other._id)}
            style={({ pressed }) => [s.connRow, pressed && { backgroundColor: 'rgba(255,255,255,0.02)' }]}
        >
            <Avatar uri={other.profileImageUrl} name={other.displayName || other.firstName} size={44} />
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

const FollowingItem = ({ user, onPressUser }: {
    user: FollowListUser;
    onPressUser: (id: string) => void;
}) => {
    const { unfollow } = useFollowMutations(user._id);
    return (
        <View style={[s.connRow, { paddingHorizontal: 4 }]}>
            <Pressable onPress={() => onPressUser(user._id)}>
                <Avatar uri={user.profileImageUrl} name={user.displayName} size={40} />
            </Pressable>
            <Pressable style={s.connInfo} onPress={() => onPressUser(user._id)}>
                <Text style={s.connName} numberOfLines={1}>{user.displayName}</Text>
                <Text style={s.connMeta} numberOfLines={1}>{roleLabel(user)}</Text>
            </Pressable>
            <Pressable
                onPress={() => unfollow.mutate()}
                disabled={unfollow.isPending}
                style={({ pressed }) => [s.withdrawBtn, pressed && { opacity: 0.5 }]}
            >
                {unfollow.isPending
                    ? <ActivityIndicator size="small" color={C.text2} />
                    : <Text style={s.withdrawBtnText}>Unfollow</Text>}
            </Pressable>
        </View>
    );
};

const PymkCard = ({ suggestion, busy, onConnect, onDismiss, onOpenProfile }: {
    suggestion: PYMKSuggestion;
    busy: boolean;
    onConnect: () => void;
    onDismiss: () => void;
    onOpenProfile: () => void;
}) => {
    return (
        <View style={s.pymkCard}>
            <Pressable onPress={onDismiss} style={s.pymkDismiss} hitSlop={6}>
                <X size={11} color={C.text3} strokeWidth={2} />
            </Pressable>
            <Pressable onPress={onOpenProfile} style={{ alignItems: 'center' }}>
                <LinearGradient
                    colors={[C.pink, C.orange]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.pymkAvatarRing}
                >
                    <View style={s.pymkAvatarInner}>
                        {suggestion.profileImageUrl ? (
                            <Image
                                source={{ uri: suggestion.profileImageUrl }}
                                style={{ width: '100%', height: '100%', borderRadius: 28 }}
                            />
                        ) : (
                            <Text style={s.pymkAvatarInitials}>
                                {initials(suggestion.displayName).toUpperCase()}
                            </Text>
                        )}
                    </View>
                </LinearGradient>
                <Text style={s.pymkName} numberOfLines={1}>{suggestion.displayName}</Text>
                <Text style={s.pymkRole} numberOfLines={1}>
                    {roleLabel(suggestion)}
                </Text>
                <Text style={s.pymkReason} numberOfLines={1}>{suggestion.reason}</Text>
            </Pressable>
            <Pressable
                onPress={onConnect}
                disabled={busy}
                style={({ pressed }) => [s.pymkConnectBtn, pressed && { opacity: 0.7 }]}
            >
                {busy ? (
                    <ActivityIndicator size="small" color={C.pink} />
                ) : (
                    <>
                        <UserPlus size={12} color={C.pink} strokeWidth={2.5} />
                        <Text style={s.pymkConnectText}>CONNECT</Text>
                    </>
                )}
            </Pressable>
        </View>
    );
};

const SentItem = ({ item, currentUserId, onWithdraw, onPressUser, busy }: {
    item: Connection;
    currentUserId?: string;
    onWithdraw: (id: string) => void;
    onPressUser: (id: string) => void;
    busy: boolean;
}) => {
    const other = item.requesterId._id === currentUserId ? item.recipientId : item.requesterId;
    return (
        <View style={[s.connRow, { paddingHorizontal: 4 }]}>
            <Pressable onPress={() => onPressUser(other._id)}>
                <Avatar uri={other.profileImageUrl} name={other.displayName || other.firstName} size={40} />
            </Pressable>
            <Pressable style={s.connInfo} onPress={() => onPressUser(other._id)}>
                <Text style={s.connName} numberOfLines={1}>{other.displayName || other.firstName}</Text>
                <Text style={s.connMeta} numberOfLines={1}>
                    {roleLabel(other)} · Sent {timeAgo(item.createdAt)}
                </Text>
            </Pressable>
            <Pressable
                onPress={() => onWithdraw(item._id)}
                disabled={busy}
                style={({ pressed }) => [s.withdrawBtn, pressed && { opacity: 0.5 }]}
            >
                <Text style={s.withdrawBtnText}>Withdraw</Text>
            </Pressable>
        </View>
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

    const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
    const [sentOpen, setSentOpen] = useState(false);
    const [followingOpen, setFollowingOpen] = useState(false);

    // Follow system (PRD §8.9.5)
    const { data: followCounts } = useFollowCounts(currentUserId);
    const { data: followingList = [] } = useMyFollowing(100);

    // PYMK v2 — artist-search-v2 carousel (new pymkService)
    const { data: pymkV2Data } = usePymk(1, 10);
    const dismissV2Mutation = useDismissPymk();

    const handlePymkV2Connect = async (artistId: string) => {
        try {
            await connectionService.sendConnectionRequest(artistId);
        } catch (e: any) {
            const info = interpretConnectionError(e);
            if (!info.swallow) {
                Alert.alert(info.title, info.message);
            }
        }
    };

    // PYMK — People You May Know
    const { data: pymkData } = usePYMK(12);
    const [dismissedPymk, setDismissedPymk] = useState<Set<string>>(new Set());
    const [connectedPymk, setConnectedPymk] = useState<Set<string>>(new Set());
    const visiblePymk = useMemo(() => {
        const list = pymkData?.suggestions ?? [];
        return list.filter((s) => !dismissedPymk.has(s.userId) && !connectedPymk.has(s.userId));
    }, [pymkData, dismissedPymk, connectedPymk]);

    const markBusy = (id: string, on: boolean) => {
        setBusyIds(prev => {
            const n = new Set(prev);
            if (on) n.add(id); else n.delete(id);
            return n;
        });
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

    // ── Invite actions ──
    const handleAccept = async (id: string) => {
        markBusy(id, true);
        const prev = invitations;
        setInvitations(curr => curr.filter(i => i._id !== id));
        try {
            const res = await connectionService.acceptConnectionRequest(id);
            if (res?.success && res.data) {
                setConnections(cs => [res.data, ...cs]);
            } else {
                await fetchAll();
            }
        } catch (e) {
            console.error('[network] accept failed', e);
            setInvitations(prev);
        } finally {
            markBusy(id, false);
        }
    };

    const handleIgnore = async (id: string) => {
        markBusy(id, true);
        const prev = invitations;
        setInvitations(curr => curr.filter(i => i._id !== id));
        try {
            await connectionService.rejectConnectionRequest(id);
        } catch (e) {
            console.error('[network] ignore failed', e);
            setInvitations(prev);
        } finally {
            markBusy(id, false);
        }
    };

    const handleWithdraw = async (id: string) => {
        markBusy(id, true);
        const prev = sentRequests;
        setSentRequests(curr => curr.filter(s => s._id !== id));
        try {
            await connectionService.withdrawConnectionRequest(id);
        } catch (e) {
            console.error('[network] withdraw failed', e);
            setSentRequests(prev);
        } finally {
            markBusy(id, false);
        }
    };

    // PYMK actions
    const handlePymkConnect = async (suggestion: PYMKSuggestion) => {
        markBusy(suggestion.userId, true);
        // Optimistic hide
        setConnectedPymk(prev => new Set(prev).add(suggestion.userId));
        try {
            await connectionService.sendConnectionRequest(suggestion.userId);
        } catch (e: any) {
            const info = interpretConnectionError(e);
            if (!info.swallow) {
                // Rollback optimistic hide on hard error + show message
                setConnectedPymk(prev => {
                    const n = new Set(prev);
                    n.delete(suggestion.userId);
                    return n;
                });
                Alert.alert(info.title, info.message);
            }
        } finally {
            markBusy(suggestion.userId, false);
        }
    };

    const handlePymkDismiss = (userId: string) => {
        setDismissedPymk(prev => new Set(prev).add(userId));
    };

    const openMessage = async (conn: Connection) => {
        const other = conn.requesterId._id === currentUserId ? conn.recipientId : conn.requesterId;
        try {
            const convo = await conversationService.createConversation(other._id);
            const convoId = (convo as any)?._id;
            if (convoId) {
                router.push(`/(app)/messages?c=${convoId}` as any);
            } else {
                router.push('/(app)/messages' as any);
            }
        } catch (e) {
            console.error('[network] openMessage failed', e);
            router.push('/(app)/messages' as any);
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
                return other.role !== 'hirer';
            });
        } else if (activeFilter === 'hirers') {
            list = list.filter(c => {
                const other = c.requesterId._id === currentUserId ? c.recipientId : c.requesterId;
                return other.role === 'hirer';
            });
        } else if (activeFilter === 'recent') {
            list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);
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

    const connCount = connections.length;
    const inviteCount = invitations.length;
    const sentCount = sentRequests.length;
    // hasAny = should we render the rich-state body (vs the empty hero)?
    // User has content if they have connections, invites, or anyone they follow.
    const hasAny = inviteCount + connCount + followingList.length > 0;

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
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                        <Pressable onPress={() => setSearchOpen(v => !v)} style={s.iconBtn} hitSlop={8}>
                            <Search size={18} color={searchOpen ? C.orange : C.text2} strokeWidth={2} />
                        </Pressable>
                        <NotificationsBell size={18} color={C.text2} />
                    </View>
                </View>

                {loading ? (
                    <View style={s.loadingWrap}>
                        <ActivityIndicator size="large" color={C.orange} />
                        <Text style={s.loadingText}>Loading your network…</Text>
                    </View>
                ) : (
                    <AppScrollView
                        contentContainerStyle={{ paddingBottom: 40 }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.text2} />}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Empty hero — truly new user */}
                        {!hasAny && (
                            <View style={s.emptyHero}>
                                <LinearGradient
                                    colors={[C.pink, C.orange]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={s.emptyIcon}
                                >
                                    <Users size={28} color="#fff" strokeWidth={2} />
                                </LinearGradient>
                                <Text style={s.emptyTitle}>Build Your Crew</Text>
                                <Text style={s.emptyDesc}>
                                    Start connecting with artists and hirers. Your network helps you find better gigs and builds trust.
                                </Text>
                                <Pressable
                                    onPress={() => router.push('/gigs' as any)}
                                    style={({ pressed }) => [pressed && { opacity: 0.8 }]}
                                >
                                    <LinearGradient
                                        colors={[C.pink, C.orange]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={s.emptyCta}
                                    >
                                        <Sparkles size={14} color="#fff" strokeWidth={2.5} />
                                        <Text style={s.emptyCtaText}>Discover Artists</Text>
                                    </LinearGradient>
                                </Pressable>
                            </View>
                        )}

                        {/* Invitations link — opens /network/invitations (Received / Sent tabs) */}
                        {(inviteCount > 0 || sentCount > 0) && (
                            <Pressable
                                onPress={() => router.push('/(app)/network/invitations' as any)}
                                style={({ pressed }) => [s.invitesLink, pressed && { opacity: 0.85 }]}
                            >
                                <View style={s.invitesLinkLeft}>
                                    {inviteCount > 0 ? <PulseDot /> : null}
                                    <Text style={s.invitesLinkTitle}>Invitations</Text>
                                    {inviteCount > 0 ? (
                                        <LinearGradient
                                            colors={[C.pink, C.orange]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={s.invitesLinkBadge}
                                        >
                                            <Text style={s.invitesLinkBadgeText}>{inviteCount}</Text>
                                        </LinearGradient>
                                    ) : null}
                                </View>
                                <View style={s.invitesLinkRight}>
                                    <Text style={s.invitesLinkMeta}>
                                        {inviteCount > 0 ? `${inviteCount} received` : ''}
                                        {inviteCount > 0 && sentCount > 0 ? '  ·  ' : ''}
                                        {sentCount > 0 ? `${sentCount} sent` : ''}
                                    </Text>
                                    <ChevronRight size={16} color={C.text3} strokeWidth={2} />
                                </View>
                            </Pressable>
                        )}

                        {/* Inbox zero — have connections but no invites */}
                        {hasAny && inviteCount === 0 && (
                            <View style={s.inboxZeroCard}>
                                <View style={s.inboxZeroIcon}>
                                    <CheckCheck size={16} color={C.green} strokeWidth={2.5} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.inboxZeroTitle}>All caught up</Text>
                                    <Text style={s.inboxZeroDesc}>No pending invitations right now.</Text>
                                </View>
                            </View>
                        )}

                        {/* Stats strip */}
                        {hasAny && (
                            <View style={s.statsStrip}>
                                <View style={s.statPill}>
                                    <Text style={s.statNum}>{connCount}</Text>
                                    <Text style={s.statName}>connections</Text>
                                </View>
                                <View style={s.statSep} />
                                <View style={s.statPill}>
                                    <Text style={s.statNum}>{followCounts?.followers ?? 0}</Text>
                                    <Text style={s.statName}>{(followCounts?.followers ?? 0) === 1 ? 'follower' : 'followers'}</Text>
                                </View>
                                <View style={s.statSep} />
                                <View style={s.statPill}>
                                    <Text style={s.statNum}>{followCounts?.following ?? 0}</Text>
                                    <Text style={s.statName}>following</Text>
                                </View>
                            </View>
                        )}

                        {/* PYMK v2 carousel — artist-search-v2 (new pymkService) */}
                        <PYMKCarousel
                            items={pymkV2Data?.items ?? []}
                            onConnect={handlePymkV2Connect}
                            onDismiss={(id) => dismissV2Mutation.mutate(id)}
                            onSeeAll={() => router.push('/(app)/network/pymk' as any)}
                        />

                        {/* PYMK — People You May Know (PRD §8.9.8) */}
                        {visiblePymk.length > 0 && (
                            <>
                                <View style={s.sectionHead}>
                                    <Text style={s.sectionTitle}>People You May Know</Text>
                                    {pymkData?.cached && (
                                        <Text style={s.sectionMeta}>cached</Text>
                                    )}
                                </View>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={s.pymkScroll}
                                >
                                    {visiblePymk.map((sug) => (
                                        <PymkCard
                                            key={sug.userId}
                                            suggestion={sug}
                                            busy={busyIds.has(sug.userId)}
                                            onConnect={() => handlePymkConnect(sug)}
                                            onDismiss={() => handlePymkDismiss(sug.userId)}
                                            onOpenProfile={() => goProfile(sug.userId)}
                                        />
                                    ))}
                                </ScrollView>
                            </>
                        )}

                        {/* Search bar (toggle) */}
                        {hasAny && searchOpen && (
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

                        {/* Filter chips + sort */}
                        {connCount > 0 && (
                            <View style={s.filterRow}>
                                {(['all', 'artists', 'hirers', 'recent'] as FilterKey[]).map(key => {
                                    const active = activeFilter === key;
                                    return (
                                        <Pressable
                                            key={key}
                                            onPress={() => setActiveFilter(key)}
                                            style={[s.filterChip, active && s.filterChipActive]}
                                        >
                                            <Text style={[s.filterChipText, active && s.filterChipTextActive]}>
                                                {key === 'all' ? 'All' : key === 'artists' ? 'Artists' : key === 'hirers' ? 'Hirers' : 'Recent'}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                                <View style={s.sortBtn}>
                                    <ArrowUpDown size={11} color={C.text2} strokeWidth={2} />
                                    <Text style={s.sortBtnText}>Recent</Text>
                                </View>
                            </View>
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

                        {/* Connections list */}
                        {connCount > 0 && (
                            <View style={s.connList}>
                                {filteredConnections.length === 0 ? (
                                    <View style={s.noResults}>
                                        <Text style={s.noResultsText}>
                                            {searchQuery ? `No matches for “${searchQuery}”` : 'No results in this filter.'}
                                        </Text>
                                    </View>
                                ) : (
                                    filteredConnections.map(c => (
                                        <ConnItem
                                            key={c._id}
                                            item={c}
                                            currentUserId={currentUserId}
                                            onMessage={openMessage}
                                            onPressUser={goProfile}
                                        />
                                    ))
                                )}
                            </View>
                        )}

                        {/* Sent requests moved to /network/invitations (Sent tab) */}

                        {/* Following collapsible (PRD §8.9.5) */}
                        {followingList.length > 0 && (
                            <>
                                <Pressable
                                    onPress={() => setFollowingOpen(v => !v)}
                                    style={({ pressed }) => [s.collapse, pressed && { opacity: 0.8 }]}
                                >
                                    <View style={s.collapseLeft}>
                                        <View style={s.collapseIcon}>
                                            <UserPlus size={14} color={C.text2} strokeWidth={2} />
                                        </View>
                                        <Text style={s.collapseTitle}>Following</Text>
                                        <Text style={s.collapseCount}>
                                            {followingList.length} {followingList.length === 1 ? 'artist' : 'artists'}
                                        </Text>
                                    </View>
                                    {followingOpen ? (
                                        <ChevronUp size={16} color={C.text3} strokeWidth={2} />
                                    ) : (
                                        <ChevronDown size={16} color={C.text3} strokeWidth={2} />
                                    )}
                                </Pressable>
                                {followingOpen && (
                                    <View style={s.sentList}>
                                        {followingList.map(f => (
                                            <FollowingItem
                                                key={f._id}
                                                user={f}
                                                onPressUser={goProfile}
                                            />
                                        ))}
                                    </View>
                                )}
                            </>
                        )}
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
        width: 8, height: 8, borderRadius: 4, backgroundColor: C.pink,
    },
    pulseDotRing: {
        position: 'absolute', top: 0, left: 0,
        width: 8, height: 8, borderRadius: 4, backgroundColor: C.pink,
    },

    // Invites link row (replaces former hero) — opens /network/invitations
    invitesLink: {
        marginHorizontal: 14, marginTop: 10, marginBottom: 8,
        paddingVertical: 14, paddingHorizontal: 16,
        borderRadius: 14,
        backgroundColor: 'rgba(236,72,153,0.06)',
        borderWidth: 1, borderColor: 'rgba(236,72,153,0.18)',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    invitesLinkLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    invitesLinkRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    invitesLinkTitle: {
        fontSize: 14, color: C.text, fontFamily: 'Outfit-SemiBold',
        letterSpacing: 0.2,
    },
    invitesLinkBadge: {
        paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, minWidth: 22, alignItems: 'center',
    },
    invitesLinkBadgeText: { color: '#fff', fontSize: 11, fontFamily: 'Outfit-ExtraBold' },
    invitesLinkMeta: { color: C.text3, fontSize: 11, fontFamily: 'Outfit-Regular' },

    // Invites hero (kept for any legacy refs)
    invitesHero: {
        marginHorizontal: 14, marginTop: 8,
        borderRadius: 22,
        backgroundColor: '#1e0e1c',
        borderWidth: 1, borderColor: C.borderPink,
        padding: 18,
    },
    invitesHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    invitesPulse: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    invitesLabel: {
        fontSize: 10, fontWeight: '700', color: C.pink,
        textTransform: 'uppercase', letterSpacing: 2,
        fontFamily: 'Outfit-Bold',
    },
    invitesCountBadge: {
        paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100,
    },
    invitesCountText: { fontSize: 11, fontWeight: '800', color: '#fff', fontFamily: 'Outfit-ExtraBold' },

    inviteRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    inviteInfo: { flex: 1, minWidth: 0 },
    inviteName: { fontSize: 13, fontWeight: '700', color: C.text, fontFamily: 'Outfit-Bold' },
    inviteMeta: { fontSize: 11, color: C.text3, marginTop: 1, fontFamily: 'Outfit-Regular' },
    inviteContext: { fontSize: 11, color: C.text2, fontStyle: 'italic', marginTop: 2, fontFamily: 'Outfit-Regular' },
    inviteActions: { flexDirection: 'row', gap: 6 },
    inviteBtnAccept: {
        width: 32, height: 32, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    inviteBtnIgnore: {
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1, borderColor: C.border,
        alignItems: 'center', justifyContent: 'center',
    },
    invitesFooter: {
        marginTop: 14, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    invitesExpire: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    invitesExpireText: { fontSize: 10, color: C.text3, fontFamily: 'Outfit-Regular' },
    viewAllBtn: {
        fontSize: 11, fontWeight: '700', color: C.orange,
        textTransform: 'uppercase', letterSpacing: 1.5,
        fontFamily: 'Outfit-Bold',
    },

    // Inbox zero card
    inboxZeroCard: {
        marginHorizontal: 14, marginTop: 8,
        padding: 14, borderRadius: 14,
        backgroundColor: 'rgba(52,211,153,0.06)',
        borderWidth: 1, borderColor: 'rgba(52,211,153,0.18)',
        flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    inboxZeroIcon: {
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: 'rgba(52,211,153,0.12)',
        alignItems: 'center', justifyContent: 'center',
    },
    inboxZeroTitle: { fontSize: 13, fontWeight: '700', color: C.text, fontFamily: 'Outfit-Bold' },
    inboxZeroDesc: { fontSize: 11, color: C.text3, marginTop: 1, fontFamily: 'Outfit-Regular' },

    // Stats strip
    statsStrip: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        gap: 10, paddingTop: 18, paddingHorizontal: 20, flexWrap: 'wrap',
    },
    statPill: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    statNum: { fontWeight: '900', fontSize: 18, color: C.text, letterSpacing: -0.5, fontFamily: 'Outfit-Black' },
    statName: { fontSize: 12, color: C.text3, fontFamily: 'Outfit-Regular' },
    statSep: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.text4 },

    // PYMK carousel
    pymkScroll: {
        paddingHorizontal: 14,
        paddingBottom: 4,
        gap: 10,
    },
    pymkCard: {
        width: 150,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: 'rgba(30,28,38,0.5)',
        paddingVertical: 16,
        paddingHorizontal: 12,
        alignItems: 'center',
        position: 'relative',
    },
    pymkDismiss: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    pymkAvatarRing: {
        width: 60,
        height: 60,
        borderRadius: 30,
        padding: 2,
        marginBottom: 10,
    },
    pymkAvatarInner: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
        backgroundColor: C.surface2,
        borderWidth: 2,
        borderColor: C.bg,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    pymkAvatarInitials: {
        fontSize: 18,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.35)',
        fontFamily: 'Outfit-ExtraBold',
    },
    pymkName: {
        fontSize: 13,
        fontFamily: 'Outfit-Bold',
        color: C.text,
        marginBottom: 2,
        textAlign: 'center',
        maxWidth: 126,
    },
    pymkRole: {
        fontSize: 10,
        color: C.text3,
        marginBottom: 4,
        textAlign: 'center',
        maxWidth: 126,
        fontFamily: 'Outfit-Regular',
    },
    pymkReason: {
        fontSize: 10,
        color: C.cyan,
        marginBottom: 10,
        fontFamily: 'Outfit-SemiBold',
        textAlign: 'center',
        maxWidth: 126,
    },
    pymkConnectBtn: {
        width: '100%',
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: 'rgba(236,72,153,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(236,72,153,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 4,
    },
    pymkConnectText: {
        color: C.pink,
        fontSize: 10,
        fontFamily: 'Outfit-Bold',
        letterSpacing: 1,
    },

    // Search
    searchWrap: {
        marginHorizontal: 14, marginTop: 12,
        paddingHorizontal: 14, paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1, borderColor: C.border,
        flexDirection: 'row', alignItems: 'center', gap: 10,
    },
    searchInput: {
        flex: 1, color: C.text, fontSize: 13, padding: 0,
        fontFamily: 'Outfit-Regular',
    },

    // Filter chips
    filterRow: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingTop: 12,
    },
    filterChip: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1, borderColor: C.border,
    },
    filterChipActive: {
        backgroundColor: 'rgba(249,115,22,0.1)',
        borderColor: 'rgba(249,115,22,0.3)',
    },
    filterChipText: { fontSize: 11, color: C.text2, fontFamily: 'Outfit-Regular' },
    filterChipTextActive: { color: C.orange, fontWeight: '700', fontFamily: 'Outfit-Bold' },
    sortBtn: {
        marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1, borderColor: C.border,
    },
    sortBtnText: { fontSize: 11, color: C.text2, fontFamily: 'Outfit-Regular' },

    // Section header
    sectionHead: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 24, paddingBottom: 4,
    },
    sectionTitle: {
        fontSize: 11, fontWeight: '700', color: C.text2,
        textTransform: 'uppercase', letterSpacing: 2,
        fontFamily: 'Outfit-Bold',
    },
    sectionMeta: { fontSize: 11, color: C.text3, fontFamily: 'Outfit-Regular' },

    // Conn list
    connList: { marginTop: 8 },
    connRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 20, paddingVertical: 12,
    },
    connInfo: { flex: 1, minWidth: 0 },
    connName: { fontSize: 14, fontWeight: '600', color: C.text, fontFamily: 'Outfit-SemiBold' },
    connMeta: { fontSize: 11, color: C.text3, marginTop: 2, fontFamily: 'Outfit-Regular' },
    connAction: {
        width: 36, height: 36, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1, borderColor: C.border,
        alignItems: 'center', justifyContent: 'center',
    },

    // No results
    noResults: { paddingVertical: 40, alignItems: 'center' },
    noResultsText: { color: C.text3, fontSize: 13, fontFamily: 'Outfit-Regular' },

    // Collapse
    collapse: {
        marginHorizontal: 14, marginTop: 14,
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 14, borderWidth: 1, borderColor: C.border,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    collapseLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    collapseIcon: {
        width: 28, height: 28, borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center', justifyContent: 'center',
    },
    collapseTitle: { fontSize: 13, fontWeight: '600', color: C.text, fontFamily: 'Outfit-SemiBold' },
    collapseCount: { fontSize: 12, color: C.text3, fontFamily: 'Outfit-Regular' },
    sentList: { marginHorizontal: 14, marginTop: 8, paddingHorizontal: 12, paddingVertical: 4 },

    withdrawBtn: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1, borderColor: C.border,
    },
    withdrawBtnText: {
        fontSize: 11, fontWeight: '700', color: C.text2,
        textTransform: 'uppercase', letterSpacing: 1,
        fontFamily: 'Outfit-Bold',
    },

    // Empty hero
    emptyHero: {
        marginHorizontal: 14, marginTop: 40,
        paddingHorizontal: 20, paddingVertical: 32,
        alignItems: 'center',
        borderRadius: 22,
        backgroundColor: 'rgba(18,16,24,0.6)',
        borderWidth: 1, borderColor: C.border,
    },
    emptyIcon: {
        width: 64, height: 64, borderRadius: 32, marginBottom: 16,
        alignItems: 'center', justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 22, color: C.text, marginBottom: 6,
        fontFamily: 'DMSerifDisplay_400Regular',
    },
    emptyDesc: {
        fontSize: 13, color: C.text2, textAlign: 'center', lineHeight: 19,
        marginBottom: 18, maxWidth: 260,
        fontFamily: 'Outfit-Regular',
    },
    emptyCta: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
    },
    emptyCtaText: {
        fontSize: 13, fontWeight: '700', color: '#fff',
        textTransform: 'uppercase', letterSpacing: 1,
        fontFamily: 'Outfit-Bold',
    },
});
