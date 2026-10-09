// src/features/profile/components/FeaturedEditSheet.tsx
//
// Owner editor for the Spotlight "Featured" section (stage B). A self-contained
// bottom sheet — kept out of the big tabbed ProfileEditModal because a Featured
// item is a nested editor (title + description + a list of attachments).
//
// Attachment sourcing (locked decision): REUSE existing media + links —
// owner picks from photos/reels already in their showcase, or adds a PDF/link
// by URL. No new upload infrastructure.
//
// Persists via authService.updateProfile({ featured }) (PATCH /auth/me), then
// updates the auth store + the useUser query cache so the profile refreshes.
import { useEffect, useState } from 'react';
import {
    Modal, View, Text, TextInput, Pressable, ScrollView, Image,
    ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { X, Plus, Trash2, Link2, Play, FileText, Check, Image as LucideImage } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import authService from '@/services/authService';
import { userKeys } from '@/hooks/useUser';
import type { FeaturedItem, FeaturedAttachment } from '@/components/profile/types';

// A showcase media reference the owner can turn into an attachment.
export type ShowcaseRef = { type: 'photo' | 'video'; url: string; thumbnailUrl: string; muxPlaybackId?: string; label?: string };

const C = {
    scrim: 'rgba(0,0,0,0.6)', sheet: '#121216', card: '#17171C', input: '#0E0E13',
    border: '#27272A', border2: '#33333A', orange: '#FF6B35', violet: '#8B5CF6',
    t1: '#F4F4F5', t3: '#D4D4D8', t4: '#A1A1AA', t5: '#71717A', red: '#EF4444',
};

const urlify = (v: string) => (/^https?:\/\//i.test(v) ? v : `https://${v}`);
const hostOf = (v: string) => { try { return new URL(urlify(v)).hostname.replace(/^www\./, ''); } catch { return v; } };
const isPdf = (v: string) => /\.pdf($|\?|#)/i.test(v);

export function FeaturedEditSheet({ visible, onClose, userId, initial, showcase }: {
    visible: boolean;
    onClose: () => void;
    userId: string;
    initial: FeaturedItem[];
    showcase: ShowcaseRef[];
}) {
    const qc = useQueryClient();
    const user = useAuthStore((s) => s.user);
    const accessToken = useAuthStore((s) => s.accessToken);
    const setAuth = useAuthStore((s) => s.setAuth);

    const [items, setItems] = useState<FeaturedItem[]>([]);
    const [pickerFor, setPickerFor] = useState<number | null>(null);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkLabel, setLinkLabel] = useState('');
    const [saving, setSaving] = useState(false);

    // Reset to a deep copy of the saved state each time the sheet opens.
    useEffect(() => {
        if (visible) {
            setItems(JSON.parse(JSON.stringify(initial || [])));
            setPickerFor(null);
            setLinkUrl('');
            setLinkLabel('');
        }
    }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

    const patchItem = (idx: number, patch: Partial<FeaturedItem>) =>
        setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
    const addItem = () => setItems((prev) => [...prev, { title: '', description: '', attachments: [] }]);
    const removeItem = (idx: number) => {
        setItems((prev) => prev.filter((_, i) => i !== idx));
        setPickerFor(null);
    };
    const addAttachment = (idx: number, a: FeaturedAttachment) => {
        setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, attachments: [...(it.attachments || []), a] } : it)));
    };
    const removeAttachment = (idx: number, ai: number) => {
        setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, attachments: (it.attachments || []).filter((_, j) => j !== ai) } : it)));
    };

    const addShowcase = (idx: number, ref: ShowcaseRef) => {
        addAttachment(idx, ref.type === 'photo'
            ? { type: 'photo', url: ref.url, thumbnailUrl: ref.thumbnailUrl, label: ref.label }
            : { type: 'video', thumbnailUrl: ref.thumbnailUrl, muxPlaybackId: ref.muxPlaybackId, label: ref.label });
    };
    const addLink = (idx: number) => {
        const raw = linkUrl.trim();
        if (!raw) return;
        addAttachment(idx, { type: isPdf(raw) ? 'pdf' : 'link', url: urlify(raw), label: (linkLabel.trim() || hostOf(raw)) });
        setLinkUrl('');
        setLinkLabel('');
    };

    const onSave = async () => {
        if (saving) return;
        // Keep only items that have a title; trim fields.
        const cleaned: FeaturedItem[] = items
            .map((it) => ({ title: (it.title || '').trim(), description: (it.description || '').trim() || undefined, attachments: it.attachments || [] }))
            .filter((it) => it.title.length > 0);
        setSaving(true);
        try {
            const updated = await authService.updateProfile({ featured: cleaned } as any);
            // Refresh the profile everywhere it's read from.
            if (user) setAuth({ user: { ...user, ...(updated as any) }, accessToken: accessToken || '' });
            qc.setQueryData(userKeys.detail(userId), (old: any) => ({ ...(old || {}), ...(updated as any), featured: (updated as any)?.featured ?? cleaned }));
            qc.invalidateQueries({ queryKey: userKeys.detail(userId) });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            onClose();
        } catch {
            Alert.alert("Couldn't save", 'Please check your connection and try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <Pressable style={st.scrim} onPress={onClose} />
                <View style={st.sheet}>
                    {/* header */}
                    <View style={st.head}>
                        <Pressable onPress={onClose} hitSlop={10} style={st.headBtn}><X size={20} color={C.t3} /></Pressable>
                        <Text style={st.headTitle}>Featured</Text>
                        <Pressable onPress={onSave} disabled={saving} style={[st.saveBtn, saving && { opacity: 0.6 }]}>
                            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={st.saveTx}>Save</Text>}
                        </Pressable>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        <Text style={st.hint}>Highlight your best work — a performance, a workshop, press. Attach photos or reels from your showcase, or add a link.</Text>

                        {items.map((item, idx) => (
                            <View key={idx} style={st.itemCard}>
                                <View style={st.itemHead}>
                                    <Text style={st.itemNo}>{`Item ${idx + 1}`}</Text>
                                    <Pressable onPress={() => removeItem(idx)} hitSlop={8} style={st.trashBtn}><Trash2 size={15} color={C.red} /></Pressable>
                                </View>
                                <TextInput
                                    value={item.title}
                                    onChangeText={(t) => patchItem(idx, { title: t })}
                                    placeholder="Title (e.g. Solo at NCPA 2024)"
                                    placeholderTextColor={C.t5}
                                    style={st.input}
                                />
                                <TextInput
                                    value={item.description}
                                    onChangeText={(t) => patchItem(idx, { description: t })}
                                    placeholder="Description (optional)"
                                    placeholderTextColor={C.t5}
                                    multiline
                                    style={[st.input, st.inputMulti]}
                                />

                                {/* existing attachments */}
                                {(item.attachments || []).length > 0 && (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
                                        {(item.attachments || []).map((a, ai) => (
                                            <View key={ai} style={st.attChip}>
                                                <View style={st.attThumb}>
                                                    {a.thumbnailUrl && (a.type === 'photo' || a.type === 'video')
                                                        ? <Image source={{ uri: a.thumbnailUrl }} style={StyleSheet.absoluteFill} />
                                                        : null}
                                                    {a.type === 'video' ? <Play size={12} color="#fff" fill="#fff" />
                                                        : a.type === 'pdf' ? <FileText size={16} color={C.t4} />
                                                        : a.type === 'link' ? <Link2 size={16} color={C.t4} />
                                                        : null}
                                                    <Pressable onPress={() => removeAttachment(idx, ai)} hitSlop={6} style={st.attRemove}><X size={11} color="#fff" /></Pressable>
                                                </View>
                                                <Text style={st.attChipLbl} numberOfLines={1}>{a.label || a.type}</Text>
                                            </View>
                                        ))}
                                    </ScrollView>
                                )}

                                {/* add-attachment toggle */}
                                <Pressable onPress={() => setPickerFor(pickerFor === idx ? null : idx)} style={st.addAtt}>
                                    <Plus size={14} color={C.violet} /><Text style={st.addAttTx}>{pickerFor === idx ? 'Done adding' : 'Add attachment'}</Text>
                                </Pressable>

                                {pickerFor === idx && (
                                    <View style={st.picker}>
                                        <Text style={st.pickLabel}>From your showcase</Text>
                                        {showcase.length > 0 ? (
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                                                {showcase.map((ref, ri) => (
                                                    <Pressable key={ri} onPress={() => addShowcase(idx, ref)} style={st.pickThumb}>
                                                        <Image source={{ uri: ref.thumbnailUrl }} style={StyleSheet.absoluteFill} />
                                                        {ref.type === 'video' && <View style={st.pickPlay}><Play size={11} color="#fff" fill="#fff" /></View>}
                                                        <View style={st.pickAdd}><Plus size={12} color="#fff" /></View>
                                                    </Pressable>
                                                ))}
                                            </ScrollView>
                                        ) : (
                                            <View style={st.pickEmpty}><LucideImage size={16} color={C.t5} /><Text style={st.pickEmptyTx}>No photos or reels yet — add them in your profile.</Text></View>
                                        )}

                                        <Text style={[st.pickLabel, { marginTop: 12 }]}>Add a link or PDF</Text>
                                        <TextInput value={linkUrl} onChangeText={setLinkUrl} placeholder="https://…" placeholderTextColor={C.t5} autoCapitalize="none" keyboardType="url" style={st.input} />
                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                            <TextInput value={linkLabel} onChangeText={setLinkLabel} placeholder="Label (optional)" placeholderTextColor={C.t5} style={[st.input, { flex: 1, marginBottom: 0 }]} />
                                            <Pressable onPress={() => addLink(idx)} disabled={!linkUrl.trim()} style={[st.linkAddBtn, !linkUrl.trim() && { opacity: 0.5 }]}><Check size={16} color="#fff" /></Pressable>
                                        </View>
                                    </View>
                                )}
                            </View>
                        ))}

                        <Pressable onPress={addItem} style={st.addItem}>
                            <Plus size={16} color={C.orange} /><Text style={st.addItemTx}>Add featured item</Text>
                        </Pressable>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const st = StyleSheet.create({
    scrim: { flex: 1 },
    sheet: { backgroundColor: C.sheet, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', borderTopWidth: 1, borderColor: C.border },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
    headBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    headTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 20, color: C.t1 },
    saveBtn: { backgroundColor: C.orange, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 9, minWidth: 68, alignItems: 'center' },
    saveTx: { fontFamily: 'Outfit-Bold', fontSize: 14, color: '#fff' },
    hint: { fontFamily: 'Outfit-Regular', fontSize: 12.5, lineHeight: 18, color: C.t4, marginBottom: 14 },

    itemCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14, marginBottom: 14 },
    itemHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    itemNo: { fontFamily: 'SpaceMono-Bold', fontSize: 9.5, letterSpacing: 1.2, color: C.t5, textTransform: 'uppercase' },
    trashBtn: { padding: 4 },

    input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'Outfit-Regular', fontSize: 14, color: C.t1, marginBottom: 10 },
    inputMulti: { minHeight: 64, textAlignVertical: 'top' },

    attChip: { width: 76 },
    attThumb: { width: 76, height: 56, borderRadius: 10, overflow: 'hidden', backgroundColor: '#15131b', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    attRemove: { position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
    attChipLbl: { fontFamily: 'Outfit-Regular', fontSize: 10, color: C.t4, marginTop: 4 },

    addAtt: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', marginTop: 10, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)', backgroundColor: 'rgba(139,92,246,0.08)' },
    addAttTx: { fontFamily: 'Outfit-SemiBold', fontSize: 12.5, color: '#CDBBF5' },

    picker: { marginTop: 12, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 },
    pickLabel: { fontFamily: 'SpaceMono-Regular', fontSize: 9, letterSpacing: 1, color: C.t5, textTransform: 'uppercase', marginBottom: 6 },
    pickThumb: { width: 72, height: 72, borderRadius: 10, overflow: 'hidden', backgroundColor: '#15131b', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    pickPlay: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
    pickAdd: { position: 'absolute', bottom: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' },
    pickEmpty: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
    pickEmptyTx: { fontFamily: 'Outfit-Regular', fontSize: 12, color: C.t5, flex: 1 },
    linkAddBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.violet, alignItems: 'center', justifyContent: 'center' },

    addItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border2, borderRadius: 14, paddingVertical: 15 },
    addItemTx: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: C.orange },
});

export default FeaturedEditSheet;
