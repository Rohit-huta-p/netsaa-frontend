// app/(app)/invites.tsx
// Combined supplier Activity inbox — one page, two faces:
//   • Received — invites clients sent ME (accept/decline)
//   • Sent     — proposals I sent on requirements (withdraw / open chat once booked)
// Both reuse the same Pending/Accepted/Archive tabs, since invites and proposals
// share one status model (sent/viewed/accepted/declined/withdrawn).
// Web-safe: no Alert.alert, inline error surfaces.
// Accept routing (unchanged):
//   - requirement-attached: respond(accept) → /(app)/requirements/:requirementId?invited=1
//   - context-free:          respond(accept) → create conversation → /(app)/inbox?c=:conversationId

import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { inviteService, type Invite } from '@/services/inviteService';
import { requirementService, type SentProposal } from '@/services/requirementService';
import conversationService from '@/services/conversationService';
import { useAuthStore } from '@/stores/authStore';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';
import { InviteTabs } from '@/components/invites/InviteTabs';
import { InviteCard } from '@/components/invites/InviteCard';
import { ProposalCard } from '@/components/invites/ProposalCard';
import { InviteEmptyState } from '@/components/invites/InviteEmptyState';
import { InviteSkeleton } from '@/components/invites/InviteSkeleton';
import { groupInvitesByTab, groupByStatusTab, type InviteTab } from '@/components/invites/inviteFormat';
import { inviteColors, inviteFonts } from '@/components/invites/inviteTheme';

type Mode = 'received' | 'sent';

