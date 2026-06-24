// src/features/contract-workspace/components/ContractSignatures.tsx
//
// Two cards (or one + placeholder). Each shows: green check + signer name +
// formatted meta (date · device).

import React from 'react';
import { View, Text } from 'react-native';
import { Check, Clock } from 'lucide-react-native';
import { formatSignatureMeta } from '../utils/formatSignatureMeta';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878',
    bg1: '#0F0F16', line: 'rgba(255,255,255,0.05)',
    green: '#22C55E', purple: '#8B5CF6',
};

type Sig = { signedAt?: string; deviceInfo?: string } | null | undefined;

type Props = {
    hirerName: string;
    artistName: string;
    hirerSignature: Sig;
    artistSignature: Sig;
    viewerRole: 'hirer' | 'artist' | 'other';
};

function SignatureCard({ name, sig, isSelf }: { name: string; sig: Sig; isSelf: boolean }) {
    const signed = !!sig?.signedAt;
    const Icon = signed ? Check : Clock;
    const accent = signed ? COLORS.green : COLORS.purple;
    return (
        <View style={{
            borderRadius: 12, padding: 12,
            backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.line,
            flexDirection: 'row', alignItems: 'center', gap: 10,
        }}>
            <View style={{
                width: 32, height: 32, borderRadius: 10,
                backgroundColor: `${accent}1A`,
                alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon size={14} color={accent} strokeWidth={signed ? 3 : 2} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.text0, fontSize: 13, fontWeight: '700' }}>
                    {isSelf ? 'You signed' : `${name} signed`}
                </Text>
                <Text style={{ color: COLORS.text2, fontSize: 12, marginTop: 2 }}>
                    {formatSignatureMeta(sig)}
                </Text>
            </View>
        </View>
    );
}

export function ContractSignatures({ hirerName, artistName, hirerSignature, artistSignature, viewerRole }: Props) {
    return (
        <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>
            <View style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: COLORS.text0, letterSpacing: -0.2 }}>Signatures</Text>
                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {hirerSignature?.signedAt && artistSignature?.signedAt ? 'Both signed' : 'Pending'}
                </Text>
            </View>
            <View style={{ gap: 8 }}>
                <SignatureCard name={hirerName} sig={hirerSignature} isSelf={viewerRole === 'hirer'} />
                <SignatureCard name={artistName} sig={artistSignature} isSelf={viewerRole === 'artist'} />
            </View>
        </View>
    );
}
