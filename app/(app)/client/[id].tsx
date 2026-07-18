/**
 * client/[id].tsx — Dual-use screen
 *
 * Without ?proposal=: requirement-detail mode
 *   - Requirement hero, status, "···" menu (Edit / Stop / Cancel)
 *   - Proposals list → tapping a card switches to proposal-detail mode
 *   - Compare entry when ≥2 proposals
 *
 * With ?proposal=<pid>: proposal-detail mode
 *   - CL identity, quote vs budget, pitch, portfolio links, requirement recap
 *   - Primary "Choose [name]" (useChooseProposal hook), Message, Decline
 */
import { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    Image,
    ActivityIndicator,
    Linking,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    MapPin,
    Calendar,
    DollarSign,
    Lock,
    MessageCircle,
    X,
    ArrowLeftRight,
    ExternalLink,
} from 'lucide-react-native';
import { requirementService } from '@/services/requirementService';
import conversationService from '@/services/conversationService';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProposalView = {
    _id: string;
    requirementId?: string;
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
    createdAt?: string;
};

type Requirement = {
    _id: string;
    clientId?: string;
    clientSnapshot?: { displayName?: string; city?: string; hirerType?: string };
    title?: string;
    occasionText?: string;
    occasionTag?: string;
    description?: string;
    city?: string;
    eventDate?: string;
    budgetMin?: number | null;
    budgetMax?: number | null;
    photos?: string[];
    status?: string;
    proposalCount?: number;
    expiresAt?: string;
    createdAt?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_TINT: Record<string, string> = {
    open: '#22C55E',
    in_discussion: '#F59E0B',
    booked: '#8B5CF6',
    closed: '#71717a',
    cancelled: '#ef4444',
    expired: '#71717a',
};

const STATUS_LABEL: Record<string, string> = {
    open: 'Open',
    in_discussion: 'In discussion',
    booked: 'Booked',
    closed: 'Closed',
    cancelled: 'Cancelled',
    expired: 'Expired',
};

function formatBudget(min?: number | null, max?: number | null): string {
    if (!min && !max) return 'Budget not specified';
    if (min && max) return `₹${(min / 1000).toFixed(0)}k–${(max / 1000).toFixed(0)}k`;
    if (max) return `Up to ₹${(max / 1000).toFixed(0)}k`;
    if (min) return `₹${(min / 1000).toFixed(0)}k+`;
    return '';
}

function fmtDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
    const color = STATUS_TINT[status] ?? '#71717a';
    return (
        <View
            style={{
                backgroundColor: color + '22',
                borderRadius: 99,
                paddingHorizontal: 10,
                paddingVertical: 4,
            }}
        >
            <Text style={{ fontFamily: 'Outfit-SemiBold', color, fontSize: 11 }}>
                {STATUS_LABEL[status] ?? status}
            </Text>
        </View>
    );
}

function MetaRow({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            {icon}
            <Text
                style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 13, marginLeft: 7 }}
            >
                {text}
            </Text>
        </View>
    );
}

// ─── Confirm sheet (web-safe: inline, not Alert.alert) ────────────────────────

function ConfirmSheet({
    title,
    body,
    confirmLabel,
    confirmDestructive,
    onConfirm,
    onCancel,
    busy,
}: {
    title: string;
    body: string;
    confirmLabel: string;
    confirmDestructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    busy?: boolean;
}) {
    return (
        <View
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: '#18181b',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                padding: 24,
                paddingBottom: 40,
                zIndex: 100,
            }}
        >
            <Text
                style={{
                    fontFamily: 'Outfit-SemiBold',
                    color: '#f4f4f5',
                    fontSize: 17,
                    marginBottom: 8,
                }}
            >
                {title}
            </Text>
            <Text
                style={{
                    fontFamily: 'Outfit-Regular',
                    color: '#71717a',
                    fontSize: 13,
                    lineHeight: 20,
                    marginBottom: 24,
                }}
            >
                {body}
            </Text>
            <Pressable
                onPress={onConfirm}
                disabled={busy}
                style={{
                    backgroundColor: confirmDestructive ? '#ef4444' : '#FF6B35',
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                    marginBottom: 10,
                    opacity: busy ? 0.6 : 1,
                }}
            >
                {busy ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#fff', fontSize: 15 }}>
                        {confirmLabel}
                    </Text>
                )}
            </Pressable>
            <Pressable
                onPress={onCancel}
                style={{
                    paddingVertical: 12,
                    alignItems: 'center',
                }}
            >
                <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 14 }}>
                    Cancel
                </Text>
            </Pressable>
        </View>
    );
}

