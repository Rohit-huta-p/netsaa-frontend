// app/(auth)/register.tsx — Multi-step registration (orchestration only)
import React, { useState, useRef, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, Animated, Platform, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    Sparkles, Mic2, Calendar, Instagram, ChevronLeft, ArrowRight,
    MapPin, Check, Building2, Globe, Phone, Mail, User, Receipt,
    Youtube, Music2, Headphones, HelpCircle, PenLine,
} from "lucide-react-native";
import { TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import useAuthStore from "@/stores/authStore";
import { useRegister, useCheckEmail, useCheckPhone } from "@/hooks/useAuthQueries";
import type { Role, Intent, ExperienceLevel, OrganizerTypeCategory } from "@/schemas/register.schema";

// Extracted modules
import {
    INTENT_OPTIONS, ARTIST_TYPES, EXP_LEVELS, ORG_TYPE_CATEGORIES,
    ARTIST_STEPS, ORGANIZER_STEPS,
} from "@/constants/registration";
import { Colors } from "@/constants/Colors";
const C = Colors.auth;
import { StepInput, LargeRoleCard, IntentCard, TypeChip, ExpCard, CountryCodePicker } from "@/components/auth";

/* ════════════════════════════════════════════════════ */
/*  MAIN SCREEN                                        */
/* ════════════════════════════════════════════════════ */

export default function RegisterScreen() {
    const routeParams = useLocalSearchParams<{ phone?: string; email?: string }>();
    const registerMutation = useRegister();
    const checkEmailMutation = useCheckEmail();
    const checkPhoneMutation = useCheckPhone();

    /* ── Step state ── */
    const [step, setStep] = useState(0);
    const [stepError, setStepError] = useState<string | null>(null);

    /* ── Shared field state ── */
    const [role, setRole] = useState<Role | null>(null);
    const [fullName, setFullName] = useState("");
    const [location, setLocation] = useState("");
    const [email, setEmail] = useState(routeParams.email ?? "");
    const [countryCode, setCountryCode] = useState(() => {
        // Pre-fill from route params if phone was passed from OTP verification
        if (routeParams.phone) {
            const p = routeParams.phone;
            // Extract country code (starts with +, followed by 1-3 digits)
            const match = p.match(/^(\+\d{1,3})(.*)$/);
            return match ? match[1] : '+91';
        }
        return '+91';
    });
    const [phone, setPhone] = useState(() => {
        if (routeParams.phone) {
            const p = routeParams.phone;
            const match = p.match(/^\+\d{1,3}(.*)$/);
            return match ? match[1].replace(/[^0-9]/g, '') : '';
        }
        return '';
    });
    const [password, setPassword] = useState("");
    const [intent, setIntent] = useState<Intent[]>([]);
    const [instagram, setInstagram] = useState("");
    const [youtube, setYoutube] = useState("");
    const [spotify, setSpotify] = useState("");
    const [soundcloud, setSoundcloud] = useState("");

    /* ── Artist-specific state ── */
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [expLevel, setExpLevel] = useState<ExperienceLevel | null>(null);
    const [marketingConsent, setMarketingConsent] = useState(false);

    /* ── Organizer-specific state ── */
    const [organizerTypeCategory, setOrganizerTypeCategory] = useState<OrganizerTypeCategory | null>(null);
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [customCategoryLabel, setCustomCategoryLabel] = useState("");
    const [organizationName, setOrganizationName] = useState("");
    const [organizationWebsite, setOrganizationWebsite] = useState("");
    const [legalBusinessName, setLegalBusinessName] = useState("");
    const [gstNumber, setGstNumber] = useState("");
    const [billingAddress, setBillingAddress] = useState("");
    const [billingState, setBillingState] = useState("");
    const [pincode, setPincode] = useState("");
    const [country, setCountry] = useState("");

    /* ── Derived: is this an individual organizer? ── */
    const isIndividual = organizerTypeCategory === 'individual';

    /* ── Derived ── */
    const isOrganizer = role === 'organizer';
    const isArtist = role === 'artist';

    const steps = useMemo(() => {
        if (!isOrganizer) return ARTIST_STEPS;
        if (isIndividual) {
            // Individuals skip orgProfile (no org name/website) and billing
            return ORGANIZER_STEPS.filter(s => s !== 'orgProfile' && s !== 'billing');
        }
        return ORGANIZER_STEPS;
    }, [isOrganizer, isIndividual]);

    const totalDataSteps = steps.length;
    const completionStep = totalDataSteps;
    const currentStepId = step < totalDataSteps ? steps[step] : 'completion';

    const progress = Math.min((step + 1) / totalDataSteps, 1);
    const showBack = step > 0 && step < completionStep;
    const isLastDataStep = step === totalDataSteps - 1;
    const ctaLabel = isLastDataStep ? "Create Account" : step === completionStep ? "Let's go!" : "Continue";

    const showSkip = useMemo(() => {
        if (currentStepId === 'social') return true;
        if (currentStepId === 'experience') return true;
        if (currentStepId === 'billing') return true;
        return false;
    }, [currentStepId]);

    /* ── Animation ── */
    const slideX = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const animateToStep = useCallback((newStep: number) => {
        const dir = newStep > step ? 1 : -1;
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
            Animated.timing(slideX, { toValue: dir * -180, duration: 120, useNativeDriver: true }),
        ]).start(() => {
            setStep(newStep);
            slideX.setValue(dir * 180);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.spring(slideX, { toValue: 0, stiffness: 300, damping: 30, mass: 1, useNativeDriver: true }),
            ]).start();
        });
    }, [step, fadeAnim, slideX]);

    /* ── Per-step validation ── */
    const validateStep = (): string | null => {
        switch (currentStepId) {
            case 'role':
                return !role ? "Choose your role to continue" : null;
            case 'identity':
                if (!fullName.trim() || fullName.trim().length < 2) return "Name must be at least 2 characters";
                if (!location.trim() || location.trim().length < 2) return "Location is required";
                return null;
            case 'credentials':
                if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return "Please enter a valid email";
                if (!phone.trim() || phone.trim().length < 10) return "Phone number must be at least 10 digits";
                if (password.length < 8) return "Password must be at least 8 characters";
                return null;
            case 'intent':
                return intent.length === 0 ? "Please select at least one intent" : null;
            case 'artistCategory':
                return selectedTypes.length === 0 ? "Please select at least one category" : null;
            case 'experience':
                return null;
            case 'social': {
                const socialErrors: string[] = [];
                if (instagram.trim() && !/^@?[\w]([\w.]){0,29}$/.test(instagram.trim())) {
                    socialErrors.push('Enter a valid Instagram handle');
                }
                if (youtube.trim() && !/(?:youtube\.com|youtu\.be)\/|^@[\w.-]+$/.test(youtube.trim())) {
                    socialErrors.push('Enter a valid YouTube URL or @handle');
                }
                if (spotify.trim() && !/open\.spotify\.com\/artist\//.test(spotify.trim())) {
                    socialErrors.push('Enter a valid Spotify artist URL');
                }
                if (soundcloud.trim() && !/soundcloud\.com\//.test(soundcloud.trim())) {
                    socialErrors.push('Enter a valid SoundCloud URL');
                }
                return socialErrors.length > 0 ? socialErrors[0] : null;
            }
            case 'orgTypeCategory':
                if (isCustomCategory) {
                    return !customCategoryLabel.trim() ? "Please enter your category" : null;
                }
                return !organizerTypeCategory ? "Please select your organizer type" : null;
            case 'orgProfile':
                // Individual skips this step entirely; for others, org name required
                if (!isIndividual && (!organizationName.trim() || organizationName.trim().length < 2)) {
                    return "Organization name is required";
                }
                return null;
                return null;
            case 'billing':
                // Optional now, validation only if fields are partially filled if we wanted strictly consistent data, 
                // but for now, if they enter something it should be valid, or if they skip it's fine.
                // However, the prompt asked to make it fully optional.
                // If they enter a business name but no GST, that might be okay depending on rules, 
                // but let's keep it simple: if they don't skip, we might still want to clear errors if they are empty
                // actually, validateStep is called on Next. If they skip, this isn't called with strict checks.
                // If they don't skip (click Next), we should probably still validate if they entered *something*.
                // For now, let's assume if they click Next without skipping, they might intend to fill it.
                // But the requirement says "keep the Business Billing Details step fully optional".
                // So I will loosen the validation here. 
                // However, if they type in Legal Business Name, they probably should fill other required fields for a business.
                // But let's return null to allow "Next" to act as optional too, or at least rely on the Skip button.
                // Actually, if they use the 'Skip' button, handleNext(true) is called.
                // If they click 'Continue' (handleNext(false)), we might want to enforce data if they started typing?
                // For safety, legal business name is required only if organizerTypeCategory !== 'individual' AND they didn't skip.
                // But wait, if they click Continue, they might expect it to save what they wrote.
                // If they leave it empty and click Continue, it should act like Skip? 
                // Let's enforce validation ONLY if they have typed something, OR if they are non-individual and didn't explicitly skip?
                // The prompt says "whichever page is optional, add a good kind of large not too large visible skip".
                // So if they want to skip, they should click skip. If they click Continue, maybe they want validation?
                // Let's stick to the existing logic for non-individuals but relying on the Skip button to bypass it.
                // Wait, if I return an error here, handleNext(false) will block.
                // So for 'billing', if it's optional, maybe we should just return null? 
                // But then 'Continue' allows empty strings. 
                // The prompt says "keep fully optional". So returning null is safest.
                return null;
            default:
                return null;
        }
    };

    /* ── Navigation ── */
    const handleNext = useCallback((skip = false) => {
        if (!skip) {
            const error = validateStep();
            if (error) { setStepError(error); return; }
        }
        setStepError(null);

        const proceed = () => {
            if (isLastDataStep) {
                submitRegistration(skip);
                return;
            }
            animateToStep(step + 1);
        };

        // If we are currently on the credentials step AND we are moving forward without skipping,
        // we should verify the email and phone are currently available on the backend
        if (currentStepId === 'credentials' && !skip) {
            const formattedPhone = `${countryCode}${phone.replace(/[^0-9]/g, '')}`;

            Promise.all([
                checkEmailMutation.mutateAsync({ email }),
                checkPhoneMutation.mutateAsync({ phone: formattedPhone })
            ]).then(([emailData, phoneData]) => {
                if (emailData.exists) {
                    setStepError("This email is already registered.");
                } else if (phoneData.exists) {
                    setStepError("This phone number is already registered.");
                } else {
                    proceed();
                }
            }).catch(() => {
                setStepError("Could not verify details. Please try again later.");
            });
        } else {
            proceed();
        }
    }, [step, role, fullName, location, email, countryCode, phone, password, intent, selectedTypes,
        youtube, spotify, soundcloud,
        organizerTypeCategory, organizationName,
        legalBusinessName, isLastDataStep]);

    const handleBack = () => {
        if (step > 0 && step < completionStep) {
            setStepError(null);
            animateToStep(step - 1);
        }
    };

    /* ── Submission ── */
    const submitRegistration = (skipSocial = false) => {
        const formattedPhone = `${countryCode}${phone.replace(/[^0-9]/g, '')}`;

        if (isOrganizer) {
            const payload: any = {
                user: {
                    displayName: fullName, email, password,
                    phoneNumber: formattedPhone, role: 'organizer',
                    marketingConsent,
                },
                organizerProfile: {
                    organizerTypeCategory: organizerTypeCategory!,
                    organizationType: isIndividual ? 'individual' : 'company',
                    organizationName: isIndividual ? undefined : (organizationName.trim() || undefined),
                    organizationWebsite: isIndividual ? undefined : (organizationWebsite.trim() || undefined),
                    isCustomCategory,
                    customCategoryLabel: isCustomCategory ? customCategoryLabel.trim() : undefined,
                    billingDetails: (!skipSocial && legalBusinessName.trim()) ? {
                        legalBusinessName: legalBusinessName.trim() || undefined,
                        gstNumber: gstNumber.trim() || undefined,
                        billingAddress: billingAddress.trim() || undefined,
                        state: billingState.trim() || undefined,
                        pincode: pincode.trim() || undefined,
                        country: country.trim() || undefined,
                    } : {},
                    intent: intent.length > 0 ? intent : undefined,
                },
            };
            if (!skipSocial) {
                if (instagram.trim()) payload.user.instagramHandle = instagram.trim().replace(/^@/, '');
                if (youtube.trim()) payload.user.youtubeUrl = youtube.trim();
                if (spotify.trim()) payload.user.spotifyUrl = spotify.trim();
                if (soundcloud.trim()) payload.user.soundcloudUrl = soundcloud.trim();
            }
            registerMutation.mutate(payload, {
                onSuccess: () => animateToStep(completionStep),
                onError: (err: any) => {
                    setStepError(err.response?.data?.msg || err.response?.data?.message || err.message || "Registration failed.");
                },
            });
        } else {
            const payload: any = {
                user: {
                    displayName: fullName, email, password,
                    phoneNumber: formattedPhone, role: 'artist',
                    marketingConsent,
                },
            };
            if (intent.length > 0) payload.user.intent = intent;
            if (expLevel) payload.user.experienceLevel = expLevel;
            if (!skipSocial) {
                if (instagram.trim()) payload.user.instagramHandle = instagram.trim().replace(/^@/, '');
                if (youtube.trim()) payload.user.youtubeUrl = youtube.trim();
                if (spotify.trim()) payload.user.spotifyUrl = spotify.trim();
                if (soundcloud.trim()) payload.user.soundcloudUrl = soundcloud.trim();
            }
            if (selectedTypes.length > 0) payload.user.artistType = selectedTypes;

            registerMutation.mutate(payload, {
                onSuccess: () => animateToStep(completionStep),
                onError: (err: any) => {
                    setStepError(err.response?.data?.msg || err.response?.data?.message || err.message || "Registration failed.");
                },
            });
        }
    };

    const navigateAway = () => {
        const { user } = useAuthStore.getState();
        if (user?.roles?.includes("organizer") || role === "organizer") {
            router.replace("/(app)/dashboard");
        } else {
            router.replace("/(app)/gigs");
        }
    };

    /* ── Toggle helpers ── */
    const toggleIntent = (id: Intent) => {
        setIntent(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
        setStepError(null);
    };
    const toggleType = (t: string) => {
        setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
        setStepError(null);
    };

    /* ── Category selection with state reset ── */
    const selectOrgCategory = (catId: OrganizerTypeCategory) => {
        setOrganizerTypeCategory(catId);
        setIsCustomCategory(false);
        setCustomCategoryLabel("");
        // Reset org-specific fields when switching categories
        setOrganizationName("");
        setOrganizationWebsite("");
        setLegalBusinessName("");
        setGstNumber("");
        setBillingAddress("");
        setBillingState("");
        setPincode("");
        setCountry("");
        setStepError(null);
    };

    const selectCustomCategory = () => {
        setOrganizerTypeCategory('individual');  // fallback enum for backend
        setIsCustomCategory(true);
        setCustomCategoryLabel("");
        setOrganizationName("");
        setOrganizationWebsite("");
        setStepError(null);
    };


    /* ════════════════════════════════════════════════ */
    /*  STEP RENDERERS                                 */
    /* ════════════════════════════════════════════════ */

    const renderStep = () => {
        switch (currentStepId) {
            /* ── SHARED ── */
            case 'role':
                return (
                    <View>
                        <Text style={{ fontSize: 28, fontWeight: '800', color: C.w95, lineHeight: 36 }}>
                            Choose your path on NETSA
                        </Text>
                        <Text style={{ fontSize: 14, color: C.w30, marginTop: 8, marginBottom: 32 }}>
                            Choose your role to get started.
                        </Text>
                        <View style={{ gap: 12 }}>
                            <LargeRoleCard icon={Mic2} title="Artist" subtitle="Perform & get discovered"
                                selected={role === 'artist'} onPress={() => { setRole('artist'); setStepError(null); }} />
                            <LargeRoleCard icon={Calendar} title="Organizer" subtitle="Discover & hire talent"
                                selected={role === 'organizer'} onPress={() => { setRole('organizer'); setStepError(null); }} />
                        </View>
                    </View>
                );

            case 'identity':
                return (
                    <View>
                        <Text style={{ fontSize: 28, fontWeight: '800', color: C.w95, lineHeight: 36 }}>
                            How should people{'\n'}recognize you?
                        </Text>
                        <Text style={{ fontSize: 14, color: C.w30, marginTop: 8, marginBottom: 32 }}>
                            This is how you'll appear on NETSA.
                        </Text>
                        <StepInput label="Full Name" value={fullName} onChangeText={(v) => { setFullName(v); setStepError(null); }}
                            placeholder="Your name or stage name" autoCapitalize="words" />
                        <StepInput label="Location" value={location} onChangeText={(v) => { setLocation(v); setStepError(null); }}
                            placeholder="e.g. Mumbai, Delhi, Bangalore"
                            icon={<MapPin size={16} color={C.w25} />} />
                    </View>
                );

            case 'credentials':
                return (
                    <View>
                        <Text style={{ fontSize: 28, fontWeight: '800', color: C.w95, lineHeight: 36 }}>
                            How do we secure{'\n'}your account?
                        </Text>
                        <Text style={{ fontSize: 14, color: C.w30, marginTop: 8, marginBottom: 32 }}>
                            We'll keep your info safe.
                        </Text>
                        <StepInput label="Email" value={email} onChangeText={(v) => { setEmail(v); setStepError(null); }}
                            placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" />
                        <StepInput
                            label="Phone Number"
                            value={phone}
                            onChangeText={(v) => { setPhone(v.replace(/[^0-9]/g, '')); setStepError(null); }}
                            placeholder="9876543210"
                            keyboardType="phone-pad"
                            prefix={<CountryCodePicker selectedCode={countryCode} onSelect={setCountryCode} />}
                        />
                        <StepInput label="Password" value={password} onChangeText={(v) => { setPassword(v); setStepError(null); }}
                            placeholder="Min 8 characters" secureTextEntry />
                    </View>
                );

            case 'intent':
                return (
                    <View>
                        <Text style={{ fontSize: 28, fontWeight: '800', color: C.w95, lineHeight: 36 }}>
                            What brings you{'\n'}to NETSA?
                        </Text>
                        <Text style={{ fontSize: 14, color: C.w30, marginTop: 8, marginBottom: 32 }}>
                            Pick as many as you like.
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
                            {INTENT_OPTIONS.map((opt) => (
                                <IntentCard key={opt.id} icon={opt.icon} label={opt.label}
                                    selected={intent.includes(opt.id)} onPress={() => toggleIntent(opt.id)} />
                            ))}
                        </View>
                    </View>
                );

            case 'social':
                return (
                    <View style={{ gap: 4 }}>
                        <Text style={{ fontSize: 24, fontWeight: '800', color: C.w95, lineHeight: 32 }}>
                            Want to add credibility?
                        </Text>
                        <Text style={{ fontSize: 13, color: C.w30, marginTop: 4, marginBottom: 18 }}>
                            Your social links help build trust with others.{'\n'}
                            <Text style={{ color: C.w15 }}>All fields are optional.</Text>
                        </Text>
                        <StepInput label="Instagram Handle" value={instagram} onChangeText={setInstagram}
                            placeholder="@yourhandle" autoCapitalize="none"
                            icon={<Instagram size={15} color={C.w25} />} />
                        <StepInput label="YouTube" value={youtube} onChangeText={setYoutube}
                            placeholder="your channel URL" autoCapitalize="none"
                            icon={<Youtube size={15} color={C.w25} />} />
                        <StepInput label="Spotify" value={spotify} onChangeText={setSpotify}
                            placeholder="artist URL" autoCapitalize="none"
                            icon={<Music2 size={15} color={C.w25} />} />
                        <StepInput label="SoundCloud" value={soundcloud} onChangeText={setSoundcloud}
                            placeholder="profile URL" autoCapitalize="none"
                            icon={<Headphones size={15} color={C.w25} />} />
                    </View>
                );

            /* ── ARTIST-ONLY ── */
            case 'artistCategory':
                return (
                    <View>
                        <Text style={{ fontSize: 28, fontWeight: '800', color: C.w95, lineHeight: 36 }}>
                            Where do you{'\n'}belong?
                        </Text>
                        <Text style={{ fontSize: 14, color: C.w30, marginTop: 8, marginBottom: 32 }}>
                            Select all that apply.
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {ARTIST_TYPES.map((t) => (
                                <TypeChip key={t} label={t} selected={selectedTypes.includes(t)}
                                    onPress={() => toggleType(t)} />
                            ))}
                        </View>
                    </View>
                );

            case 'experience':
                return (
                    <View>
                        <Text style={{ fontSize: 28, fontWeight: '800', color: C.w95, lineHeight: 36 }}>
                            Where are you in{'\n'}your journey?
                        </Text>
                        <Text style={{ fontSize: 14, color: C.w30, marginTop: 8, marginBottom: 32 }}>
                            No pressure — this helps us curate your feed.
                        </Text>
                        <View style={{ gap: 10 }}>
                            {EXP_LEVELS.map((l) => (
                                <ExpCard key={l.id} label={l.label} sub={l.sub}
                                    selected={expLevel === l.id} onPress={() => setExpLevel(l.id)} />
                            ))}
                        </View>
                    </View>
                );

            /* ── ORGANIZER-ONLY ── */
            case 'orgTypeCategory':
                return (
                    <View>
                        <Text style={{ fontSize: 28, fontWeight: '800', color: C.w95, lineHeight: 36 }}>
                            What kind of{'\n'}organizer are you?
                        </Text>
                        <Text style={{ fontSize: 14, color: C.w30, marginTop: 8, marginBottom: 24 }}>
                            This helps us tailor your experience.
                        </Text>
                        <View style={{ gap: 8 }}>
                            {ORG_TYPE_CATEGORIES.map((cat) => {
                                const Icon = cat.icon;
                                const sel = !isCustomCategory && organizerTypeCategory === cat.id;
                                return (
                                    <TouchableOpacity key={cat.id} activeOpacity={0.7}
                                        onPress={() => selectOrgCategory(cat.id)}
                                        style={{
                                            flexDirection: 'row', alignItems: 'center', gap: 12,
                                            paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14,
                                            borderWidth: 1, borderColor: sel ? C.activeB : C.w08,
                                            backgroundColor: sel ? C.activeBg : C.w03,
                                        }}>
                                        <View style={{
                                            width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                                            backgroundColor: sel ? C.primary : C.w06,
                                        }}>
                                            <Icon size={16} color={sel ? '#fff' : C.w30} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 15, fontWeight: '600', color: sel ? C.primary : C.w60 }}>{cat.label}</Text>
                                            <Text style={{ fontSize: 11, color: sel ? C.w50 : C.w25, marginTop: 1 }}>{cat.sub}</Text>
                                        </View>
                                        {sel && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary }} />}
                                    </TouchableOpacity>
                                );
                            })}

                            {/* ── "None of the above?" option ── */}
                            <TouchableOpacity activeOpacity={0.7}
                                onPress={selectCustomCategory}
                                style={{
                                    flexDirection: 'row', alignItems: 'center', gap: 12,
                                    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14,
                                    borderWidth: 1,
                                    borderColor: isCustomCategory ? 'rgba(251,191,36,0.5)' : C.w08,
                                    backgroundColor: isCustomCategory ? 'rgba(251,191,36,0.08)' : C.w03,
                                    borderStyle: 'dashed',
                                }}>
                                <View style={{
                                    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                                    backgroundColor: isCustomCategory ? 'rgba(251,191,36,0.15)' : C.w06,
                                }}>
                                    <HelpCircle size={16} color={isCustomCategory ? '#FBBF24' : C.w30} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: isCustomCategory ? '#FBBF24' : C.w60 }}>None of the above?</Text>
                                    <Text style={{ fontSize: 11, color: isCustomCategory ? C.w50 : C.w25, marginTop: 1 }}>Tell us what you do</Text>
                                </View>
                                {isCustomCategory && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FBBF24' }} />}
                            </TouchableOpacity>

                            {/* Custom category text input */}
                            {isCustomCategory && (
                                <View style={{ marginTop: 8 }}>
                                    <View style={{
                                        flexDirection: 'row', alignItems: 'center', gap: 10,
                                        borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)',
                                        backgroundColor: 'rgba(251,191,36,0.05)',
                                        borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
                                    }}>
                                        <PenLine size={16} color="#FBBF24" />
                                        <TextInput
                                            value={customCategoryLabel}
                                            onChangeText={(v) => { setCustomCategoryLabel(v); setStepError(null); }}
                                            placeholder="e.g. Wedding Planner, Promoter..."
                                            placeholderTextColor={C.w25}
                                            style={{
                                                flex: 1, color: '#fff', fontSize: 15, fontWeight: '500',
                                                outlineStyle: 'none',
                                            } as any}
                                            autoCapitalize="words"
                                        />
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                );

            case 'orgProfile':
                // This step is skipped entirely for 'individual' via the steps filter
                return (
                    <View>
                        <Text style={{ fontSize: 28, fontWeight: '800', color: C.w95, lineHeight: 36 }}>
                            Tell us about{'\n'}your organization
                        </Text>
                        <Text style={{ fontSize: 14, color: C.w30, marginTop: 8, marginBottom: 32 }}>
                            This will appear on your public profile.
                        </Text>
                        <StepInput label="Organization Name" value={organizationName}
                            onChangeText={(v) => { setOrganizationName(v); setStepError(null); }}
                            placeholder="e.g. Starlight Events"
                            icon={<Building2 size={16} color={C.w25} />} />
                        <StepInput label="Website (optional)" value={organizationWebsite}
                            onChangeText={setOrganizationWebsite}
                            placeholder="https://yourwebsite.com" autoCapitalize="none" keyboardType="url"
                            icon={<Globe size={16} color={C.w25} />} />
                    </View>
                );


            case 'billing':
                return (
                    <View>
                        <Text style={{ fontSize: 28, fontWeight: '800', color: C.w95, lineHeight: 36 }}>
                            Business billing{'\n'}details
                        </Text>
                        <Text style={{ fontSize: 14, color: C.w30, marginTop: 8, marginBottom: 32 }}>
                            Required for invoicing and compliance.
                        </Text>
                        <StepInput label="Legal Business Name" value={legalBusinessName}
                            onChangeText={(v) => { setLegalBusinessName(v); setStepError(null); }}
                            placeholder="Registered business name"
                            icon={<Building2 size={16} color={C.w25} />} />
                        <StepInput label="GST Number (optional)" value={gstNumber}
                            onChangeText={setGstNumber}
                            placeholder="22AAAAA0000A1Z5" autoCapitalize="characters"
                            icon={<Receipt size={16} color={C.w25} />} />
                        <StepInput label="Billing Address (optional)" value={billingAddress}
                            onChangeText={setBillingAddress} placeholder="Street address" />
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <StepInput label="State" value={billingState}
                                    onChangeText={setBillingState} placeholder="State" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <StepInput label="Pincode" value={pincode}
                                    onChangeText={setPincode} placeholder="560001" keyboardType="number-pad" />
                            </View>
                        </View>
                    </View>
                );

            /* ── COMPLETION ── */
            default:
                return (
                    <View style={{ alignItems: 'center' }}>
                        <LinearGradient
                            colors={[C.primary, C.secondary]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={{
                                width: 80, height: 80, borderRadius: 40,
                                alignItems: 'center', justifyContent: 'center', marginBottom: 24,
                            }}>
                            <Check size={40} color="#fff" strokeWidth={3} />
                        </LinearGradient>
                        <Text style={{ fontSize: 28, fontWeight: '800', color: C.w95, textAlign: 'center' }}>
                            Your stage is ready.
                        </Text>
                        <Text style={{ fontSize: 14, color: C.w30, marginTop: 12, textAlign: 'center', maxWidth: 280 }}>
                            {isArtist
                                ? "Time to get discovered by top organizers."
                                : "Start finding the perfect talent for your events."}
                        </Text>
                    </View>
                );
        }
    };

    /* ════════════════════════════════════════════════ */
    /*  RENDER                                         */
    /* ════════════════════════════════════════════════ */

    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            <SafeAreaView style={{ flex: 1 }}>
                {/* ═══ HEADER ═══ */}
                <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16, marginTop: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        {showBack ? (
                            <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={{
                                width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: C.w10,
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <ChevronLeft size={16} color={C.w40} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={{
                                    width: 32, height: 32, borderRadius: 10, backgroundColor: C.w06,
                                    borderWidth: 1, borderColor: C.w10, alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Sparkles size={14} color={C.primary} />
                                </View>
                                <Text style={{ fontSize: 18, fontWeight: '700', letterSpacing: -1, color: C.w80 }}>
                                    NETSA
                                </Text>
                            </TouchableOpacity>
                        )}
                        {step < completionStep && (
                            <Text style={{ fontSize: 12, fontWeight: '500', color: C.w25 }}>
                                {step + 1} of {totalDataSteps}
                            </Text>
                        )}
                    </View>
                    <View style={{ height: 3, backgroundColor: C.w08, borderRadius: 2, overflow: 'hidden' }}>
                        <LinearGradient
                            colors={[C.primary, C.secondary]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={{ height: '100%', width: `${progress * 100}%`, borderRadius: 2 }}
                        />
                    </View>
                </View>

                {/* ═══ ANIMATED CONTENT ═══ */}
                <Animated.View style={{
                    flex: 1, paddingHorizontal: 24,
                    opacity: fadeAnim, transform: [{ translateX: slideX }],
                }}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 20 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {renderStep()}
                    </ScrollView>
                </Animated.View>

                {/* ═══ CTA AREA ═══ */}
                <View style={{ paddingHorizontal: 24, paddingBottom: Platform.OS === 'android' ? 24 : 0, marginBottom: 44 }}>

                    {/* Marketing consent — shown only on the final step, above submit */}
                    {isLastDataStep && (
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setMarketingConsent(v => !v)}
                            style={{
                                flexDirection: 'row', alignItems: 'flex-start', gap: 10,
                                marginBottom: 16,
                                paddingVertical: 12, paddingHorizontal: 12,
                                borderRadius: 12, borderWidth: 1,
                                borderColor: marketingConsent ? C.activeB : C.w08,
                                backgroundColor: marketingConsent ? C.activeBg : C.w03,
                            }}
                        >
                            {/* Checkbox */}
                            <View style={{
                                width: 18, height: 18, borderRadius: 6, marginTop: 1,
                                borderWidth: 1.5,
                                borderColor: marketingConsent ? C.primary : C.w30,
                                backgroundColor: marketingConsent ? C.primary : 'transparent',
                                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                {marketingConsent && <Check size={12} color="#fff" strokeWidth={3} />}
                            </View>

                            {/* Text block */}
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 12, color: C.w60, lineHeight: 17 }}>
                                    I agree to receive updates, opportunities, and announcements from NETSA.
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    {stepError && (
                        <View style={{
                            backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1,
                            borderColor: 'rgba(239,68,68,0.25)', borderRadius: 12,
                            paddingVertical: 10, paddingHorizontal: 14, marginBottom: 12,
                        }}>
                            <Text style={{ color: '#fca5a5', fontSize: 13, textAlign: 'center' }}>{stepError}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={() => step === completionStep ? navigateAway() : handleNext()}
                        activeOpacity={0.85}
                        disabled={registerMutation.isPending}
                        style={{ borderRadius: 16, overflow: 'hidden', opacity: registerMutation.isPending ? 0.6 : 1 }}
                    >
                        <LinearGradient
                            colors={[C.primary, C.secondary]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={{ height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
                                {registerMutation.isPending ? "Creating account..." : ctaLabel}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {showSkip && (
                        <TouchableOpacity onPress={() => handleNext(true)} activeOpacity={0.7}
                            style={{
                                marginTop: 14, alignItems: 'center', justifyContent: 'center',
                                paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: C.w10
                            }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: C.w50 }}>
                                Skip (I'll do this later)
                            </Text>
                        </TouchableOpacity>
                    )}



                    {step === 0 && (
                        <TouchableOpacity onPress={() => router.push("/(auth)/login")}
                            style={{ marginTop: 20, alignItems: 'center' }}>
                            <Text style={{ fontSize: 12, color: C.w25 }}>
                                Already have an account?{' '}
                                <Text style={{ fontWeight: '600', color: C.primary }}>Sign In</Text>
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}