// src/components/connections/SentRequestRow.tsx
//
// A single outgoing (pending) connection request in the Network › Invitations › Sent tab.
// Elevated card + neutral "Pending" pill. Tapping Withdraw opens an inline confirm that
// surfaces the real 14-day re-send cooldown the gigs/users service enforces on withdraw
// (see connectionService.withdrawConnectionRequest). onWithdraw fires only after confirm.

import React, { useState } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle } from 'lucide-react-native';
import { Connection } from '@/types/connection';

const C = {
    card: '#151019',
    cardConfirm: '#170f14',
    text1: '#F5F0EB',
    text2: '#A19BAA',
    text3: '#6B6878',
    border: 'rgba(255,255,255,0.07)',
    borderConfirm: 'rgba(255,107,53,0.35)',
    pink: '#EC4899',
    orange: '#FF6B35',
    danger: '#E24B4A',
    dangerText: '#F0958F',
};

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
                style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#1a1822' }}
            />
        );
    }
    return (
        <LinearGradient
            colors={[C.pink, C.orange]}
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

export interface SentRequestRowProps {
    item: Connection;
    currentUserId?: string;
    onWithdraw: (id: string) => void;
    onPressUser: (id: string) => void;
    busy?: boolean;
}

export const SentRequestRow = ({ item, currentUserId, onWithdraw, onPressUser, busy = false }: SentRequestRowProps) => {
    const [confirming, setConfirming] = useState(false);

    const requesterId = (item.requesterId as any)?._id || item.requesterId;
    const other: any = requesterId === currentUserId ? item.recipientId : item.requesterId;
    const name = fallbackName(other);
    const firstName = other?.firstName || (name || '').split(/\s+/)[0] || 'them';

    const Identity = (
        <>
            <Pressable onPress={() => other?._id && onPressUser(other._id)}>
                <Avatar uri={other?.profileImageUrl} name={name} size={44} />
            </Pressable>
            <Pressable style={styles.info} onPress={() => other?._id && onPressUser(other._id)}>
                <Text style={styles.name} numberOfLines={1}>{name}</Text>
                <Text style={styles.meta} numberOfLines={1}>
                    {roleLabel(other)} · Sent {timeAgo(item.createdAt)}
                </Text>
                {!confirming && (
                    <View style={styles.pill}>
                        <View style={styles.pillDot} />
                        <Text style={styles.pillText}>Pending</Text>
                    </View>
                )}
            </Pressable>
        </>
    );

    if (confirming) {
        return (
            <View style={[styles.card, styles.cardConfirm]}>
                <View style={styles.rowTop}>{Identity}</View>
                <View style={styles.cooldown}>
                    <View style={styles.cooldownWarn}>
                        <AlertCircle size={15} color={C.text2} strokeWidth={2} style={{ marginTop: 1 }} />
                        <Text style={styles.cooldownText}>
                            Withdraw this request? You won't be able to re-send to {firstName} for{' '}
                            <Text style={styles.cooldownStrong}>14 days</Text>.
                        </Text>
                    </View>
                    <View style={styles.cooldownBtns}>
                        <Pressable
                            testID={`sent-keep-${item._id}`}
                            onPress={() => setConfirming(false)}
                            disabled={busy}
                            style={({ pressed }) => [styles.keepBtn, pressed && { opacity: 0.6 }]}
                        >
                            <Text style={styles.keepText}>Keep</Text>
                        </Pressable>
                        <Pressable
                            testID={`sent-confirm-${item._id}`}
                            onPress={() => onWithdraw(item._id)}
                            disabled={busy}
                            style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.7 }]}
                        >
                            {busy ? (
                                <ActivityIndicator size="small" color={C.dangerText} />
                            ) : (
                                <Text style={styles.confirmText}>Withdraw</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            {Identity}
            <Pressable
                testID={`sent-withdraw-${item._id}`}
                onPress={() => setConfirming(true)}
                disabled={busy}
                style={({ pressed }) => [styles.withdrawBtn, pressed && { opacity: 0.5 }]}
            >
                <Text style={styles.withdrawText}>Withdraw</Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 14,
        paddingVertical: 13,
        paddingHorizontal: 14,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
    },
    cardConfirm: {
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 0,
        backgroundColor: C.cardConfirm,
        borderColor: C.borderConfirm,
    },
    rowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    info: { flex: 1, minWidth: 0 },
    name: { color: C.text1, fontFamily: 'Outfit-SemiBold', fontSize: 15 },
    meta: { color: C.text2, fontSize: 12, marginTop: 2, fontFamily: 'Outfit-Regular' },

    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        marginTop: 7,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 2,
    },
    pillDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.text2 },
    pillText: { color: '#C9C2CC', fontSize: 10, fontFamily: 'Outfit-SemiBold', letterSpacing: 0.4 },

    withdrawBtn: {
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 7,
    },
    withdrawText: { color: C.text2, fontSize: 11, fontFamily: 'Outfit-SemiBold' },

    cooldown: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
    },
    cooldownWarn: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    cooldownText: { flex: 1, color: '#C9C2CC', fontSize: 12, lineHeight: 18, fontFamily: 'Outfit-Regular' },
    cooldownStrong: { color: C.text1, fontFamily: 'Outfit-Bold' },
    cooldownBtns: { flexDirection: 'row', gap: 9, marginTop: 12 },
    keepBtn: {
        flex: 1,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        borderRadius: 11,
        paddingVertical: 9,
    },
    keepText: { color: C.text2, fontSize: 13, fontFamily: 'Outfit-SemiBold' },
    confirmBtn: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: 'rgba(226,75,74,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(226,75,74,0.4)',
        borderRadius: 11,
        paddingVertical: 9,
    },
    confirmText: { color: C.dangerText, fontSize: 13, fontFamily: 'Outfit-SemiBold' },
});

export default SentRequestRow;
