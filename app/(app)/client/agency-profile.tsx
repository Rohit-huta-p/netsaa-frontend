import { useState, useEffect, type ReactNode } from 'react';
import {
    View, Text, Pressable, TextInput, ActivityIndicator, ScrollView, Image, Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, Camera, Plus, Trash2, Building } from 'lucide-react-native';
import authService from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { useOrganizer } from '@/hooks/useOrganizer';
import { uploadMediaFlow, validateMediaFile } from '@/utils/upload';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';

/**
 * Agency profile edit (Client Experience spec Part D / D.1, agency tier).
 * A form over the Organizer showcase fields — logo, bio, website, services,
 * photo gallery, years in business, team size — prefilled from `useOrganizer()`.
 * Logo + gallery upload via the shared `uploadMediaFlow` (presign → S3 → CDN url),
 * mirroring ProfileEditModal's media tab. Save patches /organizers/me and
 * invalidates ['organizer','me'] so the home + this screen refresh.
 * Agency-only — non-agency clients see a switch-account notice.
 */

const SERVICE_OPTIONS = [
    'Live Music', 'DJ', 'Dance', 'Anchoring', 'Decor', 'Photography',
    'Sound & Light', 'Choreography', 'Event Planning', 'Hosting',
];

const MAX_PHOTOS = 8;
const BIO_MAX = 600;

