/**
 * client/[id]/compare.tsx — Side-by-side proposal comparison (Layout B)
 *
 * Horizontal-scroll columns (~138px wide, ~2 visible at a time).
 * Each column: avatar, name, quote (plain ₹ number — NO in/over-budget badge,
 * NO cheapest highlight per the no-auto-flags decision), pitch (truncated), "Choose" button.
 *
 * Header shows the requirement budget once as context.
 * Tap column → proposal-detail mode (/(app)/client/[id]?proposal=pid).
 * "Choose" button → useChooseProposal hook (same hook as [id].tsx, DRY).
 * Trust tier / rating columns omitted (no data from Trust Engine yet).
 */
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, DollarSign } from 'lucide-react-native';
import { requirementService } from '@/services/requirementService';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';

// ─── Types ────────────────────────────────────────────────────────────────────

type RequirementView = {
    _id?: string;
    title?: string;
    occasionText?: string;
    budgetMin?: number | null;
    budgetMax?: number | null;
};

type ProposalView = {
    _id: string;
    leadId?: string;
    leadSnapshot?: {
        displayName?: string;
        profileImageUrl?: string;
        trustTier?: string;
        rating?: number;
    };
    pitch?: string;
    quoteAmount?: number | null;
    portfolioLinks?: string[];
    status?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBudget(min?: number | null, max?: number | null): string {
    if (!min && !max) return '';
    if (min && max) return `₹${(min / 1000).toFixed(0)}k–${(max / 1000).toFixed(0)}k`;
    if (max) return `up to ₹${(max / 1000).toFixed(0)}k`;
    if (min) return `₹${(min / 1000).toFixed(0)}k+`;
    return '';
}

function initials(name?: string): string {
    if (!name) return '?';
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');
}

// ─── Single proposal column ───────────────────────────────────────────────────

function ProposalColumn({
    proposal,
    requirementId,
    onTap,
}: {
    proposal: ProposalView;
    requirementId: string;
    /** Tap handler for the column body (goes to detail) */
    onTap: () => void;
}) {
    const leadName = proposal.leadSnapshot?.displayName ?? 'Creative Lead';
    const avatarUrl = proposal.leadSnapshot?.profileImageUrl;
    const inits = initials(leadName);
    const quoteStr = proposal.quoteAmount != null
        ? `₹${(proposal.quoteAmount / 1000).toFixed(0)}k`
        : 'On request';
    const leadId = proposal.leadId ?? '';
    const router = useRouter();

    return (
        <Pressable
            onPress={onTap}
            style={{
                width: 152,
                marginRight: 12,
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.10)',
                borderRadius: 18,
                overflow: 'hidden',
            }}
        >
            {/* Avatar */}
            <View style={{ alignItems: 'center', paddingTop: 20, paddingBottom: 12 }}>
                {avatarUrl ? (
                    <Image
                        source={{ uri: avatarUrl }}
                        style={{ width: 52, height: 52, borderRadius: 26 }}
                    />
                ) : (
                    <View style={{
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        backgroundColor: 'rgba(255,107,53,0.15)',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#FF6B35', fontSize: 18 }}>
                            {inits}
                        </Text>
                    </View>
                )}
            </View>

            {/* Name */}
            <Text
                style={{
                    fontFamily: 'Outfit-SemiBold',
                    color: '#f4f4f5',
                    fontSize: 13,
                    textAlign: 'center',
                    paddingHorizontal: 10,
                    marginBottom: 6,
                }}
                numberOfLines={2}
            >
                {leadName}
            </Text>

            {/* Quote — plain number, no badge */}
            <Text style={{
                fontFamily: 'Outfit-SemiBold',
                color: '#FF6B35',
                fontSize: 16,
                textAlign: 'center',
                marginBottom: 10,
            }}>
                {quoteStr}
            </Text>

            {/* Pitch preview */}
            {!!proposal.pitch && (
                <Text
                    style={{
                        fontFamily: 'Outfit-Regular',
                        color: '#71717a',
                        fontSize: 11,
                        lineHeight: 16,
                        textAlign: 'center',
                        paddingHorizontal: 10,
                        marginBottom: 14,
                    }}
                    numberOfLines={4}
                >
                    {proposal.pitch}
                </Text>
            )}

            {/* Spacer to push button to bottom */}
            <View style={{ flex: 1 }} />

            {/* Book → ceremony */}
            <Pressable
                onPress={(e) => {
                    e.stopPropagation?.();
                    router.push(`/(app)/client/${requirementId}/book?proposal=${proposal._id}` as any);
                }}
                disabled={!leadId}
                style={{
                    margin: 10,
                    backgroundColor: '#FF6B35',
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: 'center',
                    opacity: !leadId ? 0.7 : 1,
                }}
            >
                <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#1A0D06', fontSize: 13 }}>
                    Book
                </Text>
            </Pressable>
        </Pressable>
    );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CompareProposalsScreen() {
    const router = useRouter();
    const navClearance = (useMobileTabBarHeight() || 64) + 56;
    const { id } = useLocalSearchParams<{ id: string }>();
    const reqId = Array.isArray(id) ? id[0] : id ?? '';

    const { data: req, isLoading: reqLoading } = useQuery({
        queryKey: ['client', 'requirement', reqId],
        queryFn: () => requirementService.detail(reqId),
        enabled: !!reqId,
    });

    const { data: proposals = [], isLoading: proposalsLoading } = useQuery({
        queryKey: ['client', 'requirement', reqId, 'proposals'],
        queryFn: () => requirementService.proposals(reqId),
        enabled: !!reqId,
    });

    const budget = formatBudget(req?.budgetMin, req?.budgetMax);
    const isLoading = reqLoading || proposalsLoading;

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={{ flex: 1, backgroundColor: '#09090b' }}>
                {/* Header */}
                <View style={{
                    paddingHorizontal: 20,
                    paddingTop: 60,
                    paddingBottom: 16,
                }}>
                    <Pressable
                        onPress={() => router.back()}
                        hitSlop={8}
                        style={{ marginBottom: 16, alignSelf: 'flex-start', padding: 4 }}
                    >
                        <ChevronLeft size={22} color="#a1a1aa" />
                    </Pressable>

                    <Text style={{
                        fontFamily: 'DMSerifDisplay_400Regular',
                        color: '#f4f4f5',
                        fontSize: 24,
                        marginBottom: 4,
                    }}>
                        Compare proposals
                    </Text>

                    {/* Requirement context: budget once */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{
                            fontFamily: 'Outfit-Regular',
                            color: '#71717a',
                            fontSize: 13,
                        }}>
                            {req?.title || req?.occasionText || 'Your requirement'}
                        </Text>
                        {!!budget && (
                            <>
                                <View style={{
                                    width: 3,
                                    height: 3,
                                    borderRadius: 1.5,
                                    backgroundColor: '#52525b',
                                    marginHorizontal: 8,
                                }} />
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <DollarSign size={12} color="#71717a" />
                                    <Text style={{
                                        fontFamily: 'Outfit-Regular',
                                        color: '#71717a',
                                        fontSize: 13,
                                        marginLeft: 3,
                                    }}>
                                        Budget {budget}
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>

                    <Text style={{
                        fontFamily: 'Outfit-Regular',
                        color: '#52525b',
                        fontSize: 11,
                        marginTop: 4,
                    }}>
                        Swipe to see all · tap a card for full detail
                    </Text>
                </View>

                {/* Column area */}
                {isLoading ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator color="#FF6B35" />
                    </View>
                ) : (proposals as ProposalView[]).length < 2 ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
                        <Text style={{
                            fontFamily: 'Outfit-Regular',
                            color: '#52525b',
                            fontSize: 14,
                            textAlign: 'center',
                        }}>
                            You need at least 2 proposals to compare.
                        </Text>
                        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
                            <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#FF6B35', fontSize: 14 }}>
                                Go back
                            </Text>
                        </Pressable>
                    </View>
                ) : (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{
                            paddingHorizontal: 20,
                            paddingBottom: navClearance,
                            paddingTop: 8,
                            alignItems: 'flex-start',
                        }}
                        style={{ flex: 1 }}
                    >
                        {(proposals as ProposalView[]).map((p) => (
                            <ProposalColumn
                                key={p._id}
                                proposal={p}
                                requirementId={reqId}
                                onTap={() =>
                                    router.push(
                                        `/(app)/client/${reqId}?proposal=${p._id}` as any,
                                    )
                                }
                            />
                        ))}
                    </ScrollView>
                )}
            </View>
        </>
    );
}
