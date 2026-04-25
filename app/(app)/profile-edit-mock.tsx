// Mock route — Option C inline-edit experience.
// Self-contained, no backend, no store dependencies. Hardcoded sample data.
// Navigate to /profile-edit-mock to try it.

import React, { useState, useRef } from 'react';
import {
    ScrollView, View, Text, TextInput, Pressable, LayoutAnimation,
    Platform, UIManager, Image, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
    Edit3, Check, X, Plus, MapPin, Camera, Sparkles, Briefcase,
    User as UserIcon, FileText, Zap, Image as ImageIcon, ChevronDown,
} from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Brand palette (lifted from existing modal) ──
const P = {
    bg: '#0A0A10', surface: '#121018', surfaceLight: '#1A1824',
    border: 'rgba(255,255,255,0.06)',
    textPrimary: '#F0ECE6', textSecondary: '#8B8898', textMuted: '#4A4656',
    orange: '#F97316', gold: '#EAB308', pink: '#EC4899', cyan: '#06B6D4', green: '#34D399',
    danger: '#EF4444',
};

// ── Sample data ──
const SAMPLE_PROFILE = {
    fullName: 'Aarav Mehta',
    headline: 'Classical & contemporary fusion',
    location: 'Pune, Maharashtra',
    artistType: 'Dancer',
    bio: 'Bharatanatyam-trained performer blending classical roots with contemporary movement. 8 years on stage, 200+ shows across Maharashtra and Karnataka.',
    skills: ['Bharatanatyam', 'Kathak', 'Storytelling', 'Choreography'] as string[],
    experience: [
        { role: 'Lead Performer', projectName: 'Sangam Festival', org: 'Pune Arts', date: 'Dec 2024' },
        { role: 'Choreographer', projectName: 'Wedding showcase', org: 'Private', date: 'Oct 2024' },
    ],
    profileImageUrl: '',
    instagram: 'aaravdances',
};

type SectionId = 'identity' | 'bio' | 'skills' | 'experience' | 'media' | 'social' | 'org';

