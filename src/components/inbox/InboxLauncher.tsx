// src/components/inbox/InboxLauncher.tsx
// The Inbox triage launcher — one view, two tabs (Messages · Invites) with a combined
// unread/pending count. Extracted from the old app/(app)/inbox.tsx so it can serve as
// BOTH the desktop left pane and the mobile full-screen list inside app/(app)/inbox.
//
// Messages no longer deep-link to a separate /messages route: a message row calls
// onSelectConversation(id) and the parent screen opens the chat via ?c=<id> (right pane
// on desktop, full-screen on mobile). Invites still deep-link to /invites or the requirement.
import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Send } from 'lucide-react-native';
import conversationService, { PopulatedConversation } from '@/services/conversationService';
import { inviteService, type Invite } from '@/services/inviteService';
import { useAuthStore } from '@/stores/authStore';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';

const PILL: Record<string, { c: string; label: string }> = {
    sent: { c: '#EAB308', label: 'Pending' },
    viewed: { c: '#5B8DEF', label: 'Viewed' },
    accepted: { c: '#22C55E', label: 'Accepted' },
    declined: { c: '#71717a', label: 'Declined' },
    withdrawn: { c: '#71717a', label: 'Withdrawn' },
};
const PENDING = new Set(['sent', 'viewed']);
const initialsOf = (n: string) => (n || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

function timeAgo(iso?: string): string {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'now';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return d < 7 ? `${d}d` : `${Math.floor(d / 7)}w`;
}

interface InboxLauncherProps {
    /** Currently-open conversation id — highlights its row (desktop 2-pane). */
    activeId?: string;
    /** Called when a message row is tapped; the parent opens the chat via ?c=. */
    onSelectConversation: (id: string) => void;
    /** Hide the top back chevron (e.g. when shown as the desktop left pane). */
    hideBack?: boolean;
}

export default function InboxLauncher({ activeId, onSelectConversation, hideBack }: InboxLauncherProps) {
    const router = useRouter();
    const navClearance = (useMobileTabBarHeight() || 64) + 24;
    const selfId = useAuthStore((s) => s.user?._id);
    const [tab, setTab] = useState<'messages' | 'invites'>('messages');

    const { data: conversations = [], isLoading: convLoading, isFetching: convFetching, refetch: refetchConv } =
        useQuery<PopulatedConversation[]>({ queryKey: ['conversations'], queryFn: conversationService.getConversations });

    const { data: sent = [], isFetching: sentFetching, refetch: refetchSent } =
        useQuery<any[]>({ queryKey: ['invites', 'sent'], queryFn: () => inviteService.sent() as any, retry: false });
    const { data: received = [], isFetching: recvFetching, refetch: refetchRecv } =
        useQuery<Invite[]>({ queryKey: ['invites', 'received'], queryFn: inviteService.received, retry: false });

    const unread = (conversations as any[]).reduce((s, c) => s + (c.unreadCount ?? 0), 0);
    const invitePending =
        (received as Invite[]).filter((i) => PENDING.has(i.status)).length +
        (sent as any[]).filter((i) => PENDING.has(i.status)).length;

    // Merge invites into one chronological list, each labelled by direction.
    const inviteRows = [
        ...(received as Invite[]).map((i) => ({ kind: 'received' as const, inv: i, at: i.createdAt })),
        ...(sent as any[]).map((i) => ({ kind: 'sent' as const, inv: i, at: i.createdAt })),
    ].sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime());

    const refetchAll = () => { refetchConv(); refetchSent(); refetchRecv(); };
    const refreshing = convFetching || sentFetching || recvFetching;

    return (
        <View style={{ flex: 1, backgroundColor: '#09090b' }}>
            {/* Nav */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 }}>
                {!hideBack ? (
                    <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft size={18} color="#f4f4f5" />
                    </Pressable>
                ) : null}
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', color: '#f4f4f5', fontSize: 22 }}>Inbox</Text>
            </View>

            {/* Tabs */}
            <View style={{ flexDirection: 'row', gap: 4, marginHorizontal: 20, marginTop: 6, marginBottom: 4, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 4 }}>
                {([['messages', 'Messages', unread], ['invites', 'Invites', invitePending]] as const).map(([key, label, count]) => {
                    const on = tab === key;
                    return (
                        <Pressable key={key} onPress={() => setTab(key)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 9, borderRadius: 9, backgroundColor: on ? '#f4f4f5' : 'transparent' }}>
                            <Text style={{ fontFamily: 'Outfit-SemiBold', color: on ? '#1A0D06' : '#a1a1aa', fontSize: 13 }}>{label}</Text>
                            {count > 0 && (
                                <View style={{ minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, backgroundColor: on ? '#FF6B35' : 'rgba(255,107,53,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ fontFamily: 'Outfit-SemiBold', color: on ? '#1A0D06' : '#FF6B35', fontSize: 10 }}>{count > 9 ? '9+' : count}</Text>
                                </View>
                            )}
                        </Pressable>
                    );
                })}
            </View>

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: navClearance }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetchAll} tintColor="#FF6B35" />}
            >
                {tab === 'messages' ? (
                    convLoading ? (
                        <ActivityIndicator color="#FF6B35" style={{ marginTop: 30 }} />
                    ) : conversations.length === 0 ? (
                        <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 13.5, textAlign: 'center', marginTop: 40, lineHeight: 20 }}>
                            No conversations yet. Message a Creative Lead from a proposal or profile.
                        </Text>
                    ) : (
                        (conversations as any[]).map((c, i) => {
                            const other = (c.participants || []).find((p: any) => String(p._id) !== String(selfId)) || c.participants?.[0] || {};
                            const name = other.displayName || 'Conversation';
                            const avatar = other.profilePicture || other.profileImageUrl;
                            const active = !!activeId && String(c._id) === String(activeId);
                            return (
                                <Pressable
                                    key={c._id}
                                    onPress={() => onSelectConversation(c._id)}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 12,
                                        paddingVertical: 14,
                                        // Full-bleed active highlight (cancels the ScrollView's 20px inset).
                                        marginHorizontal: active ? -20 : 0,
                                        paddingHorizontal: active ? 20 : 0,
                                        backgroundColor: active ? 'rgba(255,107,53,0.10)' : 'transparent',
                                        borderTopWidth: i === 0 ? 0 : 1,
                                        borderTopColor: 'rgba(255,255,255,0.07)',
                                    }}
                                >
                                    {avatar ? (
                                        <Image source={{ uri: avatar }} style={{ width: 46, height: 46, borderRadius: 23 }} />
                                    ) : (
                                        <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,107,53,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                                            <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#FF6B35', fontSize: 15 }}>{initialsOf(name)}</Text>
                                        </View>
                                    )}
                                    <View style={{ flex: 1, minWidth: 0 }}>
                                        <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#f4f4f5', fontSize: 14.5 }} numberOfLines={1}>{name}</Text>
                                        <Text style={{ fontFamily: 'Outfit-Regular', color: '#a1a1aa', fontSize: 12.5, marginTop: 3 }} numberOfLines={1}>{c.lastMessage || 'Say hello'}</Text>
                                    </View>
                                    {(c.unreadCount ?? 0) > 0 && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: '#FF6B35' }} />}
                                </Pressable>
                            );
                        })
                    )
                ) : inviteRows.length === 0 ? (
                    <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 13.5, textAlign: 'center', marginTop: 40, lineHeight: 20 }}>
                        No invites yet. Invite a performer from Talent or their profile.
                    </Text>
                ) : (
                    inviteRows.map((row, i) => {
                        const inv: any = row.inv;
                        const pill = PILL[inv.status] || PILL.declined;
                        const reqTitle = inv.requirementSnapshot?.title || inv.requirementTitle;
                        const isRecv = row.kind === 'received';
                        const who = isRecv ? (inv.fromSnapshot?.displayName || 'Someone') : (inv.toSnapshot?.displayName || null);
                        const avatarUrl = isRecv ? inv.fromSnapshot?.avatarUrl : inv.toSnapshot?.avatarUrl;
                        const sub = isRecv
                            ? (reqTitle ? `invited you · ${reqTitle}` : 'wants to work with you')
                            : (reqTitle ? `You invited · ${reqTitle}` : `You invited a ${(inv.toRole || 'lead').replace('_', ' ')}`);
                        const onPress = () => {
                            if (isRecv) router.push('/(app)/invites' as any);
                            else if (inv.requirementId) router.push(`/(app)/client/${inv.requirementId}` as any);
                        };
                        return (
                            <Pressable key={(inv._id || i) + row.kind} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: 'rgba(255,255,255,0.07)' }}>
                                {avatarUrl ? (
                                    <Image source={{ uri: avatarUrl }} style={{ width: 46, height: 46, borderRadius: 23 }} />
                                ) : who ? (
                                    <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: isRecv ? 'rgba(91,141,239,0.15)' : 'rgba(255,107,53,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{ fontFamily: 'Outfit-SemiBold', color: isRecv ? '#5B8DEF' : '#FF6B35', fontSize: 15 }}>{initialsOf(who)}</Text>
                                    </View>
                                ) : (
                                    <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,107,53,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                                        <Send size={18} color="#FF6B35" />
                                    </View>
                                )}
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#f4f4f5', fontSize: 14 }} numberOfLines={1}>
                                        {isRecv ? who : (who || 'Invite sent')}
                                    </Text>
                                    <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 11.5, marginTop: 3 }} numberOfLines={1}>{sub}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                    <View style={{ backgroundColor: pill.c + '22', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 }}>
                                        <Text style={{ fontFamily: 'Outfit-SemiBold', color: pill.c, fontSize: 10 }}>{pill.label}</Text>
                                    </View>
                                    <Text style={{ fontFamily: 'Outfit-Regular', color: '#52525b', fontSize: 9.5 }}>{timeAgo(row.at)}</Text>
                                </View>
                            </Pressable>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}
