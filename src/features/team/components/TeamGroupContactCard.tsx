// netsa-mobile/src/features/team/components/TeamGroupContactCard.tsx
//
// Group contact card on the team page.
//
// Two states:
//   - Hirer hasn't pasted a WhatsApp group invite URL yet → shows an
//     editable textfield + "Save link" button. Saves via useUpdateGig
//     to gig.teamWhatsAppInviteUrl.
//   - URL is set → shows the link + a tap-to-join CTA that opens WA
//     via Linking. Hirer can edit (replaces the saved value).
//
// NETSA-native group chat is the long-term plan; this WA invite is the
// quick-win interim per the Apr 29 product call.

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Link2, MessageCircle, Save, Pencil } from 'lucide-react-native';
import { useUpdateGig } from '@/hooks/useGigs';

const COLORS = {
    text0: '#F3EFE8',
    text2: '#6B6878',
    cardBg: 'rgba(255,255,255,0.03)',
    cardBorder: 'rgba(255,255,255,0.06)',
    wa: '#25D366',
    waBg: 'rgba(37,211,102,0.10)',
};

const WA_HINT = 'Paste a WhatsApp group invite URL (https://chat.whatsapp.com/...). Hired artists can tap to join.';

export interface TeamGroupContactCardProps {
    gig: any;
}

function isValidUrl(s: string): boolean {
    try {
        const u = new URL(s.trim());
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
        return false;
    }
}

export function TeamGroupContactCard({ gig }: TeamGroupContactCardProps) {
    const updateMutation = useUpdateGig();
    const savedUrl: string = (gig?.teamWhatsAppInviteUrl ?? '').trim();
    const [editing, setEditing] = useState(savedUrl.length === 0);
    const [draft, setDraft] = useState(savedUrl);

    // Re-sync the draft when the saved URL changes from outside (refetch /
    // optimistic update) — but ONLY if we're not actively editing, to avoid
    // clobbering user input mid-paste.
    useEffect(() => {
        if (!editing) setDraft(savedUrl);
    }, [savedUrl, editing]);

    const handleSave = async () => {
        const trimmed = draft.trim();
        if (trimmed && !isValidUrl(trimmed)) {
            try {
                Alert.alert('Invalid URL', 'Use the full WhatsApp invite link starting with https://');
            } catch {
                /* noop */
            }
            return;
        }
        try {
            await updateMutation.mutateAsync({
                id: gig._id,
                payload: { teamWhatsAppInviteUrl: trimmed } as any,
            });
            setEditing(false);
        } catch (err: any) {
            try {
                Alert.alert('Could not save link', err?.message ?? 'Try again.');
            } catch {
                /* noop */
            }
        }
    };

    const handleJoin = async () => {
        if (!savedUrl) return;
        try {
            const can = await Linking.canOpenURL(savedUrl);
            if (!can) {
                try {
                    Alert.alert('Cannot open', 'WhatsApp may not be installed on this device.');
                } catch {
                    /* noop */
                }
                return;
            }
            await Linking.openURL(savedUrl);
        } catch (err: any) {
            try {
                Alert.alert('Could not open', err?.message ?? 'Try again.');
            } catch {
                /* noop */
            }
        }
    };

    return (
        <View
            accessibilityLabel="team-group-contact-card"
            style={{
                marginHorizontal: 20,
                marginTop: 12,
                padding: 16,
                borderRadius: 18,
                backgroundColor: COLORS.cardBg,
                borderWidth: 1,
                borderColor: COLORS.cardBorder,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        backgroundColor: COLORS.waBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                    <MessageCircle size={18} color={COLORS.wa} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.text0, fontSize: 15, fontWeight: '800' }}>
                        WhatsApp group
                    </Text>
                    <Text style={{ color: COLORS.text2, fontSize: 12, marginTop: 2 }}>
                        Quick coordination with the whole team
                    </Text>
                </View>
            </View>

            {editing ? (
                <View style={{ marginTop: 14 }}>
                    <TextInput
                        value={draft}
                        onChangeText={setDraft}
                        placeholder="https://chat.whatsapp.com/..."
                        placeholderTextColor="#52525B"
                        autoCapitalize="none"
                        keyboardType="url"
                        accessibilityLabel="wa-invite-url-input"
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.06)',
                            borderRadius: 12,
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            color: COLORS.text0,
                            fontSize: 13,
                        }}
                    />
                    <Text style={{ color: COLORS.text2, fontSize: 11, marginTop: 8, lineHeight: 16 }}>
                        {WA_HINT}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                        {savedUrl ? (
                            <TouchableOpacity
                                onPress={() => {
                                    setDraft(savedUrl);
                                    setEditing(false);
                                }}
                                accessibilityLabel="wa-invite-cancel"
                                style={{
                                    flex: 1,
                                    paddingVertical: 10,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.10)',
                                }}>
                                <Text style={{ color: COLORS.text0, fontSize: 12, fontWeight: '700' }}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                        <TouchableOpacity
                            onPress={updateMutation.isPending ? undefined : handleSave}
                            disabled={updateMutation.isPending}
                            accessibilityLabel="wa-invite-save"
                            style={{
                                flex: 2,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                paddingVertical: 10,
                                borderRadius: 12,
                                backgroundColor: COLORS.wa,
                                opacity: updateMutation.isPending ? 0.5 : 1,
                            }}>
                            {updateMutation.isPending ? (
                                <ActivityIndicator size="small" color="#000" />
                            ) : (
                                <Save size={14} color="#000" strokeWidth={2.5} />
                            )}
                            <Text style={{ color: '#000', fontSize: 12, fontWeight: '900' }}>
                                {updateMutation.isPending ? 'Saving…' : 'Save link'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={{ marginTop: 14 }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.06)',
                            borderRadius: 12,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                        }}>
                        <Link2 size={14} color={COLORS.text2} />
                        <Text
                            numberOfLines={1}
                            style={{ flex: 1, color: COLORS.text0, fontSize: 12 }}
                            accessibilityLabel="wa-invite-saved-url"
                        >
                            {savedUrl}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                        <TouchableOpacity
                            onPress={() => setEditing(true)}
                            accessibilityLabel="wa-invite-edit"
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                paddingVertical: 10,
                                borderRadius: 12,
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.10)',
                            }}>
                            <Pencil size={12} color={COLORS.text0} />
                            <Text style={{ color: COLORS.text0, fontSize: 12, fontWeight: '700' }}>
                                Edit
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleJoin}
                            accessibilityLabel="wa-invite-join"
                            style={{
                                flex: 2,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                paddingVertical: 10,
                                borderRadius: 12,
                                backgroundColor: COLORS.wa,
                            }}>
                            <MessageCircle size={14} color="#000" />
                            <Text style={{ color: '#000', fontSize: 12, fontWeight: '900' }}>
                                Open group chat
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

export default TeamGroupContactCard;
