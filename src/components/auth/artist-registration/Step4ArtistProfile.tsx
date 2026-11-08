import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { X, Plus } from 'lucide-react-native';
import { ARTIST_TYPES, ARTIST_SKILLS, ARTIST_SKILL_DEFAULTS, ARTIST_SKILL_HINTS } from '@/constants/registration';
import { C, FONT, s } from './shared';

interface Props {
    artistType: string;
    onTypeChange: (type: string, defaultSkills: string[]) => void;
    skills: string[];
    setSkills: (s: string[]) => void;
    bio: string;
    setBio: (v: string) => void;
}

export function Step4ArtistProfile({ artistType, onTypeChange, skills, setSkills, bio, setBio }: Props) {
    const [customInput, setCustomInput] = useState('');

    const predefinedForType = ARTIST_SKILLS[artistType] ?? [];
    const customSkills = skills.filter(sk => !predefinedForType.includes(sk));

    function handleTypeSelect(id: string) {
        const defaults = ARTIST_SKILL_DEFAULTS[id] ?? [];
        onTypeChange(id, defaults);
    }

    function toggleSkill(skill: string) {
        if (skills.includes(skill)) {
            setSkills(skills.filter(s => s !== skill));
        } else {
            setSkills([...skills, skill]);
        }
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

    return (
        <View>
            <View style={{ marginBottom: 28 }}>
                <Text style={s.eyebrow}>STEP 4 OF 5</Text>
                <Text style={s.headline}>Your craft</Text>
                <Text style={s.subhead}>Hirers filter by type and skill.</Text>
            </View>

            {/* Artist type chips */}
            <Text style={s.sectionLabel}>ARTIST TYPE</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                {ARTIST_TYPES.filter(t => t.id !== 'other').map(type => {
                    const Icon = type.icon;
                    const selected = artistType === type.id;
                    return (
                        <TouchableOpacity
                            key={type.id}
                            onPress={() => handleTypeSelect(type.id)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                paddingHorizontal: 14,
                                paddingVertical: 9,
                                borderRadius: 20,
                                backgroundColor: selected ? C.orangeDim : C.surface,
                                borderWidth: 1,
                                borderColor: selected ? C.orangeBorder : C.border,
                            }}
                        >
                            <Icon size={13} color={selected ? C.orange : C.t3} strokeWidth={2} />
                            <Text style={{
                                fontFamily: FONT.bodyMed,
                                fontSize: 13,
                                color: selected ? C.orange : C.t2,
                                lineHeight: 18,
                            }}>
                                {type.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Skills — only shown when a type is selected */}
            {artistType && predefinedForType.length > 0 && (
                <>
                    <Text style={[s.sectionLabel, { marginTop: 20 }]}>{skillHint.toUpperCase()}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {predefinedForType.map(skill => {
                            const on = skills.includes(skill);
                            return (
                                <TouchableOpacity
                                    key={skill}
                                    onPress={() => toggleSkill(skill)}
                                    style={{
                                        paddingHorizontal: 12,
                                        paddingVertical: 7,
                                        borderRadius: 16,
                                        backgroundColor: on ? C.orangeDim : C.surface,
                                        borderWidth: 1,
                                        borderColor: on ? C.orangeBorder : C.border,
                                    }}
                                >
                                    <Text style={{
                                        fontFamily: FONT.body,
                                        fontSize: 13,
                                        color: on ? C.orange : C.t3,
                                    }}>
                                        {skill}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                        {customSkills.map(skill => (
                            <TouchableOpacity
                                key={skill}
                                onPress={() => removeCustomSkill(skill)}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 5,
                                    paddingLeft: 12,
                                    paddingRight: 8,
                                    paddingVertical: 7,
                                    borderRadius: 16,
                                    backgroundColor: C.orangeDim,
                                    borderWidth: 1,
                                    borderColor: C.orangeBorder,
                                }}
                            >
                                <Text style={{
                                    fontFamily: FONT.body,
                                    fontSize: 13,
                                    color: C.orange,
                                }}>
                                    {skill}
                                </Text>
                                <X size={11} color={C.orange} strokeWidth={2.5} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Custom skill input */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        marginTop: 12,
                    }}>
                        <View style={{
                            flex: 1,
                            height: 40,
                            paddingHorizontal: 12,
                            borderRadius: 10,
                            backgroundColor: C.surface,
                            borderWidth: 1,
                            borderColor: C.border,
                            justifyContent: 'center',
                        }}>
                            <TextInput
                                value={customInput}
                                onChangeText={setCustomInput}
                                onSubmitEditing={addCustomSkill}
                                placeholder="Add your own…"
                                placeholderTextColor={C.t4}
                                returnKeyType="done"
                                style={{
                                    fontFamily: FONT.body,
                                    fontSize: 13,
                                    color: C.t1,
                                    padding: 0,
                                }}
                            />
                        </View>
                        <TouchableOpacity
                            onPress={addCustomSkill}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                backgroundColor: customInput.trim() ? C.orangeDim : C.surface,
                                borderWidth: 1,
                                borderColor: customInput.trim() ? C.orangeBorder : C.border,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Plus size={16} color={customInput.trim() ? C.orange : C.t4} strokeWidth={2} />
                        </TouchableOpacity>
                    </View>
                </>
            )}

            {/* Bio */}
            <Text style={[s.sectionLabel, { marginTop: 24 }]}>BIO (OPTIONAL)</Text>
            <View style={{
                borderRadius: 12,
                backgroundColor: C.surface,
                borderWidth: 1,
                borderColor: C.border,
                padding: 14,
                minHeight: 90,
            }}>
                <TextInput
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    numberOfLines={4}
                    placeholder="Describe your practice, style, or what makes you unique…"
                    placeholderTextColor={C.t4}
                    style={{
                        fontFamily: FONT.body,
                        fontSize: 14,
                        color: C.t1,
                        lineHeight: 20,
                        padding: 0,
                        textAlignVertical: 'top',
                        minHeight: 70,
                    }}
                />
            </View>
            <Text style={s.fineprint}>
                Your bio appears on your public profile. Keep it concise — 2 sentences work well.
            </Text>
        </View>
    );
}
