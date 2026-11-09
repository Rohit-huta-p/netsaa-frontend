// app/(app)/network/invitations.tsx
import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    Pressable,
    Image,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, Check, X, Clock, Inbox, Send } from 'lucide-react-native';
import connectionService from '@/services/connectionService';
import { useAuthStore } from '@/stores/authStore';
import { interpretConnectionError } from '@/utils/connectionErrors';
import { Connection, ConnectionRequest } from '@/types/connection';
import { SentRequestRow } from '@/components/connections/SentRequestRow';

// ── Constants ──
// A·Minimal palette (locked tokens — same family as /network, gigs, CL home, notifications)
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

type TabKey = 'received' | 'sent';

// ── Small helpers (copies of network.tsx helpers — kept local to keep file self-contained) ──
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

const fallbackName = (u: any) =>
    u?.displayName || u?.firstName || (u?._id ? `User ${String(u._id).slice(-4)}` : 'Unknown');

// Drop accidental duplicate rows (same _id) so a stale double-insert can't render twice.
const dedupeById = <T extends { _id: string }>(arr: T[]): T[] => {
    const seen = new Set<string>();
    return arr.filter((x) => (seen.has(x._id) ? false : (seen.add(x._id), true)));
};

const Avatar = ({ uri, name, size = 44 }: { uri?: string; name?: string; size?: number }) => {
    if (uri) {
        return (
            <Image
                source={{ uri }}
                style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.avatarbg }}
            />
        );
    }
    return (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: C.avatarbg,
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Text style={{ color: C.text1, fontFamily: 'Outfit-Bold', fontSize: size * 0.32 }}>
                {initials(name).toUpperCase()}
            </Text>
        </View>
    );
};

// ── Received row ──
const ReceivedRow = ({
    item,
    onAccept,
    onIgnore,
    onPressUser,
    busy,
}: {
    item: ConnectionRequest;
    onAccept: (id: string) => void;
    onIgnore: (id: string) => void;
    onPressUser: (id: string) => void;
    busy: boolean;
}) => {
    const u = item.requesterId as any;
    const name = fallbackName(u);
    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                paddingHorizontal: 4,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
            }}
        >
            <Pressable onPress={() => u?._id && onPressUser(u._id)}>
                <Avatar uri={u?.profileImageUrl} name={name} size={44} />
            </Pressable>
            <Pressable
                style={{ flex: 1, marginLeft: 12, marginRight: 8 }}
                onPress={() => u?._id && onPressUser(u._id)}
            >
                <Text
                    style={{ color: C.text, fontFamily: 'Outfit-SemiBold', fontSize: 15 }}
                    numberOfLines={1}
                >
                    {name}
                </Text>
                <Text style={{ color: C.text3, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                    {roleLabel(u)} · {timeAgo(item.createdAt)}
                </Text>
                {item.message ? (
                    <Text
                        style={{ color: C.text4, fontSize: 11, marginTop: 3, fontStyle: 'italic' }}
                        numberOfLines={1}
                    >
                        “{item.message}”
                    </Text>
                ) : null}
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                    onPress={() => onIgnore(item._id)}
                    disabled={busy}
                    style={({ pressed }) => ({
                        width: 36,
                        height: 36,
                        borderRadius: 11,
                        backgroundColor: C.surface2,
                        borderWidth: 1,
                        borderColor: C.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.5 : 1,
                    })}
                >
                    <X size={15} color={C.text2} strokeWidth={2.5} />
                </Pressable>
                <Pressable
                    onPress={() => onAccept(item._id)}
                    disabled={busy}
                    style={({ pressed }) => ({
                        width: 36,
                        height: 36,
                        borderRadius: 11,
                        backgroundColor: C.orange,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.7 : 1,
                    })}
                >
                    <Check size={15} color={C.ink} strokeWidth={2.5} />
                </Pressable>
            </View>
        </View>
    );
};

