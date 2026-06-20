import { View, Text, Pressable } from 'react-native';
import { inviteColors, inviteFonts, inviteRadii } from './inviteTheme';
import type { InviteTab } from './inviteFormat';

export function InviteTabs({
    active, counts, onChange,
}: {
    active: InviteTab;
    counts: { pending: number; accepted: number; archive: number };
    onChange: (t: InviteTab) => void;
}) {
    const tabs: { key: InviteTab; label: string; count: number }[] = [
        { key: 'pending', label: 'Pending', count: counts.pending },
        { key: 'accepted', label: 'Accepted', count: counts.accepted },
        { key: 'archive', label: 'Archive', count: counts.archive },
    ];
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            {tabs.map((t) => {
                const on = t.key === active;
                const showCount = t.key !== 'archive' && t.count > 0;
                return (
                    <Pressable key={t.key} onPress={() => onChange(t.key)} style={{ paddingHorizontal: on ? 10 : 4, paddingVertical: 5, borderRadius: inviteRadii.pill, backgroundColor: on ? 'rgba(255,107,53,0.13)' : 'transparent' }}>
                        <Text style={{ fontFamily: on ? inviteFonts.semibold : inviteFonts.body, fontSize: 12, color: on ? inviteColors.orangeLight : inviteColors.dim }}>
                            {`${t.label}${showCount ? ` · ${t.count}` : ''}`}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}
