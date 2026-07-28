// app/(app)/client/[id]/book.tsx
// Booking ceremony (contract-first, one tap). Reached from a proposal's "Book"
// CTA. Shows the light agreement (performer + brief + terms), and on "Agree &
// book" accepts the proposal + opens the anchored chat, then shows Confirmed.
//
// NOTE: this runs the proven accept path (requirementService.patchProposal +
// conversationService.createConversation — same as useChooseProposal, minus the
// auto-jump to chat). Binding a real payment-service Contract record is a
// backend follow-up: contractService is shaped around gigId/artistId, not the
// requirement→proposal flow, so we don't call it here yet.
import { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Check, MessageCircle, MapPin, Calendar } from 'lucide-react-native';
import { requirementService } from '@/services/requirementService';
import conversationService from '@/services/conversationService';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';

function formatBudget(min?: number | null, max?: number | null): string {
    if (!min && !max) return '';
    if (min && max) return `₹${(min / 1000).toFixed(0)}k–${(max / 1000).toFixed(0)}k`;
    if (max) return `up to ₹${(max / 1000).toFixed(0)}k`;
    if (min) return `₹${(min / 1000).toFixed(0)}k+`;
    return '';
}
const initialsOf = (n: string) => n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

export default function BookProposal() {
    const router = useRouter();
    const qc = useQueryClient();
    const navClearance = (useMobileTabBarHeight() || 64) + 24;
    const { id, proposal: proposalParam } = useLocalSearchParams<{ id: string; proposal?: string }>();
    const reqId = Array.isArray(id) ? id[0] : id ?? '';
    const pid = Array.isArray(proposalParam) ? proposalParam[0] : proposalParam ?? '';

    const { data: req } = useQuery({
        queryKey: ['client', 'requirement', reqId],
        queryFn: () => requirementService.detail(reqId),
        enabled: !!reqId,
    });
    const { data: proposals = [], isLoading } = useQuery({
        queryKey: ['client', 'requirement', reqId, 'proposals'],
        queryFn: () => requirementService.proposals(reqId),
        enabled: !!reqId,
    });
    const proposal: any = (proposals as any[]).find((p) => p._id === pid);

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);
    const [convId, setConvId] = useState<string | null>(null);

    const leadName = proposal?.leadSnapshot?.displayName ?? 'this Creative Lead';
    const leadId = proposal?.leadId ?? '';
    const avatarUrl = proposal?.leadSnapshot?.profileImageUrl;
    const quote = proposal?.quoteAmount ? `₹${(proposal.quoteAmount / 1000).toFixed(0)}k` : null;
    const title = req?.title || req?.occasionText || 'your requirement';
    const eventDate = req?.eventDate
        ? new Date(req.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';

    const terms = [
        'Scope & deliverables as described in your brief',
        "You'll confirm the final schedule together in chat",
        quote ? `Price · ${quote} (as proposed)` : 'Price as proposed',
        'Payment is arranged directly between you — NETSA keeps a record',
        'Either side can cancel with fair notice',
    ];

    const agree = async () => {
        if (busy || !proposal || !leadId) return;
        setBusy(true);
        setError('');
        try {
            // Accept the proposal (tolerate an already-accepted retry).
            try {
                await requirementService.patchProposal(pid, 'accept');
            } catch (e: any) {
                const status = e?.response?.status;
                const msg = e?.response?.data?.meta?.message || '';
                if (!(status === 400 && /accept/i.test(msg))) throw e;
            }
            // Open (or get) the anchored conversation.
            const conv = await conversationService.createConversation(
                leadId,
                { requirementId: reqId, proposalId: pid, label: req?.occasionText ?? 'Booking' },
                `You booked ${leadName} · arrange the details`,
            );
            await qc.invalidateQueries({ queryKey: ['client', 'requirements'] });
            await qc.invalidateQueries({ queryKey: ['client', 'requirement', reqId] });
            setConvId(conv?._id ?? null);
            setDone(true);
        } catch (e: any) {
            setError(
                e?.response?.data?.meta?.message ||
                    e?.response?.data?.message ||
                    'Could not complete the booking. Please try again.',
            );
        } finally {
            setBusy(false);
        }
    };

    // ── Confirmed ──
    if (done) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={{ flex: 1, backgroundColor: '#09090b', paddingHorizontal: 24, paddingTop: 90 }}>
                    <View style={{ alignItems: 'center' }}>
                        <View
                            style={{
                                width: 84, height: 84, borderRadius: 42, marginBottom: 22,
                                backgroundColor: 'rgba(34,197,94,0.14)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.4)',
                                alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <Check size={38} color="#22C55E" strokeWidth={2.6} />
                        </View>
                        <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', color: '#f4f4f5', fontSize: 28, textAlign: 'center', lineHeight: 34 }}>
                            You've booked{'\n'}{leadName}.
                        </Text>
                        <Text style={{ fontFamily: 'Outfit-Regular', color: '#a1a1aa', fontSize: 14, textAlign: 'center', marginTop: 10, maxWidth: 280, lineHeight: 20 }}>
                            for {title}{eventDate ? ` · ${eventDate}` : ''}.
                        </Text>
                    </View>

                    <View style={{ marginTop: 34 }}>
                        <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#a1a1aa', fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 12 }}>
                            What happens now
                        </Text>
                        {[
                            `${leadName} has been notified`,
                            "We've opened a chat to sort the details",
                            'This brief is now marked Booked',
                        ].map((t, i) => (
                            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: 'rgba(255,255,255,0.07)' }}>
                                <Check size={15} color="#22C55E" />
                                <Text style={{ fontFamily: 'Outfit-Regular', color: '#d4d4d8', fontSize: 13.5, flex: 1 }}>{t}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 30 }}>
                        <Pressable
                            onPress={() => router.replace((convId ? `/(app)/inbox?c=${convId}` : '/(app)/inbox') as any)}
                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingVertical: 15 }}
                        >
                            <MessageCircle size={17} color="#f4f4f5" />
                            <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#f4f4f5', fontSize: 14.5 }}>Message</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => router.replace('/(app)/client/briefs' as any)}
                            style={{ flex: 1, backgroundColor: '#FF6B35', borderRadius: 14, paddingVertical: 15, alignItems: 'center' }}
                        >
                            <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#1A0D06', fontSize: 14.5 }}>Done</Text>
                        </Pressable>
                    </View>
                </View>
            </>
        );
    }

    // ── Agreement ──
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={{ flex: 1, backgroundColor: '#09090b' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 10 }}>
                    <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft size={18} color="#f4f4f5" />
                    </Pressable>
                    <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', color: '#f4f4f5', fontSize: 22 }}>Confirm booking</Text>
                </View>

                {isLoading && !proposal ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator color="#FF6B35" />
                    </View>
                ) : !proposal ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }}>
                        <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 14, textAlign: 'center' }}>
                            We couldn't load this proposal. Go back and try again.
                        </Text>
                    </View>
                ) : (
                    <>
                        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: navClearance + 90 }} showsVerticalScrollIndicator={false}>
                            <Text style={{ fontFamily: 'Outfit-Regular', color: '#a1a1aa', fontSize: 13, lineHeight: 19, marginBottom: 16 }}>
                                A light agreement — you both commit to these terms. No advance needed.
                            </Text>

                            {/* Summary card */}
                            <View style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 18, padding: 16, backgroundColor: 'rgba(34,197,94,0.04)' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
                                    {avatarUrl ? (
                                        <Image source={{ uri: avatarUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                                    ) : (
                                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,107,53,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                                            <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#FF6B35', fontSize: 15 }}>{initialsOf(leadName)}</Text>
                                        </View>
                                    )}
                                    <View style={{ flex: 1, minWidth: 0 }}>
                                        <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#f4f4f5', fontSize: 15.5 }} numberOfLines={1}>{leadName}</Text>
                                        <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 12, marginTop: 1 }} numberOfLines={1}>for {title}</Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingTop: 13 }}>
                                    {!!quote && (
                                        <View>
                                            <Text style={{ fontFamily: 'Outfit-Regular', color: '#52525b', fontSize: 10, marginBottom: 3 }}>RATE</Text>
                                            <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#FF6B35', fontSize: 14 }}>{quote}</Text>
                                        </View>
                                    )}
                                    {!!req?.city && (
                                        <View>
                                            <Text style={{ fontFamily: 'Outfit-Regular', color: '#52525b', fontSize: 10, marginBottom: 3 }}>CITY</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                <MapPin size={12} color="#a1a1aa" />
                                                <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#f4f4f5', fontSize: 13.5 }}>{req.city}</Text>
                                            </View>
                                        </View>
                                    )}
                                    {!!eventDate && (
                                        <View>
                                            <Text style={{ fontFamily: 'Outfit-Regular', color: '#52525b', fontSize: 10, marginBottom: 3 }}>DATE</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                <Calendar size={12} color="#a1a1aa" />
                                                <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#f4f4f5', fontSize: 13.5 }}>{eventDate}</Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Terms */}
                            <View style={{ marginTop: 18 }}>
                                {terms.map((t, i) => (
                                    <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingVertical: 9 }}>
                                        <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: 'rgba(34,197,94,0.14)', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                                            <Check size={12} color="#22C55E" strokeWidth={3} />
                                        </View>
                                        <Text style={{ flex: 1, fontFamily: 'Outfit-Regular', color: '#d4d4d8', fontSize: 13, lineHeight: 19 }}>{t}</Text>
                                    </View>
                                ))}
                            </View>

                            {!!error && (
                                <Text style={{ fontFamily: 'Outfit-Regular', color: '#ef4444', fontSize: 12.5, lineHeight: 18, marginTop: 14 }}>{error}</Text>
                            )}
                        </ScrollView>

                        {/* Sticky agree */}
                        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, backgroundColor: '#09090b', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
                            <Pressable
                                onPress={agree}
                                disabled={busy || !leadId}
                                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: '#FF6B35', borderRadius: 15, paddingVertical: 16, opacity: busy || !leadId ? 0.6 : 1 }}
                            >
                                {busy ? (
                                    <ActivityIndicator color="#1A0D06" />
                                ) : (
                                    <>
                                        <Check size={18} color="#1A0D06" strokeWidth={2.6} />
                                        <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#1A0D06', fontSize: 15.5 }}>Agree &amp; book</Text>
                                    </>
                                )}
                            </Pressable>
                            <Text style={{ fontFamily: 'Outfit-Regular', color: '#52525b', fontSize: 11, textAlign: 'center', marginTop: 10, lineHeight: 16 }}>
                                {leadName} proposed these terms. Tapping forms the booking and opens a chat.
                            </Text>
                        </View>
                    </>
                )}
            </View>
        </>
    );
}
