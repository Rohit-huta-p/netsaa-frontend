import { View, Text } from 'react-native';
import { Mail } from 'lucide-react-native';
import { inviteColors, inviteFonts } from './inviteTheme';
import type { InviteTab } from './inviteFormat';

const COPY: Record<'received' | 'sent', Record<InviteTab, { title: string; body: string }>> = {
    received: {
        pending: { title: 'No invites yet', body: 'Clients can invite you directly from your profile.' },
        accepted: { title: 'Nothing accepted yet', body: 'Invites you accept will show up here.' },
        archive: { title: 'Nothing here', body: 'Declined and withdrawn invites land here.' },
    },
    sent: {
        pending: { title: 'No proposals out', body: "Find work and send a proposal — it'll show here until the client replies." },
        accepted: { title: 'No bookings yet', body: 'Proposals a client accepts turn into bookings here.' },
        archive: { title: 'Nothing here', body: 'Declined and withdrawn proposals land here.' },
    },
};

export function InviteEmptyState({ tab, mode = 'received' }: { tab: InviteTab; mode?: 'received' | 'sent' }) {
    const c = COPY[mode][tab];
    return (
        <View style={{ alignItems: 'center', marginTop: 70, paddingHorizontal: 24 }}>
            <Mail size={34} color="#27272a" />
            <Text style={{ fontFamily: inviteFonts.semibold, fontSize: 15, color: inviteColors.muted, marginTop: 14 }}>{c.title}</Text>
            <Text style={{ fontFamily: inviteFonts.body, fontSize: 13, color: inviteColors.faint, marginTop: 6, textAlign: 'center', lineHeight: 19 }}>{c.body}</Text>
        </View>
    );
}
