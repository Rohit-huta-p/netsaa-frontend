import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Zap, HandCoins, ShieldCheck, AlertTriangle } from 'lucide-react-native';
import type { ContractPaymentMethod } from '@/services/paymentService';

/**
 * Card-style radio for picking a payment rail on a contract (PRD §8.3.2 Stage 2).
 *
 * Two choices:
 *   • on_platform  — Razorpay Route instant split. Recommended: full audit
 *     trail, instant payout, strongest trust signal.
 *   • off_platform — manually recorded cash / UPI / bank. Flexible for
 *     existing-client relationships, but weaker trust signal (the Trust
 *     Engine caps the contribution of offline records to a score of 5.0).
 *
 * The component is purely presentational — it does not know whether the
 * selection is happening at create time or via the switch-before-sign flow.
 * Callers decide when to show it and what to do on confirm.
 */

export interface PaymentMethodSelectorProps {
    value: ContractPaymentMethod;
    onChange: (next: ContractPaymentMethod) => void;
    /** Disable interaction (e.g. after artist has signed). */
    disabled?: boolean;
}

const OPTIONS: Array<{
    id: ContractPaymentMethod;
    title: string;
    tagline: string;
    bullets: string[];
    icon: React.ElementType;
    accent: string;
    recommended?: boolean;
}> = [
    {
        id: 'on_platform',
        title: 'On-platform',
        tagline: 'Razorpay Route · instant split',
        bullets: [
            'NETSA never holds the money',
            'Audit trail + receipt · strongest trust signal',
            '88% to you, 12% platform fee',
        ],
        icon: Zap,
        accent: '#F97316',
        recommended: true,
    },
    {
        id: 'off_platform',
        title: 'Off-platform',
        tagline: 'Cash · UPI · bank · recorded later',
        bullets: [
            'Pay and record afterwards (either party can log it)',
            'Other party must confirm receipt',
            'Lower weight in Trust Engine',
        ],
        icon: HandCoins,
        accent: '#8B5CF6',
    },
];

export function PaymentMethodSelector({ value, onChange, disabled }: PaymentMethodSelectorProps) {
    return (
        <View style={styles.wrap}>
            {OPTIONS.map((opt) => {
                const selected = value === opt.id;
                const Icon = opt.icon;
                return (
                    <Pressable
                        key={opt.id}
                        onPress={() => !disabled && onChange(opt.id)}
                        disabled={disabled}
                        style={({ pressed }) => [
                            styles.card,
                            selected && { borderColor: opt.accent, backgroundColor: opt.accent + '10' },
                            disabled && { opacity: 0.55 },
                            pressed && !disabled && { opacity: 0.92 },
                        ]}
                    >
                        <View style={[styles.iconCircle, selected && { backgroundColor: opt.accent + '22' }]}>
                            <Icon size={18} color={selected ? opt.accent : '#6B6878'} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={styles.headRow}>
                                <Text style={styles.title}>{opt.title}</Text>
                                {opt.recommended ? (
                                    <View style={styles.recBadge}>
                                        <ShieldCheck size={10} color="#34D399" />
                                        <Text style={styles.recBadgeText}>RECOMMENDED</Text>
                                    </View>
                                ) : null}
                            </View>
                            <Text style={styles.tagline}>{opt.tagline}</Text>
                            <View style={{ marginTop: 8, gap: 4 }}>
                                {opt.bullets.map((b, i) => (
                                    <View key={i} style={styles.bulletRow}>
                                        <View style={[styles.bulletDot, { backgroundColor: selected ? opt.accent : '#3B3645' }]} />
                                        <Text style={styles.bulletText}>{b}</Text>
                                    </View>
                                ))}
                            </View>
                            {opt.id === 'off_platform' && selected ? (
                                <View style={styles.warnRow}>
                                    <AlertTriangle size={12} color="#F59E0B" />
                                    <Text style={styles.warnText}>
                                        Off-platform payments contribute less to your Trust Score.
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                        <View style={[styles.radio, selected && { borderColor: opt.accent }]}>
                            {selected ? <View style={[styles.radioDot, { backgroundColor: opt.accent }]} /> : null}
                        </View>
                    </Pressable>
                );
            })}
        </View>
    );
}

export default PaymentMethodSelector;

const styles = StyleSheet.create({
    wrap: { gap: 10 },
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        backgroundColor: '#121018',
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { fontFamily: 'Outfit-SemiBold', fontSize: 15, color: '#F0ECE6' },
    recBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        backgroundColor: 'rgba(52,211,153,0.12)',
    },
    recBadgeText: { fontFamily: 'Outfit-Bold', fontSize: 8, letterSpacing: 1, color: '#34D399' },
    tagline: { fontFamily: 'Outfit-Regular', fontSize: 12, color: '#8F8B9E', marginTop: 2 },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    bulletDot: { width: 4, height: 4, borderRadius: 2, marginTop: 7 },
    bulletText: { fontFamily: 'Outfit-Regular', fontSize: 12, color: '#C4B8E3', flex: 1, lineHeight: 18 },
    warnRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: 'rgba(245,158,11,0.08)',
    },
    warnText: { fontFamily: 'Outfit-Regular', fontSize: 11, color: '#F59E0B', flex: 1 },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#3B3645',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    radioDot: { width: 10, height: 10, borderRadius: 5 },
});
