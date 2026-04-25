import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Modal, ScrollView,
    Animated, Dimensions, KeyboardAvoidingView, Platform,
    ActivityIndicator, Image, Alert, Pressable,
} from 'react-native';
import {
    X, Check, Plus, Search, ChevronDown, ChevronUp, Trash2, Camera,
    Video as VideoIcon, Sparkles, User as UserIcon, FileText,
    Briefcase, Image as ImageIcon, Link2, Building2, CreditCard,
    Zap, MapPin, Edit3, Instagram, Youtube, Music, Headphones,
    Users, Home, Landmark, Tag,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { uploadMediaFlow, validateMediaFile, isLargeFile } from "@/utils/upload";
import { useProfileUiStore, SectionId } from '@/stores/profileUiStore';
import { useAuthStore } from '@/stores/authStore';
import authService from '@/services/authService';
import gigService from '@/services/gigService';
import { ProfileData, ExperienceEntry } from '@/components/profile/types';
import { AITextInput } from '@/components/ui/AITextInput';
import { Field, Input, MiniField, P } from './edit/EditModalPrimitives';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

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
type TabKey = 'header' | 'about' | 'identity' | 'experience' | 'media' | 'socials' | 'organization' | 'billing';
interface TabDef {
    key: TabKey;
    label: string;
    icon: any;
    color: string;
    gradient: [string, string];
    optional?: boolean;
    checkComplete: (d: ProfileData) => boolean;
}

const TABS: TabDef[] = [
    { key: 'header', label: 'Basic', icon: UserIcon, color: P.orange, gradient: [P.orange, P.gold],
        checkComplete: (d) => !!(d.fullName && d.location && d.artistType) },
    { key: 'about', label: 'Bio', icon: FileText, color: P.gold, gradient: [P.gold, '#D97706'],
        checkComplete: (d) => !!(d.bio && d.bio.length >= 50) },
    { key: 'identity', label: 'Skills', icon: Zap, color: P.pink, gradient: [P.pink, P.orange],
        checkComplete: (d) => d.skills.length >= 1 },
    { key: 'experience', label: 'Experience', icon: Briefcase, color: P.cyan, gradient: [P.cyan, '#0891B2'],
        checkComplete: (d) => d.experience.length >= 1 },
    { key: 'media', label: 'Media', icon: ImageIcon, color: P.green, gradient: [P.green, '#059669'],
        checkComplete: (d) => !!(d.profileImageUrl || (d.galleryUrls && d.galleryUrls.filter(Boolean).length >= 1)) },
    { key: 'socials', label: 'Social', icon: Link2, color: '#E040A0', gradient: ['#E040A0', P.pink],
        checkComplete: (d) => !!(d.instagramHandle || d.youtubeUrl) },
    { key: 'organization', label: 'Org', icon: Building2, color: P.cyan, gradient: [P.cyan, '#0891B2'],
        optional: true, checkComplete: (d) => !!(d.organizationName) },
    { key: 'billing', label: 'Billing', icon: CreditCard, color: P.gold, gradient: [P.gold, P.orange],
        optional: true, checkComplete: () => false },
];

const SECTION_TO_TAB: Record<string, TabKey> = {
    header: 'header', basic: 'about', about: 'about', identity: 'identity',
    experience: 'experience', media: 'media', socials: 'socials',
    organization: 'organization', contact: 'organization',
};

type Props = { profileData: ProfileData };

// ══════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════
export const ProfileEditModal: React.FC<Props> = ({ profileData }) => {
    const { activeSheet, closeSheet, highlightMissing } = useProfileUiStore();
    const { user, setAuth, accessToken } = useAuthStore();
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const tabScrollRef = useRef<ScrollView>(null);
    const section = activeSheet;
    const isVisible = !!section;
    const initialTab = section ? (SECTION_TO_TAB[section] || 'header') : 'header';
    const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
    const [isSaving, setIsSaving] = useState(false);
    const [savedSection, setSavedSection] = useState<TabKey | null>(null);
    const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());

    // ── Form State (all 49 hooks — unchanged) ──
    const [displayName, setDisplayName] = useState('');
    const [headline, setHeadline] = useState('');
    const [artistType, setArtistType] = useState('');
    const [location, setLocation] = useState('');
    const [orgName, setOrgName] = useState('');
    const [bio, setBio] = useState('');
    const [age, setAge] = useState('');
    const [height, setHeight] = useState('');
    const [showHeightDropdown, setShowHeightDropdown] = useState(false);
    const [heightSearch, setHeightSearch] = useState('');
    const [skinTone, setSkinTone] = useState('');
    const [skinToneHex, setSkinToneHex] = useState('');
    const [skills, setSkills] = useState<string[]>([]);
    const [skillSearch, setSkillSearch] = useState('');
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
    const [videoUrls, setVideoUrls] = useState<string[]>(['', '', '']);
    const [uploadingState, setUploadingState] = useState<any>({});
    const [experience, setExperience] = useState<ExperienceEntry[]>([]);

    const [dirtyTabs, setDirtyTabs] = useState<Set<TabKey>>(new Set());
    const [discardPromptVisible, setDiscardPromptVisible] = useState(false);
    const markDirty = (tab: TabKey) => setDirtyTabs(prev => {
        if (prev.has(tab)) return prev;
        const next = new Set(prev);
        next.add(tab);
        return next;
    });

    const visibleTabs = TABS;

    // ── Reset form (unchanged) ──
    useEffect(() => {
        if (!isVisible) return;
        const tab = section ? (SECTION_TO_TAB[section] || 'header') : 'header';
        setActiveTab(tab); setSavedSection(null); setExpandedEntries(new Set()); setDirtyTabs(new Set());
        setDiscardPromptVisible(false);
        setDisplayName(profileData.fullName || ''); setHeadline(profileData.headline || '');
        setArtistType(profileData.artistType || ''); setLocation(profileData.location || '');
        setOrgName(profileData.organizationName || ''); setBio(profileData.bio || '');
        setAge(profileData.age || ''); setHeight(profileData.height || '');
        setShowHeightDropdown(false); setHeightSearch('');
        setSkinTone(profileData.skinTone || ''); setSkinToneHex(profileData.skinToneHex || '');
        setSkills(profileData.skills || []); setSkillSearch(''); setShowSkillDropdown(false);
        setSocials({ instagramHandle: profileData.instagramHandle || '', youtubeUrl: profileData.youtubeUrl || '', spotifyUrl: profileData.spotifyUrl || '', soundcloudUrl: profileData.soundcloudUrl || '' });
        setOrgType(profileData.organizerTypeCategory || 'individual'); setOrgWebsite(profileData.organizationWebsite || '');
        setProfileImageUrl(profileData.profileImageUrl || '');
        setGalleryUrls([...(profileData.galleryUrls || []), '', '', '', '', ''].slice(0, 5));
        setVideoUrls([...(profileData.videoUrls || []), '', '', ''].slice(0, 3));
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
    const handleClose = () => {
        if (discardPromptVisible) {
            setDiscardPromptVisible(false);
            return;
        }
        if (dirtyTabs.size > 0) {
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

    useEffect(() => {
        const idx = visibleTabs.findIndex(t => t.key === activeTab);
        if (idx >= 0 && tabScrollRef.current) { tabScrollRef.current.scrollTo({ x: Math.max(0, idx * 88 - SCREEN_WIDTH / 2 + 44), animated: true }); }
    }, [activeTab]);

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
            Object.assign(artistPayload, { displayName, headline, artistType, location });
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
                videoUrls: videoUrls.filter(Boolean),
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
            const rejected = results.filter(r => r.status === 'rejected');
            if (rejected.length > 0) {
                const failedTabName = visibleTabs.find(t => dirtyTabs.has(t.key))?.label || 'changes';
                Alert.alert('Save Failed', `Couldn't save ${failedTabName}. Try again.`);
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

            setSavedSection(activeTab); // green button flash on whichever tab the user is on
            setDirtyTabs(new Set());
            setTimeout(() => setSavedSection(null), 2000);
        } catch (err) {
            console.error('[ProfileEditModal] Save failed:', err);
            Alert.alert('Save Failed', 'Could not save changes. Try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const isFieldMissing = (keyword: string) => highlightMissing.some(m => m.toLowerCase().includes(keyword.toLowerCase()));
    const filteredSkills = SKILL_OPTIONS.filter(s => s.toLowerCase().includes(skillSearch.toLowerCase()) && !skills.includes(s));
    const exactMatch = SKILL_OPTIONS.find(s => s.toLowerCase() === skillSearch.toLowerCase());
    const toggleSkill = (skill: string) => { setSkills(prev => (prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill])); setSkillSearch(''); setShowSkillDropdown(false); markDirty('identity'); };
    const filteredHeights = HEIGHT_OPTIONS.filter(h => h.includes(heightSearch));

    // ══════════════════════════════════
    //  SECTION RENDERERS (Variant H — each visually distinct)
    // ══════════════════════════════════

    // ── TAB 1: BASIC — Profile Card Preview ──
    const renderHeader = () => {
        const set = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); markDirty('header'); };
        return (
            <>
                {/* Live preview card */}
                <View style={{ borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: `${P.orange}20`, paddingVertical: 24, paddingHorizontal: 20, marginBottom: 24, borderLeftWidth: 3, borderLeftColor: `${P.orange}99`, position: 'relative' }}>
                    <View style={{ alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22, color: displayName ? P.textPrimary : P.textMuted }}>{displayName || 'Your Name'}</Text>
                        {headline ? <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 12, color: P.textSecondary }}>{headline}</Text> : null}
                        {artistType ? <View style={{ paddingVertical: 2, paddingHorizontal: 10, borderRadius: 100, backgroundColor: `${P.orange}10`, borderWidth: 1, borderColor: `${P.orange}20`, marginTop: 4 }}><Text style={{ fontFamily: 'Outfit-Bold', fontSize: 9, color: P.orange, textTransform: 'uppercase', letterSpacing: 2 }}>{artistType}</Text></View> : null}
                        {location ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}><MapPin size={10} color={P.textMuted} /><Text style={{ fontFamily: 'Outfit-Regular', fontSize: 11, color: P.textMuted }}>{location}</Text></View> : null}
                    </View>
                </View>
                <View style={{ height: 1, backgroundColor: P.border, marginBottom: 20 }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}><Edit3 size={12} color={P.orange} /><Text style={{ fontFamily: 'Outfit-Bold', fontSize: 10, color: P.orange, textTransform: 'uppercase', letterSpacing: 2 }}>Edit Details</Text></View>
                <Field label="Display Name" highlighted={isFieldMissing('display name')} accent={P.orange}>
                    <Input value={displayName} onChangeText={set(setDisplayName)} placeholder="Your name" />
                </Field>
                <Field label="Headline"><Input value={headline} onChangeText={set(setHeadline)} placeholder="Singer | Performer | 5+ years" /></Field>
                <Field label="Artist Type" highlighted={isFieldMissing('artist type')} accent={P.orange}>
                    <Input value={artistType} onChangeText={set(setArtistType)} placeholder="Dancer, Singer..." />
                </Field>
                <Field label="Location" highlighted={isFieldMissing('location')} accent={P.orange}><Input value={location} onChangeText={set(setLocation)} placeholder="City, Country" /></Field>
            </>
        );
    };

    // ── TAB 2: ABOUT — Editorial Canvas ──
    const renderAbout = () => {
        const set = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); markDirty('about'); };
        return (
            <>
                {/* Bio with editorial gold border */}
                <View style={{ position: 'relative', borderLeftWidth: 3, borderLeftColor: `${P.gold}40`, paddingLeft: 16, backgroundColor: `${P.gold}04`, borderRadius: 16, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, paddingVertical: 16, paddingRight: 16, marginBottom: 24 }}>
                    <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 48, lineHeight: 48, color: `${P.gold}15`, position: 'absolute', top: -4, left: 8 }}>&ldquo;</Text>
                    {isFieldMissing('bio') && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: P.gold }} /><Text style={{ color: P.gold, fontSize: 10, fontFamily: 'Outfit-Bold', textTransform: 'uppercase', letterSpacing: 1.5 }}>Required</Text></View>}
                    <AITextInput label="Bio" value={bio} onChangeText={set(setBio)} placeholder="Tell your story..." containerStyle={{ marginBottom: 0 }} />
                </View>
                {/* Physical specs — compact inline row */}
                <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 10, color: P.textSecondary, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Physical Specs</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                    <View style={{ flex: 1, minWidth: 80, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1, borderColor: P.border, padding: 10 }}>
                        <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 9, color: P.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Age</Text>
                        <TextInput value={age} onChangeText={set(setAge)} placeholder="--" placeholderTextColor={P.textMuted} keyboardType="number-pad" style={{ fontFamily: 'Outfit-SemiBold', fontSize: 16, color: P.textPrimary, padding: 0 }} />
                    </View>
                    <View style={{ flex: 1, minWidth: 80, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1, borderColor: P.border, padding: 10 }}>
                        <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 9, color: P.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Height</Text>
                        <TouchableOpacity onPress={() => { setShowHeightDropdown(!showHeightDropdown); setHeightSearch(''); }}>
                            <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 16, color: height ? P.textPrimary : P.textMuted }}>{height || '--'}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1, minWidth: 80, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1, borderColor: P.border, padding: 10 }}>
                        <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 9, color: P.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Skin Tone</Text>
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                            {SKIN_TONES.slice(0, 5).map(t => (
                                <TouchableOpacity key={t.label} onPress={() => { setSkinTone(t.label); setSkinToneHex(t.hex); markDirty('about'); }}
                                    style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: t.hex, borderWidth: 2, borderColor: skinTone === t.label ? P.gold : 'transparent' }}>
                                    {skinTone === t.label && <Check size={10} color={t.hex === '#fcd9b8' || t.hex === '#f0cbb0' ? '#000' : '#fff'} style={{ alignSelf: 'center', marginTop: 3 }} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
                {showHeightDropdown && (
                    <View style={{ backgroundColor: P.surfaceLight, borderWidth: 1, borderColor: P.border, borderRadius: 14, maxHeight: 180, overflow: 'hidden', marginBottom: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: P.border, paddingHorizontal: 12, paddingVertical: 10 }}>
                            <Search size={14} color={P.textSecondary} />
                            <TextInput value={heightSearch} onChangeText={setHeightSearch} placeholder="Search" placeholderTextColor={P.textMuted} style={{ flex: 1, marginLeft: 8, color: P.textPrimary, fontFamily: 'Outfit-Regular', fontSize: 14 }} autoFocus />
                        </View>
                        <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 130 }}>
                            {filteredHeights.map(opt => (
                                <TouchableOpacity key={opt} onPress={() => { setHeight(opt); setShowHeightDropdown(false); markDirty('about'); }} style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: P.border }}>
                                    <Text style={{ color: height === opt ? P.gold : P.textPrimary, fontFamily: height === opt ? 'Outfit-Bold' : 'Outfit-Regular', fontSize: 14 }}>{opt}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </>
        );
    };

    // ── TAB 3: SKILLS — Tag Cloud Manager ──
    const renderIdentity = () => (
        <>
            {/* Always-visible search */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: `${P.pink}08`, borderWidth: 1.5, borderColor: `${P.pink}30`, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16 }}>
                <Search size={16} color={P.pink} />
                <TextInput value={skillSearch} onChangeText={(t) => { setSkillSearch(t); setShowSkillDropdown(true); }} placeholder="Search or add skill..." placeholderTextColor={P.textMuted}
                    style={{ flex: 1, marginLeft: 10, color: P.textPrimary, fontFamily: 'Outfit-Regular', fontSize: 14 }} />
                {skillSearch.length > 0 && <TouchableOpacity onPress={() => setSkillSearch('')}><X size={14} color={P.textSecondary} /></TouchableOpacity>}
            </View>
            {/* Dropdown */}
            {showSkillDropdown && skillSearch.length > 0 && (
                <View style={{ marginBottom: 16, backgroundColor: P.surfaceLight, borderRadius: 14, maxHeight: 160, overflow: 'hidden', borderWidth: 1, borderColor: `${P.pink}20` }}>
                    {!exactMatch && <TouchableOpacity onPress={() => toggleSkill(skillSearch.trim())} style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: P.border, flexDirection: 'row', alignItems: 'center', gap: 8 }}><Plus size={14} color={P.pink} /><Text style={{ color: P.pink, fontFamily: 'Outfit-Bold', fontSize: 11, textTransform: 'uppercase' }}>Add "{skillSearch}"</Text></TouchableOpacity>}
                    {filteredSkills.map(skill => (
                        <TouchableOpacity key={skill} onPress={() => toggleSkill(skill)} style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: P.border }}>
                            <Text style={{ color: P.textPrimary, fontFamily: 'Outfit-SemiBold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{skill}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
            {/* Skill pills */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {skills.map((skill, i) => (
                    <TouchableOpacity key={i} onPress={() => { setSkills(prev => prev.filter(s => s !== skill)); markDirty('identity'); }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${P.pink}12`, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100, borderWidth: 1, borderColor: `${P.pink}30`, transform: [{ rotate: `${(i % 3 - 1) * 0.8}deg` }] }}>
                        <Text style={{ color: P.pink, fontFamily: 'Outfit-Medium', fontSize: 13 }}>{skill}</Text>
                        <X size={12} color={P.pink} />
                    </TouchableOpacity>
                ))}
            </View>
            {/* Counter */}
            <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 10, color: P.pink, textTransform: 'uppercase', letterSpacing: 1.5, textAlign: 'right', marginTop: 12 }}>{skills.length} skill{skills.length !== 1 ? 's' : ''} selected</Text>
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
                <View style={{ position: 'relative', paddingLeft: 28 }}>
                    {/* Timeline line */}
                    {experience.length > 0 && <View style={{ position: 'absolute', left: 8, top: 6, bottom: 60, width: 2, backgroundColor: `${P.cyan}30`, borderRadius: 1 }} />}
                    {experience.map((exp, index) => {
                        const isExpanded = expandedEntries.has(index);
                        return (
                            <View key={index} style={{ position: 'relative', paddingBottom: 20 }}>
                                {/* Timeline dot */}
                                <View style={{ position: 'absolute', left: -24, top: 6, width: index === 0 ? 12 : 10, height: index === 0 ? 12 : 10, borderRadius: index === 0 ? 6 : 5, backgroundColor: P.cyan, borderWidth: 2, borderColor: P.bg, ...(index === 0 ? { shadowColor: P.cyan, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 8 } : {}) }} />
                                {/* Entry card */}
                                <View style={{ backgroundColor: `${P.cyan}04`, borderWidth: 1, borderColor: `${P.cyan}15`, borderRadius: 14, padding: 14 }}>
                                    <Pressable onPress={() => toggleExpand(index)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 14, color: P.textPrimary }}>{exp.role || exp.title || exp.projectName || 'New Entry'}</Text>
                                            {exp.date && <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 11, color: P.cyan, marginTop: 2 }}>{exp.date}</Text>}
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                            <TouchableOpacity onPress={() => handleRemove(index)} hitSlop={12}><Trash2 size={14} color={P.danger} /></TouchableOpacity>
                                            {isExpanded ? <ChevronUp size={16} color={P.cyan} /> : <ChevronDown size={16} color={P.textMuted} />}
                                        </View>
                                    </Pressable>
                                    {isExpanded && (
                                        <View style={{ gap: 10, marginTop: 14, borderTopWidth: 1, borderTopColor: `${P.cyan}10`, paddingTop: 14 }}>
                                            <MiniField label="Role / Title"><Input placeholder="Lead Singer" value={exp.role ?? exp.title ?? ''} onChangeText={(v) => handleChange(index, 'role', v)} /></MiniField>
                                            <MiniField label="Production / Project"><Input placeholder="Summer Fest 2024" value={exp.projectName ?? exp.title ?? ''} onChangeText={(v) => handleChange(index, 'projectName', v)} /></MiniField>
                                            <MiniField label="Organization"><Input placeholder="Moonlight Studios" value={exp.organization || ''} onChangeText={(v) => handleChange(index, 'organization', v)} /></MiniField>
                                            <MiniField label="Location"><Input placeholder="Main Stadium" value={exp.location ?? exp.venue ?? ''} onChangeText={(v) => handleChange(index, 'location', v)} /></MiniField>
                                            <AITextInput label="Description" placeholder="Describe your role..." value={exp.description || ''} onChangeText={(val: string) => handleChange(index, 'description', val)} />
                                            <MiniField label="Date"><Input placeholder="MM - YYYY or range" value={exp.date || ''} onChangeText={(v) => handleChange(index, 'date', v)} /></MiniField>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>
                <TouchableOpacity onPress={handleAdd} style={{ height: 48, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: `${P.cyan}50`, backgroundColor: `${P.cyan}06`, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
                    <Plus size={16} color={P.cyan} /><Text style={{ color: P.cyan, fontFamily: 'Outfit-Bold', fontSize: 13 }}>Add Experience</Text>
                </TouchableOpacity>
            </>
        );
    };

    // ── TAB 5: MEDIA — Bento Upload Grid ──
    const renderMedia = () => {
        const handlePickMedia = async (type: 'profile' | 'gallery' | 'video', index?: number) => {
            const mediaType = type === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images;
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: mediaType, allowsEditing: type === 'profile', aspect: type === 'profile' ? [1, 1] : [16, 9], quality: 0.8 });
            if (result.canceled) return;
            const asset = result.assets[0]; const isVideo = type === 'video';
            const validation = validateMediaFile(asset, isVideo);
            if (!validation.valid) { Alert.alert('Error', validation.error); return; }
            if (isLargeFile(asset)) { Alert.alert('Large File', 'Continue?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Continue', onPress: () => performUpload(type, asset, index) }]); return; }
            performUpload(type, asset, index);
        };
        const performUpload = async (type: 'profile' | 'gallery' | 'video', asset: ImagePicker.ImagePickerAsset, index?: number) => {
            const uploadKey = type === 'profile' ? 'profile' : `${type}-${index}`;
            setUploadingState((prev: any) => ({ ...prev, [uploadKey]: { progress: 0, uploading: true, localUri: asset.uri } }));
            const purpose = type === 'profile' ? 'avatar' as const : type === 'video' ? 'portfolio' as const : 'gallery' as const;
            const result = await uploadMediaFlow({ asset, entityType: 'user', entityId: user?._id || '', purpose, onProgress: (progress) => setUploadingState((prev: any) => ({ ...prev, [uploadKey]: { ...prev[uploadKey], progress, uploading: true } })) });
            setUploadingState((prev: any) => ({ ...prev, [uploadKey]: { ...prev[uploadKey], progress: 100, uploading: false } }));
            if (result.success && result.url) { if (type === 'profile') setProfileImageUrl(result.url!); else if (type === 'gallery' && index !== undefined) setGalleryUrls(prev => { const n = [...prev]; n[index] = result.url!; return n; }); else if (type === 'video' && index !== undefined) setVideoUrls(prev => { const n = [...prev]; n[index] = result.url!; return n; }); markDirty('media'); }
            else Alert.alert('Upload Failed', result.error || 'Unknown error');
        };
        const removeMedia = (type: 'gallery' | 'video', index: number) => { if (type === 'gallery') setGalleryUrls(prev => { const n = [...prev]; n[index] = ''; return n; }); else setVideoUrls(prev => { const n = [...prev]; n[index] = ''; return n; }); markDirty('media'); };
        const profileState = uploadingState['profile'];

        const MediaSlot = ({ type, index, url }: { type: 'gallery' | 'video'; index: number; url: string }) => {
            const uploadKey = `${type}-${index}`; const state = uploadingState[uploadKey]; const isUploading = state?.uploading;
            return (
                <View style={{ flex: 1, aspectRatio: type === 'video' ? 16 / 9 : 1, backgroundColor: `${P.green}06`, borderWidth: 1, borderColor: `${P.green}15`, borderRadius: 16, overflow: 'hidden' }}>
                    {url ? (<View style={{ flex: 1 }}>{type === 'video' ? (Platform.OS === 'web' ? <video src={url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ExpoVideo source={{ uri: url }} style={{ width: '100%', height: '100%' }} useNativeControls resizeMode={ResizeMode.COVER} shouldPlay={false} isLooping={false} />) : <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} />}<TouchableOpacity onPress={() => removeMedia(type, index)} style={{ position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={12} color={P.danger} /></TouchableOpacity></View>)
                    : isUploading ? (<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="small" color={P.green} /><Text style={{ color: P.textPrimary, fontFamily: 'Outfit-Bold', fontSize: 10, marginTop: 4 }}>{state?.progress || 0}%</Text></View>)
                    : (<TouchableOpacity onPress={() => handlePickMedia(type, index)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' }}>{type === 'video' ? <VideoIcon size={20} color={P.green} /> : <Plus size={20} color={P.green} />}<Text style={{ color: P.green, fontFamily: 'Outfit-Bold', fontSize: 9, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{type === 'video' ? 'Video' : 'Photo'}</Text></TouchableOpacity>)}
                </View>
            );
        };

        return (
            <>
                {/* Profile photo with gradient ring */}
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                    <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 10, color: P.green, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Profile Photo</Text>
                    <TouchableOpacity onPress={() => handlePickMedia('profile')} disabled={profileState?.uploading}>
                        <LinearGradient colors={[P.pink, P.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 126, height: 126, borderRadius: 27, padding: 3, alignItems: 'center', justifyContent: 'center' }}>
                            <View style={{ width: 120, height: 120, borderRadius: 24, backgroundColor: P.bg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                                {profileImageUrl ? <Image source={{ uri: profileImageUrl }} style={{ width: '100%', height: '100%' }} />
                                    : profileState?.uploading ? <><ActivityIndicator size="small" color={P.green} /><Text style={{ color: P.textPrimary, fontFamily: 'Outfit-Bold', fontSize: 10, marginTop: 4 }}>{profileState?.progress || 0}%</Text></>
                                    : <><Camera size={28} color={P.textMuted} /><Text style={{ color: P.textMuted, fontFamily: 'Outfit-Bold', fontSize: 9, marginTop: 4, textTransform: 'uppercase' }}>Upload</Text></>}
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
                {/* Gallery — 2+3 bento */}
                <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 10, color: P.green, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Gallery ({galleryUrls.filter(Boolean).length}/5)</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>{[0, 1].map(i => <MediaSlot key={i} type="gallery" index={i} url={galleryUrls[i] || ''} />)}</View>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>{[2, 3, 4].map(i => <MediaSlot key={i} type="gallery" index={i} url={galleryUrls[i] || ''} />)}</View>
                {/* Videos — 16:9 cinematic */}
                <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 10, color: P.green, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Reels ({videoUrls.filter(Boolean).length}/3)</Text>
                <View style={{ gap: 8 }}>{[0, 1, 2].map(i => <MediaSlot key={i} type="video" index={i} url={videoUrls[i] || ''} />)}</View>
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
                    <View key={p.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: i < SOCIAL_PLATFORMS.length - 1 ? 1 : 0, borderBottomColor: P.border }}>
                        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: `${p.color}18`, alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={20} color={p.color} />
                        </View>
                        <View style={{ flex: 1, gap: 4 }}>
                            <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 10, color: p.color, textTransform: 'uppercase', letterSpacing: 1.5 }}>{p.label}</Text>
                            <TextInput value={(socials as any)[p.key]} onChangeText={t => { setSocials(s => ({ ...s, [p.key]: t })); markDirty('socials'); }} placeholder={p.placeholder} placeholderTextColor={P.textMuted}
                                style={{ backgroundColor: `${P.surface}cc`, borderWidth: 1, borderColor: P.border, borderLeftWidth: 2, borderLeftColor: `${p.color}40`, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: P.textPrimary, fontFamily: 'Outfit-Regular', fontSize: 14 }} autoCapitalize="none" />
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
                <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 11, color: P.textMuted, fontStyle: 'italic', marginBottom: 16 }}>
                    Optional — fill this in when you want to post gigs as an organization.
                </Text>
                <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 10, color: P.cyan, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Type</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                    {ORG_TYPES.map(type => {
                        const isSelected = orgType === type.value; const OrgIcon = type.icon;
                        return (
                            <TouchableOpacity key={type.value} onPress={() => { setOrgType(type.value); markDirty('organization'); }} style={{ width: (SCREEN_WIDTH - 40 - 20 - 10) / 2, minHeight: 72, backgroundColor: isSelected ? `${P.cyan}08` : 'rgba(255,255,255,0.02)', borderRadius: 16, borderWidth: 1.5, borderColor: isSelected ? P.cyan : P.border, padding: 14, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <OrgIcon size={20} color={isSelected ? P.cyan : P.textMuted} />
                                <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 12, color: isSelected ? P.cyan : P.textSecondary }}>{type.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                <View style={{ height: 1, backgroundColor: P.border, marginBottom: 20 }} />
                <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 10, color: P.cyan, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Details</Text>
                <Field label="Organization Name" highlighted={isFieldMissing('organization')} accent={P.cyan}>
                    <Input value={orgName} onChangeText={set(setOrgName)} placeholder="Organization name" />
                </Field>
                <Field label="Website"><Input value={orgWebsite} onChangeText={set(setOrgWebsite)} placeholder="https://..." /></Field>
            </>
        );
    };

    // ── TAB 8: BILLING — Ruled Document ──
    const renderBilling = () => {
        const set = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); markDirty('billing'); };
        return (
            <>
                <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 11, color: P.gold, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Billing Details</Text>
                <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 11, color: P.textMuted, fontStyle: 'italic', marginBottom: 20 }}>Optional — only required if you'll invoice as a registered business.</Text>
                {/* Group 1: Business Identity */}
                <View style={{ borderLeftWidth: 2, borderLeftColor: `${P.gold}30`, paddingLeft: 16, backgroundColor: `${P.gold}02`, borderRadius: 14, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: 16, marginBottom: 20 }}>
                    <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 9, color: P.gold, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>Business Identity</Text>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: `${P.gold}10`, paddingBottom: 20, marginBottom: 20 }}>
                        <Field label="Legal Business Name"><Input value={legalBusinessName} onChangeText={set(setLegalBusinessName)} placeholder="Registered business name" /></Field>
                    </View>
                    <Field label="GST Number" style={{ marginBottom: 0 }}><Input value={gstNumber} onChangeText={set(setGstNumber)} placeholder="22AAAAA0000A1Z5" /></Field>
                </View>
                {/* Group 2: Address */}
                <View style={{ borderLeftWidth: 2, borderLeftColor: `${P.gold}30`, paddingLeft: 16, backgroundColor: `${P.gold}02`, borderRadius: 14, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: 16 }}>
                    <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 9, color: P.gold, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>Address</Text>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: `${P.gold}10`, paddingBottom: 20, marginBottom: 20 }}>
                        <Field label="Billing Address"><Input value={billingAddress} onChangeText={set(setBillingAddress)} placeholder="Street address" /></Field>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10, borderBottomWidth: 1, borderBottomColor: `${P.gold}10`, paddingBottom: 20, marginBottom: 20 }}>
                        <Field label="State" style={{ flex: 1, marginBottom: 0 }}><Input value={billingState} onChangeText={set(setBillingState)} placeholder="State" /></Field>
                        <Field label="Pincode" style={{ flex: 1, marginBottom: 0 }}><Input value={pincode} onChangeText={set(setPincode)} placeholder="560001" /></Field>
                    </View>
                    <Field label="Country" style={{ marginBottom: 0 }}><Input value={country} onChangeText={set(setCountry)} placeholder="India" /></Field>
                </View>
            </>
        );
    };

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'header': return renderHeader(); case 'about': return renderAbout();
            case 'identity': return renderIdentity(); case 'experience': return renderExperience();
            case 'media': return renderMedia(); case 'socials': return renderSocials();
            case 'organization': return renderOrganization(); case 'billing': return renderBilling();
            default: return null;
        }
    };

    if (!isVisible) return null;

    const currentTabDef = visibleTabs.find(t => t.key === activeTab);
    const isSaved = savedSection === activeTab;
    const tabAccent = currentTabDef?.color || P.orange;
    const tabGradient = currentTabDef?.gradient || [P.pink, P.orange];

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
                                <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 18, color: P.textPrimary, letterSpacing: -0.3 }}>Edit Profile</Text>
                                <TouchableOpacity
                                    onPress={handleClose}
                                    accessibilityLabel="Close edit modal"
                                    style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}>
                                    <X size={16} color={P.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {/* Tab Bar — per-tab accent colors */}
                            <View style={{ borderBottomWidth: 1, borderBottomColor: P.border }}>
                                <ScrollView ref={tabScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 6 }}>
                                    {visibleTabs.map((tab) => {
                                        const isActive = activeTab === tab.key;
                                        const isComplete = tab.checkComplete(profileData);
                                        const TabIcon = tab.icon;
                                        return (
                                            <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)}
                                                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14 }}>
                                                <TabIcon size={14} color={isActive ? P.textPrimary : P.textMuted} />
                                                <Text style={{ fontFamily: isActive ? 'Outfit-Bold' : 'Outfit-Medium', fontSize: 12, color: isActive ? P.textPrimary : P.textSecondary }}>
                                                    {tab.label}
                                                </Text>
                                                {tab.optional && (
                                                    <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 8, color: P.gold, letterSpacing: 1, textTransform: 'uppercase' }}>
                                                        OPTIONAL
                                                    </Text>
                                                )}
                                                {isComplete && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: P.green }} />}
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>
                            </View>

                            {/* Content */}
                            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                                {renderActiveTab()}
                            </ScrollView>

                            {/* Footer — per-tab gradient */}
                            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingVertical: 14, paddingBottom: Platform.OS === 'ios' ? 34 : 14, backgroundColor: P.bg, borderTopWidth: 1, borderTopColor: P.border, flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity onPress={handleClose} style={{ flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: P.border, alignItems: 'center' }}>
                                    <Text style={{ color: P.textSecondary, fontFamily: 'Outfit-Bold', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Cancel</Text>
                                </TouchableOpacity>
                                <Pressable onPress={handleSaveAll} disabled={isSaving} style={({ pressed }) => ({ flex: 1, opacity: isSaving ? 0.6 : pressed ? 0.9 : 1 })}>
                                    <LinearGradient colors={isSaved ? [P.green, '#059669'] : tabGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        {isSaving ? <ActivityIndicator size="small" color="#fff" /> : isSaved ? <Check size={16} color="#fff" /> : null}
                                        <Text style={{ color: '#fff', fontFamily: 'Outfit-Bold', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>
                                            {isSaving ? 'Saving…' : isSaved ? 'Saved!' : 'Save changes'}
                                        </Text>
                                    </LinearGradient>
                                </Pressable>
                            </View>

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

                        </TouchableOpacity>
                    </Animated.View>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </Modal>
    );
};