export default function AgencyProfile() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const navClearance = (useMobileTabBarHeight() || 64) + 56;
    const user = useAuthStore((s) => s.user) as any;
    const userId = user?._id || '';
    const { organizer, isAgency } = useOrganizer();

    // ── Form state (prefilled once the organizer doc resolves) ──
    const [logoUrl, setLogoUrl] = useState('');
    const [bio, setBio] = useState('');
    const [website, setWebsite] = useState('');
    const [services, setServices] = useState<string[]>([]);
    const [photos, setPhotos] = useState<string[]>([]);
    const [yearsInBusiness, setYearsInBusiness] = useState('');
    const [teamSize, setTeamSize] = useState('');

    // Upload progress: logo flag + a per-slot map for gallery uploads.
    const [logoUploading, setLogoUploading] = useState(false);
    const [photosUploading, setPhotosUploading] = useState(0);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [prefilled, setPrefilled] = useState(false);

    const uploading = logoUploading || photosUploading > 0;

    // Prefill from the organizer doc once (it arrives async via React Query).
    useEffect(() => {
        if (!organizer || prefilled) return;
        setLogoUrl(organizer.logoUrl || '');
        setBio(organizer.bio || '');
        setWebsite(organizer.organizationWebsite || '');
        setServices(organizer.services || []);
        setPhotos(organizer.photos || []);
        setYearsInBusiness(
            organizer.yearsInBusiness != null ? String(organizer.yearsInBusiness) : ''
        );
        setTeamSize(organizer.teamSize != null ? String(organizer.teamSize) : '');
        setPrefilled(true);
    }, [organizer, prefilled]);

    const toggleService = (svc: string) =>
        setServices((prev) => (prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]));

    // ── Media upload (mirror ProfileEditModal's media tab) ──
    const pickLogo = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (result.canceled) return;
        const asset = result.assets[0];
        const validation = validateMediaFile(asset, false);
        if (!validation.valid) { Alert.alert('Invalid image', validation.error); return; }
        setLogoUploading(true);
        const res = await uploadMediaFlow({ asset, entityType: 'organizer', entityId: userId, purpose: 'logo' });
        setLogoUploading(false);
        if (res.success && res.url) setLogoUrl(res.url);
        else Alert.alert('Upload failed', res.error || 'Unknown error');
    };

    const pickPhoto = async () => {
        if (photos.length >= MAX_PHOTOS) return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8,
        });
        if (result.canceled) return;
        const asset = result.assets[0];
        const validation = validateMediaFile(asset, false);
        if (!validation.valid) { Alert.alert('Invalid image', validation.error); return; }
        setPhotosUploading((n) => n + 1);
        const res = await uploadMediaFlow({ asset, entityType: 'organizer', entityId: userId, purpose: 'gallery' });
        setPhotosUploading((n) => Math.max(0, n - 1));
        if (res.success && res.url) setPhotos((prev) => [...prev, res.url!].slice(0, MAX_PHOTOS));
        else Alert.alert('Upload failed', res.error || 'Unknown error');
    };

    const removePhoto = (idx: number) =>
        setPhotos((prev) => prev.filter((_, i) => i !== idx));

    const save = async () => {
        if (saving || uploading) return; // guard double-submit + in-flight uploads
        setSaving(true);
        setError('');
        setSaved(false);
        try {
            await authService.updateOrganizerProfile({
                logoUrl,
                organizationWebsite: website.trim(),
                bio: bio.trim(),
                services,
                photos,
                ...(yearsInBusiness.trim() ? { yearsInBusiness: Number(yearsInBusiness) } : {}),
                ...(teamSize.trim() ? { teamSize: Number(teamSize) } : {}),
            });
            queryClient.invalidateQueries({ queryKey: ['organizer', 'me'] });
            setSaved(true);
            setTimeout(() => router.back(), 700);
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Could not save. Try again.');
        } finally {
            setSaving(false);
        }
    };

    // ── Non-agency guard ──
    if (!isAgency) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={{ flex: 1, backgroundColor: '#09090b', paddingTop: 64, paddingHorizontal: 20 }}>
                    <Pressable onPress={() => router.back()} className="mb-6">
                        <ChevronLeft size={22} color="#a1a1aa" />
                    </Pressable>
                    <View className="flex-1 items-center justify-center -mt-20">
                        <View className="w-14 h-14 rounded-full bg-[#FF6B35]/12 items-center justify-center mb-4">
                            <Building size={24} color="#FF6B35" />
                        </View>
                        <Text style={{ fontFamily: 'DMSerifDisplay_400Regular' }} className="text-zinc-100 text-[19px] text-center mb-2">
                            Agency profile
                        </Text>
                        <Text style={{ fontFamily: 'Outfit-Regular' }} className="text-zinc-500 text-[13px] text-center leading-5 px-6 mb-6">
                            Switch to an agency account to set up your supplier profile.
                        </Text>
                        <Pressable
                            onPress={() => router.push('/(app)/client/business' as any)}
                            className="bg-[#FF6B35] rounded-xl px-6 py-3.5"
                        >
                            <Text style={{ fontFamily: 'Outfit-SemiBold' }} className="text-[#1A0D06] text-[14px]">
                                Business account
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </>
        );
    }

    const Label = ({ children }: { children: ReactNode }) => (
        <Text
            style={{ fontFamily: 'Outfit-SemiBold' }}
            className="text-zinc-500 text-[11px] uppercase tracking-wider mb-2 mt-6"
        >
            {children}
        </Text>
    );

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView
                style={{ flex: 1, backgroundColor: '#09090b' }}
                contentContainerStyle={{ paddingTop: 64, paddingHorizontal: 20, paddingBottom: navClearance }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Pressable onPress={() => router.back()} className="mb-4">
                    <ChevronLeft size={22} color="#a1a1aa" />
                </Pressable>

                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular' }} className="text-zinc-100 text-[22px] mb-1">
                    Edit agency profile
                </Text>
                <Text style={{ fontFamily: 'Outfit-Regular' }} className="text-zinc-500 text-[13px] mb-2 leading-5">
                    Your public supplier profile — what clients see when they consider hiring your agency.
                </Text>

                {/* Logo */}
                <Label>Logo</Label>
                <Pressable onPress={pickLogo} disabled={logoUploading} className="self-start">
                    <View className="w-[96px] h-[96px] rounded-2xl bg-white/[0.04] border border-white/10 items-center justify-center overflow-hidden">
                        {logoUploading ? (
                            <ActivityIndicator color="#FF6B35" />
                        ) : logoUrl ? (
                            <Image source={{ uri: logoUrl }} className="w-full h-full" />
                        ) : (
                            <View className="items-center">
                                <Camera size={22} color="#71717a" />
                                <Text style={{ fontFamily: 'Outfit-SemiBold' }} className="text-zinc-500 text-[10px] mt-1 uppercase tracking-wide">
                                    Add
                                </Text>
                            </View>
                        )}
                    </View>
                </Pressable>

                {/* Bio */}
                <Label>Bio</Label>
                <TextInput
                    value={bio}
                    onChangeText={(t) => setBio(t.slice(0, BIO_MAX))}
                    placeholder="What your agency does, who you work with, what makes you stand out…"
                    placeholderTextColor="#52525b"
                    multiline
                    style={{ fontFamily: 'Outfit-Regular', minHeight: 110, textAlignVertical: 'top' }}
                    className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-zinc-100 text-[14px]"
                />
                <Text style={{ fontFamily: 'Outfit-Regular' }} className="text-zinc-600 text-[11px] text-right mt-1">
                    {bio.length}/{BIO_MAX}
                </Text>

                {/* Website */}
                <Label>Website</Label>
                <TextInput
                    value={website}
                    onChangeText={setWebsite}
                    placeholder="https://youragency.com"
                    placeholderTextColor="#52525b"
                    autoCapitalize="none"
                    keyboardType="url"
                    style={{ fontFamily: 'Outfit-Regular' }}
                    className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-zinc-100 text-[14px]"
                />

                {/* Services — multi-select chips (talent.tsx styling) */}
                <Label>Services</Label>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {SERVICE_OPTIONS.map((svc) => {
                        const active = services.includes(svc);
                        return (
                            <Pressable
                                key={svc}
                                onPress={() => toggleService(svc)}
                                style={{
                                    borderWidth: 1,
                                    borderColor: active ? '#FF6B35' : '#2A2A33',
                                    backgroundColor: active ? 'rgba(255,107,53,0.08)' : 'transparent',
                                    borderRadius: 99,
                                    paddingHorizontal: 13,
                                    paddingVertical: 7,
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: active ? 'Outfit-SemiBold' : 'Outfit-Regular',
                                        color: active ? '#FF6B35' : '#C9C4BA',
                                        fontSize: 12.5,
                                    }}
                                >
                                    {svc}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                {/* Photo gallery — up to MAX_PHOTOS */}
                <Label>Photos ({photos.length}/{MAX_PHOTOS})</Label>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {photos.map((url, idx) => (
                        <View key={`${url}-${idx}`} style={{ width: 96, height: 96 }}>
                            <Image source={{ uri: url }} className="w-full h-full rounded-xl" />
                            <Pressable
                                onPress={() => removePhoto(idx)}
                                hitSlop={8}
                                style={{
                                    position: 'absolute', top: 5, right: 5, width: 26, height: 26,
                                    borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.6)',
                                    alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <Trash2 size={13} color="#F87171" />
                            </Pressable>
                        </View>
                    ))}
                    {photos.length < MAX_PHOTOS && (
                        <Pressable
                            onPress={pickPhoto}
                            disabled={photosUploading > 0}
                            className="w-[96px] h-[96px] rounded-xl bg-white/[0.04] border border-dashed border-white/15 items-center justify-center"
                        >
                            {photosUploading > 0 ? (
                                <ActivityIndicator color="#FF6B35" />
                            ) : (
                                <Plus size={22} color="#71717a" />
                            )}
                        </Pressable>
                    )}
                </View>

                {/* Years in business + Team size */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                        <Label>Years in business</Label>
                        <TextInput
                            value={yearsInBusiness}
                            onChangeText={(t) => setYearsInBusiness(t.replace(/[^0-9]/g, ''))}
                            placeholder="0"
                            placeholderTextColor="#52525b"
                            keyboardType="number-pad"
                            style={{ fontFamily: 'Outfit-Regular' }}
                            className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-zinc-100 text-[14px]"
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Label>Team size</Label>
                        <TextInput
                            value={teamSize}
                            onChangeText={(t) => setTeamSize(t.replace(/[^0-9]/g, ''))}
                            placeholder="0"
                            placeholderTextColor="#52525b"
                            keyboardType="number-pad"
                            style={{ fontFamily: 'Outfit-Regular' }}
                            className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-zinc-100 text-[14px]"
                        />
                    </View>
                </View>

                {!!error && (
                    <Text style={{ fontFamily: 'Outfit-Regular' }} className="text-red-400 text-[12px] mt-4">
                        {error}
                    </Text>
                )}

                <Pressable
                    onPress={save}
                    disabled={saving || uploading}
                    style={{ opacity: saving || uploading ? 0.6 : 1 }}
                    className="bg-[#FF6B35] rounded-xl py-4 items-center mt-7"
                >
                    {saving ? (
                        <ActivityIndicator color="#1A0D06" />
                    ) : (
                        <Text style={{ fontFamily: 'Outfit-SemiBold' }} className="text-[#1A0D06] text-[15px]">
                            {saved ? 'Saved ✓' : uploading ? 'Uploading…' : 'Save'}
                        </Text>
                    )}
                </Pressable>
            </ScrollView>
        </>
    );
}
