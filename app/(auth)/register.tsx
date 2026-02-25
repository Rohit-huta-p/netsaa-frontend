// app/(auth)/register.tsx — Multi-step registration (orchestration only)
import React, { useState, useRef, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, Animated, Platform } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    Sparkles, Mic2, Calendar, Instagram, ChevronLeft, ArrowRight,
    MapPin, Check, Building2, Globe, Phone, Mail, User, Receipt,
    Youtube, Music2, Headphones,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import useAuthStore from "@/stores/authStore";
import { useRegister } from "@/hooks/useAuthQueries";
import type { Role, Intent, ExperienceLevel, OrganizerTypeCategory } from "@/schemas/register.schema";

// Extracted modules
import {
    REG_COLORS as C,
    INTENT_OPTIONS, ARTIST_TYPES, EXP_LEVELS, ORG_TYPE_CATEGORIES,
    ARTIST_STEPS, ORGANIZER_STEPS,
} from "@/constants/registration";
import { StepInput, LargeRoleCard, IntentCard, TypeChip, ExpCard } from "@/components/auth";

/* ════════════════════════════════════════════════════ */
/*  MAIN SCREEN                                        */
/* ════════════════════════════════════════════════════ */

export default function RegisterScreen() {
    const registerMutation = useRegister();

    /* ── Step state ── */
    const [step, setStep] = useState(0);
    const [stepError, setStepError] = useState<string | null>(null);

    /* ── Shared field state ── */
    const [role, setRole] = useState<Role | null>(null);
    const [fullName, setFullName] = useState("");
    const [location, setLocation] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [intent, setIntent] = useState<Intent[]>([]);
    const [instagram, setInstagram] = useState("");
    const [youtube, setYoutube] = useState("");
    const [spotify, setSpotify] = useState("");
    const [soundcloud, setSoundcloud] = useState("");

    /* ── Artist-specific state ── */
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [expLevel, setExpLevel] = useState<ExperienceLevel | null>(null);

    /* ── Organizer-specific state ── */
    const [organizerTypeCategory, setOrganizerTypeCategory] = useState<OrganizerTypeCategory | null>(null);
    const [organizationName, setOrganizationName] = useState("");
    const [organizationWebsite, setOrganizationWebsite] = useState("");
    const [primaryContactName, setPrimaryContactName] = useState("");
    const [primaryContactPhone, setPrimaryContactPhone] = useState("");
    const [primaryContactEmail, setPrimaryContactEmail] = useState("");
    const [legalBusinessName, setLegalBusinessName] = useState("");
    const [gstNumber, setGstNumber] = useState("");
    const [billingAddress, setBillingAddress] = useState("");
    const [billingState, setBillingState] = useState("");
    const [pincode, setPincode] = useState("");
    const [country, setCountry] = useState("");

    /* ── Derived ── */
    const isOrganizer = role === 'organizer';
    const isArtist = role === 'artist';

    const steps = useMemo(() => {
        if (!isOrganizer) return ARTIST_STEPS;
        if (organizerTypeCategory === 'individual') {
            return ORGANIZER_STEPS.filter(s => s !== 'billing');
        }
        return ORGANIZER_STEPS;
    }, [isOrganizer, organizerTypeCategory]);

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
                return !organizerTypeCategory ? "Please select your organizer type" : null;
            case 'orgProfile':
                if (!organizationName.trim() || organizationName.trim().length < 2) return "Organization name is required";
                return null;
            case 'primaryContact':
                if (!primaryContactName.trim()) return "Contact name is required";
                if (!primaryContactPhone.trim() || primaryContactPhone.trim().length < 10) return "Valid phone number is required";
                if (!primaryContactEmail.trim() || !/\S+@\S+\.\S+/.test(primaryContactEmail)) return "Valid email is required";
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

        if (isLastDataStep) {
            submitRegistration(skip);
            return;
        }
        animateToStep(step + 1);
    }, [step, role, fullName, location, email, phone, password, intent, selectedTypes,
        youtube, spotify, soundcloud,
        organizerTypeCategory, organizationName, primaryContactName, primaryContactPhone,
        primaryContactEmail, legalBusinessName, isLastDataStep]);

    const handleBack = () => {
        if (step > 0 && step < completionStep) {
            setStepError(null);
            animateToStep(step - 1);
        }
    };

    /* ── Submission ── */
    const submitRegistration = (skipSocial = false) => {
        if (isOrganizer) {
            const payload: any = {
                user: {
                    displayName: fullName, email, password,
                    phoneNumber: phone, role: 'organizer',
                },
                organizerProfile: {
                    organizerTypeCategory, organizationName,
                    organizationWebsite: organizationWebsite.trim() || undefined,
                    primaryContact: {
                        fullName: primaryContactName,
                        phone: primaryContactPhone,
                        email: primaryContactEmail,
                    },
                    // Only include billing details if they provided at least a legal business name 
                    // or if we want to send what they have. 
                    // Since it's optional, we send it only if legalBusinessName is there? 
                    // Or if they didn't skip? 
                    // If they clicked Skip (skipSocial=true passed to submit? No, handleNext call submitRegistration(skip)).
                    // So if skip is true, we should probably ignore billing?
                    // Actually submitRegistration takes 'skipSocial' which acts as a generic 'skip' flag for the current step if it's the last one.
                    // If billing is the last step, 'skip' argument will be true.
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
                    phoneNumber: phone, role: 'artist',
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

    /* ── Helper for Primary Contact fill ── */
    const fillPrimaryContactFromIdentity = () => {
        setPrimaryContactName(fullName);
        setPrimaryContactPhone(phone);
        setPrimaryContactEmail(email);
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
                        <StepInput label="Phone Number" value={phone} onChangeText={(v) => { setPhone(v); setStepError(null); }}
                            placeholder="+91 98765 43210" keyboardType="phone-pad" />
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
                    <View>
                        <Text style={{ fontSize: 28, fontWeight: '800', color: C.w95, lineHeight: 36 }}>
                            Want to add{'\n'}credibility?
                        </Text>
                        <Text style={{ fontSize: 14, color: C.w30, marginTop: 8, marginBottom: 32 }}>
                            Your social links help build trust with others.{'\n'}
                            <Text style={{ color: C.w15 }}>All fields are optional.</Text>
                        </Text>
                        <StepInput label="Instagram Handle" value={instagram} onChangeText={setInstagram}
                            placeholder="@yourhandle" autoCapitalize="none"
                            icon={<Instagram size={16} color={C.w25} />} />
                        <StepInput label="YouTube" value={youtube} onChangeText={setYoutube}
                            placeholder="https://youtube.com/@yourchannel" autoCapitalize="none"
                            icon={<Youtube size={16} color={C.w25} />} />
                        <StepInput label="Spotify" value={spotify} onChangeText={setSpotify}
                            placeholder="https://open.spotify.com/artist/..." autoCapitalize="none"
                            icon={<Music2 size={16} color={C.w25} />} />
                        <StepInput label="SoundCloud" value={soundcloud} onChangeText={setSoundcloud}
                            placeholder="https://soundcloud.com/yourprofile" autoCapitalize="none"
                            icon={<Headphones size={16} color={C.w25} />} />
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
                                const sel = organizerTypeCategory === cat.id;
                                return (
                                    <TouchableOpacity key={cat.id} activeOpacity={0.7}
                                        onPress={() => { setOrganizerTypeCategory(cat.id); setStepError(null); }}
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
                        </View>
                    </View>
                );

            case 'orgProfile':
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

            case 'primaryContact':
                return (
                    <View>
                        <Text style={{ fontSize: 28, fontWeight: '800', color: C.w95, lineHeight: 36 }}>
                            Who should artists{'\n'}reach out to?
                        </Text>
                        <Text style={{ fontSize: 14, color: C.w30, marginTop: 8, marginBottom: 20 }}>
                            Primary contact for bookings & communication.
                        </Text>

                        <TouchableOpacity
                            onPress={fillPrimaryContactFromIdentity}
                            activeOpacity={0.7}
                            style={{
                                flexDirection: 'row', alignItems: 'center',
                                backgroundColor: C.w06, padding: 12, borderRadius: 12, marginBottom: 24,
                                borderWidth: 1, borderColor: C.w10
                            }}>
                            <View style={{ padding: 6, backgroundColor: C.w08, borderRadius: 8, marginRight: 12 }}>
                                <User size={16} color={C.primary} />
                            </View>
                            <Text style={{ fontSize: 14, color: C.primary, fontWeight: '600' }}>
                                Use my details (Same as Identity)
                            </Text>
                        </TouchableOpacity>

                        <StepInput label="Contact Name" value={primaryContactName}
                            onChangeText={(v) => { setPrimaryContactName(v); setStepError(null); }}
                            placeholder="Full name" autoCapitalize="words"
                            icon={<User size={16} color={C.w25} />} />
                        <StepInput label="Contact Phone" value={primaryContactPhone}
                            onChangeText={(v) => { setPrimaryContactPhone(v); setStepError(null); }}
                            placeholder="+91 98765 43210" keyboardType="phone-pad"
                            icon={<Phone size={16} color={C.w25} />} />
                        <StepInput label="Contact Email" value={primaryContactEmail}
                            onChangeText={(v) => { setPrimaryContactEmail(v); setStepError(null); }}
                            placeholder="contact@org.com" keyboardType="email-address" autoCapitalize="none"
                            icon={<Mail size={16} color={C.w25} />} />
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
                    flex: 1, justifyContent: 'center', paddingHorizontal: 24,
                    opacity: fadeAnim, transform: [{ translateX: slideX }],
                }}>
                    {renderStep()}
                </Animated.View>

                {/* ═══ CTA AREA ═══ */}
                <View style={{ paddingHorizontal: 24, paddingBottom: Platform.OS === 'android' ? 24 : 16, marginBottom: 64 }}>
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