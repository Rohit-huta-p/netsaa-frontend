import React from 'react';
import { View } from 'react-native';
import { ShieldAlert, Lock } from 'lucide-react-native';
import { DatePickerInput } from '@/components/ui/DatePickerInput/DatePickerInput';
import { MIN_REGISTRATION_AGE, MAJORITY_AGE } from '@/constants/registration';
import { StepHeader, Note, RK } from '@/components/auth/register-kit';

interface Props {
    dob: Date | null;
    setDob: (d: Date | null) => void;
    ageYears: number | null;
    isMinor: boolean;
    onClear: () => void;
    totalSteps?: number;
}

export function Step3DOB({ dob, setDob, ageYears, isMinor, onClear, totalSteps = 5 }: Props) {
    return (
        <View>
            <StepHeader
                eyebrow={`STEP 3 OF ${totalSteps}`}
                title="Date of birth"
                sub="Required by the DPDP Act · not shown publicly."
            />

            <DatePickerInput
                label="Date of birth"
                value={dob ?? undefined}
                onChange={(d) => { setDob(d); onClear(); }}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
                placeholder="DD / MM / YYYY"
                required
            />

            {isMinor && ageYears !== null && ageYears >= MIN_REGISTRATION_AGE && (
                <Note variant="warn" icon={<ShieldAlert size={14} color="#E3B55F" strokeWidth={2} />}>
                    You're under {MAJORITY_AGE}. You can use NETSA, but a parent or guardian will need to
                    co-sign any booking contracts.
                </Note>
            )}

            <Note variant="muted" icon={<Lock size={14} color={RK.dim} strokeWidth={1.75} />}>
                Private & encrypted. Your date of birth is never shown to hirers — used only for age verification.
            </Note>
        </View>
    );
}
