// app/(auth)/register.tsx — role-aware registration wizard
//
// Artist flow  (5 steps): credentials → identity → dob → artistProfile → media
// CL flow      (7 steps): credentials → identity → dob → clIdentity → clVisual → clAbout → clDetails
// Account creation happens ONLY when the whole flow completes — nothing is
// written to the backend until the final step:
//   Artist: POST /auth/register on the final media step
//   CL:     POST /auth/register on the final details step, then PATCH /organizers/me
// The CL "Visual" step therefore stages its logo/cover locally (deferUpload) and
// they are uploaded after the account exists.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert, View, Text, Pressable, StyleSheet,
    ActivityIndicator, ScrollView,
} from 'react-native';
import Animated, {
    useSharedValue, useAnimatedStyle,
    withTiming, withSpring, Easing, runOnJS, useReducedMotion,
} from 'react-native-reanimated';
import { router, useLocalSearchParams, useNavigation, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import { useCheckEmail } from '@/hooks/useAuthQueries';
import { MIN_REGISTRATION_AGE, MAJORITY_AGE } from '@/constants/registration';
import authService from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { usePendingAuthActionStore } from '@/stores/pendingAuthActionStore';

// Artist steps
import { Step1Credentials }   from '@/components/auth/artist-registration/Step1Credentials';
import { Step2Identity }      from '@/components/auth/artist-registration/Step2Identity';
import { Step3DOB }           from '@/components/auth/artist-registration/Step3DOB';
import { Step4ArtistProfile } from '@/components/auth/artist-registration/Step4ArtistProfile';
import { Step5Media }         from '@/components/auth/artist-registration/Step5Media';
import { uploadMediaFlow, uploadVideoFlow } from '@/utils/upload';

// CL steps (reused from the standalone cl-onboarding wizard)
import CLStep1Identity from '@/components/auth/cl-onboarding/Step1Identity';
import CLStep2Visual   from '@/components/auth/cl-onboarding/Step2Visual';
import CLStep3About    from '@/components/auth/cl-onboarding/Step3About';
import CLStep4Details  from '@/components/auth/cl-onboarding/Step4Details';

import type { CLOFormData } from '@/types/clOnboarding';
import {
    AccentProvider, ProgressPills, roleKeyFromParam, ROLE_ACCENT,
} from '@/components/auth/register-kit';

const CL_EMPTY: CLOFormData = {
    organizationName: '', organizerTypeCategory: '', city: '',
    logoUrl: '', coverUrl: '',
    bio: '', services: [],
    organizationWebsite: '', yearsInBusiness: '', teamSize: '',
    instagramHandle: '',
};

const C = {
    bg:     '#121216',
    t1:     '#F2F0EB',
    t3:     '#706C6A',
    t4:     '#4A4648',
    border: 'rgba(255,255,255,0.07)',
};
const FONT = {
    body:    'Outfit-Regular',
    bodySemi:'Outfit-SemiBold',
    mono:    'SpaceMono-Regular',
};

const ARTIST_TOTAL = 5;
const CL_TOTAL     = 7; // 3 shared + 4 CL-specific

const EASE_OUT    = Easing.bezier(0.23, 1, 0.32, 1);
const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

export default function RegisterScreen() {
    const setAuth = useAuthStore((s) => s.setAuth);
    const checkEmailMutation = useCheckEmail();
    const navigation = useNavigation();

    // Role from welcome.tsx params
    const { role: roleParam, enter } = useLocalSearchParams<{ role?: string; enter?: string }>();
    const isCL = roleParam === 'creative_lead';
    const TOTAL_STEPS = isCL ? CL_TOTAL : ARTIST_TOTAL;
    const roleKey = roleKeyFromParam(roleParam);
    const accent = ROLE_ACCENT[roleKey];

    // Entry transition — a full-screen accent cover (handed off from the welcome
    // card's expanding disk) fades out to reveal step 1.
    const reduced = useReducedMotion();
    const entering = enter === '1' && !reduced;
    const coverOpacity = useSharedValue(entering ? 1 : 0);
    const coverStyle = useAnimatedStyle(() => ({ opacity: coverOpacity.get() }));
    useEffect(() => {
        if (entering) coverOpacity.set(withTiming(0, { duration: 480, easing: EASE_OUT }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ─── Wizard cursor ─── */
    const [stepIdx, setStepIdx] = useState(0);
    const [stepError, setStepError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    // Set right before an intentional navigation away (final submit) so the
    // back-interceptor lets that removal through instead of catching it.
    const leavingRef = useRef(false);


    /* ─── Shared form state (steps 0-2) ─── */
    const [email, setEmail]           = useState('');
    const [password, setPassword]     = useState('');
    const [fullName, setFullName]     = useState('');
    const [stageName, setStageName]   = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [dob, setDob]               = useState<Date | null>(null);

    /* ─── Artist-specific form state (steps 3-4) ─── */
    const [artistType, setArtistType] = useState('');
    const [skills, setSkills]     = useState<string[]>([]);
    const [bio, setBio]           = useState('');
    const [photos, setPhotos]     = useState<ImagePickerAsset[]>([]);
    const [avatar, setAvatar]     = useState<ImagePickerAsset | null>(null);
    const [videoAssets, setVideoAssets] = useState<ImagePickerAsset[]>([]);

    /* ─── CL-specific form state (steps 3-6) ─── */
    const [clData, setClData] = useState<CLOFormData>(CL_EMPTY);
    const updateCL = useCallback(
        (patch: Partial<CLOFormData>) => setClData(prev => ({ ...prev, ...patch })),
        [],
    );

    /* ─── Derived age ─── */
    const ageYears = useMemo<number | null>(() => {
        if (!dob) return null;
        const ms = Date.now() - dob.getTime();
        if (ms <= 0) return null;
        return Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000));
    }, [dob]);
    const isMinor = ageYears !== null && ageYears < MAJORITY_AGE;

    /* ─── Shared values ─── */
    const translateX   = useSharedValue(0);
    const opacity      = useSharedValue(1);
    const ctaScale     = useSharedValue(1);
    const contentStyle = useAnimatedStyle(() => ({
        opacity: opacity.get(),
        transform: [{ translateX: translateX.get() }],
    }));
    const ctaAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: ctaScale.get() }],
    }));

    /* ─── Animated step transition ─── */
    function animateToStep(newIdx: number) {
        const dir = newIdx > stepIdx ? 1 : -1;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        translateX.set(withTiming(dir * -80, { duration: 110, easing: EASE_IN_OUT }));
        opacity.set(withTiming(0, { duration: 110, easing: EASE_IN_OUT }, (finished) => {
            'worklet';
            if (!finished) return;
            runOnJS(setStepIdx)(newIdx);
            translateX.set(dir * 80);
            opacity.set(withTiming(1, { duration: 220, easing: EASE_OUT }));
            translateX.set(withSpring(0, { duration: 400, dampingRatio: 0.85 }));
        }));
    }

    /* ─── Intercept the system back (Android hardware / browser back / iOS swipe)
       so it steps one screen back inside the wizard instead of popping the whole
       auth flow. Only "back" actions are caught; replace/navigate (the final
       submit) is allowed through. At step 0 we let it exit to the welcome screen. ─── */
    useEffect(() => {
        const unsub = navigation.addListener('beforeRemove', (e: any) => {
            if (leavingRef.current) return;          // intentional final navigation
            const type = e?.data?.action?.type;
            if (type !== 'GO_BACK' && type !== 'POP') return;
            if (stepIdx === 0) return;
            e.preventDefault();
            setStepError(null);
            animateToStep(stepIdx - 1);
        });
        return unsub;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigation, stepIdx]);

    /* ─── Per-step validation (shared + artist steps only) ─── */
    const validateCurrent = (): string | null => {
        switch (stepIdx) {
            case 0:
                if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email';
                if (password.length < 8) return 'Password must be at least 8 characters';
                return null;
            case 1:
                if (!fullName.trim() || fullName.trim().length < 2) return 'Full name must be at least 2 characters';
                return null;
            case 2: {
                if (!dob) return 'Please select your date of birth';
                if (dob.getTime() >= Date.now()) return 'Date of birth must be in the past';
                if (ageYears === null) return 'Please select a valid date';
                if (ageYears < MIN_REGISTRATION_AGE) return `You must be at least ${MIN_REGISTRATION_AGE} to use NETSA`;
                if (ageYears > 120) return 'Please enter a valid date of birth';
                return null;
            }
            case 3:
                if (!isCL) {
                    if (!artistType) return 'Please choose your artist type';
                    if (skills.length === 0) return 'Please select at least one skill';
                }
                return null;
            case 4:
                if (!isCL && photos.length > 0 && photos.length < 2) {
                    return 'Add at least 2 photos, or skip to continue later';
                }
                return null;
            default:
                return null;
        }
    };

    /* ─── CL: create account + save organizer profile (final step only) ─── */
    const submitCLRegistration = async () => {
        setLoading(true);
        try {
            // 1) Create the account — the first and only backend write of the flow.
            const displayName = stageName.trim() || fullName.trim();
            const data = await authService.register({
                user: {
                    displayName,
                    email: email.trim(),
                    password,
                    role: 'creative_lead' as const,
                    marketingConsent: false,
                    ...(phoneNumber.trim() ? { phoneNumber: phoneNumber.trim() } : {}),
                },
            });
            if (!data.token) throw new Error('No token returned');
            let user = data.user || await authService.getMe();
            if (!user?.role) user = await authService.getMe();
            setAuth({ user, accessToken: data.token });

            // 2) Upload the logo/cover staged on the Visual step — needs the account. Non-fatal.
            const userId = (user as any)?._id ?? '';
            let logoUrl = '';
            let coverUrl = '';
            try {
                if (clData.logoAsset) {
                    const res = await uploadMediaFlow({ asset: clData.logoAsset, entityType: 'user', entityId: userId, purpose: 'avatar' });
                    if (res.success && res.url) logoUrl = res.url;
                }
                if (clData.coverAsset) {
                    const res = await uploadMediaFlow({ asset: clData.coverAsset, entityType: 'user', entityId: userId, purpose: 'banner' });
                    if (res.success && res.url) coverUrl = res.url;
                }
            } catch (e) {
                console.warn('[register] CL media upload failed — user can add from settings', e);
            }

            // 3) Organizer + user profile patches. Non-fatal — the account already exists.
            try {
                const orgPatch: Record<string, any> = {
                    organizationName:      clData.organizationName.trim(),
                    organizerTypeCategory: clData.organizerTypeCategory,
                };
                if (logoUrl)                           orgPatch.logoUrl             = logoUrl;
                if (clData.bio.trim())                 orgPatch.bio                 = clData.bio.trim();
                if (clData.services.length)            orgPatch.services            = clData.services;
                if (clData.organizationWebsite.trim()) orgPatch.organizationWebsite = clData.organizationWebsite.trim();
                if (clData.yearsInBusiness)            orgPatch.yearsInBusiness     = Number(clData.yearsInBusiness);
                if (clData.teamSize)                   orgPatch.teamSize            = Number(clData.teamSize);
                if (clData.instagramHandle?.trim())    orgPatch.instagramHandle     = clData.instagramHandle.trim();
                await authService.updateOrganizerProfile(orgPatch);

                const userPatch: Record<string, any> = {};
                if (dob)                 userPatch.dateOfBirth   = dob.toISOString();
                if (clData.city.trim())  userPatch.primaryCity   = clData.city.trim();
                if (coverUrl)            userPatch.coverImageUrl = coverUrl;
                if (Object.keys(userPatch).length) await authService.updateProfile(userPatch as any);
            } catch (e) {
                console.warn('[register] CL profile enrich failed — user can update later', e);
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            leavingRef.current = true;
            router.replace('/(app)/dashboard');
        } catch (err: any) {
            const msg = err?.response?.data?.msg || err?.response?.data?.message || err?.message || 'Could not create your account. Please try again.';
            Alert.alert('Registration failed', msg);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    /* ─── CTA handler ─── */
    const handleNext = async () => {
        const err = validateCurrent();
        if (err) {
            setStepError(err);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }
        setStepError(null);

        // Email uniqueness check on step 0
        if (stepIdx === 0) {
            try {
                const res = await checkEmailMutation.mutateAsync({ email: email.trim() });
                if ((res as any)?.exists) {
                    setStepError('That email is already registered. Try logging in.');
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    return;
                }
            } catch {
                // Non-fatal — proceed
            }
        }

        if (stepIdx < TOTAL_STEPS - 1) {
            animateToStep(stepIdx + 1);
        } else {
            submitArtistRegistration();
        }
    };

    const handleBack = () => {
        if (stepIdx > 0) {
            setStepError(null);
            animateToStep(stepIdx - 1);
        } else {
            router.back();
        }
    };

    /* ─── Artist submit ─── */
    const submitArtistRegistration = async () => {
        setLoading(true);
        setStepError(null);
        try {
            const displayName = stageName.trim() || fullName.trim();
            const data = await authService.register({
                user: {
                    displayName,
                    email: email.trim(),
                    password,
                    role: 'artist' as const,
                    marketingConsent: false,
                    ...(phoneNumber.trim() ? { phoneNumber: phoneNumber.trim() } : {}),
                },
            });
            if (!data.token) throw new Error('No token returned');
            let user = data.user || await authService.getMe();
            if (!user?.role) user = await authService.getMe();
            setAuth({ user, accessToken: data.token });

            // Enrich profile — non-fatal
            try {
                const patch: Record<string, any> = {};
                if (dob)           patch.dateOfBirth = dob.toISOString();
                if (artistType)    patch.artistType  = [artistType];
                if (skills.length) patch.skills      = skills;
                if (bio.trim())    patch.bio         = bio.trim();
                if (Object.keys(patch).length) await authService.updateProfile(patch);
            } catch (e) {
                console.warn('[register] profile enrich failed — user can update later', e);
            }

            // Upload media — non-fatal
            const hasMedia = avatar || photos.length > 0 || videoAssets.length > 0;
            if (hasMedia) {
                try {
                    const userId = (user as any)?._id ?? '';
                    let avatarUrl: string | undefined;
                    const galleryUrls: string[] = [];
                    if (avatar) {
                        const res = await uploadMediaFlow({ asset: avatar, entityType: 'user', entityId: userId, purpose: 'portfolio' });
                        if (res.success && res.url) avatarUrl = res.url;
                    }
                    for (const asset of photos) {
                        const res = await uploadMediaFlow({ asset, entityType: 'user', entityId: userId, purpose: 'portfolio' });
                        if (res.success && res.url) galleryUrls.push(res.url);
                    }
                    const mediaPatch: Record<string, any> = {};
                    if (avatarUrl) mediaPatch.profileImageUrl = avatarUrl;
                    else if (galleryUrls.length) mediaPatch.profileImageUrl = galleryUrls[0];
                    if (galleryUrls.length) mediaPatch.galleryUrls = galleryUrls;
                    if (videoAssets.length > 0) {
                        const reels: Array<{ uploadId: string; status: string; muxPlaybackId: string }> = [];
                        for (const asset of videoAssets) {
                            const vRes = await uploadVideoFlow({ asset, entityType: 'user', entityId: userId, purpose: 'portfolio' });
                            if (vRes.success && vRes.uploadId) {
                                reels.push({ uploadId: vRes.uploadId, status: 'processing', muxPlaybackId: '' });
                            }
                        }
                        if (reels.length) mediaPatch.videoReels = reels;
                    }
                    if (Object.keys(mediaPatch).length) await authService.updateProfile(mediaPatch);
                } catch (e) {
                    console.warn('[register] media upload failed — user can add from profile', e);
                }
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            leavingRef.current = true;
            const store = usePendingAuthActionStore.getState();
            if (store.pendingIntent?.returnPath) {
                const returnPath = store.pendingIntent.returnPath;
                store.clearPendingIntent();
                router.replace(returnPath as any);
            } else {
                router.replace('/(app)/gigs');
            }
        } catch (err: any) {
            const msg = err.response?.data?.msg || err.response?.data?.message || err.message || 'Registration failed.';
            setStepError(msg);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    /* ─── Type change helper ─── */
    const handleTypeChange = (type: string, defaultSkills: string[]) => {
        setArtistType(type);
        setSkills(defaultSkills);
    };

    const isArtistMediaStep = !isCL && stepIdx === TOTAL_STEPS - 1;
    const mediaCtaLocked    = isArtistMediaStep && photos.length > 0 && photos.length < 2;

    const ctaLabel = isArtistMediaStep
        ? (loading ? 'Creating your account…' : 'Create account')
        : 'Continue';

    // CL steps 3-6 have their own full-screen layout (KeyboardAvoidingView + ScrollView + CTA)
    const showCLSteps = isCL && stepIdx >= 3;

    return (
        <AccentProvider role={roleKey}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
            <Stack.Screen options={{ animation: entering ? 'none' : 'default', gestureEnabled: false }} />
            {/* Nav row: back button + pill/dot progress */}
            <View style={styles.header}>
                <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
                    <ChevronLeft size={22} color={C.t3} strokeWidth={2} />
                </Pressable>
                <ProgressPills total={TOTAL_STEPS} current={stepIdx} />
            </View>

            {showCLSteps ? (
                /* CL steps 3-6: each component owns its layout and CTA */
                <Animated.View style={[{ flex: 1 }, contentStyle]}>
                    {stepIdx === 3 && (
                        <CLStep1Identity
                            data={clData}
                            update={updateCL}
                            onNext={() => animateToStep(4)}
                        />
                    )}
                    {stepIdx === 4 && (
                        <CLStep2Visual
                            data={clData}
                            update={updateCL}
                            deferUpload
                            onNext={() => animateToStep(5)}
                            onSkip={() => animateToStep(5)}
                        />
                    )}
                    {stepIdx === 5 && (
                        <CLStep3About
                            data={clData}
                            update={updateCL}
                            onNext={() => animateToStep(6)}
                            onSkip={() => animateToStep(6)}
                        />
                    )}
                    {stepIdx === 6 && (
                        <CLStep4Details
                            data={clData}
                            update={updateCL}
                            onFinish={submitCLRegistration}
                            onSkip={submitCLRegistration}
                            saving={loading}
                        />
                    )}
                </Animated.View>
            ) : (
                /* Shared steps (0-2) + artist steps (3-4) */
                <>
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <Animated.View style={[{ paddingTop: 16, paddingBottom: 32 }, contentStyle]}>
                            {stepIdx === 0 && (
                                <Step1Credentials
                                    email={email} setEmail={setEmail}
                                    password={password} setPassword={setPassword}
                                    onClear={() => setStepError(null)}
                                />
                            )}
                            {stepIdx === 1 && (
                                <Step2Identity
                                    fullName={fullName} setFullName={setFullName}
                                    stageName={stageName} setStageName={setStageName}
                                    phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber}
                                    onClear={() => setStepError(null)}
                                    totalSteps={TOTAL_STEPS}
                                />
                            )}
                            {stepIdx === 2 && (
                                <Step3DOB
                                    dob={dob} setDob={setDob}
                                    ageYears={ageYears} isMinor={isMinor}
                                    onClear={() => setStepError(null)}
                                    totalSteps={TOTAL_STEPS}
                                />
                            )}
                            {!isCL && stepIdx === 3 && (
                                <Step4ArtistProfile
                                    artistType={artistType}
                                    onTypeChange={handleTypeChange}
                                    skills={skills} setSkills={setSkills}
                                    bio={bio} setBio={setBio}
                                    totalSteps={TOTAL_STEPS}
                                />
                            )}
                            {!isCL && stepIdx === 4 && (
                                <Step5Media
                                    photos={photos} setPhotos={setPhotos}
                                    avatar={avatar} setAvatar={setAvatar}
                                    videoAssets={videoAssets} setVideoAssets={setVideoAssets}
                                    uploading={loading}
                                    totalSteps={TOTAL_STEPS}
                                />
                            )}
                        </Animated.View>

                        {stepError && (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{stepError}</Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* CTA */}
                    <View style={styles.ctaContainer}>
                        <Animated.View style={ctaAnimStyle}>
                            <Pressable
                                onPress={handleNext}
                                onPressIn={() => {
                                    if (!mediaCtaLocked) ctaScale.set(withTiming(0.97, { duration: 100 }));
                                }}
                                onPressOut={() => {
                                    ctaScale.set(withSpring(1, { duration: 300, dampingRatio: 0.6 }));
                                }}
                                disabled={loading || mediaCtaLocked}
                                style={[styles.cta, (loading || mediaCtaLocked) && styles.ctaDim]}
                            >
                                {mediaCtaLocked ? (
                                    <View style={[styles.ctaGrad, { backgroundColor: '#1C1C20' }]}>
                                        <Text style={[styles.ctaLabel, { color: C.t4 }]}>{ctaLabel}</Text>
                                    </View>
                                ) : (
                                    <View style={[styles.ctaGrad, { backgroundColor: accent.base }]}>
                                        {loading
                                            ? <ActivityIndicator color={accent.on} size="small" />
                                            : <Text style={[styles.ctaLabel, { color: accent.on }]}>{ctaLabel}</Text>
                                        }
                                    </View>
                                )}
                            </Pressable>
                        </Animated.View>

                        {/* Artist media step extras */}
                        {isArtistMediaStep && (
                            <>
                                {mediaCtaLocked && (
                                    <Text style={{
                                        fontFamily: FONT.mono,
                                        fontSize: 8,
                                        color: C.t4,
                                        letterSpacing: 1,
                                        textTransform: 'uppercase',
                                        textAlign: 'center',
                                        marginTop: 6,
                                    }}>
                                        Add 2 photos to continue
                                    </Text>
                                )}
                                <Pressable
                                    onPress={() => submitArtistRegistration()}
                                    style={{ paddingVertical: 8 }}
                                >
                                    <Text style={{
                                        fontFamily: FONT.body,
                                        fontSize: 13,
                                        color: C.t3,
                                        textAlign: 'center',
                                    }}>
                                        Skip for now
                                    </Text>
                                </Pressable>
                            </>
                        )}

                        {stepIdx === 0 && (
                            <Pressable onPress={() => router.replace('/(auth)/login')} style={{ marginTop: 16 }}>
                                <Text style={{ fontFamily: FONT.body, fontSize: 13, color: C.t4, textAlign: 'center' }}>
                                    Already have an account?{' '}
                                    <Text style={{ color: accent.base }}>Log in</Text>
                                </Text>
                            </Pressable>
                        )}
                    </View>
                </>
            )}
            {entering && (
                <Animated.View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, { backgroundColor: accent.base }, coverStyle]}
                />
            )}
        </SafeAreaView>
        </AccentProvider>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 7,
    },
    backBtn: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorBox: {
        marginBottom: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: 'rgba(239,68,68,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.25)',
    },
    errorText: {
        fontFamily: 'Outfit-Regular',
        fontSize: 13,
        color: '#FCA5A5',
        lineHeight: 18,
    },
    ctaContainer: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        paddingTop: 20,
    },
    cta: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    ctaDim: { opacity: 0.6 },
    ctaGrad: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaLabel: {
        fontFamily: 'Outfit-SemiBold',
        fontSize: 16,
        color: '#fff',
        letterSpacing: 0.3,
    },
});
