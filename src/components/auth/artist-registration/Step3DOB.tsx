import React from 'react';
import { View, Text } from 'react-native';
import { ShieldAlert } from 'lucide-react-native';
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
                <Text style={s.headline}>When were{'\n'}you born?</Text>
                <Text style={s.subhead}>Needed for booking contracts. Not shown publicly.</Text>
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

            <Text style={s.fineprint}>
                Per Indian Contract Act §11, minors can't sign enforceable contracts alone —
                guardian co-sign is required for bookings.
            </Text>
        </View>
    );
}