// ── Page ──
export default function InvitationsPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const currentUserId = user?._id;

    const [tab, setTab] = useState<TabKey>('received');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [received, setReceived] = useState<ConnectionRequest[]>([]);
    const [sent, setSent] = useState<Connection[]>([]);
    const [busy, setBusy] = useState<Set<string>>(new Set());

    const markBusy = (id: string, on: boolean) =>
        setBusy((prev) => {
            const n = new Set(prev);
            if (on) n.add(id);
            else n.delete(id);
            return n;
        });

    const fetchAll = useCallback(async () => {
        try {
            const [r, s] = await Promise.all([
                connectionService.getConnectionRequests(),
                connectionService.getSentConnectionRequests(),
            ]);
            setReceived(dedupeById(r || []));
            setSent(dedupeById(s || []));
        } catch (e) {
            console.error('[invitations] fetch failed', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Refetch whenever the screen regains focus (not just on mount) so the list
    // reconverges with the server and never shows a request that's already gone.
    useFocusEffect(
        useCallback(() => {
            fetchAll();
        }, [fetchAll])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchAll();
    };

    const goProfile = (id: string) => router.push(`/profile/${id}` as any);

    const handleAccept = async (id: string) => {
        markBusy(id, true);
        const prev = received;
        setReceived((r) => r.filter((i) => i._id !== id));
        try {
            await connectionService.acceptConnectionRequest(id);
        } catch (e: any) {
            const info = interpretConnectionError(e);
            if (info.swallow) {
                // Already resolved/gone server-side — keep it removed and reconverge.
                fetchAll();
            } else {
                Alert.alert(info.title, info.message);
                setReceived(prev); // genuine, retryable error → restore the row
            }
        } finally {
            markBusy(id, false);
        }
    };

    const handleIgnore = async (id: string) => {
        markBusy(id, true);
        const prev = received;
        setReceived((r) => r.filter((i) => i._id !== id));
        try {
            await connectionService.rejectConnectionRequest(id);
        } catch (e: any) {
            const info = interpretConnectionError(e);
            if (info.swallow) {
                fetchAll(); // request already gone — keep it removed, reconverge
            } else {
                Alert.alert(info.title, info.message);
                setReceived(prev);
            }
        } finally {
            markBusy(id, false);
        }
    };

    const handleWithdraw = async (id: string) => {
        markBusy(id, true);
        const prev = sent;
        setSent((s) => s.filter((i) => i._id !== id));
        try {
            await connectionService.withdrawConnectionRequest(id);
        } catch (e: any) {
            const info = interpretConnectionError(e);
            if (info.swallow) {
                fetchAll();
            } else {
                Alert.alert(info.title, info.message);
                setSent(prev);
            }
        } finally {
            markBusy(id, false);
        }
    };

    const TabBtn = ({ k, label, count }: { k: TabKey; label: string; count: number }) => {
        const active = tab === k;
        return (
            <Pressable
                onPress={() => setTab(k)}
                style={{ marginRight: 24, paddingBottom: 11, position: 'relative' }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                        style={{
                            color: active ? C.text : C.text3,
                            fontFamily: 'Outfit-SemiBold',
                            fontSize: 14,
                            letterSpacing: 0.3,
                        }}
                    >
                        {label}
                    </Text>
                    <Text
                        style={{
                            color: active ? C.orange : C.text4,
                            fontSize: 11,
                            fontFamily: 'SpaceMono',
                            marginLeft: 6,
                        }}
                    >
                        {String(count).padStart(2, '0')}
                    </Text>
                </View>
                {active ? (
                    <View
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: -1,
                            height: 2,
                            backgroundColor: C.orange,
                        }}
                    />
                ) : null}
            </Pressable>
        );
    };

    const list = tab === 'received' ? received : sent;

    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                {/* Header */}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingTop: 12,
                        paddingBottom: 10,
                    }}
                >
                    <Pressable
                        onPress={() => router.back()}
                        style={({ pressed }) => ({
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            borderWidth: 1,
                            borderColor: C.border,
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: pressed ? 0.6 : 1,
                            marginRight: 13,
                        })}
                    >
                        <ChevronLeft size={18} color={C.text2} />
                    </Pressable>
                    <View>
                        <Text
                            style={{
                                color: C.text3,
                                fontFamily: 'SpaceMono',
                                fontSize: 10,
                                letterSpacing: 3,
                            }}
                        >
                            NETWORK
                        </Text>
                        <Text
                            style={{
                                color: C.text,
                                fontFamily: 'DMSerifDisplay_400Regular',
                                fontSize: 24,
                                ...(Platform.OS === 'web' ? { fontStyle: 'italic' as any } : {}),
                                marginTop: 2,
                            }}
                        >
                            Invitations
                        </Text>
                    </View>
                </View>

                {/* Tabs */}
                <View
                    style={{
                        flexDirection: 'row',
                        paddingHorizontal: 20,
                        marginTop: 4,
                        borderBottomWidth: 1,
                        borderBottomColor: C.border,
                    }}
                >
                    <TabBtn k="received" label="Received" count={received.length} />
                    <TabBtn k="sent" label="Sent" count={sent.length} />
                </View>

                {/* Body */}
                <ScrollView
                    contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={C.text3}
                        />
                    }
                >
                    {!loading && tab === 'sent' && sent.length > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingTop: 2, paddingBottom: 12 }}>
                            <Clock size={13} color={C.text3} strokeWidth={2} />
                            <Text style={{ color: C.text2, fontSize: 12, fontFamily: 'Outfit-Regular' }}>
                                {sent.length} pending — they join your network once accepted.
                            </Text>
                        </View>
                    )}

                    {loading ? (
                        <View style={{ marginTop: 80, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color={C.orange} />
                        </View>
                    ) : list.length === 0 ? (
                        <View style={{ marginTop: 70, alignItems: 'center', paddingHorizontal: 24 }}>
                            <View
                                style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 32,
                                    backgroundColor: C.orangeSoft,
                                    borderWidth: 1,
                                    borderColor: C.orangeLine,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 16,
                                }}
                            >
                                {tab === 'received' ? (
                                    <Inbox size={26} color={C.orange} strokeWidth={2} />
                                ) : (
                                    <Send size={26} color={C.orange} strokeWidth={2} />
                                )}
                            </View>
                            <Text
                                style={{
                                    fontFamily: 'DMSerifDisplay_400Regular',
                                    color: C.text,
                                    fontSize: 21,
                                    marginBottom: 8,
                                    textAlign: 'center',
                                }}
                            >
                                {tab === 'received' ? 'No invitations yet' : 'Nothing pending'}
                            </Text>
                            <Text style={{ color: C.text3, fontSize: 12.5, lineHeight: 19, textAlign: 'center', maxWidth: 240 }}>
                                {tab === 'received'
                                    ? 'When someone asks to connect, their request lands here for you to accept.'
                                    : 'Requests you send show here until they’re accepted into your network.'}
                            </Text>
                        </View>
                    ) : tab === 'received' ? (
                        received.map((i) => (
                            <ReceivedRow
                                key={i._id}
                                item={i}
                                onAccept={handleAccept}
                                onIgnore={handleIgnore}
                                onPressUser={goProfile}
                                busy={busy.has(i._id)}
                            />
                        ))
                    ) : (
                        sent.map((s) => (
                            <SentRequestRow
                                key={s._id}
                                item={s}
                                currentUserId={currentUserId}
                                onWithdraw={handleWithdraw}
                                onPressUser={goProfile}
                                busy={busy.has(s._id)}
                            />
                        ))
                    )}

                    {!loading && tab === 'sent' && sent.length > 0 && (
                        <Text style={{ textAlign: 'center', color: C.text4, fontSize: 11, marginTop: 8, fontFamily: 'Outfit-Regular' }}>
                            Accepted requests move to your connections
                        </Text>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
