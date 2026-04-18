import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator, Animated } from 'react-native';
import { Instagram, Youtube, Globe, Edit3, Check, X, Plus } from 'lucide-react-native';
import authService from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

/**
 * EditableSocials — inline social link editing
 * Each link is independently editable. Tap pencil → edit → save.
 */

interface Props {
    instagram?: string;
    youtube?: string;
    website?: string;
    isOwner: boolean;
    highlightMissing?: boolean;
}

function SocialRow({ icon: Icon, iconColor, label, value, fieldKey, isOwner, highlight }: {
    icon: any; iconColor: string; label: string; value: string; fieldKey: string; isOwner: boolean; highlight?: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (draft.trim() === value) { setEditing(false); return; }
        setSaving(true);
        try {
            await authService.updateMe({ [fieldKey]: draft.trim() });
            const u = useAuthStore.getState().user as any;
            if (u) useAuthStore.getState().setAuth({ user: { ...u, [fieldKey]: draft.trim() }, accessToken: useAuthStore.getState().accessToken || '' });
            setEditing(false);
        } catch { Alert.alert('Error', 'Could not save.'); }
        finally { setSaving(false); }
    };

    if (editing) {
        return (
            <View style={s.editRow}>
                <Icon size={16} color={iconColor} />
                <TextInput
                    style={s.input}
                    value={draft}
                    onChangeText={setDraft}
                    placeholder={`Enter ${label}`}
                    placeholderTextColor="#4A4656"
                    autoCapitalize="none"
                    autoFocus
                    onSubmitEditing={handleSave}
                />
                {saving ? <ActivityIndicator size="small" color="#34D399" /> : (
                    <>
                        <Pressable onPress={handleSave} style={s.saveBtn}><Check size={14} color="#34D399" /></Pressable>
                        <Pressable onPress={() => { setDraft(value); setEditing(false); }} style={s.cancelBtn}><X size={12} color="#6B6878" /></Pressable>
                    </>
                )}
            </View>
        );
    }

    if (!value && !isOwner) return null;

    return (
        <Pressable
            onPress={isOwner ? () => { setDraft(value); setEditing(true); } : undefined}
            style={[s.row, highlight && !value && s.rowHighlight]}
        >
            <Icon size={16} color={iconColor} />
            <Text style={[s.text, !value && s.empty]} numberOfLines={1}>
                {value || (isOwner ? `Add ${label}` : '')}
            </Text>
            {isOwner && !value && (
                <Plus size={12} color="#F97316" style={{ marginLeft: 'auto' }} />
            )}
            {isOwner && value && (
                <Edit3 size={12} color="#6B6878" style={{ marginLeft: 'auto' }} />
            )}
        </Pressable>
    );
}

export default function EditableSocials({ instagram, youtube, website, isOwner, highlightMissing }: Props) {
    return (
        <View>
            <SocialRow icon={Instagram} iconColor="#E040A0" label="Instagram" value={instagram || ''} fieldKey="instagramHandle" isOwner={isOwner} highlight={highlightMissing} />
            <SocialRow icon={Youtube} iconColor="#EF4444" label="YouTube" value={youtube || ''} fieldKey="youtubeUrl" isOwner={isOwner} highlight={highlightMissing} />
            <SocialRow icon={Globe} iconColor="#06B6D4" label="Website" value={website || ''} fieldKey="spotifyUrl" isOwner={isOwner} highlight={highlightMissing} />
        </View>
    );
}

const s = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.04)',
    },
    rowHighlight: {
        borderWidth: 1,
        borderColor: 'rgba(249,115,22,0.3)',
        borderRadius: 12,
        backgroundColor: 'rgba(249,115,22,0.03)',
        paddingHorizontal: 12,
        marginVertical: 2,
    },
    text: { fontFamily: 'Outfit-Medium', fontSize: 14, color: '#F0ECE6', flex: 1 },
    empty: { color: '#4A4656', fontStyle: 'italic' },
    editRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(249,115,22,0.15)',
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(249,115,22,0.2)',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontFamily: 'Outfit-Regular',
        fontSize: 14,
        color: '#F0ECE6',
    },
    saveBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(52,211,153,0.1)', alignItems: 'center', justifyContent: 'center' },
    cancelBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
});
