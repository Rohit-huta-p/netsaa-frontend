// app/(app)/invites.tsx
// Recipient Invites inbox — artists and CLs see invites sent to them by clients.
// Web-safe: no Alert.alert. Inline error surfaces.
// Accept routing (unchanged):
//   - requirement-attached: respond(accept) → /(app)/requirements/:requirementId?invited=1
//   - context-free:          respond(accept) → create conversation → /(app)/messages?c=:conversationId

import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { inviteService, type Invite } from '@/services/inviteService';
import conversationService from '@/services/conversationService';
import { useAuthStore } from '@/stores/authStore';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';
import { InvitesHeader } from '@/components/invites/InvitesHeader';
import { InviteTabs } from '@/components/invites/InviteTabs';
import { InviteCard } from '@/components/invites/InviteCard';
import { InviteEmptyState } from '@/components/invites/InviteEmptyState';
import { InviteSkeleton } from '@/components/invites/InviteSkeleton';
import { groupInvitesByTab, type InviteTab } from '@/components/invites/inviteFormat';
import { inviteColors } from '@/components/invites/inviteTheme';

export default function InvitesInbox() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const navClearance = (useMobileTabBarHeight() || 64) + 56;
    const user = useAuthStore((s) => s.user) as any;
    const myName = user?.displayName || 'Artist';

    const [tab, setTab] = useState<InviteTab>('pending');
    const [busyMap, setBusyMap] = useState<Record<string, boolean>>({});
    const [errorMap, setErrorMap] = useState<Record<string, string>>({});

    const { data: invites = [], isLoading } = useQuery<Invite[]>({
        queryKey: ['invites', 'received'],
        queryFn: inviteService.received,
    });

    const grouped = groupInvitesByTab(invites);
    const counts = {
        pending: grouped.pending.length,
        accepted: grouped.accepted.length,
        archive: grouped.archive.length,
    };
    const visible = grouped[tab];

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
                router.push(`/(app)/messages${convoId ? `?c=${convoId}` : ''}` as any);
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

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={{ flex: 1, backgroundColor: inviteColors.bg }}>
                <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                    <ScrollView
                        contentContainerStyle={{ padding: 20, paddingBottom: navClearance }}
                        showsVerticalScrollIndicator={false}
                    >
                        <InvitesHeader pendingCount={counts.pending} />
                        <InviteTabs active={tab} counts={counts} onChange={setTab} />
                        {isLoading ? (
                            <InviteSkeleton />
                        ) : visible.length === 0 ? (
                            <InviteEmptyState tab={tab} />
                        ) : (
                            visible.map((inv) => (
                                <InviteCard
                                    key={inv._id}
                                    invite={inv}
                                    busy={busyMap[inv._id] ?? false}
                                    errorMsg={errorMap[inv._id] ?? ''}
                                    onAccept={() => handleAccept(inv)}
                                    onDecline={() => handleDecline(inv)}
                                />
                            ))
                        )}
                    </ScrollView>
                </SafeAreaView>
            </View>
        </>
    );
}
