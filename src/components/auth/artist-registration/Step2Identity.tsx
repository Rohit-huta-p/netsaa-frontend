import React from 'react';
import { View, Text } from 'react-native';
import { User as UserIcon, Star } from 'lucide-react-native';
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
                <Text style={s.headline}>What should{'\n'}people call you?</Text>
                <Text style={s.subhead}>Your name as it appears on NETSA.</Text>
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
            <StepInput
                label="Stage name (optional)"
                value={stageName}
                onChangeText={(v) => { setStageName(v); onClear(); }}
                placeholder="Name shown publicly on your profile"
                autoCapitalize="words"
                icon={<Star size={16} color={C.t4} />}
            />
            <Text style={s.fineprint}>
                If you have a stage name, that's what hirers and collaborators will see.
                Leave blank to use your full name publicly.
            </Text>
        </View>
    );
}
