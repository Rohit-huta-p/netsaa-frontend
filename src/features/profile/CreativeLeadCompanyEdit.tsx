/**
 * CreativeLeadCompanyEdit.tsx
 *
 * The Creative Lead = COMPANY profile EDITOR. The destination behind the owner's
 * "Edit profile" button on CreativeLeadProfile. A·Minimal (#121216) editorial shell
 * (serif section heads + ghost folio numerals + mono kickers + underline fields +
 * completion meter + sticky scrollspy tab bar), mirroring the locked mockup
 * DOCS/04-design/mockups/creative-lead-profile-edit.html.
 *
 * Replaces the generic /client/agency-profile form for CLs (agency-profile role-
 * branches to this). Two write targets:
 *   · Organizer fields (name, type, logo, bio, services, photos, website, years,
 *     team) → updateOrganizerProfile() → PATCH /organizers/me
 *   · User fields   (cover, city, Instagram, YouTube)
 *     → updateProfile() → PATCH /auth/me  (updateMe whitelists these)
 *
 * P1 tabs: Identity · About · Specialties · Productions · Links.
 * P2 (shown as "coming soon"): Team (no member schema), Billing (no fields),
 * plus the tagline field (no backend field yet). Cold-start safe — absent fields
 * just render empty.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    Image,
    ActivityIndicator,
    Alert,
    StyleSheet,
    type LayoutChangeEvent,
    type NativeSyntheticEvent,
    type NativeScrollEvent,
    type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import {
    X, Camera, Plus, Check, Trash2, MapPin, Globe, Instagram, Youtube, Clock,
} from 'lucide-react-native';

import authService from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { useOrganizer } from '@/hooks/useOrganizer';
import { userKeys } from '@/hooks/useUser';
import { usePickAndCrop } from '@/hooks/usePickAndCrop';
import MediaCropper from '@/components/media/MediaCropper';
import { uploadMediaFlow, validateMediaFile } from '@/utils/upload';
import { SearchableMultiSelect } from '@/components/inputs/SearchableMultiSelect';
import { CL_ORG_TYPES, normalizeOrgType } from '@/constants/orgTypes';

// ── A·Minimal palette (shared with CreativeLeadProfile / the app) ──
const C = {
    canvas: '#121216',
    card: '#1C1C23',
    well: '#212129',
    chip: '#24242E',
    chipB: '#3C3C47',
    hair: 'rgba(255,255,255,0.08)',
    hairSoft: 'rgba(255,255,255,0.06)',
    hair2: 'rgba(255,255,255,0.16)',
    cream: '#FFFFFF',
    t1: '#D4D4D8',
    t2: '#A1A1AA',
    t3: '#8B8B99',
    t4: '#6B6B78',
    orange: '#FF6B35',
    orangeDk: '#E85A28',
    orangeSoft: 'rgba(255,107,53,0.12)',
    green: '#22C55E',
    gold: '#F59E0B',
    red: '#F87171',
    ink: '#190B05',
};
const F = {
    serif: 'DMSerifDisplay_400Regular',
    mono: 'SpaceMono-Regular',
    body: 'Outfit-Regular',
    semi: 'Outfit-SemiBold',
    bold: 'Outfit-Bold',
};
// Type scale (mobile-tight — mirrors the mockup's --fs-* tokens).
const T = {
    serifLg: 24, serifMd: 19, body: 14, otype: 14, sm: 12.5,
    xs: 11.5, btn: 14, tab: 11, kicker: 10, label: 9.5, micro: 9, ghost: 66,
};

const BIO_MAX = 600;
const MAX_PHOTOS = 8;

// Curated specialty vocabulary for the Specialties multi-select. `services` is a
// free string[] on the Organizer; any stored value outside this list still shows
// as a chip (SearchableMultiSelect falls back to the raw value).
const SPECIALTY_OPTIONS = [
    'Sangeet', 'Bollywood', 'Contemporary', 'Classical', 'Folk', 'Choreography',
    'Corporate shows', 'Weddings', 'Live Music', 'DJ', 'Anchoring', 'Hosting',
    'Decor', 'Sound & Light', 'Production design', 'Event planning',
].map((v) => ({ value: v, label: v }));

const TABS = [
    { id: 'identity', label: 'Identity' },
    { id: 'about', label: 'About' },
    { id: 'specialties', label: 'Specialties' },
    { id: 'productions', label: 'Productions' },
    { id: 'team', label: 'Team' },
    { id: 'links', label: 'Links' },
    { id: 'billing', label: 'Billing' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export function CreativeLeadCompanyEdit() {
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();
    const user = useAuthStore((st) => st.user) as any;
    const userId = user?._id || '';
    const { organizer } = useOrganizer();
    const { pickAndCrop, cropperProps } = usePickAndCrop();

    // ── Form state ──
    const [logoUrl, setLogoUrl] = useState('');
    const [coverUrl, setCoverUrl] = useState('');
    const [name, setName] = useState('');
    const [orgType, setOrgType] = useState('');
    const [city, setCity] = useState('');
    const [bio, setBio] = useState('');
    const [years, setYears] = useState('');
    const [team, setTeam] = useState('');
    const [services, setServices] = useState<string[]>([]);
    const [photos, setPhotos] = useState<string[]>([]);
    const [website, setWebsite] = useState('');
    const [instagram, setInstagram] = useState('');
    const [youtube, setYoutube] = useState('');

    const [logoUploading, setLogoUploading] = useState(false);
    const [coverUploading, setCoverUploading] = useState(false);
    const [photosUploading, setPhotosUploading] = useState(0);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [dirty, setDirty] = useState(false);
    const [prefilled, setPrefilled] = useState(false);

    const uploading = logoUploading || coverUploading || photosUploading > 0;
    const mark = () => { if (!dirty) setDirty(true); };

    // Prefill once the organizer doc + user resolve (owner-only screen).
    useEffect(() => {
        if (prefilled || (!organizer && !user)) return;
        const o: any = organizer || {};
        setLogoUrl(o.logoUrl || '');
        setName(o.organizationName || user?.organizationName || user?.displayName || '');
        setOrgType(normalizeOrgType(o.organizerTypeCategory || user?.organizerTypeCategory));
        setBio(o.bio || '');
        setWebsite(o.organizationWebsite || '');
        setServices(Array.isArray(o.services) ? o.services : []);
        setPhotos(Array.isArray(o.photos) ? o.photos : []);
        setYears(o.yearsInBusiness != null ? String(o.yearsInBusiness) : '');
        setTeam(o.teamSize != null ? String(o.teamSize) : '');
        setCoverUrl(user?.coverImageUrl || '');
        setCity(user?.city || user?.primaryCity || user?.location || '');
        setInstagram(user?.instagramHandle || '');
        setYoutube(user?.youtubeUrl || '');
        setPrefilled(true);
    }, [organizer, user, prefilled]);

    // ── Scrollspy ──
    const scrollRef = useRef<ScrollView>(null);
    const tabsRef = useRef<ScrollView>(null);
    const sectionY = useRef<Record<string, number>>({});
    const tabX = useRef<Record<string, number>>({});
    const [activeTab, setActiveTab] = useState<TabId>('identity');

    const onSectionLayout = (id: TabId) => (e: LayoutChangeEvent) => {
        sectionY.current[id] = e.nativeEvent.layout.y;
    };
    const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = e.nativeEvent.contentOffset.y + 28;
        let current: TabId = TABS[0].id;
        for (const t of TABS) {
            const sy = sectionY.current[t.id];
            if (sy != null && sy <= y) current = t.id;
        }
        if (current !== activeTab) {
            setActiveTab(current);
            const x = tabX.current[current];
            if (x != null) tabsRef.current?.scrollTo({ x: Math.max(0, x - 16), animated: true });
        }
    };
    const goTo = (id: TabId) => {
        const y = sectionY.current[id];
        if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - 4), animated: true });
    };

    // ── Media ──
    const pickLogo = async () => {
        const asset = await pickAndCrop('logo');
        if (!asset) return;
        const v = validateMediaFile(asset as any, false);
        if (!v.valid) { Alert.alert('Invalid image', v.error); return; }
        setLogoUploading(true);
        const res = await uploadMediaFlow({ asset: asset as any, entityType: 'organizer', entityId: userId, purpose: 'logo' });
        setLogoUploading(false);
        if (res.success && res.url) { setLogoUrl(res.url); mark(); }
        else Alert.alert('Upload failed', res.error || 'Unknown error');
    };
    const pickCover = async () => {
        const asset = await pickAndCrop('cover');
        if (!asset) return;
        const v = validateMediaFile(asset as any, false);
        if (!v.valid) { Alert.alert('Invalid image', v.error); return; }
        setCoverUploading(true);
        const res = await uploadMediaFlow({ asset: asset as any, entityType: 'user', entityId: userId, purpose: 'banner' });
        setCoverUploading(false);
        if (res.success && res.url) { setCoverUrl(res.url); mark(); }
        else Alert.alert('Upload failed', res.error || 'Unknown error');
    };
    const pickPhoto = async () => {
        if (photos.length >= MAX_PHOTOS) return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.8,
        });
        if (result.canceled || !result.assets?.length) return;
        const asset = result.assets[0];
        const v = validateMediaFile(asset, false);
        if (!v.valid) { Alert.alert('Invalid image', v.error); return; }
        setPhotosUploading((n) => n + 1);
        const res = await uploadMediaFlow({ asset, entityType: 'organizer', entityId: userId, purpose: 'gallery' });
        setPhotosUploading((n) => Math.max(0, n - 1));
        if (res.success && res.url) { setPhotos((p) => [...p, res.url!].slice(0, MAX_PHOTOS)); mark(); }
        else Alert.alert('Upload failed', res.error || 'Unknown error');
    };
    const removePhoto = (idx: number) => { setPhotos((p) => p.filter((_, i) => i !== idx)); mark(); };
    const toggleService = (v: string) => {
        setServices((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
        mark();
    };

    // ── Completion meter ──
    const done: Record<TabId, boolean> = {
        identity: !!name.trim() && !!orgType,
        about: !!bio.trim(),
        specialties: services.length > 0,
        productions: photos.length > 0,
        team: false,      // P2
        links: !!website.trim() || !!instagram.trim(),
        billing: false,   // P2
    };
    const liveTabs: TabId[] = ['identity', 'about', 'specialties', 'productions', 'links'];
    const doneCount = liveTabs.filter((t) => done[t]).length;
    const pct = Math.round((doneCount / liveTabs.length) * 100);
    const left = liveTabs.length - doneCount;

    // ── Save ──
    const save = async () => {
        if (saving || uploading) return;
        setSaving(true); setError(''); setSaved(false);
        try {
            await authService.updateOrganizerProfile({
                organizationName: name.trim(),
                ...(orgType ? { organizerTypeCategory: orgType } : {}),
                logoUrl,
                organizationWebsite: website.trim(),
                bio: bio.trim(),
                services,
                photos,
                ...(years.trim() ? { yearsInBusiness: Number(years) } : {}),
                ...(team.trim() ? { teamSize: Number(team) } : {}),
            });
            const patch: any = {
                coverImageUrl: coverUrl || '',
                instagramHandle: instagram.trim(),
                youtubeUrl: youtube.trim(),
                location: city.trim(),
            };
            const updatedUser = await authService.updateProfile(patch);
            if (updatedUser) useAuthStore.setState({ user: updatedUser });
            queryClient.invalidateQueries({ queryKey: ['organizer', 'me'] });
            queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
            setSaved(true);
            setTimeout(() => router.back(), 650);
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Could not save. Try again.');
        } finally {
            setSaving(false);
        }
    };

    const confirmClose = () => {
        if (!dirty) { router.back(); return; }
        Alert.alert('Discard changes?', "This can't be undone.", [
            { text: 'Keep editing', style: 'cancel' },
            { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]);
    };

    const initial = (name.trim()[0] || 'M').toUpperCase();

    return (
        <View style={s.container}>
            {/* ═══ HEADER (pinned) ═══ */}
            <View style={[s.header, { paddingTop: insets.top + 10 }]}>
                <View style={s.headRow}>
                    <Text style={s.headTitle}>Edit company</Text>
                    <Pressable style={s.iconBtn} onPress={confirmClose} hitSlop={8}>
                        <X size={18} color={C.t1} />
                    </Pressable>
                </View>
                {/* completion meter */}
                <View style={s.meter}>
                    <Text style={s.meterMeta}><Text style={s.meterPct}>{pct}%</Text> complete</Text>
                    <View style={s.meterTrack}>
                        <LinearGradient
                            colors={[C.orange, C.gold]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={[s.meterFill, { width: `${Math.max(4, pct)}%` }]}
                        />
                    </View>
                    <Text style={s.meterMeta}>{left} left</Text>
                </View>
                {/* tab bar */}
                <ScrollView
                    ref={tabsRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.tabs}
                >
                    {TABS.map((t) => {
                        const active = activeTab === t.id;
                        return (
                            <Pressable
                                key={t.id}
                                onPress={() => goTo(t.id)}
                                onLayout={(e) => { tabX.current[t.id] = e.nativeEvent.layout.x; }}
                                style={[s.tab, active && s.tabActive]}
                            >
                                <Text style={[s.tabText, active && s.tabTextActive]}>{t.label}</Text>
                                <View style={[s.tdot, !done[t.id] && s.tdotEmpty]} />
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ═══ SCROLL BODY ═══ */}
            <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 160 }}
                onScroll={onScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* 01 · IDENTITY */}
                <View style={[s.section, s.sectionFirst]} onLayout={onSectionLayout('identity')}>
                    <SectionHead num="01" kicker="Identity" title="The masthead" note="How you show up to every artist and client — even a company of one." />

                    {/* cover + logo */}
                    <Pressable style={s.cover} onPress={pickCover} disabled={coverUploading}>
                        {coverUrl ? (
                            <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                        ) : (
                            <LinearGradient colors={['#3a2316', '#241a2a', '#0d0d14']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                        )}
                        <View style={s.coverChip}>
                            {coverUploading ? <ActivityIndicator size="small" color={C.cream} /> : <Camera size={13} color={C.cream} />}
                            <Text style={s.coverChipText}>{coverUrl ? 'Change cover' : 'Add cover'}</Text>
                        </View>
                    </Pressable>

                    <View style={s.logoWrap}>
                        <Pressable style={s.logoTile} onPress={pickLogo} disabled={logoUploading}>
                            {logoUploading ? (
                                <ActivityIndicator color={C.orange} />
                            ) : logoUrl ? (
                                <Image source={{ uri: logoUrl }} style={s.logoImg} />
                            ) : (
                                <Text style={s.logoInitial}>{initial}</Text>
                            )}
                        </Pressable>
                        <Pressable style={s.logoCam} onPress={pickLogo} hitSlop={6}>
                            <Camera size={13} color="#fff" />
                        </Pressable>
                    </View>

                    <Field label="Company name" value={name} onChangeText={(t) => { setName(t); mark(); }} placeholder="Your company name" />

                    <Text style={[s.fieldLabel, { marginTop: 4 }]}>Organisation type</Text>
                    <View style={s.otypes}>
                        {CL_ORG_TYPES.map((o) => {
                            const sel = orgType === o.value;
                            return (
                                <Pressable key={o.value} onPress={() => { setOrgType(o.value); mark(); }} style={[s.otype, sel && s.otypeSel]}>
                                    <Text style={[s.otypeText, sel && s.otypeTextSel]}>{o.label}</Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <Field label="Based in" value={city} onChangeText={(t) => { setCity(t); mark(); }} placeholder="City" icon={<MapPin size={16} color={C.t3} />} style={{ marginTop: 26 }} />

                    <Field
                        label="Tagline"
                        value=""
                        editable={false}
                        onChangeText={() => {}}
                        placeholder="Coming soon"
                        style={{ marginBottom: 2 }}
                    />
                    <Text style={s.hintTiny}>A one-line tagline is coming soon.</Text>
                </View>

                {/* 02 · ABOUT */}
                <View style={s.section} onLayout={onSectionLayout('about')}>
                    <SectionHead num="02" kicker="About" title="What you do" />
                    <Text style={s.fieldLabel}>Bio</Text>
                    <TextInput
                        value={bio}
                        onChangeText={(t) => { setBio(t.slice(0, BIO_MAX)); mark(); }}
                        placeholder="What your company does, who you work with, what makes you stand out…"
                        placeholderTextColor={C.t4}
                        multiline
                        style={s.bioInput}
                    />
                    <Text style={s.bioCount}>{bio.length} / {BIO_MAX}</Text>

                    <View style={s.row2}>
                        <View style={{ flex: 1 }}>
                            <Field label="Founded (yrs ago)" value={years} onChangeText={(t) => { setYears(t.replace(/[^0-9]/g, '')); mark(); }} placeholder="0" keyboardType="number-pad" noMargin />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Field label="Team size" value={team} onChangeText={(t) => { setTeam(t.replace(/[^0-9]/g, '')); mark(); }} placeholder="0" keyboardType="number-pad" noMargin />
                        </View>
                    </View>
                </View>

                {/* 03 · SPECIALTIES */}
                <View style={s.section} onLayout={onSectionLayout('specialties')}>
                    <SectionHead num="03" kicker="Specialties" title="What you're known for" />
                    <Text style={s.countLine}>{services.length} {services.length === 1 ? 'specialty' : 'specialties'}</Text>
                    <SearchableMultiSelect
                        selected={services}
                        options={SPECIALTY_OPTIONS}
                        onToggle={toggleService}
                        placeholder="Add specialties"
                        searchPlaceholder="Search or pick a specialty…"
                    />
                </View>

                {/* 04 · PRODUCTIONS */}
                <View style={s.section} onLayout={onSectionLayout('productions')}>
                    <SectionHead num="04" kicker="Productions" title="The showcase" note="Your best work, first. The top photo leads the Productions grid on your page." />
                    <View style={s.mediaLabel}>
                        <Text style={s.mediaLabelL}>Gallery</Text>
                        <Text style={s.mediaLabelC}>{photos.length}/{MAX_PHOTOS}</Text>
                    </View>
                    <View style={s.photoGrid}>
                        {photos.map((url, idx) => (
                            <View key={`${url}-${idx}`} style={s.photoTile}>
                                <Image source={{ uri: url }} style={StyleSheet.absoluteFill} />
                                {idx === 0 && <View style={s.featureTag}><Text style={s.featureTagText}>FEATURE</Text></View>}
                                <Pressable style={s.photoDel} onPress={() => removePhoto(idx)} hitSlop={6}>
                                    <Trash2 size={13} color={C.red} />
                                </Pressable>
                            </View>
                        ))}
                        {photos.length < MAX_PHOTOS && (
                            <Pressable style={s.addTile} onPress={pickPhoto} disabled={photosUploading > 0}>
                                {photosUploading > 0 ? <ActivityIndicator color={C.orange} /> : <Plus size={20} color={C.t3} />}
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* 05 · TEAM — P2 */}
                <View style={s.section} onLayout={onSectionLayout('team')}>
                    <SectionHead num="05" kicker="Team" title="Who's behind it" optional="Soon" />
                    <ComingSoon text="Invite your lead and crew so their work links back to your company. Coming soon." />
                </View>

                {/* 06 · LINKS */}
                <View style={s.section} onLayout={onSectionLayout('links')}>
                    <SectionHead num="06" kicker="Links" title="Elsewhere" />
                    <Field label="Website" value={website} onChangeText={(t) => { setWebsite(t); mark(); }} placeholder="yourcompany.in" autoCapitalize="none" keyboardType="url" icon={<Globe size={16} color={C.t3} />} />
                    <Field label="Instagram" value={instagram} onChangeText={(t) => { setInstagram(t); mark(); }} placeholder="@yourcompany" autoCapitalize="none" icon={<Instagram size={16} color={C.t3} />} />
                    <Field label="YouTube" value={youtube} onChangeText={(t) => { setYoutube(t); mark(); }} placeholder="Link your channel" autoCapitalize="none" keyboardType="url" icon={<Youtube size={16} color={C.t3} />} noMargin />
                </View>

                {/* 07 · BILLING — P2 */}
                <View style={s.section} onLayout={onSectionLayout('billing')}>
                    <SectionHead num="07" kicker="Billing" title="Billing details" optional="Soon" />
                    <ComingSoon text="GST and invoice details for the artists you hire — never shown on your public page. Coming soon." />
                </View>
            </ScrollView>

            {/* ═══ FOOTER (pinned) ═══ */}
            {!!error && <Text style={[s.error, { bottom: 64 + insets.bottom + 12 }]}>{error}</Text>}
            <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
                <Pressable style={[s.btn, s.btnGhost]} onPress={confirmClose}>
                    <Text style={s.btnGhostText}>Cancel</Text>
                </Pressable>
                <Pressable style={[s.btn, s.btnSave, (saving || uploading) && { opacity: 0.6 }]} onPress={save} disabled={saving || uploading}>
                    {saving ? (
                        <ActivityIndicator color={C.ink} />
                    ) : (
                        <Text style={s.btnSaveText}>{saved ? 'Saved ✓' : uploading ? 'Uploading…' : 'Save changes'}</Text>
                    )}
                </Pressable>
            </View>

            <MediaCropper {...cropperProps} />
        </View>
    );
}

export default CreativeLeadCompanyEdit;

// ── Building blocks ──
function SectionHead({ num, kicker, title, note, optional }: { num: string; kicker: string; title: string; note?: string; optional?: string }) {
    return (
        <View style={s.secHead}>
            <Text style={s.secNum}>{num}</Text>
            <View style={s.kicker}>
                <Text style={s.kickerText}>{num} / {kicker}</Text>
                {!!optional && <View style={s.pillOpt}><Text style={s.pillOptText}>{optional}</Text></View>}
            </View>
            <Text style={s.secTitle}>{title}</Text>
            {!!note && <Text style={s.secNote}>{note}</Text>}
        </View>
    );
}

type FieldProps = {
    label: string;
    icon?: React.ReactNode;
    noMargin?: boolean;
} & TextInputProps;
function Field({ label, icon, noMargin, style, ...input }: FieldProps) {
    return (
        <View style={[s.field, noMargin && { marginBottom: 0 }, style]}>
            <Text style={s.fieldLabel}>{label}</Text>
            <View style={s.fieldInputWrap}>
                <TextInput
                    placeholderTextColor={C.t4}
                    style={[s.fieldInput, input.editable === false && { color: C.t4 }]}
                    {...input}
                />
                {!!icon && <View style={s.fieldIc}>{icon}</View>}
            </View>
        </View>
    );
}

function ComingSoon({ text }: { text: string }) {
    return (
        <View style={s.soon}>
            <View style={s.soonIcon}><Clock size={15} color={C.t3} /></View>
            <Text style={s.soonText}>{text}</Text>
        </View>
    );
}

// ── Styles ──
const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.canvas },

    // header
    header: { paddingHorizontal: 22, borderBottomWidth: 1, borderBottomColor: C.hair, backgroundColor: C.canvas },
    headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 },
    headTitle: { fontFamily: F.serif, fontSize: T.serifMd, color: C.cream },
    iconBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: C.hair2, alignItems: 'center', justifyContent: 'center' },

    // completion meter
    meter: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 12 },
    meterMeta: { fontFamily: F.mono, fontSize: T.label, letterSpacing: 1.2, color: C.t3, textTransform: 'uppercase' },
    meterPct: { color: C.cream, fontFamily: F.bold },
    meterTrack: { flex: 1, height: 3, borderRadius: 99, backgroundColor: C.hair2, overflow: 'hidden' },
    meterFill: { height: '100%', borderRadius: 99 },

    // tab bar
    tabs: { gap: 20, paddingRight: 12 },
    tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: C.orange },
    tabText: { fontFamily: F.mono, fontSize: T.tab, letterSpacing: 1.6, textTransform: 'uppercase', color: C.t3 },
    tabTextActive: { color: C.cream },
    tdot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.orange },
    tdotEmpty: { backgroundColor: 'transparent', borderWidth: 1.2, borderColor: C.t4 },

    // section shell
    section: { paddingHorizontal: 22, paddingVertical: 34, borderTopWidth: 1, borderTopColor: C.hair },
    sectionFirst: { borderTopWidth: 0, paddingTop: 24 },
    secHead: { position: 'relative', marginBottom: 24 },
    secNum: { position: 'absolute', top: -18, right: -2, fontFamily: F.serif, fontSize: T.ghost, color: 'rgba(255,255,255,0.045)' },
    kicker: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 9 },
    kickerText: { fontFamily: F.mono, fontSize: T.kicker, letterSpacing: 2.4, textTransform: 'uppercase', color: C.orange },
    pillOpt: { borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
    pillOptText: { fontFamily: F.mono, fontSize: T.micro, letterSpacing: 1.4, textTransform: 'uppercase', color: C.gold },
    secTitle: { fontFamily: F.serif, fontSize: T.serifLg, color: C.cream, letterSpacing: -0.3, lineHeight: T.serifLg * 1.12 },
    secNote: { fontFamily: F.body, fontSize: T.xs, color: C.t3, lineHeight: 17, marginTop: 8, maxWidth: 320 },

    // underline fields
    field: { marginBottom: 22 },
    fieldLabel: { fontFamily: F.mono, fontSize: T.label, letterSpacing: 1.8, textTransform: 'uppercase', color: C.t3, marginBottom: 8 },
    fieldInputWrap: { position: 'relative', justifyContent: 'center' },
    fieldInput: { fontFamily: F.body, fontSize: T.body, color: C.cream, borderBottomWidth: 1, borderBottomColor: C.hair2, paddingVertical: 7, paddingRight: 26 },
    fieldIc: { position: 'absolute', right: 0, bottom: 8 },
    hintTiny: { fontFamily: F.body, fontSize: T.micro + 1, color: C.t4, marginTop: 6 },
    row2: { flexDirection: 'row', gap: 20, marginTop: 30 },

    // cover + logo
    cover: { height: 108, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.hair2, position: 'relative' },
    coverChip: { position: 'absolute', right: 9, bottom: 9, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(8,8,12,0.6)', borderWidth: 1, borderColor: C.hair2, borderRadius: 99, paddingHorizontal: 11, paddingVertical: 6 },
    coverChipText: { fontFamily: F.semi, fontSize: T.xs, color: C.cream },
    logoWrap: { width: 68, height: 68, marginTop: -32, marginLeft: 4, marginBottom: 16, position: 'relative' },
    logoTile: { width: 68, height: 68, borderRadius: 18, backgroundColor: '#2a1a12', borderWidth: 1, borderColor: C.hair2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    logoImg: { width: '100%', height: '100%' },
    logoInitial: { fontFamily: F.serif, fontSize: 26, color: C.cream },
    logoCam: { position: 'absolute', right: -5, bottom: -5, width: 26, height: 26, borderRadius: 13, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.canvas },

    // org types
    otypes: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 18, rowGap: 6 },
    otype: { paddingVertical: 5, borderBottomWidth: 1.5, borderBottomColor: 'transparent' },
    otypeSel: { borderBottomColor: C.orange },
    otypeText: { fontFamily: F.body, fontSize: T.otype, color: C.t3 },
    otypeTextSel: { color: C.orange, fontFamily: F.semi },

    // bio
    bioInput: { fontFamily: F.body, fontSize: T.body, color: C.cream, backgroundColor: C.well, borderWidth: 1, borderColor: C.hair, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, minHeight: 104, textAlignVertical: 'top' },
    bioCount: { fontFamily: F.mono, fontSize: T.label, color: C.t4, textAlign: 'right', marginTop: 6 },

    // specialties
    countLine: { fontFamily: F.mono, fontSize: T.tab, letterSpacing: 1.4, textTransform: 'uppercase', color: C.t3, marginBottom: 14 },

    // productions
    mediaLabel: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
    mediaLabelL: { fontFamily: F.mono, fontSize: T.label, letterSpacing: 1.8, textTransform: 'uppercase', color: C.t3 },
    mediaLabelC: { fontFamily: F.mono, fontSize: T.label, letterSpacing: 1, color: C.t4 },
    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    photoTile: { width: 96, height: 96, borderRadius: 12, overflow: 'hidden', backgroundColor: C.card, position: 'relative' },
    featureTag: { position: 'absolute', left: 6, top: 6, backgroundColor: 'rgba(8,8,12,0.66)', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
    featureTagText: { fontFamily: F.mono, fontSize: 7.5, letterSpacing: 1, color: C.cream },
    photoDel: { position: 'absolute', top: 5, right: 5, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
    addTile: { width: 96, height: 96, borderRadius: 12, borderWidth: 1, borderColor: C.hair2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },

    // coming soon
    soon: { flexDirection: 'row', gap: 12, backgroundColor: C.well, borderWidth: 1, borderColor: C.hair, borderRadius: 13, padding: 15 },
    soonIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center' },
    soonText: { flex: 1, fontFamily: F.body, fontSize: T.sm, color: C.t3, lineHeight: 19 },

    // footer
    error: { position: 'absolute', left: 22, right: 22, fontFamily: F.body, fontSize: T.sm, color: C.red, textAlign: 'center' },
    footer: { flexDirection: 'row', gap: 11, paddingHorizontal: 22, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.hair, backgroundColor: C.canvas },
    btn: { height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    btnGhost: { paddingHorizontal: 22, borderWidth: 1, borderColor: C.hair2 },
    btnGhostText: { fontFamily: F.semi, fontSize: T.btn, color: C.cream },
    btnSave: { flex: 1, backgroundColor: C.orange },
    btnSaveText: { fontFamily: F.bold, fontSize: T.btn, color: C.ink },
});
