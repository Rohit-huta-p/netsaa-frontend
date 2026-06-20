import { View, Text } from 'react-native';
import { Mail } from 'lucide-react-native';
import { inviteColors, inviteFonts } from './inviteTheme';
import type { InviteTab } from './inviteFormat';

const COPY: Record<InviteTab, { title: string; body: string }> = {
    pending: { title: 'No invites yet', body: 'Clients can invite you directly from your profile.' },
    accepted: { title: 'Nothing accepted yet', body: 'Invites you accept will show up here.' },
    archive: { title: 'Nothing here', body: 'Declined and withdrawn invites land here.' },
};

export function InviteEmptyState({ tab }: { tab: InviteTab }) {
    const c = COPY[tab];
    return (
        <View style={{ alignItems: 'center', marginTop: 70, paddingHorizontal: 24 }}>
            <Mail size={34} color="#27272a" />
            <Text style={{ fontFamily: inviteFonts.semibold, fontSize: 15, color: inviteColors.muted, marginTop: 14 }}>{c.title}</Text>
            <Text style={{ fontFamily: inviteFonts.body, fontSize: 13, color: inviteColors.faint, marginTop: 6, textAlign: 'center', lineHeight: 19 }}>{c.body}</Text>
        </View>
    );
}
