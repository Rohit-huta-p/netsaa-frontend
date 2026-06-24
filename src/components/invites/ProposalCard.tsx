// ProposalCard — one of the viewer's SENT proposals, for the "Sent" tab of the
// combined Activity inbox. Mirrors InviteCard's look (shared invite theme), but the
// actions are supplier-side: withdraw while pending, open chat once booked.
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { MessageCircle, X } from 'lucide-react-native';
import { inviteColors, inviteFonts, inviteRadii } from './inviteTheme';
import { initials, avatarTint, proposalStatusBadge, relativeDate } from './inviteFormat';
import type { SentProposal } from '@/services/requirementService';

function Avatar({ name }: { name: string }) {
    const tint = avatarTint(name);
    return (
        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: tint.bg, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: inviteFonts.semibold, fontSize: 13, color: tint.fg }}>{initials(name)}</Text>
        </View>
    );
}

const fmtQuote = (n?: number | null) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : null);

export function ProposalCard({
    proposal, busy, errorMsg, onWithdraw, onOpenChat,
}: {
    proposal: SentProposal;
    busy: boolean;
    errorMsg: string;
    onWithdraw: () => void;
    onOpenChat: () => void;
}) {
    const req = proposal.requirement;
    const clientName = req?.clientSnapshot?.displayName || 'Client';
    const title = req?.title || req?.occasionText || 'Requirement';
    const isPending = proposal.status === 'sent' || proposal.status === 'viewed';
    const isAccepted = proposal.status === 'accepted';
    const badge = proposalStatusBadge(proposal.status);
    const quote = fmtQuote(proposal.quoteAmount);

    return (
        <View style={{
            borderWidth: 1,
            borderColor: isAccepted ? inviteColors.cardWarmBorder : inviteColors.cardNeutralBorder,
            backgroundColor: isAccepted ? inviteColors.cardWarmBg : inviteColors.cardNeutralBg,
            borderRadius: inviteRadii.card, padding: 12, marginBottom: 10,
        }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <Avatar name={clientName} />
                <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontFamily: inviteFonts.semibold, fontSize: 14, color: inviteColors.text }} numberOfLines={1}>{title}</Text>
                    <Text style={{ fontFamily: inviteFonts.body, fontSize: 12, color: inviteColors.muted, marginTop: 1 }} numberOfLines={1}>
                        {req?.city ? `${clientName} · ${req.city}` : clientName}
                    </Text>
                </View>
                <View style={{ backgroundColor: badge.bg, borderRadius: inviteRadii.pill, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontFamily: inviteFonts.semibold, fontSize: 11, color: badge.fg }}>{badge.label}</Text>
                </View>
            </View>

            {/* What you quoted */}
            <Text style={{ fontFamily: inviteFonts.body, fontSize: 12.5, color: inviteColors.muted, marginTop: 9 }}>
                {quote ? 'You quoted ' : 'No quote shared'}
                {quote ? <Text style={{ fontFamily: inviteFonts.semibold, color: '#e4e4e7' }}>{quote}</Text> : null}
            </Text>

            {!!errorMsg && (
                <Text style={{ fontFamily: inviteFonts.body, fontSize: 12, color: inviteColors.error, marginTop: 8 }}>{errorMsg}</Text>
            )}

            {/* Pending → withdraw; Booked → open chat; archive → no action */}
            {isPending && (
                <Pressable
                    onPress={onWithdraw}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityLabel="Withdraw proposal"
                    style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 11, paddingVertical: 8, paddingHorizontal: 14, borderRadius: inviteRadii.button, borderWidth: 1, borderColor: inviteColors.ghostBorder, opacity: busy ? 0.5 : 1 }}
                >
                    {busy ? (
                        <ActivityIndicator size="small" color={inviteColors.muted} />
                    ) : (
                        <>
                            <X size={13} color={inviteColors.muted} />
                            <Text style={{ fontFamily: inviteFonts.semibold, fontSize: 13, color: inviteColors.muted }}>Withdraw</Text>
                        </>
                    )}
                </Pressable>
            )}
            {isAccepted && (
                <Pressable
                    onPress={onOpenChat}
                    accessibilityRole="button"
                    accessibilityLabel="Open chat"
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 11, paddingVertical: 9, borderRadius: inviteRadii.button, backgroundColor: inviteColors.orange }}
                >
                    <MessageCircle size={14} color={inviteColors.onOrange} />
                    <Text style={{ fontFamily: inviteFonts.semibold, fontSize: 13, color: inviteColors.onOrange }}>Open chat</Text>
                </Pressable>
            )}

            <Text style={{ fontFamily: inviteFonts.body, fontSize: 11, color: inviteColors.faint, marginTop: 8 }}>{relativeDate(proposal.createdAt)}</Text>
        </View>
    );
}
