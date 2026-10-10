// src/features/profile/components/FeaturedEditSheet.tsx
//
// Owner composer for ONE Featured highlight (stage B, "add one at a time").
// The profile's Featured section is the list; this sheet only ever edits a
// single highlight — title + description + attachments — then saves it into
// the user's `featured` array. To add another, the profile opens a fresh
// composer (editIndex = null).
//
//   • New:   editIndex = null → blank composer, Save appends.
//   • Edit:  editIndex = i    → pre-filled, Save replaces, Remove deletes.
//
// Layout mirrors the mockup: Title → Description (RichTextInput w/ formatting
// toolbar, Markdown) → attachment tray at the bottom. "Add attachment" opens a
// nested picker (Showcase multi-select / Link·PDF by URL) — reuse-media + links.
//
// Persists via authService.updateProfile({ featured }) (PATCH /auth/me), then
// refreshes the auth store + the useUser query cache.
import { useEffect, useState } from 'react';
import {
    Modal, View, Text, TextInput, Pressable, ScrollView, Image,
    ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { X, Plus, Trash2, Play, FileText, Check, ChevronLeft, Link2, Image as LucideImage } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import authService from '@/services/authService';
import { userKeys } from '@/hooks/useUser';
import RichTextInput from '@/components/inputs/RichTextInput';
import type { FeaturedItem, FeaturedAttachment } from '@/components/profile/types';

export type ShowcaseRef = { type: 'photo' | 'video'; url: string; thumbnailUrl: string; muxPlaybackId?: string; label?: string };

const C = {
    scrim: 'rgba(0,0,0,0.6)', sheet: '#121216', card: '#17171C', input: '#0E0E13',
    border: '#1F1F23', border2: '#27272A', border3: '#33333A', orange: '#FF6B35', violet: '#8B5CF6',
    t1: '#F4F4F5', t3: '#D4D4D8', t4: '#A1A1AA', t5: '#71717A', red: '#EF4444',
};

const urlify = (v: string) => (/^https?:\/\//i.test(v) ? v : `https://${v}`);
const hostOf = (v: string) => { try { return new URL(urlify(v)).hostname.replace(/^www\./, ''); } catch { return v; } };
const isPdf = (v: string) => /\.pdf($|\?|#)/i.test(v);
const keyOfAtt = (a: FeaturedAttachment) => a.muxPlaybackId || a.thumbnailUrl || a.url || '';
const keyOfRef = (r: ShowcaseRef) => r.muxPlaybackId || r.thumbnailUrl || r.url || '';

export function FeaturedEditSheet({ visible, onClose, userId, featured, editIndex, showcase }: {
    visible: boolean;
    onClose: () => void;
    userId: string;
    featured: FeaturedItem[];
    editIndex: number | null;
    showcase: ShowcaseRef[];
}) {
    const qc = useQueryClient();
    const user = useAuthStore((s) => s.user);
    const accessToken = useAuthStore((s) => s.accessToken);
    const setAuth = useAuthStore((s) => s.setAuth);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [attachments, setAttachments] = useState<FeaturedAttachment[]>([]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerTab, setPickerTab] = useState<'showcase' | 'link'>('showcase');
    const [linkUrl, setLinkUrl] = useState('');
    const [linkLabel, setLinkLabel] = useState('');
    const [saving, setSaving] = useState(false);

    const editing = editIndex != null;

    // Load the highlight (or blank) each time the sheet opens.
    useEffect(() => {
        if (!visible) return;
        const src = editIndex != null ? featured[editIndex] : undefined;
        setTitle(src?.title || '');
        setDescription(src?.description || '');
        setAttachments(src?.attachments ? JSON.parse(JSON.stringify(src.attachments)) : []);
        setPickerOpen(false);
        setPickerTab('showcase');
        setLinkUrl('');
        setLinkLabel('');
    }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

    const removeAttachment = (i: number) => setAttachments((prev) => prev.filter((_, j) => j !== i));

    const toggleShowcase = (ref: ShowcaseRef) => {
        const k = keyOfRef(ref);
        setAttachments((prev) => {
            if (prev.some((a) => keyOfAtt(a) === k)) return prev.filter((a) => keyOfAtt(a) !== k);
            const a: FeaturedAttachment = ref.type === 'photo'
                ? { type: 'photo', url: ref.url, thumbnailUrl: ref.thumbnailUrl, label: ref.label }
                : { type: 'video', thumbnailUrl: ref.thumbnailUrl, muxPlaybackId: ref.muxPlaybackId, label: ref.label };
            return [...prev, a];
        });
    };

    const addLink = () => {
        const raw = linkUrl.trim();
        if (!raw) return;
        setAttachments((prev) => [...prev, { type: isPdf(raw) ? 'pdf' : 'link', url: urlify(raw), label: linkLabel.trim() || hostOf(raw) }]);
        setLinkUrl('');
        setLinkLabel('');
    };

    const persist = async (next: FeaturedItem[]) => {
        const updated = await authService.updateProfile({ featured: next } as any);
        if (user) setAuth({ user: { ...user, ...(updated as any) }, accessToken: accessToken || '' });
        qc.setQueryData(userKeys.detail(userId), (old: any) => ({ ...(old || {}), ...(updated as any), featured: (updated as any)?.featured ?? next }));
        qc.invalidateQueries({ queryKey: userKeys.detail(userId) });
    };

    const onSave = async () => {
        if (saving) return;
        if (!title.trim()) { Alert.alert('Add a title', 'Give this highlight a short title.'); return; }
        const item: FeaturedItem = { title: title.trim(), description: description.trim() || undefined, attachments };
        const next = editIndex != null ? featured.map((f, i) => (i === editIndex ? item : f)) : [...featured, item];
        setSaving(true);
        try {
            await persist(next);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            onClose();
        } catch {
            Alert.alert("Couldn't save", 'Please check your connection and try again.');
        } finally {
            setSaving(false);
        }
    };

    const onRemove = () => {
        if (editIndex == null) return;
        Alert.alert('Remove highlight?', 'This Featured highlight will be deleted.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove', style: 'destructive', onPress: async () => {
                    setSaving(true);
                    try { await persist(featured.filter((_, i) => i !== editIndex)); onClose(); }
                    catch { Alert.alert("Couldn't remove", 'Please try again.'); }
                    finally { setSaving(false); }
                },
            },
        ]);
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <Pressable style={st.scrim} onPress={onClose} />
                <View style={st.sheet}>
                    <View style={st.grab} />
                    <View style={st.head}>
                        <Pressable onPress={onClose} hitSlop={10} style={st.headBtn}><X size={20} color={C.t3} /></Pressable>
                        <Text style={st.headTitle}>{editing ? 'Edit highlight' : 'New highlight'}</Text>
                        <Pressable onPress={onSave} disabled={saving || !title.trim()} style={[st.saveBtn, (saving || !title.trim()) && { opacity: 0.5 }]}>
                            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={st.saveTx}>Save</Text>}
                        </Pressable>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Title"
                            placeholderTextColor={C.t5}
                            style={st.titleInput}
                        />

                        <Text style={st.fieldLab}>Description</Text>
                        <RichTextInput
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Describe this highlight (optional)"
                            minHeight={150}
                        />

                        <Text style={st.fieldLab}>{attachments.length > 0 ? `Attachments · ${attachments.length}` : 'Attachments'}</Text>
                        <View style={st.tray}>
                            {attachments.map((a, i) => (
                                <View key={i} style={st.tile}>
                                    {a.thumbnailUrl && (a.type === 'photo' || a.type === 'video')
                                        ? <Image source={{ uri: a.thumbnailUrl }} style={StyleSheet.absoluteFill} />
                                        : null}
                                    {a.type === 'video' ? <Play size={15} color="#fff" fill="#fff" />
                                        : a.type === 'pdf' ? <FileText size={20} color={C.t4} />
                                        : a.type === 'link' ? <Link2 size={20} color={C.t4} />
                                        : null}
                                    <Pressable onPress={() => removeAttachment(i)} hitSlop={6} style={st.tileRm}><X size={11} color="#fff" /></Pressable>
                                </View>
                            ))}
                            <Pressable onPress={() => setPickerOpen(true)} style={st.addTile}><Plus size={26} color={C.orange} /></Pressable>
                        </View>

                        {editing && (
                            <Pressable onPress={onRemove} style={st.removeRow}><Trash2 size={15} color={C.red} /><Text style={st.removeTx}>Remove highlight</Text></Pressable>
                        )}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>

            {/* Nested attachment picker */}
            <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                    <Pressable style={st.scrim} onPress={() => setPickerOpen(false)} />
                    <View style={st.sheet}>
                        <View style={st.grab} />
                        <View style={st.head}>
                            <Pressable onPress={() => setPickerOpen(false)} hitSlop={10} style={st.headBtn}><ChevronLeft size={22} color={C.t3} /></Pressable>
                            <Text style={st.headTitle}>Add attachment</Text>
                            <Pressable onPress={() => setPickerOpen(false)} style={st.saveBtn}><Text style={st.saveTx}>Done</Text></Pressable>
                        </View>

                        <View style={st.tabs}>
                            {(['showcase', 'link'] as const).map((t) => (
                                <Pressable key={t} onPress={() => setPickerTab(t)} style={[st.tab, pickerTab === t && st.tabOn]}>
                                    <Text style={[st.tabTx, pickerTab === t && st.tabTxOn]}>{t === 'showcase' ? 'Showcase' : 'Link / PDF'}</Text>
                                </Pressable>
                            ))}
                        </View>

                        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                            {pickerTab === 'showcase' ? (
                                showcase.length > 0 ? (
                                    <>
                                        <View style={st.grid}>
                                            {showcase.map((ref, i) => {
                                                const added = attachments.some((a) => keyOfAtt(a) === keyOfRef(ref));
                                                return (
                                                    <Pressable key={i} onPress={() => toggleShowcase(ref)} style={[st.gtile, added && st.gtileSel]}>
                                                        <Image source={{ uri: ref.thumbnailUrl }} style={StyleSheet.absoluteFill} />
                                                        {ref.type === 'video' && <View style={st.gplay}><Play size={12} color="#fff" fill="#fff" /></View>}
                                                        <View style={[st.gchk, added && st.gchkOn]}>{added ? <Check size={12} color="#fff" /> : null}</View>
                                                    </Pressable>
                                                );
                                            })}
                                        </View>
                                        <Text style={st.gridHint}>Tap to add or remove. Added: {attachments.length}</Text>
                                    </>
                                ) : (
                                    <View style={st.empty}><LucideImage size={18} color={C.t5} /><Text style={st.emptyTx}>No photos or reels yet — add them to your showcase first.</Text></View>
                                )
                            ) : (
                                <View>
                                    <TextInput value={linkUrl} onChangeText={setLinkUrl} placeholder="https://… (a link or a PDF)" placeholderTextColor={C.t5} autoCapitalize="none" keyboardType="url" style={st.input} />
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <TextInput value={linkLabel} onChangeText={setLinkLabel} placeholder="Label (optional)" placeholderTextColor={C.t5} style={[st.input, { flex: 1, marginBottom: 0 }]} />
                                        <Pressable onPress={addLink} disabled={!linkUrl.trim()} style={[st.linkAdd, !linkUrl.trim() && { opacity: 0.5 }]}><Plus size={18} color="#fff" /></Pressable>
                                    </View>
                                    {attachments.filter((a) => a.type === 'link' || a.type === 'pdf').length > 0 && (
                                        <Text style={st.gridHint}>{attachments.filter((a) => a.type === 'link' || a.type === 'pdf').length} link/PDF added</Text>
                                    )}
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </Modal>
    );
}

const st = StyleSheet.create({
    scrim: { flex: 1 },
    sheet: { backgroundColor: C.sheet, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', borderTopWidth: 1, borderColor: C.border2 },
    grab: { width: 34, height: 4, borderRadius: 2, backgroundColor: C.border3, alignSelf: 'center', marginTop: 9 },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
    headBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    headTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 19, color: C.t1 },
    saveBtn: { backgroundColor: C.orange, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 9, minWidth: 66, alignItems: 'center' },
    saveTx: { fontFamily: 'Outfit-Bold', fontSize: 14, color: '#fff' },

    titleInput: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22, color: C.t1, borderBottomWidth: 1, borderBottomColor: C.border2, paddingVertical: 6 },
    fieldLab: { fontFamily: 'SpaceMono-Regular', fontSize: 9, letterSpacing: 1.2, color: C.t5, textTransform: 'uppercase', marginTop: 18, marginBottom: 9 },

    tray: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
    tile: { width: 72, height: 72, borderRadius: 13, overflow: 'hidden', backgroundColor: '#15131b', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    tileRm: { position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
    addTile: { width: 72, height: 72, borderRadius: 13, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border3, alignItems: 'center', justifyContent: 'center' },

    removeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 22, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border },
    removeTx: { fontFamily: 'Outfit-SemiBold', fontSize: 13, color: C.red },

    tabs: { flexDirection: 'row', gap: 3, backgroundColor: C.input, borderWidth: 1, borderColor: C.border3, borderRadius: 11, padding: 3, margin: 16, marginBottom: 0 },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
    tabOn: { backgroundColor: C.card },
    tabTx: { fontFamily: 'Outfit-SemiBold', fontSize: 12.5, color: C.t4 },
    tabTxOn: { color: C.t1 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    gtile: { width: '31.5%', aspectRatio: 1, borderRadius: 11, overflow: 'hidden', backgroundColor: '#15131b', borderWidth: 1, borderColor: C.border },
    gtileSel: { borderColor: C.orange, borderWidth: 2 },
    gplay: { position: 'absolute', left: 6, bottom: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
    gchk: { position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
    gchkOn: { backgroundColor: C.orange, borderColor: C.orange },
    gridHint: { fontFamily: 'Outfit-Regular', fontSize: 11.5, color: C.t5, marginTop: 12 },

    empty: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 14 },
    emptyTx: { fontFamily: 'Outfit-Regular', fontSize: 12.5, color: C.t5, flex: 1 },

    input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border3, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontFamily: 'Outfit-Regular', fontSize: 14, color: C.t1, marginBottom: 10 },
    linkAdd: { width: 46, height: 46, borderRadius: 12, backgroundColor: C.violet, alignItems: 'center', justifyContent: 'center' },
});

export default FeaturedEditSheet;
