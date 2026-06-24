// src/features/booking-terms-editor/components/CustomClausesEditor.tsx
//
// Reusable numbered-clause list editor.
// Used by:
//   - BookingTermsEditor (post-publish)
//   - GigFormV2 Page 4 Description (during gig creation)

import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { X, Plus } from 'lucide-react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878', text3: '#3F3D4A',
    bg1: '#0F0F16', bg2: '#16161F', line: 'rgba(255,255,255,0.05)', line2: 'rgba(255,255,255,0.09)',
    orange: '#FF6B35',
};

const MAX_CLAUSES = 5;
const MAX_CLAUSE_LEN = 500;

type Props = {
    clauses: string[];
    onChange: (next: string[]) => void;
};

export function CustomClausesEditor({ clauses, onChange }: Props) {
    const setClauseAt = (index: number, value: string) => {
        const next = [...clauses];
        next[index] = value;
        onChange(next);
    };

    const removeClauseAt = (index: number) => {
        onChange(clauses.filter((_, i) => i !== index));
    };

    const addClause = () => {
        if (clauses.length >= MAX_CLAUSES) return;
        onChange([...clauses, '']);
    };

    return (
        <View>
            {clauses.length === 0 && (
                <Text style={{ color: COLORS.text2, fontSize: 12, marginBottom: 12, fontStyle: 'italic' }}>
                    No custom clauses yet. Add up to 5 — they appear in every contract artists sign for this gig.
                </Text>
            )}
            <View style={{ gap: 8, marginBottom: clauses.length > 0 ? 12 : 0 }}>
                {clauses.map((clause, i) => (
                    <View
                        key={i}
                        style={{
                            flexDirection: 'row', alignItems: 'flex-start', gap: 8,
                            padding: 12, borderRadius: 12,
                            backgroundColor: COLORS.bg2,
                            borderWidth: 1, borderColor: COLORS.line,
                        }}>
                        <Text style={{
                            color: COLORS.text3, fontFamily: 'SpaceMono-Regular', fontSize: 12,
                            paddingTop: 2, minWidth: 18,
                        }}>
                            {String(i + 1).padStart(2, '0')}
                        </Text>
                        <TextInput
                            value={clause}
                            onChangeText={(v) => setClauseAt(i, v.slice(0, MAX_CLAUSE_LEN))}
                            multiline
                            placeholder="e.g. Artist must arrive 1 hour before stage time"
                            placeholderTextColor={COLORS.text3}
                            style={{
                                flex: 1, color: COLORS.text1, fontSize: 13, lineHeight: 20,
                                padding: 0, minHeight: 36,
                            }}
                            maxLength={MAX_CLAUSE_LEN}
                            accessibilityLabel={`Clause ${i + 1}`}
                        />
                        <TouchableOpacity
                            onPress={() => removeClauseAt(i)}
                            accessibilityLabel={`Remove clause ${i + 1}`}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <X size={14} color={COLORS.text3} />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
            <TouchableOpacity
                onPress={addClause}
                disabled={clauses.length >= MAX_CLAUSES}
                accessibilityLabel="Add a custom clause"
                style={{
                    paddingVertical: 12, borderRadius: 12,
                    borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.line2,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                    opacity: clauses.length >= MAX_CLAUSES ? 0.4 : 1,
                }}>
                <Plus size={14} color={COLORS.text1} />
                <Text style={{ color: COLORS.text1, fontSize: 13, fontWeight: '700' }}>
                    Add clause ({clauses.length}/{MAX_CLAUSES})
                </Text>
            </TouchableOpacity>
            <Text style={{ color: COLORS.text3, fontSize: 11, marginTop: 8, fontStyle: 'italic', lineHeight: 16 }}>
                Avoid penalties or unreasonable demands — they discourage applications.
            </Text>
        </View>
    );
}
