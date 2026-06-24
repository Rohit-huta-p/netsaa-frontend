import { View, Text } from 'react-native';
import { inviteColors, inviteFonts } from './inviteTheme';

export function InvitesHeader({ pendingCount }: { pendingCount: number }) {
    const subline = pendingCount > 0
        ? `${pendingCount} ${pendingCount === 1 ? 'client wants' : 'clients want'} to work with you.`
        : "You're all caught up.";
    return (
        <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                <Text style={{ fontFamily: inviteFonts.mono, fontSize: 11, letterSpacing: 1, color: inviteColors.orange }}>निमंत्रण</Text>
                <Text style={{ fontFamily: inviteFonts.mono, fontSize: 11, color: inviteColors.dim }}>· for you</Text>
            </View>
            <Text style={{ fontFamily: inviteFonts.serif, fontSize: 34, color: inviteColors.text, lineHeight: 38 }}>Invites</Text>
            <Text style={{ fontFamily: inviteFonts.body, fontSize: 13, color: inviteColors.muted, marginTop: 4 }}>{subline}</Text>
        </View>
    );
}
