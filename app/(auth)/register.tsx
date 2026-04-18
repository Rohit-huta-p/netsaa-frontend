// app/(auth)/register.tsx
//
// PRD v4 — Two-Context Model — Single-flow registration.
//
// One step sequence for everyone. No role fork.
// Blocking steps:  entry → identity → credentials
// Soft steps:      intent → artistProfile → hirerProfile? → social
//
// Step 4 "What brings you to NETSA?" is the emotional center.
// Richer hirer business fields (GST, legal name, billing) are deferred to
// the first gig post per PRD §8.1.1 Step 6.

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
    View, Text, Pressable, Animated, Easing, StyleSheet,
    ActivityIndicator, ScrollView, useWindowDimensions, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ChevronLeft, ArrowRight, MapPin, Mail, Lock, User as UserIcon,
    Instagram, Youtube, Music2, Headphones, Check,
} from 'lucide-react-native';

import {
    StepInput, CountryCodePicker, ExpCard,
} from '@/components/auth';
import {
    STEPS, StepId, SOFT_STEPS, BLOCKING_STEPS,
    INTENT_OPTIONS, ARTIST_TYPES, EXP_LEVELS, HIRER_CLIENT_TYPES,
} from '@/constants/registration';
import type {
    Intent, ExperienceLevel, HirerClientType, RegisterPayload,
} from '@/schemas/register.schema';
import { useRegister, useCheckEmail, useCheckPhone } from '@/hooks/useAuthQueries';

// ─── Design palette (Palette 18 — same as profile + network screens) ───
const C = {
    pink: '#EC4899',
    orange: '#F97316',
    gold: '#EAB308',
    cyan: '#06B6D4',
    green: '#34D399',
    red: '#EF4444',
    bg: '#050509',
    surface: '#121018',
    surface2: '#1A1824',
    text: '#F0ECE6',
    text2: '#6B6878',
    text3: '#4A4656',
    text4: '#3A3746',
    border: 'rgba(255,255,255,0.06)',
    borderStrong: 'rgba(255,255,255,0.12)',
    activeBg: 'rgba(249,115,22,0.08)',
    activeBorder: 'rgba(249,115,22,0.35)',
};

const FONT = {
    serif: 'DMSerifDisplay_400Regular',
    body: 'Outfit-Regular',
    bodyMed: 'Outfit-Medium',
    bodySemi: 'Outfit-SemiBold',
    bodyBold: 'Outfit-Bold',
    bodyExtra: 'Outfit-ExtraBold',
};

// ════════════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ════════════════════════════════════════════════════════════════════

