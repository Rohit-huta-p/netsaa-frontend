import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Modal, ScrollView,
    Animated, Dimensions, KeyboardAvoidingView, Platform,
    ActivityIndicator, Image, Alert, Pressable,
} from 'react-native';
import {
    X, Check, ShieldCheck, Plus, Search, ChevronDown, ChevronUp, Trash2, Camera,
    Video as VideoIcon, Sparkles, User as UserIcon, FileText,
    Briefcase, Image as ImageIcon, Link2, Building2, CreditCard,
    Zap, Instagram, Youtube, Music, Headphones,
    Users, Home, Landmark, Tag,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { uploadMediaFlow, uploadVideoFlow, validateMediaFile, isLargeFile } from "@/utils/upload";
import { useProfileUiStore, SectionId } from '@/stores/profileUiStore';
import { useAuthStore } from '@/stores/authStore';
import authService from '@/services/authService';
import gigService from '@/services/gigService';
import mediaService from '@/services/mediaService';
import { ProfileData, ExperienceEntry, ProfileVideoReel } from '@/components/profile/types';
import { AITextInput } from '@/components/ui/AITextInput';
import { Field, Input, MiniField, P } from './edit/EditModalPrimitives';
import { EditModalToast, type ToastState } from './edit/EditModalToast';
import { EditModalTabBar } from './edit/EditModalTabBar';
import { BioComposer } from './edit/BioComposer';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SKILL_OPTIONS = [
    'Contemporary', 'Kathak', 'Hip Hop', 'Jazz', 'Classical',
    'Folk', 'Ballet', 'Salsa', 'Storytelling', 'Choreography',
    'Beatboxing', 'Freestyle', 'Improv', 'Voice Acting', 'Emceeing',
];
const SKIN_TONES = [
    { label: 'Fair', hex: '#fcd9b8' }, { label: 'Light', hex: '#f0cbb0' },
    { label: 'Medium', hex: '#dcb084' }, { label: 'Olive', hex: '#c29367' },
    { label: 'Tan', hex: '#a57245' }, { label: 'Brown', hex: '#7b4b2a' },
    { label: 'Dark', hex: '#4b2a1a' },
];
const HEIGHT_OPTIONS = Array.from({ length: 37 }, (_, i) => {
    const feet = Math.floor(i / 12) + 4; const inches = i % 12;
    return `${feet}'${inches}"`;
});

// ── Tab definitions ──
type TabKey = 'verify' | 'header' | 'about' | 'identity' | 'experience' | 'media' | 'socials' | 'organization' | 'billing';
interface TabDef {
    key: TabKey;
    label: string;
    icon: any;
    color: string;
    gradient: [string, string];
    optional?: boolean;
    checkComplete: (d: ProfileData) => boolean;
}

// Single accent for every section — one color carries "you're editing here",
// state colors (green/gold/red) stay reserved for actual meaning.
const TABS: TabDef[] = [
    // Leftmost tab. TABS is module-scope (no live authStore access), so
    // checkComplete here is a static placeholder — the real "email verified"
    // read happens at the EditModalTabBar call site below via the component's
    // `emailVerified` state, which overrides this for the 'verify' key.
    { key: 'verify', label: 'Verify', icon: ShieldCheck, color: P.orange, gradient: [P.orange, P.orange],
        checkComplete: () => false },
    { key: 'header', label: 'Basic', icon: UserIcon, color: P.orange, gradient: [P.orange, P.orange],
        checkComplete: (d) => !!(d.fullName && d.location && d.artistType) },
    { key: 'about', label: 'Bio', icon: FileText, color: P.orange, gradient: [P.orange, P.orange],
        checkComplete: (d) => !!(d.bio && d.bio.length >= 50) },
    { key: 'identity', label: 'Skills', icon: Zap, color: P.orange, gradient: [P.orange, P.orange],
        checkComplete: (d) => d.skills.length >= 1 },
    { key: 'experience', label: 'Experience', icon: Briefcase, color: P.orange, gradient: [P.orange, P.orange],
        checkComplete: (d) => d.experience.length >= 1 },
    { key: 'media', label: 'Media', icon: ImageIcon, color: P.orange, gradient: [P.orange, P.orange],
        checkComplete: (d) => !!(d.profileImageUrl || (d.galleryUrls && d.galleryUrls.filter(Boolean).length >= 1)) },
    { key: 'socials', label: 'Social', icon: Link2, color: P.orange, gradient: [P.orange, P.orange],
        checkComplete: (d) => !!(d.instagramHandle || d.youtubeUrl) },
    { key: 'organization', label: 'Org', icon: Building2, color: P.orange, gradient: [P.orange, P.orange],
        optional: true, checkComplete: (d) => !!(d.organizationName) },
    { key: 'billing', label: 'Billing', icon: CreditCard, color: P.orange, gradient: [P.orange, P.orange],
        optional: true, checkComplete: () => false },
];

const SECTION_TO_TAB: Record<string, TabKey> = {
    verify: 'verify', header: 'header', basic: 'about', about: 'about', identity: 'identity',
    experience: 'experience', media: 'media', socials: 'socials',
    organization: 'organization', contact: 'organization',
};

type Props = { profileData: ProfileData };

// ══════════════════════════════════════════
//  BOTTOM-SHEET PICKERS (Height + Skill)
// ══════════════════════════════════════════
function HeightPickerSheet({
    visible, value, onSelect, onClose,
}: {
    visible: boolean;
    value: string;
    onSelect: (v: string) => void;
    onClose: () => void;
}) {
    const [search, setSearch] = useState('');
    const filtered = HEIGHT_OPTIONS.filter(h => h.includes(search));
    if (!visible) return null;
    return (
        <Modal visible transparent animationType="fade" onRequestClose={onClose}>
            <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <Pressable onPress={() => {}} style={{ backgroundColor: P.surfaceLight, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, paddingBottom: 28, maxHeight: '60%' }}>
                    <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', marginBottom: 12 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: P.border, paddingHorizontal: 16, paddingVertical: 10 }}>
                        <Search size={14} color={P.textSecondary} />
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Search height"
                            placeholderTextColor={P.textMuted}
                            style={{ flex: 1, marginLeft: 8, color: P.textPrimary, fontFamily: 'Outfit-Regular', fontSize: 14 }}
                            autoFocus
                        />
                    </View>
                    <ScrollView keyboardShouldPersistTaps="handled">
                        {filtered.map(opt => (
                            <TouchableOpacity
                                key={opt}
                                onPress={() => { onSelect(opt); onClose(); }}
                                style={{ paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: P.border }}>
                                <Text style={{ color: value === opt ? P.orange : P.textPrimary, fontFamily: value === opt ? 'Outfit-Bold' : 'Outfit-Regular', fontSize: 14 }}>
                                    {opt}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

function SkillSearchSheet({
    visible, selected, onToggle, onClose,
}: {
    visible: boolean;
    selected: string[];
    onToggle: (skill: string) => void;
    onClose: () => void;
}) {
    const [search, setSearch] = useState('');
    if (!visible) return null;
    const filtered = SKILL_OPTIONS.filter(s => s.toLowerCase().includes(search.toLowerCase()) && !selected.includes(s));
    const exactMatch = SKILL_OPTIONS.find(s => s.toLowerCase() === search.toLowerCase());
    const trimmed = search.trim();
    return (
        <Modal visible transparent animationType="fade" onRequestClose={onClose}>
            <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <Pressable onPress={() => {}} style={{ backgroundColor: P.surfaceLight, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, paddingBottom: 28, maxHeight: '60%' }}>
                    <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', marginBottom: 12 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: P.border, paddingHorizontal: 16, paddingVertical: 10 }}>
                        <Search size={14} color={P.orange} />
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Search or add skill"
                            placeholderTextColor={P.textMuted}
                            style={{ flex: 1, marginLeft: 8, color: P.textPrimary, fontFamily: 'Outfit-Regular', fontSize: 14 }}
                            autoFocus
                        />
                    </View>
                    <ScrollView keyboardShouldPersistTaps="handled">
                        {!exactMatch && trimmed.length > 0 && (
                            <TouchableOpacity
                                onPress={() => { onToggle(trimmed); onClose(); }}
                                style={{ paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: P.border, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Plus size={14} color={P.orange} />
                                <Text style={{ color: P.orange, fontFamily: 'Outfit-Bold', fontSize: 12, textTransform: 'uppercase' }}>
                                    Add "{trimmed}"
                                </Text>
                            </TouchableOpacity>
                        )}
                        {filtered.map(skill => (
                            <TouchableOpacity
                                key={skill}
                                onPress={() => { onToggle(skill); onClose(); }}
                                style={{ paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: P.border }}>
                                <Text style={{ color: P.textPrimary, fontFamily: 'Outfit-SemiBold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    {skill}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

// ══════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════
export const ProfileEditModal: React.FC<Props> = ({ profileData }) => {
    const { activeSheet, closeSheet, highlightMissing } = useProfileUiStore();
    const { user, setAuth, accessToken } = useAuthStore();
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const section = activeSheet;
    const isVisible = !!section;
    const initialTab = section ? (SECTION_TO_TAB[section] || 'header') : 'header';
    const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

    // ── Scrollspy: one long form, the active tab follows the section in view ──
    const SCROLL_ANCHOR = 90; // px line below the tab bar that marks the "active" section
    const scrollRef = useRef<ScrollView>(null);
    const sectionOffsets = useRef<Partial<Record<TabKey, number>>>({});
    const pendingScrollTab = useRef<TabKey | null>(null);
    const programmaticScroll = useRef(false);
    const programmaticTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Capture each section's y-offset within the scroll content as it lays out.
    // If the modal was opened targeting this section, jump to it once measured.
    const onSectionLayout = (k: TabKey) => (e: any) => {
        const y = e.nativeEvent.layout.y;
        sectionOffsets.current[k] = y;
        if (pendingScrollTab.current === k) {
            pendingScrollTab.current = null;
            programmaticScroll.current = true;
            requestAnimationFrame(() => {
                scrollRef.current?.scrollTo({ y: Math.max(0, y - SCROLL_ANCHOR + 1), animated: false });
            });
            setTimeout(() => { programmaticScroll.current = false; }, 300);
        }
    };

    // Tab tap → smooth-scroll to that section (inverse of the scrollspy).
    const scrollToSection = (k: TabKey) => {
        const off = sectionOffsets.current[k];
        if (off == null) return;
        programmaticScroll.current = true;
        setActiveTab(k); // optimistic; scrollspy is suppressed mid-animation
        scrollRef.current?.scrollTo({ y: Math.max(0, off - SCROLL_ANCHOR + 1), animated: true });
        if (programmaticTimer.current) clearTimeout(programmaticTimer.current);
        programmaticTimer.current = setTimeout(() => { programmaticScroll.current = false; }, 500);
    };

    const handleTabPress = (k: TabKey) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        scrollToSection(k);
    };

    // Scrollspy: active tab = last section whose top has crossed the anchor line.
    const handleScroll = (e: any) => {
        if (programmaticScroll.current) return;
        const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
        const y = contentOffset.y;
        let current: TabKey = TABS[0].key;
        for (const t of TABS) {
            const off = sectionOffsets.current[t.key];
            if (off != null && off - SCROLL_ANCHOR <= y) current = t.key;
        }
        // Bottom guard: short trailing sections can't push their top to the anchor line.
        if (contentSize.height - y - layoutMeasurement.height < 4) {
            current = TABS[TABS.length - 1].key;
        }
        if (current !== activeTab) setActiveTab(current);
    };

    const [isSaving, setIsSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());

    // ── Form State (all 49 hooks — unchanged) ──
    const [displayName, setDisplayName] = useState('');
    const [headline, setHeadline] = useState('');
    const [artistType, setArtistType] = useState('');
    const [location, setLocation] = useState('');
    const [availability, setAvailability] = useState<'' | 'available' | 'busy' | 'tentative'>('');
    const [orgName, setOrgName] = useState('');
    const [bio, setBio] = useState('');
    const [age, setAge] = useState('');
    const [height, setHeight] = useState('');
    const [showHeightDropdown, setShowHeightDropdown] = useState(false);
    const [skinTone, setSkinTone] = useState('');
    const [skinToneHex, setSkinToneHex] = useState('');
    const [skills, setSkills] = useState<string[]>([]);
    const [showSkillDropdown, setShowSkillDropdown] = useState(false);
    const [socials, setSocials] = useState({ instagramHandle: '', youtubeUrl: '', spotifyUrl: '', soundcloudUrl: '' });
    const [orgType, setOrgType] = useState('');
    const [orgWebsite, setOrgWebsite] = useState('');
    const [legalBusinessName, setLegalBusinessName] = useState('');
    const [gstNumber, setGstNumber] = useState('');
    const [billingAddress, setBillingAddress] = useState('');
    const [billingState, setBillingState] = useState('');
    const [pincode, setPincode] = useState('');
    const [country, setCountry] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const [galleryUrls, setGalleryUrls] = useState<string[]>(['', '', '', '', '']);
    const [videoReels, setVideoReels] = useState<ProfileVideoReel[]>([]);
    const [uploadingState, setUploadingState] = useState<any>({});
    const [experience, setExperience] = useState<ExperienceEntry[]>([]);

    const [dirtyTabs, setDirtyTabs] = useState<Set<TabKey>>(new Set());
    const [discardPromptVisible, setDiscardPromptVisible] = useState(false);
    const [toast, setToast] = useState<ToastState>(null);
    const markDirty = (tab: TabKey) => setDirtyTabs(prev => {
        if (prev.has(tab)) return prev;
        const next = new Set(prev);
        next.add(tab);
        return next;
    });

    // ── Verify tab state (email add → 6-digit code → verified) ──
    const [verifyEmail, setVerifyEmail] = useState('');
    const [verifyStage, setVerifyStage] = useState<'idle' | 'code'>('idle');
    const [verifyCode, setVerifyCode] = useState('');
    const [verifyBusy, setVerifyBusy] = useState(false);
    const emailVerified = !!(user as any)?.emailVerifiedAt;

    const visibleTabs = TABS;

    // ── Reset form (unchanged) ──
    useEffect(() => {
        if (!isVisible) return;
        const tab = section ? (SECTION_TO_TAB[section] || 'header') : 'header';
        setActiveTab(tab); setJustSaved(false); setExpandedEntries(new Set()); setDirtyTabs(new Set());
        setDiscardPromptVisible(false);
        // Long-scroll: forget old offsets and queue a jump to the requested section.
        sectionOffsets.current = {};
        pendingScrollTab.current = tab !== 'header' ? tab : null;
        programmaticScroll.current = tab !== 'header';
        // Fallback in case the target's onLayout fired before this effect ran.
        if (tab !== 'header') {
            setTimeout(() => {
                const off = sectionOffsets.current[tab];
                if (pendingScrollTab.current === tab && off != null) {
                    pendingScrollTab.current = null;
                    scrollRef.current?.scrollTo({ y: Math.max(0, off - SCROLL_ANCHOR + 1), animated: false });
                    setTimeout(() => { programmaticScroll.current = false; }, 200);
                }
            }, 160);
        }
        setDisplayName(profileData.fullName || ''); setHeadline(profileData.headline || '');
        setArtistType(profileData.artistType || ''); setLocation(profileData.location || '');
        setAvailability((profileData.availability as any) || '');
        setOrgName(profileData.organizationName || ''); setBio(profileData.bio || '');
        setAge(profileData.age || ''); setHeight(profileData.height || '');
        setShowHeightDropdown(false);
        setSkinTone(profileData.skinTone || ''); setSkinToneHex(profileData.skinToneHex || '');
        setSkills(profileData.skills || []); setShowSkillDropdown(false);
        setSocials({ instagramHandle: profileData.instagramHandle || '', youtubeUrl: profileData.youtubeUrl || '', spotifyUrl: profileData.spotifyUrl || '', soundcloudUrl: profileData.soundcloudUrl || '' });
        setOrgType(profileData.organizerTypeCategory || 'individual'); setOrgWebsite(profileData.organizationWebsite || '');
        setProfileImageUrl(profileData.profileImageUrl || '');
        setGalleryUrls([...(profileData.galleryUrls || []), '', '', '', '', ''].slice(0, 5));
        setVideoReels((profileData.videoReels || []).slice(0, 3));
        setUploadingState({});
        setExperience(profileData.experience ? JSON.parse(JSON.stringify(profileData.experience)) : []);
        // @ts-ignore
        setLegalBusinessName(profileData.billingDetails?.legalBusinessName || '');
        // @ts-ignore
        setGstNumber(profileData.billingDetails?.gstNumber || '');
        // @ts-ignore
        setBillingAddress(profileData.billingDetails?.billingAddress || '');
        // @ts-ignore
        setBillingState(profileData.billingDetails?.state || '');
        // @ts-ignore
        setPincode(profileData.billingDetails?.pincode || '');
        // @ts-ignore
        setCountry(profileData.billingDetails?.country || '');
    }, [isVisible, section]);

    // ── Animation (unchanged) ──
    useEffect(() => {
        if (isVisible) { Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 180 }).start(); }
        else { slideAnim.setValue(SCREEN_HEIGHT); }
    }, [isVisible]);

    // ── Video reel status poll — mirrors Step6Media's Mux polling pattern ──
    useEffect(() => {
        const processing = videoReels.filter(r => r.status === 'processing' && r.uploadId);
        if (processing.length === 0) return;
        const t = setInterval(async () => {
            for (const r of processing) {
                try {
                    const res = await mediaService.getAssetStatus(r.uploadId!);
                    const s = res.data.status;
                    if (s === 'ready' || s === 'errored') {
                        setVideoReels(prev => prev.map(x => {
                            if (x.uploadId !== r.uploadId) return x;
                            return {
                                ...x,
                                status: s === 'ready' ? 'ready' as const : 'errored' as const,
                                muxPlaybackId: (res.data as any).playbackId || x.muxPlaybackId,
                                thumbnailUrl: (res.data as any).playbackId ? `https://image.mux.com/${(res.data as any).playbackId}/thumbnail.jpg?time=1` : x.thumbnailUrl,
                                duration: (res.data as any).duration ?? x.duration,
                                aspectRatio: (res.data as any).aspectRatio ?? x.aspectRatio,
                            };
                        }));
                    }
                } catch { /* keep polling */ }
            }
        }, 4000);
        return () => clearInterval(t);
    }, [videoReels]);

    const handleClose = () => {
        if (discardPromptVisible) {
            setDiscardPromptVisible(false);
            return;
        }
        if (dirtyTabs.size > 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            setDiscardPromptVisible(true);
            return;
        }
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 200, useNativeDriver: true })
            .start(() => closeSheet());
    };

    const handleConfirmDiscard = () => {
        setDiscardPromptVisible(false);
        setDirtyTabs(new Set());
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 200, useNativeDriver: true })
            .start(() => closeSheet());
    };

    const handleKeepEditing = () => setDiscardPromptVisible(false);

    // ── Save logic — single Save fans out to two endpoints in parallel ──
    const handleSaveAll = async () => {
        if (!user) return;
        if (dirtyTabs.has('experience')) {
            const missingDateIndex = experience.findIndex(exp => !exp.date?.trim());
            if (missingDateIndex !== -1) {
                Alert.alert('Missing Date', `Please enter a Date for Entry ${missingDateIndex + 1}.`);
                return;
            }
        }

        setIsSaving(true);

        // Compose payloads from dirty tabs
        const artistPayload: any = {};
        const organizerPayload: any = {};

        if (dirtyTabs.has('header')) {
            Object.assign(artistPayload, { displayName, headline, artistType, location, availability });
        }
        if (dirtyTabs.has('about')) {
            Object.assign(artistPayload, { bio, age, height, skinTone, skinToneHex });
        }
        if (dirtyTabs.has('identity')) {
            Object.assign(artistPayload, { skills });
        }
        if (dirtyTabs.has('experience')) {
            Object.assign(artistPayload, { experience });
        }
        if (dirtyTabs.has('media')) {
            Object.assign(artistPayload, {
                profileImageUrl,
                galleryUrls: galleryUrls.filter(Boolean),
                videoReels,
                hasPhotos: galleryUrls.some(Boolean) || !!profileImageUrl,
            });
        }
        if (dirtyTabs.has('socials')) {
            Object.assign(artistPayload, { ...socials });
        }
        if (dirtyTabs.has('organization')) {
            Object.assign(organizerPayload, {
                organizationName: orgName,
                organizerTypeCategory: orgType,
                organizationWebsite: orgWebsite,
            });
        }
        if (dirtyTabs.has('billing')) {
            Object.assign(organizerPayload, {
                billingDetails: { legalBusinessName, gstNumber, billingAddress, state: billingState, pincode, country },
            });
        }

        try {
            // Track index of each task so we can match results back to which endpoint
            // they came from. Order: [artist?, organizer?] — depending on which has work.
            const tasks: Array<Promise<any>> = [];
            let artistTaskIndex = -1;
            let organizerTaskIndex = -1;
            if (Object.keys(artistPayload).length > 0) {
                artistTaskIndex = tasks.length;
                tasks.push(authService.updateProfile(artistPayload));
            }
            if (Object.keys(organizerPayload).length > 0) {
                organizerTaskIndex = tasks.length;
                tasks.push(authService.updateOrganizer(organizerPayload));
            }

            const results = await Promise.allSettled(tasks);
            // Identify which task(s) rejected by index — we know exactly which endpoint
            // each was. Group dirty tabs into artist-side and organizer-side, label the
            // failed group(s).
            const ARTIST_TAB_KEYS: TabKey[] = ['header', 'about', 'identity', 'experience', 'media', 'socials'];
            const ORGANIZER_TAB_KEYS: TabKey[] = ['organization', 'billing'];
            const failedKeys: TabKey[] = [];
            if (artistTaskIndex !== -1 && results[artistTaskIndex]?.status === 'rejected') {
                failedKeys.push(...ARTIST_TAB_KEYS.filter(k => dirtyTabs.has(k)));
            }
            if (organizerTaskIndex !== -1 && results[organizerTaskIndex]?.status === 'rejected') {
                failedKeys.push(...ORGANIZER_TAB_KEYS.filter(k => dirtyTabs.has(k)));
            }
            if (failedKeys.length > 0) {
                const failedTabNames = visibleTabs
                    .filter(t => failedKeys.includes(t.key))
                    .map(t => t.label)
                    .join(', ');
                setToast({ visible: true, variant: 'error', message: `Couldn't save ${failedTabNames}` });
                return;
            }

            // Merge successful results into authStore. Artist result spreads at the
            // top level (matches how /auth/me responses have always been merged).
            // Organizer result lands under user.organizerDetails — preserves the
            // shape that downstream consumers (mapUserToProfileData, ProfileScreen)
            // already read from. Spreading the Organizer doc at the top level
            // would clobber user._id with the organizer doc's own _id.
            const merged: any = { ...user };
            if (artistTaskIndex !== -1 && results[artistTaskIndex].status === 'fulfilled') {
                Object.assign(merged, (results[artistTaskIndex] as PromiseFulfilledResult<any>).value);
            }
            if (organizerTaskIndex !== -1 && results[organizerTaskIndex].status === 'fulfilled') {
                merged.organizerDetails = (results[organizerTaskIndex] as PromiseFulfilledResult<any>).value;
            }
            setAuth({ user: merged, accessToken: accessToken || '' });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            setToast({ visible: true, variant: 'success', message: 'Profile updated' });
            setJustSaved(true);
            setDirtyTabs(new Set());
            setTimeout(() => setJustSaved(false), 2000);
        } catch (err) {
            console.error('[ProfileEditModal] Save failed:', err);
            setToast({ visible: true, variant: 'error', message: 'Could not save changes' });
        } finally {
            setIsSaving(false);
        }
    };

    const isFieldMissing = (keyword: string) => highlightMissing.some(m => m.toLowerCase().includes(keyword.toLowerCase()));
    const toggleSkill = (skill: string) => { setSkills(prev => (prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill])); setShowSkillDropdown(false); markDirty('identity'); };

    // ══════════════════════════════════
    //  SECTION RENDERERS (Variant H — each visually distinct)
    // ══════════════════════════════════

    // ── TAB 0: VERIFY — email add → 6-digit code → verified ──
    // Phone rung is read-only (no CTA — OTP already verified it at signup).
    // Email is a strengthener only; success copy stays plain, no "KYC"/"Level".
    const renderVerify = () => {
        const phone = (user as any)?.phoneNumber || '';
        const onSend = async () => {
            if (verifyBusy) return; setVerifyBusy(true);
            try { await authService.sendEmailCode(verifyEmail.trim().toLowerCase()); setVerifyStage('code'); }
            catch (e: any) { Alert.alert('Could not send code', e?.response?.data?.meta?.message || 'Try again.'); }
            finally { setVerifyBusy(false); }
        };
        const onVerify = async () => {
            if (verifyBusy) return; setVerifyBusy(true);
            try {
                const updated = await authService.verifyEmailCode(verifyEmail.trim().toLowerCase(), verifyCode.trim());
                setAuth({ user: { ...(user as any), ...updated }, accessToken: accessToken || '' });
                setVerifyStage('idle'); setVerifyCode('');
            } catch (e: any) { Alert.alert('Verification failed', e?.response?.data?.meta?.message || 'Check the code and try again.'); }
            finally { setVerifyBusy(false); }
        };
        return (
            <>
                {/* Ladder card */}
                <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: P.border, borderRadius: 16, padding: 16, marginBottom: 22 }}>
                    {/* Rung 1 — phone, read-only */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: emailVerified ? 14 : 16 }}>
                        <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: P.green, alignItems: 'center', justifyContent: 'center' }}><Check size={14} color={P.green} /></View>
                        <View style={{ flex: 1 }}><Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 15, color: P.textPrimary }}>Phone secured</Text><Text style={{ fontFamily: 'Outfit-Regular', fontSize: 12, color: P.textMuted }}>{phone}</Text></View>
                        <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 10, color: P.green, letterSpacing: 1 }}>SECURED</Text>
                    </View>
                    {/* Rung 2 — email */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: emailVerified ? P.green : P.orange, borderStyle: emailVerified ? 'solid' : 'dashed', alignItems: 'center', justifyContent: 'center' }}>{emailVerified ? <Check size={14} color={P.green} /> : null}</View>
                        <View style={{ flex: 1 }}><Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 15, color: P.textPrimary }}>{emailVerified ? 'Email secured' : 'Add a backup email'}</Text><Text style={{ fontFamily: 'Outfit-Regular', fontSize: 12, color: P.textMuted }}>{emailVerified ? (user as any)?.email : 'So you never lose access to your account'}</Text></View>
                        {emailVerified ? <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 10, color: P.green, letterSpacing: 1 }}>SECURED</Text> : null}
                    </View>
                </View>

                {!emailVerified && verifyStage === 'idle' && (
                    <>
                        <Field label="Backup email"><Input value={verifyEmail} onChangeText={setVerifyEmail} placeholder="name@email.com" keyboardType="email-address" autoCapitalize="none" /></Field>
                        <Pressable onPress={onSend} disabled={verifyBusy} style={{ opacity: verifyBusy ? 0.6 : 1 }}>
                            <View style={{ paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: P.orange }}>
                                {verifyBusy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontFamily: 'Outfit-Bold', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Send code</Text>}
                            </View>
                        </Pressable>
                        <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 11, color: P.textMuted, fontStyle: 'italic', marginTop: 10 }}>Used only for receipts, alerts, and account recovery. Never shown publicly.</Text>
                    </>
                )}

                {!emailVerified && verifyStage === 'code' && (
                    <>
                        <Field label="Enter the code">
                            <Input value={verifyCode} onChangeText={setVerifyCode} placeholder="6-digit code" keyboardType="number-pad" />
                        </Field>
                        <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 12, color: P.textSecondary, marginBottom: 14 }}>Sent to {verifyEmail} · <Text style={{ color: P.orange }} onPress={() => setVerifyStage('idle')}>Change</Text></Text>
                        <Pressable onPress={onVerify} disabled={verifyBusy} style={{ opacity: verifyBusy ? 0.6 : 1 }}>
                            <View style={{ paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: P.orange }}>
                                {verifyBusy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontFamily: 'Outfit-Bold', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Verify</Text>}
                            </View>
                        </Pressable>
                    </>
                )}

                {emailVerified && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <ShieldCheck size={15} color={P.green} /><Text style={{ fontFamily: 'Outfit-Medium', fontSize: 13, color: P.green }}>Your account is protected.</Text>
                    </View>
                )}
            </>
        );
    };

    // ── TAB 1: BASIC (v1 Editorial) — "Who you are" ──
    // Underline-only fields on the page (no cards): name, headline, type +
    // location paired on one row, then availability as underline status tabs
    // (≥44pt targets, green/gold/red semantics). No live preview card — the
    // editorial column keeps the eye on one narrow measure.
    const renderHeader = () => {
        const set = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); markDirty('header'); };
        return (
            <>
                <Field label="Full name" highlighted={isFieldMissing('display name')} accent={P.orange}>
                    <Input value={displayName} onChangeText={set(setDisplayName)} placeholder="Your name" />
                </Field>
                <Field label="Headline">
                    <Input value={headline} onChangeText={set(setHeadline)} placeholder="Bharatanatyam artist · Storyteller" />
                </Field>

                {/* Artist type + location paired — reads as one identity row */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                        <Field label="Artist Type" highlighted={isFieldMissing('artist type')} accent={P.orange}>
                            <Input value={artistType} onChangeText={set(setArtistType)} placeholder="Dancer, Singer…" />
                        </Field>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Field label="Location" highlighted={isFieldMissing('location')} accent={P.orange}>
                            <Input value={location} onChangeText={set(setLocation)} placeholder="City, Country" />
                        </Field>
                    </View>
                </View>

                <Field label="Availability" accent={P.orange} style={{ marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 22 }}>
                        {([
                            { value: 'available', label: 'Available', color: P.green },
                            { value: 'tentative', label: 'Tentative', color: P.gold },
                            { value: 'busy', label: 'Busy', color: P.danger },
                        ] as const).map(opt => {
                            const isSelected = availability === opt.value;
                            return (
                                <TouchableOpacity
                                    key={opt.value}
                                    onPress={() => {
                                        setAvailability(isSelected ? '' : opt.value);
                                        markDirty('header');
                                    }}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Set availability to ${opt.label}`}
                                    accessibilityState={{ selected: isSelected }}
                                    style={{
                                        minHeight: 44,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 9,
                                        paddingVertical: 8,
                                        borderBottomWidth: 1.5,
                                        borderBottomColor: isSelected ? opt.color : 'transparent',
                                    }}>
                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: opt.color, opacity: isSelected ? 1 : 0.4 }} />
                                    <Text style={{
                                        fontFamily: isSelected ? 'Outfit-SemiBold' : 'Outfit-Regular',
                                        fontSize: 15,
                                        color: isSelected ? P.textPrimary : P.textSecondary,
                                    }}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Field>
            </>
        );
    };

    // ── TAB 2: ABOUT — Editorial composer + physical specs data-strip ──
    // Design intent:
    //   • Bio becomes a serif "composer" surface with a live rhythm meter —
    //     the meter turns character count into a signal (too brief / getting
    //     there / great / consider trimming) and highlights the sweet-spot
    //     band on the track so users see when they've landed the target.
    //   • Physical specs collapse from three separate tiles into one hairline
    //     data strip — reads as a spec card, not another form.
    const renderAbout = () => {
        return (
            <>
                <BioComposer
                    value={bio}
                    onChangeText={(v) => { setBio(v); markDirty('about'); }}
                    isRequired={isFieldMissing('bio')}
                />

                {/* Physical specs — editorial underline fields + swatch row */}
                <View style={{ flexDirection: 'row', gap: 22, marginTop: 30 }}>
                    <View style={{ flex: 1 }}>
                        <Field label="Age" style={{ marginBottom: 0 }}>
                            <Input value={age} onChangeText={(v) => { setAge(v); markDirty('about'); }} placeholder="—" keyboardType="number-pad" />
                        </Field>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Field label="Height" style={{ marginBottom: 0 }}>
                            <TouchableOpacity onPress={() => setShowHeightDropdown(true)} style={{ borderBottomWidth: 1, borderBottomColor: P.border, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 16, color: height ? P.textPrimary : P.textMuted }}>{height || '—'}</Text>
                                <ChevronDown size={16} color={P.textSecondary} />
                            </TouchableOpacity>
                        </Field>
                    </View>
                </View>

                <Field label="Skin tone" style={{ marginTop: 26, marginBottom: 0 }}>
                    <View style={{ flexDirection: 'row', gap: 14, marginTop: 4 }}>
                        {SKIN_TONES.map((t) => {
                            const sel = skinTone === t.label;
                            return (
                                <TouchableOpacity
                                    key={t.label}
                                    onPress={() => { setSkinTone(t.label); setSkinToneHex(t.hex); markDirty('about'); }}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Skin tone ${t.label}`}
                                    accessibilityState={{ selected: sel }}
                                    style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: t.hex, alignItems: 'center', justifyContent: 'center' }}
                                >
                                    {sel ? <View style={{ position: 'absolute', top: -4, left: -4, right: -4, bottom: -4, borderRadius: 19, borderWidth: 2, borderColor: P.orange }} /> : null}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Field>
            </>
        );
    };

    // ── TAB 3: SKILLS — Tag Cloud Manager ──
    const renderIdentity = () => (
        <>
            {/* Count line first — the editorial "5 skills selected" readout */}
            <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: P.textSecondary, marginBottom: 18 }}>
                {skills.length} skill{skills.length !== 1 ? 's' : ''} selected
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 26 }}>
                {skills.map((skill, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: P.border, borderRadius: 100, paddingLeft: 15, paddingRight: 10, paddingVertical: 8 }}>
                        <Text style={{ color: P.textPrimary, fontFamily: 'Outfit-Regular', fontSize: 14 }}>{skill}</Text>
                        <TouchableOpacity onPress={() => { setSkills(prev => prev.filter(s => s !== skill)); markDirty('identity'); }} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Remove ${skill}`}>
                            <X size={13} color={P.textSecondary} />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            <Field label="Add a skill" style={{ marginBottom: 0 }}>
                <TouchableOpacity onPress={() => setShowSkillDropdown(true)} style={{ borderBottomWidth: 1, borderBottomColor: P.border, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 16, color: P.textMuted }}>Search or add skill…</Text>
                    <Search size={18} color={P.textSecondary} />
                </TouchableOpacity>
            </Field>
        </>
    );

    // ── TAB 4: EXPERIENCE — Timeline Editor ──
    const renderExperience = () => {
        const handleAdd = () => { setExperience([...experience, { role: '', projectName: '', organization: '', location: '', description: '', date: '' }]); setExpandedEntries(prev => new Set(prev).add(experience.length)); markDirty('experience'); };
        const handleRemove = (index: number) => { const n = [...experience]; n.splice(index, 1); setExperience(n); markDirty('experience'); };
        const handleChange = (index: number, field: keyof ExperienceEntry, value: string) => { const n = [...experience]; n[index] = { ...n[index], [field]: value }; setExperience(n); markDirty('experience'); };
        const toggleExpand = (index: number) => { setExpandedEntries(prev => { const n = new Set(prev); n.has(index) ? n.delete(index) : n.add(index); return n; }); };

        return (
            <>
                <View style={{ position: 'relative', paddingLeft: 26 }}>
                    {/* Editorial rail — a single hairline */}
                    {experience.length > 0 && <View style={{ position: 'absolute', left: 4, top: 6, bottom: 14, width: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />}
                    {experience.map((exp, index) => {
                        const isExpanded = expandedEntries.has(index);
                        const isNow = index === 0;
                        return (
                            <View key={index} style={{ position: 'relative', paddingBottom: 30 }}>
                                {/* Node — orange (with glow) on the most recent, hollow otherwise */}
                                <View style={{ position: 'absolute', left: -26, top: 5, width: 9, height: 9, borderRadius: 5, backgroundColor: isNow ? P.orange : P.bg, borderWidth: 1.5, borderColor: isNow ? P.orange : P.textSecondary, ...(isNow ? { shadowColor: P.orange, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8 } : {}) }} />
                                <Pressable onPress={() => toggleExpand(index)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <View style={{ flex: 1 }}>
                                        {exp.date ? <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 11, letterSpacing: 1.5, color: isNow ? P.orange : P.textSecondary, marginBottom: 6 }}>{exp.date}</Text> : null}
                                        <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 16.5, color: P.textPrimary, lineHeight: 22 }}>{exp.role || exp.title || exp.projectName || 'New entry'}</Text>
                                        {(exp.organization || exp.location || exp.venue) ? (
                                            <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 13.5, color: P.textSecondary, marginTop: 3 }}>
                                                {[exp.organization, exp.location ?? exp.venue].filter(Boolean).join(' · ')}
                                            </Text>
                                        ) : null}
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginLeft: 10 }}>
                                        <TouchableOpacity onPress={() => handleRemove(index)} hitSlop={12}><Trash2 size={14} color={P.danger} /></TouchableOpacity>
                                        {isExpanded ? <ChevronUp size={16} color={P.textSecondary} /> : <ChevronDown size={16} color={P.textMuted} />}
                                    </View>
                                </Pressable>
                                {isExpanded && (
                                    <View style={{ gap: 12, marginTop: 16, borderTopWidth: 1, borderTopColor: P.border, paddingTop: 16 }}>
                                        <MiniField label="Role / Title"><Input placeholder="Lead Singer" value={exp.role ?? exp.title ?? ''} onChangeText={(v) => handleChange(index, 'role', v)} /></MiniField>
                                        <MiniField label="Production / Project"><Input placeholder="Summer Fest 2024" value={exp.projectName ?? exp.title ?? ''} onChangeText={(v) => handleChange(index, 'projectName', v)} /></MiniField>
                                        <MiniField label="Organization"><Input placeholder="Moonlight Studios" value={exp.organization || ''} onChangeText={(v) => handleChange(index, 'organization', v)} /></MiniField>
                                        <MiniField label="Location"><Input placeholder="Main Stadium" value={exp.location ?? exp.venue ?? ''} onChangeText={(v) => handleChange(index, 'location', v)} /></MiniField>
                                        <AITextInput label="Description" placeholder="Describe your role..." value={exp.description || ''} onChangeText={(val: string) => handleChange(index, 'description', val)} />
                                        <MiniField label="Date"><Input placeholder="MM - YYYY or range" value={exp.date || ''} onChangeText={(v) => handleChange(index, 'date', v)} /></MiniField>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
                <TouchableOpacity onPress={handleAdd} style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 8 }} accessibilityRole="button">
                    <Plus size={15} color={P.orange} />
                    <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: P.orange }}>Add an engagement</Text>
                </TouchableOpacity>
            </>
        );
    };

    // ── TAB 5: MEDIA — Bento Upload Grid ──
    const renderMedia = () => {
        const handlePickMedia = async (type: 'profile' | 'gallery', index?: number) => {
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: type === 'profile', aspect: type === 'profile' ? [1, 1] : [16, 9], quality: 0.8 });
            if (result.canceled) return;
            const asset = result.assets[0];
            const validation = validateMediaFile(asset, false);
            if (!validation.valid) { Alert.alert('Error', validation.error); return; }
            if (isLargeFile(asset)) { Alert.alert('Large File', 'Continue?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Continue', onPress: () => performUpload(type, asset, index) }]); return; }
            performUpload(type, asset, index);
        };
        const performUpload = async (type: 'profile' | 'gallery', asset: ImagePicker.ImagePickerAsset, index?: number) => {
            const uploadKey = type === 'profile' ? 'profile' : `${type}-${index}`;
            setUploadingState((prev: any) => ({ ...prev, [uploadKey]: { progress: 0, uploading: true, localUri: asset.uri } }));
            const purpose = type === 'profile' ? 'avatar' as const : 'gallery' as const;
            const result = await uploadMediaFlow({ asset, entityType: 'user', entityId: user?._id || '', purpose, onProgress: (progress) => setUploadingState((prev: any) => ({ ...prev, [uploadKey]: { ...prev[uploadKey], progress, uploading: true } })) });
            setUploadingState((prev: any) => ({ ...prev, [uploadKey]: { ...prev[uploadKey], progress: 100, uploading: false } }));
            if (result.success && result.url) { if (type === 'profile') setProfileImageUrl(result.url!); else if (type === 'gallery' && index !== undefined) setGalleryUrls(prev => { const n = [...prev]; n[index] = result.url!; return n; }); markDirty('media'); }
            else Alert.alert('Upload Failed', result.error || 'Unknown error');
        };
        const removeMedia = (index: number) => { setGalleryUrls(prev => { const n = [...prev]; n[index] = ''; return n; }); markDirty('media'); };
        const profileState = uploadingState['profile'];

        // ── Video reel pick → Mux direct upload (never S3) ──
        const handlePickVideo = async () => {
            // 60s cap mirrors Step6Media's event-video picker (spec: max 3 reels, 60s each).
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos, quality: 0.8, videoMaxDuration: 60 });
            if (result.canceled) return;
            const asset = result.assets[0];
            const validation = validateMediaFile(asset, true);
            if (!validation.valid) { Alert.alert('Error', validation.error); return; }
            if (isLargeFile(asset)) { Alert.alert('Large File', 'Continue?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Continue', onPress: () => performVideoUpload(asset) }]); return; }
            performVideoUpload(asset);
        };
        const performVideoUpload = async (asset: ImagePicker.ImagePickerAsset) => {
            const result = await uploadVideoFlow({ asset, entityType: 'user', entityId: user?._id || '', purpose: 'portfolio' });
            if (result.success && result.uploadId) {
                setVideoReels(prev => ([...prev, { muxPlaybackId: '', status: 'processing' as const, uploadId: result.uploadId }]).slice(0, 3));
                markDirty('media');
            } else {
                Alert.alert('Upload Failed', result.error || 'Unknown error');
            }
        };
        const removeReel = (index: number) => { setVideoReels(prev => prev.filter((_, i) => i !== index)); markDirty('media'); };

        const MediaSlot = ({ type, index, url }: { type: 'gallery'; index: number; url: string }) => {
            const uploadKey = `${type}-${index}`; const state = uploadingState[uploadKey]; const isUploading = state?.uploading;
            return (
                <View style={{ flex: 1, aspectRatio: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: P.border, borderRadius: 16, overflow: 'hidden' }}>
                    {url ? (<View style={{ flex: 1 }}><Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} /><TouchableOpacity onPress={() => removeMedia(index)} style={{ position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={12} color={P.danger} /></TouchableOpacity></View>)
                    : isUploading ? (<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="small" color={P.orange} /><Text style={{ color: P.textPrimary, fontFamily: 'Outfit-Bold', fontSize: 10, marginTop: 4 }}>{state?.progress || 0}%</Text></View>)
                    : (<TouchableOpacity onPress={() => handlePickMedia(type, index)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' }}><Plus size={20} color={P.textSecondary} /><Text style={{ color: P.textSecondary, fontFamily: 'Outfit-Bold', fontSize: 9, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Photo</Text></TouchableOpacity>)}
                </View>
            );
        };

        // Reel slot: mirrors Step6Media's video branch — processing tile, Mux
        // poster thumbnail when ready, empty "Add reel" affordance otherwise.
        // Full inline playback is a later task; this edit slot only needs the
        // processing/poster states.
        const ReelSlot = ({ reel }: { reel?: ProfileVideoReel }) => (
            <View style={{ flex: 1, aspectRatio: 16 / 9, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: P.border, borderRadius: 16, overflow: 'hidden' }}>
                {reel && reel.status === 'processing' ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator size="small" color={P.orange} />
                        <Text style={{ color: P.textSecondary, fontFamily: 'Outfit-Bold', fontSize: 10, marginTop: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Processing…</Text>
                    </View>
                ) : reel && reel.status === 'errored' ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: P.danger, fontFamily: 'Outfit-Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Failed — remove</Text>
                        <TouchableOpacity onPress={() => removeReel(videoReels.indexOf(reel))} style={{ position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={12} color={P.danger} /></TouchableOpacity>
                    </View>
                ) : reel ? (
                    <View style={{ flex: 1 }}>
                        {reel.thumbnailUrl ? <Image source={{ uri: reel.thumbnailUrl }} style={{ width: '100%', height: '100%' }} /> : null}
                        <TouchableOpacity onPress={() => removeReel(videoReels.indexOf(reel))} style={{ position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={12} color={P.danger} /></TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity onPress={handlePickVideo} accessibilityLabel="Add reel" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' }}>
                        <VideoIcon size={20} color={P.textSecondary} />
                        <Text style={{ color: P.textSecondary, fontFamily: 'Outfit-Bold', fontSize: 9, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Add reel</Text>
                    </TouchableOpacity>
                )}
            </View>
        );

        const MediaLabel = ({ l, c }: { l: string; c?: string }) => (
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: P.textSecondary }}>{l}</Text>
                {c ? <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 10, letterSpacing: 1, color: P.textMuted }}>{c}</Text> : null}
            </View>
        );
        return (
            <>
                {/* Profile photo — avatar + quiet CTA (editorial row) */}
                <View style={{ marginBottom: 34 }}>
                    <MediaLabel l="Profile photo" />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                        <TouchableOpacity onPress={() => handlePickMedia('profile')} disabled={profileState?.uploading}>
                            <View style={{ width: 92, height: 92, borderRadius: 46, padding: 3, backgroundColor: P.orange, alignItems: 'center', justifyContent: 'center' }}>
                                <View style={{ width: 86, height: 86, borderRadius: 43, backgroundColor: P.bg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                                    {profileImageUrl ? <Image source={{ uri: profileImageUrl }} style={{ width: '100%', height: '100%' }} />
                                        : profileState?.uploading ? <><ActivityIndicator size="small" color={P.orange} /><Text style={{ color: P.textPrimary, fontFamily: 'Outfit-Bold', fontSize: 10, marginTop: 4 }}>{profileState?.progress || 0}%</Text></>
                                        : <Camera size={26} color={P.textMuted} />}
                                </View>
                            </View>
                        </TouchableOpacity>
                        <View style={{ gap: 8 }}>
                            <TouchableOpacity onPress={() => handlePickMedia('profile')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: P.border, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start' }}>
                                <Camera size={15} color={P.textPrimary} />
                                <Text style={{ fontFamily: 'Outfit-Medium', fontSize: 13.5, color: P.textPrimary }}>Change photo</Text>
                            </TouchableOpacity>
                            <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 12, color: P.textSecondary }}>Square, at least 800×800</Text>
                        </View>
                    </View>
                </View>

                {/* Gallery — editorial 3-col grid */}
                <View style={{ marginBottom: 34 }}>
                    <MediaLabel l="Gallery" c={`${galleryUrls.filter(Boolean).length} / 5`} />
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>{[0, 1, 2].map(i => <MediaSlot key={i} type="gallery" index={i} url={galleryUrls[i] || ''} />)}</View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>{[3, 4].map(i => <MediaSlot key={i} type="gallery" index={i} url={galleryUrls[i] || ''} />)}<View style={{ flex: 1 }} /></View>
                </View>

                {/* Reels — 16:9, 2-col grid */}
                <View>
                    <MediaLabel l="Reels" c={`${videoReels.length} / 3`} />
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>{[0, 1].map(i => <ReelSlot key={i} reel={videoReels[i]} />)}</View>
                    <View style={{ flexDirection: 'row', gap: 10 }}><ReelSlot reel={videoReels[2]} /><View style={{ flex: 1 }} /></View>
                </View>
            </>
        );
    };

    // ── TAB 6: SOCIAL — Branded Rows ──
    const SOCIAL_PLATFORMS = [
        { key: 'instagramHandle', label: 'INSTAGRAM', icon: Instagram, color: '#E1306C', placeholder: 'username' },
        { key: 'youtubeUrl', label: 'YOUTUBE', icon: Youtube, color: '#FF0000', placeholder: 'youtube.com/...' },
        { key: 'spotifyUrl', label: 'SPOTIFY', icon: Music, color: '#1ED760', placeholder: 'open.spotify.com/...' },
        { key: 'soundcloudUrl', label: 'SOUNDCLOUD', icon: Headphones, color: '#FF8800', placeholder: 'soundcloud.com/...' },
    ];
    const renderSocials = () => (
        <>
            {SOCIAL_PLATFORMS.map((p, i) => {
                const Icon = p.icon;
                return (
                    <View key={p.key} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 16, marginBottom: i < SOCIAL_PLATFORMS.length - 1 ? 24 : 0 }}>
                        {/* Brand color lives on the glyph only — no filled chip */}
                        <View style={{ width: 24, marginBottom: 10, alignItems: 'center' }}>
                            <Icon size={22} color={p.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 10, color: P.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 9 }}>{p.label}</Text>
                            <TextInput
                                value={(socials as any)[p.key]}
                                onChangeText={t => { setSocials(s => ({ ...s, [p.key]: t })); markDirty('socials'); }}
                                placeholder={p.placeholder}
                                placeholderTextColor={P.textMuted}
                                autoCapitalize="none"
                                style={{ borderBottomWidth: 1, borderBottomColor: P.border, paddingVertical: 8, color: P.textPrimary, fontFamily: 'Outfit-Regular', fontSize: 16 }}
                            />
                        </View>
                    </View>
                );
            })}
        </>
    );

    // ── TAB 7: ORGANIZATION — Business Card Selector ──
    const ORG_TYPES = [
        { label: 'Individual', value: 'individual', icon: UserIcon },
        { label: 'Academy', value: 'academy', icon: Home },
        { label: 'Business', value: 'registered_business', icon: Building2 },
        { label: 'Agency', value: 'agency', icon: Users },
        { label: 'Venue', value: 'venue', icon: Landmark },
        { label: 'Brand', value: 'brand', icon: Tag },
        { label: 'Corporate', value: 'corporate', icon: Briefcase },
    ];
    const renderOrganization = () => {
        const set = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); markDirty('organization'); };
        return (
            <>
                <Field label="Account type">
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18 }}>
                        {ORG_TYPES.map(type => {
                            const isSelected = orgType === type.value;
                            return (
                                <TouchableOpacity
                                    key={type.value}
                                    onPress={() => { setOrgType(type.value); markDirty('organization'); }}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: isSelected }}
                                    style={{ paddingVertical: 6, borderBottomWidth: 1.5, borderBottomColor: isSelected ? P.orange : 'transparent' }}>
                                    <Text style={{ fontFamily: isSelected ? 'Outfit-SemiBold' : 'Outfit-Regular', fontSize: 15, color: isSelected ? P.orange : P.textSecondary }}>{type.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Field>
                <Field label="Organization name" highlighted={isFieldMissing('organization')} accent={P.orange} style={{ marginTop: 8 }}>
                    <Input value={orgName} onChangeText={set(setOrgName)} placeholder="Organization name" />
                </Field>
                <Field label="Website" style={{ marginBottom: 0 }}><Input value={orgWebsite} onChangeText={set(setOrgWebsite)} placeholder="https://" /></Field>
            </>
        );
    };

    // ── TAB 8: BILLING — Ruled Document ──
    const renderBilling = () => {
        const set = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); markDirty('billing'); };
        return (
            <>
                <Field label="Legal business name"><Input value={legalBusinessName} onChangeText={set(setLegalBusinessName)} placeholder="Registered business name" /></Field>
                <Field label="GST number"><Input value={gstNumber} onChangeText={set(setGstNumber)} placeholder="22AAAAA0000A1Z5" /></Field>
                <Field label="Billing address"><Input value={billingAddress} onChangeText={set(setBillingAddress)} placeholder="Street, area" /></Field>
                <View style={{ flexDirection: 'row', gap: 22 }}>
                    <View style={{ flex: 1 }}><Field label="State"><Input value={billingState} onChangeText={set(setBillingState)} placeholder="State" /></Field></View>
                    <View style={{ flex: 1 }}><Field label="Pincode"><Input value={pincode} onChangeText={set(setPincode)} placeholder="560001" /></Field></View>
                </View>
                <Field label="Country" style={{ marginBottom: 0 }}><Input value={country} onChangeText={set(setCountry)} placeholder="India" /></Field>
            </>
        );
    };

    // Ordered list of every section — all rendered, stacked, in one scroll.
    const SECTION_RENDERERS: { key: TabKey; render: () => React.ReactNode }[] = [
        { key: 'verify', render: renderVerify },
        { key: 'header', render: renderHeader },
        { key: 'about', render: renderAbout },
        { key: 'identity', render: renderIdentity },
        { key: 'experience', render: renderExperience },
        { key: 'media', render: renderMedia },
        { key: 'socials', render: renderSocials },
        { key: 'organization', render: renderOrganization },
        { key: 'billing', render: renderBilling },
    ];

    if (!isVisible) return null;

    const isSaved = justSaved;

    // Editorial (v1) section headlines — pair with the folio numeral + kicker.
    const EDITORIAL_HEADLINES: Record<TabKey, string> = {
        verify: 'Secure your account',
        header: 'Who you are', about: 'Your story', identity: 'The craft',
        experience: 'Selected work', media: 'The gallery', socials: 'Elsewhere',
        organization: 'The organisation', billing: 'Billing details',
    };
    // Optional one-line notes under the headline (only where the mockup shows one).
    const SECTION_NOTES: Partial<Record<TabKey, string>> = {
        organization: 'Add these only if you represent an academy, agency, or company.',
        billing: 'Used only on invoices and GST-compliant receipts.',
    };

    return (
        <Modal visible transparent animationType="none" onRequestClose={handleClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <TouchableOpacity activeOpacity={1} onPress={handleClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
                    <Animated.View style={{ transform: [{ translateY: slideAnim }], flex: 1, marginTop: Platform.OS === 'ios' ? 56 : 36, backgroundColor: P.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, borderColor: P.border, overflow: 'hidden' }}>
                        <TouchableOpacity activeOpacity={1} style={{ flex: 1 }}>

                            {/* Handle + Header */}
                            <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
                                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)' }} />
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: P.border }}>
                                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 24, color: P.textPrimary, letterSpacing: -0.3 }}>Edit Profile</Text>
                                <TouchableOpacity
                                    onPress={handleClose}
                                    accessibilityLabel="Close edit modal"
                                    style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}>
                                    <X size={16} color={P.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {/* Tab Bar — animated pill + dirty/complete dots */}
                            <EditModalTabBar
                                tabs={visibleTabs.map(t => ({
                                    key: t.key,
                                    label: t.label,
                                    icon: t.icon,
                                    optional: t.optional,
                                    isComplete: t.key === 'verify' ? emailVerified : t.checkComplete(profileData),
                                    isDirty: dirtyTabs.has(t.key),
                                }))}
                                active={activeTab}
                                onChange={handleTabPress}
                            />

                            {/* Content — one long scroll; the tab bar above tracks position */}
                            <ScrollView
                                ref={scrollRef}
                                onScroll={handleScroll}
                                scrollEventThrottle={16}
                                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 }}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}>
                                {SECTION_RENDERERS.map(({ key, render }, i) => {
                                    const def = visibleTabs.find(t => t.key === key)!;
                                    return (
                                        <View key={key} onLayout={onSectionLayout(key)} style={{ marginTop: i === 0 ? 4 : 44 }}>
                                            {i > 0 && <View style={{ height: 1, backgroundColor: P.border, marginBottom: 28 }} />}
                                            {/* Editorial section header: oversized folio numeral + SpaceMono kicker + DM Serif headline */}
                                            <View style={{ position: 'relative', marginBottom: 22 }}>
                                                <Text style={{ position: 'absolute', right: -4, top: -20, fontFamily: 'DMSerifDisplay_400Regular', fontSize: 64, lineHeight: 64, color: 'rgba(240,236,230,0.05)' }}>
                                                    {String(i + 1).padStart(2, '0')}
                                                </Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                    <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 10, color: P.orange, textTransform: 'uppercase', letterSpacing: 2 }}>
                                                        {String(i + 1).padStart(2, '0')} / {def.label}
                                                    </Text>
                                                    {def.optional && (
                                                        <View style={{ borderWidth: 1, borderColor: `${P.gold}30`, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 }}>
                                                            <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 8, color: P.gold, letterSpacing: 1, textTransform: 'uppercase' }}>Optional</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 30, color: P.textPrimary, letterSpacing: -0.5, marginTop: 6 }}>
                                                    {EDITORIAL_HEADLINES[key]}
                                                </Text>
                                                {SECTION_NOTES[key] ? (
                                                    <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 13, color: P.textSecondary, lineHeight: 19, marginTop: 9, maxWidth: 320 }}>
                                                        {SECTION_NOTES[key]}
                                                    </Text>
                                                ) : null}
                                            </View>
                                            {render()}
                                        </View>
                                    );
                                })}
                            </ScrollView>

                            {/* Footer — neutral Save (no longer tied to the active section) */}
                            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingVertical: 14, paddingBottom: Platform.OS === 'ios' ? 34 : 14, backgroundColor: P.bg, borderTopWidth: 1, borderTopColor: P.border, flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity onPress={handleClose} style={{ flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: P.border, alignItems: 'center' }}>
                                    <Text style={{ color: P.textSecondary, fontFamily: 'Outfit-Bold', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Cancel</Text>
                                </TouchableOpacity>
                                <Pressable onPress={handleSaveAll} disabled={isSaving} style={({ pressed }) => ({ flex: 1, opacity: isSaving ? 0.6 : pressed ? 0.9 : 1 })}>
                                    <View style={{ paddingVertical: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: isSaved ? P.green : P.orange }}>
                                        {isSaving ? <ActivityIndicator size="small" color="#fff" /> : isSaved ? <Check size={16} color="#fff" /> : null}
                                        <Text style={{ color: '#fff', fontFamily: 'Outfit-Bold', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>
                                            {isSaving ? 'Saving…' : isSaved ? 'Saved!' : 'Save changes'}
                                        </Text>
                                    </View>
                                </Pressable>
                            </View>

                            <EditModalToast state={toast} onDismiss={() => setToast(null)} />

                            {discardPromptVisible && (
                                <View style={{
                                    position: 'absolute', left: 0, right: 0, bottom: 0,
                                    backgroundColor: P.surface, borderTopWidth: 1, borderTopColor: P.border,
                                    padding: 20, gap: 12, zIndex: 100,
                                }}>
                                    <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 14, color: P.textPrimary }}>
                                        You have unsaved changes
                                    </Text>
                                    <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 12, color: P.textSecondary }}>
                                        Discard them?
                                    </Text>
                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                        <TouchableOpacity
                                            onPress={handleKeepEditing}
                                            style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: P.border, alignItems: 'center' }}>
                                            <Text style={{ color: P.textSecondary, fontFamily: 'Outfit-Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                                                Keep editing
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={handleConfirmDiscard}
                                            style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: P.danger, alignItems: 'center' }}>
                                            <Text style={{ color: '#fff', fontFamily: 'Outfit-Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                                                Discard
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            <HeightPickerSheet
                                visible={showHeightDropdown}
                                value={height}
                                onSelect={(v) => { setHeight(v); markDirty('about'); }}
                                onClose={() => setShowHeightDropdown(false)}
                            />

                            <SkillSearchSheet
                                visible={showSkillDropdown}
                                selected={skills}
                                onToggle={toggleSkill}
                                onClose={() => setShowSkillDropdown(false)}
                            />

                        </TouchableOpacity>
                    </Animated.View>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </Modal>
    );
};
