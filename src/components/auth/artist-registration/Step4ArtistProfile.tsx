import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { X, Plus } from 'lucide-react-native';
import {
    ARTIST_TYPES, ARTIST_SKILLS, ARTIST_SKILL_DEFAULTS, ARTIST_SKILL_HINTS,
} from '@/constants/registration';
import { StepHeader, Chip, Field, RK, RK_FONT, useAccent } from '@/components/auth/register-kit';

interface Props {
    artistType: string;
    onTypeChange: (type: string, defaultSkills: string[]) => void;
    skills: string[];
    setSkills: (s: string[]) => void;
    bio: string;
    setBio: (v: string) => void;
    totalSteps?: number;
}

export function Step4ArtistProfile({
    artistType, onTypeChange, skills, setSkills, bio, setBio, totalSteps = 5,
}: Props) {
    const accent = useAccent();
    const [customInput, setCustomInput] = useState('');

    const predefinedForType = ARTIST_SKILLS[artistType] ?? [];
    const customSkills = skills.filter(sk => !predefinedForType.includes(sk));

    function handleTypeSelect(id: string) {
        onTypeChange(id, ARTIST_SKILL_DEFAULTS[id] ?? []);
    }
    function toggleSkill(skill: string) {
        setSkills(skills.includes(skill) ? skills.filter(s => s !== skill) : [...skills, skill]);
    }
    function addCustomSkill() {
        const val = customInput.trim();
        if (!val || skills.includes(val)) { setCustomInput(''); return; }
        setSkills([...skills, val]);
        setCustomInput('');
    }
    function removeCustomSkill(skill: string) {
        setSkills(skills.filter(s => s !== skill));
    }

    const skillHint = artistType ? (ARTIST_SKILL_HINTS[artistType] ?? 'Skills') : 'Skills';
    const customActive = customInput.trim().length > 0;

    return (
        <View>
            <StepHeader
                eyebrow={`STEP 4 OF ${totalSteps}`}
                title="Your craft"
                sub="Hirers filter by type and skill."
            />

            {/* Artist type */}
            <Text style={s.label}>ARTIST TYPE</Text>
            <View style={s.chipWrap}>
                {ARTIST_TYPES.filter(t => t.id !== 'other').map(type => (
                    <Chip
                        key={type.id}
                        label={type.label}
                        selected={artistType === type.id}
                        onPress={() => handleTypeSelect(type.id)}
                    />
                ))}
            </View>

            {/* Skills — only once a type is chosen */}
            {artistType && predefinedForType.length > 0 && (
                <>
                    <Text style={[s.label, { marginTop: 22 }]}>{skillHint.toUpperCase()}</Text>
                    <View style={s.chipWrap}>
                        {predefinedForType.map(skill => (
                            <Chip
                                key={skill}
                                label={skill}
                                selected={skills.includes(skill)}
                                onPress={() => toggleSkill(skill)}
                            />
                        ))}
                        {customSkills.map(skill => (
                            <Pressable
                                key={skill}
                                onPress={() => removeCustomSkill(skill)}
                                style={[s.customChip, { backgroundColor: accent.base, borderColor: accent.base }]}
                            >
                                <Text style={[s.customChipLabel, { color: accent.on }]}>{skill}</Text>
                                <X size={11} color={accent.on} strokeWidth={2.5} />
                            </Pressable>
                        ))}
                    </View>

                    {/* Custom skill input */}
                    <View style={s.customRow}>
                        <View style={s.customInputBox}>
                            <TextInput
                                value={customInput}
                                onChangeText={setCustomInput}
                                onSubmitEditing={addCustomSkill}
                                placeholder="Add your own…"
                                placeholderTextColor={RK.dim}
                                returnKeyType="done"
                                selectionColor={accent.base}
                                style={s.customInput}
                            />
                        </View>
                        <Pressable
                            onPress={addCustomSkill}
                            style={[
                                s.addBtn,
                                customActive
                                    ? { backgroundColor: accent.base, borderColor: accent.base }
                                    : { backgroundColor: RK.surface, borderColor: RK.hair },
                            ]}
                        >
                            <Plus size={16} color={customActive ? accent.on : RK.dim} strokeWidth={2} />
                        </Pressable>
                    </View>
                </>
            )}

            {/* Bio */}
            <View style={{ marginTop: 24 }}>
                <Field
                    label="BIO"
                    optional
                    multiline
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Describe your practice, style, or what makes you unique…"
                    helper="Appears on your public profile. Keep it concise — 2 sentences work well."
                />
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    label: { fontFamily: RK_FONT.mono, fontSize: 9, letterSpacing: 1.6, color: RK.muted, marginBottom: 9 },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    customChip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingLeft: 12, paddingRight: 9, paddingVertical: 8, borderRadius: 9, borderWidth: 1,
    },
    customChipLabel: { fontFamily: RK_FONT.body, fontSize: 11.5 },
    customRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
    customInputBox: {
        flex: 1, height: 42, paddingHorizontal: 12, borderRadius: 11,
        backgroundColor: RK.surface, borderWidth: 1, borderColor: RK.hair, justifyContent: 'center',
    },
    customInput: { fontFamily: RK_FONT.body, fontSize: 13, color: RK.cream, padding: 0 },
    addBtn: { width: 42, height: 42, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
