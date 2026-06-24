// app/(app)/requirements/[id].tsx
// Detail view for a single client requirement + proposal composer for CLs.
// Custom dark header (headerShown: false) matching the rest of the client flow.
// Surfaces budget, proposal slots left, poster (name · business type · city · time)
// and status — gating the composer when the requirement is no longer open.
// Alert.alert replaced with inline error/success state for web-safety.
// Double-submit guarded via `busy` flag.

import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    ActivityIndicator,
    Image,
    StyleSheet,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, MapPin, Calendar, Zap, Mail, Lock } from 'lucide-react-native';
import { requirementService } from '@/services/requirementService';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';
import { useAuthStore } from '@/stores/authStore';
import { useOrganizer } from '@/hooks/useOrganizer';

// Mirrors PROPOSAL_CAP in gigs-service/src/models/Requirement.ts
const PROPOSAL_CAP = 5;

// Business type → badge label. Individuals get no badge (it's not a "business").
const HIRER_LABEL: Record<string, string> = {
    corporate: 'Company',
    agency: 'Agency',
    institution: 'Venue',
};

const STATUS_META: Record<string, { label: string; color: string }> = {
    open: { label: 'OPEN', color: '#22C55E' },
    in_discussion: { label: 'IN DISCUSSION', color: '#F59E0B' },
    booked: { label: 'BOOKED', color: '#8B5CF6' },
    closed: { label: 'CLOSED', color: '#71717a' },
    cancelled: { label: 'CANCELLED', color: '#71717a' },
    expired: { label: 'EXPIRED', color: '#71717a' },
};

