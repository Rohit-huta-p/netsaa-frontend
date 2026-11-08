import React from 'react';
import { View, Text } from 'react-native';
import { Mail, Lock } from 'lucide-react-native';
import { StepInput } from '@/components/auth';
import { C, FONT, s } from './shared';

interface Props {
    email: string;
    setEmail: (v: string) => void;
    password: string;
    setPassword: (v: string) => void;
    onClear: () => void;
}

export function Step1Credentials({ email, setEmail, password, setPassword, onClear }: Props) {
    return (
        <View>
            <View style={{ marginBottom: 28 }}>
                <Text style={s.eyebrow}>CREATE ACCOUNT</Text>
                <Text style={s.headline}>Let's start</Text>
                <Text style={s.subhead}>Use an email you check regularly.</Text>
            </View>

            <StepInput
                label="Email"
                value={email}
                onChangeText={(v) => { setEmail(v); onClear(); }}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                icon={<Mail size={16} color={C.t4} />}
            />
            <StepInput
                label="Password"
                value={password}
                onChangeText={(v) => { setPassword(v); onClear(); }}
                placeholder="At least 8 characters"
                secureTextEntry
                icon={<Lock size={16} color={C.t4} />}
            />
            <Text style={s.fineprint}>
                By continuing, you agree to the NETSA Terms of Service and Privacy Policy.
            </Text>
        </View>
    );
}
