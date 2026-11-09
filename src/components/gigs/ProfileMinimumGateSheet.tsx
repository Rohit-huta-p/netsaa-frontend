// src/components/gigs/ProfileMinimumGateSheet.tsx
// Inline profile-minimum completion sheet, shown before the apply modal.
// 5 items: display name, city, profile photo, craft/skill, 2 portfolio photos.
// Each item is a collapsible checklist row with an inline editor.
// After all 5 are met → soft nudge → callback to open apply modal.

import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, Modal, Pressable, ScrollView, TextInput,
    TouchableOpacity, ActivityIndicator, StyleSheet, Image,
    Animated,
} from 'react-native';
import { X, ChevronDown, Check, Camera, ArrowRight, Sparkles } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/stores/authStore';
import authService from '@/services/authService';
import { uploadMediaFlow } from '@/utils/upload';
import { usePickAndCrop } from '@/hooks/usePickAndCrop';
import MediaCropper from '@/components/media/MediaCropper';
import { GIG_MINIMUM_ITEMS, checkGigApplyMinimums } from '@/lib/gigApplyMinimums';
import type { MinimumItemId } from '@/lib/gigApplyMinimums';

const C = {
    canvas: '#121216',
    sheet: '#17171D',
    card: '#1a1a22',
    card2: '#1f1f28',
    orange: '#FF6B35',
    orangeDim: 'rgba(255,107,53,0.12)',
    orangeBorder: 'rgba(255,107,53,0.25)',
    green: '#22C55E',
    greenDim: 'rgba(34,197,94,0.12)',
    greenBorder: 'rgba(34,197,94,0.25)',
    t1: '#fff',
    t2: '#D4D4D8',
    t3: '#A1A1AA',
    t4: '#8B8B99',
    t5: '#5c5c66',
    t6: '#3a3a44',
    hair: 'rgba(255,255,255,0.07)',
    well: 'rgba(255,255,255,0.05)',
    wellb: 'rgba(255,255,255,0.08)',
    chip: 'rgba(255,255,255,0.06)',
    chipb: 'rgba(255,255,255,0.10)',
};

const F = {
    bold: 'Outfit-Bold',
    semi: 'Outfit-SemiBold',
    med: 'Outfit-Medium',
    reg: 'Outfit-Regular',
    mono: 'SpaceMono-Regular',
};

const INDIAN_CITIES = [
    'Pune', 'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata',
    'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Kochi', 'Indore', 'Bhopal',
    'Nagpur', 'Surat', 'Vadodara', 'Coimbatore', 'Visakhapatnam', 'Patna',
    'Guwahati', 'Thiruvananthapuram', 'Nashik', 'Aurangabad', 'Mysuru',
];

const SKILLS = [
    'Bharatanatyam', 'Kathak', 'Odissi', 'Kuchipudi', 'Manipuri', 'Mohiniyattam',
    'Bollywood', 'Hip Hop', 'Contemporary', 'Jazz', 'Ballet', 'Salsa', 'Freestyle',
    'Carnatic Vocal', 'Hindustani Vocal', 'Ghazal', 'Folk Songs', 'Playback',
    'Tabla', 'Mridangam', 'Violin', 'Flute', 'Harmonium', 'Guitar', 'Keyboard',
    'Classical', 'Folk', 'Street', 'Mime', 'Stand-up', 'Theatre', 'Improv',
    'Choreography', 'Direction', 'Production', 'Hosting / Emcee', 'DJ',
    'Beatboxing', 'Rap', 'Storytelling', 'Magic', 'Acrobatics',
];

interface ProfileMinimumGateSheetProps {
    visible: boolean;
    onClose: () => void;
    onMinimumsMet: () => void;
}

