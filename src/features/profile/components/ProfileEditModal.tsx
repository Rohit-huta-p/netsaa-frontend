import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    ScrollView,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
    Alert,
} from 'react-native';
import { X, Check, Plus, Search, ChevronDown, Trash2, Camera, Video as VideoIcon, Sparkles } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import { uploadMediaFlow, validateMediaFile, isLargeFile } from "@/utils/upload";
import { useProfileUiStore, SectionId } from '@/stores/profileUiStore';
import { useAuthStore } from '@/stores/authStore';
import authService from '@/services/authService';
import gigService from '@/services/gigService';
import { ProfileData, ExperienceEntry } from '@/components/profile/types';
import { AITextInput } from '@/components/ui/AITextInput';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SKILL_OPTIONS = [
    'Contemporary', 'Kathak', 'Hip Hop', 'Jazz', 'Classical',
    'Folk', 'Ballet', 'Salsa', 'Storytelling', 'Choreography',
    'Beatboxing', 'Freestyle', 'Improv', 'Voice Acting', 'Emceeing',
];

const SKIN_TONES = [
    { label: 'Fair', hex: '#fcd9b8' },
    { label: 'Light', hex: '#f0cbb0' },
    { label: 'Medium', hex: '#dcb084' },
    { label: 'Olive', hex: '#c29367' },
    { label: 'Tan', hex: '#a57245' },
    { label: 'Brown', hex: '#7b4b2a' },
    { label: 'Dark', hex: '#4b2a1a' },
];

const HEIGHT_OPTIONS = Array.from({ length: 37 }, (_, i) => {
    const feet = Math.floor(i / 12) + 4;
    const inches = i % 12;
    return `${feet}'${inches}"`;
});

const SECTION_TITLES: Partial<Record<SectionId, string>> = {
    header: 'Edit Profile',
    about: 'About & Physical',
    identity: 'Skills',
    socials: 'Social Links',
    organization: 'Organization',
    contact: 'Contact Info',
    media: 'Media',
};

type Props = {
    profileData: ProfileData;
    isOrganizer: boolean;
};

// ─── Reusable Field ───

const AccordionSection = ({ title, defaultExpanded = false, zIndex = 1, children }: { title: string, defaultExpanded?: boolean, zIndex?: number, children: React.ReactNode }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    return (
        <View className="mb-6" style={{ zIndex }}>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setExpanded(!expanded)}
                className=" flex-row items-center border-b border-white/10 pb-2 mb-4 justify-between"
            >
                <Text className="text-sm font-semibold text-white">{title}</Text>
                <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
                    <ChevronDown size={18} color="#71717a" />
                </View>
            </TouchableOpacity>
            {expanded && <View className="flex-col">{children}</View>}
        </View>
    );
};

const Field = ({ label, children, style }: { label: string; children: React.ReactNode, style?: any }) => (
    <View className="mb-5" style={style}>
        <Text className="text-zinc-500 text-[12px] uppercase font-bold tracking-widest mb-2">{label}</Text>
        {children}
    </View>
);

const Input = ({
    value,
    onChangeText,
    placeholder,
    multiline = false,
}: {
    value: string;
    onChangeText: (t: string) => void;
    placeholder: string;
    multiline?: boolean;
}) => (
    <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#52525b"
        multiline={multiline}
        className={`bg-[#18181bcc] border border-white/10 rounded-xl p-4 text-white text-sm ${multiline ? 'min-h-[120px]' : ''}`}
        style={{ textAlignVertical: multiline ? 'top' : 'center', outlineStyle: 'none' } as any}
    />
);

