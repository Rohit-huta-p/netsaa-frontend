// src/components/connections/SentRequestRow.tsx
//
// A single outgoing (pending) connection request in the Network › Invitations › Sent tab.
// A·Minimal tile + neutral "Pending" pill. Tapping Withdraw opens an inline confirm that
// surfaces the real 14-day re-send cooldown the gigs/users service enforces on withdraw
// (see connectionService.withdrawConnectionRequest). onWithdraw fires only after confirm.
// Destructive red on the confirm action is a semantic accent, not decoration.

import React, { useState } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { Connection } from '@/types/connection';

// A·Minimal palette (locked tokens — same family as /network, gigs, CL home, notifications)
const C = {
    orange: '#FF6B35',
    ink: '#190B05',
    green: '#22C55E',
    card: '#1C1C23',
    avatarbg: '#2A2A33',
    well: '#212129',
    text0: '#FFFFFF',
    text1: '#D4D4D8',
    text2: '#A1A1AA',
    text3: '#8B8B99',
    text4: '#6B6B78',
    border: 'rgba(255,255,255,0.06)',
    border2: 'rgba(255,255,255,0.10)',
    borderConfirm: 'rgba(255,107,53,0.30)',
    danger: '#E24B4A',
    dangerText: '#F0958F',
    dangerSoft: 'rgba(226,75,74,0.12)',
    dangerLine: 'rgba(226,75,74,0.40)',
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
                        <AlertCircle size={15} color={C.text3} strokeWidth={2} style={{ marginTop: 1 }} />
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
    },
    cardConfirm: {
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 0,
        borderColor: C.borderConfirm,
    },
    rowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    info: { flex: 1, minWidth: 0 },
    name: { color: C.text0, fontFamily: 'Outfit-SemiBold', fontSize: 15 },
    meta: { color: C.text3, fontSize: 12, marginTop: 2, fontFamily: 'Outfit-Regular' },

    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        marginTop: 7,
        backgroundColor: C.well,
        borderWidth: 1,
        borderColor: C.border2,
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 2,
    },
    pillDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.text3 },
    pillText: { color: C.text2, fontSize: 10, fontFamily: 'Outfit-SemiBold', letterSpacing: 0.4 },

    withdrawBtn: {
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: C.border2,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 7,
    },
    withdrawText: { color: C.text2, fontSize: 11, fontFamily: 'Outfit-SemiBold' },

    cooldown: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: C.border,
    },
    cooldownWarn: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    cooldownText: { flex: 1, color: C.text2, fontSize: 12, lineHeight: 18, fontFamily: 'Outfit-Regular' },
    cooldownStrong: { color: C.text0, fontFamily: 'Outfit-Bold' },
    cooldownBtns: { flexDirection: 'row', gap: 9, marginTop: 12 },
    keepBtn: {
        flex: 1,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: C.border2,
        borderRadius: 11,
        paddingVertical: 9,
    },
    keepText: { color: C.text2, fontSize: 13, fontFamily: 'Outfit-SemiBold' },
    confirmBtn: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: C.dangerSoft,
        borderWidth: 1,
        borderColor: C.dangerLine,
        borderRadius: 11,
        paddingVertical: 9,
    },
    confirmText: { color: C.dangerText, fontSize: 13, fontFamily: 'Outfit-SemiBold' },
});

export default SentRequestRow;
