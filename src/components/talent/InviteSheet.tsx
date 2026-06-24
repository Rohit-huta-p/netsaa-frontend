/**
 * InviteSheet.tsx
 *
 * Centered modal overlay (React Native <Modal>, web + native safe). A dimmed
 * backdrop fills the screen and the card sits in the middle; tapping the
 * backdrop or the X closes it, tapping the card does not. Body scrolls when
 * it outgrows the capped card height. Conditionally shown via `visible`.
 *
 * Two modes:
 *   A) Requirement-attached: selectable open-requirement rows → Send
 *   B) Context-free: "Just say hello" toggle → note TextInput → Send
 *
 * Falls back to Mode B (with a hint) when the client has no open requirements.
 *
 * Props:
 *   visible     — controls render
 *   person      — { _id, displayName, role }
 *   onClose     — called after close / dismiss
 *   onSent?     — called after a successful 201
 */

import { useState, useRef } from 'react';
import {
    View,
    Text,
    Pressable,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, CheckCircle, X, Link2, Clock, Check } from 'lucide-react-native';
import { requirementService } from '@/services/requirementService';
import { inviteService, LIVE_INVITE_STATUSES, type SentInvite } from '@/services/inviteService';

// ─── Types ────────────────────────────────────────────────────────────────────

type Person = {
    _id: string;
    displayName: string;
    role: 'artist' | 'creative_lead' | 'agency';
};

type InviteSheetProps = {
    visible: boolean;
    person: Person;
    onClose: () => void;
    onSent?: () => void;
    // ── Connect-only mode (Find-talent screen) ──
    // When `onConnectOnly` is provided, the sheet shows a "Connect only" section
    // at the top (pure connection request, no requirement pitch). `connState`
    // drives that section's status. `isClient === false` hides the invite
    // (requirement-pitch) section entirely — non-clients can only connect.
    // When `onConnectOnly` is omitted, the sheet behaves as a plain invite sheet
    // (unchanged for existing callers like ClientPublicProfile).
    connState?: 'none' | 'pending' | 'connected';
    onConnectOnly?: () => Promise<void> | void;
    isClient?: boolean;
};

