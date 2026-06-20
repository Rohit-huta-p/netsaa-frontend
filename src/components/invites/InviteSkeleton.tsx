import { View } from 'react-native';
import { inviteColors, inviteRadii } from './inviteTheme';

export function InviteSkeleton() {
    return (
        <View>
            {[0, 1, 2].map((i) => (
                <View key={i} style={{ borderWidth: 1, borderColor: inviteColors.cardNeutralBorder, backgroundColor: inviteColors.cardNeutralBg, borderRadius: inviteRadii.card, padding: 12, marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.06)' }} />
                        <View style={{ flex: 1, gap: 6 }}>
                            <View style={{ height: 12, width: '55%', borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.06)' }} />
                            <View style={{ height: 10, width: '35%', borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.05)' }} />
                        </View>
                    </View>
                    <View style={{ height: 46, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)', marginTop: 12 }} />
                </View>
            ))}
        </View>
    );
}
