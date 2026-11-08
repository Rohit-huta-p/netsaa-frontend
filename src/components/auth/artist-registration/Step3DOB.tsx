import React from 'react';
import { View, Text } from 'react-native';
import { ShieldAlert, Lock } from 'lucide-react-native';
import { DatePickerInput } from '@/components/ui/DatePickerInput/DatePickerInput';
import { MIN_REGISTRATION_AGE, MAJORITY_AGE } from '@/constants/registration';
import { C, FONT, s } from './shared';

interface Props {
    dob: Date | null;
    setDob: (d: Date | null) => void;
    ageYears: number | null;
    isMinor: boolean;
    onClear: () => void;
}

export function Step3DOB({ dob, setDob, ageYears, isMinor, onClear }: Props) {
    return (
        <View>
            <View style={{ marginBottom: 28 }}>
                <Text style={s.eyebrow}>STEP 3 OF 5</Text>
                <Text style={s.headline}>Date of birth</Text>
                <Text style={s.subhead}>Required by the DPDP Act · not shown publicly.</Text>
            </View>

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
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 10,
                    marginTop: 16,
                    padding: 14,
                    borderRadius: 12,
                    backgroundColor: C.minorBg,
                    borderWidth: 1,
                    borderColor: C.minorBorder,
                }}>
                    <ShieldAlert size={16} color={C.gold} strokeWidth={2} />
                    <Text style={{ flex: 1, fontSize: 12, lineHeight: 17, color: C.t1, fontFamily: FONT.body }}>
                        You're under {MAJORITY_AGE}. You can use NETSA, but a parent or guardian
                        will need to co-sign any booking contracts.
                    </Text>
                </View>
            )}

            <View style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 9,
                marginTop: 16,
                padding: 12,
                borderRadius: 11,
                backgroundColor: C.surface,
                borderWidth: 1,
                borderColor: C.border,
            }}>
                <Lock size={14} color={C.t3} strokeWidth={1.75} style={{ marginTop: 1 }} />
                <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONT.bodyMed, fontSize: 11, color: C.t2, marginBottom: 2 }}>
                        Private & encrypted
                    </Text>
                    <Text style={{ fontFamily: FONT.body, fontSize: 10, color: C.t3, lineHeight: 15 }}>
                        Your date of birth is never shown to hirers. Used only for age verification.
                    </Text>
                </View>
            </View>
        </View>
    );
}
