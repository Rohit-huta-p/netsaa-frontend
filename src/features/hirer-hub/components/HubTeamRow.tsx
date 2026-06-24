import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { HubMiniTimeline } from './HubMiniTimeline';
import { computeContractStage } from '../utils/computeContractStage';
import { computeTeamRowAction, type TeamRowIntent } from '../utils/computeTeamRowAction';

const COLORS = {
    text0: '#F3EFE8',
    text2: '#6B6878',
    text3: '#3F3D4A',
    bg: '#16161F',
    line: 'rgba(255,255,255,0.05)',
    orange: '#FF6B35',
    gold: '#F59E0B',
    purple: '#8B5CF6',
    green: '#22C55E',
};

type Props = {
    application: any;
    contract: any | null;
};

const PHASE_1_DEFERRED: TeamRowIntent[] = [
    'pay-advance', 'pay-balance', 'record-payment',
    'leave-review', 'resolve-dispute', 'nudge', 'cancel-offer',
];

export function HubTeamRow({ application, contract }: Props) {
    const router = useRouter();

    if (!contract) {
        // Hired application but contract record not loaded yet — show a quiet placeholder.
        return (
            <View style={{ paddingHorizontal: 24, paddingVertical: 16, opacity: 0.5 }}>
                <Text style={{ color: COLORS.text2, fontSize: 13 }}>
                    {application.artistSnapshot?.displayName ?? 'Artist'} · contract loading…
                </Text>
            </View>
        );
    }

    const stage = computeContractStage(contract);
    const action = computeTeamRowAction(contract);
    const accent =
        stage.overlay === 'disputed' ? '#EF4444' :
        action.intent === 'pay-advance' || action.intent === 'pay-balance' || action.intent === 'record-payment' ? COLORS.gold :
        action.intent === 'nudge' || action.intent === 'cancel-offer' ? COLORS.purple :
        null;

    const handlePress = () => {
        if (action.intent === 'view') {
            router.push(`/(app)/contracts/${contract._id}` as any);
            return;
        }
        if (PHASE_1_DEFERRED.includes(action.intent)) {
            Alert.alert(
                'Coming soon',
                `${action.label} will be wired up in a follow-up release.`
            );
            return;
        }
    };

    const handleRowPress = () => {
        router.push(`/(app)/contracts/${contract._id}` as any);
    };

    const displayName = ((application.artistSnapshot?.displayName ?? '') as string).trim() || 'Artist';
    const initials = displayName.split(/\s+/).map((s: string) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'A';

    return (
        <View
            style={{
                paddingHorizontal: 24,
                paddingVertical: 16,
                ...(accent ? {
                    backgroundColor: `${accent}14`,
                    borderLeftWidth: 3,
                    borderLeftColor: accent,
                } : {}),
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity
                    onPress={handleRowPress}
                    accessibilityLabel={`Open contract for ${displayName}`}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <View style={{
                        width: 40, height: 40, borderRadius: 12,
                        backgroundColor: COLORS.bg,
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Text style={{ color: COLORS.text0, fontWeight: '700', fontSize: 13 }}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ color: COLORS.text0, fontSize: 14, fontWeight: '700' }}>
                            {displayName}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            <Text style={{ color: COLORS.text2, fontSize: 12 }}>
                                ₹{(contract.terms?.amount ?? 0).toLocaleString('en-IN')}
                            </Text>
                            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.text3 }} />
                            <HubMiniTimeline nodes={stage.nodes} overlay={stage.overlay} />
                        </View>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handlePress}
                    disabled={action.disabled}
                    accessibilityLabel={`${action.label} for ${displayName}`}
                    style={{
                        paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8,
                        backgroundColor: accent ? accent : 'transparent',
                        opacity: action.disabled ? 0.5 : 1,
                    }}>
                    <Text style={{
                        color: accent ? '#0A0A0F' : COLORS.text2,
                        fontSize: 12,
                        fontWeight: '700',
                    }}>
                        {action.label}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
