// src/features/contract-workspace/components/ContractEdgeCases.tsx
//
// Collapsed danger zone. Switch payment method uses existing mutation
// (Phase 1 wired); other actions Coming soon.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { ChevronRight, RefreshCw, MessageCircle, AlertCircle, X } from 'lucide-react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878',
    bg1: '#0F0F16', line: 'rgba(255,255,255,0.05)',
    gold: '#F59E0B', red: '#EF4444',
};

type Props = {
    canSwitchMethod: boolean;
    canCancel: boolean;
    onSwitchMethod: () => void; // wires to existing useSwitchContractPaymentMethod via parent
    onCancel: () => void;       // wires to existing decline mutation OR Coming soon
};

function comingSoon(label: string) {
    return () => Alert.alert('Coming soon', `${label} ships in a follow-up release.`);
}

export function ContractEdgeCases({ canSwitchMethod, canCancel, onSwitchMethod, onCancel }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>
            <TouchableOpacity
                onPress={() => setOpen((o) => !o)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 16, color: COLORS.text1, letterSpacing: -0.2 }}>
                    Edge cases
                </Text>
                <ChevronRight
                    size={16}
                    color={COLORS.text2}
                    style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}
                />
            </TouchableOpacity>

            {open && (
                <View style={{ gap: 8, paddingTop: 8 }}>
                    <ActionRow
                        icon={RefreshCw}
                        label="Switch payment method"
                        sublabel={canSwitchMethod ? 'Available before artist signs' : 'Locked after sign — requires amendment'}
                        onPress={canSwitchMethod ? onSwitchMethod : comingSoon('Payment method amendment')}
                        accent={COLORS.text2}
                        disabled={!canSwitchMethod && false /* always tappable; shows Coming soon */}
                    />
                    <ActionRow
                        icon={MessageCircle}
                        label="Message"
                        sublabel="Open chat thread"
                        onPress={comingSoon('Messaging')}
                        accent={COLORS.text2}
                    />
                    <ActionRow
                        icon={AlertCircle}
                        label="Open dispute"
                        sublabel="48h ops SLA · evidence required"
                        onPress={comingSoon('Dispute panel')}
                        accent={COLORS.gold}
                    />
                    <ActionRow
                        icon={X}
                        label="Cancel contract"
                        sublabel={canCancel ? 'Triggers cancellation policy' : 'Not available in current state'}
                        onPress={canCancel ? onCancel : comingSoon('Cancel contract')}
                        accent={COLORS.red}
                    />
                </View>
            )}
        </View>
    );
}

function ActionRow({
    icon: Icon, label, sublabel, onPress, accent, disabled,
}: {
    icon: any;
    label: string;
    sublabel: string;
    onPress: () => void;
    accent: string;
    disabled?: boolean;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            accessibilityLabel={label}
            style={{
                padding: 12, borderRadius: 12,
                backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.line,
                flexDirection: 'row', alignItems: 'center', gap: 12,
                opacity: disabled ? 0.4 : 1,
            }}>
            <View style={{
                width: 32, height: 32, borderRadius: 10,
                backgroundColor: `${accent}1A`, borderWidth: 1, borderColor: `${accent}30`,
                alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon size={14} color={accent} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ color: accent === COLORS.text2 ? COLORS.text0 : accent, fontSize: 13, fontWeight: '700' }}>{label}</Text>
                <Text style={{ color: COLORS.text2, fontSize: 11, marginTop: 2 }}>{sublabel}</Text>
            </View>
        </TouchableOpacity>
    );
}