const Pill = ({
    label,
    isSelected,
    onPress,
    onRemove,
}: {
    label: string;
    isSelected?: boolean;
    onPress?: () => void;
    onRemove?: () => void;
}) => (
    <TouchableOpacity
        onPress={onPress}
        style={{
            backgroundColor: isSelected ? 'rgba(234,105,139,0.15)' : 'rgba(255,255,255,0.03)',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: isSelected ? '#ea698b' : 'rgba(255,255,255,0.1)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        }}
    >
        <Text
            style={{
                color: isSelected ? '#ea698b' : '#a1a1aa',
                fontWeight: '700',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
            }}
        >
            {label}
        </Text>
        {onRemove && (
            <TouchableOpacity onPress={onRemove} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={12} color={isSelected ? '#ea698b' : '#a1a1aa'} />
            </TouchableOpacity>
        )}
    </TouchableOpacity>
);

// ─── Main Component ───

export const ProfileEditModal: React.FC<Props> = ({ profileData, isOrganizer }) => {
    const { activeSheet, closeSheet } = useProfileUiStore();
    const { user, setAuth, accessToken } = useAuthStore();
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const [isSaving, setIsSaving] = useState(false);

    const section = activeSheet;
    const isVisible = !!section;

    // ─── Form State ───
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
    const [socials, setSocials] = useState({
        instagramHandle: '',
        youtubeUrl: '',
        spotifyUrl: '',
        soundcloudUrl: '',
    });
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

    // Reset form when section changes
    useEffect(() => {
        if (!isVisible) return;
        setDisplayName(profileData.fullName || '');
        setHeadline(profileData.headline || '');
        setArtistType(profileData.artistType || '');
        setLocation(profileData.location || '');
        setOrgName(profileData.organizationName || '');
        setBio(profileData.bio || '');
        setAge(profileData.age || '');
        setHeight(profileData.height || '');
        setShowHeightDropdown(false);
        setHeightSearch('');
        setSkinTone(profileData.skinTone || '');
        setSkinToneHex(profileData.skinToneHex || '');
        setSkills(profileData.skills || []);
        setSkillSearch('');
        setShowSkillDropdown(false);
        setSocials({
            instagramHandle: profileData.instagramHandle || '',
            youtubeUrl: profileData.youtubeUrl || '',
            spotifyUrl: profileData.spotifyUrl || '',
            soundcloudUrl: profileData.soundcloudUrl || '',
        });
        setOrgType(profileData.organizerTypeCategory || 'individual');
        setOrgWebsite(profileData.organizationWebsite || '');
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

    // Animation
    useEffect(() => {
        if (isVisible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                damping: 20,
                stiffness: 150,
            }).start();
        } else {
            slideAnim.setValue(SCREEN_HEIGHT);
        }
    }, [isVisible]);

    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
        }).start(() => closeSheet());
    };

    // ─── Save ───
    const handleSave = async () => {
        if (!user) return;

        // Validation: Date is required for professional history
        const missingDateIndex = experience.findIndex(exp => !exp.date?.trim());
        if (missingDateIndex !== -1) {
            Alert.alert("Required Field Missing", `Please enter a Date for Entry ${missingDateIndex + 1} in your Professional History.`);
            return;
        }

        setIsSaving(true);
        try {
            let authPayload: any = {
                displayName,
                headline,
                artistType,
                location,
                bio,
                age,
                height,
                skinTone,
                skinToneHex,
                skills,
                profileImageUrl,
                galleryUrls: galleryUrls.filter(Boolean),
                videoUrls: videoUrls.filter(Boolean),
                hasPhotos: galleryUrls.some(Boolean) || !!profileImageUrl,
                experience,
                ...socials
            };

            let orgPayload: any = {};
            if (isOrganizer) {
                orgPayload = {
                    organizationName: orgName,
                    organizerTypeCategory: orgType,
                    organizationWebsite: orgWebsite,
                    billingDetails: {
                        legalBusinessName,
                        gstNumber,
                        billingAddress,
                        state: billingState,
                        pincode,
                        country,
                    }
                };
            }

            let updatedUser = user;

            if (Object.keys(authPayload).length > 0) {
                updatedUser = await authService.updateProfile(authPayload);
            }
            if (Object.keys(orgPayload).length > 0 && isOrganizer) {
                const refreshedOrganizer = await authService.updateOrganizer(orgPayload);
                // Attach it statically so the UI cache is instantly refreshed 
                updatedUser = { ...updatedUser, organizerDetails: refreshedOrganizer };
            }

            setAuth({ user: { ...user, ...updatedUser }, accessToken: accessToken || '' });
            handleClose();
        } catch (err) {
            console.error('[ProfileEditModal] Save failed:', err);
        } finally {
            setIsSaving(false);
        }
    };

    // ─── Skills helpers ───
    const filteredSkills = SKILL_OPTIONS.filter(
        s => s.toLowerCase().includes(skillSearch.toLowerCase()) && !skills.includes(s)
    );
    const exactMatch = SKILL_OPTIONS.find(s => s.toLowerCase() === skillSearch.toLowerCase());

    const toggleSkill = (skill: string) => {
        setSkills(prev => (prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]));
        setSkillSearch('');
        setShowSkillDropdown(false);
    };

    // ─── Height helpers ───
    const filteredHeights = HEIGHT_OPTIONS.filter(h => h.includes(heightSearch));

    // ─── Section Renderers ───

    const renderHeader = () => (
        <>
            {isOrganizer ? (
                <Field label="Organization Name">
                    <Input value={orgName} onChangeText={setOrgName} placeholder="Organization name" />
                </Field>
            ) : (
                <Field label="Display Name">
                    <Input value={displayName} onChangeText={setDisplayName} placeholder="Your name" />
                </Field>
            )}
            <Field label="Headline">
                <Input value={headline} onChangeText={setHeadline} placeholder="Singer | Performer | 5+ years" />
            </Field>
            <Field label={isOrganizer ? 'Org Type' : 'Artist Type'}>
                <Input value={artistType} onChangeText={setArtistType} placeholder={isOrganizer ? 'Event Company' : 'Dancer, Singer...'} />
            </Field>
            <Field label="Location">
                <Input value={location} onChangeText={setLocation} placeholder="City, Country" />
            </Field>
        </>
    );

    const renderAbout = () => (
        <>
            {/* BIO */}
            <AITextInput
                label="Bio"
                value={bio}
                onChangeText={setBio}
                placeholder="Tell your story..."
                containerStyle={{ marginBottom: 13 }}
            />
            <View className='flex-row gap-2 w-full'>
                {/* AGE */}
                <Field label="Age" style={{ flex: 1, zIndex: 10 }}>
                    <Input value={age} onChangeText={setAge} placeholder="Age" />
                </Field>

                {/* HEIGHT */}
                <Field label="Height" style={{ flex: 1, zIndex: 20 }}>
                    <TouchableOpacity
                        onPress={() => {
                            setShowHeightDropdown(!showHeightDropdown);
                            setHeightSearch('');
                        }}
                        className="bg-[#18181bcc] border border-white/10 rounded-xl px-4 py-3 flex-row items-center justify-between"
                        style={{ height: 50 }}
                    >
                        <Text className={height ? "text-white text-sm" : "text-zinc-500 text-sm"}>
                            {height || "Select Height"}
                        </Text>
                        <ChevronDown size={16} color="#71717a" />
                    </TouchableOpacity>
                    {showHeightDropdown && (
                        <View className="absolute top-[60px] left-0 right-0 bg-zinc-800 border border-white/10 rounded-xl" style={{ maxHeight: 250, zIndex: 999 }}>
                            <View className="flex-row items-center border-b border-white/10 px-4 py-3">
                                <Search size={14} color="#71717a" />
                                <TextInput
                                    value={heightSearch}
                                    onChangeText={setHeightSearch}
                                    placeholder="Search (e.g. 5'8)"
                                    placeholderTextColor="#52525b"
                                    className="flex-1 text-white text-sm ml-2"
                                    autoFocus
                                />
                                {heightSearch.length > 0 && (
                                    <TouchableOpacity onPress={() => setHeightSearch('')}>
                                        <X size={14} color="#71717a" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <ScrollView
                                nestedScrollEnabled={true}
                                keyboardShouldPersistTaps="handled"
                                contentContainerStyle={{ paddingBottom: 10 }}
                                showsVerticalScrollIndicator={true}
                                style={{ width: '100%' }}
                            >
                                {filteredHeights.length === 0 ? (
                                    <View className="px-4 py-3">
                                        <Text className="text-zinc-500 text-sm italic">No heights match</Text>
                                    </View>
                                ) : filteredHeights.map(opt => (
                                    <TouchableOpacity
                                        key={opt}
                                        onPress={() => {
                                            setHeight(opt);
                                            setShowHeightDropdown(false);
                                            setHeightSearch('');
                                        }}
                                        className="px-4 py-3 border-b border-white/5"
                                    >
                                        <Text className={`text-sm ${height === opt ? 'text-pink-500 font-bold' : 'text-zinc-300'}`}>
                                            {opt}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </Field>
            </View>
            <Field label="Skin Tone">
                <View className="flex-row flex-wrap gap-3">
                    {SKIN_TONES.map(tone => {
                        const selected = skinTone === tone.label;
                        return (
                            <TouchableOpacity
                                key={tone.label}
                                onPress={() => {
                                    setSkinTone(tone.label);
                                    setSkinToneHex(tone.hex);
                                }}
                                style={{
                                    width: 25,
                                    height: 25,
                                    borderRadius: 9,
                                    backgroundColor: tone.hex,
                                    borderWidth: 2.5,
                                    borderColor: selected ? '#ea698b' : 'transparent',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {selected && <Check size={16} color={tone.hex === '#fcd9b8' || tone.hex === '#f0cbb0' ? '#000' : '#fff'} />}
                            </TouchableOpacity>
                        );
                    })}
                </View>
                {skinTone ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                        <View style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: skinToneHex || '#52525b',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.15)',
                        }} />
                        <Text className="text-zinc-400 text-xs italic">{skinTone}</Text>
                    </View>
                ) : null}
            </Field>
        </>
    );

    const renderIdentity = () => (
        <>
            <Field label="Your Skills">
                <View className="flex-row flex-wrap gap-2 mb-3">
                    {skills.map((skill, i) => (
                        <Pill key={i} label={skill} isSelected onRemove={() => setSkills(prev => prev.filter(s => s !== skill))} />
                    ))}
                    <TouchableOpacity
                        onPress={() => setShowSkillDropdown(!showSkillDropdown)}
                        className="bg-white/5 border border-white/10 px-3 py-2 rounded-lg items-center justify-center"
                    >
                        <Plus size={16} color="#a1a1aa" />
                    </TouchableOpacity>
                </View>
            </Field>
            {showSkillDropdown && (
                <View className="mb-4">
                    <View className="flex-row items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                        <Search size={14} color="#71717a" />
                        <TextInput
                            value={skillSearch}
                            onChangeText={setSkillSearch}
                            placeholder="Search or add skill..."
                            placeholderTextColor="#52525b"
                            className="flex-1 text-white text-sm ml-2"
                            autoFocus
                        />
                        {skillSearch.length > 0 && (
                            <TouchableOpacity onPress={() => setSkillSearch('')}>
                                <X size={14} color="#71717a" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <View className="mt-2 bg-zinc-800/80 rounded-xl max-h-40 overflow-hidden border border-white/10">
                        {skillSearch.length > 0 && !exactMatch && (
                            <TouchableOpacity
                                onPress={() => toggleSkill(skillSearch.trim())}
                                className="px-4 py-3 border-b border-white/5 flex-row items-center gap-2"
                            >
                                <Plus size={14} color="#ea698b" />
                                <Text className="text-pink-500 text-xs font-bold uppercase">Add "{skillSearch}"</Text>
                            </TouchableOpacity>
                        )}
                        {filteredSkills.map(skill => (
                            <TouchableOpacity
                                key={skill}
                                onPress={() => toggleSkill(skill)}
                                className="px-4 py-3 border-b border-white/5"
                            >
                                <Text className="text-zinc-300 text-xs font-bold uppercase">{skill}</Text>
                            </TouchableOpacity>
                        ))}
                        {filteredSkills.length === 0 && skillSearch.length === 0 && (
                            <View className="px-4 py-3">
                                <Text className="text-zinc-500 text-xs font-medium italic">Type to search skills</Text>
                            </View>
                        )}
                    </View>
                </View>
            )}
        </>
    );

    const renderSocials = () => (
        <>
            <Field label="Instagram Handle">
                <Input value={socials.instagramHandle} onChangeText={t => setSocials(s => ({ ...s, instagramHandle: t }))} placeholder="username" />
            </Field>
            <Field label="YouTube URL">
                <Input value={socials.youtubeUrl} onChangeText={t => setSocials(s => ({ ...s, youtubeUrl: t }))} placeholder="https://youtube.com/..." />
            </Field>
            <Field label="Spotify URL">
                <Input value={socials.spotifyUrl} onChangeText={t => setSocials(s => ({ ...s, spotifyUrl: t }))} placeholder="https://open.spotify.com/..." />
            </Field>
            <Field label="SoundCloud URL">
                <Input value={socials.soundcloudUrl} onChangeText={t => setSocials(s => ({ ...s, soundcloudUrl: t }))} placeholder="https://soundcloud.com/..." />
            </Field>
        </>
    );

    const ORG_TYPES = [
        { label: 'Individual', value: 'individual' },
        { label: 'Academy', value: 'academy' },
        { label: 'Registered Business', value: 'registered_business' },
        { label: 'Agency', value: 'agency' },
        { label: 'Venue', value: 'venue' },
        { label: 'Brand', value: 'brand' },
        { label: 'Corporate', value: 'corporate' },
    ];

    const renderOrganization = () => (
        <>
            <Field label="Type / Category">
                <View className="flex-row flex-wrap gap-2">
                    {ORG_TYPES.map(type => {
                        const isSelected = orgType === type.value;
                        return (
                            <TouchableOpacity
                                key={type.value}
                                onPress={() => setOrgType(type.value)}
                                style={{
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    borderRadius: 8,
                                    backgroundColor: isSelected ? 'rgba(234,105,139,0.15)' : 'rgba(255,255,255,0.05)',
                                    borderWidth: 1,
                                    borderColor: isSelected ? '#ea698b' : 'rgba(255,255,255,0.1)',
                                }}
                            >
                                <Text style={{ color: isSelected ? '#ea698b' : '#a1a1aa', fontSize: 13, fontWeight: '600' }}>
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </Field>
            <Field label="Website">
                <Input value={orgWebsite} onChangeText={setOrgWebsite} placeholder="https://..." />
            </Field>
        </>
    );

    const renderBilling = () => (
        <>
            <Field label="Legal Business Name">
                <Input value={legalBusinessName} onChangeText={setLegalBusinessName} placeholder="Registered business name" />
            </Field>
            <Field label="GST Number">
                <Input value={gstNumber} onChangeText={setGstNumber} placeholder="22AAAAA0000A1Z5" />
            </Field>
            <Field label="Billing Address">
                <Input value={billingAddress} onChangeText={setBillingAddress} placeholder="Street address" />
            </Field>
            <View className="flex-row gap-4">
                <View className="flex-1">
                    <Field label="State">
                        <Input value={billingState} onChangeText={setBillingState} placeholder="State" />
                    </Field>
                </View>
                <View className="flex-1">
                    <Field label="Pincode">
                        <Input value={pincode} onChangeText={setPincode} placeholder="560001" />
                    </Field>
                </View>
            </View>
            <Field label="Country">
                <Input value={country} onChangeText={setCountry} placeholder="India" />
            </Field>
        </>
    );

    const renderMedia = () => {
        const handlePickMedia = async (type: 'profile' | 'gallery' | 'video', index?: number) => {
            const mediaType = type === 'video'
                ? ImagePicker.MediaTypeOptions.Videos
                : ImagePicker.MediaTypeOptions.Images;

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: mediaType,
                allowsEditing: type === 'profile',
                aspect: type === 'profile' ? [1, 1] : [16, 9],
                quality: 0.8,
            });

            if (result.canceled) return;

            const asset = result.assets[0];
            const isVideo = type === 'video';

            const validation = validateMediaFile(asset, isVideo);
            if (!validation.valid) {
                Alert.alert('Error', validation.error);
                return;
            }

            if (isLargeFile(asset)) {
                Alert.alert(
                    'Large File',
                    'This file is large and may take a while to upload. Continue?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Continue', onPress: () => performUpload(type, asset, index) }
                    ]
                );
                return;
            }

            performUpload(type, asset, index);
        };

        const performUpload = async (
            type: 'profile' | 'gallery' | 'video',
            asset: ImagePicker.ImagePickerAsset,
            index?: number
        ) => {
            const uploadKey = type === 'profile' ? 'profile' : `${type}-${index}`;

            setUploadingState((prev: any) => ({
                ...prev,
                [uploadKey]: { progress: 0, uploading: true, localUri: asset.uri }
            }));

            const purpose = type === 'profile'
                ? 'avatar' as const
                : type === 'video'
                    ? 'portfolio' as const
                    : 'gallery' as const;

            const result = await uploadMediaFlow({
                asset,
                entityType: 'user',
                entityId: user?._id || '',
                purpose,
                onProgress: (progress) => {
                    setUploadingState((prev: any) => ({
                        ...prev,
                        [uploadKey]: { ...prev[uploadKey], progress, uploading: true }
                    }));
                }
            });

            setUploadingState((prev: any) => ({
                ...prev,
                [uploadKey]: { ...prev[uploadKey], progress: 100, uploading: false }
            }));

            if (result.success && result.url) {
                if (type === 'profile') {
                    setProfileImageUrl(result.url!);
                } else if (type === 'gallery' && index !== undefined) {
                    setGalleryUrls(prev => {
                        const newUrls = [...prev];
                        newUrls[index] = result.url!;
                        return newUrls;
                    });
                } else if (type === 'video' && index !== undefined) {
                    setVideoUrls(prev => {
                        const newUrls = [...prev];
                        newUrls[index] = result.url!;
                        return newUrls;
                    });
                }
            } else {
                Alert.alert('Upload Failed', result.error || 'Unknown error');
            }
        };

        const removeMedia = (type: 'gallery' | 'video', index: number) => {
            if (type === 'gallery') {
                setGalleryUrls(prev => {
                    const newUrls = [...prev];
                    newUrls[index] = '';
                    return newUrls;
                });
            } else {
                setVideoUrls(prev => {
                    const newUrls = [...prev];
                    newUrls[index] = '';
                    return newUrls;
                });
            }
        };

        const renderUploadSlot = (
            type: 'gallery' | 'video',
            index: number,
            url: string,
            aspectRatio: string = 'aspect-square'
        ) => {
            const uploadKey = `${type}-${index}`;
            const state = uploadingState[uploadKey];
            const isUploading = state?.uploading;

            return (
                <View key={`${type}-${index}`} className={`${aspectRatio} w-full bg-white/5 border border-white/10 rounded-xl overflow-hidden relative mb-2`}>
                    {url ? (
                        <>
                            {type === 'video' ? (
                                Platform.OS === 'web' ? (
                                    <video
                                        src={url}
                                        controls
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <ExpoVideo
                                        source={{ uri: url }}
                                        style={{ width: '100%', height: '100%' }}
                                        useNativeControls
                                        resizeMode={ResizeMode.COVER}
                                        shouldPlay={false}
                                        isLooping={false}
                                    />
                                )
                            ) : (
                                <Image source={{ uri: url }} className="w-full h-full" />
                            )}
                            <TouchableOpacity
                                onPress={() => removeMedia(type, index)}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 items-center justify-center"
                            >
                                <Trash2 size={14} color="#ef4444" />
                            </TouchableOpacity>
                        </>
                    ) : state?.localUri && type !== 'video' ? (
                        <View className="w-full h-full relative">
                            <Image source={{ uri: state.localUri }} className="w-full h-full" />
                            {isUploading && (
                                <View className="absolute inset-0 items-center justify-center bg-black/40">
                                    <ActivityIndicator size="small" color="#ea698b" />
                                    <Text className="text-white text-[10px] mt-2">{state?.progress || 0}%</Text>
                                </View>
                            )}
                        </View>
                    ) : isUploading ? (
                        <View className="w-full h-full items-center justify-center bg-black/40">
                            <ActivityIndicator size="small" color="#ea698b" />
                            <Text className="text-white text-[10px] mt-2">{state?.progress || 0}%</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => handlePickMedia(type, index)}
                            className="w-full h-full items-center justify-center"
                        >
                            {type === 'video' ? (
                                <VideoIcon size={24} color="#3f3f46" />
                            ) : (
                                <Plus size={24} color="#3f3f46" />
                            )}
                            <Text className="text-zinc-600 text-[10px] mt-2 uppercase tracking-widest text-center">
                                {type === 'video' ? 'Add Video' : 'Add Photo'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            );
        };

        const profileState = uploadingState['profile'];

        return (
            <View className="w-full mt-2">
                {/* Profile Image */}
                <Field label="Profile Photo">
                    <TouchableOpacity
                        onPress={() => handlePickMedia('profile')}
                        className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-dashed border-white/20 items-center justify-center"
                        disabled={profileState?.uploading}
                    >
                        {profileImageUrl ? (
                            <Image source={{ uri: profileImageUrl }} className="w-full h-full" />
                        ) : profileState?.localUri ? (
                            <View className="w-full h-full relative">
                                <Image source={{ uri: profileState.localUri }} className="w-full h-full" />
                                {profileState?.uploading && (
                                    <View className="absolute inset-0 items-center justify-center bg-black/40">
                                        <ActivityIndicator size="small" color="#ea698b" />
                                        <Text className="text-white text-[10px] mt-2">{profileState?.progress || 0}%</Text>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View className="items-center">
                                <Camera size={28} color="#3f3f46" />
                                <Text className="text-zinc-600 text-[10px] mt-2 uppercase">Upload</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </Field>

                {/* Photo Gallery - 5 slots */}
                <Field label="Photo Gallery">
                    <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-zinc-600 text-[10px]">{galleryUrls.filter(u => u).length}/5 Added</Text>
                    </View>
                    <View className="flex-row flex-wrap gap-2">
                        {[0, 1, 2, 3, 4].map(i => (
                            <View key={i} className="w-[31%]">
                                {renderUploadSlot('gallery', i, galleryUrls[i] || '', 'aspect-square')}
                            </View>
                        ))}
                    </View>
                </Field>

                {/* Video Reels - 3 slots */}
                <Field label="Video Reels">
                    <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-zinc-600 text-[10px]">{videoUrls.filter(u => u).length}/3 Added</Text>
                    </View>
                    <View className="flex-row gap-2">
                        {[0, 1, 2].map(i => (
                            <View key={i} className="flex-1">
                                {renderUploadSlot('video', i, videoUrls[i] || '', 'aspect-[9/16]')}
                            </View>
                        ))}
                    </View>
                </Field>
            </View>
        );
    };

    // ─── Render Experience ───
    const renderExperience = () => {
        const handleAdd = () => {
            setExperience([...experience, { role: '', projectName: '', organization: '', location: '', description: '', date: '' }]);
        };
        const handleRemove = (index: number) => {
            const newExp = [...experience];
            newExp.splice(index, 1);
            setExperience(newExp);
        };
        const handleChange = (index: number, field: keyof ExperienceEntry, value: string) => {
            const newExp = [...experience];
            newExp[index] = { ...newExp[index], [field]: value };
            setExperience(newExp);
        };



        return (
            <Field label="Professional History">
                {experience.map((exp, index) => (
                    <View key={index} style={{ marginBottom: 16, padding: 12, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={{ color: "#a1a1aa", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>Entry {index + 1}</Text>
                            <TouchableOpacity onPress={() => handleRemove(index)} style={{ padding: 4 }}>
                                <X size={16} color="#ef4444" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ gap: 8 }}>
                            {!isOrganizer && (
                                <>
                                    <View style={{ gap: 4 }}>
                                        <Text className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest ml-1">Role / Title</Text>
                                        <TextInput
                                            placeholder="Role (e.g. Lead Singer)"
                                            placeholderTextColor="#52525b"
                                            value={exp.role ?? exp.title ?? ''} // Fallback to title for legacy data
                                            onChangeText={(val) => handleChange(index, 'role', val)}
                                            style={{ height: 44, borderRadius: 12, backgroundColor: "rgba(24,24,27,0.8)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#fff", paddingHorizontal: 14, fontSize: 14, outlineStyle: 'none' } as any}
                                        />
                                    </View>
                                    <View style={{ gap: 4 }}>
                                        <Text className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest ml-1">Production / Project Name</Text>
                                        <TextInput
                                            placeholder="Project Name (e.g. The Grand Show)"
                                            placeholderTextColor="#52525b"
                                            value={exp.projectName || ''}
                                            onChangeText={(val) => handleChange(index, 'projectName', val)}
                                            style={{ height: 44, borderRadius: 12, backgroundColor: "rgba(24,24,27,0.8)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#fff", paddingHorizontal: 14, fontSize: 14, outlineStyle: 'none' } as any}
                                        />
                                    </View>
                                    <View style={{ gap: 4 }}>
                                        <Text className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest ml-1">Organization / Production House</Text>
                                        <TextInput
                                            placeholder="Organization (e.g. Moonlight Studios)"
                                            placeholderTextColor="#52525b"
                                            value={exp.organization || ''}
                                            onChangeText={(val) => handleChange(index, 'organization', val)}
                                            style={{ height: 44, borderRadius: 12, backgroundColor: "rgba(24,24,27,0.8)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#fff", paddingHorizontal: 14, fontSize: 14, outlineStyle: 'none' } as any}
                                        />
                                    </View>
                                </>
                            )}
                            {isOrganizer && (
                                <>
                                    {/* Project Title Input */}
                                    <View style={{ gap: 4 }}>
                                        <Text className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest ml-1">Project / Event Title</Text>
                                        <TextInput
                                            placeholder="Event Title (e.g. Summer Fest 2024)"
                                            placeholderTextColor="#52525b"
                                            value={exp.projectName ?? exp.title ?? ''} // Fallback to title for legacy data
                                            onChangeText={(val) => handleChange(index, 'projectName', val)}
                                            style={{ height: 44, borderRadius: 12, backgroundColor: "rgba(24,24,27,0.8)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#fff", paddingHorizontal: 14, fontSize: 14, outlineStyle: 'none' } as any}
                                        />
                                    </View>
                                    {/* Organization Name Input */}
                                    <View style={{ gap: 4 }}>
                                        <Text className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest ml-1">
                                            Organization / Company <Text style={{ textTransform: 'none', fontWeight: '400', color: '#71717a' }}>(Optional)</Text>
                                        </Text>
                                        <TextInput
                                            placeholder="Organization (e.g. Live Events Co.)"
                                            placeholderTextColor="#52525b"
                                            value={exp.organization || ''}
                                            onChangeText={(val) => handleChange(index, 'organization', val)}
                                            style={{ height: 44, borderRadius: 12, backgroundColor: "rgba(24,24,27,0.8)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#fff", paddingHorizontal: 14, fontSize: 14, outlineStyle: 'none' } as any}
                                        />
                                    </View>
                                    <View style={{ gap: 4 }}>
                                        <Text className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest ml-1">Role</Text>
                                        <TextInput
                                            placeholder="Role (e.g. Event Manager)"
                                            placeholderTextColor="#52525b"
                                            value={exp.role || ''}
                                            onChangeText={(val) => handleChange(index, 'role', val)}
                                            style={{ height: 44, borderRadius: 12, backgroundColor: "rgba(24,24,27,0.8)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#fff", paddingHorizontal: 14, fontSize: 14, outlineStyle: 'none' } as any}
                                        />
                                    </View>
                                    <View style={{ gap: 4 }}>
                                        <Text className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest ml-1">Location (City / Venue)</Text>
                                        <TextInput
                                            placeholder="Location (e.g. Main Stadium)"
                                            placeholderTextColor="#52525b"
                                            value={exp.location ?? exp.venue ?? ''} // Fallback to venue
                                            onChangeText={(val) => handleChange(index, 'location', val)}
                                            style={{ height: 44, borderRadius: 12, backgroundColor: "rgba(24,24,27,0.8)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#fff", paddingHorizontal: 14, fontSize: 14, outlineStyle: 'none' } as any}
                                        />
                                    </View>
                                </>
                            )}
                            <AITextInput
                                label="Description"
                                placeholder={isOrganizer ? "Detailed description of the project and your role..." : "Detailed description of your role and contributions..."}
                                value={exp.description || ''}
                                onChangeText={(val: string) => handleChange(index, 'description', val)}
                            />
                            <View style={{ gap: 4 }}>
                                <Text className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest ml-1">Date</Text>
                                <TextInput
                                    placeholder="Date (MM - YYYY or range)"
                                    placeholderTextColor="#52525b"
                                    value={exp.date || ''}
                                    onChangeText={(val) => handleChange(index, 'date', val)}
                                    style={{ height: 44, borderRadius: 12, backgroundColor: "rgba(24,24,27,0.8)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#fff", paddingHorizontal: 14, fontSize: 14, outlineStyle: 'none' } as any}
                                />
                            </View>
                        </View>
                    </View>
                ))}

                <TouchableOpacity
                    onPress={handleAdd}
                    style={{
                        height: 44,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderStyle: "dashed",
                        borderColor: "rgba(234,105,139,0.4)",
                        backgroundColor: "rgba(234,105,139,0.05)",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        gap: 8,
                        marginTop: 4,
                    }}
                >
                    <Plus size={16} color="#ea698b" />
                    <Text style={{ color: "#ea698b", fontSize: 13, fontWeight: "700" }}>Add Experience</Text>
                </TouchableOpacity>
            </Field>
        );
    };

    if (!isVisible) return null;

    return (
        <Modal visible transparent animationType="none" onRequestClose={handleClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Backdrop */}
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={handleClose}
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.75)',
                        justifyContent: 'flex-end',
                    }}
                >
                    {/* Panel */}
                    <Animated.View
                        style={{
                            transform: [{ translateY: slideAnim }],
                            flex: 1,
                            marginTop: Platform.OS === 'ios' ? 60 : 40,
                            backgroundColor: '#18181b',
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            borderWidth: 1,
                            borderBottomWidth: 0,
                            borderColor: 'rgba(255,255,255,0.08)',
                            overflow: 'hidden',
                        }}
                    >
                        <TouchableOpacity activeOpacity={1} style={{ flex: 1 }}>
                            {/* Handle bar */}
                            <View className="items-center pt-3 pb-1 mb-2">
                                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)' }} />
                            </View>

                            {/* Header */}
                            <View className="flex-row items-center justify-between px-6 pb-4 border-b border-white/5">
                                <Text className="text-white text-lg font-bold tracking-tight">Edit Profile</Text>
                                <TouchableOpacity
                                    onPress={handleClose}
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 16,
                                        backgroundColor: 'rgba(255,255,255,0.06)',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <X size={16} color="#71717a" />
                                </TouchableOpacity>
                            </View>

                            {/* Form */}
                            <ScrollView
                                className="px-6 pt-6"
                                contentContainerStyle={{ paddingBottom: 120 }}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                <AccordionSection title="Basic Header" defaultExpanded={section === 'header'} zIndex={60}>
                                    {renderHeader()}
                                </AccordionSection>
                                <AccordionSection title="About & Physical" defaultExpanded={section === 'about' || section === 'basic'} zIndex={50}>
                                    {renderAbout()}
                                </AccordionSection>
                                <AccordionSection title="Skills" defaultExpanded={section === 'identity'} zIndex={40}>
                                    {renderIdentity()}
                                </AccordionSection>
                                <AccordionSection title="Professional History" defaultExpanded={section === 'experience'} zIndex={35}>
                                    {renderExperience()}
                                </AccordionSection>
                                <AccordionSection title="Social Links" defaultExpanded={section === 'socials'} zIndex={30}>
                                    {renderSocials()}
                                </AccordionSection>
                                <AccordionSection title="Media" defaultExpanded={section === 'media'} zIndex={25}>
                                    {renderMedia()}
                                </AccordionSection>
                                {isOrganizer && (
                                    <>
                                        <AccordionSection title="Organization Details" defaultExpanded={section === 'organization'} zIndex={20}>
                                            {renderOrganization()}
                                        </AccordionSection>
                                        <AccordionSection title="Billing Details" defaultExpanded={section === 'billing' as any} zIndex={10}>
                                            {renderBilling()}
                                        </AccordionSection>
                                    </>
                                )}
                            </ScrollView>

                            {/* Footer actions */}
                            <View
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    paddingHorizontal: 24,
                                    paddingVertical: 16,
                                    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
                                    backgroundColor: '#18181b',
                                    borderTopWidth: 1,
                                    borderTopColor: 'rgba(255,255,255,0.05)',
                                    flexDirection: 'row',
                                    gap: 12,
                                }}
                            >
                                <TouchableOpacity
                                    onPress={handleClose}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 14,
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ color: '#a1a1aa', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleSave}
                                    disabled={isSaving}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 14,
                                        borderRadius: 12,
                                        backgroundColor: '#ea698b',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        opacity: isSaving ? 0.6 : 1,
                                    }}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Check size={16} color="#fff" />
                                    )}
                                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                                        Save
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </Modal>
    );
};
