import { View, Text, Pressable, Image, ActivityIndicator } from 'react-native';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react-native';
import { inviteColors, inviteFonts, inviteRadii } from './inviteTheme';
import { RequirementPreview } from './RequirementPreview';
import { initials, avatarTint, roleLabel, statusBadge, relativeDate } from './inviteFormat';
import type { Invite } from '@/services/inviteService';

function Avatar({ name, url }: { name: string; url?: string | null }) {
    if (url) return <Image source={{ uri: url }} style={{ width: 34, height: 34, borderRadius: 17 }} />;
    const tint = avatarTint(name);
    return (
        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: tint.bg, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: inviteFonts.semibold, fontSize: 13, color: tint.fg }}>{initials(name)}</Text>
        </View>
    );
}

export function InviteCard({
    invite, busy, errorMsg, onAccept, onDecline,
}: {
    invite: Invite; busy: boolean; errorMsg: string; onAccept: () => void; onDecline: () => void;
}) {
    const isActionable = invite.status === 'sent' || invite.status === 'viewed';
    const badge = statusBadge(invite.status);
    const name = invite.fromSnapshot.displayName;

    return (
        <View style={{
            borderWidth: 1,
            borderColor: isActionable ? inviteColors.cardWarmBorder : inviteColors.cardNeutralBorder,
            backgroundColor: isActionable ? inviteColors.cardWarmBg : inviteColors.cardNeutralBg,
            borderRadius: inviteRadii.card, padding: 12, marginBottom: 10,
        }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <Avatar name={name} url={invite.fromSnapshot.avatarUrl} />
                <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontFamily: inviteFonts.semibold, fontSize: 14, color: inviteColors.text }}>{name}</Text>
                    <Text style={{ fontFamily: inviteFonts.body, fontSize: 12, color: inviteColors.muted, marginTop: 1 }}>
                        {invite.fromSnapshot.city ? `Client · ${invite.fromSnapshot.city}` : 'Client'}
                    </Text>
                </View>
                <View style={{ backgroundColor: badge.bg, borderRadius: inviteRadii.pill, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontFamily: inviteFonts.semibold, fontSize: 11, color: badge.fg }}>{badge.label}</Text>
                </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: inviteRadii.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
                <ArrowRight size={12} color={inviteColors.dim} />
                <Text style={{ fontFamily: inviteFonts.body, fontSize: 11, color: '#d4d4d8' }}>{`as ${roleLabel(invite.toRole).toLowerCase()}`}</Text>
            </View>

            {invite.requirementId ? (
                <RequirementPreview snapshot={invite.requirementSnapshot} fallbackTitle={invite.requirementTitle} role={invite.toRole} />
            ) : null}

            {!!invite.note && (
                <Text style={{ fontFamily: inviteFonts.body, fontStyle: 'italic', fontSize: 13, color: '#c7c7cc', lineHeight: 18, marginTop: 10 }}>
                    {`"${invite.note}"`}
                </Text>
            )}

            {!!errorMsg && (
                <Text style={{ fontFamily: inviteFonts.body, fontSize: 12, color: inviteColors.error, marginTop: 8 }}>{errorMsg}</Text>
            )}

            {isActionable && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 11 }}>
                    <Pressable onPress={onDecline} disabled={busy} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: inviteRadii.button, borderWidth: 1, borderColor: inviteColors.ghostBorder, opacity: busy ? 0.5 : 1 }}>
                        <XCircle size={14} color={inviteColors.muted} />
                        <Text style={{ fontFamily: inviteFonts.semibold, fontSize: 13, color: inviteColors.muted }}>Decline</Text>
                    </Pressable>
                    <Pressable onPress={onAccept} disabled={busy} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: inviteRadii.button, backgroundColor: inviteColors.orange, opacity: busy ? 0.6 : 1 }}>
                        {busy ? <ActivityIndicator size="small" color="#fff" /> : (
                            <>
                                <CheckCircle size={14} color={inviteColors.onOrange} />
                                <Text style={{ fontFamily: inviteFonts.semibold, fontSize: 13, color: inviteColors.onOrange }}>Accept</Text>
                            </>
                        )}
                    </Pressable>
                </View>
            )}

            <Text style={{ fontFamily: inviteFonts.body, fontSize: 11, color: inviteColors.faint, marginTop: isActionable ? 8 : 6 }}>{relativeDate(invite.createdAt)}</Text>
        </View>
    );
}
