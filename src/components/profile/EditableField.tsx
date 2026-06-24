import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Animated, ActivityIndicator, Alert } from 'react-native';
import { Edit3, Check, X } from 'lucide-react-native';
import authService from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

/**
 * EditableField — WhatsApp-style inline editing
 *
 * For low-literacy users who don't understand modals/forms:
 * 1. Display mode: shows current value + small pencil icon
 * 2. User taps pencil → field transforms into input
 * 3. User types → taps checkmark → saves immediately
 * 4. Green flash confirms success
 * 5. Back to display mode
 *
 * Each field saves independently. No "Submit All" button.
 * No modal. No form. Just tap, type, save.
 */

interface EditableFieldProps {
    label: string;
    value: string;
    fieldKey: string; // API field name (e.g., 'bio', 'displayName', 'location')
    placeholder?: string;
    multiline?: boolean;
    maxLength?: number;
    isOwner?: boolean;
    icon?: React.ReactNode;
    onSaved?: (newValue: string) => void;
    highlight?: boolean; // Orange border pulse when missing + highlightMissing
}

export default function EditableField({
    label, value, fieldKey, placeholder, multiline = false,
    maxLength, isOwner = true, icon, onSaved, highlight = false,
}: EditableFieldProps) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const [saving, setSaving] = useState(false);
    const flashAnim = useRef(new Animated.Value(0)).current;
    const inputRef = useRef<TextInput>(null);

    // Sync draft when value changes externally
    useEffect(() => { setDraft(value); }, [value]);

    // Auto-focus input when entering edit mode
    useEffect(() => {
        if (editing) setTimeout(() => inputRef.current?.focus(), 100);
    }, [editing]);

    const handleSave = async () => {
        if (draft.trim() === value.trim()) {
            setEditing(false);
            return;
        }

        setSaving(true);
        try {
            await authService.updateMe({ [fieldKey]: draft.trim() });

            // Update local auth store
            const currentUser = useAuthStore.getState().user as any;
            if (currentUser) {
                useAuthStore.getState().setAuth({
                    user: { ...currentUser, [fieldKey]: draft.trim() },
                    accessToken: useAuthStore.getState().accessToken || '',
                });
            }

            onSaved?.(draft.trim());
            setEditing(false);

            // Success flash
            Animated.sequence([
                Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
                Animated.timing(flashAnim, { toValue: 0, duration: 600, useNativeDriver: false }),
            ]).start();
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.msg || 'Could not save. Try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setDraft(value);
        setEditing(false);
    };

    const flashBg = flashAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['transparent', 'rgba(52,211,153,0.08)'],
    });

    if (!isOwner) {
        // Non-owner: just display, no edit
        return (
            <View style={s.field}>
                {icon && <View style={s.iconWrap}>{icon}</View>}
                <View style={s.content}>
                    <Text style={s.label}>{label}</Text>
                    <Text style={[s.value, !value && s.empty]}>
                        {value || 'Not set'}
                    </Text>
                </View>
            </View>
        );
    }

    if (editing) {
        return (
            <View style={s.editField}>
                <Text style={s.editLabel}>{label}</Text>
                <View style={s.inputRow}>
                    <TextInput
                        ref={inputRef}
                        style={[s.input, multiline && s.inputMultiline]}
                        value={draft}
                        onChangeText={setDraft}
                        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
                        placeholderTextColor="#4A4656"
                        multiline={multiline}
                        maxLength={maxLength}
                        textAlignVertical={multiline ? 'top' : 'center'}
                        returnKeyType={multiline ? 'default' : 'done'}
                        onSubmitEditing={multiline ? undefined : handleSave}
                        blurOnSubmit={!multiline}
                    />
                    <View style={s.editActions}>
                        {saving ? (
                            <ActivityIndicator size="small" color="#34D399" />
                        ) : (
                            <>
                                <Pressable onPress={handleSave} style={s.saveBtn} hitSlop={12}>
                                    <Check size={18} color="#34D399" strokeWidth={2.5} />
                                </Pressable>
                                <Pressable onPress={handleCancel} style={s.cancelBtn} hitSlop={12}>
                                    <X size={16} color="#6B6878" strokeWidth={2} />
                                </Pressable>
                            </>
                        )}
                    </View>
                </View>
                {maxLength && (
                    <Text style={s.charCount}>{draft.length}/{maxLength}</Text>
                )}
            </View>
        );
    }

    return (
        <Animated.View style={[s.field, { backgroundColor: flashBg }, highlight && s.fieldHighlight]}>
            {icon && <View style={s.iconWrap}>{icon}</View>}
            <View style={s.content}>
                <Text style={s.label}>{label}</Text>
                <Text style={[s.value, !value && s.empty, highlight && s.highlightText]} numberOfLines={multiline ? 4 : 1}>
                    {value || placeholder || 'Tap to add'}
                </Text>
            </View>
            <Pressable onPress={() => setEditing(true)} style={[s.editBtn, highlight && s.editBtnHighlight]} hitSlop={12}>
                <Edit3 size={14} color="#F97316" strokeWidth={2} />
            </Pressable>
        </Animated.View>
    );
}

const s = StyleSheet.create({
    field: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.04)',
        borderRadius: 8,
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(249,115,22,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    content: {
        flex: 1,
    },
    label: {
        fontFamily: 'Outfit-Medium',
        fontSize: 11,
        color: '#6B6878',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    value: {
        fontFamily: 'Outfit-Regular',
        fontSize: 15,
        color: '#F0ECE6',
        lineHeight: 22,
    },
    empty: {
        color: '#4A4656',
        fontStyle: 'italic',
    },
    editBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(249,115,22,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    // Highlight styles for missing fields
    fieldHighlight: {
        borderWidth: 1,
        borderColor: 'rgba(249,115,22,0.3)',
        borderRadius: 12,
        backgroundColor: 'rgba(249,115,22,0.03)',
        paddingHorizontal: 12,
        marginVertical: 2,
        borderBottomWidth: 1,
    },
    highlightText: {
        color: '#F97316',
    },
    editBtnHighlight: {
        backgroundColor: 'rgba(249,115,22,0.15)',
    },
    // Edit mode
    editField: {
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(249,115,22,0.15)',
        borderRadius: 8,
    },
    editLabel: {
        fontFamily: 'Outfit-SemiBold',
        fontSize: 12,
        color: '#F97316',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(249,115,22,0.2)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontFamily: 'Outfit-Regular',
        fontSize: 15,
        color: '#F0ECE6',
    },
    inputMultiline: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    editActions: {
        flexDirection: 'column',
        gap: 8,
        paddingTop: 4,
    },
    saveBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(52,211,153,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    charCount: {
        fontFamily: 'Outfit-Regular',
        fontSize: 10,
        color: '#4A4656',
        textAlign: 'right',
        marginTop: 4,
    },
});
