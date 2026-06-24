import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Plus, X, Check, Edit3 } from 'lucide-react-native';
import authService from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

/**
 * EditableChips — tap-to-manage skill/tag chips
 *
 * Display mode: shows chips + edit pencil
 * Edit mode: shows chips with X to remove + input to add new
 * Saves on checkmark tap. No modal.
 */

interface EditableChipsProps {
    label: string;
    values: string[];
    fieldKey: string;
    suggestions?: string[];
    isOwner?: boolean;
    maxItems?: number;
    onSaved?: (newValues: string[]) => void;
}

export default function EditableChips({
    label, values, fieldKey, suggestions = [], isOwner = true, maxItems = 15, onSaved,
}: EditableChipsProps) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<string[]>(values);
    const [newChip, setNewChip] = useState('');
    const [saving, setSaving] = useState(false);

    const addChip = (chip: string) => {
        const clean = chip.trim();
        if (!clean || draft.includes(clean) || draft.length >= maxItems) return;
        setDraft([...draft, clean]);
        setNewChip('');
    };

    const removeChip = (chip: string) => {
        setDraft(draft.filter(c => c !== chip));
    };

    const handleSave = async () => {
        if (JSON.stringify(draft) === JSON.stringify(values)) {
            setEditing(false);
            return;
        }

        setSaving(true);
        try {
            await authService.updateMe({ [fieldKey]: draft });
            const currentUser = useAuthStore.getState().user as any;
            if (currentUser) {
                useAuthStore.getState().setAuth({
                    user: { ...currentUser, [fieldKey]: draft },
                    accessToken: useAuthStore.getState().accessToken || '',
                });
            }
            onSaved?.(draft);
            setEditing(false);
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.msg || 'Could not save.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setDraft(values);
        setNewChip('');
        setEditing(false);
    };

    const availableSuggestions = suggestions.filter(s => !draft.includes(s));

    if (!isOwner) {
        return (
            <View style={s.container}>
                <Text style={s.label}>{label}</Text>
                <View style={s.chips}>
                    {values.map((v, i) => (
                        <View key={i} style={s.chip}>
                            <Text style={s.chipText}>{v}</Text>
                        </View>
                    ))}
                    {values.length === 0 && <Text style={s.empty}>None added</Text>}
                </View>
            </View>
        );
    }

    if (editing) {
        return (
            <View style={s.editContainer}>
                <View style={s.editHeader}>
                    <Text style={s.editLabel}>{label}</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        {saving ? (
                            <ActivityIndicator size="small" color="#34D399" />
                        ) : (
                            <>
                                <Pressable onPress={handleSave} style={s.saveBtn}>
                                    <Check size={16} color="#34D399" strokeWidth={2.5} />
                                </Pressable>
                                <Pressable onPress={handleCancel} style={s.cancelBtn}>
                                    <X size={14} color="#6B6878" />
                                </Pressable>
                            </>
                        )}
                    </View>
                </View>

                {/* Current chips with remove */}
                <View style={s.chips}>
                    {draft.map((v, i) => (
                        <Pressable key={i} onPress={() => removeChip(v)} style={s.chipRemovable}>
                            <Text style={s.chipText}>{v}</Text>
                            <X size={12} color="#EF4444" strokeWidth={2} />
                        </Pressable>
                    ))}
                </View>

                {/* Add input */}
                <View style={s.addRow}>
                    <TextInput
                        style={s.addInput}
                        placeholder="Type to add..."
                        placeholderTextColor="#4A4656"
                        value={newChip}
                        onChangeText={setNewChip}
                        onSubmitEditing={() => addChip(newChip)}
                        returnKeyType="done"
                    />
                    <Pressable onPress={() => addChip(newChip)} style={s.addBtn}>
                        <Plus size={16} color="#F97316" />
                    </Pressable>
                </View>

                {/* Quick suggestions */}
                {availableSuggestions.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingTop: 8 }}>
                        {availableSuggestions.slice(0, 8).map((sg, i) => (
                            <Pressable key={i} onPress={() => addChip(sg)} style={s.suggestion}>
                                <Plus size={10} color="#6B6878" />
                                <Text style={s.suggestionText}>{sg}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                )}
            </View>
        );
    }

    return (
        <View style={s.container}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={s.label}>{label}</Text>
                <Pressable onPress={() => { setDraft(values); setEditing(true); }} style={s.editIcon} hitSlop={12}>
                    <Edit3 size={13} color="#F97316" strokeWidth={2} />
                </Pressable>
            </View>
            <View style={s.chips}>
                {values.map((v, i) => (
                    <View key={i} style={s.chip}>
                        <Text style={s.chipText}>{v}</Text>
                    </View>
                ))}
                {values.length === 0 && (
                    <Pressable onPress={() => setEditing(true)} style={s.addEmpty}>
                        <Plus size={12} color="#F97316" />
                        <Text style={s.addEmptyText}>Tap to add</Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.04)',
    },
    label: {
        fontFamily: 'Outfit-Medium',
        fontSize: 11,
        color: '#6B6878',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    chip: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 100,
        backgroundColor: 'rgba(249,115,22,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(249,115,22,0.15)',
    },
    chipRemovable: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 100,
        backgroundColor: 'rgba(249,115,22,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(249,115,22,0.15)',
    },
    chipText: {
        fontFamily: 'Outfit-Medium',
        fontSize: 13,
        color: '#F97316',
    },
    empty: {
        fontFamily: 'Outfit-Regular',
        fontSize: 13,
        color: '#4A4656',
        fontStyle: 'italic',
    },
    editIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: 'rgba(249,115,22,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Edit mode
    editContainer: {
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(249,115,22,0.15)',
    },
    editHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    editLabel: {
        fontFamily: 'Outfit-SemiBold',
        fontSize: 12,
        color: '#F97316',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    saveBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(52,211,153,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 10,
    },
    addInput: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(249,115,22,0.2)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontFamily: 'Outfit-Regular',
        fontSize: 14,
        color: '#F0ECE6',
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(249,115,22,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    suggestion: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    suggestionText: {
        fontFamily: 'Outfit-Regular',
        fontSize: 11,
        color: '#6B6878',
    },
    addEmpty: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 100,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(249,115,22,0.25)',
    },
    addEmptyText: {
        fontFamily: 'Outfit-Medium',
        fontSize: 12,
        color: '#F97316',
    },
});
