import React from 'react';
import { View, Text } from 'react-native';
import { User as UserIcon, Star, Info } from 'lucide-react-native';
import { StepInput } from '@/components/auth';
import { C, FONT, s } from './shared';

interface Props {
    fullName: string;
    setFullName: (v: string) => void;
    stageName: string;
    setStageName: (v: string) => void;
    onClear: () => void;
}

export function Step2Identity({ fullName, setFullName, stageName, setStageName, onClear }: Props) {
    return (
        <View>
            <View style={{ marginBottom: 28 }}>
                <Text style={s.eyebrow}>STEP 2 OF 5</Text>
                <Text style={s.headline}>Who are you?</Text>
                <Text style={s.subhead}>Your name on the platform.</Text>
            </View>

            <StepInput
                label="Full name"
                value={fullName}
                onChangeText={(v) => { setFullName(v); onClear(); }}
                placeholder="e.g. Priya Sharma"
                autoCapitalize="words"
                autoComplete="name"
                icon={<UserIcon size={16} color={C.t4} />}
            />
            <Text style={{ fontFamily: FONT.body, fontSize: 10, color: C.t3, marginTop: -6, marginBottom: 10, paddingLeft: 2 }}>
                Legal name — not shown publicly
            </Text>
            <StepInput
                label="Stage name (optional)"
                value={stageName}
                onChangeText={(v) => { setStageName(v); onClear(); }}
                placeholder="Name shown publicly on your profile"
                autoCapitalize="words"
                icon={<Star size={16} color={C.t4} />}
            />
            <View style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 9,
                marginTop: 12,
                padding: 10,
                borderRadius: 10,
                backgroundColor: 'rgba(167,139,250,0.08)',
                borderWidth: 1,
                borderColor: 'rgba(167,139,250,0.2)',
            }}>
                <Info size={14} color='#A78BFA' strokeWidth={1.75} style={{ marginTop: 1 }} />
                <Text style={{ flex: 1, fontFamily: FONT.body, fontSize: 11, color: '#C4B5FD', lineHeight: 16 }}>
                    You can change your stage name from Settings at any time.
                </Text>
            </View>
        </View>
    );
}
