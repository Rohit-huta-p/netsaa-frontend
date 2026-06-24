// app/(app)/network/invitations.tsx
import React, { useCallback, useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Check, X } from 'lucide-react-native';
import connectionService from '@/services/connectionService';
import { useAuthStore } from '@/stores/authStore';
import { interpretConnectionError } from '@/utils/connectionErrors';
import { Connection, ConnectionRequest } from '@/types/connection';

// ── Constants ──
const C = {
    bg: '#0a0807',
    surface: 'rgba(255,255,255,0.03)',
    surface2: '#1a1822',
    text1: '#F5F0EB',
    text2: '#A19BAA',
    text3: '#4A4656',
    border: 'rgba(255,255,255,0.06)',
    pink: '#EC4899',
    orange: '#FF6B35',
    gold: '#D4A155',
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

const Avatar = ({ uri, name, size = 44 }: { uri?: string; name?: string; size?: number }) => {
    if (uri) {
        return (
            <Image
                source={{ uri }}
                style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.surface2 }}
            />
        );
    }
    return (
        <LinearGradient
            colors={[C.pink, C.orange]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.32 }}>
                {initials(name).toUpperCase()}
            </Text>
        </LinearGradient>
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
                    style={{ color: C.text1, fontFamily: 'Outfit-SemiBold', fontSize: 15 }}
                    numberOfLines={1}
                >
                    {name}
                </Text>
                <Text style={{ color: C.text2, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                    {roleLabel(u)} · {timeAgo(item.createdAt)}
                </Text>
                {item.message ? (
                    <Text
                        style={{ color: C.text3, fontSize: 11, marginTop: 3, fontStyle: 'italic' }}
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
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.5 : 1,
                    })}
                >
                    <X size={14} color={C.text2} strokeWidth={2.5} />
                </Pressable>
                <Pressable
                    onPress={() => onAccept(item._id)}
                    disabled={busy}
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                    <LinearGradient
                        colors={[C.pink, C.orange]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Check size={14} color="#fff" strokeWidth={2.5} />
                    </LinearGradient>
                </Pressable>
            </View>
        </View>
    );
};

// ── Sent row ──
const SentRow = ({
    item,
    currentUserId,
    onWithdraw,
    onPressUser,
    busy,
}: {
    item: Connection;
    currentUserId?: string;
    onWithdraw: (id: string) => void;
    onPressUser: (id: string) => void;
    busy: boolean;
}) => {
    const requesterId = (item.requesterId as any)?._id || item.requesterId;
    const other: any = requesterId === currentUserId ? item.recipientId : item.requesterId;
    const name = fallbackName(other);
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
            <Pressable onPress={() => other?._id && onPressUser(other._id)}>
                <Avatar uri={other?.profileImageUrl} name={name} size={44} />
            </Pressable>
            <Pressable
                style={{ flex: 1, marginLeft: 12, marginRight: 8 }}
                onPress={() => other?._id && onPressUser(other._id)}
            >
                <Text
                    style={{ color: C.text1, fontFamily: 'Outfit-SemiBold', fontSize: 15 }}
                    numberOfLines={1}
                >
                    {name}
                </Text>
                <Text style={{ color: C.text2, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                    {roleLabel(other)} · Sent {timeAgo(item.createdAt)}
                </Text>
            </Pressable>
            <Pressable
                onPress={() => onWithdraw(item._id)}
                disabled={busy}
                style={({ pressed }) => ({
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.2)',
                    opacity: pressed ? 0.5 : 1,
                })}
            >
                {busy ? (
                    <ActivityIndicator size="small" color={C.text2} />
                ) : (
                    <Text style={{ color: C.text2, fontSize: 11, fontFamily: 'Outfit-SemiBold' }}>
                        Withdraw
                    </Text>
                )}
            </Pressable>
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
            setReceived(r || []);
            setSent(s || []);
        } catch (e) {
            console.error('[invitations] fetch failed', e);
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

    const goProfile = (id: string) => router.push(`/profile/${id}` as any);

    const handleAccept = async (id: string) => {
        markBusy(id, true);
        const prev = received;
        setReceived((r) => r.filter((i) => i._id !== id));
        try {
            await connectionService.acceptConnectionRequest(id);
        } catch (e: any) {
            const info = interpretConnectionError(e);
            if (!info.swallow) Alert.alert(info.title, info.message);
            setReceived(prev);
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
        } catch {
            setReceived(prev);
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
            if (!info.swallow) Alert.alert(info.title, info.message);
            setSent(prev);
        } finally {
            markBusy(id, false);
        }
    };

    const TabBtn = ({ k, label, count }: { k: TabKey; label: string; count: number }) => {
        const active = tab === k;
        return (
            <Pressable
                onPress={() => setTab(k)}
                style={{ marginRight: 24, paddingBottom: 10, position: 'relative' }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                        style={{
                            color: active ? C.text1 : C.text2,
                            fontFamily: 'Outfit-SemiBold',
                            fontSize: 14,
                            letterSpacing: 0.3,
                        }}
                    >
                        {label}
                    </Text>
                    <Text
                        style={{
                            color: active ? C.gold : C.text3,
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
                        paddingBottom: 8,
                    }}
                >
                    <Pressable
                        onPress={() => router.back()}
                        style={({ pressed }) => ({
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: pressed ? 0.6 : 1,
                            marginRight: 12,
                        })}
                    >
                        <ChevronLeft size={18} color={C.text2} />
                    </Pressable>
                    <View>
                        <Text
                            style={{
                                color: C.gold,
                                fontFamily: 'SpaceMono',
                                fontSize: 10,
                                letterSpacing: 3,
                            }}
                        >
                            NETWORK
                        </Text>
                        <Text
                            style={{
                                color: C.text1,
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
                            tintColor={C.gold}
                        />
                    }
                >
                    {loading ? (
                        <View style={{ marginTop: 80, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color={C.gold} />
                        </View>
                    ) : list.length === 0 ? (
                        <View style={{ marginTop: 80, alignItems: 'center' }}>
                            <Text
                                style={{
                                    fontFamily: 'DMSerifDisplay_400Regular',
                                    color: C.text3,
                                    fontSize: 28,
                                    marginBottom: 8,
                                }}
                            >
                                ⋄
                            </Text>
                            <Text style={{ color: C.text2, fontSize: 13 }}>
                                {tab === 'received'
                                    ? 'No pending invitations'
                                    : 'No outgoing requests'}
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
                            <SentRow
                                key={s._id}
                                item={s}
                                currentUserId={currentUserId}
                                onWithdraw={handleWithdraw}
                                onPressUser={goProfile}
                                busy={busy.has(s._id)}
                            />
                        ))
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