type Requirement = {
    _id: string;
    title?: string;
    occasionText?: string;
    city?: string;
    eventDate?: string;
    status?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso?: string): string {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return '';
    }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InviteSheet({
    visible,
    person,
    onClose,
    onSent,
    connState,
    onConnectOnly,
    isClient,
}: InviteSheetProps) {
    const router = useRouter();
    const queryClient = useQueryClient();

    // Connect-only section is active when the parent wires onConnectOnly.
    const connectMode = !!onConnectOnly;
    // Invite (requirement-pitch) section: shown for the plain invite sheet, and
    // for clients in connect mode. Hidden for non-client connect-mode viewers.
    const showInvite = !connectMode || isClient !== false;

    // Requirement list — only relevant when the invite section is visible.
    const { data: allRequirements = [], isLoading: reqLoading } = useQuery<Requirement[]>({
        queryKey: ['client', 'requirements'],
        queryFn: () => requirementService.mine() as Promise<Requirement[]>,
        enabled: visible && showInvite,
    });

    const openRequirements = allRequirements.filter((r) => r.status === 'open');
    const hasOpenReqs = openRequirements.length > 0;

    // Live invites already sent to THIS person. The server enforces one live
    // invite per (client, recipient, requirement); reflect that here so an
    // already-invited target reads as "Invited" up front instead of surfacing a
    // 409 only on submit.
    const { data: sentInvites = [] } = useQuery<SentInvite[]>({
        queryKey: ['invites', 'sent'],
        queryFn: () => inviteService.sent(),
        enabled: visible && showInvite,
    });
    const liveForPerson = sentInvites.filter(
        (i) =>
            String(i.toUserId) === String(person._id) &&
            (LIVE_INVITE_STATUSES as readonly string[]).includes(i.status),
    );
    const liveReqInvite = (reqId: string) =>
        liveForPerson.find((i) => i.requirementId && String(i.requirementId) === String(reqId));
    const helloInvite = liveForPerson.find((i) => !i.requirementId);

    // Open requirements not already invited to — the ones still pickable.
    const availableReqs = openRequirements.filter((r) => !liveReqInvite(r._id));

    // Selection + mode state
    const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
    // Mode B toggle: true when "Just say hello" is active
    const [helloMode, setHelloMode] = useState(false);
    const [note, setNote] = useState('');

    // Connect-mode sheet with nothing left to invite to — no open requirements,
    // OR every open requirement already invited — and not composing a hello.
    // Disable the invite actions and promote Connect instead. (The plain invite
    // sheet keeps its context-free note path.)
    const noReqsConnect = connectMode && availableReqs.length === 0 && !helloMode;

    // Submission state
    // Opt-in: also fire a connection request when sending the invite.
    const [alsoConnect, setAlsoConnect] = useState(false);
    const [busy, setBusy] = useState(false);
    const [connectBusy, setConnectBusy] = useState(false);
    const [error, setError] = useState('');
    // Success flash message — set on a sent invite OR a sent connection request.
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    // Which invite is currently being withdrawn (id), for per-row spinner.
    const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

    // Double-submit guard via ref (works on web too — no extra deps)
    const submittingRef = useRef(false);

    // Reset all local state when sheet opens/closes
    const handleClose = () => {
        setSelectedReqId(null);
        setHelloMode(false);
        setNote('');
        setError('');
        setSuccessMsg(null);
        setConnectBusy(false);
        setAlsoConnect(false);
        submittingRef.current = false;
        onClose();
    };

    // Connect-only — fire a pure connection request via the parent handler.
    const handleConnectOnly = async () => {
        if (!onConnectOnly || connectBusy || busy) return;
        setError('');
        setConnectBusy(true);
        try {
            await onConnectOnly();
            setSuccessMsg('Connection request sent');
            setTimeout(() => handleClose(), 1400);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    'Could not send the connection request.',
            );
        } finally {
            setConnectBusy(false);
        }
    };

    // Sender withdraws a still-pending invite, freeing the slot to re-invite.
    const handleWithdraw = async (inviteId: string) => {
        if (withdrawingId) return;
        setError('');
        setWithdrawingId(inviteId);
        try {
            await inviteService.withdraw(inviteId);
            await queryClient.invalidateQueries({ queryKey: ['invites', 'sent'] });
        } catch (err: any) {
            setError(
                err?.response?.data?.meta?.message ||
                    err?.response?.data?.message ||
                    'Could not withdraw the invite.',
            );
        } finally {
            setWithdrawingId(null);
        }
    };

    const handleSend = async () => {
        if (submittingRef.current || busy) return;
        setError('');

        // Validate
        if (helloMode || !hasOpenReqs) {
            if (note.trim().length < 3) {
                setError('Please add a short note (at least 3 characters).');
                return;
            }
        } else {
            if (!selectedReqId) {
                setError('Please select a requirement or use "Just say hello".');
                return;
            }
        }

        submittingRef.current = true;
        setBusy(true);
        try {
            const body: Parameters<typeof inviteService.create>[0] = {
                toUserId: person._id,
                toRole: person.role,
            };
            if (helloMode || !hasOpenReqs) {
                body.note = note.trim();
            } else {
                body.requirementId = selectedReqId!;
            }

            await inviteService.create(body);

            // Optimistically invalidate sent invites cache
            void queryClient.invalidateQueries({ queryKey: ['invites', 'sent'] });

            // Opt-in add-on: fire a connection request alongside the invite when
            // the user ticked the checkbox. The invite already succeeded, so a
            // failed connection request must NOT surface as a send error — it can
            // be retried later from the directory.
            let connectAlsoSent = false;
            if (alsoConnect && onConnectOnly && (connState ?? 'none') === 'none') {
                try {
                    await onConnectOnly();
                    connectAlsoSent = true;
                } catch {
                    // swallow — invite is the primary action and it went through
                }
            }

            setSuccessMsg(connectAlsoSent ? 'Invite + connection request sent' : 'Invite sent');
            onSent?.();

            // Auto-close after brief success flash
            setTimeout(() => {
                handleClose();
            }, 1400);
        } catch (err: any) {
            submittingRef.current = false;
            const status = err?.response?.status;
            const serverMsg =
                err?.response?.data?.meta?.message ||
                err?.response?.data?.message;

            if (status === 409) {
                setError(serverMsg || 'You already have a live invite to this person for this requirement.');
            } else if (status === 403) {
                setError(serverMsg || 'You are not allowed to send this invite.');
            } else if (status === 400) {
                setError(serverMsg || 'Please check your input and try again.');
            } else {
                setError(serverMsg || 'Something went wrong. Please try again.');
            }
        } finally {
            setBusy(false);
        }
    };

    if (!visible) return null;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <Modal
            visible
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={handleClose}
        >
            <Pressable
                onPress={handleClose}
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.66)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 18,
                }}
            >
                <Pressable
                    // Card — swallow taps so they don't dismiss via the backdrop.
                    onPress={() => {}}
                    style={{
                        width: '100%',
                        maxWidth: 420,
                        maxHeight: '86%',
                        backgroundColor: '#18181b',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.10)',
                        borderRadius: 20,
                        overflow: 'hidden',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 14 },
                        shadowOpacity: 0.45,
                        shadowRadius: 28,
                        elevation: 14,
                    }}
                >
                    {/* Header */}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 18,
                            paddingTop: 18,
                            paddingBottom: 14,
                            borderBottomWidth: 1,
                            borderBottomColor: 'rgba(255,255,255,0.06)',
                        }}
                    >
                <Text
                    style={{ fontFamily: 'Outfit-SemiBold', color: '#f4f4f5', fontSize: 16 }}
                    numberOfLines={1}
                >
                    {showInvite ? `Invite ${person.displayName}` : `Connect with ${person.displayName}`}
                </Text>
                <Pressable onPress={handleClose} hitSlop={8}>
                    <X size={18} color="#71717a" />
                </Pressable>
            </View>

            <ScrollView
                style={{ flexShrink: 1 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >

            {/* Success flash — invite sent OR connection request sent */}
            {successMsg && (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        paddingHorizontal: 18,
                        paddingVertical: 16,
                    }}
                >
                    <CheckCircle size={18} color="#22C55E" />
                    <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#22C55E', fontSize: 14 }}>
                        {successMsg}
                    </Text>
                </View>
            )}

            {!successMsg && (
                <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18 }}>
                    {/* ── Connect-only as the PRIMARY action — only for non-client
                        viewers, who can't pitch a requirement. Clients get the quiet
                        connect link + checkbox down by the Send button instead. ── */}
                    {connectMode && !showInvite && (
                        <ConnectOnlySection
                            state={connState ?? 'none'}
                            busy={connectBusy}
                            onConnect={handleConnectOnly}
                            showInviteBelow={false}
                        />
                    )}

                    {/* Invite (requirement-pitch) section — hidden for non-client connect viewers */}
                    {showInvite && reqLoading && (
                        <ActivityIndicator color="#FF6B35" style={{ marginBottom: 12 }} />
                    )}

                    {/* Mode A: Requirement list — only shown when NOT in helloMode and has open reqs */}
                    {showInvite && !reqLoading && hasOpenReqs && !helloMode && (
                        <>
                            <Text
                                style={{
                                    fontFamily: 'Outfit-Regular',
                                    color: '#71717a',
                                    fontSize: 12,
                                    marginBottom: 10,
                                }}
                            >
                                Select an open requirement:
                            </Text>

                            <View>
                                {openRequirements.map((req) => {
                                    const label = req.title || req.occasionText || 'Requirement';
                                    const meta = [req.city, req.eventDate ? fmtDate(req.eventDate) : '']
                                        .filter(Boolean)
                                        .join(' · ');
                                    const invited = liveReqInvite(req._id);
                                    const isSelected = !invited && selectedReqId === req._id;

                                    return (
                                        <Pressable
                                            key={req._id}
                                            // Already-invited rows aren't selectable — the server would
                                            // 409 the duplicate. The Withdraw child handles its own press.
                                            onPress={invited ? undefined : () => setSelectedReqId(req._id)}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                borderWidth: 1,
                                                borderColor: invited
                                                    ? 'rgba(34,197,94,0.30)'
                                                    : isSelected
                                                    ? '#FF6B35'
                                                    : 'rgba(255,255,255,0.10)',
                                                backgroundColor: invited
                                                    ? 'rgba(34,197,94,0.06)'
                                                    : isSelected
                                                    ? 'rgba(255,107,53,0.08)'
                                                    : 'transparent',
                                                borderRadius: 12,
                                                paddingVertical: 11,
                                                paddingHorizontal: 13,
                                                marginBottom: 8,
                                                gap: 10,
                                            }}
                                        >
                                            {/* Selection / invited indicator */}
                                            {invited ? (
                                                <CheckCircle size={16} color="#22C55E" />
                                            ) : (
                                                <View
                                                    style={{
                                                        width: 16,
                                                        height: 16,
                                                        borderRadius: 8,
                                                        borderWidth: 1.5,
                                                        borderColor: isSelected ? '#FF6B35' : '#52525b',
                                                        backgroundColor: isSelected
                                                            ? '#FF6B35'
                                                            : 'transparent',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {isSelected && (
                                                        <View
                                                            style={{
                                                                width: 6,
                                                                height: 6,
                                                                borderRadius: 3,
                                                                backgroundColor: '#fff',
                                                            }}
                                                        />
                                                    )}
                                                </View>
                                            )}

                                            <View style={{ flex: 1 }}>
                                                <Text
                                                    style={{
                                                        fontFamily: 'Outfit-SemiBold',
                                                        color: invited ? '#a1a1aa' : '#f4f4f5',
                                                        fontSize: 13,
                                                    }}
                                                    numberOfLines={1}
                                                >
                                                    {label}
                                                </Text>
                                                {!!meta && (
                                                    <View
                                                        style={{
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                            marginTop: 3,
                                                        }}
                                                    >
                                                        {req.city && (
                                                            <MapPin size={11} color="#71717a" />
                                                        )}
                                                        <Text
                                                            style={{
                                                                fontFamily: 'Outfit-Regular',
                                                                color: '#71717a',
                                                                fontSize: 11,
                                                            }}
                                                        >
                                                            {meta}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>

                                            {/* Invited → status + Withdraw */}
                                            {invited && (
                                                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                                                    <Text
                                                        style={{
                                                            fontFamily: 'Outfit-SemiBold',
                                                            color: '#22C55E',
                                                            fontSize: 11,
                                                        }}
                                                    >
                                                        Invited
                                                    </Text>
                                                    <Pressable
                                                        onPress={() => handleWithdraw(invited._id)}
                                                        disabled={withdrawingId === invited._id}
                                                        hitSlop={8}
                                                    >
                                                        {withdrawingId === invited._id ? (
                                                            <ActivityIndicator color="#71717a" size="small" />
                                                        ) : (
                                                            <Text
                                                                style={{
                                                                    fontFamily: 'Outfit-Regular',
                                                                    color: '#71717a',
                                                                    fontSize: 11,
                                                                    textDecorationLine: 'underline',
                                                                }}
                                                            >
                                                                Withdraw
                                                            </Text>
                                                        )}
                                                    </Pressable>
                                                </View>
                                            )}
                                        </Pressable>
                                    );
                                })}
                            </View>

                            {/* Secondary actions — plain underlined text links */}
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 18,
                                    paddingVertical: 10,
                                    marginBottom: 2,
                                }}
                            >
                                <Pressable
                                    onPress={() => {
                                        handleClose();
                                        router.push('/(app)/client/new-requirement' as any);
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontFamily: 'Outfit-SemiBold',
                                            color: '#FF6B35',
                                            fontSize: 12,
                                            textDecorationLine: 'underline',
                                        }}
                                    >
                                        New requirement
                                    </Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => {
                                        setHelloMode(true);
                                        setSelectedReqId(null);
                                        setError('');
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontFamily: 'Outfit-Regular',
                                            color: '#71717a',
                                            fontSize: 12,
                                            textDecorationLine: 'underline',
                                        }}
                                    >
                                        Just say hello
                                    </Text>
                                </Pressable>
                            </View>
                        </>
                    )}

                    {/* Mode B: Context-free note — shown when helloMode is true or no open reqs */}
                    {showInvite && !reqLoading && (helloMode || !hasOpenReqs) && (
                        <>
                            {!hasOpenReqs && (
                                <View
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.04)',
                                        borderRadius: 10,
                                        padding: 12,
                                        marginBottom: 12,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontFamily: 'Outfit-Regular',
                                            color: '#71717a',
                                            fontSize: 12,
                                            lineHeight: 18,
                                        }}
                                    >
                                        {connectMode
                                            ? `You don't have an open requirement to invite ${person.displayName} to — create one, or just connect below.`
                                            : `You don't have any open requirements yet. You can invite ${person.displayName} with a short note, or create a new requirement first.`}
                                    </Text>
                                    <Pressable
                                        onPress={() => {
                                            handleClose();
                                            router.push('/(app)/client/new-requirement' as any);
                                        }}
                                        style={{ marginTop: 8 }}
                                    >
                                        <Text
                                            style={{
                                                fontFamily: 'Outfit-SemiBold',
                                                color: '#FF6B35',
                                                fontSize: 12,
                                                textDecorationLine: 'underline',
                                            }}
                                        >
                                            New requirement
                                        </Text>
                                    </Pressable>
                                </View>
                            )}

                            {hasOpenReqs && helloMode && (
                                <Pressable
                                    onPress={() => {
                                        setHelloMode(false);
                                        setNote('');
                                        setError('');
                                    }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 4,
                                        marginBottom: 12,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontFamily: 'Outfit-Regular',
                                            color: '#71717a',
                                            fontSize: 12,
                                            textDecorationLine: 'underline',
                                        }}
                                    >
                                        ← Back to requirements
                                    </Text>
                                </Pressable>
                            )}

                            {helloInvite ? (
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 8,
                                        borderWidth: 1,
                                        borderColor: 'rgba(34,197,94,0.30)',
                                        backgroundColor: 'rgba(34,197,94,0.06)',
                                        borderRadius: 12,
                                        paddingVertical: 12,
                                        paddingHorizontal: 14,
                                        marginBottom: 8,
                                    }}
                                >
                                    <CheckCircle size={15} color="#22C55E" />
                                    <Text
                                        style={{
                                            flex: 1,
                                            fontFamily: 'Outfit-SemiBold',
                                            color: '#22C55E',
                                            fontSize: 13,
                                        }}
                                        numberOfLines={1}
                                    >
                                        You've already invited {person.displayName}
                                    </Text>
                                    <Pressable
                                        onPress={() => handleWithdraw(helloInvite._id)}
                                        disabled={withdrawingId === helloInvite._id}
                                        hitSlop={8}
                                    >
                                        {withdrawingId === helloInvite._id ? (
                                            <ActivityIndicator color="#71717a" size="small" />
                                        ) : (
                                            <Text
                                                style={{
                                                    fontFamily: 'Outfit-Regular',
                                                    color: '#a1a1aa',
                                                    fontSize: 12,
                                                    textDecorationLine: 'underline',
                                                }}
                                            >
                                                Withdraw
                                            </Text>
                                        )}
                                    </Pressable>
                                </View>
                            ) : (helloMode || !connectMode) ? (
                                <>
                                    <Text
                                        style={{
                                            fontFamily: 'Outfit-Regular',
                                            color: '#71717a',
                                            fontSize: 12,
                                            marginBottom: 8,
                                        }}
                                    >
                                        Add a short note (required):
                                    </Text>

                                    <TextInput
                                        value={note}
                                        onChangeText={(t) => {
                                            setNote(t);
                                            if (error) setError('');
                                        }}
                                        placeholder="e.g. Loved your work, would love to connect…"
                                        placeholderTextColor="#52525b"
                                        multiline
                                        maxLength={500}
                                        style={{
                                            fontFamily: 'Outfit-Regular',
                                            color: '#f4f4f5',
                                            fontSize: 13,
                                            backgroundColor: '#15151C',
                                            borderWidth: 1,
                                            borderColor: '#20202A',
                                            borderRadius: 12,
                                            paddingHorizontal: 12,
                                            paddingVertical: 10,
                                            minHeight: 80,
                                            textAlignVertical: 'top',
                                            marginBottom: 6,
                                        }}
                                    />
                                    <Text
                                        style={{
                                            fontFamily: 'Outfit-Regular',
                                            color: '#52525b',
                                            fontSize: 10,
                                            textAlign: 'right',
                                            marginBottom: 12,
                                        }}
                                    >
                                        {note.length}/500
                                    </Text>
                                </>
                            ) : null}
                        </>
                    )}

                    {/* Inline error */}
                    {!!error && (
                        <Text
                            style={{
                                fontFamily: 'Outfit-Regular',
                                color: '#ef4444',
                                fontSize: 12,
                                marginBottom: 10,
                                lineHeight: 18,
                            }}
                        >
                            {error}
                        </Text>
                    )}

                    {/* Also send a connection request — opt-in add-on. Shown only
                        when the parent supports connecting and we're not already
                        connected/pending. Sends the invite AND a connection request. */}
                    {showInvite && !reqLoading && connectMode && (connState ?? 'none') === 'none' && (
                        <Pressable
                            onPress={noReqsConnect ? undefined : () => setAlsoConnect((v) => !v)}
                            disabled={noReqsConnect}
                            hitSlop={6}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 9,
                                marginBottom: 12,
                                opacity: noReqsConnect ? 0.4 : 1,
                            }}
                        >
                            <View
                                style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: 5,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: alsoConnect ? '#8B5CF6' : 'transparent',
                                    borderWidth: alsoConnect ? 0 : 1.5,
                                    borderColor: '#52525b',
                                }}
                            >
                                {alsoConnect && <Check size={12} color="#fff" />}
                            </View>
                            <Text style={{ fontFamily: 'Outfit-Regular', color: '#a1a1aa', fontSize: 12.5 }}>
                                Also send a{' '}
                                <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#c4b5fd' }}>
                                    connection request
                                </Text>
                            </Text>
                        </Pressable>
                    )}

                    {/* Send button — hidden when the active (hello) target is already invited */}
                    {showInvite && !reqLoading && !((helloMode || !hasOpenReqs) && helloInvite) && (
                        <Pressable
                            onPress={handleSend}
                            disabled={busy || noReqsConnect}
                            style={{
                                backgroundColor: '#FF6B35',
                                borderRadius: 12,
                                paddingVertical: 12,
                                alignItems: 'center',
                                opacity: busy || noReqsConnect ? 0.5 : 1,
                            }}
                        >
                            {busy ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text
                                    style={{
                                        fontFamily: 'Outfit-SemiBold',
                                        color: '#fff',
                                        fontSize: 14,
                                    }}
                                >
                                    Send invite
                                </Text>
                            )}
                        </Pressable>
                    )}

                    {/* Divider + quiet connect-only alternative, tucked under the
                        invite. Distinct from the checkbox above: this sends a pure
                        connection request with NO requirement pitch. */}
                    {showInvite && !reqLoading && connectMode && (
                        <>
                            <View
                                style={{
                                    width: 48,
                                    height: 1,
                                    backgroundColor: 'rgba(255,255,255,0.14)',
                                    alignSelf: 'center',
                                    marginVertical: 14,
                                }}
                            />
                            {(connState ?? 'none') === 'none' && (
                                <Pressable
                                    onPress={handleConnectOnly}
                                    disabled={connectBusy}
                                    accessibilityLabel="connect-only"
                                    style={
                                        noReqsConnect
                                            ? {
                                                  flexDirection: 'row',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  gap: 8,
                                                  backgroundColor: '#8B5CF6',
                                                  borderRadius: 12,
                                                  paddingVertical: 13,
                                                  opacity: connectBusy ? 0.6 : 1,
                                              }
                                            : {
                                                  flexDirection: 'row',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  gap: 7,
                                                  opacity: connectBusy ? 0.6 : 1,
                                              }
                                    }
                                >
                                    {connectBusy ? (
                                        <ActivityIndicator color={noReqsConnect ? '#fff' : '#8B5CF6'} />
                                    ) : noReqsConnect ? (
                                        <>
                                            <Link2 size={15} color="#fff" />
                                            <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#fff', fontSize: 14 }}>
                                                Connect
                                            </Text>
                                        </>
                                    ) : (
                                        <>
                                            <Link2 size={13} color="#8B5CF6" />
                                            <Text style={{ fontFamily: 'Outfit-Regular', color: '#8B5CF6', fontSize: 12 }}>
                                                Just connect instead
                                            </Text>
                                            <Text style={{ fontFamily: 'Outfit-Regular', color: '#52525b', fontSize: 12 }}>
                                                — no pitch
                                            </Text>
                                        </>
                                    )}
                                </Pressable>
                            )}
                            {(connState ?? 'none') === 'pending' && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                                    <Clock size={13} color="#71717a" />
                                    <Text style={{ fontFamily: 'Outfit-Regular', color: '#a1a1aa', fontSize: 12 }}>
                                        Connection request pending
                                    </Text>
                                </View>
                            )}
                            {(connState ?? 'none') === 'connected' && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                                    <CheckCircle size={13} color="#22C55E" />
                                    <Text style={{ fontFamily: 'Outfit-Regular', color: '#22C55E', fontSize: 12 }}>
                                        Already connected
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                </View>
            )}
            </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