function initialsOf(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return (((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()) || '?';
}

function timeAgo(iso?: string): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (isNaN(then)) return '';
    const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return `${Math.floor(d / 30)}mo ago`;
}

const kfmt = (n: number) =>
    n >= 100000 ? `${(n / 100000).toFixed(n % 100000 ? 1 : 0)}L` : `${Math.round(n / 1000)}K`;

function compactBudget(min?: number | null, max?: number | null): string {
    if (min != null && max != null) return `₹${kfmt(min)}–${kfmt(max)}`;
    if (max != null) return `≤₹${kfmt(max)}`;
    if (min != null) return `₹${kfmt(min)}+`;
    return 'Open';
}

function StatTile({
    label,
    value,
    icon,
    accent,
}: {
    label: string;
    value: string;
    icon?: React.ReactNode;
    accent?: boolean;
}) {
    return (
        <View
            style={{
                flex: 1,
                backgroundColor: accent ? 'rgba(245,158,11,0.07)' : 'rgba(255,255,255,0.03)',
                borderRadius: 12,
                paddingHorizontal: 11,
                paddingVertical: 10,
            }}
        >
            <Text
                style={{
                    fontFamily: 'Outfit-Regular',
                    fontSize: 10,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    color: accent ? 'rgba(245,158,11,0.7)' : '#52525b',
                    marginBottom: 4,
                }}
            >
                {label}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {icon}
                <Text
                    style={{
                        fontFamily: 'Outfit-SemiBold',
                        fontSize: 13,
                        color: accent ? '#F59E0B' : '#e4e4e7',
                    }}
                >
                    {value}
                </Text>
            </View>
        </View>
    );
}

export default function RequirementDetail() {
    const { id, invited } = useLocalSearchParams<{ id: string; invited?: string }>();
    const router = useRouter();
    const role = useAuthStore((s) => s.role);
    const user = useAuthStore((s) => s.user);
    const { isAgency } = useOrganizer();
    // Mirror the server's proposal authorization (proposalController.createProposal):
    // Creative Leads, Artists who arrived via an accepted invite (?invited=1), and
    // agency-supplier clients may propose. The server stays authoritative — it 403s
    // anyone without a valid live invite / agency flag.
    const composerEligible =
        role === 'creative_lead' || invited === '1' || (role === 'client' && isAgency);
    const queryClient = useQueryClient();
    const navClearance = (useMobileTabBarHeight() || 64) + 56;

    const [pitch, setPitch] = useState('');
    const [quote, setQuote] = useState('');
    const [busy, setBusy] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const { data: requirement, isLoading } = useQuery({
        queryKey: ['cl', 'requirement', id],
        queryFn: () => requirementService.detail(id!),
        enabled: !!id,
    });

    const send = async () => {
        if (pitch.trim().length < 20 || busy) return;
        setBusy(true);
        setErrorMsg('');
        try {
            await requirementService.propose(id!, {
                pitch: pitch.trim(),
                quoteAmount: quote ? Number(quote) : null,
            });
            // Invalidate the feed so slot count refreshes when user navigates back.
            queryClient.invalidateQueries({ queryKey: ['cl', 'requirements', 'feed'] });
            router.back();
        } catch (e: any) {
            const msg =
                e?.response?.data?.meta?.message ||
                e?.message ||
                'Could not send proposal. Please try again.';
            setErrorMsg(msg);
        } finally {
            setBusy(false);
        }
    };

    if (isLoading || !requirement) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.loadingContainer}>
                    <Pressable onPress={() => router.back()} hitSlop={12} style={styles.loadingBack}>
                        <ChevronLeft size={22} color="#a1a1aa" />
                    </Pressable>
                    <ActivityIndicator color="#FF6B35" />
                </View>
            </>
        );
    }

    const canSend = pitch.trim().length >= 20;

    // Never offer the composer on your own requirement — the server 403s it.
    const isOwner = !!user?._id && String(user._id) === String(requirement.clientId);
    const showComposer = composerEligible && !isOwner;

    const status = (requirement.status as string) || 'open';
    const isOpen = status === 'open';
    const statusMeta = STATUS_META[status] ?? STATUS_META.open;
    const snap = requirement.clientSnapshot || {};
    const hirerLabel = HIRER_LABEL[snap.hirerType ?? ''];
    const slotsLeft = Math.max(0, PROPOSAL_CAP - (requirement.proposalCount || 0));
    const photos: string[] = Array.isArray(requirement.photos) ? requirement.photos : [];
    const eventDateShort = new Date(requirement.eventDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
    });

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView
                className="flex-1 bg-[#09090b]"
                contentContainerStyle={[styles.scrollContent, { paddingBottom: navClearance }]}
            >
                {/* Custom header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} hitSlop={12}>
                        <ChevronLeft size={22} color="#a1a1aa" />
                    </Pressable>
                    <Text
                        style={{
                            fontFamily: 'SpaceMono',
                            fontSize: 10,
                            letterSpacing: 2.5,
                            color: '#52525b',
                        }}
                    >
                        REQUIREMENT
                    </Text>
                    <View style={{ width: 22 }} />
                </View>

                {/* Invited-artist context banner */}
                {invited === '1' && role !== 'creative_lead' && (
                    <View style={styles.invitedBanner}>
                        <Mail size={15} color="#A78BFA" />
                        <Text style={{ fontFamily: 'Outfit-Regular', color: '#C4B5FD', fontSize: 12, flex: 1 }}>
                            You were invited to propose on this requirement.
                        </Text>
                    </View>
                )}

                {/* Occasion eyebrow + status */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    {!!requirement.occasionText && (
                        <Text
                            style={{
                                fontFamily: 'SpaceMono',
                                fontSize: 10,
                                letterSpacing: 2,
                                color: '#FF6B35',
                                textTransform: 'uppercase',
                            }}
                        >
                            {requirement.occasionText}
                        </Text>
                    )}
                    <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: '#3f3f46' }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusMeta.color }} />
                        <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 10, letterSpacing: 0.5, color: statusMeta.color }}>
                            {statusMeta.label}
                        </Text>
                    </View>
                </View>

                {/* Serif title */}
                <Text
                    style={{
                        fontFamily: 'DMSerifDisplay_400Regular',
                        color: '#f4f4f5',
                        fontSize: 23,
                        lineHeight: 28,
                        marginBottom: 14,
                    }}
                >
                    {requirement.title || requirement.occasionText}
                </Text>

                {/* Posted by — name · business type · city · time */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <View style={styles.avatar}>
                        <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#d4d4d8', fontSize: 12 }}>
                            {initialsOf(snap.displayName)}
                        </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                            <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#e4e4e7', fontSize: 13 }} numberOfLines={1}>
                                {snap.displayName || 'Client'}
                            </Text>
                            {!!hirerLabel && (
                                <View style={styles.hirerBadge}>
                                    <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#D4A155', fontSize: 9, letterSpacing: 0.5 }}>
                                        {hirerLabel.toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Text style={{ fontFamily: 'Outfit-Regular', color: '#52525b', fontSize: 11.5, marginTop: 1 }}>
                            {[snap.city, timeAgo(requirement.createdAt)].filter(Boolean).join(' · ')}
                        </Text>
                    </View>
                </View>

                {/* Stat tiles */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    <StatTile label="City" value={requirement.city} icon={<MapPin size={12} color="#71717a" />} />
                    <StatTile label="Date" value={eventDateShort} icon={<Calendar size={12} color="#71717a" />} />
                    <StatTile label="Budget" value={compactBudget(requirement.budgetMin, requirement.budgetMax)} accent />
                </View>

                {/* Slots-left urgency — only while open */}
                {isOpen && (
                    <View style={{ flexDirection: 'row', marginBottom: 18 }}>
                        <View style={styles.slotsPill}>
                            <Zap size={12} color="#FF6B35" />
                            <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#FF6B35', fontSize: 11 }}>
                                {slotsLeft > 0
                                    ? `${slotsLeft} of ${PROPOSAL_CAP} proposal slots left`
                                    : 'Proposal slots full'}
                            </Text>
                        </View>
                    </View>
                )}

                {/* The brief */}
                <Text style={styles.sectionLabel}>The brief</Text>
                <Text style={{ fontFamily: 'Outfit-Regular', color: '#a1a1aa', fontSize: 13, lineHeight: 21, marginBottom: 16 }}>
                    {requirement.description}
                </Text>

                {/* Reference photos — only when the client attached any */}
                {photos.length > 0 && (
                    <>
                        <Text style={styles.sectionLabel}>Reference</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                            {photos.slice(0, 3).map((uri, i) => (
                                <Image
                                    key={`${uri}-${i}`}
                                    source={{ uri }}
                                    style={{ width: 76, height: 76, borderRadius: 10, backgroundColor: '#1c1c22' }}
                                />
                            ))}
                        </View>
                    </>
                )}

                {/* Proposal composer — Creative Leads / invited Artists, while open */}
                {showComposer && isOpen && (
                    <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 16, marginTop: 2 }}>
                        <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', color: '#f4f4f5', fontSize: 17, marginBottom: 10 }}>
                            Your proposal
                        </Text>
                        <TextInput
                            value={pitch}
                            onChangeText={setPitch}
                            multiline
                            textAlignVertical="top"
                            placeholder="Why you, your relevant work, what you'd bring (min 20 chars)"
                            placeholderTextColor="#52525b"
                            style={{ fontFamily: 'Outfit-Regular' }}
                            className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-zinc-100 min-h-[96px] mb-1"
                        />
                        <Text
                            style={{ fontFamily: 'Outfit-Regular' }}
                            className={`text-[11px] mb-3 text-right ${pitch.trim().length < 20 ? 'text-zinc-600' : 'text-zinc-500'}`}
                        >
                            {pitch.trim().length} / 20 min chars
                        </Text>

                        <Text style={styles.sectionLabel}>Quote · optional</Text>
                        <View style={styles.quoteField}>
                            <Text style={{ fontFamily: 'Outfit-Regular', color: '#71717a', fontSize: 14 }}>₹</Text>
                            <TextInput
                                value={quote}
                                onChangeText={(v) => setQuote(v.replace(/[^0-9]/g, ''))}
                                keyboardType="number-pad"
                                placeholder="45,000"
                                placeholderTextColor="#52525b"
                                style={{ fontFamily: 'Outfit-Regular', color: '#f4f4f5', fontSize: 14, flex: 1, padding: 0 }}
                            />
                        </View>

                        {errorMsg ? (
                            <Text
                                style={{ fontFamily: 'Outfit-Regular' }}
                                className="text-red-400 text-[13px] mb-3 text-center"
                            >
                                {errorMsg}
                            </Text>
                        ) : null}

                        <Pressable
                            onPress={send}
                            disabled={!canSend || busy}
                            style={{
                                backgroundColor: canSend ? '#FF6B35' : 'rgba(255,255,255,0.1)',
                                borderRadius: 12,
                                paddingVertical: 13,
                                alignItems: 'center',
                            }}
                        >
                            {busy ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text
                                    style={{
                                        fontFamily: 'Outfit-SemiBold',
                                        fontSize: 14,
                                        color: canSend ? '#1A0D06' : '#71717a',
                                    }}
                                >
                                    Send proposal
                                </Text>
                            )}
                        </Pressable>
                    </View>
                )}

                {/* Closed to proposals — composer hidden, reason shown */}
                {showComposer && !isOpen && (
                    <View style={styles.closedCard}>
                        <Lock size={15} color="#71717a" />
                        <Text style={{ fontFamily: 'Outfit-Regular', color: '#a1a1aa', fontSize: 12.5, flex: 1, lineHeight: 18 }}>
                            This requirement is no longer taking proposals.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: '#09090b',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingBack: {
        position: 'absolute',
        top: 56,
        left: 20,
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,
    },
    invitedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(139,92,246,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(139,92,246,0.25)',
        borderRadius: 11,
        paddingHorizontal: 12,
        paddingVertical: 9,
        marginBottom: 16,
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#27272a',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    hirerBadge: {
        backgroundColor: 'rgba(212,161,85,0.12)',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(212,161,85,0.45)',
        borderRadius: 999,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    slotsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,107,53,0.4)',
        backgroundColor: 'rgba(255,107,53,0.08)',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    sectionLabel: {
        fontFamily: 'Outfit-Regular',
        fontSize: 10,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        color: '#52525b',
        marginBottom: 6,
    },
    quoteField: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 11,
        marginBottom: 14,
    },
    closedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginTop: 4,
    },
});