// ─── Proposal mini-card (in requirement-detail mode) ─────────────────────────

const TIER_DOT: Record<string, string> = {
    new: '#6B7280', rising: '#3B82F6', trusted: '#34D399', verified: '#EAB308',
};

// Editorial-hairline proposal row (the brief is the card; proposals are an open
// list beneath it). The whole row opens the proposal; the chat icon is a
// separate tap that opens a conversation with that lead.
function ProposalMiniCard({
    proposal,
    onPress,
    first,
}: {
    proposal: ProposalView;
    onPress: () => void;
    first?: boolean;
}) {
    const router = useRouter();
    const [chatBusy, setChatBusy] = useState(false);
    const name = proposal.leadSnapshot?.displayName ?? 'Creative Lead';
    const quote = proposal.quoteAmount
        ? `₹${(proposal.quoteAmount / 1000).toFixed(0)}k`
        : 'Quote on request';
    const avatarUrl = proposal.leadSnapshot?.profileImageUrl;
    const inits = initials(name);
    const tier = proposal.leadSnapshot?.trustTier;
    const rating = proposal.leadSnapshot?.rating;
    const role = [
        tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'Creative Lead',
        rating ? `★${rating}` : '',
    ].filter(Boolean).join(' · ');
    const leadId = proposal.leadId ?? '';

    const openChat = async () => {
        if (chatBusy || !leadId) return;
        setChatBusy(true);
        try {
            const conv = await conversationService.createConversation(leadId);
            router.push((conv?._id ? `/(app)/inbox?c=${conv._id}` : '/(app)/inbox') as any);
        } catch {
            // kept quiet in the list — the proposal detail surfaces messaging errors
        } finally {
            setChatBusy(false);
        }
    };

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 16,
                borderTopWidth: first ? 0 : 1,
                borderTopColor: 'rgba(255,255,255,0.07)',
            }}
        >
            <Pressable
                onPress={onPress}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 13, minWidth: 0 }}
            >
                {/* Avatar + tier dot */}
                <View style={{ position: 'relative' }}>
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={{ width: 46, height: 46, borderRadius: 23 }} />
                    ) : (
                        <View
                            style={{
                                width: 46, height: 46, borderRadius: 23,
                                backgroundColor: 'rgba(255,107,53,0.15)',
                                alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#FF6B35', fontSize: 16 }}>{inits}</Text>
                        </View>
                    )}
                    {!!tier && !!TIER_DOT[tier] && (
                        <View
                            style={{
                                position: 'absolute', bottom: -1, right: -1, width: 13, height: 13,
                                borderRadius: 7, backgroundColor: TIER_DOT[tier],
                                borderWidth: 2, borderColor: '#09090b',
                            }}
                        />
                    )}
                </View>

                {/* Name + quote + role + pitch */}
                <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                        <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#f4f4f5', fontSize: 15.5, flex: 1 }} numberOfLines={1}>
                            {name}
                        </Text>
                        <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#FF6B35', fontSize: 14 }}>{quote}</Text>
                    </View>
                    {!!role && (
                        <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 11.5, marginTop: 2 }}>{role}</Text>
                    )}
                    {!!proposal.pitch && (
                        <Text
                            style={{ fontFamily: 'Outfit-Regular', color: '#a1a1aa', fontSize: 12.5, lineHeight: 18, marginTop: 7 }}
                            numberOfLines={2}
                        >
                            {proposal.pitch}
                        </Text>
                    )}
                </View>
            </Pressable>

            {/* Chat with this lead */}
            <Pressable
                onPress={openChat}
                disabled={chatBusy || !leadId}
                hitSlop={8}
                accessibilityLabel={`chat-${proposal._id}`}
                style={{
                    width: 38, height: 38, borderRadius: 19,
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
                    alignItems: 'center', justifyContent: 'center',
                    opacity: leadId ? 1 : 0.4,
                }}
            >
                {chatBusy ? <ActivityIndicator size="small" color="#a1a1aa" /> : <MessageCircle size={17} color="#a1a1aa" />}
            </Pressable>
        </View>
    );
}