// ─── Connect-only section ─────────────────────────────────────────────────────
// Pure connection request — no requirement pitch. Sits at the top of the sheet
// in connect mode. When the invite section follows, a labelled divider separates
// the two paths.
function ConnectOnlySection({
    state,
    busy,
    onConnect,
    showInviteBelow,
}: {
    state: 'none' | 'pending' | 'connected';
    busy: boolean;
    onConnect: () => void;
    showInviteBelow: boolean;
}) {
    return (
        <View style={{ marginBottom: showInviteBelow ? 0 : 2 }}>
            {state === 'none' && (
                <>
                    <Pressable
                        onPress={onConnect}
                        disabled={busy}
                        accessibilityLabel="connect-only"
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            backgroundColor: '#8B5CF6',
                            borderRadius: 12,
                            paddingVertical: 13,
                            opacity: busy ? 0.6 : 1,
                        }}
                    >
                        {busy ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Link2 size={15} color="#fff" />
                                <Text
                                    style={{
                                        fontFamily: 'Outfit-SemiBold',
                                        color: '#fff',
                                        fontSize: 14,
                                    }}
                                >
                                    Connect only
                                </Text>
                            </>
                        )}
                    </Pressable>
                    <Text
                        style={{
                            fontFamily: 'Outfit-Regular',
                            color: '#71717a',
                            fontSize: 11,
                            marginTop: 8,
                            textAlign: 'center',
                        }}
                    >
                        Send a connection request — no requirement pitch.
                    </Text>
                </>
            )}

            {state === 'pending' && (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.10)',
                        borderRadius: 12,
                        paddingVertical: 12,
                        paddingHorizontal: 14,
                    }}
                >
                    <Clock size={15} color="#71717a" />
                    <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#a1a1aa', fontSize: 13 }}>
                        Connection request pending
                    </Text>
                </View>
            )}

            {state === 'connected' && (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        borderWidth: 1,
                        borderColor: 'rgba(34,197,94,0.30)',
                        borderRadius: 12,
                        paddingVertical: 12,
                        paddingHorizontal: 14,
                    }}
                >
                    <CheckCircle size={15} color="#22C55E" />
                    <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#22C55E', fontSize: 13 }}>
                        Already connected
                    </Text>
                </View>
            )}

            {showInviteBelow && (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        marginTop: 16,
                        marginBottom: 4,
                    }}
                >
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                    <Text style={{ fontFamily: 'Outfit-Regular', color: '#52525b', fontSize: 11 }}>
                        or invite to a requirement
                    </Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                </View>
            )}
        </View>
    );
}

export default InviteSheet;