// ════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════
export default function ProfileEditMockC() {
    const [data, setData] = useState(SAMPLE_PROFILE);
    const [open, setOpen] = useState<SectionId | null>(null);
    const [savedFlash, setSavedFlash] = useState<SectionId | null>(null);

    const toggle = (id: SectionId) => {
        LayoutAnimation.configureNext({
            duration: 280,
            create: { type: 'easeInEaseOut', property: 'opacity' },
            update: { type: 'spring', springDamping: 0.85 },
            delete: { type: 'easeInEaseOut', property: 'opacity' },
        });
        setOpen(prev => (prev === id ? null : id));
    };

    const onSave = (id: SectionId) => {
        setSavedFlash(id);
        setTimeout(() => {
            setSavedFlash(null);
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setOpen(null);
        }, 900);
    };

    const update = (patch: Partial<typeof SAMPLE_PROFILE>) => setData(d => ({ ...d, ...patch }));

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: P.bg }} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                    <Text style={{ color: P.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>Mock · Option C</Text>
                    <Text style={{ color: P.textPrimary, fontSize: 22, fontWeight: '700', marginTop: 2 }}>Edit profile</Text>
                </View>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={16} color={P.orange} />
                </View>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 80 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">

                {/* ── PROFILE PREVIEW HERO ── */}
                <View style={{ alignItems: 'center', paddingVertical: 20, marginBottom: 20 }}>
                    <Pressable
                        onPress={() => toggle('media')}
                        style={({ pressed }) => ({
                            width: 96, height: 96, borderRadius: 24, padding: 3,
                            backgroundColor: P.orange,
                            opacity: pressed ? 0.85 : 1,
                            shadowColor: P.orange, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
                        })}>
                        <View style={{ flex: 1, borderRadius: 21, backgroundColor: P.bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {data.profileImageUrl
                                ? <Image source={{ uri: data.profileImageUrl }} style={{ width: '100%', height: '100%' }} />
                                : <Camera size={28} color={P.textMuted} />}
                        </View>
                    </Pressable>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: P.textPrimary, marginTop: 14 }}>{data.fullName}</Text>
                    <Text style={{ fontSize: 13, color: P.textSecondary, marginTop: 2 }}>{data.headline}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <MapPin size={11} color={P.textMuted} />
                        <Text style={{ fontSize: 12, color: P.textMuted }}>{data.location}</Text>
                    </View>
                </View>

                {/* ── INLINE-EDIT CARDS ── */}
                <Card
                    id="identity" icon={UserIcon} accent={P.orange}
                    title="Identity" preview={`${data.fullName} · ${data.artistType}`}
                    isOpen={open === 'identity'} flash={savedFlash === 'identity'}
                    onToggle={() => toggle('identity')} onSave={() => onSave('identity')}>
                    <Field label="Display name" value={data.fullName} onChange={v => update({ fullName: v })} />
                    <Field label="Headline" value={data.headline} onChange={v => update({ headline: v })} />
                    <Field label="Artist type" value={data.artistType} onChange={v => update({ artistType: v })} />
                    <Field label="Location" value={data.location} onChange={v => update({ location: v })} />
                </Card>

                <Card
                    id="bio" icon={FileText} accent={P.gold}
                    title="Bio" preview={data.bio.slice(0, 60) + (data.bio.length > 60 ? '…' : '')}
                    isOpen={open === 'bio'} flash={savedFlash === 'bio'}
                    onToggle={() => toggle('bio')} onSave={() => onSave('bio')}>
                    <Field label="Tell your story" value={data.bio} onChange={v => update({ bio: v })} multiline />
                </Card>

                <Card
                    id="skills" icon={Zap} accent={P.pink}
                    title="Skills" preview={`${data.skills.length} added`}
                    isOpen={open === 'skills'} flash={savedFlash === 'skills'}
                    onToggle={() => toggle('skills')} onSave={() => onSave('skills')}>
                    <SkillEditor skills={data.skills} onChange={(skills) => update({ skills })} />
                </Card>

                <Card
                    id="experience" icon={Briefcase} accent={P.cyan}
                    title="Experience" preview={`${data.experience.length} entries`}
                    isOpen={open === 'experience'} flash={savedFlash === 'experience'}
                    onToggle={() => toggle('experience')} onSave={() => onSave('experience')}>
                    <ExperienceEditor entries={data.experience} onChange={(experience) => update({ experience })} />
                </Card>

                <Card
                    id="media" icon={ImageIcon} accent={P.green}
                    title="Photo" preview={data.profileImageUrl ? 'Uploaded' : 'Tap to add'}
                    isOpen={open === 'media'} flash={savedFlash === 'media'}
                    onToggle={() => toggle('media')} onSave={() => onSave('media')}>
                    <Pressable
                        onPress={() => update({ profileImageUrl: 'https://placehold.co/200x200/F97316/fff?text=Aarav' })}
                        style={{
                            height: 140, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: `${P.green}40`,
                            backgroundColor: `${P.green}06`, alignItems: 'center', justifyContent: 'center', marginTop: 4, overflow: 'hidden',
                        }}>
                        {data.profileImageUrl
                            ? <Image source={{ uri: data.profileImageUrl }} style={{ width: '100%', height: '100%' }} />
                            : <>
                                <Camera size={24} color={P.green} />
                                <Text style={{ color: P.green, fontSize: 11, fontWeight: '700', marginTop: 6, letterSpacing: 1, textTransform: 'uppercase' }}>Tap to upload</Text>
                            </>}
                    </Pressable>
                </Card>

                {/* Hirer-context (always visible, marked optional) */}
                <View style={{ marginTop: 24, marginBottom: 8, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: P.border }} />
                    <Text style={{ color: P.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>For hirers · optional</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: P.border }} />
                </View>

                <Card
                    id="org" icon={Briefcase} accent={P.cyan}
                    title="Organization" preview="Add if you'll post gigs"
                    isOpen={open === 'org'} flash={savedFlash === 'org'} optional
                    onToggle={() => toggle('org')} onSave={() => onSave('org')}>
                    <Field label="Org name" value="" onChange={() => {}} placeholder="Your company / collective" />
                    <Field label="Website" value="" onChange={() => {}} placeholder="https://..." />
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
}

// ════════════════════════════════════════════════
//  CARD — collapsible inline-edit container
// ════════════════════════════════════════════════
function Card({
    id, icon: Icon, accent, title, preview, isOpen, flash, optional,
    onToggle, onSave, children,
}: {
    id: SectionId;
    icon: any;
    accent: string;
    title: string;
    preview: string;
    isOpen: boolean;
    flash: boolean;
    optional?: boolean;
    onToggle: () => void;
    onSave: () => void;
    children: React.ReactNode;
}) {
    const chevronRot = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.timing(chevronRot, {
            toValue: isOpen ? 1 : 0,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [isOpen]);

    const rotate = chevronRot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

    return (
        <View style={{
            marginBottom: 10,
            borderRadius: 16,
            backgroundColor: isOpen ? `${accent}08` : P.surface,
            borderWidth: 1,
            borderColor: isOpen ? `${accent}40` : P.border,
            overflow: 'hidden',
        }}>
            <Pressable onPress={onToggle} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: `${accent}14`, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={16} color={accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: P.textPrimary }}>{title}</Text>
                            {optional && <Text style={{ fontSize: 9, color: P.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '700' }}>optional</Text>}
                        </View>
                        <Text style={{ fontSize: 12, color: P.textSecondary, marginTop: 2 }} numberOfLines={1}>
                            {preview}
                        </Text>
                    </View>
                    <Animated.View style={{ transform: [{ rotate }] }}>
                        <ChevronDown size={18} color={P.textMuted} />
                    </Animated.View>
                </View>
            </Pressable>

            {isOpen && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
                    {children}
                    <Pressable
                        onPress={onSave}
                        style={({ pressed }) => ({
                            marginTop: 8,
                            paddingVertical: 13,
                            borderRadius: 12,
                            alignItems: 'center', justifyContent: 'center',
                            flexDirection: 'row', gap: 8,
                            backgroundColor: flash ? P.green : accent,
                            opacity: pressed ? 0.85 : 1,
                        })}>
                        {flash ? <Check size={16} color="#fff" /> : null}
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }}>
                            {flash ? 'Saved' : 'Save'}
                        </Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

// ════════════════════════════════════════════════
//  FIELD primitive (hoisted — fixes focus-loss bug)
// ════════════════════════════════════════════════
function Field({
    label, value, onChange, placeholder, multiline,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    multiline?: boolean;
}) {
    const [focused, setFocused] = useState(false);
    return (
        <View>
            <Text style={{ fontSize: 10, color: P.textSecondary, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{label}</Text>
            <TextInput
                value={value}
                onChangeText={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={placeholder}
                placeholderTextColor={P.textMuted}
                multiline={multiline}
                style={{
                    backgroundColor: P.surfaceLight,
                    borderWidth: 1,
                    borderColor: focused ? `${P.orange}80` : P.border,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: multiline ? 12 : 12,
                    color: P.textPrimary,
                    fontSize: 14,
                    minHeight: multiline ? 100 : undefined,
                    textAlignVertical: multiline ? 'top' : 'center',
                }}
            />
        </View>
    );
}

// ════════════════════════════════════════════════
//  SKILL editor — chips with add/remove
// ════════════════════════════════════════════════
function SkillEditor({ skills, onChange }: { skills: string[]; onChange: (s: string[]) => void }) {
    const [draft, setDraft] = useState('');
    const add = () => {
        const v = draft.trim();
        if (!v || skills.includes(v)) return;
        onChange([...skills, v]);
        setDraft('');
    };
    return (
        <View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {skills.map(s => (
                    <Pressable key={s} onPress={() => onChange(skills.filter(x => x !== s))}
                        style={({ pressed }) => ({
                            flexDirection: 'row', alignItems: 'center', gap: 6,
                            backgroundColor: `${P.pink}14`,
                            paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100,
                            borderWidth: 1, borderColor: `${P.pink}30`,
                            opacity: pressed ? 0.7 : 1,
                        })}>
                        <Text style={{ color: P.pink, fontSize: 12, fontWeight: '600' }}>{s}</Text>
                        <X size={11} color={P.pink} />
                    </Pressable>
                ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                    value={draft}
                    onChangeText={setDraft}
                    placeholder="Add a skill"
                    placeholderTextColor={P.textMuted}
                    onSubmitEditing={add}
                    returnKeyType="done"
                    style={{
                        flex: 1, backgroundColor: P.surfaceLight,
                        borderWidth: 1, borderColor: P.border, borderRadius: 12,
                        paddingHorizontal: 14, paddingVertical: 11, color: P.textPrimary, fontSize: 14,
                    }}
                />
                <Pressable onPress={add} style={({ pressed }) => ({
                    width: 44, height: 44, borderRadius: 12, backgroundColor: P.pink,
                    alignItems: 'center', justifyContent: 'center',
                    opacity: pressed ? 0.85 : 1,
                })}>
                    <Plus size={18} color="#fff" />
                </Pressable>
            </View>
        </View>
    );
}

// ════════════════════════════════════════════════
//  EXPERIENCE editor — minimal list
// ════════════════════════════════════════════════
function ExperienceEditor({
    entries, onChange,
}: {
    entries: typeof SAMPLE_PROFILE.experience;
    onChange: (e: typeof SAMPLE_PROFILE.experience) => void;
}) {
    const update = (i: number, patch: Partial<typeof entries[0]>) => {
        const next = [...entries];
        next[i] = { ...next[i], ...patch };
        onChange(next);
    };
    const remove = (i: number) => onChange(entries.filter((_, idx) => idx !== i));
    const add = () => onChange([...entries, { role: '', projectName: '', org: '', date: '' }]);

    return (
        <View style={{ gap: 10 }}>
            {entries.map((e, i) => (
                <View key={i} style={{
                    backgroundColor: `${P.cyan}06`,
                    borderWidth: 1, borderColor: `${P.cyan}20`,
                    borderRadius: 12, padding: 12, gap: 8,
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text style={{ fontSize: 11, color: P.cyan, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>Entry {i + 1}</Text>
                        <Pressable onPress={() => remove(i)} hitSlop={10}>
                            <X size={14} color={P.danger} />
                        </Pressable>
                    </View>
                    <Field label="Role" value={e.role} onChange={v => update(i, { role: v })} placeholder="Lead Dancer" />
                    <Field label="Project" value={e.projectName} onChange={v => update(i, { projectName: v })} placeholder="Sangam Festival" />
                    <Field label="Date" value={e.date} onChange={v => update(i, { date: v })} placeholder="Dec 2024" />
                </View>
            ))}
            <Pressable onPress={add} style={{
                paddingVertical: 14, borderRadius: 12,
                borderWidth: 1, borderStyle: 'dashed', borderColor: `${P.cyan}50`,
                backgroundColor: `${P.cyan}04`,
                alignItems: 'center', justifyContent: 'center',
                flexDirection: 'row', gap: 8,
            }}>
                <Plus size={14} color={P.cyan} />
                <Text style={{ color: P.cyan, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>Add experience</Text>
            </Pressable>
        </View>
    );
}
