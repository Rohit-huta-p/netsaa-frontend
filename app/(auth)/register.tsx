// app/(auth)/register.tsx — artist-only 5-step registration (v2)
//
// Steps: credentials → identity → dob → artistProfile → media
// Account creation: POST /auth/register at step 5
// Profile enrichment: PATCH /auth/me right after (dateOfBirth, artistType, skills, bio)

import React, { useMemo, useState } from 'react';
import {
    View, Text, Pressable, StyleSheet,
    ActivityIndicator, ScrollView,
} from 'react-native';
import Animated, {
    useSharedValue, useAnimatedStyle,
    withTiming, withSpring, Easing, runOnJS,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import { useCheckEmail } from '@/hooks/useAuthQueries';
import { MIN_REGISTRATION_AGE, MAJORITY_AGE } from '@/constants/registration';
import authService from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

import { Step1Credentials }   from '@/components/auth/artist-registration/Step1Credentials';
import { Step2Identity }      from '@/components/auth/artist-registration/Step2Identity';
import { Step3DOB }           from '@/components/auth/artist-registration/Step3DOB';
import { Step4ArtistProfile } from '@/components/auth/artist-registration/Step4ArtistProfile';
import { Step5Media }         from '@/components/auth/artist-registration/Step5Media';
import { uploadMediaFlow }    from '@/utils/upload';

const C = {
    bg:          '#121216',
    orange:      '#FF6B35',
    t1:          '#F2F0EB',
    t3:          '#706C6A',
    t4:          '#4A4648',
    border:      'rgba(255,255,255,0.07)',
};
const FONT = {
    body:    'Outfit-Regular',
    bodySemi:'Outfit-SemiBold',
    mono:    'SpaceMono-Regular',
};

const TOTAL_STEPS = 5;

// Strong ease-out for entrances; ease-in-out for outgoing moves.
const EASE_OUT    = Easing.bezier(0.23, 1, 0.32, 1);
const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

export default function RegisterScreen() {
    const setAuth = useAuthStore((s) => s.setAuth);
    const checkEmailMutation = useCheckEmail();

    /* ─── Wizard cursor ─── */
    const [stepIdx, setStepIdx] = useState(0);
    const [stepError, setStepError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    /* ─── Form state ─── */
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [stageName, setStageName] = useState('');
    const [dob, setDob]           = useState<Date | null>(null);
    const [artistType, setArtistType] = useState('');
    const [skills, setSkills]     = useState<string[]>([]);
    const [bio, setBio]           = useState('');
    const [photos, setPhotos]     = useState<ImagePickerAsset[]>([]);
    const [avatar, setAvatar]     = useState<ImagePickerAsset | null>(null);
    const [videoUrl, setVideoUrl] = useState('');

    /* ─── Derived age ─── */
    const ageYears = useMemo<number | null>(() => {
        if (!dob) return null;
        const ms = Date.now() - dob.getTime();
        if (ms <= 0) return null;
        return Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000));
    }, [dob]);
    const isMinor = ageYears !== null && ageYears < MAJORITY_AGE;

    /* ─── Shared values ─── */
    const translateX  = useSharedValue(0);
    const opacity     = useSharedValue(1);
    const ctaScale    = useSharedValue(1);
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

        // Fire haptic at the moment of commit — same frame as the visual starts
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Slide + fade out (110ms), then swap step and slide in
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

    /* ─── Per-step validation ─── */
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
                if (!artistType) return 'Please choose your artist type';
                if (skills.length === 0) return 'Please select at least one skill';
                return null;
            case 4:
                // Photos have a minimum of 2, but user can also skip entirely via onSkip
                if (photos.length > 0 && photos.length < 2) return 'Add at least 2 photos, or skip to continue later';
                return null;
            default:
                return null;
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
                // Remote failure is non-fatal — proceed
            }
        }

        if (stepIdx < TOTAL_STEPS - 1) {
            animateToStep(stepIdx + 1);
        } else {
            submitRegistration();
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

    /* ─── Submit ─── */
    const submitRegistration = async () => {
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
                },
            });

            if (!data.token) throw new Error('No token returned');

            let user = data.user || await authService.getMe();
            if (!user?.role) user = await authService.getMe();
            setAuth({ user, accessToken: data.token });

            // Enrich profile — non-fatal if it fails
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

            // Upload avatar + portfolio photos — non-fatal if it fails
            const hasMedia = avatar || photos.length > 0;
            if (hasMedia) {
                try {
                    const userId = (user as any)?._id ?? '';
                    let avatarUrl: string | undefined;
                    const galleryUrls: string[] = [];

                    if (avatar) {
                        const res = await uploadMediaFlow({
                            asset: avatar,
                            entityType: 'user',
                            entityId: userId,
                            purpose: 'portfolio',
                        });
                        if (res.success && res.url) avatarUrl = res.url;
                    }

                    for (const asset of photos) {
                        const res = await uploadMediaFlow({
                            asset,
                            entityType: 'user',
                            entityId: userId,
                            purpose: 'portfolio',
                        });
                        if (res.success && res.url) galleryUrls.push(res.url);
                    }

                    const mediaPatch: Record<string, any> = {};
                    if (avatarUrl) mediaPatch.profileImageUrl = avatarUrl;
                    else if (galleryUrls.length) mediaPatch.profileImageUrl = galleryUrls[0];
                    if (galleryUrls.length) mediaPatch.galleryUrls = galleryUrls;
                    if (videoUrl.trim()) mediaPatch.videoUrl = videoUrl.trim();
                    if (Object.keys(mediaPatch).length) await authService.updateProfile(mediaPatch);
                } catch (e) {
                    console.warn('[register] media upload failed — user can add from profile', e);
                }
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/(app)/gigs');
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

    const isMediaStep = stepIdx === TOTAL_STEPS - 1;
    const mediaCtaLocked = isMediaStep && photos.length > 0 && photos.length < 2;
    const mediaCtaEnabled = isMediaStep && photos.length >= 2;

    const ctaLabel = isMediaStep
        ? (loading ? 'Creating your account…' : 'Create account')
        : 'Continue';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
            {/* Nav row: back button + pill/dot progress */}
            <View style={styles.header}>
                <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
                    <ChevronLeft size={22} color={C.t3} strokeWidth={2} />
                </Pressable>
                <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                        <View
                            key={i}
                            style={{
                                height: 5,
                                width: i === stepIdx ? 18 : 5,
                                borderRadius: 2.5,
                                backgroundColor: i === stepIdx
                                    ? C.orange
                                    : i < stepIdx ? '#52525B' : '#2A2A30',
                            }}
                        />
                    ))}
                </View>
            </View>

            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Step content — Reanimated slide + fade */}
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
                            onClear={() => setStepError(null)}
                        />
                    )}
                    {stepIdx === 2 && (
                        <Step3DOB
                            dob={dob} setDob={setDob}
                            ageYears={ageYears} isMinor={isMinor}
                            onClear={() => setStepError(null)}
                        />
                    )}
                    {stepIdx === 3 && (
                        <Step4ArtistProfile
                            artistType={artistType}
                            onTypeChange={handleTypeChange}
                            skills={skills} setSkills={setSkills}
                            bio={bio} setBio={setBio}
                        />
                    )}
                    {stepIdx === 4 && (
                        <Step5Media
                            photos={photos}
                            setPhotos={setPhotos}
                            avatar={avatar}
                            setAvatar={setAvatar}
                            videoUrl={videoUrl}
                            setVideoUrl={setVideoUrl}
                            uploading={loading}
                        />
                    )}
                </Animated.View>

                {/* Error */}
                {stepError && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{stepError}</Text>
                    </View>
                )}
            </ScrollView>

            {/* CTA — scale feedback on press */}
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
                            <LinearGradient
                                colors={['#FF8C5A', '#FF6B35', '#E55A20']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.ctaGrad}
                            >
                                {loading
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <Text style={styles.ctaLabel}>{ctaLabel}</Text>
                                }
                            </LinearGradient>
                        )}
                    </Pressable>
                </Animated.View>

                {/* Media step: hint + skip */}
                {isMediaStep && (
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
                            onPress={() => submitRegistration()}
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
                            <Text style={{ color: C.orange }}>Log in</Text>
                        </Text>
                    </Pressable>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
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
        paddingTop: 8,
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
