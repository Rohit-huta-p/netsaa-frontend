import React from 'react';
import { View } from 'react-native';
import { User as UserIcon, Star, Phone, Info } from 'lucide-react-native';
import { StepHeader, Field, Note, useAccent, RK } from '@/components/auth/register-kit';

interface Props {
    fullName: string;
    setFullName: (v: string) => void;
    stageName: string;
    setStageName: (v: string) => void;
    phoneNumber: string;
    setPhoneNumber: (v: string) => void;
    onClear: () => void;
    totalSteps?: number;
}

export function Step2Identity({
    fullName, setFullName, stageName, setStageName, phoneNumber, setPhoneNumber, onClear, totalSteps = 5,
}: Props) {
    const accent = useAccent();
    return (
        <View>
            <StepHeader
                eyebrow={`STEP 2 OF ${totalSteps}`}
                title={'How do people\nrecognize you?'}
                sub="Your name on the platform."
            />

            <Field
                label="FULL NAME"
                value={fullName}
                onChangeText={(v) => { setFullName(v); onClear(); }}
                placeholder="e.g. Priya Sharma"
                autoCapitalize="words"
                autoComplete="name"
                icon={<UserIcon size={16} color={RK.muted} />}
                helper="Legal name — not shown publicly"
            />
            <Field
                label="STAGE NAME"
                optional
                value={stageName}
                onChangeText={(v) => { setStageName(v); onClear(); }}
                placeholder="Name shown publicly on your profile"
                autoCapitalize="words"
                icon={<Star size={16} color={RK.muted} />}
            />
            <Note variant="accent" icon={<Info size={14} color={accent.border} strokeWidth={1.75} />}>
                You can change your stage name from Settings at any time.
            </Note>

            <View style={{ height: 18 }} />

            <Field
                label="PHONE NUMBER"
                value={phoneNumber}
                onChangeText={(v) => { setPhoneNumber(v); onClear(); }}
                placeholder="+91 98765 43210"
                keyboardType="phone-pad"
                autoComplete="tel"
                icon={<Phone size={16} color={RK.muted} />}
                helper="Used for booking confirmations — not shown publicly"
            />
        </View>
    );
}