// ─── Requirement-detail mode ──────────────────────────────────────────────────

type SheetKind = 'stop' | 'cancel' | null;

function RequirementDetail({
    req,
    proposals,
    proposalsLoading,
    id,
}: {
    req: Requirement;
    proposals: ProposalView[];
    proposalsLoading: boolean;
    id: string;
}) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const navClearance = (useMobileTabBarHeight() || 64) + 56;
    const [menuOpen, setMenuOpen] = useState(false);
    const [sheet, setSheet] = useState<SheetKind>(null);
    const [actionBusy, setActionBusy] = useState(false);
    const [actionError, setActionError] = useState('');

    const budget = formatBudget(req.budgetMin, req.budgetMax);
    const canCompare = proposals.length >= 2;

    const handleStatusAction = async (action: 'stop' | 'reopen' | 'cancel') => {
        setActionBusy(true);
        setActionError('');
        try {
            await requirementService.changeStatus(id, action);
            await queryClient.invalidateQueries({ queryKey: ['client', 'requirements'] });
            await queryClient.invalidateQueries({ queryKey: ['client', 'requirement', id] });
            setSheet(null);
        } catch (e: any) {
            setActionError(
                e?.response?.data?.meta?.message ||
                    e?.response?.data?.message ||
                    'Something went wrong.',
            );
        } finally {
            setActionBusy(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: navClearance }}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero card */}
                <View
                    style={{
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.12)',
                        borderRadius: 20,
                        padding: 20,
                        marginBottom: 20,
                        backgroundColor: 'rgba(255,255,255,0.03)',
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: 8,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: 'DMSerifDisplay_400Regular',
                                color: '#f4f4f5',
                                fontSize: 22,
                                flex: 1,
                                marginRight: 12,
                                lineHeight: 28,
                            }}
                        >
                            {req.title || req.occasionText || '—'}
                        </Text>
                        <StatusPill status={req.status ?? 'open'} />
                    </View>
                    {req.occasionText && (
                        <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 14 }}>
                            <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 11 }}>{req.occasionText}</Text>
                        </View>
                    )}

                    {req.city && (
                        <MetaRow
                            icon={<MapPin size={14} color="#71717a" />}
                            text={req.city}
                        />
                    )}
                    {req.eventDate && (
                        <MetaRow
                            icon={<Calendar size={14} color="#71717a" />}
                            text={fmtDate(req.eventDate)}
                        />
                    )}
                    {(req.budgetMin || req.budgetMax) && (
                        <MetaRow
                            icon={<DollarSign size={14} color="#71717a" />}
                            text={budget}
                        />
                    )}

                    {!!req.description && (
                        <Text
                            style={{
                                fontFamily: 'Outfit-Regular',
                                color: '#a1a1aa',
                                fontSize: 13,
                                lineHeight: 20,
                                marginTop: 12,
                                paddingTop: 12,
                                borderTopWidth: 1,
                                borderTopColor: 'rgba(255,255,255,0.06)',
                            }}
                        >
                            {req.description}
                        </Text>
                    )}
                </View>

                {/* Inline error from lifecycle actions */}
                {!!actionError && (
                    <Text
                        style={{
                            fontFamily: 'Outfit-Regular',
                            color: '#ef4444',
                            fontSize: 12,
                            marginBottom: 12,
                        }}
                    >
                        {actionError}
                    </Text>
                )}

                {/* Proposals section */}
                <View style={{ marginBottom: 16 }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 12,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: 'Outfit-SemiBold',
                                color: '#a1a1aa',
                                fontSize: 11,
                                letterSpacing: 1.2,
                                textTransform: 'uppercase',
                            }}
                        >
                            Proposals · {req.proposalCount ?? proposals.length}
                        </Text>

                        {canCompare && (
                            <Pressable
                                onPress={() => router.push(`/(app)/client/${id}/compare` as any)}
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                            >
                                <ArrowLeftRight size={13} color="#FF6B35" />
                                <Text
                                    style={{
                                        fontFamily: 'Outfit-SemiBold',
                                        color: '#FF6B35',
                                        fontSize: 12,
                                        marginLeft: 4,
                                    }}
                                >
                                    Compare
                                </Text>
                            </Pressable>
                        )}
                    </View>

                    {proposalsLoading ? (
                        <ActivityIndicator color="#FF6B35" style={{ marginTop: 20 }} />
                    ) : proposals.length === 0 ? (
                        <View
                            style={{
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.08)',
                                borderRadius: 16,
                                padding: 20,
                                alignItems: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    fontFamily: 'Outfit-Regular',
                                    color: '#52525b',
                                    fontSize: 14,
                                    textAlign: 'center',
                                }}
                            >
                                No proposals yet. Creative Leads are reviewing your requirement.
                            </Text>
                        </View>
                    ) : (
                        proposals.map((p, i) => (
                            <ProposalMiniCard
                                key={p._id}
                                proposal={p}
                                first={i === 0}
                                onPress={() =>
                                    router.push(
                                        `/(app)/client/${id}?proposal=${p._id}` as any,
                                    )
                                }
                            />
                        ))
                    )}
                </View>

                {/* Payment stub footer */}
                <View
                    style={{
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.06)',
                        borderRadius: 14,
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        marginTop: 8,
                        alignItems: 'center',
                    }}
                >
                    <Text
                        style={{
                            fontFamily: 'Outfit-Regular',
                            color: '#52525b',
                            fontSize: 12,
                            textAlign: 'center',
                        }}
                    >
                        Secure booking & payment — coming soon
                    </Text>
                </View>
            </ScrollView>

            {/* Overflow menu */}
            {menuOpen && (
                <Pressable
                    onPress={() => setMenuOpen(false)}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 50,
                    } as any}
                >
                    <View
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 16,
                            backgroundColor: '#18181b',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.12)',
                            borderRadius: 14,
                            overflow: 'hidden',
                            minWidth: 200,
                            zIndex: 51,
                        }}
                    >
                        <Pressable
                            onPress={() => {
                                setMenuOpen(false);
                                router.push(`/(app)/client/${id}/edit` as any);
                            }}
                            style={({ pressed }) => ({
                                paddingVertical: 14,
                                paddingHorizontal: 18,
                                backgroundColor: pressed ? 'rgba(255,255,255,0.05)' : 'transparent',
                            })}
                        >
                            <Text
                                style={{ fontFamily: 'Outfit-Regular', color: '#f4f4f5', fontSize: 14 }}
                            >
                                Edit requirement
                            </Text>
                        </Pressable>

                        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />

                        {req.status === 'open' && (
                            <Pressable
                                onPress={() => {
                                    setMenuOpen(false);
                                    setSheet('stop');
                                }}
                                style={({ pressed }) => ({
                                    paddingVertical: 14,
                                    paddingHorizontal: 18,
                                    backgroundColor: pressed ? 'rgba(255,255,255,0.05)' : 'transparent',
                                })}
                            >
                                <Text
                                    style={{
                                        fontFamily: 'Outfit-Regular',
                                        color: '#f4f4f5',
                                        fontSize: 14,
                                    }}
                                >
                                    Stop new proposals
                                </Text>
                            </Pressable>
                        )}

                        {req.status === 'closed' && (
                            <Pressable
                                onPress={() => {
                                    setMenuOpen(false);
                                    handleStatusAction('reopen');
                                }}
                                style={({ pressed }) => ({
                                    paddingVertical: 14,
                                    paddingHorizontal: 18,
                                    backgroundColor: pressed ? 'rgba(255,255,255,0.05)' : 'transparent',
                                })}
                            >
                                <Text
                                    style={{
                                        fontFamily: 'Outfit-Regular',
                                        color: '#22C55E',
                                        fontSize: 14,
                                    }}
                                >
                                    Reopen to proposals
                                </Text>
                            </Pressable>
                        )}

                        {(req.status === 'open' || req.status === 'closed') && (
                            <>
                                <View
                                    style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }}
                                />
                                <Pressable
                                    onPress={() => {
                                        setMenuOpen(false);
                                        setSheet('cancel');
                                    }}
                                    style={({ pressed }) => ({
                                        paddingVertical: 14,
                                        paddingHorizontal: 18,
                                        backgroundColor: pressed
                                            ? 'rgba(239,68,68,0.08)'
                                            : 'transparent',
                                    })}
                                >
                                    <Text
                                        style={{
                                            fontFamily: 'Outfit-Regular',
                                            color: '#ef4444',
                                            fontSize: 14,
                                        }}
                                    >
                                        Cancel event
                                    </Text>
                                </Pressable>
                            </>
                        )}
                    </View>
                </Pressable>
            )}

            {/* Stop-proposals confirm sheet */}
            {sheet === 'stop' && (
                <ConfirmSheet
                    title="Stop new proposals?"
                    body="Creative Leads won't be able to submit new proposals. You can reopen this at any time."
                    confirmLabel="Stop new proposals"
                    onConfirm={() => handleStatusAction('stop')}
                    onCancel={() => setSheet(null)}
                    busy={actionBusy}
                />
            )}

            {/* Cancel event confirm sheet */}
            {sheet === 'cancel' && (
                <ConfirmSheet
                    title="Cancel this event?"
                    body="This is permanent. All proposals will be closed and Creative Leads will be notified. You'll need to post a new requirement if plans change."
                    confirmLabel="Yes, cancel event"
                    confirmDestructive
                    onConfirm={() => handleStatusAction('cancel')}
                    onCancel={() => setSheet(null)}
                    busy={actionBusy}
                />
            )}

            {/* Menu-open backdrop for dismiss */}
            {menuOpen && (
                <Pressable
                    onPress={() => setMenuOpen(false)}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 40,
                    } as any}
                />
            )}

            {/* Floating "···" button — lives outside scroll so it's always visible */}
            <View
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    zIndex: 60,
                }}
            >
                <Pressable
                    onPress={() => setMenuOpen((v) => !v)}
                    hitSlop={8}
                    style={{
                        padding: 8,
                        borderRadius: 99,
                    }}
                >
                    <MoreHorizontal size={22} color="#a1a1aa" />
                </Pressable>
            </View>
        </View>
    );
}