export default function ActivityInbox() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const navClearance = (useMobileTabBarHeight() || 64) + 56;
    const user = useAuthStore((s) => s.user) as any;
    const myName = user?.displayName || 'Artist';

    const [mode, setMode] = useState<Mode>('received');
    const [statusTab, setStatusTab] = useState<InviteTab>('pending');
    const [busyMap, setBusyMap] = useState<Record<string, boolean>>({});
    const [errorMap, setErrorMap] = useState<Record<string, string>>({});

    // Both feeds load up front so each toggle can show its pending count.
    const { data: invites = [], isLoading: invLoading } = useQuery<Invite[]>({
        queryKey: ['invites', 'received'],
        queryFn: inviteService.received,
    });
    const { data: proposals = [], isLoading: propLoading } = useQuery<SentProposal[]>({
        queryKey: ['proposals', 'mine'],
        queryFn: requirementService.myProposals,
        retry: false,
    });

    const invGrouped = groupInvitesByTab(invites);
    const propGrouped = groupByStatusTab(proposals);

    const invPending = invGrouped.pending.length;
    const propPending = propGrouped.pending.length;

    const activeGrouped = mode === 'received' ? invGrouped : propGrouped;
    const counts = {
        pending: activeGrouped.pending.length,
        accepted: activeGrouped.accepted.length,
        archive: activeGrouped.archive.length,
    };
    const activeLoading = mode === 'received' ? invLoading : propLoading;
    const invVisible = invGrouped[statusTab];
    const propVisible = propGrouped[statusTab];
    const isEmpty = (mode === 'received' ? invVisible : propVisible).length === 0;

    const subline =
        mode === 'received'
            ? invPending > 0
                ? `${invPending} ${invPending === 1 ? 'client wants' : 'clients want'} to work with you.`
                : "You're all caught up."
            : propPending > 0
                ? `${propPending} ${propPending === 1 ? 'proposal' : 'proposals'} awaiting a reply.`
                : proposals.length > 0
                    ? 'No proposals awaiting a reply.'
                    : "You haven't sent any proposals yet.";

    const handleAccept = async (invite: Invite) => {
        const id = invite._id;
        setBusyMap((m) => ({ ...m, [id]: true }));
        setErrorMap((m) => ({ ...m, [id]: '' }));
        try {
            await inviteService.respond(id, 'accept');
            queryClient.invalidateQueries({ queryKey: ['invites', 'received'] });

            if (invite.requirementId) {
                router.push(`/(app)/requirements/${invite.requirementId}?invited=1` as any);
            } else {
                const seedText = `${myName} accepted your invite`;
                const convo = await conversationService.createConversation(
                    invite.fromClientId,
                    { inviteId: invite._id, label: 'Invite' },
                    seedText,
                );
                const convoId = (convo as any)?._id ?? (convo as any)?.id ?? '';
                router.push(`/(app)/inbox${convoId ? `?c=${convoId}` : ''}` as any);
            }
        } catch (e: any) {
            const msg =
                e?.response?.data?.meta?.message ||
                e?.message ||
                'Could not accept invite. Please try again.';
            setErrorMap((m) => ({ ...m, [id]: msg }));
            setBusyMap((m) => ({ ...m, [id]: false }));
        }
    };

    const handleDecline = async (invite: Invite) => {
        const id = invite._id;
        setBusyMap((m) => ({ ...m, [id]: true }));
        setErrorMap((m) => ({ ...m, [id]: '' }));
        try {
            await inviteService.respond(id, 'decline');
            queryClient.invalidateQueries({ queryKey: ['invites', 'received'] });
        } catch (e: any) {
            const msg =
                e?.response?.data?.meta?.message ||
                e?.message ||
                'Could not decline. Please try again.';
            setErrorMap((m) => ({ ...m, [id]: msg }));
        } finally {
            setBusyMap((m) => ({ ...m, [id]: false }));
        }
    };

    const handleWithdraw = async (proposal: SentProposal) => {
        const id = proposal._id;
        setBusyMap((m) => ({ ...m, [id]: true }));
        setErrorMap((m) => ({ ...m, [id]: '' }));
        try {
            await requirementService.patchProposal(id, 'withdraw');
            queryClient.invalidateQueries({ queryKey: ['proposals', 'mine'] });
            // Withdrawing frees a slot — refresh the Find Work feed counts.
            queryClient.invalidateQueries({ queryKey: ['requirements', 'feed'] });
        } catch (e: any) {
            const msg =
                e?.response?.data?.meta?.message ||
                e?.message ||
                'Could not withdraw. Please try again.';
            setErrorMap((m) => ({ ...m, [id]: msg }));
        } finally {
            setBusyMap((m) => ({ ...m, [id]: false }));
        }
    };

    // Booked → jump to messages (the client opened an anchored thread on accept).
    const handleOpenChat = (_proposal: SentProposal) => {
        router.push('/(app)/inbox' as any);
    };

    const switchMode = (m: Mode) => {
        setMode(m);
        setStatusTab('pending');
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={{ flex: 1, backgroundColor: inviteColors.bg }}>
                <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                    <ScrollView
                        contentContainerStyle={{ padding: 20, paddingBottom: navClearance }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header */}
                        <View style={{ marginBottom: 14 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                                <Text style={{ fontFamily: inviteFonts.mono, fontSize: 11, letterSpacing: 1, color: inviteColors.orange }}>गतिविधि</Text>
                                <Text style={{ fontFamily: inviteFonts.mono, fontSize: 11, color: inviteColors.dim }}>· you</Text>
                            </View>
                            <Text style={{ fontFamily: inviteFonts.serif, fontSize: 34, color: inviteColors.text, lineHeight: 38 }}>Activity</Text>
                            <Text style={{ fontFamily: inviteFonts.body, fontSize: 13, color: inviteColors.muted, marginTop: 4 }}>{subline}</Text>
                        </View>

                        {/* Received / Sent toggle */}
                        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 3, marginBottom: 14 }}>
                            {(['received', 'sent'] as Mode[]).map((m) => {
                                const on = mode === m;
                                const label = m === 'received' ? 'Received' : 'Sent';
                                const count = m === 'received' ? invPending : propPending;
                                return (
                                    <Pressable
                                        key={m}
                                        onPress={() => switchMode(m)}
                                        accessibilityRole="tab"
                                        accessibilityState={{ selected: on }}
                                        accessibilityLabel={label}
                                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 9, backgroundColor: on ? inviteColors.orange : 'transparent' }}
                                    >
                                        <Text style={{ fontFamily: inviteFonts.semibold, fontSize: 12.5, color: on ? inviteColors.onOrange : inviteColors.muted }}>{label}</Text>
                                        {count > 0 && (
                                            <View style={{ backgroundColor: on ? 'rgba(26,13,6,0.18)' : 'rgba(255,255,255,0.1)', borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1 }}>
                                                <Text style={{ fontFamily: inviteFonts.semibold, fontSize: 10, color: on ? inviteColors.onOrange : inviteColors.muted }}>{count}</Text>
                                            </View>
                                        )}
                                    </Pressable>
                                );
                            })}
                        </View>

                        {/* Shared status tabs */}
                        <InviteTabs active={statusTab} counts={counts} onChange={setStatusTab} />

                        {activeLoading ? (
                            <InviteSkeleton />
                        ) : isEmpty ? (
                            <InviteEmptyState tab={statusTab} mode={mode} />
                        ) : mode === 'received' ? (
                            invVisible.map((inv) => (
                                <InviteCard
                                    key={inv._id}
                                    invite={inv}
                                    busy={busyMap[inv._id] ?? false}
                                    errorMsg={errorMap[inv._id] ?? ''}
                                    onAccept={() => handleAccept(inv)}
                                    onDecline={() => handleDecline(inv)}
                                />
                            ))
                        ) : (
                            propVisible.map((p) => (
                                <ProposalCard
                                    key={p._id}
                                    proposal={p}
                                    busy={busyMap[p._id] ?? false}
                                    errorMsg={errorMap[p._id] ?? ''}
                                    onWithdraw={() => handleWithdraw(p)}
                                    onOpenChat={() => handleOpenChat(p)}
                                />
                            ))
                        )}
                    </ScrollView>
                </SafeAreaView>
            </View>
        </>
    );
}