export default function RegisterScreen() {
    const routeParams = useLocalSearchParams<{ phone?: string; email?: string }>();
    const { width } = useWindowDimensions();

    const registerMutation = useRegister();
    const checkEmailMutation = useCheckEmail();
    const checkPhoneMutation = useCheckPhone();

    /* ─── Wizard cursor ─── */
    const [stepIdx, setStepIdx] = useState(0);
    const [stepError, setStepError] = useState<string | null>(null);
    const [completed, setCompleted] = useState(false);

    /* ─── Core form state ─── */
    const [email, setEmail] = useState(routeParams.email ?? '');
    const [countryCode, setCountryCode] = useState(() => {
        if (routeParams.phone) {
            const m = routeParams.phone.match(/^(\+\d{1,3})(.*)$/);
            return m ? m[1] : '+91';
        }
        return '+91';
    });
    const [phone, setPhone] = useState(() => {
        if (routeParams.phone) {
            const m = routeParams.phone.match(/^\+\d{1,3}(.*)$/);
            return m ? m[1].replace(/[^0-9]/g, '') : '';
        }
        return '';
    });
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');

    /* ─── Intent (Step 4) ─── */
    const [intentChoice, setIntentChoice] = useState<'find_gigs' | 'hire_artists' | 'both' | null>(null);

    /* ─── Optional artist profile (Step 5) ─── */
    const [artistTypes, setArtistTypes] = useState<string[]>([]);
    const [expLevel, setExpLevel] = useState<ExperienceLevel | null>(null);
    const [artistCity, setArtistCity] = useState('');

    /* ─── Optional hirer profile (Step 6, conditional) ─── */
    const [clientType, setClientType] = useState<HirerClientType | null>(null);
    const [hirerCity, setHirerCity] = useState('');

    /* ─── Optional socials (Step 7) ─── */
    const [instagram, setInstagram] = useState('');
    const [youtube, setYoutube] = useState('');
    const [spotify, setSpotify] = useState('');
    const [soundcloud, setSoundcloud] = useState('');

    /* ─── Derived step sequence (hirerProfile hidden if no hire intent) ─── */
    const activeSteps = useMemo<StepId[]>(() => {
        const wantsHire = intentChoice === 'hire_artists' || intentChoice === 'both';
        return STEPS.filter((s) => {
            if (s === 'hirerProfile') return wantsHire;
            return true;
        });
    }, [intentChoice]);

    const currentStepId: StepId = completed ? 'completion' : (activeSteps[stepIdx] ?? 'completion');
    const isLastDataStep = stepIdx === activeSteps.length - 1;
    const isSoft = SOFT_STEPS.has(currentStepId);

    /* ─── Progress (blocking steps only — honest count) ─── */
    const blockingIdx = useMemo(() => {
        return activeSteps
            .slice(0, stepIdx + 1)
            .filter((s) => BLOCKING_STEPS.has(s)).length;
    }, [activeSteps, stepIdx]);
    const blockingTotal = useMemo(
        () => activeSteps.filter((s) => BLOCKING_STEPS.has(s)).length,
        [activeSteps]
    );
    const progress = Math.min(blockingIdx / blockingTotal, 1);

    /* ─── Animation ─── */
    const slideX = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const animateToStep = useCallback((newIdx: number) => {
        const dir = newIdx > stepIdx ? 1 : -1;
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
            Animated.timing(slideX, { toValue: dir * -120, duration: 120, useNativeDriver: true }),
        ]).start(() => {
            setStepIdx(newIdx);
            slideX.setValue(dir * 120);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
                Animated.spring(slideX, { toValue: 0, stiffness: 260, damping: 28, useNativeDriver: true }),
            ]).start();
        });
    }, [stepIdx, fadeAnim, slideX]);

    /* ─── Per-step validation ─── */
    const validateCurrent = (): string | null => {
        switch (currentStepId) {
            case 'entry': {
                if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email';
                if (phone.trim() && phone.trim().length < 10) return 'Phone number must be at least 10 digits';
                return null;
            }
            case 'identity': {
                if (!fullName.trim() || fullName.trim().length < 2) return 'Name must be at least 2 characters';
                return null;
            }
            case 'credentials': {
                if (password.length < 8) return 'Password must be at least 8 characters';
                return null;
            }
            case 'intent':
                return intentChoice === null ? 'Pick at least one — you can change this anytime' : null;
            case 'artistProfile':
            case 'hirerProfile':
            case 'social':
                return null; // soft steps are always passable
            default:
                return null;
        }
    };

    /* ─── Remote uniqueness checks (only for blocking steps) ─── */
    const checkRemoteUniqueness = async (): Promise<string | null> => {
        if (currentStepId !== 'entry') return null;
        try {
            const emailRes = await checkEmailMutation.mutateAsync({ email: email.trim() });
            if ((emailRes as any)?.exists) return 'That email is already registered. Try logging in.';
            if (phone.trim()) {
                const fullPhone = `${countryCode}${phone.replace(/[^0-9]/g, '')}`;
                const phoneRes = await checkPhoneMutation.mutateAsync({ phone: fullPhone });
                if ((phoneRes as any)?.exists) {
                    // Per PRD: phones can be shared in families. Warn, don't block.
                    console.warn('[register] phone already on another account — proceeding with warning');
                }
            }
        } catch (e) {
            // Remote failure shouldn't block the user
            console.warn('[register] uniqueness check failed, continuing', e);
        }
        return null;
    };

    /* ─── CTA handler ─── */
    const handleNext = async () => {
        const err = validateCurrent();
        if (err) {
            setStepError(err);
            return;
        }
        setStepError(null);

        if (currentStepId === 'entry') {
            const remoteErr = await checkRemoteUniqueness();
            if (remoteErr) {
                setStepError(remoteErr);
                return;
            }
        }

        if (isLastDataStep) {
            submitRegistration(false);
            return;
        }

        animateToStep(stepIdx + 1);
    };

    const handleSkip = () => {
        if (!isSoft) return;
        setStepError(null);
        if (isLastDataStep) {
            submitRegistration(true);
            return;
        }
        animateToStep(stepIdx + 1);
    };

    const handleBack = () => {
        if (stepIdx > 0 && !completed) {
            setStepError(null);
            animateToStep(stepIdx - 1);
        }
    };

    /* ─── Submit ─── */
    const submitRegistration = (skipOptional: boolean) => {
        const chosen = INTENT_OPTIONS.find((o) => o.id === intentChoice);
        const intents: Intent[] = chosen?.toIntents ?? [];

        const payload: RegisterPayload = {
            user: {
                displayName: fullName.trim(),
                email: email.trim(),
                password,
                phoneNumber: phone.trim() ? `${countryCode}${phone.replace(/[^0-9]/g, '')}` : undefined,
                intent: intents,
                marketingConsent: false, // surface this on a later settings screen, not here
            },
        };

        // Stage profile data client-side. Backend register endpoint doesn't accept
        // these fields today — they'll be PATCHed via /users/me in Phase 2c.
        if (!skipOptional && (artistTypes.length || expLevel || artistCity.trim())) {
            payload.artistProfile = {
                artistTypes: artistTypes.length ? artistTypes : undefined,
                experience: expLevel ?? undefined,
                primaryCity: artistCity.trim() || undefined,
            };
        }
        if (!skipOptional && (clientType || hirerCity.trim())) {
            payload.hirerProfile = {
                clientType: clientType ?? undefined,
                primaryCity: hirerCity.trim() || undefined,
            };
        }
        if (!skipOptional) {
            const socials = {
                instagram: instagram.trim() || undefined,
                youtube: youtube.trim() || undefined,
                spotify: spotify.trim() || undefined,
                soundcloud: soundcloud.trim() || undefined,
            };
            if (Object.values(socials).some(Boolean)) payload.socials = socials;
        }

        registerMutation.mutate(payload as any, {
            onSuccess: () => setCompleted(true),
            onError: (err: any) => {
                const msg =
                    err.response?.data?.msg ||
                    err.response?.data?.message ||
                    err.message ||
                    'Registration failed.';
                setStepError(msg);
            },
        });
    };

    /* ─── Toggle helpers ─── */
    const toggleArtistType = (id: string) => {
        setArtistTypes((prev) => {
            if (prev.includes(id)) return prev.filter((x) => x !== id);
            if (prev.length >= 3) return prev; // cap
            return [...prev, id];
        });
    };

    /* ══════════════════════════════════════════════════════
     *  STEP RENDERERS
     * ══════════════════════════════════════════════════════ */

    const renderStep = () => {
        switch (currentStepId) {
            case 'entry':
                return (
                    <View>
                        <Headline>
                            <SerifLine>Welcome to</SerifLine>
                            <SerifBrand>NETSA</SerifBrand>
                        </Headline>
                        <Subhead>How should we reach you?</Subhead>
                        <StepInput
                            label="Email"
                            value={email}
                            onChangeText={(v) => { setEmail(v); setStepError(null); }}
                            placeholder="you@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            icon={<Mail size={16} color={C.text3} />}
                        />
                        <StepInput
                            label="Phone (optional, recommended for India)"
                            value={phone}
                            onChangeText={(v) => { setPhone(v.replace(/[^0-9]/g, '')); setStepError(null); }}
                            placeholder="9876543210"
                            keyboardType="phone-pad"
                            prefix={<CountryCodePicker selectedCode={countryCode} onSelect={setCountryCode} />}
                        />
                    </View>
                );

            case 'identity':
                return (
                    <View>
                        <Headline>
                            <SerifLine>What should people</SerifLine>
                            <SerifLine>call you?</SerifLine>
                        </Headline>
                        <Subhead>Your name as it'll appear across NETSA.</Subhead>
                        <StepInput
                            label="Full name or stage name"
                            value={fullName}
                            onChangeText={(v) => { setFullName(v); setStepError(null); }}
                            placeholder="e.g. Priya Sharma"
                            autoCapitalize="words"
                            icon={<UserIcon size={16} color={C.text3} />}
                        />
                    </View>
                );

            case 'credentials':
                return (
                    <View>
                        <Headline>
                            <SerifLine>Secure your</SerifLine>
                            <SerifLine>account.</SerifLine>
                        </Headline>
                        <Subhead>Pick a password. Minimum 8 characters.</Subhead>
                        <StepInput
                            label="Password"
                            value={password}
                            onChangeText={(v) => { setPassword(v); setStepError(null); }}
                            placeholder="At least 8 characters"
                            secureTextEntry
                            icon={<Lock size={16} color={C.text3} />}
                        />
                        <Text style={s.fineprint}>
                            By continuing, you agree to the NETSA Terms and Privacy Policy.
                        </Text>
                    </View>
                );

            case 'intent':
                return (
                    <IntentStep
                        choice={intentChoice}
                        onChoose={(id) => { setIntentChoice(id); setStepError(null); }}
                    />
                );

            case 'artistProfile':
                return (
                    <View>
                        <Headline>
                            <SerifLine>Tell us about</SerifLine>
                            <SerifLine>your craft.</SerifLine>
                        </Headline>
                        <Subhead>
                            You can skip — fill this in later from your profile.
                        </Subhead>

                        <Text style={s.sectionLabel}>What do you do? (max 3)</Text>
                        <View style={s.chipsWrap}>
                            {ARTIST_TYPES.map((t) => {
                                const active = artistTypes.includes(t.id);
                                const Icon = t.icon;
                                return (
                                    <Pressable
                                        key={t.id}
                                        onPress={() => toggleArtistType(t.id)}
                                        style={({ pressed }) => [
                                            s.chip,
                                            active && s.chipActive,
                                            pressed && { opacity: 0.7 },
                                        ]}
                                    >
                                        <Icon size={14} color={active ? C.orange : C.text2} strokeWidth={2} />
                                        <Text style={[s.chipText, active && s.chipTextActive]}>{t.label}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        <Text style={s.sectionLabel}>Experience</Text>
                        <View style={{ gap: 8 }}>
                            {EXP_LEVELS.map((lvl) => (
                                <ExpCard
                                    key={lvl.id}
                                    label={lvl.label}
                                    sub={lvl.sub}
                                    selected={expLevel === lvl.id}
                                    onPress={() => setExpLevel(lvl.id)}
                                />
                            ))}
                        </View>

                        <Text style={s.sectionLabel}>Where are you based?</Text>
                        <StepInput
                            label=""
                            hideLabel
                            value={artistCity}
                            onChangeText={setArtistCity}
                            placeholder="e.g. Mumbai, Pune, Delhi"
                            icon={<MapPin size={16} color={C.text3} />}
                        />
                    </View>
                );

            case 'hirerProfile':
                return (
                    <View>
                        <Headline>
                            <SerifLine>Who's doing</SerifLine>
                            <SerifLine>the hiring?</SerifLine>
                        </Headline>
                        <Subhead>
                            Just the basics. Business details come later when you post a gig.
                        </Subhead>

                        <Text style={s.sectionLabel}>I'm hiring as</Text>
                        <View style={{ gap: 8 }}>
                            {HIRER_CLIENT_TYPES.map((t) => {
                                const active = clientType === t.id;
                                const Icon = t.icon;
                                return (
                                    <Pressable
                                        key={t.id}
                                        onPress={() => setClientType(t.id)}
                                        style={({ pressed }) => [
                                            s.hirerCard,
                                            active && s.hirerCardActive,
                                            pressed && { opacity: 0.85 },
                                        ]}
                                    >
                                        <View style={[s.hirerIcon, active && s.hirerIconActive]}>
                                            <Icon size={18} color={active ? '#fff' : C.text2} strokeWidth={2} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[s.hirerLabel, active && s.hirerLabelActive]}>{t.label}</Text>
                                            <Text style={s.hirerSub}>{t.sub}</Text>
                                        </View>
                                        {active && <Check size={16} color={C.orange} strokeWidth={2.5} />}
                                    </Pressable>
                                );
                            })}
                        </View>

                        <Text style={s.sectionLabel}>Primary city</Text>
                        <StepInput
                            label=""
                            hideLabel
                            value={hirerCity}
                            onChangeText={setHirerCity}
                            placeholder="e.g. Mumbai, Bangalore, Hyderabad"
                            icon={<MapPin size={16} color={C.text3} />}
                        />
                    </View>
                );

            case 'social':
                return (
                    <View>
                        <Headline>
                            <SerifLine>One last thing.</SerifLine>
                        </Headline>
                        <Subhead>
                            Link your socials to show your work. Optional.
                        </Subhead>
                        <StepInput
                            label="Instagram"
                            value={instagram}
                            onChangeText={setInstagram}
                            placeholder="@yourhandle"
                            autoCapitalize="none"
                            icon={<Instagram size={15} color={C.text3} />}
                        />
                        <StepInput
                            label="YouTube"
                            value={youtube}
                            onChangeText={setYoutube}
                            placeholder="Channel URL or @handle"
                            autoCapitalize="none"
                            icon={<Youtube size={15} color={C.text3} />}
                        />
                        <StepInput
                            label="Spotify"
                            value={spotify}
                            onChangeText={setSpotify}
                            placeholder="Artist URL"
                            autoCapitalize="none"
                            icon={<Music2 size={15} color={C.text3} />}
                        />
                        <StepInput
                            label="SoundCloud"
                            value={soundcloud}
                            onChangeText={setSoundcloud}
                            placeholder="Profile URL"
                            autoCapitalize="none"
                            icon={<Headphones size={15} color={C.text3} />}
                        />
                    </View>
                );

            case 'completion':
                return <CompletionStep intentChoice={intentChoice} displayName={fullName} />;
        }
        return null;
    };

    /* ══════════════════════════════════════════════════════
     *  LAYOUT
     * ══════════════════════════════════════════════════════ */

    const ctaLabel = isLastDataStep ? 'Create account' : 'Continue';
    const isSubmitting = registerMutation.isPending;

    return (
        <View style={s.root}>
            {/* Ambient gradient — only on Step 4 (intent) to signal emotional weight */}
            {currentStepId === 'intent' && <IntentAmbient />}

            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                {/* Header: back + progress */}
                {!completed && (
                    <View style={s.header}>
                        <Pressable
                            onPress={handleBack}
                            disabled={stepIdx === 0}
                            style={({ pressed }) => [
                                s.backBtn,
                                stepIdx === 0 && { opacity: 0.25 },
                                pressed && { opacity: 0.55 },
                            ]}
                            hitSlop={8}
                        >
                            <ChevronLeft size={18} color={C.text2} strokeWidth={2} />
                        </Pressable>
                        <View style={s.progressTrack}>
                            <LinearGradient
                                colors={[C.pink, C.orange]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[s.progressFill, { width: `${progress * 100}%` }]}
                            />
                        </View>
                        <Text style={s.progressLabel}>
                            {blockingIdx}/{blockingTotal}
                        </Text>
                    </View>
                )}

                {/* Step body */}
                <ScrollView
                    contentContainerStyle={{
                        paddingHorizontal: width < 500 ? 22 : 32,
                        paddingTop: 20,
                        paddingBottom: 40,
                        minHeight: '100%',
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View
                        style={{
                            opacity: fadeAnim,
                            transform: [{ translateX: slideX }],
                        }}
                    >
                        {renderStep()}
                    </Animated.View>

                    {stepError ? (
                        <View style={s.errorBox}>
                            <Text style={s.errorText}>{stepError}</Text>
                        </View>
                    ) : null}
                </ScrollView>

                {/* Footer CTA */}
                {!completed && (
                    <View style={[s.footer, { paddingBottom: Platform.OS === 'ios' ? 20 : 24 }]}>
                        {isSoft && (
                            <Pressable
                                onPress={handleSkip}
                                disabled={isSubmitting}
                                style={({ pressed }) => [
                                    s.skipBtn,
                                    pressed && { opacity: 0.6 },
                                ]}
                            >
                                <Text style={s.skipBtnText}>Skip for now</Text>
                            </Pressable>
                        )}
                        <Pressable
                            onPress={handleNext}
                            disabled={isSubmitting}
                            style={({ pressed }) => [
                                { flex: 1, opacity: isSubmitting ? 0.6 : pressed ? 0.85 : 1 },
                            ]}
                        >
                            <LinearGradient
                                colors={[C.pink, C.orange]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={s.ctaBtn}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Text style={s.ctaText}>{ctaLabel}</Text>
                                        <ArrowRight size={16} color="#fff" strokeWidth={2.5} />
                                    </>
                                )}
                            </LinearGradient>
                        </Pressable>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}

// ════════════════════════════════════════════════════════════════════
//  STEP 4 — "What brings you to NETSA?" — the emotional center
// ════════════════════════════════════════════════════════════════════

const IntentAmbient = () => (
    <>
        <View style={s.ambientOrb1} pointerEvents="none">
            <LinearGradient
                colors={['rgba(236,72,153,0.22)', 'transparent']}
                style={{ flex: 1, borderRadius: 400 }}
            />
        </View>
        <View style={s.ambientOrb2} pointerEvents="none">
            <LinearGradient
                colors={['rgba(249,115,22,0.18)', 'transparent']}
                style={{ flex: 1, borderRadius: 400 }}
            />
        </View>
        <Text style={s.devanagariGhost} pointerEvents="none">
            संगीत
        </Text>
    </>
);

const IntentStep = ({
    choice,
    onChoose,
}: {
    choice: 'find_gigs' | 'hire_artists' | 'both' | null;
    onChoose: (id: 'find_gigs' | 'hire_artists' | 'both') => void;
}) => {
    return (
        <View>
            <View style={{ marginBottom: 28 }}>
                <Text style={s.intentEyebrow}>WHAT BRINGS YOU HERE</Text>
                <Text style={s.intentHeadline}>What brings you{'\n'}to NETSA?</Text>
                <Text style={s.intentSub}>
                    Pick one — you can always do both later. This just helps us set up your first view.
                </Text>
            </View>

            <View style={{ gap: 12 }}>
                {INTENT_OPTIONS.map((opt) => {
                    const active = choice === opt.id;
                    const Icon = opt.icon;
                    return (
                        <Pressable
                            key={opt.id}
                            onPress={() => onChoose(opt.id as any)}
                            style={({ pressed }) => [
                                s.intentCard,
                                active && s.intentCardActive,
                                pressed && { opacity: 0.85 },
                            ]}
                        >
                            <View style={[s.intentIcon, active && s.intentIconActive]}>
                                <Icon size={20} color={active ? '#fff' : C.text2} strokeWidth={2} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[s.intentCardTitle, active && s.intentCardTitleActive]}>
                                    {opt.title}
                                </Text>
                                <Text style={s.intentCardSub}>{opt.sub}</Text>
                            </View>
                            {active && (
                                <View style={s.intentCheck}>
                                    <Check size={14} color="#fff" strokeWidth={3} />
                                </View>
                            )}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

// ════════════════════════════════════════════════════════════════════
//  Completion step
// ════════════════════════════════════════════════════════════════════

const CompletionStep = ({
    intentChoice,
    displayName,
}: {
    intentChoice: 'find_gigs' | 'hire_artists' | 'both' | null;
    displayName: string;
}) => {
    const firstName = displayName.trim().split(/\s+/)[0] || 'there';
    const isArtist = intentChoice === 'find_gigs' || intentChoice === 'both';
    const isHirer = intentChoice === 'hire_artists' || intentChoice === 'both';

    const go = () => {
        if (intentChoice === 'hire_artists') {
            router.replace('/(app)/dashboard' as any);
        } else {
            router.replace('/(app)/gigs' as any);
        }
    };

    return (
        <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <LinearGradient
                colors={[C.pink, C.orange]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.completionRing}
            >
                <View style={s.completionRingInner}>
                    <Check size={38} color={C.orange} strokeWidth={2} />
                </View>
            </LinearGradient>

            <Text style={s.completionHeadline}>Welcome, {firstName}.</Text>
            <Text style={s.completionSub}>
                Your NETSA account is ready.
                {isArtist ? '\nStart browsing gigs that match your craft.' : ''}
                {isHirer ? '\nPost your first gig whenever you need a team.' : ''}
            </Text>

            <Pressable onPress={go} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
                <LinearGradient
                    colors={[C.pink, C.orange]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.completionCta}
                >
                    <Text style={s.completionCtaText}>Enter NETSA</Text>
                    <ArrowRight size={16} color="#fff" strokeWidth={2.5} />
                </LinearGradient>
            </Pressable>
        </View>
    );
};

// ════════════════════════════════════════════════════════════════════
//  Typography helpers
// ════════════════════════════════════════════════════════════════════

const Headline = ({ children }: { children: React.ReactNode }) => (
    <View style={{ marginBottom: 12 }}>{children}</View>
);

const SerifLine = ({ children }: { children: React.ReactNode }) => (
    <Text style={s.serifHeadline}>{children}</Text>
);

const SerifBrand = ({ children }: { children: React.ReactNode }) => (
    <Text style={s.serifBrand}>{children}</Text>
);

const Subhead = ({ children }: { children: React.ReactNode }) => (
    <Text style={s.subhead}>{children}</Text>
);

// ════════════════════════════════════════════════════════════════════
//  Styles
// ════════════════════════════════════════════════════════════════════

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 16,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: C.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressTrack: {
        flex: 1,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 1.5 },
    progressLabel: {
        fontSize: 10,
        color: C.text3,
        fontFamily: FONT.bodyBold,
        letterSpacing: 1,
    },

    // Typography
    serifHeadline: {
        fontFamily: FONT.serif,
        fontSize: 34,
        lineHeight: 40,
        color: C.text,
        letterSpacing: -0.5,
    },
    serifBrand: {
        fontFamily: FONT.serif,
        fontSize: 54,
        lineHeight: 60,
        color: C.text,
        letterSpacing: -1.2,
    },
    subhead: {
        fontSize: 14,
        color: C.text2,
        lineHeight: 20,
        marginTop: 10,
        marginBottom: 28,
        fontFamily: FONT.body,
    },
    sectionLabel: {
        fontSize: 10,
        color: C.text2,
        textTransform: 'uppercase',
        letterSpacing: 2,
        fontFamily: FONT.bodyBold,
        marginTop: 24,
        marginBottom: 10,
    },
    fineprint: {
        fontSize: 11,
        color: C.text3,
        marginTop: 12,
        lineHeight: 16,
        fontFamily: FONT.body,
    },

    // Step 4 (intent)
    ambientOrb1: {
        position: 'absolute',
        top: -120,
        right: -120,
        width: 340,
        height: 340,
    },
    ambientOrb2: {
        position: 'absolute',
        bottom: 80,
        left: -140,
        width: 320,
        height: 320,
    },
    devanagariGhost: {
        position: 'absolute',
        top: 80,
        right: 20,
        fontSize: 120,
        color: 'rgba(236,72,153,0.04)',
        fontFamily: FONT.serif,
    },
    intentEyebrow: {
        fontSize: 10,
        color: C.pink,
        letterSpacing: 3,
        fontFamily: FONT.bodyBold,
        marginBottom: 14,
    },
    intentHeadline: {
        fontSize: 38,
        lineHeight: 44,
        color: C.text,
        letterSpacing: -0.8,
        fontFamily: FONT.serif,
    },
    intentSub: {
        fontSize: 14,
        color: C.text2,
        lineHeight: 20,
        marginTop: 14,
        fontFamily: FONT.body,
        maxWidth: 320,
    },

    intentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 18,
        borderRadius: 20,
        backgroundColor: 'rgba(18,16,24,0.5)',
        borderWidth: 1,
        borderColor: C.border,
    },
    intentCardActive: {
        backgroundColor: C.activeBg,
        borderColor: C.activeBorder,
    },
    intentIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    intentIconActive: {
        backgroundColor: C.orange,
    },
    intentCardTitle: {
        fontSize: 15,
        fontFamily: FONT.bodySemi,
        color: C.text,
        marginBottom: 2,
    },
    intentCardTitleActive: { color: C.text },
    intentCardSub: {
        fontSize: 12,
        color: C.text3,
        fontFamily: FONT.body,
        lineHeight: 16,
    },
    intentCheck: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: C.orange,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Artist-type chips
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    chipActive: {
        backgroundColor: C.activeBg,
        borderColor: C.activeBorder,
    },
    chipText: {
        fontSize: 12,
        color: C.text2,
        fontFamily: FONT.bodyMed,
    },
    chipTextActive: { color: C.orange, fontFamily: FONT.bodyBold },

    // Hirer cards
    hirerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(18,16,24,0.5)',
        borderWidth: 1,
        borderColor: C.border,
    },
    hirerCardActive: {
        backgroundColor: C.activeBg,
        borderColor: C.activeBorder,
    },
    hirerIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    hirerIconActive: {
        backgroundColor: C.orange,
    },
    hirerLabel: {
        fontSize: 14,
        color: C.text,
        fontFamily: FONT.bodySemi,
    },
    hirerLabelActive: { color: C.text },
    hirerSub: {
        fontSize: 11,
        color: C.text3,
        fontFamily: FONT.body,
        marginTop: 2,
    },

    // Error
    errorBox: {
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(239,68,68,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.25)',
    },
    errorText: {
        fontSize: 12,
        color: '#FCA5A5',
        fontFamily: FONT.bodyMed,
    },

    // Footer CTA
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 22,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.04)',
        backgroundColor: C.bg,
    },
    skipBtn: {
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    skipBtnText: {
        fontSize: 13,
        color: C.text2,
        fontFamily: FONT.bodyBold,
        letterSpacing: 0.5,
    },
    ctaBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 52,
        borderRadius: 14,
    },
    ctaText: {
        fontSize: 14,
        fontFamily: FONT.bodyBold,
        color: '#fff',
        letterSpacing: 0.5,
    },

    // Completion
    completionRing: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
        marginBottom: 24,
    },
    completionRingInner: {
        width: '100%',
        height: '100%',
        borderRadius: 48,
        backgroundColor: C.bg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    completionHeadline: {
        fontSize: 30,
        color: C.text,
        fontFamily: FONT.serif,
        letterSpacing: -0.6,
        marginBottom: 10,
        textAlign: 'center',
    },
    completionSub: {
        fontSize: 14,
        color: C.text2,
        fontFamily: FONT.body,
        lineHeight: 20,
        textAlign: 'center',
        maxWidth: 300,
        marginBottom: 28,
    },
    completionCta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 14,
    },
    completionCtaText: {
        fontSize: 14,
        fontFamily: FONT.bodyBold,
        color: '#fff',
        letterSpacing: 0.5,
    },
});