// ─── Proposal-detail mode ─────────────────────────────────────────────────────

function ProposalDetail({
    proposal,
    req,
    id,
}: {
    proposal: ProposalView;
    req: Requirement;
    id: string;
}) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const navClearance = (useMobileTabBarHeight() || 64) + 56;
    const [declining, setDeclining] = useState(false);
    const [declineError, setDeclineError] = useState('');
    const [messaging, setMessaging] = useState(false);
    const [messageError, setMessageError] = useState('');

    const leadId = proposal.leadId ?? '';
    const leadName = proposal.leadSnapshot?.displayName ?? 'this Creative Lead';
    const avatarUrl = proposal.leadSnapshot?.profileImageUrl;
    const inits = initials(leadName);

    const handleDecline = async () => {
        if (declining) return;
        setDeclining(true);
        setDeclineError('');
        try {
            await requirementService.patchProposal(proposal._id, 'decline');
            await queryClient.invalidateQueries({
                queryKey: ['client', 'requirement', id, 'proposals'],
            });
            router.back();
        } catch (e: any) {
            setDeclineError(
                e?.response?.data?.meta?.message ||
                    e?.response?.data?.message ||
                    'Could not decline. Try again.',
            );
        } finally {
            setDeclining(false);
        }
    };

    const handleMessage = async () => {
        if (messaging || !leadId) return;
        setMessaging(true);
        setMessageError('');
        try {
            const conv = await conversationService.createConversation(leadId);
            if (conv?._id) {
                router.push(`/(app)/inbox?c=${conv._id}` as any);
            } else {
                router.push('/(app)/inbox' as any);
            }
        } catch (e: any) {
            setMessageError(
                e?.response?.data?.meta?.message ||
                    e?.response?.data?.message ||
                    'Could not open conversation.',
            );
        } finally {
            setMessaging(false);
        }
    };

    const quote = proposal.quoteAmount
        ? `₹${(proposal.quoteAmount / 1000).toFixed(0)}k`
        : 'Quote on request';
    const budget = formatBudget(req.budgetMin, req.budgetMax);

    return (
        <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: navClearance }}
            showsVerticalScrollIndicator={false}
        >
            {/* CL identity — taps through to the performer's profile */}
            <Pressable
                onPress={() => leadId && router.push(`/(app)/profile/${leadId}` as any)}
                disabled={!leadId}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 20,
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 18,
                    padding: 16,
                }}
            >
                {avatarUrl ? (
                    <Image
                        source={{ uri: avatarUrl }}
                        style={{ width: 52, height: 52, borderRadius: 26, marginRight: 14 }}
                    />
                ) : (
                    <View
                        style={{
                            width: 52,
                            height: 52,
                            borderRadius: 26,
                            backgroundColor: 'rgba(255,107,53,0.15)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 14,
                        }}
                    >
                        <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#FF6B35', fontSize: 18 }}>
                            {inits}
                        </Text>
                    </View>
                )}
                <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#f4f4f5', fontSize: 17 }}>
                        {leadName}
                    </Text>
                    <Text
                        style={{
                            fontFamily: 'Outfit-Regular',
                            color: '#71717a',
                            fontSize: 12,
                            marginTop: 2,
                        }}
                    >
                        Creative Lead
                    </Text>
                    {!!leadId && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 5 }}>
                            <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#FF6B35', fontSize: 11 }}>
                                View profile
                            </Text>
                            <ChevronRight size={12} color="#FF6B35" />
                        </View>
                    )}
                </View>
            </Pressable>

            {/* Quote vs Budget */}
            <View
                style={{
                    flexDirection: 'row',
                    gap: 12,
                    marginBottom: 20,
                }}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(255,107,53,0.08)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,107,53,0.2)',
                        borderRadius: 16,
                        padding: 16,
                    }}
                >
                    <Text
                        style={{
                            fontFamily: 'Outfit-Regular',
                            color: '#a1a1aa',
                            fontSize: 10,
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            marginBottom: 6,
                        }}
                    >
                        Their quote
                    </Text>
                    <Text
                        style={{
                            fontFamily: 'Outfit-SemiBold',
                            color: '#FF6B35',
                            fontSize: 20,
                        }}
                    >
                        {quote}
                    </Text>
                </View>

                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: 16,
                        padding: 16,
                    }}
                >
                    <Text
                        style={{
                            fontFamily: 'Outfit-Regular',
                            color: '#a1a1aa',
                            fontSize: 10,
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            marginBottom: 6,
                        }}
                    >
                        Your budget
                    </Text>
                    <Text
                        style={{
                            fontFamily: 'Outfit-SemiBold',
                            color: '#e4e4e7',
                            fontSize: 16,
                        }}
                    >
                        {budget}
                    </Text>
                </View>
            </View>

            {/* Pitch */}
            {!!proposal.pitch && (
                <View style={{ marginBottom: 20 }}>
                    <Text
                        style={{
                            fontFamily: 'Outfit-SemiBold',
                            color: '#a1a1aa',
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: 1.2,
                            marginBottom: 8,
                        }}
                    >
                        Their pitch
                    </Text>
                    <Text
                        style={{
                            fontFamily: 'Outfit-Regular',
                            color: '#e4e4e7',
                            fontSize: 14,
                            lineHeight: 22,
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.08)',
                            borderRadius: 16,
                            padding: 16,
                        }}
                    >
                        {proposal.pitch}
                    </Text>
                </View>
            )}

            {/* Portfolio links */}
            {Array.isArray(proposal.portfolioLinks) && proposal.portfolioLinks.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                    <Text
                        style={{
                            fontFamily: 'Outfit-SemiBold',
                            color: '#a1a1aa',
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: 1.2,
                            marginBottom: 8,
                        }}
                    >
                        Recent work
                    </Text>
                    {proposal.portfolioLinks.map((link, i) => (
                        <Pressable
                            key={i}
                            onPress={() => Linking.openURL(link).catch(() => {})}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 12,
                                paddingHorizontal: 14,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.1)',
                                borderRadius: 12,
                                marginBottom: 8,
                                backgroundColor: 'rgba(255,255,255,0.02)',
                            }}
                        >
                            <ExternalLink size={14} color="#71717a" />
                            <Text
                                style={{
                                    fontFamily: 'Outfit-Regular',
                                    color: '#FF6B35',
                                    fontSize: 13,
                                    marginLeft: 8,
                                    flex: 1,
                                }}
                                numberOfLines={1}
                            >
                                {link}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            )}

            {/* Requirement recap */}
            <View
                style={{
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.07)',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 24,
                    backgroundColor: 'rgba(255,255,255,0.02)',
                }}
            >
                <Text
                    style={{
                        fontFamily: 'Outfit-SemiBold',
                        color: '#52525b',
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        marginBottom: 10,
                    }}
                >
                    Your requirement
                </Text>
                <Text
                    style={{
                        fontFamily: 'Outfit-SemiBold',
                        color: '#e4e4e7',
                        fontSize: 14,
                        marginBottom: req.occasionText ? 4 : 6,
                    }}
                >
                    {req.title || req.occasionText || '—'}
                </Text>
                {req.occasionText && (
                    <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 }}>
                        <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 11 }}>{req.occasionText}</Text>
                    </View>
                )}
                {req.city && (
                    <MetaRow
                        icon={<MapPin size={12} color="#52525b" />}
                        text={req.city}
                    />
                )}
                {req.eventDate && (
                    <MetaRow
                        icon={<Calendar size={12} color="#52525b" />}
                        text={fmtDate(req.eventDate)}
                    />
                )}
            </View>

            {/* Inline errors */}
            {!!declineError && (
                <Text
                    style={{
                        fontFamily: 'Outfit-Regular',
                        color: '#ef4444',
                        fontSize: 12,
                        marginBottom: 8,
                        textAlign: 'center',
                    }}
                >
                    {declineError}
                </Text>
            )}
            {!!messageError && (
                <Text
                    style={{
                        fontFamily: 'Outfit-Regular',
                        color: '#ef4444',
                        fontSize: 12,
                        marginBottom: 8,
                        textAlign: 'center',
                    }}
                >
                    {messageError}
                </Text>
            )}

            {/* Primary CTA: Book (contract ceremony wires in at step 7) */}
            <Pressable
                onPress={() => router.push(`/(app)/client/${id}/book?proposal=${proposal._id}` as any)}
                disabled={!leadId}
                style={{
                    backgroundColor: '#FF6B35',
                    borderRadius: 14,
                    paddingVertical: 16,
                    alignItems: 'center',
                    marginBottom: 10,
                    opacity: !leadId ? 0.7 : 1,
                }}
            >
                <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#1A0D06', fontSize: 15 }}>
                    Book {leadName}
                </Text>
            </Pressable>

            {/* Secondary: Message */}
            <Pressable
                onPress={handleMessage}
                disabled={messaging}
                style={{
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: 14,
                    paddingVertical: 14,
                    alignItems: 'center',
                    marginBottom: 10,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: messaging ? 0.6 : 1,
                }}
            >
                {messaging ? (
                    <ActivityIndicator size="small" color="#a1a1aa" />
                ) : (
                    <>
                        <MessageCircle size={16} color="#a1a1aa" />
                        <Text
                            style={{ fontFamily: 'Outfit-SemiBold', color: '#a1a1aa', fontSize: 14 }}
                        >
                            Message
                        </Text>
                    </>
                )}
            </Pressable>

            {/* Decline */}
            <Pressable
                onPress={handleDecline}
                disabled={declining}
                style={{
                    paddingVertical: 12,
                    alignItems: 'center',
                    opacity: declining ? 0.5 : 1,
                }}
            >
                {declining ? (
                    <ActivityIndicator size="small" color="#71717a" />
                ) : (
                    <Text style={{ fontFamily: 'Outfit-Regular', color: '#52525b', fontSize: 13 }}>
                        Decline
                    </Text>
                )}
            </Pressable>
        </ScrollView>
    );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ClientRequirementScreen() {
    const router = useRouter();
    const { id, proposal: proposalId } = useLocalSearchParams<{
        id: string;
        proposal?: string;
    }>();

    const reqId = Array.isArray(id) ? id[0] : id ?? '';
    const pid = Array.isArray(proposalId) ? proposalId[0] : proposalId;

    const {
        data: req,
        isLoading: reqLoading,
        isError: reqError,
    } = useQuery({
        queryKey: ['client', 'requirement', reqId],
        queryFn: () => requirementService.detail(reqId),
        enabled: !!reqId,
    });

    const { data: proposals = [], isLoading: proposalsLoading } = useQuery({
        queryKey: ['client', 'requirement', reqId, 'proposals'],
        queryFn: () => requirementService.proposals(reqId),
        enabled: !!reqId,
    });

    const activeProposal: ProposalView | undefined = pid
        ? (proposals as ProposalView[]).find((p) => p._id === pid)
        : undefined;

    const isProposalMode = !!pid;
    const title = isProposalMode
        ? (activeProposal?.leadSnapshot?.displayName ?? 'Proposal')
        : (req?.title || req?.occasionText || 'Requirement');

    if (reqLoading) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={{ flex: 1, backgroundColor: '#09090b', alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator color="#FF6B35" />
                </View>
            </>
        );
    }

    if (reqError || !req) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={{ flex: 1, backgroundColor: '#09090b', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 14, textAlign: 'center' }}>
                        Could not load requirement. Please go back and try again.
                    </Text>
                    <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
                        <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#FF6B35', fontSize: 14 }}>
                            Go back
                        </Text>
                    </Pressable>
                </View>
            </>
        );
    }

    // In proposal-detail mode, if we still haven't found the proposal (proposals list loading),
    // show spinner; if loaded and not found, show error.
    if (isProposalMode && proposalsLoading && !activeProposal) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={{ flex: 1, backgroundColor: '#09090b', alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator color="#FF6B35" />
                </View>
            </>
        );
    }

    if (isProposalMode && !activeProposal && !proposalsLoading) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={{ flex: 1, backgroundColor: '#09090b', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 14, textAlign: 'center' }}>
                        Proposal not found.
                    </Text>
                    <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
                        <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#FF6B35', fontSize: 14 }}>
                            Go back
                        </Text>
                    </Pressable>
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={{ flex: 1, backgroundColor: '#09090b' }}>
                {/* Header */}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingTop: 60,
                        paddingBottom: 14,
                    }}
                >
                    <Pressable onPress={() => router.back()} hitSlop={8} style={{ padding: 4, marginRight: 10 }}>
                        <ChevronLeft size={22} color="#a1a1aa" />
                    </Pressable>
                    <Text
                        style={{
                            fontFamily: 'DMSerifDisplay_400Regular',
                            color: '#f4f4f5',
                            fontSize: 19,
                            flex: 1,
                        }}
                        numberOfLines={1}
                    >
                        {title}
                    </Text>
                    {/* Dismiss X in proposal mode */}
                    {isProposalMode && (
                        <Pressable
                            onPress={() => router.back()}
                            hitSlop={8}
                            style={{ padding: 4 }}
                        >
                            <X size={20} color="#71717a" />
                        </Pressable>
                    )}
                </View>

                {/* Body */}
                <View style={{ flex: 1 }}>
                    {isProposalMode && activeProposal ? (
                        <ProposalDetail proposal={activeProposal} req={req} id={reqId} />
                    ) : (
                        <RequirementDetail
                            req={req}
                            proposals={proposals as ProposalView[]}
                            proposalsLoading={proposalsLoading}
                            id={reqId}
                        />
                    )}
                </View>
            </View>
        </>
    );
}