export const ProfileMinimumGateSheet: React.FC<ProfileMinimumGateSheetProps> = ({
    visible,
    onClose,
    onMinimumsMet,
}) => {
    const authUser = useAuthStore((s) => s.user) as any;
    const [expandedId, setExpandedId] = useState<MinimumItemId | null>(null);
    const [showNudge, setShowNudge] = useState(false);
    const { pickAndCrop, cropperProps } = usePickAndCrop();

    // Recompute which items are done from live user state
    const { missing } = checkGigApplyMinimums(authUser);
    const doneSet = new Set(
        GIG_MINIMUM_ITEMS.map((i) => i.id).filter((id) => !missing.includes(id))
    );

    const allDone = missing.length === 0;

    // Show nudge once all done
    useEffect(() => {
        if (allDone && visible && !showNudge) {
            setExpandedId(null);
            setShowNudge(true);
        }
    }, [allDone, visible]);

    // Reset on open
    useEffect(() => {
        if (visible) {
            setShowNudge(false);
            const firstMissing = GIG_MINIMUM_ITEMS.find((i) => !doneSet.has(i.id));
            setExpandedId(firstMissing?.id ?? null);
        }
    }, [visible]);

    const handleMinimumsMet = () => {
        onClose();
        onMinimumsMet();
    };

    // Sort: done items (ascending completion order) first faded, then missing items
    const sortedItems = [
        ...GIG_MINIMUM_ITEMS.filter((i) => doneSet.has(i.id)),
        ...GIG_MINIMUM_ITEMS.filter((i) => !doneSet.has(i.id)),
    ];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={s.overlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

                <View style={s.sheet}>
                    {/* Header */}
                    <View style={s.header}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.title}>Before you apply…</Text>
                            <Text style={s.subtitle}>Hirers take these 5 things seriously.</Text>
                        </View>
                        <Pressable onPress={onClose} style={s.closeBtn} hitSlop={12}>
                            <X size={18} color={C.t4} />
                        </Pressable>
                    </View>

                    <ScrollView
                        style={s.scroll}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Checklist */}
                        {!showNudge && (
                            <View style={{ position: 'relative' }}>
                                {sortedItems.map((item, idx) => {
                                    const done = doneSet.has(item.id);
                                    const isExpanded = expandedId === item.id;
                                    const opacity = done ? 0.4 + 0.1 * idx : 1;

                                    return (
                                        <View key={item.id} style={{ opacity }}>
                                            <ChecklistRow
                                                id={item.id}
                                                label={item.label}
                                                hint={item.hint}
                                                done={done}
                                                expanded={isExpanded}
                                                onToggle={() => {
                                                    if (done) return;
                                                    setExpandedId(isExpanded ? null : item.id);
                                                }}
                                            />

                                            {isExpanded && !done && (
                                                <FieldEditor
                                                    fieldId={item.id}
                                                    authUser={authUser}
                                                    pickAndCrop={pickAndCrop}
                                                    onSaved={() => {
                                                        const nextMissing = GIG_MINIMUM_ITEMS.find(
                                                            (i) => i.id !== item.id && !doneSet.has(i.id)
                                                        );
                                                        setExpandedId(nextMissing?.id ?? null);
                                                    }}
                                                />
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        {/* Soft nudge after all done */}
                        {showNudge && (
                            <NudgeCard
                                onApplyNow={handleMinimumsMet}
                                onCompleteProfile={() => {
                                    onClose();
                                    // Let the caller navigate to profile settings
                                }}
                            />
                        )}
                    </ScrollView>

                    {/* Sticky footer — only when nudge not shown */}
                    {!showNudge && (
                        <View style={s.footer}>
                            <Text style={s.footerNote}>
                                {missing.length} of 5 remaining
                            </Text>
                        </View>
                    )}
                </View>

                <MediaCropper {...cropperProps} />
            </View>
        </Modal>
    );
};

/* ─── ChecklistRow ─── */
const ChecklistRow = ({
    id, label, hint, done, expanded, onToggle,
}: {
    id: MinimumItemId; label: string; hint: string;
    done: boolean; expanded: boolean; onToggle: () => void;
}) => (
    <TouchableOpacity
        onPress={onToggle}
        activeOpacity={done ? 1 : 0.8}
        style={sr.row}
        disabled={done}
        accessibilityRole="button"
    >
        {/* Check circle */}
        <View style={[sr.circle, done ? sr.circleDone : sr.circleTodo]}>
            {done && <Check size={10} color={C.green} strokeWidth={2.5} />}
        </View>

        {/* Labels */}
        <View style={{ flex: 1 }}>
            <Text style={[sr.label, done && { color: C.t4 }]}>{label}</Text>
            <Text style={sr.hint}>{hint}</Text>
        </View>

        {/* Expand chevron */}
        {!done && (
            <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
                <ChevronDown size={16} color={C.t5} />
            </View>
        )}
    </TouchableOpacity>
);

const sr = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: C.hair,
    },
    circle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleDone: { backgroundColor: C.greenDim, borderWidth: 1, borderColor: C.greenBorder },
    circleTodo: { backgroundColor: C.card2, borderWidth: 1.5, borderColor: C.t6 },
    label: { fontFamily: F.semi, fontSize: 13.5, color: C.t2 },
    hint: { fontFamily: F.reg, fontSize: 11.5, color: C.t5, marginTop: 2 },
});

/* ─── NudgeCard ─── */
const NudgeCard = ({
    onApplyNow, onCompleteProfile,
}: {
    onApplyNow: () => void;
    onCompleteProfile: () => void;
}) => (
    <View style={sn.card}>
        <View style={sn.iconRow}>
            <View style={sn.iconRing}>
                <Sparkles size={22} color={C.orange} />
            </View>
        </View>
        <Text style={sn.title}>You're ready to apply!</Text>
        <Text style={sn.body}>
            Increase your chances drastically by completing your whole profile — hirers love seeing your full story.
        </Text>
        <TouchableOpacity onPress={onApplyNow} style={sn.primaryBtn} activeOpacity={0.88}>
            <Text style={sn.primaryTxt}>Apply now</Text>
            <ArrowRight size={15} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onCompleteProfile} style={sn.ghostBtn} activeOpacity={0.8}>
            <Text style={sn.ghostTxt}>Complete full profile first</Text>
        </TouchableOpacity>
    </View>
);

const sn = StyleSheet.create({
    card: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
    iconRow: { alignItems: 'center', marginBottom: 16 },
    iconRing: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: C.orangeDim,
        borderWidth: 1,
        borderColor: C.orangeBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: { fontFamily: F.bold, fontSize: 19, color: C.t1, textAlign: 'center', marginBottom: 10 },
    body: {
        fontFamily: F.reg,
        fontSize: 13.5,
        color: C.t4,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    primaryBtn: {
        height: 52,
        borderRadius: 15,
        backgroundColor: C.orange,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        marginBottom: 12,
        shadowColor: C.orange,
        shadowOpacity: 0.3,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 8,
    },
    primaryTxt: { fontFamily: F.bold, fontSize: 15, color: '#fff', letterSpacing: 0.2 },
    ghostBtn: {
        height: 46,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: C.wellb,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ghostTxt: { fontFamily: F.semi, fontSize: 13.5, color: C.t3 },
});

/* ─── FieldEditor ─── */
// Renders the appropriate inline editor for each field.
const FieldEditor = ({
    fieldId, authUser, pickAndCrop, onSaved,
}: {
    fieldId: MinimumItemId;
    authUser: any;
    pickAndCrop: (type: 'avatar') => Promise<ImagePicker.ImagePickerAsset | null>;
    onSaved: () => void;
}) => {
    switch (fieldId) {
        case 'displayName':
            return <DisplayNameEditor authUser={authUser} onSaved={onSaved} />;
        case 'city':
            return <CityEditor authUser={authUser} onSaved={onSaved} />;
        case 'photo':
            return <PhotoEditor authUser={authUser} pickAndCrop={pickAndCrop} onSaved={onSaved} />;
        case 'craft':
            return <CraftEditor authUser={authUser} onSaved={onSaved} />;
        case 'portfolio':
            return <PortfolioEditor authUser={authUser} onSaved={onSaved} />;
        default:
            return null;
    }
};

/* ─── Shared save helper ─── */
async function saveField(payload: Partial<any>) {
    const updatedUser = await authService.updateProfile(payload);
    const cur = useAuthStore.getState().user;
    if (cur) {
        useAuthStore.getState().setAuth({
            user: { ...cur, ...updatedUser },
            accessToken: useAuthStore.getState().accessToken || '',
        });
    }
    return updatedUser;
}

/* ─── DisplayNameEditor ─── */
const DisplayNameEditor = ({ authUser, onSaved }: { authUser: any; onSaved: () => void }) => {
    const [val, setVal] = useState(authUser?.displayName || '');
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const canSave = val.trim().length >= 2;

    const save = async () => {
        if (!canSave || saving) return;
        setSaving(true); setErr(null);
        try {
            await saveField({ displayName: val.trim() });
            onSaved();
        } catch (e: any) {
            setErr(e?.response?.data?.message || 'Could not save.');
        } finally { setSaving(false); }
    };

    return (
        <View style={fe.wrap}>
            <TextInput
                value={val}
                onChangeText={setVal}
                placeholder="Your name on NETSA"
                placeholderTextColor={C.t5}
                style={[fe.input, fe.inputFocus]}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={save}
            />
            {err && <Text style={fe.err}>{err}</Text>}
            <SaveRow canSave={canSave} saving={saving} onSave={save} />
        </View>
    );
};

/* ─── CityEditor ─── */
const CityEditor = ({ authUser, onSaved }: { authUser: any; onSaved: () => void }) => {
    const [query, setQuery] = useState('');
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const filtered = INDIAN_CITIES.filter((c) =>
        c.toLowerCase().startsWith(query.toLowerCase())
    ).slice(0, 8);
    const showAll = query.length === 0;
    const displayList = showAll ? INDIAN_CITIES.slice(0, 8) : filtered;

    const pick = async (city: string) => {
        setSaving(true); setErr(null);
        try {
            await saveField({ location: city });
            onSaved();
        } catch (e: any) {
            setErr(e?.response?.data?.message || 'Could not save.');
        } finally { setSaving(false); }
    };

    return (
        <View style={fe.wrap}>
            <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search city…"
                placeholderTextColor={C.t5}
                style={[fe.input, fe.inputFocus]}
                autoFocus
            />
            {err && <Text style={fe.err}>{err}</Text>}
            {saving && <ActivityIndicator color={C.orange} style={{ marginVertical: 10 }} />}
            {!saving && (
                <View style={fe.cityGrid}>
                    {displayList.map((city) => (
                        <TouchableOpacity
                            key={city}
                            onPress={() => pick(city)}
                            style={fe.cityChip}
                            activeOpacity={0.8}
                        >
                            <Text style={fe.cityChipTxt}>{city}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

/* ─── PhotoEditor ─── */
const PhotoEditor = ({
    authUser, pickAndCrop, onSaved,
}: {
    authUser: any;
    pickAndCrop: (type: 'avatar') => Promise<ImagePicker.ImagePickerAsset | null>;
    onSaved: () => void;
}) => {
    const [uploading, setUploading] = useState(false);
    const [pct, setPct] = useState(0);
    const [err, setErr] = useState<string | null>(null);
    const userId = authUser?._id || authUser?.id || '';

    const pick = async () => {
        const asset = await pickAndCrop('avatar');
        if (!asset) return;
        setUploading(true); setErr(null); setPct(0);
        try {
            const up = await uploadMediaFlow({
                asset,
                entityType: 'user',
                entityId: userId,
                purpose: 'avatar',
                onProgress: setPct,
            });
            if (!up.success || !up.url) { setErr(up.error || 'Upload failed.'); return; }
            await saveField({ profileImageUrl: up.url });
            onSaved();
        } catch (e: any) {
            setErr(e?.response?.data?.message || 'Upload failed.');
        } finally { setUploading(false); }
    };

    return (
        <View style={fe.wrap}>
            {authUser?.profileImageUrl && (
                <Image
                    source={{ uri: authUser.profileImageUrl }}
                    style={fe.photoPreview}
                />
            )}
            {err && <Text style={fe.err}>{err}</Text>}
            <TouchableOpacity
                onPress={pick}
                disabled={uploading}
                style={[fe.photoBtn, uploading && { opacity: 0.6 }]}
                activeOpacity={0.88}
            >
                {uploading ? (
                    <>
                        <ActivityIndicator color="#fff" />
                        {pct > 0 && <Text style={fe.photoBtnTxt}>{pct}%</Text>}
                    </>
                ) : (
                    <>
                        <Camera size={16} color="#fff" />
                        <Text style={fe.photoBtnTxt}>Choose from camera roll</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
};

/* ─── CraftEditor ─── */
const CraftEditor = ({ authUser, onSaved }: { authUser: any; onSaved: () => void }) => {
    const existing: string[] = Array.isArray(authUser?.skills) ? authUser.skills : [];
    const [selected, setSelected] = useState<string[]>(existing);
    const [query, setQuery] = useState('');
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const filtered = SKILLS.filter(
        (s) => s.toLowerCase().includes(query.toLowerCase()) && !selected.includes(s)
    ).slice(0, 6);
    const noMatch = query.trim().length > 0 && filtered.length === 0;
    const customEntry = query.trim().length > 0 && !SKILLS.some(
        (s) => s.toLowerCase() === query.toLowerCase()
    );

    const toggleSkill = (skill: string) => {
        setSelected((p) => p.includes(skill) ? p.filter((x) => x !== skill) : [...p, skill]);
        setQuery('');
    };

    const addCustom = () => {
        const v = query.trim();
        if (!v || selected.includes(v)) return;
        setSelected((p) => [...p, v]);
        setQuery('');
    };

    const save = async () => {
        if (!selected.length || saving) return;
        setSaving(true); setErr(null);
        try {
            await saveField({ skills: selected });
            onSaved();
        } catch (e: any) {
            setErr(e?.response?.data?.message || 'Could not save.');
        } finally { setSaving(false); }
    };

    const showDropdown = query.length > 0;

    return (
        <View style={fe.wrap}>
            {/* Selected chips */}
            {selected.length > 0 && (
                <View style={fe.chipRow}>
                    {selected.map((s) => (
                        <TouchableOpacity
                            key={s}
                            onPress={() => setSelected((p) => p.filter((x) => x !== s))}
                            style={fe.selChip}
                        >
                            <Text style={fe.selChipTxt}>{s}</Text>
                            <Text style={fe.selChipX}> ✕</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Connected search + dropdown */}
            <View style={[fe.craftBox, showDropdown && { borderColor: C.orange }]}>
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search or add a skill…"
                    placeholderTextColor={C.t5}
                    style={fe.craftInput}
                    autoFocus={selected.length === 0}
                />
                {showDropdown && (
                    <View style={fe.craftDrop}>
                        {customEntry && (
                            <TouchableOpacity
                                onPress={addCustom}
                                style={fe.craftDropCustom}
                            >
                                <Text style={fe.craftDropCustomTxt}>+ {query.trim()}</Text>
                            </TouchableOpacity>
                        )}
                        {filtered.map((skill) => (
                            <TouchableOpacity
                                key={skill}
                                onPress={() => toggleSkill(skill)}
                                style={fe.craftDropRow}
                            >
                                <Text style={fe.craftDropRowTxt}>{skill}</Text>
                            </TouchableOpacity>
                        ))}
                        {noMatch && !customEntry && (
                            <View style={fe.craftDropRow}>
                                <Text style={{ ...fe.craftDropRowTxt, color: C.t5, fontFamily: F.reg }}>
                                    No match — type a custom skill above
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </View>

            {err && <Text style={fe.err}>{err}</Text>}
            <SaveRow canSave={selected.length > 0} saving={saving} onSave={save} />
        </View>
    );
};

/* ─── PortfolioEditor ─── */
const PortfolioEditor = ({ authUser, onSaved }: { authUser: any; onSaved: () => void }) => {
    const [uploading, setUploading] = useState(false);
    const [pct, setPct] = useState(0);
    const [err, setErr] = useState<string | null>(null);
    const userId = authUser?._id || authUser?.id || '';
    const gallery: string[] = (authUser?.galleryUrls as string[] | undefined)?.filter(Boolean) ?? [];
    const done = gallery.length >= 2;

    const pick = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.85,
        });
        if (result.canceled) return;
        setUploading(true); setErr(null); setPct(0);
        try {
            const up = await uploadMediaFlow({
                asset: result.assets[0],
                entityType: 'user',
                entityId: userId,
                purpose: 'gallery',
                onProgress: setPct,
            });
            if (!up.success || !up.url) { setErr(up.error || 'Upload failed.'); return; }
            const newGallery = [...gallery.filter(Boolean), up.url];
            await saveField({ galleryUrls: newGallery });
            if (newGallery.length >= 2) onSaved();
        } catch (e: any) {
            setErr(e?.response?.data?.message || 'Upload failed.');
        } finally { setUploading(false); }
    };

    return (
        <View style={fe.wrap}>
            {/* 3-slot grid preview */}
            <View style={fe.portfolioGrid}>
                {[0, 1, 2].map((i) => (
                    <Pressable
                        key={i}
                        onPress={i === gallery.length && !uploading ? pick : undefined}
                        style={[
                            fe.portfolioSlot,
                            i < gallery.length && fe.portfolioSlotFilled,
                            i === gallery.length && fe.portfolioSlotTarget,
                        ]}
                    >
                        {gallery[i] ? (
                            <Image
                                source={{ uri: gallery[i] }}
                                style={{ width: '100%', height: '100%' }}
                            />
                        ) : uploading && i === gallery.length ? (
                            <View style={{ alignItems: 'center', gap: 4 }}>
                                <ActivityIndicator color={C.orange} />
                                {pct > 0 && <Text style={{ color: C.t4, fontSize: 11, fontFamily: F.med }}>{pct}%</Text>}
                            </View>
                        ) : (
                            <Text style={{ color: C.t6, fontSize: 20 }}>+</Text>
                        )}
                        {i < 2 && (
                            <View style={[fe.portfolioRequired, i < gallery.length && { opacity: 0 }]}>
                                <Text style={{ color: C.orange, fontSize: 8, fontFamily: F.semi }}>REQ</Text>
                            </View>
                        )}
                    </Pressable>
                ))}
            </View>

            <Text style={fe.portfolioHint}>
                {done
                    ? `${gallery.length} photo${gallery.length !== 1 ? 's' : ''} added — you're set`
                    : `${gallery.length}/2 required · tap the next slot to add`}
            </Text>
            {err && <Text style={fe.err}>{err}</Text>}

            {!done && !uploading && (
                <TouchableOpacity onPress={pick} style={fe.photoBtn} activeOpacity={0.88}>
                    <Camera size={16} color="#fff" />
                    <Text style={fe.photoBtnTxt}>Choose from camera roll</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

/* ─── SaveRow (shared footer for text/select fields) ─── */
const SaveRow = ({
    canSave, saving, onSave,
}: {
    canSave: boolean; saving: boolean; onSave: () => void;
}) => (
    <TouchableOpacity
        onPress={onSave}
        disabled={!canSave || saving}
        style={[fe.saveBtn, (!canSave || saving) && { opacity: 0.45 }]}
        activeOpacity={0.88}
    >
        {saving ? (
            <ActivityIndicator color="#fff" />
        ) : (
            <Text style={fe.saveTxt}>Save</Text>
        )}
    </TouchableOpacity>
);

/* ─── Shared editor styles ─── */
const fe = StyleSheet.create({
    wrap: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: C.card,
        borderBottomWidth: 1,
        borderBottomColor: C.hair,
    },
    input: {
        backgroundColor: C.card2,
        borderWidth: 1,
        borderColor: C.wellb,
        borderRadius: 11,
        paddingHorizontal: 13,
        paddingVertical: 11,
        fontFamily: F.reg,
        fontSize: 14,
        color: C.t1,
        marginBottom: 10,
    },
    inputFocus: { borderColor: C.orange },
    err: { fontFamily: F.reg, fontSize: 11.5, color: '#F0736B', marginBottom: 8 },
    saveBtn: {
        height: 46,
        borderRadius: 13,
        backgroundColor: C.orange,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    saveTxt: { fontFamily: F.bold, fontSize: 14.5, color: '#fff' },

    // City
    cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    cityChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: C.chipb,
        backgroundColor: C.chip,
    },
    cityChipTxt: { fontFamily: F.med, fontSize: 12.5, color: C.t2 },

    // Photo
    photoPreview: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: C.wellb,
    },
    photoBtn: {
        height: 50,
        borderRadius: 14,
        backgroundColor: C.orange,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 2,
    },
    photoBtnTxt: { fontFamily: F.bold, fontSize: 13.5, color: '#fff' },

    // Craft
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 10 },
    selChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: C.orangeDim,
        borderWidth: 1,
        borderColor: C.orangeBorder,
    },
    selChipTxt: { fontFamily: F.med, fontSize: 12, color: C.orange },
    selChipX: { fontFamily: F.med, fontSize: 12, color: C.orange },

    craftBox: {
        borderWidth: 1.5,
        borderColor: C.wellb,
        borderRadius: 11,
        overflow: 'hidden',
        marginBottom: 10,
    },
    craftInput: {
        paddingHorizontal: 13,
        paddingVertical: 11,
        backgroundColor: C.card2,
        fontFamily: F.reg,
        fontSize: 14,
        color: C.t1,
        borderBottomWidth: 1,
        borderBottomColor: C.hair,
    },
    craftDrop: { backgroundColor: C.card2 },
    craftDropCustom: {
        paddingHorizontal: 13,
        paddingVertical: 11,
        backgroundColor: C.orangeDim,
        borderBottomWidth: 1,
        borderBottomColor: C.hair,
    },
    craftDropCustomTxt: { fontFamily: F.semi, fontSize: 13, color: C.orange },
    craftDropRow: {
        paddingHorizontal: 13,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: C.hair,
    },
    craftDropRowTxt: { fontFamily: F.med, fontSize: 13, color: C.t2 },

    // Portfolio
    portfolioGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    portfolioSlot: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 10,
        backgroundColor: C.card2,
        borderWidth: 1,
        borderColor: C.wellb,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    portfolioSlotFilled: { borderColor: C.wellb },
    portfolioSlotTarget: { borderColor: C.orange, borderStyle: 'dashed' },
    portfolioRequired: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: C.orangeDim,
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    portfolioHint: {
        fontFamily: F.reg,
        fontSize: 12,
        color: C.t5,
        marginBottom: 10,
    },
});

/* ─── Sheet-level styles ─── */
const s = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.65)',
    },
    sheet: {
        backgroundColor: C.sheet,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderTopWidth: 1,
        borderColor: C.hair,
        maxHeight: '88%',
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 40,
        shadowOffset: { width: 0, height: -16 },
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: C.hair,
    },
    title: { fontFamily: F.bold, fontSize: 18, color: C.t1, letterSpacing: -0.3 },
    subtitle: { fontFamily: F.reg, fontSize: 12.5, color: C.t4, marginTop: 3 },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: C.well,
        borderWidth: 1,
        borderColor: C.hair,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scroll: { flex: 1 },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: C.hair,
        alignItems: 'center',
    },
    footerNote: { fontFamily: F.med, fontSize: 12, color: C.t5 },
});
