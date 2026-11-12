import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Mail, Lock } from 'lucide-react-native';
import { StepHeader, Field, RK, RK_FONT } from '@/components/auth/register-kit';

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
            <StepHeader eyebrow="CREATE ACCOUNT" title="Let's start" sub="Use an email you check regularly." />

            <Field
                label="EMAIL"
                value={email}
                onChangeText={(v) => { setEmail(v); onClear(); }}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                icon={<Mail size={16} color={RK.muted} />}
            />
            <Field
                label="PASSWORD"
                value={password}
                onChangeText={(v) => { setPassword(v); onClear(); }}
                placeholder="At least 8 characters"
                secureTextEntry
                icon={<Lock size={16} color={RK.muted} />}
            />
            <Text style={styles.legal}>
                By continuing, you agree to the NETSA Terms of Service and Privacy Policy.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    legal: { fontFamily: RK_FONT.body, fontSize: 11, color: RK.dim, lineHeight: 16, marginTop: 6 },
});
